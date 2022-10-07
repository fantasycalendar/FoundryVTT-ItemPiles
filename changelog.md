# Item Piles Changelog

## Version 2.2.4

- Added "Service" type items
    - Items sold by merchants can now be configured not add any items to the buyer's inventory
    - The cost of buying the item is still applied to the buyer
    - If the merchant runs out of this service "item", its quantity is set to 0 but not removed from the merchant, just
      set to "not for sale"
    - Combined with the item purchase macro feature, you could create a "Cure Wounds" service item & macro that heals
      people when bought (see below)
- Added macro execution option to items when purchased
- Added DnD5e compendium of merchant roll tables
- Improved macro selector input by suggesting potential macros and compendiums of macros
- Fixed merchants with infinite quantity of items would still lose quantity of items when selling items
- Fixed missing macro input on the item pile config interface
- Fixed searching in item piles and then clearing input would not refresh items
- Added Spanish and partial Polish localization (thanks bext1a and MrVauxs!)

## Version 2.2.3

- Added full merchant support in the Pathfinder 2e system

## Version 2.2.2

- Updated Portuguese (Brazilian) localization (thank you, eunaumtenhoid!)
- Fixed users disconnecting causing trades between other users to be cancelled
- Fixed dragging and dropping an actor into the trade actor selector not working
- Fixed merchant description not being enriched, and now displays Foundry document links properly
- Fixed merchant items not being alphabetically sorted by default
- Fixed dropping spells in certain interfaces would not turn them into spell scrolls (DnD5e)
- Fixed mystified items not staying mystified in the trading interface (PF2e)
- Fixed currencies not showing up in loot chat cards

## Version 2.2.1

- Added the ability to drag and drop items between item pile interfaces
- Fixed not being able to have multiple item pile interfaces open at the same time
- Fixed per-actor price modifiers not working
- Fixed systems with only one currency not working properly

## Version 2.2.0 (V10 only)

- Foundry v10 support - no more v9 updates unless critical bugs are discovered
- Updated French and Portuguese (Brazilian) localization (thank you to Padhiver & eunaumtenhoid, respectively!)
- Localization can be easily done through weblate:
  <https://weblate.foundryvtt-hub.com/>

## Version 2.1.2 (V9 only)

- Fixed handling systems with currencies that lack decimals

## Version 2.1.1 (V9 only)

- Fixed users being able to give away items to other users that are of types that are not allowed to be given (such as
  spells, features, etc)
- Fixed containers being considered locked when it is in fact unlocked

## Version 2.1.0

- Implemented Simple Calendar integration for open/close times
- Added Open/Close button in the top right of the merchants window for ease of access
- Added "Give Item" functionality - any token can now drop items onto adjacent tokens to give them that item. This can
  be turned off in the settings.
- Added `Show To Players` header button to Item Piles & Merchants
- Improved the "Populate Items" tab on merchants (Thanks to Averrin#0374!)
    - Added hover tooltips to buttons
    - Added ability to preview rolled items
    - Added the ability to roll multiple tables
    - Rolled items now show their prices
    - Fixed tables not resetting between rolls
- Added "Reset To System Defaults" button to the module settings
- Fixed copy-pasting tokens not replicating their Item Piles settings
- Fixed `Split x ways` not splitting items properly
- Updated some French and German localization

## Version 2.0.6

- Improved dialogs to actually show that Item Piles is their origin
- Improved API when configuring settings

## Version 2.0.5 Hotfix

- Fixed supported systems constantly resetting to default settings

## Version 2.0.4

- Fixed token HUD not showing up on item pile tokens
- Fixed players being unable to inspect items when setting was enabled

## Version 2.0.3

- Added warning about Foundry v10 compatibility
- Fixed actor context menu option "Item Piles: Show pile to players" not actually showing the UI to players
- Fixed the add currencies UI failing to open
- Fixed per-character share of items and currencies not working as intended
- Tweaked the dialogs that show up when a supported system is detected
- Updated systems to include the item cost attribute and currencies
- Added support for the following systems:
    - Star Wars: Saga Edition
    - Index Card RPG
    - Forbidden Lands
    - Fallout

## Version 2.0.2

- Fixed user-to-user trading application not working properly
- Fixed edit description button in Merchant UI not working

## Version 2.0.1

- Fixed broken default settings for PF1e system
- Fixed issue with previewing items on item piles
- Fixed issue when dropping items with only one quantity ending up at the very top left of the scene
- Fixed unsupported systems throwing errors when trying to configure them

## Version 2.0.0

- Added fully-featured merchant functionality
    - Per item type and per actor price modifiers (give that chatty bard a discount)
    - Infinite currencies & infinite item quantities
    - Custom item price support - you can configure items to cost other items to buy. Crafting merchants anyone?
    - Roll table support to generate the listing on merchants
- Reworked the way currencies work to support item-based currencies
- Rewrote the entire module from scratch for long term viability
- Added support for the TwoDSix system (Traveler)
- Tweaked existing systems to work with the new currency system
- Tweaked D&D 5e system implementation
    - Dropping spells onto item piles will now convert them into scrolls
    - Taking and dropping items from piles will now clear attunement and proficiency

## Version 1.4.8

- Updated German localization (Thank you, gsterling on GitHub)
- Added Starfinder system support (Thank you, dizko on GitHub)
- Updated Tormenta20 system configuration (Thank you, mclemente on GitHub)
- Fixed hidden item piles being able to be opened

## Version 1.4.7

- Fixed issue in latest PF2 update which changed the attribute path for quantities

## Version 1.4.6

- Adjusted API to use native foundry `Item#fromDropData` instead of my own implementation (Thank you, TheGiddyLimit on
  GitHub!)
- Fixed issue relating to some systems not generating a new ID for items, which caused false-positives when trying to
  find similar items on actors that were the source of said items
- Fixed issue where systems would override core functions on items that modify names and other data, Item Piles will now
  always call the system's Item specific functions
    - Fixes issue with PF1 items sometimes showing up as identified when they were unidentified
- Added support for the Warhammer Fantasy Roleplay 4th Ed system
- Added support for the Splittermond system

## Version 1.4.5

- Fixed Item Piles inventory UI in GM mode making item quantity inputs look disabled when an item had 0 quantity

## Version 1.4.4

- Added a right click context menu to the item pile inventory UI, with an option to show an item's image to everyone
- Improved Request Trade button in the player list when the Minimal UI module is active
- Improved splitting API functions to improve performance when playing on Forge
- Improved documentation to better describe what each API method requires
- Tweaked `Split n ways` button to disable itself instead of becoming hidden
- Tweaked system recognition to allow systems to set the required settings through the API, which suppresses the system
  incompatibility warning
- Fixed various bugs surrounding splitting item piles
- Fixed issue with the `Split n ways` button not working sometimes

## Version 1.4.3

- Fixed minor issue with creating item piles

## Version 1.4.2

- Updated Japanese Localization (thanks to Brother Sharp#6921!)
- Updated French Localization (thanks to Padhiver#1916!)
- Fixed GMs having a character assigned to their user account would cause strangeness in some interfaces
- Fixed `ItemPiles.API.addItems` failing to merge similar items

## Version 1.4.1

- Fixed opening more than one item pile inventory would result in an error
- Fixed not being able to add currencies to item piles
- Fixed bug causing `Add Currency (GM mode)` to throw an error when using tokens as the trader
- Minor fixes and adjustments to the Item Pile Inventory UI
- Renamed `openItemPileInventory` to `renderItemPileInterface` which will become deprecated in 1.5.0
- Removed stray `Debugger`, whoops

## Version 1.4.0 - Trading Edition!

- Added user-to-user trading!
    - Multiple ways to initiate a trade:
        - Type `!itempiles trade` or `!ip trade` in the chat
        - Right-click on your fellow user's actors in the actor list
        - Click the `Request Trade` button below the users list
    - GMs can be represented in a trade by any actor or unlinked token in the game
    - Players can only be represented in trades with actors they own
    - Public and private trades, with the option to spectate public trades
    - Option to mute another player who spam trades
    - This is an optional setting that can be turned off
- Added setting for detecting item similarities and differences
- Added split button for GMs editing item piles
- Fixed token name changing when turning tokens into item piles
- Fixed PF1e item quantity attribute being wrong
- Temporarily removed other localizations as this update contains a huge amount of updates

## Version 1.3.4

- Fixed an issue in v8 and in some systems that caused item piles to fail to get the correct item quantities - this does
  not fix items that had already been put into item piles, you can fix this by editing the quantities of the items in
  actor's inventory
- Fixed tokens not retaining their image when they were turned into item piles

## Version 1.3.3

- Added missing `Split Only With Active Players` setting on item piles

## Version 1.3.2 Hotfix

- Fixed module throwing error about MidiQOL when dropping an item if the module is not installed

## Version 1.3.1

- Fixed `ItemPiles.API.turnTokensIntoItemPiles` failing to turn tokens into item piles
- Fixed module throwing errors in v8 regarding the actor sidebar
- Fixed some Item Pile interfaces lacking styling elements in v8

## Version 1.3.0

- Added item pile currency and/or item splitting capabilities
- Added chat message when currency and/or items are split between players
- Added API methods:
    - `ItemPiles.API.splitItemPileContents` - Splits an item pile's content according to its settings
- Added hooks:
    - `item-piles-preSplitItemPileContent` - Called before the content of an item pile is going to be split
    - `item-piles-splitItemPileContent` - Called after the content of an item pile has been split
- Updated various UIs to be more user-friendly
- Renamed "Dynamic Attributes" to "Currencies"
- Inverted the Ctrl + Double Click to open an item pile's inventory UI
- Fixed various inconsistencies in the API and its return data

## Version 1.2.8

- Added `Open Actor Sheet` and `Configure Pile` buttons to the Item Pile inventory UI (visible only to GMs)
- Fixed bug where Item Piles would ignore case-sensitive item filters and attribute paths
- Updated German localization

## Version 1.2.7

- Fixed newly created item piles would not update their image, scale, or name

## Version 1.2.6

- Added `Item Filters` setting - now you can more accurately filter items you do not want to show up in item piles, such
  as natural weapons
- Updated all supported systems to support the above and added migrations to convert existing settings to the new system
    - reset your Item Piles module settings to ensure you have the latest system configurations
- Removed `Item Type Attribute` and `Item Type Filters` as the above feature covers these cases
- Added debounce to the token image refresh so that it doesn't try to change its image too often
- Further fixes to `ItemPiles.API.addItems`
- Fixed unlinked item piles not retaining their setup when created from the actors directory

## Version 1.2.5

- Added missing handlebars method for Foundry v0.8.9

## Version 1.2.4 Hotfix

- Fixed error in `ItemPiles.API.addItems` throwing errors
- Fixed D&D 3.5e system not correctly implemented

## Version 1.2.3

- Added API method:
    - `ItemPiles.API.openItemPileInventory` - forces a given set of users to open an item pile's inventory UI
- Fixed API methods not accepting `Token` objects, will now properly cast to their `TokenDocument`
- Fixed hooks and macros not being called on item pile interaction
- Fixed various API methods being broken, oops

## Version 1.2.2 Hotfix

- Fixed hotkeys being broken on Foundry v9
- Fixed alt-quickdrop hotkey not creating a pile in the right location

## Version 1.2.1

- Fixed hotkey errors on Foundry v0.8.9

## Version 1.2.0

- Now supports Foundry v0.8.9
- Added setting to output items picked up to chat
- Added setting to hide the "Item Piles" text in the actor header - useful if you have too many modules, and the header
  is getting crowded
- Added support for the Tormenta 20 system: <https://foundryvtt.com/packages/tormenta20>
- Tweaked `ItemPiles.API.turnTokensIntoItemPiles` to turn tokens into item piles without having the "Display Single Item
  Image" setting turned on
- API changes:
    - Changed: `ItemPiles.API.addItems`
        - This method now expects an array of objects, with item data or Item (Foundry Item class) (key `item`), and an
          optional quantity attribute that determines how many of the item to add (key `quantity`)
        - It now returns an array of objects, with the item's data (key `item`) and the quantity added (key `quantity`)
    - Changed: `ItemPiles.API.removeItems`
        - This method now expects an array of objects each containing the item id (key `_id`) and the quantity to
          remove (key `quantity`), or Items (the Foundry Item class) or strings of IDs to remove all quantities of
        - It now returns an array of objects, each containing the item that was removed or updated (key `item`), the
          quantity that was removed (key `quantity`), and whether the item was deleted (key `deleted`)
    - Changed: `ItemPiles.API.transferItems`
        - This method now expects an array of objects each containing the item id (key `_id`) and the quantity to
          transfer (key `quantity`), or Items (the Foundry Item class) or strings of IDs to transfer all quantities of
        - It now returns an array of objects, each containing the item that was added or updated (key `item`), the
          quantity that was transferred (key `quantity`)
- Fixed `ItemPiles.API.transferEverything` not transferring everything from non-item pile actors
- Fixed item and attribute transfer hooks incorrectly returning the target's final quantities, rather than the
  transferred quantities
- Fixed users creating item piles would cause the pile to be spawned on the scene that the GM was viewing at that given
  moment
- Fixed Item Pile config window would not populate some inputs correctly

## Version 1.1.3

- Adjusted display one-type item piles to also take into account dynamic attributes (gold piles!)
- Fixed prototype tokens not being updated when editing an item pile through its sheet
- Fixed item piles with both "Is Container" and "Override single item token scale" enabled acting strange - item piles
  will now prioritize the container images over "Display Single Item Image" when "Is Container" is enabled
- Added warning to point out the above
- Adjusted Item Pile UI to be editable even when not enabled

## Version 1.1.2

- Fixed dropping items onto piles not working when it had an interaction distance of infinite
- Fixed macro input field in item pile config was incorrectly set to "number" rather than "text"

## Version 1.1.1

- Added support for the Savage Worlds Adventure Edition: <https://foundryvtt.com/packages/swade>
- Fixed linked token actors not acting like they are linked - now all tokens on the canvas with the same linked actor
  share the same state and image
- Fixed dynamic attributes not being treated as numbers, which caused problems in some systems (such as SWADE) if they
  were stored as strings

## Version 1.1.0

- Added support for the D&D 3.5 system: <https://foundryvtt.com/packages/D35E>
- Added the ability to click on item names to inspect the items - this can be disabled in the item pile's settings
- Hooks that previously only returned the UUID of a given document now actually provides the document itself
- Hooks added:
    - `item-piles-preRattleItemPile` - Called locally before a locked item pile is attempted to be opened
    - `item-piles-rattleItemPile` - Called for everyone after a locked item pile was attempted to be opened
    - `item-piles-preOpenItemPileInventory` - Called locally before an item pile's inventory is opened
    - `item-piles-openItemPileInventory` - Called locally after an item pile's inventory has been opened
- API changes:
    - Changed `ItemPiles.API.turnTokenIntoItemPile` to `ItemPiles.API.turnTokensIntoItemPiles`, now can take array of
      tokens to turn into piles
    - Changed `ItemPiles.API.revertTokenFromItemPile` to `ItemPiles.API.revertTokensFromItemPiles`, now can take array
      of tokens to revert
- Improved token detection when multiple owned tokens are interacting with item piles, it should now more reliably pick
  sane tokens.
    - Now picks in order: controlled token -> last selected token -> the closest owned token.
- Improved module speed when interacting with item piles
- Improved item pile token image and scale updates, should be a bit more stable
- Added warning when no GM is connected when interacting with piles

## Version 1.0.9

- Fixed module settings would stay blank even on a recognized game system

## Version 1.0.8

- Fixed item pile token image not being updated when first creating a new item pile
- Fixed item piles acting as non-empty when attributes were incorrectly configured
- Fixed the `Take All Items` button not taking items from item piles

## Version 1.0.7

- Fixed module being broken

## Version 1.0.6

- Added API endpoints:
    - `ItemPiles.API.getActorItemFilters(TokenDocument|Actor)` - Returns the item type filters for a given item pile
    - `ItemPiles.API.getActorItems(TokenDocument|Actor, Array|Boolean)` - Returns the items the item pile contains and
      can transfer
- Updated japanese localization
- Fixed item piles not respecting item type filters
- Fixed issue with `ItemPiles.API.turnTokenIntoItemPile` not actually turning the token into an item pile
- Fixed issues with item pile tokens sometimes switching to their actors image when they were empty

## Version 1.0.5

- Added french localization
- Added german localization
- Added warning if no system match was found
- Added dialog for users who installed Item Piles before their system became supported
- Fixed issue with Item Piles throwing an error with tokens whose actors had been deleted

## Version 1.0.4

- Fixed non-GMs being able to turn their characters into loot piles
- Fixed disabling loot piles would also disable the save button
- Added warning when turning a linked actor into an item pile

## Version 1.0.3

- Fixed dropping items from compendiums

## Version 1.0.2

- Fixed issue where if an item pile was updated, it would break the ability for players to open the pile
- Fixed localization issue when an item pile was too far away from a player

## Version 1.0.1

- Added Pathfinder 1 system support
- Added Japanese localization
- Added localization support to dynamic attribute names
- Tweaked DND5e attributes to be localized (you'll need to reset Item Piles' settings)
- Fixed issue where updating the Item Pile configuration on an actor would throw an error
- Fixed formatting issue on one of the dialogs
- Fixed issue where some players could not open Item Piles after creating them

## Version 1.0.0

- First public version
