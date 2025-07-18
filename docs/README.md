![Item Piles in a nutshell](images/intro.jpg)

## What is Item Piles?

Have you ever wished you could represent items in your scenes? A pile of items, something to interact with - or perhaps chests whose appearance changes depending on what happens to it, whether it's open, closed, full, or empty. Do you want an easy way to split loot between players? Do you want easy to use merchants with great UIs?

Then you need **Item Piles**!

This module features:

* Dropping items on the canvas to create piles of items
* Item piles acting as containers with the ability to switch its token image depending on its open/closed/empty state, and play sounds accordingly
* Turn characters into fully featured merchants, with complex item pricing, item quantity management, and more
* Create Diablo and World of Warcraft-like gridded vaults of items
* Robust player-to-player trading features
* Incredibly intuitive API and documentation

Chest sprites used on this page is from Forgotten Adventures*

**not included in this module*

---

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:

1. Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2. Click "Install Module"
3. In the "Manifest URL" field, paste the following url:
   `https://github.com/fantasycalendar/FoundryVTT-ItemPiles/releases/latest/download/module.json`
4. Click 'Install' and wait for installation to complete
5. Don't forget to enable the module in game using the "Manage Module" button

## [Changelog](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/blob/master/changelog.md)

## Required Modules

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib/) library so that players can modify the contents and the look of item piles without having to have full ownership of the item piles. Without it, they could only drop items and create item piles using pile actors they own.

### libwrapper

This module uses the [libwrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. It is a hard dependency, and it is recommended for the best experience and compatibility with other modules.

## System Support

### Adding Direct System Support

Please see [contributing to Item Piles](contributing-to-item-piles.md#adding-system-support).

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/issues), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

This package is under an [MIT](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/)

## Credits

- Manuel Vögele for his "isResponsibleGM" function implementation and wonderful SocketLib module
- Otigon, Zhell, Gazkhan, and MrVauxs for their collective efforts surrounding macro evaluation and execution
- Forgotten Adventures for their amazing chest sprites (not included in the module)
- Caeora for their great maps and tokens (not included in this module)
- The vaults feature was commissioned by TCR (The Cracked Realms) for their Westmeath server, as they are trying to create an MMORPG-feeling with DnD 5e.
