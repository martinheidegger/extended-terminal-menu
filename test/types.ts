import createMenu, { IOptions, IPadding, IItem, ISelectHandler } from '../'
import createCharm, { CharmInstance } from 'charm'

let opts: IOptions
opts = {}
opts = {
  x: 1
}
opts = {
  y: 1
}
opts = {
  selected: 1
}
opts = {
  padding: 1
}
opts = {
  padding: {
    top: 1,
    left: 1,
    bottom: 1,
    right: 1
  }
}
opts = {
  charm: createCharm()
}

let menu = createMenu(opts)
let charmInstance: CharmInstance = menu.charm
let num: number = menu.x
num = menu.y
num = menu.width
num = menu.size.x
num = menu.selected
num = menu.colors.bg
num = menu.colors.fg
let padding: IPadding = menu.padding
let fun: Function = menu.close
fun = menu.createStream

interface ISuperItem extends IItem {
  isSuper: boolean
}

let menuSuper = createMenu<ISuperItem>()
menuSuper.write('hi')
menuSuper.add('hello')
let handler: ISelectHandler<ISuperItem> = function (label, index, item) {
  let sItem: ISuperItem
  sItem = this
  sItem = item
  let str: string = label
  let num: number = index
}
menuSuper.add('hello', handler)
menuSuper.add({ label: 'heya!', handler, isSuper: true })
menuSuper.add({ label: 'ho!!', isSuper: false })
let item: ISuperItem = menuSuper.entries[0].item
menuSuper.close()
