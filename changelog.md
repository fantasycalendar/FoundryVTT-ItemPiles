# Item Piles Changelog

## Version 3.0.8

- Fixed not being able to drop items onto scenes

## Version 3.0.7

- Tweaked `game.itempiles.API.createItemPile` with `createActor` set to `true` have the default item piles' settings
- Fixed item pile containers not respecting open/close/lock/unlock settings
- Fixed minor `module.json` manifest warning

## Version 3.0.6

- Fixed very specific game crash surrounding currency rounding when buying multiple items with discounts with a specific currency setup
- Fixed giving multiple quantity of a single item would always give just 1
- Fixed item pile data resetting upon token updates
- Fixed item pile interfaces not reopening after changing their item pile type

## Version 3.0.5

- Fixed issue in Foundry v11 that would cause item piles to not refresh when items and currencies were taken from them, allowing users to take multiple items
- Fixed bug with giving item always giving 1 item
- Updated Polish localization (thank you Lioheart on weblate!)

## Version 3.0.4

- Fixed random-ish errors when duplicating item piles and then trying to open their interfaces
- Fixed issue with trying to split an item pile among 0 players

## Version 3.0.3

- Minor fix to latest release

## Version 3.0.2

- Fixed opening item pile interfaces would spawn duplicate windows instead of focusing existing interfaces
- Fixed item piles chat messages not working in v11
- Fixed errors when trying to get document templates in v12 (fixes merchant columns & item pile system settings)
- Fixed deprecation warnings surrounding `CONST.DOCUMENT_PERMISSION_LEVELS`

## Version 3.0.1

- Added Russian localization (thank you VirusNik21 on github!)
- Fixed players being unable to open item piles due to error

## Version 3.0.0

- Updated module to be compatible with Foundry v12 (thank you to NeilWhite on github!)
- Updated the TyphonJS Runtime Library version - thank you, Michael, for your continued support!
- Updated the Tormenta20 system configuration to fix its currency issues
- Added support for the [Dragonbane - Drakar och Demoner](https://foundryvtt.com/packages/dragonbane) system (thank you xdy on github!)
- Added the `game.itempiles.macro_execution_types` constants - see docs for more info
  - For the above, added `game.itempiles.macro_execution_types.RENDER_INTERFACE`, which means that macros that are attached to item piles will execute its macro when the item piles interface is rendered
- Added item price modifiers on items, so items can decide how much they will deviate from the base price
- Fixed merchant columns not being editable in newer versions of D&D 5e
- Fixed rolltables not applying custom categories to items properly
- Fixed issue with merchant treating all items as unique and never stacking them
- Fixed issue with the search bar disappearing when searching for items in item piles

## Version 2.9.1

- Added support for the Shadowdark system (thank you mrstarbuck007 on github!)
- Added additional settings for item types (thank you p4535992 on github!)
- Tweaked currency settings to update cached item if the currency names or images were updated
- Updated D&D4e system support (thank you EndlesNights on github!)
- Fixed Better Rolltables compatibility (thank you p4535992 on github!)
- Fixed trying to open merchant columns settings after they had broken would throw error and prevent fixing the error
- Fixed Simple Calendar integration not hiding tokens of closed merchants that were set to hide

## Version 2.9.0

- Added formal support for D&D5e 3.0.x - moving/buying/trading containers is still not supported
- Added Required Item Properties setting to item piles - you can now configure which items are valid to be transferred to item piles or sold to merchants
- Added various API methods (thank you to p4535992 on github!)
  - `game.itempiles.API.isValidItemPile`
  - `game.itempiles.API.isRegularItemPile`
  - `game.itempiles.API.isItemPileLootable`
  - `game.itempiles.API.isItemPileVault`
  - `game.itempiles.API.isItemPileMerchant`
  - `game.itempiles.API.isItemPileAuctioneer` (requires the Item Piles: Auctioneer module)
  - `game.itempiles.API.isItemPileEmpty`
- Updated Polish and Chinese (simplified) localizations (thank you Lioheart and hmqgg on weblate!)
- Fixed issues with sorting vaults placing items in strange positions
- Fixed issue with dropping multiple items sometimes only resulting in one item being dropped
- Fixed compatibility with Better Rolltables
- Fixed vault styles not being editable
- Fixed merchant activity log events being incorrectly displayed
- Fixed custom categories not being applied on items when populating merchants
- Fixed issue with item piles not updating the amount of visible currency when taking 1 unit of currency at a time
- Fixed containers not updating image when the contents of the item pile changed

## Version 2.8.20

- Reverted some changes that caused errors in some systems with item based currencies

## Version 2.8.19

- Added several currency related methods and hooks (thank you p4535992 on GitHub!)
  - Added method `game.itempiles.API.updateCurrencies()`
  - Added hook `item-piles-preUpdateCurrencies`
  - Added hook `item-piles-updateCurrencies`
- Updated Polish localization (thank you Lioheart on weblate!)
- Updated SWADE system config (thank you kristianserrano on GitHub!)
- Fixed merchant populate items table rolling not working

## Version 2.8.18

- Fixed items sometimes losing their flags when added vaults

## Version 2.8.17

- Fixed swapping items in vaults would sometimes allow you to swap items so that one ended up outside the bounds of the vault
- Fixed merchants sometimes not refreshing their inventories when integrated with Simple Calendar
- Fixed users not being able to drop unstackable items into vaults

## Version 2.8.16

- Fixed items that were linked with the item linking module losing their links

## Version 2.8.15

- Fixed non-stackable items being fully deleted when added to vaults even though they may have quantity in the origin character inventory
- Fixed players not being able to sort vaults when they have permission to organize the vault

## Version 2.8.14

- Fixed issue with not being able to drop items into vault
- Fixed minor issue with some items not landing where they were dropped into vaults

## Version 2.8.13

- Added the ability to rotate vault items of non-uniform sizes
- Added button to vault to sort the items within the vault, sorting large to small - hold control to merge similar items as well
- Added `game.itempies.API.getStringFromCurrencies` (thanks to p4535992 on github!)
- Updated French, Portuguese (Brazil), and Polish localization (thanks Marc Feuillen, ltsoares, and Lioheart on weblate!)
- Tweaked override currencies on item piles cause buying/transferring these currencies to fully remove themselves from inventories when used up
- Tweaked various API methods to throw an error if the items to be added cannot fit inside the target vault
- Fixed better rolltables not working after update (thanks Pantus on github!)
- Fixed trading window in Alien RPG displaying some of its native character sheet elements due to over-eager CSS styles on the system's behalf
- Fixed not being able to trade currencies when trading user to user
- Fixed being able to add items with 0 quantity to item piles

## Version 2.8.12

- Minor hotfix to make vault expanders forced non-stackable

## Version 2.8.11

- Tweaked styles of vaults and remove item backgrounds to support transparent images
- Fixed item-based currencies to be excluded from the stackable property (currencies can always stack)
- Fixed drag and dropping from other item piles into vaults not showing a proper item size preview
- Fixed issue where larger items would sometimes be able to be dropped on top of other large items

## Version 2.8.10

- Fixed non-stackable items with more than one quantity being added to item piles would incorrectly remove any extra quantity from the item
- Fixed vault items larger than 1x1 not swapping correctly when dropped on other items of a similar size
- Fixed vault currencies not being able to be deposited or withdrawn
- Fixed setting item piles' currencies directly not working correctly

## Version 2.8.9

- Minor fix to vault expanders not being able to be added to vaults

## Version 2.8.8

- Added support for asymmetrical item sizes in vaults
- Added setting to items for overriding its image when it is in a vault
- Tweaked Item Piles slightly more forgiving with its "must have a GM connected" warning message
- Fixed buying items sometimes not giving the correct change to the buyer
- Fixed updating the name and image of items would sometimes not update them in item piles
- Fixed styling conflicts in Alien RPG when trading with other users

## Version 2.8.7

- Added API endpoint on custom item pile types to support item & actor drag and drop fields
- Improved performance of the Simple Calendar integration when refreshing merchants
- Fixed compendium updates sometimes causing item piles to duplicate items in its currency backup compendium
- Fixed flags sometimes not transferring correctly with items when added to item piles
- Minor changes to support Item Piles: Auctioneer's imminent release

## Version 2.8.6

- Fixed characters being able to buy things from merchants they could not afford

## Version 2.8.5

- Finally ACTUALLY fixed quantity not showing up properly on the Custom System Builder system
- Fixed missing location on the trade button in the bottom left

## Version 2.8.4

- Added support for the Shadow of the Demonlord system (thank you to brantai on github!)
- Updated French, German, Portuguese (Brazil), and Polish localization (thank you everyone for contributing on weblate!)
- Fixed minor Simple Calendar incompatibility
- Fixed faulty migration code causing errors with other modules
- Fixed migration being loud when it should have been silent (it logged to console)

## Version 2.8.3

- Fixed Custom System Builder item quantity not working properly
- Fixed issue with merchants causing them to not work property with custom prices

## Version 2.8.2

- Added API endpoints:
  - `game.itempiles.API.getItemCategories()`
  - `game.itempiles.API.getCostOfItem()`
  - `game.itempiles.API.getItemQuantity()`
  - `game.itempiles.API.calculateCurrencies()` which can be used to calculate different currency strings;
    - `game.itempiles.API.calculateCurrencies("10gp", "5gp")` would result in 5GP (wow, impressive right?)
    - `game.itempiles.API.calculateCurrencies("9gp 4sp 9cp", "5sp 4cp")` would result in `8GP 9SP 4CP`, which is a bit more impressive
    - `game.itempiles.API.calculateCurrencies("9gp 4sp 9cp", "5sp 4cp", false)` would result in `10GP 3CP`
    - `game.itempiles.API.calculateCurrencies("9gp", 0.5)` would result in `4GP 5EP`
- Deprecated `game.itempiles.API.getPaymentDataFromString()` in favor of `game.itempiles.API.getPaymentData()`
- Updated `game.itempiles.API.getPaymentData()` to also accept a number as its first argument
- Added support for Custom System Builder property paths
- Added support for soft migrations to systems, which will avoid customized settings being overwritten
- Fixed DnD5e's race type item being able to be dropped
- Fixed Alien RPG's currency quantity
- Fixed Forbidden Land's currency paths

## Version 2.8.1

- Fixed D&D5e displaying all characters for players when giving items, instead of just the ones they have at least limited visibility of

## Version 2.8.0

- Added "Send To Character" when right-clicking items in your inventory in D&D5e - a much faster way to send items between characters
- Added Merchant price modifier support for "group" type actors in D&D5e - adding a group to a merchant's price modifiers will apply the price modifiers to anyone belonging to that group actor (thanks to Paith on discord for the idea!)
- Added `game.itempiles.API.refreshMerchantInventory()`, which can be called to manually refresh a merchant's inventory based on its configured tables
- Added `PRICE_MODIFIER_TRANSFORMER` and `SYSTEM_HOOKS` to `game.itempiles.API.addSystemIntegration()`
- Updated Chinese and Czech localization (thank you EternalRider and Mortan on weblate!)

## Version 2.7.22

- Updated French, Polish, and Portuguese (Brazil) localization (thank you lucasts, Lioheart, and ltsoares on weblate!)
- Fixed Rarity Colors not working - now requires the module's version to be at least 0.3.6

## Version 2.7.21

- Fixed the OSE system breaking in the latest updates

## Version 2.7.20 Hotfix

- Fixed new system support breaking most systems, whoops

## Version 2.7.19

- Added support for the Star Wars FFG system (thanks Grumpkin on the Foundry discord server!)
- Fixed item based currencies breaking AGAIN

## Version 2.7.18

- Added optional logging to merchants
- Added hook: `item-piles-preRefreshInventory`
  - Called when the inventory of a merchant is refreshed by Simple Calendar, which will allow you to add additional changes to the merchant, or fully interrupt that merchant's refresh
- Updated Portuguese localization (thanks to ltsoares on weblate!)
- Updated Star Wars: Saga Edition system configuration (thanks to cpadilla on github!)
- Fixed secondary currencies would not be cached in the Item Piles currency compendium
- Fixed buying/selling things on merchants with secondary currencies
- Fixed adding currency to item piles & vaults not updating to the correct amount

## Version 2.7.17

- Fixed services would not stack and instead duplicate when added to merchants - if you still want non-stacking services, set them as non-stacking in the service's settings
- Fixed services not being removed by the Simple Calendar during refreshes - if you want to keep them, turn on `Keep On Merchant`

## Version 2.7.16

- Fixed minor issue with adding vault expanders to vaults via the API causing the expanders to stack
- Fixed non-GM users adding vault expanders to a vault would be added to the vault with 0 quantity

## Version 2.7.15

- Added Japanese localization (thank you black11eleven on weblate, great work!)
- Fixed issue where dropping a token onto a scene would sometimes not use the current item piles configuration

## Version 2.7.14

- Added Czech localization (thank you Mortan on weblate - fantastic job!)

## Version 2.7.13

- Added support for the Pirate Borg system (thanks to Sneat on github!)
- Updated Polish localization (thanks fo Lioheart on weblate!)
- Improved Better RollTables support
- Fixed merchant columns sometimes resetting
- Fixed populating items in the merchant not applying custom categories
- Fixed opening the item pile UI of an unlinked token preventing opening the actor's default item pile UI
- Fixed some systems that have adopted the new defined schema causing item piles having troubles figuring out item quantities
- Fixed selling items to merchants would not respect the merchant's override item type filters

## Version 2.7.12 Hotfix

- Actually fixed populate items tab in merchants
- Removed a stray debugger

## Version 2.7.11

- Fixed populate items tab in merchants not working properly
- Fixed a v11 tweak breaking the v10 version of Item Piles
- Fixed merchants sometimes losing track of actor-specific discounts

## Version 2.7.10

- Added tentative & rudimentary support for the Better Roll Tables module in merchants and in the API
- Updated French and Polish localization (thank you Elfenduil and Lioheart on weblate!)
- Fixed PF1e's item prices (thanks Mana on github!)
- Fixed the Cyberpunk RED system not using the correct quantity property
- Fixed "Open Sheet" header button not being visible to players in the interfaces of Item Piles of which they are owners
- Fixed minor bug with transferring properties that were undefined on either side of the transfer
- Fixed issue that caused roll tables being normalized when rolled through the API or through merchants

## Version 2.7.9

- Added better support for item prices in PF1e (thanks Mana on github!)
- Added `game.itempiles.hooks.PRE_RENDER_INTERFACE` hook
- Added support for buy and sell specific merchant columns
- Updated Portuguese (Brazil) localization (thanks ltsoares on weblate!)
- Fixed vaults and merchants sometimes changing token image and name to the last item in their inventory
- Fixed prices sometimes not formatting correctly in Level Up A5e due to being strings, not numbers
- Fixed item pile sheets not rendering properly in Level Up A5e
- Fixed `game.itempiles.API.rollItemTable` not working

## Version 2.7.8

- Added `userId` to macros that get executed when items are bought from merchants

## Version 2.7.7

- Added item quantity to the populate items tab of merchants
- Added `game.itempiles.API.getMerchantPriceModifiers` and `game.itempiles.API.updateMerchantPriceModifiers` (see API docs)
- Tweaked merchant populate items menu tables dropdown to recursively find every table under the configured tables folder
- Tweaked merchant populate items to recursively roll all tables within tables, including tables in compendiums
- Tweaked merchant populate items table behavior - if an item has quantity, item piles will assume that its quantity is how many one will get when buying 1 quantity of the item
- Fixed `game.api.itemPiles.rollItemTable` not respecting the rolled item's existing quantity
- Fixed holding keybind to force open the character sheet for item piles not working

## Version 2.7.6

- Fixed custom item prices not working

## Version 2.7.5

- Fixed faulty migration throwing errors

## Version 2.7.4

- Tweaked the way items that cost items are stored in the item's flags to avoid deeply nested data. Instead, the items that are required to buy other items are stored in a compendium for ease of access and long term storage. This fixes an issue with to deeply nested data.
- Fixed free items still showing up in merchants when the setting to hide them was enabled
- Fixed merchants with nothing for sale not displaying the text about this fact in the interface

## Version 2.7.3

- Fixed minor bug preventing items from being traded in user-to-user trades
- Minor tweak to minimum height and width of vault windows

## Version 2.7.2

- Tweaked Warhammer Fantasy Roleplay 4th Edition system settings (thanks Forien on github!)
- Tweaked how prices are calculated when the lowest currency denomination has an exchange rate of 1 so that it would prioritize the seller getting the highest currency values
- Fixed systems with non-fractional currencies (most multi-currency systems) sometimes rounding incorrectly
- Fixed buy/sell dialog sometimes showing an incorrect max amount of items one could buy or sell
- Fixed bug with item-based currencies when GMs would add currencies to user-to-user trades
- Fixed bug with item-based currencies that prevented GMs from being able to add currencies to item piles
- Fixed rare bug that caused item piles to not be deleted when empty
- Fixed bug that caused item filters and other individual item pile token settings to locally override global module settings

## Version 2.7.1

- Added support for the Alien RPG system
- Updated French localization (thanks Rectulo on weblate!)
- Fixed issue with items sometimes not updating in item pile interfaces after changing anything on their sheets
- Improved the settings exporter/importer methods

## Version 2.7.0

- Updated Polish, French, and Chinese (Simplified) localization (thank you Lioheart, rectulo, and TravelingK on Weblate!)
- Added support for the Blade Runner system (thank you Stefouch on github!)
- Added a "Restrict Access" setting and "View" permissions to vault access configuration - with these two configured, only characters with the permissions set up can view the contents of the vault
- Added services to the "Populate Items" tab in merchants, and buttons to clear them
- Added an export button to the settings UI to export and import the system specific settings
- Fixed PF2e mystified items incorrectly showing the item's real name and icon in the user-to-user trading interface instead of the mystified ones
- Fixed item piles not being deleted once empty
- Fixed item piles being updated with `actorData` when that has been deprecated in Foundry V11
- Fixed price preset editor not opening
- Fixed not being able to turn actors into item piles through the actor sheet header
- Fixed DnD5e system config for `veryRare` rarity not being correct

## Version 2.6.16

- Fixed error preventing users from opening item piles on the canvas in Foundry v11

## Version 2.6.15

- Fixed critical issue preventing opening most documents, whoops

## Version 2.6.14

- Added `game.itempiles.API.unrenderItemPileInterface` which can be used to remotely close item pile interfaces for players
- Fixed opening document sheets in compendiums would throw error and fail to open (Foundry v11)
- Fixed hovering over vault items sometimes throwing errors in the console
- Fixed not having any hotkeys configured would throw errors when opening item pile UIs

## Version 2.6.13

- Updated Portuguese (Brazil) localization (thank you mclemente on Weblate!)
- Fixed D&D 5e system implementation not supporting changing the name or abbreviation of currencies without breaking item costs
- Implemented off custom tooltip override, as it doesn't work in v11 and don't work well with native tooltips
- Fixed dragging and dropping actors into item piles UI to interact with the item pile "as" that actor
- Fixed item flags being lost when they were added to merchants through rolling on tables
- Fixed minor issue with hotkeys (fixes quick insert interaction with Item Piles)

## Version 2.6.12

- Added support for previewing mystified items in PF2e
- Updated Portuguese (Brazilian), and French localization - thank you eunaumtenhoid and rectulo on Weblate!
- Fixed Star Wars 5e system not having the correct item price property path (thank you Ikaguia on github)
- Fixed being able to withdraw infinite amount of currencies from vaults
- Fixed merchant's currencies would not be visible at the bottom of the UI if it _didn't_ have infinite currencies

## Version 2.6.11

- Fixed item based currencies not working well when dragging and dropping them into vaults
- Fixed item based currencies would use the item's name & image, rather than the Item Piles' currency name & image

## Version 2.6.10

- Fixed rare error when adding items to item piles

## Version 2.6.9

- Added Simple Calendar support for auto-population and refresh of merchant inventory based on the opening time when driven by Simple Calendar, as well as Simple Calendar repeating notes and on specific weekdays
- Added option on the item configuration to make individual items to not be cleared when the merchant's inventory is refreshed
- Added option to merchant population tables to put new items directly into a custom item category
- Added support for secondary currencies - these cannot be exchanged for one another when buying or selling from merchants
- Added price paid for items and services to the chat message when purchasing from merchants
- Updated Portuguese (Brazilian), Chinese (Simplified), Polish, and French localization - thank you eunaumtenhoid, sakusenerio, psedonatural, and Lioheart on Weblate, couldn't do it without ya!
- Updated the receiving item dialog when passing items between tokens
- Fixed error when taking everything from an item pile
- Fixed merchant items with multiple prices not being apparent
- Fixed merchant items text color on the multiple price dropdown being too faded

## Version 2.6.8

- Added optional custom category on the table configuration in merchant populate items, which will automatically put all items rolled from those tables into that category, unless the rolled item already has a custom category
- Updated French, Portuguese (Brazilian), and Chinese (Simplified) localization (thank you rectulo, eunaumtenhoid, and psedonatural on Weblate!)
- Fixed stacking items in vaults would only work for GMs and in vaults that the player owns, but not actually stack the items
- Fixed stacked items would show as up as withdrawn in the vault logs
- Fixed merchant open/close time not evaluating the first time you open the shop, so players could access the shop when it should have been closed
- Fixed merchant tables not saving their roll formula
- Fixed merchant buy/sell/service tables being crunched up into a small space when too few items had been added, which made it impossible to select a different price on items with more than one price
- Fixed issues with creating new item piles on some systems (like Starfinder), caused by item piles trying to create items on the new item pile with `Item`s instead of the item's data
- Fixed split currencies button being incorrectly disabled

## Version 2.6.7

- Fixed being unable to buy items from merchants, how embarrassing
- Fixed being unable to edit the quantity of items in the merchant UI

## Version 2.6.6

- Remove stray debugger, whoops

## Version 2.6.5

- Added setting to hide item pile token borders when they are hovered, default behavior is hidden for everyone (unless selected)
- Added merchant's currencies below the item list for GMs, displayed only if the merchant does not have infinite currencies
- Fixed PF2e items would become de-mystified when dropped onto the ground
- Fixed item piles' item names would be crunched into a very thin vertical line
- Fixed merchant per-actor price modifiers not being able to be saved
- Fixed merchants having a quantity column even if the merchant's display quantity setting was set to "Always No"
- Minor fixes to the merchant styling

## Version 2.6.4

- Fixes to merchants not scrolling properly when the item list is long enough, unfortunately lost some initial opening speed with lots of items

## Version 2.6.3

- Minor fix to the quantity for price attribute setting

## Version 2.6.2

- Improved loading speed of merchants by a factor of five in systems with item based currencies
- Fixed buying items in systems with item based currencies would not work if change was to be given to the buyer
- Fixed editing character price modifiers throwing errors

## Version 2.6.1

- Updated WFRP4e system configuration (thank you Txus5012 on github!)
- Updated Portuguese (Brazil) and French localization (thank you eunaumtenhoid and rectulo on Weblate!)
- Added `PILE_DEFAULTS` and `TOKEN_FLAG_DEFAULT` system specific settings
- Tweaked the way default item pile data is applied, in the case of merchant columns
- Fixed `game.itempiles.API.createItemPile` not respecting an overriding `texture.src`, `texture.scaleX`, and `texture.scaleY` property on the token data
- Fixed populate items not having scroll bars when enough items was added to the merchant
- Fixed item piles created in PF2e would not be scaled appropriately due to overriding system flags

## Version 2.6.0

- Added system specific columns to merchants, such as rarity in D&D 5e and bulk in Pathfinder 2e
- Added support for the Index Card RPG: Master Edition system
- Updated Portuguese (Brazil) localization (thank you eunaumtenhoid on Weblate!)
- Fixed price modifiers on custom categories did not work when created through the merchant interface
- Fixed duplication bug with custom categories
- Fixed elevation not being taken into account when dropping items

## Version 2.5.8

- Added support for the D&D 4e system (thank you EndlesNights on github!)
- Added support for the Naheulbeuk system
- Removed internal support for the Cepheus & Traveller system, as it is officially supported by the system! Thanks
- Updates to French and Portuguese (Brazil) localization (thank you rectulo and eunaumtenhoid on Weblate!)
- Tweaked the way item piles injects itself into the `ActorSheet#render` methods to be more robust
- Tweaked the "Show To Users" UI to include users who own characters but have chosen to not tie them to their user account
- Tweaked how some item pile data is stored on tokens and actors to improve long-term module health
- Fixed deprecation warning (thank you marvin9257 on github!)

## Version 2.5.7

- Fixed double-clicking on linked tokens' actor sheets would not open the ephemeral actor sheet that has [Token] instead of [Prototype Token] in the header
- Fixed `removeExistingActorItems` causing the item pile UI to fail to display any new items

## Version 2.5.6

- Fixed clicking on item pile actors in the sidebar would not open the item pile UI, but the actor sheet

## Version 2.5.5

- Added support for dragging and dropping items between vaults other item piles, vaults, and character sheets
- Added feature to forbid stacking items in vaults (which can be overridden in individual items)
- Added option to split stacks of items in the vault item context menu
- Fixed right-click context menu not working on vaults
- Minor fixes to the vault grid not interacting well with touch screens
- Fixed Warhammer System not correctly setting item prices on merchants
- Fixed open actor sheets would not re-render if the item pile UI was open for that actor

## Version 2.5.4

- Added support for the Dark Heresy 2e system (thanks diwako on Github!)
- Fixed issue with secret blocks being visible in merchant descriptions (thanks TyphonJS for the quick turnaround on the fix!)
- Added Chinese (simplified) localization (Thank you bnp800 on weblate!)
- Fixed being able to add currencies to piles when the system did not support any currencies

## Version 2.5.3

- Added the ability for GMs to drag and drop actors into item pile interfaces to inspect as that token
- Fixed being unable to select a token, then shift double click on an item pile token to inspect the item pile as the first selected token
- Updated French localization

## Version 2.5.2

- Tweaked the way rendering item piles work - if the actor sheet is rendered without holding the actor sheet hotkey, it will render the item pile UI - if you call `ActorSheet#render` you can add `{ bypassItemPiles: true }` to the secondary options to prevent the item piles UI from opening, and instead open the actor sheet
- Fixed `Split x ways` sometimes being able to be clicked when the item pile has nothing to be split

## Version 2.5.1

- Fixed issue with purchasing items from merchants would cause the buyer to be scammed, and not add the items to the inventory of the buyer

## Version 2.5.0

- Added support for `quantity per price` - this per item setting allows you to configure how many of the item is received when paying its price
- Updated PF2e's system settings to account for the above
- Updated Polish localization (thank you Leoheart on weblate!)
- Updated WFRP4e system settings to take into account the multiple currencies on prices for items
- Fixed issue where adding items to a trade from a compendium would not properly trade the items
- Fixed other underlying issues with user to user trading

## Version 2.4.19

- Added 3d Canvas integration (thanks theripper93 for the help!)
- Added Rarity Colors module integration - items in item piles, merchants, and vault will now use the colors from the Rarity Colors module
- Updated localization (thank you MrVauxs and eunaumtenhoid on weblate!)
- Fixed minor localization issue (thanks to Elfrey on github!)

## Version 2.4.18

- Fixed not being able to set item prices in the Cypher system
- Fixed systems with item-based currencies would sometimes not correctly update their quantities
- Updated Star Wars 5e system settings to have correct property paths
- Improved merchant populate items table layout to better handle long table names
- Updated French localization - thank you rectulo!

## Version 2.4.17

- Updates to German localization - thank you blueacousticmusic!
- Added `x[quantity]` to the name of new pile-type item pile tokens, so you know how many of that item was dropped on the ground
- Changed `Infinite Quantity` on items to be a multi-choice option whether to defer to the owner's setting, or whether to have infinite quantity
- Dropping items now always prompts whether to create an item pile or not
- Dropping items from the sidebar or compendiums should now allow you to change the dropped quantity
- Fixed issue with items not being passed properly to macros being called when buying from and selling to merchants (thank you FeistyMango!)
- Fixed issue with merchants' macros not being called when selling them (thank you FeistyMango!)
- Fixed an issue where invalid item pile tokens were not being properly deleted during migrations

## Version 2.4.16

- Added support for Dungeon Crawl Classics system - _thanks mooped!
- Updated French localization - thank you rectulo!_
- Fixed being unable to spectate trades
- Fixed `Split currencies x ways` button not working when sharing currencies was not enabled
- Fixed item piles not being deleted after users having looted all of their currencies
- Fixed users being able to more than their share

## Version 2.4.15

- Added setting to track custom item categories across items (will not track previously created categories)
- Updated German and French localization - thank you Marc and IrishWolf!
- Fixed issue with item based currency systems that would not properly subtract existing currency when removing from actors

## Version 2.4.14

- Fixed not being able to add new actors to merchants' price modifiers
- Minor code cleanup

## Version 2.4.13

- Fixed missing import which broke module

## Version 2.4.12

- Added support for the following systems:
  - Cypher System
  - Pokemon Tabletop United
- Updated French localization - thank you rectulo!
- Fixed sharing data would not be properly applied on item piles with sharing items/currencies enabled
- Fixed players being able to add currencies to item piles without having to possess the currencies

## Version 2.4.11

- Updated German and French localization - thank you blueacousticmusic & Elfenduil!
- Fixed users dropping items onto the item piles UI would not remove items from the user's inventory
- Fixed chat messages surrounding items would not use the item's image (in the case of mystified PF2e items)
- Fixed systems with item-based currencies would fail to open merchants properly
- Fixed Buy Items tab in the merchant UI would be hidden even if there were purchasable items
- Fixed error when dropping items on tokens from the sidebar

## Version 2.4.10

- Updated German localization (thanks blueacousticmusic on Weblate!)
- Added further Simple Calendar support; merchants can now be closed on specific weekday, and categories on notes can cause merchants to be closed (think holidays)
- Added support for vault item styling based on item properties
- Added `Hide Items With Zero Cost` setting to merchants, which automatically hides items in the buy/sell/service tabs if they are free
- Tweaked `Buy Items` tab to be hidden if the merchant has no visible items for sale, and the customer can sell items
- Fixed disabled elements being blue due to styling being incorrect
- Fixed item-based currencies would show up in the vault grids
- Fixed setting item-based currencies' quantity on item piles would instead always add them
- Fixed items added through merchant tables would lose their item pile flags (such as being a service, custom prices, etc)
- Fixed error when setting the price from the item editor

## Version 2.4.9

- Fixed minor issue with GMs not having permission to change module settings
- Fixed shares not being kept track of in item piles properly
- Fixed adding currencies to item piles not working properly for players
- Fixed to system integrations and how they apply their system specific settings

## Version 2.4.8

- Fixed normal users with permissions to change the world settings of Item Piles would not be able to
- Tweaked migrations to not refresh automatically, but prompts you to do so yourselves
- Tweaked Simple Calendar integration to not cause Item Piles to hard-fail when Simple Calendar is out of date
- Updated French localization (thanks Marc via Weblate!)

## Version 2.4.7

- Fixed vault expanders being added as regular items rather than expanding the available space

## Version 2.4.6

- Added a setting to be able to configure unstackable items
- Fixes for the upcoming OSE update to support its Item Piles integration
- Fixes dropping items on the canvas for various systems (OSE, Cyberpunk RED)
- Fixed not being able to add any vault permissions if it did not have any to begin with

## Version 2.4.5

- Additional fixes for actors with broken items in DnD5e breaking scenes (thanks dev7355608!)

## Version 2.4.4

- Fixed not being able to purchase items from merchants
- Fixed users not being prompted with a dialog to drop items (holding when dropping alt will skip dialog)
- Fixed error that would sometimes pop up when users drop items to create new piles

## Version 2.4.3

- Removed stray debugger because I am a hot mess

## Version 2.4.2

- Fixed issues with retrieving the source actor from drop data in certain systems (OSE, for example)
- Fixed merchants not saving tables that were assigned to them
- Fixed merchants not retrieving correct item prices in DnD5e

## Version 2.4.1

- Added support for the Star Wars 5th Edition system (thank you bollwyvl!)
- Updated French localization (thank you Padhiver and rectulo! You are legends!)
- Fixed critical error when trying to create new item piles in the DnD5e system due to the system's new data validation
- Fixed error when creating the first item pile
- Fixed dropping items into vault from compendiums or the item sidebar wouldn't place the items the dropped slot
- Fixed PF2e prices sometimes not loading correctly
- Tweaked migration code to not fall over as easily

## Version 2.4.0

- Added vault type item piles - these item piles act like the Diablo stash or the World of Warcraft banking system, where you have a set amount of grid slots that you can put items into
- Added vault extenders - you can configure items to extend the space available in vaults
- Added chat message for when users give each other items
- Added `game.itempiles.API.addSystemIntegration()` for systems to integrate into item piles more readily
- Added support for `true` and `false` values in system item filters
- Added `change` as a secondary argument to `game.itempiles.API.removeCurrencies()` and `game.itempiles.API.transferCurrencies()` so that the currency removal/transfer can handle converting currencies into change to cover the full transfer
- Added more hooks:
  - `item-piles-preClickItemPile`
  - `item-piles-preGiveItem`
  - `item-piles-giveItem`
- Added more item piles constants and useful info in `game.itempiles`
- Updated DnD5e system support to support the new 2.1.0 update
- Tweaked `game.itempiles.api.turnTokensIntoItemPiles` to use the default item pile's settings when converting tokens into item piles
- Tweaked item piles containers to be the only tokens that get the additional buttons in its token HUD
- Tweaked the item similarities setting - a lack of them will now treat every item as distinct items rather than the same
- Fixed GMs still being able to drop items on the canvas when the setting was not enabled
- Fixed trades between users not creating a final chat message when concluded listing what was traded
- Fixed being able to loot/buy installed Cyberware in Cyberpunk Red
- Fixed sometimes being able to give items to yourself

## Version 2.3.11

- Added support for the Symbaroum system
- Fixed Merchants' items having a quantity counter visible on items that cannot stack
- Fixed minor localization issue in the item editor
- Fixed merchant tokens being deleted if they were set to be deleted when becoming empty. Disappearing merchants is mechanically cool and all, but probably not ideal.

## Version 2.3.10

- Actually fixed `game.itempiles.API.rollItemTable` not adding items to the target actor
- Fixed `Display Item Types` not working properly on item piles

## Version 2.3.9

- Fixed `Buy Items` tab in merchants not being visible if the merchants had no services, oops

## Version 2.3.8

- Added support for the Worlds Without Numbers system
- Added the ability to set custom categories on items
- Added "Custom" type to per-item-type price modifiers to affect the aforementioned custom categories
- Tweaked the `Buy Items` tab on merchants to become hidden if the merchant has services to sell, but no items to sell
- Fixed error when calling `game.itempiles.API.rollItemTable` with a target actor receive the rolled items
- Improvements to currency string detection and handling
- Updates to the French localization (thanks rectulo!)

## Version 2.3.7

- Added "Keep Zero Quantity" setting to merchants and items - any item that is bought up with this setting enabled will be kept in the merchant, but set to not for sale.
- Fixed infinite distance merchant tokens could not be interacted with if player had no tokens on the canvas

## Version 2.3.6

- Added various currency-related methods to the API:
  - `game.itempiles.API.getCurrenciesFromString`
  - `game.itempiles.API.addCurrencies`
  - `game.itempiles.API.removeCurrencies`
  - `game.itempiles.API.transferCurrencies`
  - `game.itempiles.API.transferAllCurrencies`
- Added hooks for the above methods
- Improved support for systems with a primary currency that has the lowest exchange rate
- Removed popup that asks you to update the item pile system settings and instead silently updates your settings
- Fixed item editor not supporting string-type item costs
- Fixed `game.itempiles.API.transferEverything` not transferring currencies correctly
- Fixed DnD5e's system item filters not having `subclass` as an ignored item type
- Fixed closing an item pile container via the UI would not pass along the actor who closed it to macros and hooks
- Fixed documentation on hooks, as it was slightly out of date

## Version 2.3.5

- Fixed `game.itempiles.API.setCurrencies` requiring the wrong parameters

## Version 2.3.4

- Fixed creating a new item pile would make every token think it's an item pile - oops

## Version 2.3.3

- Reworked the `Populate Items` tab in merchants - you can now add all items on rollable tables to populate a merchant's inventory, rolling for the quantity of each item
- Added "Show To Which Players" dialog when "Show to players" is clicked on item piles and merchants
- Added `Hide header button` client setting
- Fixed `Split currency x ways` not working when "Sharing Enabled: Currencies" was disabled
- Fixed `Hide header button text` client setting not working on item piles and merchants
- Fixed switching item pile functionality (enabled/disabled, item pile/merchant) would break any active UI with them, now closes the active window and opens the appropriate one

## Version 2.3.2

- Further improvements to detection of items without quantity
- Fixed issues with pre-defined item-based currency in systems

## Version 2.3.1

- Added support for systems that store prices in strings like "1L 50T" (Splittermond, as an example)
- Adjusted token detection when double-clicking on an item pile actor to prioritize their user character
- Improved detection of items without quantity
- Updated Splittermond system settings

## Version 2.3.0

- Added core support for systems that have items without quantities
- Added support for the following systems:
  - Cepheus & Traveller
  - Twilight: 2000 (4th Edition)
  - KNAVE
  - Coriolis
  - Kamigakari
  - Cyberpunk RED
- Fixed Fallout 2d20 system not having the correct setup
- Fixed splitting item pile contents in the PF2e system
- Fixed handling of item-based currencies not tracking individual player shares properly
- Fixed not being able to add currencies to item piles in the PF2e system (users and GMs)
- Fixed spectating users would cause the trade to be cancelled when closing the trade window
- Fixed spectating users would not see newly added items in trades
- Fixed users not being able to spectate trades after they reconnect
- Fixed `turnTokensToItemPiles` would make every token be updated to use the image of the last token passed to the function
- Updated German localization (Thanks IrishWolf!)

## Version 2.2.13

- Fixed dropping items onto the scene would create empty item pile
- Fixed splitting item pile contents among players not working

## Version 2.2.12

- Fixed search not working in merchants
- Fixed searching for services would make the buy services tab disappear
- Fixed populate items in merchants not working properly

## Version 2.2.11

- **BREAKING:** Changed the functionality of `game.itempiles.API.createItemPile()`
  - Please check the API for more information: <https://fantasycomputer.works/FoundryVTT-ItemPiles/#/api?id=createitempile>
- Added Currency Decimal Digits setting to better support control over how many decimals are displayed for item prices on systems with only one currency (Thanks loofou!)
- Made `Start Trade` button in player list dark (thanks LukasPrism!)
- The function `game.itempiles.API.rollItemTable()` now supports tables that exist in compendiums
- Fixed issue where adding items to item piles would not properly update the token image or name
- Fixed DND5e's item transformer making assumptions about the data it was given, which could cause errors

## Version 2.2.10

- Added better support for systems with only one currency, fractional costs should no longer result in free items
- Added the following optional settings to `rollItemTable`:
  - `resetTable` (default `true`) - whether to reset the table between calls to this function
  - `displayChat` (default `false`) - whether to display the rolls to the chat
- Added `renderItemPileInterface` to the API documentation
- Fixed merchants sometimes not working on systems that use currencies that are actual items
- Fixed `turnTokensIntoItemPiles` not respecting `img`, `scale`, and `name` overrides in the optional `tokenSettings`
- Fixed minor issues with documentation
- Removed stray `console.log`

## Version 2.2.9

- Fixed minor typo in `rollItemTable`

## Version 2.2.8

- Fixed regular item piles would error for players when they try to open them
- Fixed some item prices would round incorrectly due to floating point errors (0.3g would become 2s 9cp instead of 3s)
- Fixed trading being impossible due to a bug, pressing accept in the trading UI would cause the other party to un-accept the trade

## Version 2.2.7

- Added "Split items by item types" setting to item piles, which will display items separated by type in normal item piles
- Added `rollItemTable` to the API, which can be used to get items from a roll table
  - Check out the wiki for example macros: <http://fantasycomputer.works/FoundryVTT-ItemPiles/#/sample-macros>
- Tweaked trading UI so that users doesn't have to press enter after changing the quantity of an entry, clicking away will now change it
- Fixed issue with the clear all items button in the merchant UI not working
- Finally updated all the API documentation:
  - Check out the wiki for all the information you need: <http://fantasycomputer.works/FoundryVTT-ItemPiles/#/API>

## Version 2.2.6

- Fixed dropping items in the merchant interface would fail to add the item to the merchant's inventory
- Fixed per-actor price modifiers not loading actors properly when reopened
- Fixed per-actor price modifiers not having an override checkbox
- Fixed description area of merchants not having a scrollbar
- Created a new wiki for all of your item piles needs:
  - <http://fantasycomputer.works/FoundryVTT-ItemPiles/>

## Version 2.2.5

- Updated French and Portuguese (Brazilian) localization (thanks to rectulo, davidR1974, and eunaumtenhoid!)
- Fixed error when using the search bar in item piles
- Fixed individual items marked as having infinite quantity not having infinite quantity when sold by merchants
- Fixed merchants with overnight open times would not stay open properly past midnight

## Version 2.2.4

- Added Spanish and partial Polish localization (thanks bext1a and MrVauxs!)
- Added "Service" type items
  - Items sold by merchants can now be configured not add any items to the buyer's inventory
  - The cost of buying the item is still applied to the buyer
  - If the merchant runs out of this service "item", its quantity is set to 0 but not removed from the merchant, just set to "not for sale"
  - Combined with the item purchase macro feature, you could create a "Cure Wounds" service item & macro that heals people when bought (see below)
- Added macro execution option to items when purchased
- Added DnD5e compendium of merchant roll tables
- Improved macro selector input by suggesting potential macros and compendiums of macros
- Fixed merchants with infinite quantity of items would still lose quantity of items when selling items
- Fixed missing macro input on the item pile config interface
- Fixed searching in item piles and then clearing input would not refresh items
- Fixed two users being able to pick the same actor to trade with - let's not enter the twilight zone just yet
- Fixed rare issue with GMs not being able to keep track of active users (???)

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

- Fixed users being able to give away items to other users that are of types that are not allowed to be given (such as spells, features, etc)
- Fixed containers being considered locked when it is in fact unlocked

## Version 2.1.0

- Implemented Simple Calendar integration for open/close times
- Added Open/Close button in the top right of the merchants window for ease of access
- Added "Give Item" functionality - any token can now drop items onto adjacent tokens to give them that item. This can be turned off in the settings.
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

- Adjusted API to use native foundry `Item#fromDropData` instead of my own implementation (Thank you, TheGiddyLimit on GitHub!)
- Fixed issue relating to some systems not generating a new ID for items, which caused false-positives when trying to find similar items on actors that were the source of said items
- Fixed issue where systems would override core functions on items that modify names and other data, Item Piles will now always call the system's Item specific functions
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
- Tweaked system recognition to allow systems to set the required settings through the API, which suppresses the system incompatibility warning
- Fixed various bugs surrounding splitting item piles
- Fixed issue with the `Split n ways` button not working sometimes

## Version 1.4.3

- Fixed minor issue with creating item piles

## Version 1.4.2

- Updated Japanese Localization (thanks to Brother Sharp#6921!)
- Updated French Localization (thanks to Padhiver#1916!)
- Fixed GMs having a character assigned to their user account would cause strangeness in some interfaces
- Fixed `game.itempiles.API.addItems` failing to merge similar items

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

- Fixed an issue in v8 and in some systems that caused item piles to fail to get the correct item quantities
  - This does not fix items that had already been put into item piles, you can fix this by editing the quantities of the items in actor's inventory
- Fixed tokens not retaining their image when they were turned into item piles

## Version 1.3.3

- Added missing `Split Only With Active Players` setting on item piles

## Version 1.3.2 Hotfix

- Fixed module throwing error about MidiQOL when dropping an item if the module is not installed

## Version 1.3.1

- Fixed `game.itempiles.API.turnTokensIntoItemPiles` failing to turn tokens into item piles
- Fixed module throwing errors in v8 regarding the actor sidebar
- Fixed some Item Pile interfaces lacking styling elements in v8

## Version 1.3.0

- Added item pile currency and/or item splitting capabilities
- Added chat message when currency and/or items are split between players
- Added API methods:
  - `game.itempiles.API.splitItemPileContents` - Splits an item pile's content according to its settings
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

- Added `Item Filters` setting - now you can more accurately filter items you do not want to show up in item piles, such as natural weapons
- Updated all supported systems to support the above and added migrations to convert existing settings to the new system
  - Reset your Item Piles module settings to ensure you have the latest system configurations
- Removed `Item Type Attribute` and `Item Type Filters` as the above feature covers these cases
- Added debounce to the token image refresh so that it doesn't try to change its image too often
- Further fixes to `game.itempiles.API.addItems`
- Fixed unlinked item piles not retaining their setup when created from the actors directory

## Version 1.2.5

- Added missing handlebars method for Foundry v0.8.9

## Version 1.2.4 Hotfix

- Fixed error in `game.itempiles.API.addItems` throwing errors
- Fixed D&D 3.5e system not correctly implemented

## Version 1.2.3

- Added API method:
  - `game.itempiles.API.openItemPileInventory` - forces a given set of users to open an item pile's inventory UI
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
- Tweaked `game.itempiles.API.turnTokensIntoItemPiles` to turn tokens into item piles without having the "Display Single Item
  Image" setting turned on
- API changes:
  - Changed: `game.itempiles.API.addItems`
    - This method now expects an array of objects, with item data or Item (Foundry Item class) (key `item`), and an
      optional quantity attribute that determines how many of the item to add (key `quantity`)
    - It now returns an array of objects, with the item's data (key `item`) and the quantity added (key `quantity`)
  - Changed: `game.itempiles.API.removeItems`
    - This method now expects an array of objects each containing the item id (key `_id`) and the quantity to
      remove (key `quantity`), or Items (the Foundry Item class) or strings of IDs to remove all quantities of
    - It now returns an array of objects, each containing the item that was removed or updated (key `item`), the
      quantity that was removed (key `quantity`), and whether the item was deleted (key `deleted`)
  - Changed: `game.itempiles.API.transferItems`
    - This method now expects an array of objects each containing the item id (key `_id`) and the quantity to
      transfer (key `quantity`), or Items (the Foundry Item class) or strings of IDs to transfer all quantities of
    - It now returns an array of objects, each containing the item that was added or updated (key `item`), the
      quantity that was transferred (key `quantity`)
- Fixed `game.itempiles.API.transferEverything` not transferring everything from non-item pile actors
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
  - Changed `game.itempiles.API.turnTokenIntoItemPile` to `game.itempiles.API.turnTokensIntoItemPiles`, now can take array of
    tokens to turn into piles
  - Changed `game.itempiles.API.revertTokenFromItemPile` to `game.itempiles.API.revertTokensFromItemPiles`, now can take array
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
  - `game.itempiles.API.getActorItemFilters(TokenDocument|Actor)` - Returns the item type filters for a given item pile
  - `game.itempiles.API.getActorItems(TokenDocument|Actor, Array|Boolean)` - Returns the items the item pile contains and
    can transfer
- Updated japanese localization
- Fixed item piles not respecting item type filters
- Fixed issue with `game.itempiles.API.turnTokenIntoItemPile` not actually turning the token into an item pile
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
