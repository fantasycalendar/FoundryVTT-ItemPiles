## Table of Contents

### Documentation
- [API](https://github.com/Haxxer/FoundryVTT-ItemPiles/wiki/API)
- [Hooks](https://github.com/Haxxer/FoundryVTT-ItemPiles/wiki/Hooks)

## Basic module usage

When you first drag and drop an item on the canvas, you will be prompted by a dialog whether you want to create a new item pile. Holding **Left Alt** before drag and dropping will immediately create the default item pile.

![Dropping an item in the scene](https://raw.githubusercontent.com/fantasycalendar/FoundryVTT-ItemPiles/master/docs/images/wiki-drop.jpg)

As a GM, you can configure the default item pile, but keep in mind that the default item pile is designed to be temporary and used by players, so modifying it comes with risks and unintended behavior. If you want to experiment with different item pile setups, duplicate the default item pile, and then configure it by opening the actor sheet and clicking on "Item Pile" in the sheet's the header bar.

### Avoid changing the default item pile:

![Default Item Pile](https://raw.githubusercontent.com/fantasycalendar/FoundryVTT-ItemPiles/master/docs/images/wiki-default.jpg)

### Duplicate and change copy instead:

![Duplicate Item Pile](https://raw.githubusercontent.com/fantasycalendar/FoundryVTT-ItemPiles/master/docs/images/wiki-copy.jpg)

If you drag and drop an item on an existing item pile, you will be prompted whether you want to add it to that pile. Again, holding **Left Alt** before drag and dropping the item will circumvent the dialog and add one of that item to the item pile.

![Duplicate Item Pile](https://raw.githubusercontent.com/fantasycalendar/FoundryVTT-ItemPiles/master/docs/images/wiki-drop-into.jpg)

*Chest is from [Forgotten Adventures](https://www.forgotten-adventures.net/product/map-making/assets/table-clutter-pack-08/)*

If you are a player, you can inspect piles by double-clicking on them. You need to have a token next to the item pile in order to inspect it, unless the item pile configured has a larger interaction distance. As a GM, you can inspect any pile by holding **Left Control** and double-clicking, and you can inspect **as** someone else by shift-selecting a token and the item pile token, and holding **Left Control** and double-clicking.

![Inspecting as player 2](https://raw.githubusercontent.com/fantasycalendar/FoundryVTT-ItemPiles/master/docs/images/wiki-inspect-as.jpg)

*Chest is from [Forgotten Adventures](https://www.forgotten-adventures.net/product/map-making/assets/table-clutter-pack-08/)*

As both a player and a GM, you can drag and drop items into this inspection UI as well, just like you can drag and drop items onto the item pile token. Anyone who can inspect the item pile can take items from it, or take all of the item pile's content.
