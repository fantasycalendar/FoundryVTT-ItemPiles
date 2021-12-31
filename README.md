# Item Piles

![Latest Release Download Count](https://img.shields.io/github/downloads/Haxxer/FoundryVTT-ItemPiles/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge) 

[![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fitem-piles&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=item-piles)

![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FHaxxer%2FFoundryVTT-ItemPiles%2Fmaster%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange&style=for-the-badge)

![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2FHaxxer%2FFoundryVTT-ItemPiles%2Fmaster%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

[![Foundry Hub Endorsements](https://img.shields.io/endpoint?logoColor=white&url=https%3A%2F%2Fwww.foundryvtt-hub.com%2Fwp-json%2Fhubapi%2Fv1%2Fpackage%2Fitem-piles%2Fshield%2Fendorsements&style=for-the-badge)](https://www.foundryvtt-hub.com/package/item-piles/)

This module enables dropping items onto the canvas, which then get represented as a pile of items. In order to work in all systems without breaking messing too much with Foundry, this **creates an unlinked token & actor** to hold these items. When a player double-clicks on an item pile token, it opens a custom UI to show what the pile contains and players can then take items from it.

Item Piles can also be configured to act as a container, where it can be open or closed, locked or unlocked, with the ability for the token that represents the pile to change image depending on its state. In addition, when an item pile is interacted with it can also play sounds for the action, such as opening, closing, or attempting to open a locked item pile.

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib/) library for wrapping core methods. It is a hard dependency and it is recommended for the best experience and compatibility with other modules.

## Item Pile Settings

- **Item quantity attribute:** Here you can configure what the attribute path is for an item's quantity. For example, in the 5e system, each item's quantity is in each item's `item.data.data.quantity`, so you'd put `data.quantity` in this setting.

- **Currency attribute:** This setting defines the attribute path for determining where currencies exist on characters. In D&D5e, all currencies exist in `actor.data.data.currency`, so you'd put each currency separated by a comma, like `data.currency.pp, data.currency.gp` and so on.

- **Item type attribute:** This setting defines the attribute path for determining where the item types live. In D&D5e, it's just `type` because the type is defined directly in `item.data.type`, because each item distinguishes its type with that attribute.

- **Item type filters:** Here you can configure what item types are ignored and not listed in the item pile dialogs. For example, in D&D5e we probably don't want to show spells, feats, and classes, so you'd put `spell, feat, class`.

- **Auto-delete empty piles:** This causes item piles to delete themselves once they run out of items. This can be overridden on individual item piles.

- **Preload Files:** Causes files (images and audio) of piles to be preloaded, resulting in a seamless experience.

- **Enable debugging:** Prints debug messages to the console"
## [Changelog](./changelog.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/Haxxer/FoundryVTT-ItemPiles/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

This package is under an [MIT](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).
