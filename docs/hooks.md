# Table of Contents

- [Generic](#Generic)
  - [item-piles-ready](#item-piles-ready)

- [Specific](#Specific)
    - [item-piles-preTransferEverything](#item-piles-preTransferEverything)
    - [item-piles-transferEverything](#item-piles-transferEverything)

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

- [Items](#Items)
  - [item-piles-preDropItems](#item-piles-preDropItems)
  - [item-piles-dropItems](#item-piles-dropItems)
  - [item-piles-preTransferItems](#item-piles-preTransferItems)
  - [item-piles-transferItemss](#item-piles-transferItems)
  - [item-piles-preAddItems](#item-piles-preAddItems)
  - [item-piles-addItems](#item-piles-addItems)
  - [item-piles-preRemoveItems](#item-piles-preRemoveItems)
  - [item-piles-removeItems](#item-piles-removeItems)
  - [item-piles-preTransferAllItems](#item-piles-preTransferAllItems)
  - [item-piles-transferAllItems](#item-piles-transferAllItems)

- [Attributes](#Attributes)
  - [item-piles-preTransferAttributes](#item-piles-preTransferAttributes)
  - [item-piles-transferAttributes](#item-piles-transferAttributess)
  - [item-piles-preAddAttributes](#item-piles-preAddAttributes)
  - [item-piles-addAttributes](#item-piles-addAttributes)
  - [item-piles-preRemoveAttributes](#item-piles-preRemoveAttributes)
  - [item-piles-removeAttributes](#item-piles-removeAttributes)
  - [item-piles-preTransferAllAttributes](#item-piles-preTransferAllAttributes)
  - [item-piles-transferAllAttributes](#item-piles-transferAllAttributes)

---

## Generic

### item-piles-ready

Called when the module is ready.

| Param | Type                   | Description              |
|-------|------------------------|--------------------------|
| api   | <code>Class API</code> | The item piles API class |

---

## Specific

### item-piles-preTransferEverything

Called before all items and attributes are going to be transferred from the source to the target.

| Param           | Type                             | Description                                                                       |
|-----------------|----------------------------------|-----------------------------------------------------------------------------------|
| source          | <code>Actor,TokenDocument</code> | The Actor or Token that is going to have all its items and attributes transferred |
| target          | <code>Actor,TokenDocument</code> | The Actor or Token that is going to receive all of the items and attributes       |
| itemTypeFilters | <code>array,boolean</code>       | Array of item types to filter - will default to module settings if none provided  |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferEverything

Called after all items and attributes have been transferred from the source to the target.

| Param             | Type                | Description                                                                 |
|-------------------|---------------------|-----------------------------------------------------------------------------|
| source        | <code>Actor,TokenDocument</code> | The source that had all of its items and attributes transferred    |
| target        | <code>Actor,TokenDocument</code> | The target that received all of the items and attributes           |
| items      | <code>array</code>  | An array containing all of the items that were transferred to the target                  |
| attributes | <code>array</code>  | An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred                                   |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

## Item Piles

### item-piles-preCreateItemPile

Called before an item pile is going to be created.

| Param         | Type                        | Description                                                                          |
|---------------|-----------------------------|--------------------------------------------------------------------------------------|
| position      | <code>object</code>         | The position where to create the item pile                                           |
| items | <code>array,boolean</code> | Any items to create on the item pile |
| pileActorName | <code>string,boolean</code> | The actor name of the pile to create, if false, it defaults to the default item pile |

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
| target           | <code>Token,TokenDocument</code>   | The document of the item pile that is going to be updated                                |
| newData          | <code>object</code>                | The new data that is going to be modified on the item pile                               |
| interactingToken | <code>TokenDocument,boolean</code> | If the update was caused by another token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-updateItemPile

Called after an item pile has been updated (only through the API).

| Param            | Type                               | Description                                                                              |
|------------------|------------------------------------|------------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile that was updated                                           |
| diffData         | <code>string,boolean</code>        | The difference between the item pile's old data and new data                             |
| interactingToken | <code>TokenDocument,boolean</code> | If the update was caused by another token, this will be a TokenDocument, otherwise false |

---

### item-piles-preDeleteItemPile

Called before an item pile is going to be deleted (only through the module's settings or its API).

| Param   | Type                               | Description                                               |
|---------|------------------------------------|-----------------------------------------------------------|
| target  | <code>Token,TokenDocument</code>   | The document of the item pile that is going to be deleted |

If the hook returns `false`, the action is interrupted.

---

### item-piles-deleteItemPile

Called after an item pile has been deleted.

| Param   | Type                               | Description                                         |
|---------|------------------------------------|-----------------------------------------------------|
| target  | <code>Token,TokenDocument</code>   | The document of the item pile that has been deleted |

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
| target           | <code>TokenDocument</code>         | The document of the locked item pile is going to be attempted to be opened                              |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

---

### item-piles-unlockItemPile

Called after a locked item pile was attempted to be opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the locked item pile that was attempted to be opened                                    |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

---

### item-piles-preTurnIntoItemPiles

Called before a token is turned into an item pile.

| Param          | Type                              | Description                                                         |
|----------------|-----------------------------------|---------------------------------------------------------------------|
| target         | <code>Token,TokenDocument</code>  | The token that is going to be turned into an item pile              |
| pileSettings   | <code>object</code>               | Any overriding item pile settings that the token and actor will get |
| tokenSettings  | <code>object</code>               | Any overriding token settings that the token will get               |

If the hook returns `false`, the action is interrupted.

---

### item-piles-turnIntoItemPiles

Called after a token has been turned into an item pile.

| Param           | Type                | Description                                             |
|-----------------|---------------------|---------------------------------------------------------|
| target      | <code>string</code> | The token that was turned into an item pile |
| newPileSettings | <code>object</code> | The resulting item pile's settings                      |

---

### item-piles-preRevertFromItemPiles

Called before a token is reverted from an item pile into a normal token.

| Param          | Type                              | Description                                              |
|----------------|-----------------------------------|----------------------------------------------------------|
| target         | <code>Token,TokenDocument</code>  | The token that is going to be reverted from an item pile |
| tokenSettings  | <code>object</code>               | Any overriding token settings that the token will get    |

If the hook returns `false`, the action is interrupted.

---

### item-piles-revertFromItemPiles

Called after a token has been reverted from an item pile into a normal token.

| Param           | Type                | Description                                               |
|-----------------|---------------------|-----------------------------------------------------------|
| target      | <code>Actor,TokenDocument</code> | The token that was reverted from an item pile |

---

### item-piles-preOpenItemPileInventory

Called before an item pile's inventory UI is opened.

| Param          | Type                              | Description                                              |
|----------------|-----------------------------------|----------------------------------------------------------|
| itemPileToken         | <code>TokenDocument</code>  | The item pile token whose inventory is going to be opened |
| interactingToken  | <code>TokenDocument/boolean</code>               | The token that is going to be interacting with the item pile |

If the hook returns `false`, the action is interrupted.

---

### item-piles-openItemPileInventory

Called after an item pile's inventory UI has been opened.

| Param            | Type                | Description                                               |
|------------------|---------------------|-----------------------------------------------------------|
| app    | <code>FormApplication</code>  | The item pile's inventory formapplication |
| itemPileToken    | <code>TokenDocument</code>  | The item pile whose inventory was opened |
| interactingToken | <code>TokenDocument/boolean</code>               | The token that interacted with the item pile |

---

### item-piles-preSplitItemPileContent

Called before the content of an item pile is going to be split.

| Param            | Type                | Description                                               |
|------------------|---------------------|-----------------------------------------------------------|
| target    | <code>TokenDocument/Actor</code>  | The item pile whose content that is going to be split |
| targets    | <code>array<Actor></code>  | An array of actors who is going to be splitting the content |
| userId | <code>string/boolean</code>               | The ID of the user that initiated this action |
| instigator | <code>Actor</code>               | The actor that initiated this action |

If the hook returns `false`, the action is interrupted.

---

### item-piles-splitItemPileContent

Called after the content of an item pile has been split.

| Param            | Type                | Description                                               |
|------------------|---------------------|-----------------------------------------------------------|
| target    | <code>TokenDocument/Actor</code>  | The item pile whose content was just split |
| transferData    | <code>object</code>  | The data of the items that were split, keyed by type and by actor UUID |
| userId | <code>string/boolean</code>               | The ID of the user that initiated this action |
| instigator | <code>Actor</code>               | The actor that initiated this action |

---

## Items

### item-piles-preDropItem

Called before an item is dropped on the canvas.

| Param    | Type                        | Description                                                                                                                      |
|----------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| source   | <code>Actor</code>          | The actor or token document is going to be dropping the item                                                                     |
| target   | <code>TokenDocument</code>  | The token document of the item pile that the item is going to be dropped on on, or false if it was not on an existing item pile  |
| itemData | <code>object</code>         | The data of the item that is going to be be dropped                                                                              |
| position | <code>object,boolean</code> | The position on the canvas where the item is going to be dropped, or false if it is going to be dropped on an existing item pile |
| quantity | <code>number</code>         | The quantity of the item that is going to be dropped                                                                             |

If the hook returns `false`, the action is interrupted.

---

### item-piles-dropItem

Called after an item has been dropped on the canvas.

| Param      | Type                        | Description                                                                                                                     |
|------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| source | <code>Actor,TokenDocument</code>         | The actor or token document that dropped the item                                                                   |
| target | <code>Actor,TokenDocument</code>         | The token document of the item pile that the item was dropped on, which may have been created as a part of the drop |
| itemData   | <code>object</code>         | The data of the item that was dropped                                                                                           |
| position   | <code>object,boolean</code> | The position on the canvas where the item was dropped                                                                           |
| quantity   | <code>number</code>         | The quantity of the item that was dropped                                                                                       |

---

### item-piles-preAddItems

Called before an item is added to the target. This is not called in any transfers.

| Param    | Type                                   | Description                                        |
|----------|----------------------------------------|----------------------------------------------------|
| target   | <code>Actor,Token,TokenDocument</code> | The target that is going to receive the item       |
| items    | <code>array</code>                     | An array of objects each containing the item id (key "_id") and the quantity that it is going to be added (key "quantity") |
If the hook returns `false`, the action is interrupted.

---

### item-piles-addItems

Called after an item has been added to the target. This is not called in any transfers.

| Param      | Type                | Description                                       |
|------------|---------------------|---------------------------------------------------|
| target | <code>Actor,TokenDocument</code> | The target that has received the item |
| items      | <code>array</code>  | An array of objects, each containing the item that was added or updated, and the quantity that was added |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

### item-piles-preRemoveItems

Called before an item is removed from the target. This is not called in any transfers.

| Param    | Type                                   | Description                                          |
|----------|----------------------------------------|------------------------------------------------------|
| target   | <code>Actor,Token,TokenDocument</code> | The target that is going to have its item removed    |
| items    | <code>array</code>                     | An array of objects each containing the item id (key "_id") and the quantity that it is going to be removed (key "quantity") |

If the hook returns `false`, the action is interrupted.

---

### item-piles-removeItems

Called after an item has been removed from the target. This is not called in any transfers.

| Param      | Type                | Description                               |
|------------|---------------------|-------------------------------------------|
| target | <code>Actor,TokenDocument</code> | The target that lost the item |
| items      | <code>array</code>  | An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

### item-piles-preTransferItems

Called before items are transferred from the source to the target.

| Param    | Type                                   | Description                                              |
|----------|----------------------------------------|----------------------------------------------------------|
| source   | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer the item            |
| target   | <code>Actor,Token,TokenDocument</code> | The target that is going to receive the item             |
| items    | <code>array</code>                     | An array of objects each containing the item id (key "_id") and the quantity that it is going to be transferred (key "quantity") |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferItems

Called after an item has been transferred from the source to the target.

| Param      | Type                | Description                              |
|------------|---------------------|------------------------------------------|
| source | <code>Actor,TokenDocument</code> | The source that transferred the item     |
| target | <code>Actor,TokenDocument</code> | The target that received the item        |
| items      | <code>array</code>  | An array of objects, each containing the item that was added or updated, and the quantity that was transferred |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

### item-piles-preTransferAllItems

Called before all items are transferred from the source to the target.

| Param           | Type                                   | Description                                                                      |
|-----------------|----------------------------------------|----------------------------------------------------------------------------------|
| source          | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer all of its items                            |
| target          | <code>Actor,Token,TokenDocument</code> | The target that is going to receive all of the items                             |
| itemTypeFilters | <code>array,boolean</code>             | Array of item types to filter - will default to module settings if none provided |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAllItems

Called after all items has been transferred from the source to the target.

| Param             | Type                | Description                                                                 |
|-------------------|---------------------|-----------------------------------------------------------------------------|
| source        | <code>Actor,TokenDocument</code> | The source that had all of its items and attributes transferred |
| target        | <code>Actor,TokenDocument</code> | The target that received all of the items and attributes        |
| items             | <code>array</code>  | An array containing all of the items that were transferred to the target          |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

## Attributes

### item-piles-preAddAttributes

Called before the value of the attribute on the target is added to. Not called in the case of a transfer.

| Param     | Type                                   | Description                                            |
|-----------|----------------------------------------|--------------------------------------------------------|
| target    | <code>Actor,Token,TokenDocument</code> | The target whose attribute's value will be added to    |
| attributes | <code>array,object</code> | An array of strings for each attribute to add, or an object containing key-value pairs where the keys are the attribute path, and the values the amount to add |

If the hook returns `false`, the action is interrupted.

---

### item-piles-addAttributes

Called after the value of the attribute on the target has been added to. Not called in the case of a transfer.

| Param      | Type                | Description                                          |
|------------|---------------------|------------------------------------------------------|
| target | <code>Actor,TokenDocument</code> | The target whose attribute's value has been added to |
| attributes | <code>object</code> | An array containing a key value pair of the attribute path and the quantity of that attribute that was removed |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

### item-piles-preRemoveAttributes

Called before the value of the attribute on the target is removed from. Not called in the case of a transfer.

| Param     | Type                                   | Description                                                |
|-----------|----------------------------------------|------------------------------------------------------------|
| target    | <code>Actor,Token,TokenDocument</code> | The target whose attribute's value will be removed from    |
| attributes | <code>array,object</code> | An array of strings for each attribute to subtracted, or an object containing key-value pairs where the keys are the attribute path, and the values the amount to subtracted |

If the hook returns `false`, the action is interrupted.

---

### item-piles-removeAttributes

Called after the value of the attribute on the target has been removed from. Not called in the case of a transfer.

| Param      | Type                | Description                                              |
|------------|---------------------|----------------------------------------------------------|
| target | <code>Actor,TokenDocument</code> | The target whose attribute's value has been removed from |
| attributes | <code>object</code> | An array containing a key value pair of the attribute path and the quantity of that attribute that was removed |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

### item-piles-preTransferAttributes

Called before an attribute's value is transferred from the source to the target.

| Param     | Type                                   | Description                                                       |
|-----------|----------------------------------------|-------------------------------------------------------------------|
| source    | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer its attribute's value        |
| target    | <code>Actor,Token,TokenDocument</code> | The target that is going to receive the attribute's value         |
| attributes | <code>array,object</code> | An array of strings for each attribute to transfer, or an object containing key-value pairs where the keys are the attribute path, and the values the amount to transfer |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAttributes

Called after an attribute's value has been transferred from the source to the target.

| Param      | Type                | Description                                                   |
|------------|---------------------|---------------------------------------------------------------|
| source | <code>Actor,TokenDocument</code> | The source that transferred its attribute's value |
| target | <code>Actor,TokenDocument</code> | The target that received the attribute's value    |
| attributes | <code>object</code> | An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred |
| userId      | <code>string</code>  | The ID of the user that initiated this action |

---

### item-piles-preTransferAllAttributes

Called before all attributes' values are transferred from the source to the target.

| Param  | Type                                   | Description                                                        |
|--------|----------------------------------------|--------------------------------------------------------------------|
| source | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer all of its attributes' values |
| target | <code>Actor,Token,TokenDocument</code> | The target that is going to receive all of the attributes' values  |

If the hook returns `false`, the action is interrupted.

---

### item-piles-transferAllAttributes

Called after all attributes' values was transferred from the source to the target.

| Param      | Type                | Description                                                           |
|------------|---------------------|-----------------------------------------------------------------------|
| source | <code>Actor,TokenDocument</code> | The source that transferred all of its attributes' values |
| target | <code>Actor,TokenDocument</code> | The target that received all of the attributes' values    |
| attributes | <code>object</code> | An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred |
| userId      | <code>string</code>  | The ID of the user that initiated this action |
