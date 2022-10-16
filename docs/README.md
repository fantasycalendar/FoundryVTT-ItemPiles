# Item Piles

![Item Piles in a nutshell](images/intro.jpg)

## What is Item Piles?

Have you ever wished you could represent items in your scenes? A pile of items, something to interact with - or perhaps
chests whose appearance changes depending on what happens to it, whether it's open, closed, full, or empty. Do you want
an easy way to split loot between players?

Then you need **Item Piles**!

In short, this module enables dropping items onto the canvas, which then get represented as a pile of items. In order to
work in all systems without breaking or messing too much with the core functionality of Foundry, this **creates an
unlinked token & actor** to hold these items. When a player double-clicks on an item pile token, it opens a custom UI to
show what the pile contains and players can then take items from it.

Item Piles can also be configured to act as a container, where it can be open or closed, locked or unlocked, with the
ability for the token that represents the pile to change image depending on its state.

In addition, when an item pile is interacted with it can also play sounds for the action, such as opening, closing, or
attempting to open a locked item pile. Sounds are only played for the user who attempted the action.

Last but not least, the module features a robust and well documented API, where module and system creators can leverage
Item Piles to enrich your looting experience.

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

## Required Modules

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib/) library so that players can modify
the contents and the look of item piles without having to have full ownership of the item piles. Without it, they could
only drop items and create item piles using pile actors they own.

### libwrapper

This module uses the [libwrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. It is a
hard dependency, and it is recommended for the best experience and compatibility with other modules.

## Optional Modules

### Advanced Macros

This module leverages the [Advanced Macros](https://github.com/League-of-Foundry-Developers/fvtt-advanced-macros) module
so that any macros can use extra data provided by the Item Piles module. This is an optional install, but highly
recommended.

## Requesting Support for System

Item Piles works in any system, but requires setup. If you wish to request native support for a system, please create a
new [system request here](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/issues/new?assignees=Haxxer&labels=enhancement&template=system-request.md&title=%5BSYSTEM%5D+-+Write+the+system%27s+name+here)

Fill in _all_ of the information, and ask in the system's discord channel if you don't know what something means.

Incomplete requests will be rejected.

## Natively Supported Systems

Item Piles is designed to work in all systems, but may require some setup for it to fully function. Please refer to the
module settings to configure that.

- [Dungeons & Dragons 5e](https://foundryvtt.com/packages/dnd5e)
- [Pathfinder 1e](https://foundryvtt.com/packages/pf1)
- [Dungeon Slayers 4](https://foundryvtt.com/packages/ds4)
- [D&D 3.5e SRD](https://foundryvtt.com/packages/D35E)
- [Savage Worlds Adventure Edition](https://foundryvtt.com/packages/swade)
- [Tormenta20](https://foundryvtt.com/packages/tormenta20)
- [Warhammer Fantasy Roleplay 4th Ed](https://foundryvtt.com/packages/wfrp4e)
- [Splittermond](https://foundryvtt.com/packages/splittermond)
- [Starfinder](https://foundryvtt.com/packages/sfrpg)
- [Star Wars FFG](https://foundryvtt.com/packages/starwarsffg)
- [Index Card RPG](https://foundryvtt.com/packages/icrpg)
- [Forbidden Lands](https://foundryvtt.com/packages/forbidden-lands)
- [Fallout 2d20](https://foundryvtt.com/packages/fallout)

## Semi-supported systems

- [Pathfinder 2e](https://foundryvtt.com/packages/pf2e) - While Item Piles _works_ in this system, item piles is not
  strictly needed as PF2e already has a robust loot actor & token system, and feature rich systems.

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to
the [Issue Tracker](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/issues), or using
the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## [Changelog](changelog.md)

## License

This package is under an [MIT](LICENSE) and
the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/)

## Credits

- Manuel Vögele for his "isResponsibleGM" function implementation and wonderful SocketLib module
- Otigon, Zhell, Gazkhan, and MrVauxs for their collective efforts surrounding macro evaluation and execution
- Forgotten Adventures for their amazing chest sprites (not included in the module)
- Caeora for their great maps and tokens (not included in this module)
