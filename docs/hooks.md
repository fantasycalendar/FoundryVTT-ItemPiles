## Table of Contents

- [Generic](#Generic)
  - [item-piles-ready](#item-piles-ready)
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
  - [item-piles-preTurnIntoItemPile](#item-piles-preTurnIntoItemPile)
  - [item-piles-turnIntoItemPile](#item-piles-turnIntoItemPile)
  - [item-piles-preRevertFromItemPile](#item-piles-preRevertFromItemPile)
  - [item-piles-revertFromItemPile](#item-piles-revertFromItemPile)

- [Items](#Items)
  - [item-piles-preDropItem](#item-piles-preDropItem)
  - [item-piles-dropItem](#item-piles-dropItem)
  - [item-piles-preTransferItem](#item-piles-preTransferItem)
  - [item-piles-transferItem](#item-piles-transferItem)
  - [item-piles-preAddItem](#item-piles-preAddItem)
  - [item-piles-addItem](#item-piles-addItem)
  - [item-piles-preRemoveItem](#item-piles-preRemoveItem)
  - [item-piles-removeItem](#item-piles-removeItem)
  - [item-piles-preTransferAllItems](#item-piles-preTransferAllItems)
  - [item-piles-transferAllItems](#item-piles-transferAllItems)

- [Attributes](#Attributes)
  - [item-piles-preTransferAttribute](#item-piles-preTransferAttribute)
  - [item-piles-transferAttribute](#item-piles-transferAttribute)
  - [item-piles-preAddAttribute](#item-piles-preAddAttribute)
  - [item-piles-addAttribute](#item-piles-addAttribute)
  - [item-piles-preRemoveAttribute](#item-piles-preRemoveAttribute)
  - [item-piles-removeAttribute](#item-piles-removeAttribute)
  - [item-piles-preTransferAllAttributes](#item-piles-preTransferAllAttributes)
  - [item-piles-transferAllAttributes](#item-piles-transferAllAttributes)

## Hooks

### Generic

#### item-piles-ready

Called when the module is ready.

| Param | Type                   | Description              |
|-------|------------------------|--------------------------|
| api   | <code>Class API</code> | The item piles API class |

#### item-piles-preTransferEverything

Called before all items and attributes are going to be transferred from the source to the target.

| Param           | Type                             | Description                                                                       |
|-----------------|----------------------------------|-----------------------------------------------------------------------------------|
| source          | <code>Actor,TokenDocument</code> | The Actor or Token that is going to have all its items and attributes transferred |
| target          | <code>Actor,TokenDocument</code> | The Actor or Token that is going to receive all of the items and attributes       |
| itemTypeFilters | <code>array,boolean</code>       | Array of item types to filter - will default to module settings if none provided  |

If the hook returns `false`, the action is interrupted.

#### item-piles-transferEverything

Called after all items and attributes have been transferred from the source to the target.

| Param             | Type                | Description                                                                 |
|-------------------|---------------------|-----------------------------------------------------------------------------|
| sourceUuid        | <code>string</code> | The UUID of the source that had all of its items and attributes transferred |
| targetUuid        | <code>string</code> | The UUID of the target that received all of the items and attributes        |
| itemsCreated      | <code>array</code>  | A list of raw item objects that were created on the target                  |
| itemsUpdated      | <code>array</code>  | A list of item ids and quantities that were updated on the target           |
| attributesChanged | <code>array</code>  | A list of attributes and their new values                                   |

### Item Piles

#### item-piles-preCreateItemPile

Called before an item pile is going to be created.

| Param         | Type                        | Description                                                                          |
|---------------|-----------------------------|--------------------------------------------------------------------------------------|
| position      | <code>object</code>         | The position where to create the item pile                                           |
| pileActorName | <code>string,boolean</code> | The actor name of the pile to create, if false, it defaults to the default item pile |

If the hook returns `false`, the action is interrupted.

#### item-piles-createItemPile

Called after an item pile has been created.

| Param    | Type                       | Description                                          |
|----------|----------------------------|------------------------------------------------------|
| document | <code>TokenDocument</code> | The document of the item pile token that was created |
| flagData | <code>object</code>        | The flag data of the item pile                       |

#### item-piles-preUpdateItemPile

Called before an item pile is going to be updated (only through the API).

| Param            | Type                               | Description                                                                              |
|------------------|------------------------------------|------------------------------------------------------------------------------------------|
| target           | <code>Token,TokenDocument</code>   | The document of the item pile that is going to be updated                                |
| newData          | <code>object</code>                | The new data that is going to be modified on the item pile                               |
| interactingToken | <code>TokenDocument,boolean</code> | If the update was caused by another token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

#### item-piles-updateItemPile

Called after an item pile has been updated (only through the API).

| Param            | Type                               | Description                                                                              |
|------------------|------------------------------------|------------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile that was updated                                           |
| diffData         | <code>string,boolean</code>        | The difference between the item pile's old data and new data                             |
| interactingToken | <code>TokenDocument,boolean</code> | If the update was caused by another token, this will be a TokenDocument, otherwise false |

#### item-piles-preDeleteItemPile

Called before an item pile is going to be deleted (only through the module's settings or its API).

| Param   | Type                               | Description                                               |
|---------|------------------------------------|-----------------------------------------------------------|
| target  | <code>Token,TokenDocument</code>   | The document of the item pile that is going to be deleted |

If the hook returns `false`, the action is interrupted.

#### item-piles-deleteItemPile

Called after an item pile has been deleted.

| Param   | Type                               | Description                                         |
|---------|------------------------------------|-----------------------------------------------------|
| target  | <code>Token,TokenDocument</code>   | The document of the item pile that has been deleted |

#### item-piles-preCloseItemPile

Called before an item pile is going to be closed.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be closed                                |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

#### item-piles-closeItemPile

Called after an item pile has been closed.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been closed                                      |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

#### item-piles-preOpenItemPile

Called before an item pile is going to be opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be opened                                |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

#### item-piles-openItemPile

Called after an item pile has been opened.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been opened                                      |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

#### item-piles-preLockItemPile

Called before an item pile is going to be locked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be locked                                |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

#### item-piles-lockItemPile

Called after an item pile has been locked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been locked                                      |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

#### item-piles-preUnlockItemPile

Called before an item pile is going to be unlocked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile is going to be unlocked                              |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

If the hook returns `false`, the action is interrupted.

#### item-piles-unlockItemPile

Called after an item pile has been unlocked.

| Param            | Type                               | Description                                                                        |
|------------------|------------------------------------|------------------------------------------------------------------------------------|
| target           | <code>TokenDocument</code>         | The document of the item pile has been unlocked                                    |
| interactingToken | <code>TokenDocument,boolean</code> | If the action was caused by a token, this will be a TokenDocument, otherwise false |

#### item-piles-preTurnIntoItemPile

Called before a token is turned into an item pile.

| Param          | Type                              | Description                                                         |
|----------------|-----------------------------------|---------------------------------------------------------------------|
| target         | <code>Token,TokenDocument</code>  | The token that is going to be turned into an item pile              |
| pileSettings   | <code>object</code>               | Any overriding item pile settings that the token and actor will get |
| tokenSettings  | <code>object</code>               | Any overriding token settings that the token will get               |

If the hook returns `false`, the action is interrupted.

#### item-piles-turnIntoItemPile

Called after a token has been turned into an item pile.

| Param           | Type                | Description                                             |
|-----------------|---------------------|---------------------------------------------------------|
| targetUuid      | <code>string</code> | The UUID of the token that was turned into an item pile |
| newPileSettings | <code>object</code> | The resulting item pile's settings                      |

#### item-piles-preRevertFromItemPile

Called before a token is reverted from an item pile into a normal token.

| Param          | Type                              | Description                                              |
|----------------|-----------------------------------|----------------------------------------------------------|
| target         | <code>Token,TokenDocument</code>  | The token that is going to be reverted from an item pile |
| tokenSettings  | <code>object</code>               | Any overriding token settings that the token will get    |

If the hook returns `false`, the action is interrupted.

#### item-piles-revertFromItemPile

Called after a token has been reverted from an item pile into a normal token.

| Param           | Type                | Description                                               |
|-----------------|---------------------|-----------------------------------------------------------|
| targetUuid      | <code>string</code> | The UUID of the token that was reverted from an item pile |

### Items

#### item-piles-preDropItem

Called before an item is dropped on the canvas.

| Param    | Type                        | Description                                                                                                                      |
|----------|-----------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| source   | <code>Actor</code>          | The actor or token document is going to be dropping the item                                                                     |
| target   | <code>TokenDocument</code>  | The token document of the item pile that the item is going to be dropped on on, or false if it was not on an existing item pile  |
| itemData | <code>object</code>         | The data of the item that is going to be be dropped                                                                              |
| position | <code>object,boolean</code> | The position on the canvas where the item is going to be dropped, or false if it is going to be dropped on an existing item pile |
| quantity | <code>number</code>         | The quantity of the item that is going to be dropped                                                                             |

If the hook returns `false`, the action is interrupted.

#### item-piles-dropItem

Called after an item has been dropped on the canvas.

| Param      | Type                        | Description                                                                                                                     |
|------------|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------|
| sourceUuid | <code>string</code>         | The UUID of the actor or token document that dropped the item                                                                   |
| targetUuid | <code>string</code>         | The UUID of the token document of the item pile that the item was dropped on, which may have been created as a part of the drop |
| itemData   | <code>object</code>         | The data of the item that was dropped                                                                                           |
| position   | <code>object,boolean</code> | The position on the canvas where the item was dropped                                                                           |
| quantity   | <code>number</code>         | The quantity of the item that was dropped                                                                                       |

#### item-piles-preTransferItem

Called before an item is transferred from the source to the target.

| Param    | Type                                   | Description                                              |
|----------|----------------------------------------|----------------------------------------------------------|
| source   | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer the item            |
| target   | <code>Actor,Token,TokenDocument</code> | The target that is going to receive the item             |
| itemId   | <code>string</code>                    | The ID of the item that is going to be transferred       |
| quantity | <code>number</code>                    | The quantity of the item that is going to be transferred |

If the hook returns `false`, the action is interrupted.

#### item-piles-transferItem

Called after an item has been transferred from the source to the target.

| Param      | Type                | Description                              |
|------------|---------------------|------------------------------------------|
| sourceUuid | <code>string</code> | The source that transferred the item     |
| targetUuid | <code>string</code> | The target that received the item        |
| itemId     | <code>string</code> | The ID of the item that was transferred  |
| quantity   | <code>number</code> | The quantity of the item was transferred |

#### item-piles-preAddItem

Called before an item is added to the target. This is not called in any transfers.

| Param    | Type                                   | Description                                        |
|----------|----------------------------------------|----------------------------------------------------|
| target   | <code>Actor,Token,TokenDocument</code> | The target that is going to receive the item       |
| itemData | <code>object</code>                    | The data of the item that is going to be added     |
| quantity | <code>number</code>                    | The quantity of the item that is going to be added |

If the hook returns `false`, the action is interrupted.

#### item-piles-addItem

Called after an item has been added to the target. This is not called in any transfers.

| Param      | Type                | Description                                       |
|------------|---------------------|---------------------------------------------------|
| targetUuid | <code>string</code> | The UUID of the target that has received the item |
| itemId     | <code>string</code> | The ID of the item that was added                 |
| quantity   | <code>number</code> | The quantity of the item that was added           |

#### item-piles-preRemoveItem

Called before an item is removed from the target. This is not called in any transfers.

| Param    | Type                                   | Description                                          |
|----------|----------------------------------------|------------------------------------------------------|
| target   | <code>Actor,Token,TokenDocument</code> | The target that is going to have its item removed    |
| itemId   | <code>string</code>                    | The id of the item that is going to be removed       |
| quantity | <code>number</code>                    | The quantity of the item that is going to be removed |

If the hook returns `false`, the action is interrupted.

#### item-piles-removeItem

Called after an item has been removed from the target. This is not called in any transfers.

| Param      | Type                | Description                               |
|------------|---------------------|-------------------------------------------|
| targetUuid | <code>string</code> | The UUID of the target that lost the item |
| itemId     | <code>string</code> | The ID of the item that was removed       |
| quantity   | <code>number</code> | The quantity of the item that was removed |

#### item-piles-preTransferAllItems

Called before all items are transferred from the source to the target.

| Param           | Type                                   | Description                                                                      |
|-----------------|----------------------------------------|----------------------------------------------------------------------------------|
| source          | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer all of its items                            |
| target          | <code>Actor,Token,TokenDocument</code> | The target that is going to receive all of the items                             |
| itemTypeFilters | <code>array,boolean</code>             | Array of item types to filter - will default to module settings if none provided |

If the hook returns `false`, the action is interrupted.

#### item-piles-transferAllItems

Called after all items has been transferred from the source to the target.

| Param             | Type                | Description                                                                 |
|-------------------|---------------------|-----------------------------------------------------------------------------|
| sourceUuid        | <code>string</code> | The UUID of the source that had all of its items and attributes transferred |
| targetUuid        | <code>string</code> | The UUID of the target that received all of the items and attributes        |
| itemsCreated      | <code>array</code>  | A list of raw item objects that were created on the target                  |
| itemsUpdated      | <code>array</code>  | A list of item ids and quantities that were updated on the target           |

### Attributes

#### item-piles-preTransferAttribute

Called before an attribute's value is transferred from the source to the target.

| Param     | Type                                   | Description                                                       |
|-----------|----------------------------------------|-------------------------------------------------------------------|
| source    | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer its attribute's value        |
| target    | <code>Actor,Token,TokenDocument</code> | The target that is going to receive the attribute's value         |
| attribute | <code>string</code>                    | The path to the attribute that is going to be transferred         |
| quantity  | <code>number</code>                    | How much of the attribute's value that is going to be transferred |

If the hook returns `false`, the action is interrupted.

#### item-piles-transferAttribute

Called after an attribute's value has been transferred from the source to the target.

| Param      | Type                | Description                                                   |
|------------|---------------------|---------------------------------------------------------------|
| sourceUuid | <code>string</code> | The UUID of the source that transferred its attribute's value |
| targetUuid | <code>string</code> | The UUID of the target that received the attribute's value    |
| attribute  | <code>string</code> | The path to the attribute has been transferred                |
| quantity   | <code>number</code> | How much of the attribute's value that was transferred        |

#### item-piles-preAddAttribute

Called before the value of the attribute on the target is added to. Not called in the case of a transfer.

| Param     | Type                                   | Description                                            |
|-----------|----------------------------------------|--------------------------------------------------------|
| target    | <code>Actor,Token,TokenDocument</code> | The target whose attribute's value will be added to    |
| attribute | <code>string</code>                    | The path to the attribute that is going to be added to |
| quantity  | <code>number</code>                    | How much of the attribute's value that will be added   |

If the hook returns `false`, the action is interrupted.

#### item-piles-addAttribute

Called after the value of the attribute on the target has been added to. Not called in the case of a transfer.

| Param      | Type                | Description                                          |
|------------|---------------------|------------------------------------------------------|
| targetUuid | <code>string</code> | The target whose attribute's value has been added to |
| attribute  | <code>string</code> | The path to the attribute that has been added to     |
| quantity   | <code>number</code> | How much of the attribute's value was added to       |

#### item-piles-preRemoveAttribute

Called before the value of the attribute on the target is removed from. Not called in the case of a transfer.

| Param     | Type                                   | Description                                                |
|-----------|----------------------------------------|------------------------------------------------------------|
| target    | <code>Actor,Token,TokenDocument</code> | The target whose attribute's value will be removed from    |
| attribute | <code>string</code>                    | The path to the attribute that is going to be removed from |
| quantity  | <code>number</code>                    | How much of the attribute's value that will be removed     |

If the hook returns `false`, the action is interrupted.

#### item-piles-removeAttribute

Called after the value of the attribute on the target has been removed from. Not called in the case of a transfer.

| Param      | Type                | Description                                              |
|------------|---------------------|----------------------------------------------------------|
| targetUuid | <code>string</code> | The target whose attribute's value has been removed from |
| attribute  | <code>string</code> | The path to the attribute that has been removed from     |
| quantity   | <code>number</code> | How much of the attribute's value was removed from       |

#### item-piles-preTransferAllAttributes

Called before all attributes' values are transferred from the source to the target.

| Param  | Type                                   | Description                                                        |
|--------|----------------------------------------|--------------------------------------------------------------------|
| source | <code>Actor,Token,TokenDocument</code> | The source that is going to transfer all of its attributes' values |
| target | <code>Actor,Token,TokenDocument</code> | The target that is going to receive all of the attributes' values  |

If the hook returns `false`, the action is interrupted.

#### item-piles-transferAllAttributes

Called after all attributes' values was transferred from the source to the target.

| Param      | Type                | Description                                                           |
|------------|---------------------|-----------------------------------------------------------------------|
| sourceUuid | <code>string</code> | The UUID of the source that transferred all of its attributes' values |
| targetUuid | <code>string</code> | The UUID of the target that received all of the attributes' values    |

