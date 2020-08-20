/// <reference types="node"/>

import conversions from 'color-convert/conversions'
import { Readable, Duplex } from 'stream'
import { EventEmitter } from 'events'
import charm from 'charm'

declare namespace createMenu {
  interface IMenuItem {
    x: number
    y: number
    label: string
  }

  type ISelectHandler<TThis> = (this: TThis & { line: string }, label: string, index: number, item: TThis & { line: string, handler: ISelectHandler<TThis> }) => any
  type ICloseHandler = () => any
  type IColor = number | conversions.KEYWORD

  interface IPadding {
    left: number
    right: number
    top: number
    bottom: number
  }

  interface IOptions {
    width?: number
    x?: number
    y?: number
    selected?: number
    padding?: number | IPadding
    charm?: charm.CharmInstance
    fg?: IColor
    bg?: IColor
  }
  interface IItem {
    label: string
    line?: string
    handler?: ISelectHandler<this>
  }
  interface IEntry <TItem extends IItem> {
    x: number
    y: number
    item: TItem
  }
  
  interface IMenu <TItem extends IItem> extends EventEmitter {
    width: number
    x: number
    y: number
    init: { x: number, y: number }
    entries: IEntry<TItem & { line: string }>[]
    lines: { [index: number]: boolean }
    selected: number
    colors: {
      fg: number
      bg: number
    }
    padding: IPadding
    size: {
      x: number
    }
    charm: charm.CharmInstance
    stream: Readable
    createStream (): Duplex
    add (label: string): void
    add (label: string, handler: ISelectHandler<TItem>): void
    add (item: TItem): void
    add (item: TItem, handler: ISelectHandler<TItem>): void
    write (msg: string): void
    jump (labelOrIndex: number | string): void

    close (): void
    reset (): void

    on (event: 'select', handler: ISelectHandler<TItem>): this
    off (event: 'select', handler: ISelectHandler<TItem>): this
    addEventListener (event: 'select', handler: ISelectHandler<TItem>): this
    removeEventListener (event: 'select', handler: ISelectHandler<TItem>): this
    listenerCount (event: 'select'): number
    once (event: 'select', handler: ISelectHandler<TItem>): this
    prependListener (event: 'select', handler: ISelectHandler<TItem>): this
    prependOnceListener (event: 'select', handler: ISelectHandler<TItem>): this

    on (event: 'close', handler: ICloseHandler): this
    off (event: 'close', handler: ICloseHandler): this
    addEventListener (event: 'close', handler: ICloseHandler): this
    removeEventListener (event: 'close', handler: ICloseHandler): this
    listenerCount (event: 'close'): number
    once (event: 'close', handler: ICloseHandler): this
    prependListener (event: 'close', handler: ICloseHandler): this
    prependOnceListener (event: 'close', handler: ICloseHandler): this
  }
}

declare function createMenu <TItem extends createMenu.IItem = createMenu.IItem> (opts?: createMenu.IOptions): createMenu.IMenu<TItem>

export = createMenu
