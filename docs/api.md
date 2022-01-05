## Members

<dl>
<dt><a href="#ACTOR_CLASS_TYPE">ACTOR_CLASS_TYPE</a> ⇒ <code>String</code></dt>
<dd><p>The actor class type used for the original item pile actor in this system</p>
</dd>
<dt><a href="#DYNAMIC_ATTRIBUTES">DYNAMIC_ATTRIBUTES</a> ⇒ <code>Array</code></dt>
<dd><p>The attributes used to track dynamic attributes in this system</p>
</dd>
<dt><a href="#ITEM_QUANTITY_ATTRIBUTE">ITEM_QUANTITY_ATTRIBUTE</a> ⇒ <code>String</code></dt>
<dd><p>The attribute used to track the quantity of items in this system</p>
</dd>
<dt><a href="#ITEM_TYPE_ATTRIBUTE">ITEM_TYPE_ATTRIBUTE</a> ⇒ <code>String</code></dt>
<dd><p>The attribute used to track the item type in this system</p>
</dd>
<dt><a href="#ITEM_TYPE_FILTERS">ITEM_TYPE_FILTERS</a> ⇒ <code>Array</code></dt>
<dd><p>The filters for item types eligible for interaction within this system</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#setActorClassType">setActorClassType(inClassType)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the actor class type used for the original item pile actor in this system</p>
</dd>
<dl>
<dt><a href="#setDynamicAttributes">setDynamicAttributes(inAttributes)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the attributes used to track dynamic attributes in this system</p>
</dd>
<dt><a href="#setItemQuantityAttribute">setItemQuantityAttribute(inAttribute)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the inAttribute used to track the quantity of items in this system</p>
</dd>
<dt><a href="#setItemTypeAttribute">setItemTypeAttribute(inAttribute)</a> ⇒ <code>String</code></dt>
<dd><p>Sets the attribute used to track the item type in this system</p>
</dd>
<dt><a href="#setItemTypeFilters">setItemTypeFilters(inFilters)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the filters for item types eligible for interaction within this system</p>
</dd>
<dt><a href="#createPile">createPile(position, pileActorName)</a> ⇒ <code>Promise</code></dt>
<dd><p>Creates the default item pile at a location. If provided an actor&#39;s name, an item
pile will be created of that actor, if it is a valid item pile.</p>
</dd>
<dt><a href="#transferItems">transferItems(source, target, itemId, quantity, force)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Transfers an item from a source to a target, removing it or subtracting a number of quantity from the first to the second one, deleting the item if its quantity reaches 0</p>
</dd>
<dt><a href="#removeItems">removeItems(target, itemId, quantity, force)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Subtracts the quantity of an item on an actor. If its quantity reaches 0, the item is removed from the actor.</p>
</dd>
<dt><a href="#addItems">addItems(target, itemData, quantity, force)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Adds an item to an actor.</p>
</dd>
<dt><a href="#transferAllItems">transferAllItems(source, target, itemTypeFilters)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Transfers all items between the source and the target.</p>
</dd>
<dt><a href="#transferAttributes">transferAttributes(source, target, attribute, quantity)</a> ⇒ <code>Promise</code></dt>
<dd><p>Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target</p>
</dd>
<dt><a href="#removeAttributes">removeAttributes(target, attribute, quantity)</a> ⇒ <code>Promise</code></dt>
<dd><p>Subtracts a set quantity of an attribute on an actor</p>
</dd>
<dt><a href="#addAttributes">addAttributes(target, attribute, quantity)</a> ⇒ <code>Promise</code></dt>
<dd><p>Adds a set quantity of an attribute on an actor</p>
</dd>
<dt><a href="#transferAllAttributes">transferAllAttributes(source, target)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target</p>
</dd>
<dt><a href="#transferEverything">transferEverything(source, target, itemTypeFilters)</a> ⇒ <code>Promise.&lt;Object&gt;</code></dt>
<dd><p>Transfers all items and attributes between the source and the target.</p>
</dd>
<dt><a href="#turnTokenIntoItemPile">turnTokenIntoItemPile(target, settings, tokenSettings)</a> ⇒ <code>Promise</code></dt>
<dd><p>Turns a token and its actor into an item pile</p>
</dd>
<dt><a href="#revertTokenFromItemPile">revertTokenFromItemPile(target, tokenSettings)</a> ⇒ <code>Promise</code></dt>
<dd><p>Reverts a token from an item pile into a normal token and actor</p>
</dd>
<dt><a href="#rerenderTokenHud">rerenderTokenHud()</a> ⇒ <code>Promise</code></dt>
<dd><p>Causes every user&#39;s token HUD to rerender</p>
</dd>
<dt><a href="#openItemPile">openItemPile(target, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Opens a pile if it is enabled and a container</p>
</dd>
<dt><a href="#closeItemPile">closeItemPile(target, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Closes a pile if it is enabled and a container</p>
</dd>
<dt><a href="#toggleItemPileClosed">toggleItemPileClosed(target, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Toggles a pile&#39;s closed state if it is enabled and a container</p>
</dd>
<dt><a href="#lockItemPile">lockItemPile(target, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Locks a pile if it is enabled and a container</p>
</dd>
<dt><a href="#unlockItemPile">unlockItemPile(target, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Unlocks a pile if it is enabled and a container</p>
</dd>
<dt><a href="#toggleItemPileLocked">toggleItemPileLocked(target, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Toggles a pile&#39;s locked state if it is enabled and a container</p>
</dd>
<dt><a href="#rattleItemPile">rattleItemPile(target)</a> ⇒ <code>Promise.&lt;boolean&gt;</code></dt>
<dd><p>Causes the item pile to play a sound as it was attempted to be opened, but was locked</p>
</dd>
<dt><a href="#isItemPileLocked">isItemPileLocked(target)</a> ⇒ <code>boolean</code></dt>
<dd><p>Whether an item pile is locked. If it is not enabled or not a container, it is always false.</p>
</dd>
<dt><a href="#isItemPileClosed">isItemPileClosed(target)</a> ⇒ <code>boolean</code></dt>
<dd><p>Whether an item pile is closed. If it is not enabled or not a container, it is always false.</p>
</dd>
<dt><a href="#isItemPileContainer">isItemPileContainer(target)</a> ⇒ <code>boolean</code></dt>
<dd><p>Whether an item pile is a container. If it is not enabled, it is always false.</p>
</dd>
<dt><a href="#updateItemPile">updateItemPile(target, newData, interactingToken)</a> ⇒ <code>Promise</code></dt>
<dd><p>Updates a pile with new data.</p>
</dd>
<dt><a href="#deleteItemPile">deleteItemPile(target)</a> ⇒ <code>Promise</code></dt>
<dd><p>Deletes a pile, calling the relevant hooks.</p>
</dd>
<dt><a href="#isValidItemPile">isValidItemPile(document)</a> ⇒ <code>boolean</code></dt>
<dd><p>Whether a given document is a valid pile or not</p>
</dd>
<dt><a href="#refreshItemPile">refreshItemPile(target)</a> ⇒ <code>Promise</code></dt>
<dd><p>Refreshes the target image of an item pile, ensuring it remains in sync</p>
</dd>
<dt><a href="#rerenderItemPileInventoryApplication">rerenderItemPileInventoryApplication(inPileUuid, deleted)</a> ⇒ <code>Promise.&lt;*&gt;</code></dt>
<dd><p>Causes all connected users to re-render a specific pile&#39;s inventory UI</p>
</dd>
<dt><a href="#isItemTypeDisallowed">isItemTypeDisallowed(item, itemTypeFilter)</a> ⇒ <code>boolean</code> | <code>string</code></dt>
<dd><p>Checks whether an item (or item data) is of a type that is not allowed. If an array whether that type is allowed
or not, returning the type if it is NOT allowed.</p>
</dd>
</dl>

<a name="ACTOR_CLASS_TYPE"></a>

## ItemPiles.API.ACTOR\_CLASS\_TYPE ⇒ <code>String</code>
The actor class type used for the original item pile actor in this system

<a name="DYNAMIC_ATTRIBUTES"></a>

## ItemPiles.API.DYNAMIC\_ATTRIBUTES ⇒ <code>Array</code>
The attributes used to track dynamic attributes in this system

<a name="ITEM_QUANTITY_ATTRIBUTE"></a>

## ItemPiles.API.ITEM\_QUANTITY\_ATTRIBUTE ⇒ <code>String</code>
The attribute used to track the quantity of items in this system

<a name="ITEM_TYPE_ATTRIBUTE"></a>

## ItemPiles.API.ITEM\_TYPE\_ATTRIBUTE ⇒ <code>String</code>
The attribute used to track the item type in this system

<a name="ITEM_TYPE_FILTERS"></a>

## ItemPiles.API.ITEM\_TYPE\_FILTERS ⇒ <code>Array</code>
The filters for item types eligible for interaction within this system

<a name="setActorClassType"></a>

## ItemPiles.API.setActorClassType(inClassType) ⇒ <code>Promise</code>
Sets the actor class type used for the original item pile actor in this system

| Param         | Type                |
|---------------|---------------------|
| inClassType   | <code>string</code> | 

<a name="setDynamicAttributes"></a>

## ItemPiles.API.setDynamicAttributes(inAttributes) ⇒ <code>Promise</code>
Sets the attributes used to track dynamic attributes in this system

| Param        | Type                |
|--------------|---------------------|
| inAttributes | <code>array</code>  | 

<a name="setItemQuantityAttribute"></a>

## ItemPiles.API.setItemQuantityAttribute(inAttribute) ⇒ <code>Promise</code>
Sets the inAttribute used to track the quantity of items in this system

| Param        | Type                |
|--------------|---------------------|
| inAttribute  | <code>string</code> | 

<a name="setItemTypeAttribute"></a>

## ItemPiles.API.setItemTypeAttribute(inAttribute) ⇒ <code>String</code>
Sets the attribute used to track the item type in this system

| Param       | Type                |
|-------------|---------------------|
| inAttribute | <code>string</code> | 

<a name="setItemTypeFilters"></a>

## ItemPiles.API.setItemTypeFilters(inFilters) ⇒ <code>Promise</code>
Sets the filters for item types eligible for interaction within this system

| Param     | Type                      |
|-----------|---------------------------|
| inFilters | <code>string/array</code> |

<a name="createPile"></a>

## ItemPiles.API.createPile(position, pileActorName) ⇒ <code>Promise</code>
Creates the default item pile at a location. If provided an actor's name, an item
pile will be created of that actor, if it is a valid item pile.

| Param         | Type                        | Default            |
|---------------|-----------------------------|--------------------|
| position      | <code>object</code>         |                    | 
| pileActorName | <code>string/boolean</code> | <code>false</code> | 

<a name="transferItems"></a>

## ItemPiles.API.transferItems(source, target, itemId, quantity, force) ⇒ <code>Promise.&lt;Object&gt;</code>
Transfers an item from a source to a target, removing it or subtracting a number of quantity from the first to the second one, deleting the item if its quantity reaches 0

**Returns**: <code>Promise.&lt;Object&gt;</code> - An object containing the quantity transferred, the item ID that was removed from the target, and the item ID that was added to the target.

| Param    | Type                             | Description                              |
|----------|----------------------------------|------------------------------------------|
| source   | <code>Actor/TokenDocument</code> | The source to transfer the item from     |
| target   | <code>Actor/TokenDocument</code> | The target to transfer the item to       |
| itemId   | <code>String</code>              | The ID of the item to transfer           |
| quantity | <code>Number</code>              | How many of the item to transfer         |
| force    | <code>Boolean</code>             | Whether to ignore item type restrictions |

<a name="removeItems"></a>

## ItemPiles.API.removeItems(target, itemId, quantity, force) ⇒ <code>Promise.&lt;Object&gt;</code>
Subtracts the quantity of an item on an actor. If its quantity reaches 0, the item is removed from the actor.

**Returns**: <code>Promise.&lt;Object&gt;</code> - An object containing the quantity removed and the item ID that was removed  

| Param    | Type                             | Description                              |
|----------|----------------------------------|------------------------------------------|
| target   | <code>Actor/TokenDocument</code> | The target to remove an item from        |
| itemId   | <code>String</code>              | The itemId to remove from the target     |
| quantity | <code>Number</code>              | How many of the items to remove          |
| force    | <code>Boolean</code>             | Whether to ignore item type restrictions |

<a name="addItems"></a>

## ItemPiles.API.addItems(target, itemData, quantity, force) ⇒ <code>Promise.&lt;Object&gt;</code>
Adds an item to an actor.

**Returns**: <code>Promise.&lt;Object&gt;</code> - An object containing the quantity added and the item ID that was added  

| Param    | Type                             | Description                              |
|----------|----------------------------------|------------------------------------------|
| target   | <code>Actor/TokenDocument</code> | The target to add an item to             |
| itemData | <code>Object</code>              | The item's data to add to this target    |
| quantity | <code>Number</code>              | Number of them items to add              |
| force    | <code>Boolean</code>             | Whether to ignore item type restrictions |

<a name="transferAllItems"></a>

## ItemPiles.API.transferAllItems(source, target, itemTypeFilters) ⇒ <code>Promise.&lt;Object&gt;</code>
Transfers all items between the source and the target.

**Returns**: <code>Promise.&lt;Object&gt;</code> - An object containing an array of the IDs of every item that was removed from the source, and the IDs of every item that was added to the target  

| Param           | Type                             | Description                                                                      |
|-----------------|----------------------------------|----------------------------------------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The actor to transfer all items from                                             |
| target          | <code>Actor/TokenDocument</code> | The actor to receive all the items                                               |
| itemTypeFilters | <code>Array/Boolean</code>       | Array of item types to filter - will default to module settings if none provided |

<a name="transferAttributes"></a>

## ItemPiles.API.transferAttributes(source, target, attribute, quantity) ⇒ <code>Promise</code>
Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target

**Returns**: <code>Promise</code> - The number of the attribute that were transferred  

| Param     | Type                             | Description                               |
|-----------|----------------------------------|-------------------------------------------|
| source    | <code>Actor/TokenDocument</code> | The source to transfer the attribute from |
| target    | <code>Actor/TokenDocument</code> | The target to transfer the attribute to   |
| attribute | <code>String</code>              | The path to the attribute to transfer     |
| quantity  | <code>Number</code>              | How many of the attribute to transfer     |

<a name="removeAttributes"></a>

## ItemPiles.API.removeAttributes(target, attribute, quantity) ⇒ <code>Promise</code>
Subtracts a set quantity of an attribute on an actor

**Returns**: <code>Promise</code> - Returns how much quantity of the attribute were removed from the target  

| Param     | Type                             | Description                                                 |
|-----------|----------------------------------|-------------------------------------------------------------|
| target    | <code>Token/TokenDocument</code> | The target whose attribute will have a set quantity from it |
| attribute | <code>String</code>              | The path of the attribute to remove from the target         |
| quantity  | <code>Number</code>              | How many of the attribute's quantity to remove              |

<a name="addAttributes"></a>

## ItemPiles.API.addAttributes(target, attribute, quantity) ⇒ <code>Promise</code>
Adds a set quantity of an attribute on an actor

**Returns**: <code>Promise</code> - Returns how much quantity of the attribute were added to the target  

| Param     | Type                             | Description                                                     |
|-----------|----------------------------------|-----------------------------------------------------------------|
| target    | <code>Actor/TokenDocument</code> | The target whose attribute will have a set quantity added to it |
| attribute | <code>String</code>              | The path of the attribute to add to                             |
| quantity  | <code>Number</code>              | How many of the attribute's quantity to add                     |

<a name="transferAllAttributes"></a>

## ItemPiles.API.transferAllAttributes(source, target) ⇒ <code>Promise.&lt;Object&gt;</code>
Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target

**Returns**: <code>Promise.&lt;Object&gt;</code> - An object containing attributes that were transferred as keys with
                                             the values being the quantity of that attribute that was transferred  

| Param  | Type                             | Description                                |
|--------|----------------------------------|--------------------------------------------|
| source | <code>Actor/TokenDocument</code> | The source to transfer the attributes from |
| target | <code>Actor/TokenDocument</code> | The target to transfer the attributes to   |

<a name="transferEverything"></a>

## ItemPiles.API.transferEverything(source, target, itemTypeFilters) ⇒ <code>Promise.&lt;Object&gt;</code>
Transfers all items and attributes between the source and the target.

**Returns**: <code>Promise.&lt;Object&gt;</code> - An object containing an array of the IDs of every item that was removed from the source, and the IDs of every item that was added to the target  

| Param           | Type                             | Description                                         |
|-----------------|----------------------------------|-----------------------------------------------------|
| source          | <code>Actor/TokenDocument</code> | The actor to transfer all items and attributes from |
| target          | <code>Actor/TokenDocument</code> | The actor to receive all the items and attributes   |
| itemTypeFilters | <code>Array/Boolean</code>       | Item types to filter                                |

<a name="turnTokenIntoItemPile"></a>

## ItemPiles.API.turnTokenIntoItemPile(target, settings, tokenSettings) ⇒ <code>Promise</code>
Turns a token and its actor into an item pile

| Param         | Type                             |
|---------------|----------------------------------|
| target        | <code>Token/TokenDocument</code> | 
| settings      | <code>object</code>              | 
| tokenSettings | <code>object</code>              | 

<a name="revertTokenFromItemPile"></a>

## ItemPiles.API.revertTokenFromItemPile(target, tokenSettings) ⇒ <code>Promise</code>
Reverts a token from an item pile into a normal token and actor

| Param         | Type                             |
|---------------|----------------------------------|
| target        | <code>Token/TokenDocument</code> | 
| tokenSettings | <code>object</code>              | 

<a name="rerenderTokenHud"></a>

## ItemPiles.API.rerenderTokenHud() ⇒ <code>Promise</code>
Causes every user's token HUD to rerender
<a name="openItemPile"></a>

## ItemPiles.API.openItemPile(target, interactingToken) ⇒ <code>Promise</code>
Opens a pile if it is enabled and a container

| Param            | Type                                     | Default            |
|------------------|------------------------------------------|--------------------|
| target           | <code>Token/TokenDocument</code>         |                    | 
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> | 

<a name="closeItemPile"></a>

## ItemPiles.API.closeItemPile(target, interactingToken) ⇒ <code>Promise</code>
Closes a pile if it is enabled and a container

| Param            | Type                                     | Default            | Description          |
|------------------|------------------------------------------|--------------------|----------------------|
| target           | <code>Token/TokenDocument</code>         |                    | Target pile to close |
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> |                      |

<a name="toggleItemPileClosed"></a>

## ItemPiles.API.toggleItemPileClosed(target, interactingToken) ⇒ <code>Promise</code>
Toggles a pile's closed state if it is enabled and a container

| Param            | Type                                     | Default            | Description                  |
|------------------|------------------------------------------|--------------------|------------------------------|
| target           | <code>Token/TokenDocument</code>         |                    | Target pile to open or close |
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> |                              |

<a name="lockItemPile"></a>

## ItemPiles.API.lockItemPile(target, interactingToken) ⇒ <code>Promise</code>
Locks a pile if it is enabled and a container

| Param            | Type                                     | Default            | Description         |
|------------------|------------------------------------------|--------------------|---------------------|
| target           | <code>Token/TokenDocument</code>         |                    | Target pile to lock |
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> |                     |

<a name="unlockItemPile"></a>

## ItemPiles.API.unlockItemPile(target, interactingToken) ⇒ <code>Promise</code>
Unlocks a pile if it is enabled and a container

| Param            | Type                                     | Default            | Description           |
|------------------|------------------------------------------|--------------------|-----------------------|
| target           | <code>Token/TokenDocument</code>         |                    | Target pile to unlock |
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> |                       |

<a name="toggleItemPileLocked"></a>

## ItemPiles.API.toggleItemPileLocked(target, interactingToken) ⇒ <code>Promise</code>
Toggles a pile's locked state if it is enabled and a container

| Param            | Type                                     | Default            | Description                   |
|------------------|------------------------------------------|--------------------|-------------------------------|
| target           | <code>Token/TokenDocument</code>         |                    | Target pile to lock or unlock |
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> |                               |

<a name="rattleItemPile"></a>

## ItemPiles.API.rattleItemPile(target) ⇒ <code>Promise.&lt;boolean&gt;</code>
Causes the item pile to play a sound as it was attempted to be opened, but was locked

| Param  | Type                             |
|--------|----------------------------------|
| target | <code>Token/TokenDocument</code> | 

<a name="isItemPileLocked"></a>

## ItemPiles.API.isItemPileLocked(target) ⇒ <code>boolean</code>
Whether an item pile is locked. If it is not enabled or not a container, it is always false.

| Param  | Type                             |
|--------|----------------------------------|
| target | <code>Token/TokenDocument</code> | 

<a name="isItemPileClosed"></a>

## ItemPiles.API.isItemPileClosed(target) ⇒ <code>boolean</code>
Whether an item pile is closed. If it is not enabled or not a container, it is always false.

| Param  | Type                             |
|--------|----------------------------------|
| target | <code>Token/TokenDocument</code> | 

<a name="isItemPileContainer"></a>

## ItemPiles.API.isItemPileContainer(target) ⇒ <code>boolean</code>
Whether an item pile is a container. If it is not enabled, it is always false.

| Param  | Type                             |
|--------|----------------------------------|
| target | <code>Token/TokenDocument</code> | 

<a name="updateItemPile"></a>

## ItemPiles.API.updateItemPile(target, newData, interactingToken) ⇒ <code>Promise</code>
Updates a pile with new data.

| Param            | Type                                     | Default            |
|------------------|------------------------------------------|--------------------|
| target           | <code>Token/TokenDocument</code>         |                    | 
| newData          |                                          |                    | 
| interactingToken | <code>Token/TokenDocument/Boolean</code> | <code>false</code> | 

<a name="deleteItemPile"></a>

## ItemPiles.API.deleteItemPile(target) ⇒ <code>Promise</code>
Deletes a pile, calling the relevant hooks.

| Param  | Type                             |
|--------|----------------------------------|
| target | <code>Token/TokenDocument</code> |

<a name="isValidItemPile"></a>

## ItemPiles.API.isValidItemPile(document) ⇒ <code>boolean</code>
Whether a given document is a valid pile or not

| Param    |
|----------|
| document | 

<a name="refreshItemPile"></a>

## ItemPiles.API.refreshItemPile(target) ⇒ <code>Promise</code>
Refreshes the target image of an item pile, ensuring it remains in sync

| Param  |
|--------|
| target | 

<a name="rerenderItemPileInventoryApplication"></a>

## ItemPiles.API.rerenderItemPileInventoryApplication(inPileUuid, deleted) ⇒ <code>Promise</code>
Causes all connected users to re-render a specific pile's inventory UI

| Param      | Default            |
|------------|--------------------|
| inPileUuid |                    | 
| deleted    | <code>false</code> |

<a name="isItemTypeDisallowed"></a>

## ItemPiles.API.isItemTypeDisallowed(item, itemTypeFilter) ⇒ <code>boolean/string</code>
Checks whether an item (or item data) is of a type that is not allowed. If an array whether that type is allowed or not, returning the type if it is NOT allowed.

| Param          | Type                       | Default            |
|----------------|----------------------------|--------------------|
| item           | <code>Item/Object</code>   |                    | 
| itemTypeFilter | <code>Array/Boolean</code> | <code>false</code> | 
