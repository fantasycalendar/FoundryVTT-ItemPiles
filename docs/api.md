## Members

<dl>
<dt><a href="#ACTOR_CLASS_TYPE">ACTOR_CLASS_TYPE</a> ⇒ <code>string</code></dt>
<dd><p>The actor class type used for the original item pile actor in this system</p>
</dd>
<dt><a href="#DYNAMIC_ATTRIBUTES">CURRENCIES</a> ⇒ <code>array</code></dt>
<dd><p>The attributes used to track dynamic attributes in this system</p>
</dd>
<dt><a href="#ITEM_QUANTITY_ATTRIBUTE">ITEM_QUANTITY_ATTRIBUTE</a> ⇒ <code>string</code></dt>
<dd><p>The attribute used to track the quantity of items in this system</p>
</dd>
<dt><a href="#ITEM_FILTERS">ITEM_FILTERS</a> ⇒ <code>Array</code></dt>
<dd><p>The filters for item types eligible for interaction within this system</p>
</dd>
</dl>

## Functions

### Settings methods
<dl>
<dt><a href="#setActorClassType">setActorClassType(inClassType)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the actor class type used for the original item pile actor in this system</p>
</dd>
<dt><a href="#setDynamicAttributes">setDynamicAttributes(inAttributes)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the attributes used to track dynamic attributes in this system</p>
</dd>
<dt><a href="#setItemQuantityAttribute">setItemQuantityAttribute(inAttribute)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the inAttribute used to track the quantity of items in this system</p>
</dd>
<dt><a href="#setItemFilters">setItemFilters(inFilters)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sets the items filters for interaction within this system</p>
</dd>
</dl>

### Item Pile Methods

<dl>
<dt><a href="#createItemPile">createItemPile(position, { items, pileActorName })</a> ⇒ <code>Promise</code></dt>
<dd><p>Creates the default item pile token at a location.</p>
</dd>
<dt><a href="#turnTokensIntoItemPiles">turnTokensIntoItemPiles(targets, pileSettings, tokenSettings)</a> ⇒ <code>Promise.&lt;Array&gt;</code></dt>
<dd><p>Turns tokens and its actors into item piles</p>
</dd>
<dt><a href="#revertTokensFromItemPiles">revertTokensFromItemPiles(targets, tokenSettings)</a> ⇒ <code>Promise.&lt;Array&gt;</code></dt>
<dd><p>Reverts tokens from an item pile into a normal token and actor</p>
</dd>
<dt><a href="#openItemPile">openItemPile(target, [interactingToken])</a> ⇒ <code>Promise</code></dt>
<dd><p>Opens a pile if it is enabled and a container</p>
</dd>
<dt><a href="#closeItemPile">closeItemPile(target, [interactingToken])</a> ⇒ <code>Promise</code></dt>
<dd><p>Closes a pile if it is enabled and a container</p>
</dd>
<dt><a href="#toggleItemPileClosed">toggleItemPileClosed(target, [interactingToken])</a> ⇒ <code>Promise</code></dt>
<dd><p>Toggles a pile&#39;s closed state if it is enabled and a container</p>
</dd>
<dt><a href="#lockItemPile">lockItemPile(target, [interactingToken])</a> ⇒ <code>Promise</code></dt>
<dd><p>Locks a pile if it is enabled and a container</p>
</dd>
<dt><a href="#unlockItemPile">unlockItemPile(target, [interactingToken])</a> ⇒ <code>Promise</code></dt>
<dd><p>Unlocks a pile if it is enabled and a container</p>
</dd>
<dt><a href="#toggleItemPileLocked">toggleItemPileLocked(target, [interactingToken])</a> ⇒ <code>Promise</code></dt>
<dd><p>Toggles a pile&#39;s locked state if it is enabled and a container</p>
</dd>
<dt><a href="#rattleItemPile">rattleItemPile(target, [interactingToken])</a> ⇒ <code>Promise.&lt;boolean&gt;</code></dt>
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
<dt><a href="#updateItemPile">updateItemPile(target, newData, { interactingToken, tokenSettings })</a> ⇒ <code>Promise</code></dt>
<dd><p>Updates a pile with new data.</p>
</dd>
<dt><a href="#deleteItemPile">deleteItemPile(target)</a> ⇒ <code>Promise</code></dt>
<dd><p>Deletes a pile, calling the relevant hooks.</p>
</dd>
<dt><a href="#openItemPileInventory">openItemPileInventory(target, userIds, { inspectingTarget, useDefaultCharacter })</a> ⇒ <code>Promise</code></dt>
<dd><p>Remotely opens an item pile&#39;s inventory, if you have permission to edit the item pile. Passing a user ID, or a list of user IDs, will cause those users to open the item pile.</p>
</dd>
<dt><a href="#isValidItemPile">isValidItemPile(document)</a> ⇒ <code>boolean</code></dt>
<dd><p>Whether a given document is a valid pile or not</p>
</dd>
<dt><a href="#isItemPileEmpty">isItemPileEmpty(target)</a> ⇒ <code>boolean</code></dt>
<dd><p>Whether the item pile is empty</p>
</dd>
<dt><a href="#getItemPileItems">getItemPileItems(target, [itemFilters])</a> ⇒ <code>Array</code></dt>
<dd><p>Returns the items this item pile can transfer</p>
</dd>
<dt><a href="#getItemPileAttributes">getItemPileCurrencies(target)</a> ⇒ <code>array</code></dt>
<dd><p>Returns the attributes this item pile can transfer</p>
</dd>
<dt><a href="#refreshItemPile">refreshItemPile(target)</a> ⇒ <code>Promise</code></dt>
<dd><p>Refreshes the target image of an item pile, ensuring it remains in sync</p>
</dd>
<dt><a href="#rerenderItemPileInventoryApplication">rerenderItemPileInventoryApplication(inPileUuid, [deleted])</a> ⇒ <code>Promise</code></dt>
<dd><p>Causes all connected users to re-render a specific pile&#39;s inventory UI</p>
</dd>

### Item & Attribute Methods

<dt><a href="#addItems">addItems(target, items)</a> ⇒ <code>Promise.&lt;array&gt;</code></dt>
<dd><p>Adds item to an actor, increasing item quantities if matches were found</p>
</dd>
<dt><a href="#removeItems">removeItems(target, items)</a> ⇒ <code>Promise.&lt;array&gt;</code></dt>
<dd><p>Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor.</p>
</dd>
<dt><a href="#transferItems">transferItems(source, target, items)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Transfers items from the source to the target, subtracting a number of quantity from the source&#39;s item and adding it to the target&#39;s item, deleting items from the source if their quantity reaches 0</p>
</dd>
<dt><a href="#transferAllItems">transferAllItems(source, target, { itemFilters })</a> ⇒ <code>Promise.&lt;array&gt;</code></dt>
<dd><p>Transfers all items between the source and the target.</p>
</dd>
<dt><a href="#addAttributes">addAttributes(target, attributes)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Adds to attributes on an actor</p>
</dd>
<dt><a href="#removeAttributes">removeAttributes(target, attributes)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Subtracts attributes on the target</p>
</dd>
<dt><a href="#transferAttributes">transferAttributes(source, target, attributes)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target</p>
</dd>
<dt><a href="#transferAllAttributes">transferAllAttributes(source, target)</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target</p>
</dd>
<dt><a href="#transferEverything">transferEverything(source, target, { itemFilters })</a> ⇒ <code>Promise.&lt;object&gt;</code></dt>
<dd><p>Transfers all items and attributes between the source and the target.</p>
</dd>
<dt><a href="#rerenderTokenHud">rerenderTokenHud()</a> ⇒ <code>Promise</code></dt>
<dd><p>Causes every user&#39;s token HUD to rerender</p>
</dd>
</dl>

<a name="ACTOR_CLASS_TYPE"></a>

---

### ACTOR\_CLASS\_TYPE ⇒ <code>string</code>
The actor class type used for the original item pile actor in this system

<a name="CURRENCIES"></a>

---

### DYNAMIC\_ATTRIBUTES ⇒ <code>array</code>
The attributes used to track dynamic attributes in this system

<a name="ITEM_QUANTITY_ATTRIBUTE"></a>

---

### ITEM\_QUANTITY\_ATTRIBUTE ⇒ <code>string</code>
The attribute used to track the quantity of items in this system

<a name="ITEM_FILTERS"></a>

---

### ITEM\_FILTERS ⇒ <code>Array</code>
The filters for item types eligible for interaction within this system

<a name="setActorClassType"></a>

---

### setActorClassType(inClassType) ⇒ <code>Promise</code>
Sets the actor class type used for the original item pile actor in this system 

| Param | Type |
| --- | --- |
| inClassType | <code>string</code> | 

<a name="setDynamicAttributes"></a>

---

### setDynamicAttributes(inAttributes) ⇒ <code>Promise</code>
Sets the attributes used to track dynamic attributes in this system 

| Param | Type |
| --- | --- |
| inAttributes | <code>array</code> | 

<a name="setItemQuantityAttribute"></a>

---

### setItemQuantityAttribute(inAttribute) ⇒ <code>Promise</code>
Sets the inAttribute used to track the quantity of items in this system 

| Param | Type |
| --- | --- |
| inAttribute | <code>string</code> | 

<a name="setItemFilters"></a>

---

### setItemFilters(inFilters) ⇒ <code>Promise</code>
Sets the items filters for interaction within this system 

| Param | Type |
| --- | --- |
| inFilters | <code>array</code> | 

<a name="createItemPile"></a>

---

### createItemPile(position, { items, pileActorName }) ⇒ <code>Promise</code>
Creates the default item pile token at a location. 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| position | <code>object</code> |  | The position to create the item pile at |
| [items] | <code>array/boolean</code> | <code>false</code> | Any items to create on the item pile |
| [pileActorName] | <code>string/boolean</code> | <code>false</code> | Whether to use an existing item pile actor as the basis of this new token |

<a name="turnTokensIntoItemPiles"></a>

---

### turnTokensIntoItemPiles(targets, pileSettings, tokenSettings) ⇒ <code>Promise.&lt;Array&gt;</code>
Turns tokens and its actors into item piles 
**Returns**: <code>Promise.&lt;Array&gt;</code> - The uuids of the targets after they were turned into item piles  

| Param | Type | Description |
| --- | --- | --- |
| targets | <code>Token/TokenDocument/Array.&lt;Token/TokenDocument&gt;</code> | The targets to be turned into item piles |
| pileSettings | <code>object</code> | Overriding settings to be put on the item piles' settings |
| tokenSettings | <code>object</code> | Overriding settings that will update the tokens' settings |

<a name="revertTokensFromItemPiles"></a>

---

### revertTokensFromItemPiles(targets, tokenSettings) ⇒ <code>Promise.&lt;Array&gt;</code>
Reverts tokens from an item pile into a normal token and actor 
**Returns**: <code>Promise.&lt;Array&gt;</code> - The uuids of the targets after they were reverted from being item piles  

| Param | Type | Description |
| --- | --- | --- |
| targets | <code>Token/TokenDocument/Array.&lt;Token/TokenDocument&gt;</code> | The targets to be reverted from item piles |
| tokenSettings | <code>object</code> | Overriding settings that will update the tokens |

<a name="openItemPile"></a>

---

### openItemPile(target, [interactingToken]) ⇒ <code>Promise</code>
Opens a pile if it is enabled and a container 

| Param | Type | Default |
| --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | 
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> | 

<a name="closeItemPile"></a>

---

### closeItemPile(target, [interactingToken]) ⇒ <code>Promise</code>
Closes a pile if it is enabled and a container 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | Target pile to close |
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> |  |

<a name="toggleItemPileClosed"></a>

---

### toggleItemPileClosed(target, [interactingToken]) ⇒ <code>Promise</code>
Toggles a pile's closed state if it is enabled and a container 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | Target pile to open or close |
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> |  |

<a name="lockItemPile"></a>

---

### lockItemPile(target, [interactingToken]) ⇒ <code>Promise</code>
Locks a pile if it is enabled and a container 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | Target pile to lock |
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> |  |

<a name="unlockItemPile"></a>

---

### unlockItemPile(target, [interactingToken]) ⇒ <code>Promise</code>
Unlocks a pile if it is enabled and a container 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | Target pile to unlock |
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> |  |

<a name="toggleItemPileLocked"></a>

---

### toggleItemPileLocked(target, [interactingToken]) ⇒ <code>Promise</code>
Toggles a pile's locked state if it is enabled and a container 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | Target pile to lock or unlock |
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> |  |

<a name="rattleItemPile"></a>

---

### rattleItemPile(target, [interactingToken]) ⇒ <code>Promise.&lt;boolean&gt;</code>
Causes the item pile to play a sound as it was attempted to be opened, but was locked 

| Param | Type | Default |
| --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | 
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> | 

<a name="isItemPileLocked"></a>

---

### isItemPileLocked(target) ⇒ <code>boolean</code>
Whether an item pile is locked. If it is not enabled or not a container, it is always false. 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> | 

<a name="isItemPileClosed"></a>

---

### isItemPileClosed(target) ⇒ <code>boolean</code>
Whether an item pile is closed. If it is not enabled or not a container, it is always false. 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> | 

<a name="isItemPileContainer"></a>

---

### isItemPileContainer(target) ⇒ <code>boolean</code>
Whether an item pile is a container. If it is not enabled, it is always false. 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> | 

<a name="updateItemPile"></a>

---

### updateItemPile(target, newData, { interactingToken, tokenSettings }) ⇒ <code>Promise</code>
Updates a pile with new data. 

| Param | Type | Default |
| --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | 
| newData | <code>object</code> |  | 
| [interactingToken] | <code>Token/TokenDocument/boolean</code> | <code>false</code> | 
| [tokenSettings] | <code>object/boolean</code> | <code>false</code> | 

<a name="deleteItemPile"></a>

---

### deleteItemPile(target) ⇒ <code>Promise</code>
Deletes a pile, calling the relevant hooks. 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> | 

<a name="openItemPileInventory"></a>

---

### openItemPileInventory(target, userIds, { inspectingTarget, useDefaultCharacter }) ⇒ <code>Promise</code>
Remotely opens an item pile's inventory, if you have permission to edit the item pile. Passing a user ID, or a list of user IDs, will cause those users to open the item pile. 

| Param | Type | Description |
| --- | --- | --- |
| target | <code>Token/TokenDocument/Actor</code> | The item pile actor or token whose inventory to open |
| userIds | <code>array.&lt;string&gt;</code> | The IDs of the users that should open this item pile inventory |
| [inspectingTarget] | <code>boolean/Token/TokenDocument/Actor</code> | This will force the users to inspect this item pile as a specific character |
| [useDefaultCharacter] | <code>boolean</code> | Causes the users to inspect the item pile inventory as their default character |

<a name="isValidItemPile"></a>

---

### isValidItemPile(document) ⇒ <code>boolean</code>
Whether a given document is a valid pile or not 

| Param | Type |
| --- | --- |
| document | <code>Token/TokenDocument</code> \| <code>Actor</code> | 

<a name="isItemPileEmpty"></a>

---

### isItemPileEmpty(target) ⇒ <code>boolean</code>
Whether the item pile is empty 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> \| <code>Actor</code> | 

<a name="getItemPileItems"></a>

---

### getItemPileItems(target, [itemFilters]) ⇒ <code>Array</code>
Returns the items this item pile can transfer 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> \| <code>Actor</code> |  |  |
| [itemFilters] | <code>array/boolean</code> | <code>false</code> | Array of item types disallowed - will default to pile settings or module settings if none provided |

<a name="getItemPileCurrencies"></a>

---

### getItemPileCurrencies(target) ⇒ <code>array</code>
Returns the attributes this item pile can transfer 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> \| <code>Actor</code> | 

<a name="refreshItemPile"></a>

---

### refreshItemPile(target) ⇒ <code>Promise</code>
Refreshes the target image of an item pile, ensuring it remains in sync 

| Param | Type |
| --- | --- |
| target | <code>Token/TokenDocument</code> \| <code>Actor</code> | 

<a name="rerenderItemPileInventoryApplication"></a>

---

### rerenderItemPileInventoryApplication(inPileUuid, [deleted]) ⇒ <code>Promise</code>
Causes all connected users to re-render a specific pile's inventory UI 

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| inPileUuid | <code>string</code> |  | The uuid of the pile to be re-rendered |
| [deleted] | <code>boolean</code> | <code>false</code> | Whether the pile was deleted as a part of this re-render |

<a name="addItems"></a>

---

### addItems(target, items) ⇒ <code>Promise.&lt;array&gt;</code>
Adds item to an actor, increasing item quantities if matches were found 
**Returns**: <code>Promise.&lt;array&gt;</code> - An array of objects, each containing the item that was added or updated, and the quantity that was added  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Actor/TokenDocument/Token</code> |  | The target to add an item to |
| items | <code>array</code> |  | An array of objects, with the key "item" being an item object or an Item class (the foundry class), with an optional key of "quantity" being the amount of the item to add |

<a name="removeItems"></a>

---

### removeItems(target, items) ⇒ <code>Promise.&lt;array&gt;</code>
Subtracts the quantity of items on an actor. If the quantity of an item reaches 0, the item is removed from the actor. 
**Returns**: <code>Promise.&lt;array&gt;</code> - An array of objects, each containing the item that was removed or updated, the quantity that was removed, and whether the item was deleted  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Actor/Token/TokenDocument</code> |  | The target to remove a items from |
| items | <code>array</code> |  | An array of objects each containing the item id (key "_id") and the quantity to remove (key "quantity"), or Items (the foundry class) or strings of IDs to remove all quantities of |

<a name="transferItems"></a>

---

### transferItems(source, target, items) ⇒ <code>Promise.&lt;object&gt;</code>
Transfers items from the source to the target, subtracting a number of quantity from the source's item and adding it to the target's item, deleting items from the source if their quantity reaches 0 
**Returns**: <code>Promise.&lt;object&gt;</code> - An array of objects, each containing the item that was added or updated, and the quantity that was transferred  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Actor/Token/TokenDocument</code> |  | The source to transfer the items from |
| target | <code>Actor/Token/TokenDocument</code> |  | The target to transfer the items to |
| items | <code>array</code> |  | An array of objects each containing the item id (key "_id") and the quantity to transfer (key "quantity"), or Items (the foundry class) or strings of IDs to transfer all quantities of |

<a name="transferAllItems"></a>

---

### transferAllItems(source, target, { itemFilters }) ⇒ <code>Promise.&lt;array&gt;</code>
Transfers all items between the source and the target. 
**Returns**: <code>Promise.&lt;array&gt;</code> - An array containing all of the items that were transferred to the target  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Actor/Token/TokenDocument</code> |  | The actor to transfer all items from |
| target | <code>Actor/Token/TokenDocument</code> |  | The actor to receive all the items |
| [itemFilters] | <code>array/boolean</code> | <code>false</code> | Array of item types disallowed - will default to module settings if none provided |

<a name="addAttributes"></a>

---

### addAttributes(target, attributes) ⇒ <code>Promise.&lt;object&gt;</code>
Adds to attributes on an actor 
**Returns**: <code>Promise.&lt;object&gt;</code> - An array containing a key value pair of the attribute path and the quantity of that attribute that was removed  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Actor/Token/TokenDocument</code> |  | The target whose attribute will have a set quantity added to it |
| attributes | <code>object</code> |  | An object with each key being an attribute path, and its value being the quantity to add |

<a name="removeAttributes"></a>

---

### removeAttributes(target, attributes) ⇒ <code>Promise.&lt;object&gt;</code>
Subtracts attributes on the target 
**Returns**: <code>Promise.&lt;object&gt;</code> - An array containing a key value pair of the attribute path and the quantity of that attribute that was removed  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| target | <code>Token/TokenDocument</code> |  | The target whose attributes will be subtracted from |
| attributes | <code>array/object</code> |  | This can be either an array of attributes to subtract (to zero out a given attribute), or an object with each key being an attribute path, and its value being the quantity to subtract |

<a name="transferAttributes"></a>

---

### transferAttributes(source, target, attributes) ⇒ <code>Promise.&lt;object&gt;</code>
Transfers a set quantity of an attribute from a source to a target, removing it or subtracting from the source and adds it the target 
**Returns**: <code>Promise.&lt;object&gt;</code> - An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Actor/Token/TokenDocument</code> |  | The source to transfer the attribute from |
| target | <code>Actor/Token/TokenDocument</code> |  | The target to transfer the attribute to |
| attributes | <code>array/object</code> |  | This can be either an array of attributes to transfer (to transfer all of a given attribute), or an object with each key being an attribute path, and its value being the quantity to transfer |

<a name="transferAllAttributes"></a>

---

### transferAllAttributes(source, target) ⇒ <code>Promise.&lt;object&gt;</code>
Transfers all dynamic attributes from a source to a target, removing it or subtracting from the source and adding them to the target 
**Returns**: <code>Promise.&lt;object&gt;</code> - An object containing a key value pair of each attribute transferred, the key being the attribute path and its value being the quantity that was transferred  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Actor/Token/TokenDocument</code> |  | The source to transfer the attributes from |
| target | <code>Actor/Token/TokenDocument</code> |  | The target to transfer the attributes to |

<a name="transferEverything"></a>

---

### transferEverything(source, target, { itemFilters }) ⇒ <code>Promise.&lt;object&gt;</code>
Transfers all items and attributes between the source and the target. 
**Returns**: <code>Promise.&lt;object&gt;</code> - An object containing all items and attributes transferred to the target  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| source | <code>Actor/Token/TokenDocument</code> |  | The actor to transfer all items and attributes from |
| target | <code>Actor/Token/TokenDocument</code> |  | The actor to receive all the items and attributes |
| [itemFilters] | <code>array/boolean</code> | <code>false</code> | Array of item types disallowed - will default to module settings if none provided |

<a name="rerenderTokenHud"></a>

---

### rerenderTokenHud() ⇒ <code>Promise</code>
Causes every user's token HUD to rerender 
