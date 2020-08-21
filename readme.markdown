# extended-terminal-menu

retro ansi terminal menus for serious 80s technicolor business

## fork

This is an extended/updated version of `terminal-menu`, it contains following changes:

- It uses `wcstring` which is a vast improvement to `visualwidth` for asian text
- It has updated dependencies
- It exports a class instead of a function which makes extending it easier
- It merged [#36](https://github.com/substack/terminal-menu/pull/36)
- It allows `item` added to be complex objects
- It will not exceed max listeners
- It is linted with `standard`
- It has an updated syntax to Node 6
- It contains typescript definitions

---

![terminal menu](http://substack.net/images/screenshots/terminal_menu.png)

## example

``` js
var TerminalMenu = require('extended-terminal-menu');
var menu = new TerminalMenu({ width: 29, x: 4, y: 2 });
menu.reset();
menu.write('SERIOUS BUSINESS TERMINAL\n');
menu.write('-------------------------\n');

menu.add('ADD TRANSACTION INVOICE');
menu.add('BUSINESS INTELLIGENCE');
menu.add('ACCOUNTS PAYABLE');
menu.add('LEDGER BOOKINGS');
menu.add('INDICATOR CHART METRICS');
menu.add('BACKUP DATA TO FLOPPY DISK');
menu.add('RESTORE FROM FLOPPY DISK');
menu.add('EXIT');

menu.on('select', function (label) {
    menu.close();
    console.log('SELECTED: ' + label);
});
process.stdin.pipe(menu.createStream()).pipe(process.stdout);

process.stdin.setRawMode(true);
menu.on('close', function () {
    process.stdin.setRawMode(false);
    process.stdin.end();
});
```

## methods

``` js
const TerminalMenu = require('extended-terminal-menu')
```

## var menu = new TerminalMenu(opts)

Create a menu with `opts`:

* `opts.width` - menu width in columns
* `opts.x` - top-left corner x offset, default: 1
* `opts.y` - top-left corner y offset, default: 1
* `opts.fg` - foreground color, default: 'white'
* `opts.bg` - background color, default: 'blue'
* `opts.padding.left` - left padding in columns
* `opts.padding.right` - right padding in columns
* `opts.padding.top` - top padding in rows
* `opts.padding.bottom` - bottom padding in rows
* `opts.selected` - set the selected element by its index

The menu can be driven around with the arrow keys, vi-style j/k, and emacs-style
C-n/C-p.

To quit out of the menu, hit `^C` or `q`.

## menu.add(label, [handler]) or menu.add({ label, [line], [handler] })

Create a new selectable menu item with the string `label`.

Optionally give a callback `handler(label, index, item)` that will fire with the label
string and index when selected.

It is also possible to pass the item in as object.

`line` is an optional property which contains the way how the line should be rendered.
In case some advanced renderings are supposed to take place.

## menu.write(msg)

Write a message to the menu.

## var stream = menu.createStream()

Return a duplex `stream` to wire up input and output.

## menu.reset()

Reset the terminal, clearing all contents.

## menu.close()

Unregister all listeners and put the terminal back to its original state.

# events

## menu.on('select', function (label, index) {})

When the user selects a label, this event fires with the label string and menu
index.

# install

With [npm](https://npmjs.org) do:

```
npm install terminal-menu
```

# license

MIT
