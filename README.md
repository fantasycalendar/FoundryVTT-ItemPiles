# Item Piles

This module enables dropping items onto the canvas, which then get represented as a pile of items. In order to work in all systems without breaking messing too much with Foundry, this **creates an unlinked token & actor** to hold these items. When a player double-clicks on an item pile token, it opens a custom UI to show what the pile contains and players can then take items from it.

Item Piles can also be configured to act as a container, where it can be open or closed, locked or unlocked, with the ability for the token that represents the pile to change image depending on its state. In addition, when an item pile is interacted with it can also play sounds for the action, such as opening, closing, or attempting to open a locked item pile.

## Item Pile Settings
