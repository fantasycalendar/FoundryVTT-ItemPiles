# Item Piles

![Latest Release Download Count](https://img.shields.io/github/downloads/Haxxer/FoundryVTT-ItemPiles/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge) [![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fitem-piles&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=item-piles) ![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2FHaxxer%2FFoundryVTT-ItemPiles%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange&style=for-the-badge) ![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2FHaxxer%2FFoundryVTT-ItemPiles%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

This module enables dropping items onto the canvas, which then get represented as a pile of items. In order to work in all systems without breaking or messing too much with the core functionality of Foundry, this **creates an unlinked token & actor** to hold these items. When a player double-clicks on an item pile token, it opens a custom UI to show what the pile contains and players can then take items from it.

Item Piles can also be configured to act as a container, where it can be open or closed, locked or unlocked, with the ability for the token that represents the pile to change image depending on its state. In addition, when an item pile is interacted with it can also play sounds for the action, such as opening, closing, or attempting to open a locked item pile. Sounds are only played for the user who attempted the action.

In addition, the module features a robust and well documented API, where module and system creators can leverage Item Piles to enrich your looting experience.

# This is a Foundry v9+ only module

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://github.com/Haxxer/FoundryVTT-ItemPiles/releases/latest/download/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

## Required Modules

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib/) library so that players can modify the contents and the look of item piles without having to have full ownership of the item piles. Without it, they could only drop items and create item piles using pile actors they own.

### libwrapper

This module uses the [libwrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. It is a hard dependency, and it is recommended for the best experience and compatibility with other modules.

## Optional Modules

### Advanced Macros

This module leverages the [Advanced Macros](https://github.com/League-of-Foundry-Developers/fvtt-advanced-macros) module so that any macros can use extra data provided by the Item Piles module. This is an optional install, but highly recommended.

## Natively Supported Systems

- [Dungeons & Dragons 5e](https://foundryvtt.com/packages/dnd5e)
- More to come - create a pull request if you want to help!

## Not Supported Systems

- [Pathfinder 2e](https://foundryvtt.com/packages/pf2e) - This system already has a robust loot actor & token system, and feature rich systems. After speaking to the devs, they expressed interest in developing a similar system as the Drag & Drop system from Item Piles.

## Requesting New Systems

If you wish to request a new system, please create a new [system request here](https://github.com/Haxxer/FoundryVTT-ItemPiles/issues/new?assignees=Haxxer&labels=enhancement&template=system-request.md&title=%5BSYSTEM%5D+-+Write+the+system%27s+name+here).

Fill in _all_ of the information, and ask in the system's discord channel if you don't know what they are. Incomplete requests will be rejected.

## Usage

### Initial Setup

Installing this module allows anyone to drag & drop items to the canvas, which creates piles of items on the ground. The default pile is normally relatively unstyled and you can change it all you want, but you **shouldn't delete it** or the module will create a new default item pile actor. This is the actor that is used by everyone in your game to create item piles when they drag & drop items.

As a GM, you can duplicate the default item pile to create new versions of that pile, or turn existing actors into new item piles through the `Item Pile` button on the actor sheets' header bar. This UI has a wide range of customization, which allows you to control exactly how your players interact with the item pile.

![Item Pile Token Configuration](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/configs.png)

### Interaction

Any player or GM can drag & drop items - if you drag & drop an item from an actor's inventory, you will be prompted how many of that item that you wish to drop (if they have more than 1 of the item). Holding ALT before dragging & dropping an item, you will automatically drop 1 of the items into a new pile without a prompt. **You can also drag and drop items onto an existing pile**.

When players double-click on the item pile (or Left Control + double-click for GMs to inspect, or to inspect as someone else select two tokens, and repeat), they will get a custom UI where they can choose what they want to take from the item pile, or all of it (if they're loot goblins).

![Item Pile Inventory UI](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/inventory-ui.png)

### Extra UI and settings

In addition, item piles have a few extra buttons on the right click Token HUD to open, close, lock, and unlock containers, and a quick way to access the configuration of that token.

![Item Pile Token HUD buttons](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/token-buttons.png)

In the module settings, you can configure all sorts of things, such as whether empty piles auto-delete once they're empty, and which item types are allowed to be picked up. These are by default configured to the D&D5e system, so adjust them accordingly for your own system.

### Currencies and attributes

For most systems, currencies or other physical things aren't considered "items" in Foundry, but rather just numbers on the sheet, so dragging and dropping them is hard. However, Item Piles still allow you to pick up such items from piles using its flexible "Dynamic Attributes" feature. With this feature, you can configure what types of these "numbers only" things that can still be picked from piles up by players.

![Item Pile Dynamic Attribute Settings](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/attributes.png)

Each row represents a field on a character sheet that may be picked up. As you can see, the D&D5e system denotes the number of gold coins a character has with the `actor.data.data.currency.gp` field, so by putting `data.currency.gp` as a valid field in this UI, Item Piles figures out that if an actor has more than 0 in this field, it can be "picked up" and transferred to the character who picked it up.


## Item Piles Settings

- **Actor class type:** This setting defines the type of actor that will be used for the default item pile actor that is created on first item drop. In the case of D&D5e, this is `character`, as it does not have a dedicated loot actor type.

- **Dynamic attributes:** This setting define the attributes that are eligible for pickup in item paths, such as currencies or power, which may not be actual items. In D&D5e, currencies exist on actors on the attribute path `actor.data.data.currency.gp`, so you'd add your own with the name `Gold Coins` and attribute path `data.currency.gp`.

- **Item quantity attribute:** Here you can configure what the attribute path is for an item's quantity. For example, in the 5e system, each item's quantity is in each item's `item.data.data.quantity`, so you'd put `data.quantity` in this setting.

- **Item type attribute:** This setting defines the attribute path for determining where the item types live. In D&D5e, it's just `type` because the type is defined directly in `item.data.type`, because each item distinguishes its type with that attribute.

- **Item type filters:** Here you can configure what item types are ignored and not listed in the item pile dialogs. For example, in D&D5e you probably don't want to show spells, feats, and classes, so you'd put `spell, feat, class`.

- **Auto-delete empty piles:** This causes item piles to delete themselves once they run out of items. This can be overridden on individual item piles.

- **Preload Files:** Causes files (images and audio) of piles to be preloaded, resulting in a seamless experience.

- **Enable debugging:** Prints debug messages to the console.

## API, Hooks, & Documentation

### [You can find the documentation here](https://github.com/Haxxer/FoundryVTT-ItemPiles/wiki)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/Haxxer/FoundryVTT-ItemPiles/issues), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## [Changelog](./changelog.md)

## License

This package is under an [MIT](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).
