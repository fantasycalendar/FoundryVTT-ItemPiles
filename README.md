# Item Piles

![Latest Release Download Count](https://img.shields.io/github/downloads/fantasycalendar/FoundryVTT-ItemPiles/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge) [![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fitem-piles&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=item-piles) ![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2Ffantasycalendar%2FFoundryVTT-ItemPiles%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Foundry%20Version&query=$.compatibility.minimum&colorB=orange&style=for-the-badge) ![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2Ffantasycalendar%2FFoundryVTT-ItemPiles%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

---

<img src="https://app.fantasy-calendar.com/resources/computerworks-logo-full.png" alt="Fantasy Computerworks Logo" style="width:250px;"/>

A module made by [Fantasy Computerworks](http://fantasycomputer.works/).

Other works by us:

- [Fantasy Calendar](https://app.fantasy-calendar.com) - The best calendar creator and management app on the internet
- [Sequencer](https://foundryvtt.com/packages/sequencer) - Wow your players by playing visual effects on the canvas
- [Tagger](https://foundryvtt.com/packages/tagger) - Tag objects in the scene and retrieve them with a powerful API
- [Token Ease](https://foundryvtt.com/packages/token-ease) - Make your tokens _feel good_ to move around on the board
- [Rest Recovery](https://foundryvtt.com/packages/rest-recovery) - Automate most D&D 5e long and short rest mechanics

Like what we've done? Buy us a coffee!

<a href='https://ko-fi.com/H2H2LCCQ' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi1.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

---

![Item Piles in a nutshell](docs/images/intro.jpg)

## What is Item Piles?

Have you ever wished you could represent items in your scenes? A pile of items, something to interact with - or perhaps
chests whose appearance changes depending on what happens to it, whether it's open, closed, full, or empty. Do you want
an easy way to split loot between players? Do you want easy to use merchants with great UIs?

Then you need **Item Piles**!

This module features:

* Dropping items on the canvas to create piles of items
* Item piles acting as containers with the ability to switch its token image depending on its open/closed/empty state,
  and play sounds accordingly
* Turn characters into fully featured merchants, with complex item pricing, item quantity management, and more
* Robust player-to-player trading features
* Incredibly intuitive API and documentation

Chest sprites used on this page is from Forgotten Adventures*

**not included in this module*

---

## [Check out the wiki for more info](https://fantasycomputer.works/FoundryVTT-ItemPiles/)

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:

1. Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2. Click "Install Module"
3. In the "Manifest URL" field, paste the following url:
   `https://github.com/fantasycalendar/FoundryVTT-ItemPiles/releases/latest/download/module.json`
4. Click 'Install' and wait for installation to complete
5. Don't forget to enable the module in game using the "Manage Module" button

## [Changelog](./changelog.md)

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

## License

This package is under an [MIT](LICENSE) and
the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/)
.

## Credits:

- Padhiver#1916 for the French localization
- STB#9841 for the German localization
- Brother Sharp#6921 for the Japanese localization
- Forgotten Adventures for their amazing chest sprites (not included in the module)
- Caeora for their great maps and tokens (not included in this module)
