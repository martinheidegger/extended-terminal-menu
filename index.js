var createCharm = require('charm');
var EventEmitter = require('events').EventEmitter;
var through = require('through2');
var duplexer = require('duplexer2');
var wcstring = require('wcstring');
const color = require('color-convert');
const supportsColor = require('supports-color');

module.exports = function (opts) {
    return new Menu(opts || {});
}

const keywordLookup = supportsColor.supportsColor().has256 ? color.keyword.ansi256 : color.keyword.ansi16;

class Menu extends EventEmitter {
    constructor (opts) {
        super()
        this.width = opts.width || 50;
        this.x = opts.x || 1;
        this.y = opts.y || 1;
        this.init = { x: this.x, y: this.y };
        this.items = [];
        this.lines = {};
        this.selected = opts.selected || 0;
        this.colors = {
            fg: typeof opts.fg === 'number' ? opts.fg : keywordLookup(opts.fg || 'white'),
            bg: typeof opts.bg === 'number' ? opts.bg : keywordLookup(opts.bg || 'blue')
        };
        
        this.padding = opts.padding || {
            left: 2,
            right: 2,
            top: 1,
            bottom: 1
        };
        if (typeof this.padding === 'number') {
            this.padding = {
                left: this.padding,
                right: this.padding,
                top: this.padding,
                bottom: this.padding
            };
        }
        this.x += this.padding.left;
        this.y += this.padding.top;
        this.size = {
            x: this.width + this.padding.left + this.padding.right
        };
        
        this._input = through(
            (buf, enc, next) => {
                this._ondata(buf);
                next();
            },
            () => { this.emit('close') }
        );
        this._output = through();
        this.charm = opts.charm || createCharm({
            input: this._input
        });
        this.charm.on('error', function () {});
        this.charm.pipe(this._output);
        
        this.stream = this.charm.pipe(through());
        try {
            this.charm.display('reset');
            this.charm.display('bright');
        }
        catch (e) {}
        
        process.nextTick(() => {
            this._ticked = true;
            this.charm.cursor(false);
            this._draw();
        });
    }

    createStream () {
        return duplexer(this._input, this._output)
    }

    add (label, cb) {
        var index = this.items.length;
        if (cb) {
            this.on('select', function (x, ix) {
                if (ix === index) cb(x, ix);
            });
        }
        
        this.items.push({
            x: this.x,
            y: this.y,
            label: label
        });
        this._fillLine(this.y);
        this.y ++;
    }

    _fillLine (y) {
        if (!this.lines[y]) {
            this.charm.position(this.init.x, y);
            this.charm.write(Array(1 + this.size.x).join(' '));
            this.lines[y] = true;
        }
    }

    jump (name) {
        var index = typeof name === 'number'
            ? name
            : this.items
                .map(function (item) { return item.label })
                .indexOf(name)
        ;
        if (index < 0) return;
        var prev = this.selected;
        this.selected = index;
        if (this._ticked) {
            this._drawRow(prev);
            this._drawRow(index);
        }
    }

    close  () {
        this._input.end();
        this.charm.cursor(true);
        this.charm.display('reset');
        this.charm.position(1, this.y + 1);
        this.charm.end();
    }

    reset () {
        this.charm.reset();
    }

    write (msg) {
        this.charm.background(this.colors.bg);
        this.charm.foreground(this.colors.fg);
        this._fillLine(this.y);
        
        var parts = msg.split('\n');
        
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].length) {
                this.charm.position(this.x, this.y);
                this.charm.write(parts[i]);
            }
            if (i !== parts.length - 1) {
                this.x = this.init.x + this.padding.left;
                this._fillLine(this.y);
                this.y ++;
            }
        }
    }

    _draw () {
        for (var i = 0; i < this.padding.top; i++) {
            this._fillLine(this.init.y + i);
        }
        for (var i = 0; i < this.items.length; i++) this._drawRow(i);
        
        // reset foreground and background colors
        this.charm.background(this.colors.bg);
        this.charm.foreground(this.colors.fg);
        
        for (var i = 0; i < this.padding.bottom; i++) {
            this._fillLine(this.y + i);
        }
    }

    _drawRow (index) {
        index = (index + this.items.length) % this.items.length;
        var item = this.items[index];
        this.charm.position(item.x, item.y);
        
        if (this.selected === index) {
            this.charm.background(this.colors.fg);
            this.charm.foreground(this.colors.bg);
        }
        else {
            this.charm.background(this.colors.bg);
            this.charm.foreground(this.colors.fg);
        }
        
        var len = this.width - wcstring(item.label).size() + 1;

        this.charm.write(item.label + Array(Math.max(0, len)).join(' '));
    }

    _ondata (buf) {
        var bytes = [].slice.call(buf);
        while (bytes.length) {
            var codes = [].join.call(bytes, '.');
            if (/^(27.91.65|27,79.65|107|16)\b/.test(codes)) { // up or k
                this.selected = (this.selected - 1 + this.items.length)
                    % this.items.length
                ;
                this._drawRow(this.selected + 1);
                this._drawRow(this.selected);
                if (/^107\b/.test(codes)) bytes.shift()
                else bytes.splice(0, 3);
            }
            if (/^(27.91.66|27.79.66|106|14)\b/.test(codes)) { // down or j
                this.selected = (this.selected + 1) % this.items.length;
                this._drawRow(this.selected - 1);
                this._drawRow(this.selected);
                if (/^106\b/.test(codes)) bytes.shift()
                else bytes.splice(0, 3);
            }
            else if (/^(3|113)/.test(codes)) { // ^C or q
                this.charm.reset();
                this._input.end();
                this._output.end();
                bytes.shift();
            }
            else if (/^(13|10)\b/.test(codes)) { // enter
                this.charm.position(1, this.items[this.items.length-1].y + 2);
                this.charm.display('reset');
                this.emit('select', this.items[this.selected].label, this.selected);
                bytes.shift();
            }
            else bytes.shift();
        }
    }
}
