var createCharm = require('charm')
var EventEmitter = require('events').EventEmitter
var through = require('through2')
var duplexer = require('duplexer2')
var wcstring = require('wcstring')
const color = require('color-convert')
const supportsColor = require('supports-color')

const keywordLookup = supportsColor.supportsColor().has256 ? color.keyword.ansi256 : color.keyword.ansi16
const KEYS = {
  up: /^(27.91.65|27.79.65|107|16)\b/, // up or k
  down: /^(27.91.66|27.79.66|106|14)\b/, // down or j
  enter: /^(13|10)\b/,
  close: /^(3|113)/ // ^C or q
}

function preparePadding (input) {
  if (typeof input === 'number') {
    return {
      left: input,
      right: input,
      top: input,
      bottom: input
    }
  }
  return input || {
    left: 2,
    right: 2,
    top: 1,
    bottom: 1
  }
}

module.exports = class Menu extends EventEmitter {
  constructor (opts) {
    super()
    if (!opts) {
      opts = {}
    }
    this.width = opts.width || 50
    this.x = opts.x || 1
    this.y = opts.y || 1
    this.init = { x: this.x, y: this.y }
    this.entries = []
    this.lines = {}
    this.selected = opts.selected || 0
    this.colors = {
      fg: typeof opts.fg === 'number' ? opts.fg : keywordLookup(opts.fg || 'white'),
      bg: typeof opts.bg === 'number' ? opts.bg : keywordLookup(opts.bg || 'blue')
    }

    this.padding = preparePadding(opts.padding)
    this.x += this.padding.left
    this.y += this.padding.top
    this.size = {
      x: this.width + this.padding.left + this.padding.right
    }

    this._input = through(
      (buf, _, next) => {
        this._ondata(buf)
        next()
      },
      () => { this.emit('close') }
    )
    this._output = through()
    this.charm = opts.charm || createCharm({
      input: this._input
    })
    this.charm.on('error', function () {})
    this.charm.pipe(this._output)

    this.stream = this.charm.pipe(through())
    try {
      this.charm.display('reset')
      this.charm.display('bright')
    } catch (e) {}

    process.nextTick(() => {
      this._ticked = true
      this.charm.cursor(false)
      this._draw()
    })
  }

  createStream () {
    return duplexer(this._input, this._output)
  }

  add (item, cb) {
    if (typeof item === 'string') {
      item = { label: item }
    }
    if (typeof cb === 'function') {
      item.handler = cb
    }
    if (typeof item.line !== 'string') {
      item.line = item.label
    }
    this.entries.push({
      x: this.x,
      y: this.y,
      item: item
    })
    this._fillLine(this.y)
    this.y++
  }

  _fillLine (y) {
    if (!this.lines[y]) {
      this.charm.position(this.init.x, y)
      this.charm.write(Array(1 + this.size.x).join(' '))
      this.lines[y] = true
    }
  }

  jump (label) {
    var index = typeof label === 'number'
      ? label
      : this.entries
        .findIndex(entry => entry.label === label)

    if (index < 0) return
    var prev = this.selected
    this.selected = index
    if (this._ticked) {
      this._drawRow(prev)
      this._drawRow(index)
    }
  }

  close () {
    this._input.end()
    this.charm.cursor(true)
    this.charm.display('reset')
    this.charm.position(1, this.y + 1)
    this.charm.end()
  }

  reset () {
    this.charm.reset()
  }

  write (msg) {
    this.charm.background(this.colors.bg)
    this.charm.foreground(this.colors.fg)
    this._fillLine(this.y)

    var parts = msg.split('\n')

    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length) {
        this.charm.position(this.x, this.y)
        this.charm.write(parts[i])
      }
      if (i !== parts.length - 1) {
        this.x = this.init.x + this.padding.left
        this._fillLine(this.y)
        this.y++
      }
    }
  }

  _draw () {
    for (let i = 0; i < this.padding.top; i++) {
      this._fillLine(this.init.y + i)
    }
    for (let i = 0; i < this.entries.length; i++) this._drawRow(i)

    // reset foreground and background colors
    this.charm.background(this.colors.bg)
    this.charm.foreground(this.colors.fg)

    for (let i = 0; i < this.padding.bottom; i++) {
      this._fillLine(this.y + i)
    }
  }

  _drawRow (index) {
    index = (index + this.entries.length) % this.entries.length
    const entry = this.entries[index]
    this.charm.position(entry.x, entry.y)

    if (this.selected === index) {
      this.charm.background(this.colors.fg)
      this.charm.foreground(this.colors.bg)
    } else {
      this.charm.background(this.colors.bg)
      this.charm.foreground(this.colors.fg)
    }

    var len = this.width - wcstring(entry.item.line).size() + 1

    this.charm.write(entry.item.line + Array(Math.max(0, len)).join(' '))
  }

  confirmSelection () {
    this.charm.position(1, this.entries[this.entries.length - 1].y + 2)
    this.charm.display('reset')
    const item = this.entries[this.selected].item
    if (typeof item.handler === 'function') {
      item.handler(item.label, this.selected, item)
    }
    this.emit('select', item.line, this.selected, item)
  }

  _ondata (buf) {
    var bytes = [].slice.call(buf)
    while (bytes.length) {
      var codes = [].join.call(bytes, '.')
      if (KEYS.up.test(codes)) {
        this.selected = (this.selected - 1 + this.entries.length) % this.entries.length

        this._drawRow(this.selected + 1)
        this._drawRow(this.selected)
        if (/^107\b/.test(codes)) bytes.shift()
        else bytes.splice(0, 3)
      } else if (KEYS.down.test(codes)) {
        this.selected = (this.selected + 1) % this.entries.length
        this._drawRow(this.selected - 1)
        this._drawRow(this.selected)
        if (/^106\b/.test(codes)) bytes.shift()
        else bytes.splice(0, 3)
      } else if (KEYS.close.test(codes)) {
        this.y = 0
        this.charm.reset()
        this.close()
        bytes.shift()
      } else if (KEYS.enter.test(codes)) {
        this.confirmSelection()
        bytes.shift()
      } else bytes.shift()
    }
  }
}
