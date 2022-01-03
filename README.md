# Item Piles

![Latest Release Download Count](https://img.shields.io/github/downloads/Haxxer/FoundryVTT-ItemPiles/latest/module.zip?color=2b82fc&label=DOWNLOADS&style=for-the-badge) [![Forge Installs](https://img.shields.io/badge/dynamic/json?label=Forge%20Installs&query=package.installs&suffix=%25&url=https%3A%2F%2Fforge-vtt.com%2Fapi%2Fbazaar%2Fpackage%2Fitem-piles&colorB=006400&style=for-the-badge)](https://forge-vtt.com/bazaar#package=item-piles) ![Foundry Core Compatible Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2FHaxxer%2FFoundryVTT-ItemPiles%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Foundry%20Version&query=$.compatibleCoreVersion&colorB=orange&style=for-the-badge) ![Latest Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fgithub.com%2FHaxxer%2FFoundryVTT-ItemPiles%2Freleases%2Flatest%2Fdownload%2Fmodule.json&label=Latest%20Release&prefix=v&query=$.version&colorB=red&style=for-the-badge)

This module enables dropping items onto the canvas, which then get represented as a pile of items. In order to work in all systems without breaking or messing too much with the core functionality of Foundry, this **creates an unlinked token & actor** to hold these items. When a player double-clicks on an item pile token, it opens a custom UI to show what the pile contains and players can then take items from it.

Item Piles can also be configured to act as a container, where it can be open or closed, locked or unlocked, with the ability for the token that represents the pile to change image depending on its state. In addition, when an item pile is interacted with it can also play sounds for the action, such as opening, closing, or attempting to open a locked item pile.

In addition, the module features a robust and well documented API, where module and system creators can leverage Item Piles to enrich your looting experience.

## Installation

It's always easiest to install modules from the in game add-on browser.

To install this module manually:
1.  Inside the Foundry "Configuration and Setup" screen, click "Add-on Modules"
2.  Click "Install Module"
3.  In the "Manifest URL" field, paste the following url:
`https://github.com/Haxxer/FoundryVTT-ItemPiles/releases/latest/download/module.json`
4.  Click 'Install' and wait for installation to complete
5.  Don't forget to enable the module in game using the "Manage Module" button

### socketlib

This module uses the [socketlib](https://github.com/manuelVo/foundryvtt-socketlib/) library so that players can modify the contents and the look of item piles without having to have full ownership of the item piles. Without it, they could only drop items and create item piles using pile actors they own.

### libwrapper

This module uses the [libwrapper](https://github.com/ruipin/fvtt-lib-wrapper) library for wrapping core methods. It is a hard dependency, and it is recommended for the best experience and compatibility with other modules.

## Usage

Installing this module allows anyone to drag & drop items to the canvas, which creates piles of items on the ground. The default pile is normally relatively unstyled and you can change it all you want, but you **shouldn't delete it** or the module will create a new default item pile actor. This is the actor that is used by everyone in your game to create item piles when they drag & drop items.

You can duplicate this item pile to create new versions of the same type, or configure new item piles through the `Item Pile` button on actor sheets, which can turn them into item piles. This UI has a wide range of customization, which allows you to control exactly how your players interact with the item pile.

![Item Pile Token Configuration](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/configs.gif)

When players double click on the item pile (or Left Control + Double Click for GMs to inspect), they will get a custom UI where they can choose what they want to take from the item pile, or all of it (if they're loot goblins).

![Item Pile Inventory UI](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/inventory-ui.png)

In addition, item piles have a few extra buttons on the right click Token HUD to open, close, lock, and unlock containers, and a quick way to access the configuration of that token.

![Item Pile Token HUD buttons](https://raw.githubusercontent.com/Haxxer/FoundryVTT-ItemPiles/master/docs/images/token-buttons.png)

In the module settings, you can configure all sorts of things, such as whether empty piles auto-delete once they're empty, and which item types are allowed to be picked up. These are by default configured to the D&D5e system, so adjust them accordingly for your own system.

## Item Piles Settings

- **Currency attribute:** This setting defines the attribute path for determining where currencies exist on characters. In D&D5e, all currencies exist in `actor.data.data.currency`, so you'd put each currency separated by a comma, like `data.currency.pp, data.currency.gp` and so on.

- **Item quantity attribute:** Here you can configure what the attribute path is for an item's quantity. For example, in the 5e system, each item's quantity is in each item's `item.data.data.quantity`, so you'd put `data.quantity` in this setting.

- **Item type attribute:** This setting defines the attribute path for determining where the item types live. In D&D5e, it's just `type` because the type is defined directly in `item.data.type`, because each item distinguishes its type with that attribute.

- **Item type filters:** Here you can configure what item types are ignored and not listed in the item pile dialogs. For example, in D&D5e you probably don't want to show spells, feats, and classes, so you'd put `spell, feat, class`.

- **Auto-delete empty piles:** This causes item piles to delete themselves once they run out of items. This can be overridden on individual item piles.

- **Preload Files:** Causes files (images and audio) of piles to be preloaded, resulting in a seamless experience.

- **Enable debugging:** Prints debug messages to the console.

## API

### ItemPiles.API.openPile(target)
*(async)*

Visually opens a pile if it is enabled and a container (does not open a UI)

| Param    | Type                                   | Description         |
|----------|----------------------------------------|---------------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target pile to open |

### ItemPiles.API.closePile(target)
*(async)*

Visually closes a pile if it is enabled and a container (does not close a UI)

| Param    | Type                                   | Description          |
|----------|----------------------------------------|----------------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target pile to close |

### ItemPiles.API.togglePileClosed(target)
*(async)*

Visually toggles a pile's closed state if it is enabled and a container (does not show a UI)

| Param    | Type                                   | Description          |
|----------|----------------------------------------|----------------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target open or close |

### ItemPiles.API.lockPile(target)
*(async)*

Opens a pile if it is enabled and a container

| Param    | Type                                   | Description         |
|----------|----------------------------------------|---------------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target pile to lock |

### ItemPiles.API.unlockPile(target)
*(async)*

Closes a pile if it is enabled and a container

| Param    | Type                                   | Description           |
|----------|----------------------------------------|-----------------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target pile to unlock |

### ItemPiles.API.isPileLocked(target)
*(async)*

Whether an item pile is locked. If it is not enabled or not a container, it is always false.

| Param    | Type                                   | Description          |
|----------|----------------------------------------|----------------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target pile to check |

### ItemPiles.API.togglePileLocked(target)
*(async)*

Whether an item pile is closed. If it is not enabled or not a container, it is always false.

| Param    | Type                                   | Description     |
|----------|----------------------------------------|-----------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target to check |

### ItemPiles.API.isPileContainer(target)
*(async)*

Whether an item pile is a container. If it is not enabled, it is always false.

| Param    | Type                                   | Description     |
|----------|----------------------------------------|-----------------|
| target   | <code>Actor,Token,TokenDocument</code> | Target to check |

### ItemPiles.API.updatePile(target, newData)
*(async)*

Updates a pile with new data.

| Param   | Type                                   | Description                                               |
|---------|----------------------------------------|-----------------------------------------------------------|
| target  | <code>Actor,Token,TokenDocument</code> | Target pile to update                                     |
| newData | <code>object</code>                    | The target flags to update. Essentially acts as setFlags. |

### ItemPiles.API.transferItem(source, target, itemId, [quantity=1], [force=false])
*(async)*

Transfers an item from a source to a target, removing it or subtracting a number of quantity from the first to the second one, deleting the item if its quantity reaches 0.

| Param    | Type                                   | Description                              |
|----------|----------------------------------------|------------------------------------------|
| source   | <code>Actor,Token,TokenDocument</code> | The source to transfer the item from     |
| target   | <code>Actor,Token,TokenDocument</code> | The target to transfer the item to       |
| itemId   | <code>string</code>                    | The ID of the item to transfer           |
| quantity | <code>number</code>                    | How many of the item to transfer         |
| force    | <code>boolean</code>                   | Whether to ignore item type restrictions |


### ItemPiles.API.removeItem(target, itemId, [quantity=1], [force=false])
*(async)*

Subtracts the quantity of an item on an actor. If its quantity reaches 0, the item is removed from the actor.

| Param    | Type                                   | Description                              |
|----------|----------------------------------------|------------------------------------------|
| target   | <code>Actor,Token,TokenDocument</code> | The target to remove the item from       |
| itemId   | <code>string</code>                    | The ID of the item to remove             |
| quantity | <code>number</code>                    | How many of the item to remove           |
| force    | <code>boolean</code>                   | Whether to ignore item type restrictions |


### ItemPiles.API.addItem(target, itemId, [quantity=1], [force=false])
*(async)*

Adds an item to an actor.

| Param    | Type                                   | Description                              |
|----------|----------------------------------------|------------------------------------------|
| target   | <code>Actor,Token,TokenDocument</code> | The target to add the item from          |
| itemData | <code>object</code>                    | The item's data to add to this target    |
| quantity | <code>number</code>                    | How many of the item to add              |
| force    | <code>boolean</code>                   | Whether to ignore item type restrictions |


### ItemPiles.API.transferAllItems(source, target, [itemTypeFilters=false])
*(async)*

Transfers all items between the source and the target.

| Param           | Type                                   | Description                                                               |
|-----------------|----------------------------------------|---------------------------------------------------------------------------|
| source          | <code>Actor,Token,TokenDocument</code> | The source to transfer all items from                                     |
| target          | <code>Actor,Token,TokenDocument</code> | The target to transfer all items to                                       |
| itemTypeFilters | <code>array,boolean</code>             | Item types to filter as an array. If false, default filters will be used. |


### ItemPiles.API.createPile(position, [pileName])
*(async)*

Creates the default item pile at a location. If provided an actor's name, an item pile will be created of that actor, if it is a valid item pile.

| Param    | Type                | Description                                     |
|----------|---------------------|-------------------------------------------------|
| position | <code>object</code> | The position to create an empty item pile at    |
| pileName | <code>string</code> | (OPTIONAL) The name of the pile actor to create |


### ItemPiles.API.turnTokenIntoItemPile(target, [pileSettings={}], [tokenSettings={}])
*(async)*

Adds an item to an actor.

| Param         | Type                                   | Description                                |
|---------------|----------------------------------------|--------------------------------------------|
| target        | <code>Actor,Token,TokenDocument</code> | The target to turn into an item pile       |
| pileSettings  | <code>object</code>                    | Optional overrides of the pile's settings  |
| tokenSettings | <code>object</code>                    | Optional overrides of the token's settings |


### ItemPiles.API.revertTokenFromItemPile(target, [tokenSettings={}])
*(async)*

Adds an item to an actor.

| Param         | Type                                   | Description                                |
|---------------|----------------------------------------|--------------------------------------------|
| target        | <code>Actor,Token,TokenDocument</code> | The target to revert from an item pile     |
| tokenSettings | <code>object</code>                    | Optional overrides of the token's settings |


### ItemPiles.API.setCurrencyAttribute(inCurrencies)
*(async)*

Sets the attributes used to track each currency in this system

| Param        | Type                      | Description                                     |
|--------------|---------------------------|-------------------------------------------------|
| inCurrencies | <code>string,array</code> | The attributes to use as currencies from actors |

### ItemPiles.API.setItemQuantityAttribute(inAttribute)
*(async)*

Sets the inAttribute used to track the quantity of items in this system

| Param       | Type                  | Description                                   |
|-------------|-----------------------|-----------------------------------------------|
| inAttribute | <code>string</code>   | The attribute to use to track item quantities |

### ItemPiles.API.setItemTypeAttribute(inAttribute)
*(async)*

Sets the attribute used to track the item type in this system

| Param       | Type                  | Description                             |
|-------------|-----------------------|-----------------------------------------|
| inAttribute | <code>string</code>   | The attribute to use to track item type |

### ItemPiles.API.setItemTypeFilters(inFilters)
*(async)*

Sets the filters for item types eligible for interaction within this system

| Param     | Type                      | Description                                    |
|-----------|---------------------------|------------------------------------------------|
| inFilters | <code>string,array</code> | The item type filters eligible for interaction |


## Item Pile Hooks

### preCreateItemPile

A hook event that fires before an item pile has been created.

| Param     | Type                   | Description                                                                                |
|-----------|------------------------|--------------------------------------------------------------------------------------------|
| tokenData | <code>TokenData</code> | The token data that is about to be created, which contains the item pile data in the flags |

### closeItemPile

A hook event that fires after an item pile has been closed.

| Param     | Type                       | Description                        |
|-----------|----------------------------|------------------------------------|
| token     | <code>TokenDocument</code> | The token document that was closed |


### openItemPile

A hook event that fires after an item pile has been opened.

| Param     | Type                       | Description                        |
|-----------|----------------------------|------------------------------------|
| token     | <code>TokenDocument</code> | The token document that was opened |

### lockItemPile

A hook event that fires after an item pile has been locked.

| Param     | Type                       | Description                        |
|-----------|----------------------------|------------------------------------|
| token     | <code>TokenDocument</code> | The token document that was locked |

### unlockItemPile

A hook event that fires after an item pile has been unlocked.

| Param     | Type                       | Description                          |
|-----------|----------------------------|--------------------------------------|
| token     | <code>TokenDocument</code> | The token document that was unlocked |

### createItemPile

A hook event that fires after an item pile has been created.

| Param     | Type                       | Description                         |
|-----------|----------------------------|-------------------------------------|
| token     | <code>TokenDocument</code> | The token document that was created |
| flagData  | <code>object</code>        | The configuration of the item pile  |


### preUpdateItemPile

A hook event that fires before an item pile is going to be updated

| Param    | Type                       | Description                                              |
|----------|----------------------------|----------------------------------------------------------|
| token    | <code>TokenDocument</code> | The token document that is going to be updated           |
| newData  | <code>object</code>        | The new configuration of the item pile                   |
| diffData | <code>object</code>        | The difference between the old and the new configuration |


### updateItemPile

A hook event that fires after an item pile has been updated

| Param     | Type                        | Description                                              |
|-----------|-----------------------------|----------------------------------------------------------|
| token     | <code>TokenDocument</code>  | The token document that is going to be updated           |
| diffData  | <code>object</code>         | The difference between the old and the new configuration |

### preDeleteItemPile

A hook event that fires before an item pile is going to be deleted

| Param     | Type                        | Description                                    |
|-----------|-----------------------------|------------------------------------------------|
| token     | <code>TokenDocument</code>  | The token document that is going to be deleted |

### deleteItemPile

A hook event that fires after an item pile has been deleted

| Param     | Type                        | Description                              |
|-----------|-----------------------------|------------------------------------------|
| token     | <code>TokenDocument</code>  | The token document that has been deleted |

## [Changelog](./changelog.md)

## Issues

Any issues, bugs, or feature requests are always welcome to be reported directly to the [Issue Tracker](https://github.com/Haxxer/FoundryVTT-ItemPiles/issues ), or using the [Bug Reporter Module](https://foundryvtt.com/packages/bug-reporter/).

## License

This package is under an [MIT](LICENSE) and the [Foundry Virtual Tabletop Limited License Agreement for module development](https://foundryvtt.com/article/license/).
