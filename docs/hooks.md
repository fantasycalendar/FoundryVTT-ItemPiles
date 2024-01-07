# Hooks

- [Generic](#Generic)
  - [item-piles-ready](#item-piles-ready)
  - [item-piles-resetSettings](#item-piles-resetSettings)
  - [item-piles-onDragDocument](#item-piles-onDragDocument)
  - [item-piles-onDropDocument](#item-piles-onDropDocument)

- [Specific](#Specific)
  - [item-piles-preTransferEverything](#item-piles-preTransferEverything)
  - [item-piles-transferEverything](#item-piles-transferEverything)

- [Interfaces](#Interfaces)
  - [item-piles-preRenderInterface](#item-piles-preRenderInterface)
  - [item-piles-preOpenInterface](#item-piles-preOpenInterface)
  - [item-piles-openInterface](#item-piles-openInterface)
  - [item-piles-preCloseInterface](#item-piles-preCloseInterface)
  - [item-piles-closeInterface](#item-piles-closeInterface)
  - [item-piles-closeInterface](#item-piles-renderVaultGridItem)

- [Item Piles](#Item-Piles)
  - [item-piles-preCreateItemPile](#item-piles-preCreateItemPile)
  - [item-piles-createItemPile](#item-piles-createItemPile)
  - [item-piles-preUpdateItemPile](#item-piles-preUpdateItemPile)
  - [item-piles-updateItemPile](#item-piles-updateItemPile)
  - [item-piles-preDeleteItemPile](#item-piles-preDeleteItemPile)
  - [item-piles-deleteItemPile](#item-piles-deleteItemPile)
  - [item-piles-preCloseItemPile](#item-piles-preCloseItemPile)
  - [item-piles-closeItemPile](#item-piles-closeItemPile)
  - [item-piles-preOpenItemPile](#item-piles-preOpenItemPile)
  - [item-piles-openItemPile](#item-piles-openItemPile)
  - [item-piles-preLockItemPile](#item-piles-preLockItemPile)
  - [item-piles-lockItemPile](#item-piles-lockItemPile)
  - [item-piles-preUnlockItemPile](#item-piles-preUnlockItemPile)
  - [item-piles-unlockItemPile](#item-piles-unlockItemPile)
  - [item-piles-preRattleItemPile](#item-piles-preRattleItemPile)
  - [item-piles-rattleItemPile](#item-piles-rattleItemPile)
  - [item-piles-preTurnIntoItemPiles](#item-piles-preTurnIntoItemPiles)
  - [item-piles-turnIntoItemPiles](#item-piles-turnIntoItemPiles)
  - [item-piles-preRevertFromItemPiles](#item-piles-preRevertFromItemPiles)
  - [item-piles-revertFromItemPiles](#item-piles-revertFromItemPiles)
  - [item-piles-preOpenItemPileInventory](#item-piles-preOpenItemPileInventory)
  - [item-piles-openItemPileInventory](#item-piles-openItemPileInventory)
  - [item-piles-preSplitItemPileContent](#item-piles-preSplitItemPileContent)
  - [item-piles-splitItemPileContent](#item-piles-splitItemPileContent)
  - [item-piles-preClickItemPile](#item-piles-preClickItemPile)
  - [item-piles-preClickDirectoryItemPile](#item-piles-preClickDirectoryItemPile)
  - [item-piles-preRightClickItem](#item-piles-preRightClickItem)
  - [item-piles-preRefreshInventory](#item-piles-preRefreshInventory)

- [Items](#Items)
  - [item-piles-preDropItemDetermined](#item-piles-preDropItemDetermined)
  - [item-piles-preDropItem](#item-piles-preDropItem)
  - [item-piles-dropItem](#item-piles-dropItem)
  - [item-piles-preAddItems](#item-piles-preAddItems)
  - [item-piles-addItems](#item-piles-addItems)
  - [item-piles-preRemoveItems](#item-piles-preRemoveItems)
  - [item-piles-removeItems](#item-piles-removeItems)
  - [item-piles-preTransferItems](#item-piles-preTransferItems)
  - [item-piles-transferItems](#item-piles-transferItems)
  - [item-piles-preTransferAllItems](#item-piles-preTransferAllItems)
  - [item-piles-transferAllItems](#item-piles-transferAllItems)
  - [item-piles-preCalculateTradeItems](#item-piles-preCalculateTradeItems)
  - [item-piles-preTradeItems](#item-piles-preTradeItems)
  - [item-piles-tradeItems](#item-piles-tradeItems)
  - [item-piles-preGiveItem](#item-piles-preGiveItem)
  - [item-piles-giveItem](#item-piles-giveItem)

- [Attributes](#Attributes)
  - [item-piles-preAddAttributes](#item-piles-preAddAttributes)
  - [item-piles-addAttributes](#item-piles-addAttributes)
  - [item-piles-preSetAttributes](#item-piles-preSetAttributes)
  - [item-piles-setAttributes](#item-piles-setAttributes)
  - [item-piles-preRemoveAttributes](#item-piles-preRemoveAttributes)
  - [item-piles-removeAttributes](#item-piles-removeAttributes)
  - [item-piles-preTransferAttributes](#item-piles-preTransferAttributes)
  - [item-piles-transferAttributes](#item-piles-transferAttributes)
  - [item-piles-preTransferAllAttributes](#item-piles-preTransferAllAttributes)
  - [item-piles-transferAllAttributes](#item-piles-transferAllAttributes)

- [Currencies][#Currencies]
  - [item-piles-preTransferCurrencies](#item-piles-preTransferCurrencies)
  - [item-piles-transferCurrencies](#item-piles-transferCurrencies)
  - [item-piles-preUpdateCurrencies](#item-piles-preUpdateCurrencies)
  - [item-piles-updateCurrencies](#item-piles-updateCurrencies)
  - [item-piles-preAddCurrencies](#item-piles-preAddCurrencies)
  - [item-piles-addCurrencies](#item-piles-addCurrencies)
  - [item-piles-preRemoveCurrencies](#item-piles-preRemoveCurrencies)
  - [item-piles-removeCurrencies](#item-piles-removeCurrencies)
  - [item-piles-preTransferAllCurrencies](#item-piles-preTransferAllCurrencies)
  - [item-piles-transferAllCurrencies](#item-piles-transferAllCurrencies)

- [Trading](#Trade)
  - [item-piles-tradeStarted](#item-piles-tradeStarted)
  - [item-piles-tradeComplete](#item-piles-tradeComplete)

---

## Generic

### item-piles-ready

Called when the module is ready.

| Param | Type                   | Description              |
|-------|------------------------|--------------------------|
| api   | <code>Class API</code> | The item piles API class |

### item-piles-resetSettings

You can call this to reset all the Item Piles system specific settings.

### item-piles-onDragDocument

Called when any document begins being dragged - at least by native Foundry code.

| Param | Type                | Description                                                        |
|-------|---------------------|--------------------------------------------------------------------|
| data  | <code>Object</code> | An object containing the type and UUID of the object being dragged |

### item-piles-onDropDocument

Called when any document stops being dragged and is dropped - at least by native Foundry code.

| Param | Type                | Description                                                        |
|-------|---------------------|--------------------------------------------------------------------|
| data  | <code>Object</code> | An object containing the type and UUID of the object being dropped |

---

## Specific

### item-piles-preTransferEverything

Called before all items and currencies are going to be transferred from the source to the target.

| Param         | Type                             | Description                                                         |
|---------------|----------------------------------|---------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer all of its content             |
| sourceUpdates | <code>object</code>              | An object containing the updated items and attributes on the source |
| target        | <code>Actor/TokenDocument</code> | The target that is going to receive the content                     |
| targetUpdates | <code>object</code>              | An object containing the updated items and attributes on the target |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers           |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferEverything

Called after all items and attributes have been transferred from the source to the target.

| Param           | Type                             | Description                                                                                                                   |
|-----------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The source that had all of its content transferred                                                                            |
| target          | <code>Actor/TokenDocument</code> | The target that received all of the content                                                                                   |
| itemDeltas      | <code>array</code>               | An array of objects each containing the item id and the quantity that was changed on the target                               |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed on the target |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                                 |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                     |

---

## Interfaces

## The only supported interfaces are regular item piles and merchants.

### item-piles-preRenderInterface

Called before an item piles related interface has begun rendering.

| Param            | Type                                     | Description                                          |
|------------------|------------------------------------------|------------------------------------------------------|
| source           | <code>Actor/TokenDocument</code>         | The item pile actor                                  |
| inspectingTarget | <code>Actor/TokenDocument,Boolean</code> | The actor/token that started to render the interface |

If the hook returns `false`, the action is interrupted.

### item-piles-preOpenInterface

Called before an item piles related interface has opened. The supported interfaces are the ones for regular item piles
and merchants.

| Param         | Type                                     | Description                                                                                     |
|---------------|------------------------------------------|-------------------------------------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code>         | The item pile actor                                                                             |
| recipient     | <code>Actor/TokenDocument,Boolean</code> | The actor that opened the interface                                                             |
| options       | <code>object</code>                      | An object containing options regarding how to render the application                            |
| dialogOptions | <code>object</code>                      | An object containing settings how the SvelteApplication behaves (separate from the application) |

If the hook returns `false`, the action is interrupted.

### item-piles-openInterface

Called after an item piles related interface has been opened. The supported interfaces are the ones for regular item
piles
and merchants.

| Param         | Type                                     | Description                                                                                     |
|---------------|------------------------------------------|-------------------------------------------------------------------------------------------------|
| app           | <code>SvelteApplication</code>           | The application that was rendered                                                               |
| source        | <code>Actor/TokenDocument</code>         | The item pile actor                                                                             |
| recipient     | <code>Actor/TokenDocument,Boolean</code> | The actor that opened the interface                                                             |
| options       | <code>object</code>                      | An object containing options regarding how to render the application                            |
| dialogOptions | <code>object</code>                      | An object containing settings how the SvelteApplication behaves (separate from the application) |

### item-piles-preCloseInterface

Called before an item piles related interface is closed.

| Param     | Type                                     | Description                                                       |
|-----------|------------------------------------------|-------------------------------------------------------------------|
| app       | <code>SvelteApplication</code>           | The application to be closed                                      |
| source    | <code>Actor/TokenDocument</code>         | The item pile actor                                               |
| recipient | <code>Actor/TokenDocument,Boolean</code> | The actor that was involved in opening the interface              |
| options   | <code>object</code>                      | An object containing options regarding how to close the interface |

If the hook returns `false`, the action is interrupted.

### item-piles-closeInterface

Called after an item piles related interface is closed.

| Param     | Type                                     | Description                                                       |
|-----------|------------------------------------------|-------------------------------------------------------------------|
| app       | <code>SvelteApplication</code>           | The application that was closed                                   |
| source    | <code>Actor/TokenDocument</code>         | The item pile actor                                               |
| recipient | <code>Actor/TokenDocument,Boolean</code> | The actor that was involved in opening the interface              |
| options   | <code>object</code>                      | An object containing options regarding how to close the interface |

### item-piles-renderVaultGridItem

Called when an element in a vault grid is rendered.

**Note:** This is called when the element is rendered, but _also_ when the item document is updated.

| Param   | Type                     | Description                 |
|---------|--------------------------|-----------------------------|
| element | <code>HTMLElement</code> | The vault item HTML element |
| item    | <code>Item</code>        | The vault item document     |

## Item Piles

### item-piles-preCreateItemPile

Called before an item pile is going to be created.

| Param         | Type                        | Description                                                                          |
|---------------|-----------------------------|--------------------------------------------------------------------------------------|
| position      | <code>object</code>         | The position where to create the item pile                                           |
| items         | <code>array,boolean</code>  | Any items to create on the item pile                                                 |
| pileActorName | <code>string/boolean</code> | The actor name of the pile to create, if false, it defaults to the default item pile |

If the hook returns `false`, the action is interrupted.

---

### item-piles-createItemPile

Called after an item pile has been created.

| Param    | Type                       | Description                                          |
|----------|----------------------------|------------------------------------------------------|
| document | <code>TokenDocument</code> | The document of the item pile token that was created |
| flagData | <code>object</code>        | The flag data of the item pile                       |

---

### item-piles-preUpdateItemPile

Called before an item pile is going to be updated (only through the API).

| Param            | Type                               | Description                                                                              |
|------------------|------------------------------------|------------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile that is going to be updated                                |
| newData          | <code>object</code>                | The new data that is going to be modified on the item pile                               |
| interactingToken | <code>TokenDocument,boolean</code> | If the update was caused by another token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-updateItemPile

Called after an item pile has been updated (only through the API).

| Param            | Type                               | Description                                                                              |
|------------------|------------------------------------|------------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile that was updated                                           |
| diffData         | <code>string/boolean</code>        | The difference between the item pile's old data and new data                             |
| interactingToken | <code>TokenDocument,boolean</code> | If the update was caused by another token, this will be a TokenDocument, otherwise false |

---

### item-piles-preDeleteItemPile

Called before an item pile is going to be deleted (only through the module's settings or its API).

| Param  | Type                       | Description                                               |
|--------|----------------------------|-----------------------------------------------------------|
| target | <code>TokenDocument</code> | The document of the item pile that is going to be deleted |

If the hook returns `false`, the action is interrupted.

---

### item-piles-deleteItemPile

Called after an item pile has been deleted.

| Param  | Type                       | Description                                         |
|--------|----------------------------|-----------------------------------------------------|
| target | <code>TokenDocument</code> | The document of the item pile that has been deleted |

---

### item-piles-preCloseItemPile

Called before an item pile is going to be closed.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be closed                                |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-closeItemPile

Called after an item pile has been closed.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been closed                                      |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

---

### item-piles-preOpenItemPile

Called before an item pile is going to be opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be opened                                |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-openItemPile

Called after an item pile has been opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been opened                                      |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

---

### item-piles-preLockItemPile

Called before an item pile is going to be locked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be locked                                |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-lockItemPile

Called after an item pile has been locked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been locked                                      |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

---

### item-piles-preUnlockItemPile

Called before an item pile is going to be unlocked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be unlocked                              |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-unlockItemPile

Called after an item pile has been unlocked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been unlocked                                    |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

---

### item-piles-preUnlockItemPile

Called before a locked item pile is going to be attempted to be opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the locked item pile is going to be attempted to be opened         |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-unlockItemPile

Called after a locked item pile was attempted to be opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the locked item pile that was attempted to be opened               |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

---

### item-piles-preTurnIntoItemPiles

Called before a token is turned into an item pile.

| Param         | Type                       | Description                                                         |
|---------------|----------------------------|---------------------------------------------------------------------|
| target        | <code>TokenDocument</code> | The token that is going to be turned into an item pile              |
| pileSettings  | <code>object</code>        | Any overriding item pile settings that the token and actor will get |
| tokenSettings | <code>object</code>        | Any overriding token settings that the token will get               |

If the hook returns `false`, the action is interrupted.

---

### item-piles-turnIntoItemPiles

Called after a token has been turned into an item pile.

| Param           | Type                | Description                                 |
|-----------------|---------------------|---------------------------------------------|
| target          | <code>string</code> | The token that was turned into an item pile |
| newPileSettings | <code>object</code> | The resulting item pile's settings          |

---

### item-piles-preRevertFromItemPiles

Called before a token is reverted from an item pile into a normal token.

| Param         | Type                       | Description                                              |
|---------------|----------------------------|----------------------------------------------------------|
| target        | <code>TokenDocument</code> | The token that is going to be reverted from an item pile |
| tokenSettings | <code>object</code>        | Any overriding token settings that the token will get    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-revertFromItemPiles

Called after a token has been reverted from an item pile into a normal token.

| Param  | Type                             | Description                                   |
|--------|----------------------------------|-----------------------------------------------|
| target | <code>Actor/TokenDocument</code> | The token that was reverted from an item pile |

---

### item-piles-preOpenItemPileInventory

Called before an item pile's inventory UI is opened.

| Param            | Type                               | Description                                                  |
|------------------|------------------------------------|--------------------------------------------------------------|
| itemPileToken    | <code>TokenDocument</code>         | The item pile token whose inventory is going to be opened    |
| interactingToken | <code>TokenDocument/boolean</code> | The token that is going to be interacting with the item pile |

If the hook returns `false`, the action is interrupted.

---

### item-piles-openItemPileInventory

Called after an item pile's inventory UI has been opened.

| Param            | Type                               | Description                                  |
|------------------|------------------------------------|----------------------------------------------|
| app              | <code>FormApplication</code>       | The item pile's inventory formapplication    |
| itemPileToken    | <code>TokenDocument</code>         | The item pile whose inventory was opened     |
| interactingToken | <code>TokenDocument/boolean</code> | The token that interacted with the item pile |

---

### item-piles-preSplitItemPileContent

Called before the content of an item pile is going to be split.

| Param      | Type                             | Description                                                 |
|------------|----------------------------------|-------------------------------------------------------------|
| target     | <code>TokenDocument/Actor</code> | The item pile whose content that is going to be split       |
| targets    | <code>array<Actor></code>        | An array of actors who is going to be splitting the content |
| userId     | <code>string/boolean</code>      | The ID of the user that initiated this action               |
| instigator | <code>Actor</code>               | The actor that initiated this action                        |

If the hook returns `false`, the action is interrupted.

---

### item-piles-splitItemPileContent

Called after the content of an item pile has been split.

| Param        | Type                             | Description                                                            |
|--------------|----------------------------------|------------------------------------------------------------------------|
| target       | <code>TokenDocument/Actor</code> | The item pile whose content was just split                             |
| transferData | <code>object</code>              | The data of the items that were split, keyed by type and by actor UUID |
| userId       | <code>string/boolean</code>      | The ID of the user that initiated this action                          |
| instigator   | <code>Actor</code>               | The actor that initiated this action                                   |

---

### item-piles-preClickItemPile

Called before resolving a click on an item pile token

| Param            | Type                       | Description                                                    |
|------------------|----------------------------|----------------------------------------------------------------|
| target           | <code>TokenDocument</code> | The item pile token that was clicked                           |
| interactingActor | <code>Actor</code>         | The actor of the user that interacted with the item pile token |

If the hook returns `false`, the action is interrupted.

---

### item-piles-preRefreshInventory

Called before a merchant has had their inventory refreshed by item piles

| Param   | Type                | Description                                                                              |
|---------|---------------------|------------------------------------------------------------------------------------------|
| actor   | <code>Actor</code>  | The merchant actor that is going to have its inventory refreshed                         |
| changes | <code>Object</code> | The object containing all of the information that is going to be altered on the merchant |

If the hook returns `false`, the action is interrupted.

---

## Items

### item-piles-preDropItemDetermined

Called before the target of the drop action was determined (position or otherwise).

| Param    | Type                               | Description                                                                                                                      |
|----------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| source   | <code>Actor</code>                 | The actor or token document is going to be dropping the item                                                                     |
| target   | <code>TokenDocument/boolean</code> | The token document of the item pile that the item is going to be dropped on on, or false if it was not on an existing item pile  |
| itemData | <code>object</code>                | The data of the item that is going to be be dropped                                                                              |
| position | <code>object/boolean</code>        | The position on the canvas where the item is going to be dropped, or false if it is going to be dropped on an existing item pile |

If the hook returns `false`, the action is interrupted.

---

### item-piles-preDropItem

Called before an item is dropped on the canvas.

| Param    | Type                               | Description                                                                                                                      |
|----------|------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| source   | <code>Actor</code>                 | The actor or token document is going to be dropping the item                                                                     |
| target   | <code>TokenDocument/Boolean</code> | The token document of the item pile that the item is going to be dropped on on, or false if it was not on an existing item pile  |
| itemData | <code>object</code>                | The data of the item that is going to be be dropped                                                                              |
| position | <code>object/boolean</code>        | The position on the canvas where the item is going to be dropped, or false if it is going to be dropped on an existing item pile |
| quantity | <code>number</code>                | The quantity of the item that is going to be dropped                                                                             |

If the hook returns `false`, the action is interrupted.

---

### item-piles-dropItem

Called after an item has been dropped on the canvas.

| Param    | Type                             | Description                                                                                                         |
|----------|----------------------------------|---------------------------------------------------------------------------------------------------------------------|
| source   | <code>Actor/TokenDocument</code> | The actor or token document that dropped the item                                                                   |
| target   | <code>Actor/TokenDocument</code> | The token document of the item pile that the item was dropped on, which may have been created as a part of the drop |
| itemData | <code>object</code>              | The data of the item that was dropped                                                                               |
| position | <code>object/boolean</code>      | The position on the canvas where the item was dropped                                                               |
| quantity | <code>number</code>              | The quantity of the item that was dropped                                                                           |

---

### item-piles-preAddItems

Called before an item is added to the target. This is not called in any transfers.

| Param         | Type                             | Description                                                                               |
|---------------|----------------------------------|-------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target that is going to receive the items                                             |
| itemsToCreate | <code>array</code>               | An array of objects each containing the item and the quantity that is going to be created |
| itemsToUpdate | <code>array</code>               | An array of objects each containing the item and the quantity that is going to be updated |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                 |

If the hook returns `false`, the action is interrupted.

---

### item-piles-addItems

Called after an item has been added to the target. This is not called in any transfers.

| Param         | Type                             | Description                                                                    |
|---------------|----------------------------------|--------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target that received the items                                             |
| itemDeltas    | <code>array</code>               | An array of objects each containing the item and the quantity that was changed |
| userId        | <code>string</code>              | The ID of the user that initiated this action                                  |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                      |

---

### item-piles-preRemoveItems

Called before an item is removed from the target. This is not called in any transfers.

| Param         | Type                             | Description                                                                               |
|---------------|----------------------------------|-------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target that is going to have items removed                                            |
| itemsToDelete | <code>array</code>               | An array of objects each containing the item id that is going to be deleted               |
| itemsToUpdate | <code>array</code>               | An array of objects each containing the item and the quantity that is going to be updated |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                 |

If the hook returns `false`, the action is interrupted.

---

### item-piles-removeItems

Called after an item has been removed from the target. This is not called in any transfers.

| Param         | Type                             | Description                                                                    |
|---------------|----------------------------------|--------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target that had items removed                                              |
| itemDeltas    | <code>array</code>               | An array of objects each containing the item and the quantity that was changed |
| userId        | <code>string</code>              | The ID of the user that initiated this action                                  |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                      |

---

### item-piles-preTransferItems

Called before items are transferred from the source to the target.

| Param         | Type                             | Description                                               |
|---------------|----------------------------------|-----------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer its items            |
| sourceUpdates | <code>object</code>              | An object containing the updated items on the source      |
| target        | <code>Actor/TokenDocument</code> | The target that is going to receive the items             |
| targetUpdates | <code>object</code>              | An object containing the updated items on the target      |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferItems

Called after items have been transferred from the source to the target.

| Param         | Type                             | Description                                                                                     |
|---------------|----------------------------------|-------------------------------------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that transferred items                                                               |
| target        | <code>Actor/TokenDocument</code> | The target that received the items                                                              |
| itemDeltas    | <code>array</code>               | An array of objects each containing the item id and the quantity that was changed on the target |
| userId        | <code>string</code>              | The ID of the user that initiated this action                                                   |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                       |

---

### item-piles-preTransferAllItems

Called before all items are transferred from the source to the target.

| Param         | Type                             | Description                                               |
|---------------|----------------------------------|-----------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer all of its items     |
| sourceUpdates | <code>object</code>              | An object containing the updated items on the source      |
| target        | <code>Actor/TokenDocument</code> | The target that is going to receive all of the items      |
| targetUpdates | <code>object</code>              | An object containing the updated items on the target      |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAllItems

Called after all items has been transferred from the source to the target.

| Param         | Type                             | Description                                                                                     |
|---------------|----------------------------------|-------------------------------------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that transferred all of its items                                                    |
| target        | <code>Actor/TokenDocument</code> | The target that received all of the items                                                       |
| itemDeltas    | <code>array</code>               | An array of objects each containing the item id and the quantity that was changed on the target |
| userId        | <code>string</code>              | The ID of the user that initiated this action                                                   |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                       |

---

### item-piles-preCalculateTradeItems

Called before a trade between a merchant and an actor has determined what items need to be transferred.

| Param         | Type                        | Description                                               |
|---------------|-----------------------------|-----------------------------------------------------------|
| sellingActor  | <code>Actor</code>          | The source actor that will sell the items                 |
| buyingActor   | <code>Actor</code>          | The target actor that will purchase the items             |
| itemPrices    | <code>array</code>          | An array containing the final prices                      |
| userId        | <code>string</code>         | The ID of the user that initiated this action             |
| interactionId | <code>string/boolean</code> | The ID of this interaction, to identify ongoing transfers |

---

### item-piles-preTradeItems

Called before a trade between a merchant and an actor has been finalized.

| Param         | Type                        | Description                                               |
|---------------|-----------------------------|-----------------------------------------------------------|
| sellingActor  | <code>Actor</code>          | The source actor that will sell the items                 |
| sellerUpdates | <code>object</code>         | An object containing the updates to apply to the seller   |
| buyingActor   | <code>Actor</code>          | The target actor that will purchase the items             |
| buyerUpdates  | <code>object</code>         | An object containing the updates to apply to the buyer    |
| userId        | <code>string</code>         | The ID of the user that initiated this action             |
| interactionId | <code>string/boolean</code> | The ID of this interaction, to identify ongoing transfers |

If the hook returns `false`, the action is interrupted.

---

### item-piles-tradeItems

Called before a trade between a merchant and an actor has been finalized.

| Param         | Type                        | Description                                               |
|---------------|-----------------------------|-----------------------------------------------------------|
| sellingActor  | <code>Actor</code>          | The source actor that will sell the items                 |
| sellerUpdates | <code>object</code>         | An object containing the updates to apply to the seller   |
| buyingActor   | <code>Actor</code>          | The target actor that will purchase the items             |
| buyerUpdates  | <code>object</code>         | An object containing the updates to apply to the buyer    |
| userId        | <code>string</code>         | The ID of the user that initiated this action             |
| interactionId | <code>string/boolean</code> | The ID of this interaction, to identify ongoing transfers |

---

### item-piles-preGiveItem

Called before the user has sent the request to give an item to another user's actor.

| Param        | Type                | Description                                      |
|--------------|---------------------|--------------------------------------------------|
| source       | <code>Actor</code>  | The source actor that will give the item         |
| target       | <code>Actor</code>  | The target actor that will receive the item      |
| item         | <code>Object</code> | The item data to be given                        |
| sourceUserId | <code>string</code> | The ID of the user that initiated this action    |
| targetUserId | <code>string</code> | The ID of the user that will receive the request |

If the hook returns `false`, the action is interrupted.

---

### item-piles-giveItem

Called after a user gave an item to another user's actor.

| Param        | Type                | Description                                     |
|--------------|---------------------|-------------------------------------------------|
| source       | <code>Actor</code>  | The source actor that gave the item             |
| target       | <code>Actor</code>  | The target actor that received the item         |
| item         | <code>Object</code> | The item data that was given                    |
| sourceUserId | <code>string</code> | The ID of the user that initiated this action   |
| targetUserId | <code>string</code> | The ID of the user that accepted the given item |

---

## Attributes

### item-piles-preAddAttributes

Called before attributes on the target are added to. Not called in the case of a transfer.

| Param         | Type                             | Description                                                                                                                  |
|---------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target whose attribute's value will be added to                                                                          |
| actorUpdates  | <code>object</code>              | An object, where the keys are the attribute that is going to be updated, the value being the quantity is going to be changed |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-addAttributes

Called after attributes on the target have been added to. Not called in the case of a transfer.

| Param           | Type                             | Description                                                                                                     |
|-----------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| target          | <code>Actor/TokenDocument</code> | The target whose attributes' values has been added to                                                           |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                   |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                       |

---

### item-piles-preSetAttributes

Called before attributes on the target are set. Not called in the case of a transfer.

| Param         | Type                             | Description                                                                                                                  |
|---------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target whose attribute's value will be set                                                                               |
| actorUpdates  | <code>object</code>              | An object, where the keys are the attribute that is going to be updated, the value being the quantity is going to be changed |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-setAttributes

Called after attributes on the target have been set. Not called in the case of a transfer.

| Param           | Type                             | Description                                                                                                     |
|-----------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| target          | <code>Actor/TokenDocument</code> | The target whose attributes' values has been set                                                                |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                   |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                       |

---

### item-piles-preRemoveAttributes

Called before attributes on the target are subtracted from. Not called in the case of a transfer.

| Param         | Type                             | Description                                                                                                                  |
|---------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument</code> | The target whose attributes values' will be subtracted from                                                                  |
| actorUpdates  | <code>object</code>              | An object, where the keys are the attribute that is going to be updated, the value being the quantity is going to be changed |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-removeAttributes

Called after attributes on the target have been subtracted from. Not called in the case of a transfer.

| Param           | Type                             | Description                                                                                                     |
|-----------------|----------------------------------|-----------------------------------------------------------------------------------------------------------------|
| target          | <code>Actor/TokenDocument</code> | The target whose attributes values' has been subtracted from                                                    |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                   |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                       |

---

### item-piles-preTransferAttributes

Called before an attribute's value is transferred from the source to the target.

| Param         | Type                             | Description                                                                                                                                |
|---------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer its attributes' values                                                                                |
| sourceUpdates | <code>object</code>              | An object, where the keys are the attribute that is going to be updated on the source, the value being the quantity is going to be changed |
| target        | <code>Actor/TokenDocument</code> | The target whose attributes' values will added to                                                                                          |
| targetUpdates | <code>object</code>              | An object, where the keys are the attribute that is going to be updated on the source, the value being the quantity is going to be changed |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                                  |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAttributes

Called after an attribute's value has been transferred from the source to the target.

| Param           | Type                             | Description                                                                                                                   |
|-----------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The source that transferred its attributes' values                                                                            |
| target          | <code>Actor/TokenDocument</code> | The target that received the attributes' values                                                                               |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated on the target, and the value being the quantity that was changed |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                                 |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                     |

---

### item-piles-preTransferAllAttributes

Called before all attributes' values are transferred from the source to the target.

| Param         | Type                             | Description                                                                                                                                |
|---------------|----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer all of its attributes' values                                                                         |
| sourceUpdates | <code>object</code>              | An object, where the keys are the attribute that is going to be updated on the source, the value being the quantity is going to be changed |
| target        | <code>Actor/TokenDocument</code> | The target whose attributes' values will added to                                                                                          |
| targetUpdates | <code>object</code>              | An object, where the keys are the attribute that is going to be updated on the source, the value being the quantity is going to be changed |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                                  |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAllAttributes

Called after all attributes' values was transferred from the source to the target.

| Param           | Type                             | Description                                                                                                                   |
|-----------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The source that transferred all of its attributes' values                                                                     |
| target          | <code>Actor/TokenDocument</code> | The target that received all of the attributes' values                                                                        |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated on the target, and the value being the quantity that was changed |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                                 |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                     |

---

## Currencies

### item-piles-preUpdateCurrencies

Called before currencies are updated to an actor. Not called in the case of a transfer.

| Param         | Type                                  | Description                                                                                                                  |
|---------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument/UUID</code> | The target that will have currencies added to it                                                                             |
| actorUpdates  | <code>object</code>                   | An object, where the keys are the attribute that is going to be updated, the value being the quantity is going to be changed |
| itemsToCreate | <code>array</code>                    | An array of objects each containing the item id and the quantity that was added                                              |
| itemsToUpdate | <code>array</code>                    | An array of objects each containing the item id and the quantity that was updated                                            |
| interactionId | <code>string/boolean</code>           | The ID of this interaction, to identify ongoing transfers                                                                    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-updateCurrencies

Called after currencies were updated to the target. Not called in the case of a transfer.

| Param           | Type                                  | Description                                                                                                     |
|-----------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| target          | <code>Actor/TokenDocument/UUID</code> | The target whose currencies were added to                                                                       |
| itemDeltas      | <code>array</code>                    | An array of objects each containing the item id and the quantity that was changed                               |
| attributeDeltas | <code>object</code>                   | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed |
| userId          | <code>string</code>                   | The ID of the user that initiated this action                                                                   |
| interactionId   | <code>string/boolean</code>           | The ID of this interaction, to identify ongoing transfers                                                       |

---

### item-piles-preAddCurrencies

Called before currencies are added to an actor. Not called in the case of a transfer.

| Param         | Type                                  | Description                                                                                                                  |
|---------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument/UUID</code> | The target that will have currencies added to it                                                                             |
| actorUpdates  | <code>object</code>                   | An object, where the keys are the attribute that is going to be updated, the value being the quantity is going to be changed |
| itemsToCreate | <code>array</code>                    | An array of objects each containing the item id and the quantity that was added                                              |
| itemsToUpdate | <code>array</code>                    | An array of objects each containing the item id and the quantity that was updated                                            |
| interactionId | <code>string/boolean</code>           | The ID of this interaction, to identify ongoing transfers                                                                    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-addCurrencies

Called after currencies were added to the target. Not called in the case of a transfer.

| Param           | Type                                  | Description                                                                                                     |
|-----------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| target          | <code>Actor/TokenDocument/UUID</code> | The target whose currencies were added to                                                                       |
| itemDeltas      | <code>array</code>                    | An array of objects each containing the item id and the quantity that was changed                               |
| attributeDeltas | <code>object</code>                   | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed |
| userId          | <code>string</code>                   | The ID of the user that initiated this action                                                                   |
| interactionId   | <code>string/boolean</code>           | The ID of this interaction, to identify ongoing transfers                                                       |

---

### item-piles-preRemoveCurrencies

Called before currencies were removed from the target. Not called in the case of a transfer.

| Param         | Type                                  | Description                                                                                                                  |
|---------------|---------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| target        | <code>Actor/TokenDocument/UUID</code> | The target that will have its currencies removed                                                                             |
| actorUpdates  | <code>object</code>                   | An object, where the keys are the attribute that is going to be updated, the value being the quantity is going to be changed |
| itemsToUpdate | <code>array</code>                    | An array of objects each containing the item id and the quantity that was updated                                            |
| interactionId | <code>string/boolean</code>           | The ID of this interaction, to identify ongoing transfers                                                                    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-removeCurrencies

Called after currencies was removed from the target. Not called in the case of a transfer.

| Param           | Type                                  | Description                                                                                                     |
|-----------------|---------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| target          | <code>Actor/TokenDocument/UUID</code> | The target whose currencies were removed from                                                                   |
| itemDeltas      | <code>array</code>                    | An array of objects each containing the item id and the quantity that was changed                               |
| attributeDeltas | <code>object</code>                   | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed |
| userId          | <code>string</code>                   | The ID of the user that initiated this action                                                                   |
| interactionId   | <code>string/boolean</code>           | The ID of this interaction, to identify ongoing transfers                                                       |

---

### item-piles-preTransferCurrencies

Called before currencies are transferred from the source to the target.

| Param         | Type                             | Description                                                         |
|---------------|----------------------------------|---------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer its currencies                 |
| sourceUpdates | <code>object</code>              | An object containing the updated items and attributes on the source |
| target        | <code>Actor/TokenDocument</code> | The target that is going to receive the currencies                  |
| targetUpdates | <code>object</code>              | An object containing the updated items and attributes on the target |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers           |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferCurrencies

Called after currencies have been transferred from the source to the target.

| Param           | Type                             | Description                                                                                                                   |
|-----------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The source that transferred currencies                                                                                        |
| target          | <code>Actor/TokenDocument</code> | The target that received the currencies                                                                                       |
| itemDeltas      | <code>array</code>               | An array of objects each containing the item id and the quantity that was changed on the target                               |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed on the target |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                                 |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                     |

---

### item-piles-preTransferAllCurrencies

Called before all the source's currencies are transferred from the source to the target.

| Param         | Type                             | Description                                                         |
|---------------|----------------------------------|---------------------------------------------------------------------|
| source        | <code>Actor/TokenDocument</code> | The source that is going to transfer all of its currencies          |
| sourceUpdates | <code>object</code>              | An object containing the updated items and attributes on the source |
| target        | <code>Actor/TokenDocument</code> | The target that is going to receive all of the currencies           |
| targetUpdates | <code>object</code>              | An object containing the updated items and attributes on the target |
| interactionId | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers           |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAllCurrencies

Called after all the source's currencies were transferred from the source to the target.

| Param           | Type                             | Description                                                                                                                   |
|-----------------|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The source that transferred all of its currencies                                                                             |
| target          | <code>Actor/TokenDocument</code> | The target that received all of the currencies                                                                                |
| itemDeltas      | <code>array</code>               | An array of objects each containing the item id and the quantity that was changed on the target                               |
| attributeDeltas | <code>object</code>              | An object, where the keys are the attribute that was updated, and the value being the quantity that was changed on the target |
| userId          | <code>string</code>              | The ID of the user that initiated this action                                                                                 |
| interactionId   | <code>string/boolean</code>      | The ID of this interaction, to identify ongoing transfers                                                                     |

---

## Trading

### item-piles-tradeStarted

Called when a trade between two users has started. If it is private, only the two users involved will have the hook
called.

| Param         | Type                                                   | Description                          |
|---------------|--------------------------------------------------------|--------------------------------------|
| firstUser     | <code>Object\<{ user: string, actor: string }\></code> | The first party of the trade         |
| secondUser    | <code>Object\<{ user: string, actor: string }\></code> | The second party of the trade        |
| publicTradeId | <code>string</code>                                    | The public ID of this trade          |
| isPrivate     | <code>boolean</code>                                   | Whether this trade is private or not |

If the hook returns `false`, the action is interrupted.

---

### item-piles-tradeComplete

Called after a trade between two users has been completed.

| Param   | Type                | Description                                                               |
|---------|---------------------|---------------------------------------------------------------------------|
| tradeId | <code>string</code> | The public ID of this trade                                               |
| updates | <code>object</code> | An object containing the updates that is going to be applied to this user |
