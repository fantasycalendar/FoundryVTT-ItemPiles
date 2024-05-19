# Contributing to Item Piles

Anyone can help evolve Item Piles as they see fit, as it is an open sourced module, meaning no one truly "owns" the module, and everyone can contribute to the codebase!

## Setting up your environment

### Forking the repository

You can fork the Item Piles GitHub repository in order to create your own version of the module you can edit and submit to. [Read more](https://docs.github.com/en/get-started/quickstart/fork-a-repo#forking-a-repository) to find out how to do this. You can fork Item Piles by clicking [this link](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/fork).

### Editing your fork

After you've forked it, you can now edit it [directly on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files), or clone it to a local folder. If you would like to test it locally on your own Foundry VTT installation, follow the next section.

### Running your fork locally

Once you have gotten your fork cloned locally to your computer, you need to put it into the `modules` folder under your Foundry data. The folder
**must** be named `item-piles` for the next steps to work.

In order to actually get it running, you need to run `npm install` in your code editor's terminal while in the `item-piles`. You can open the terminal by pressing Ctrl/Cmd + \` and then typing running the command. This will install all the prerequisite files for Item Piles to function.

Once that has finished running, you need to run `npm run build`, which will package everything into a Foundry-ready package. This is required even if you only want to get the hot-reload steps later.

You can now launch Foundry VTT and enable Item Piles in the module list of your world. However, every time you make a change, you will need to re-run `npm run build`, which can be annoying. Instead, after running build, you can run `npm run dev`, which will set up a hot-reload build process, which means that anytime you change any code, it will be recognized and Foundry will reload as the module rebuilds. You will need to connect to your Foundry VTT instance through a browser and through your normal IP or address, but with port `29999` instead of port `30000`.

Once connected to (for example) `127.0.0.1:29999`, anytime you change any code in the module, it will refresh Foundry VTT and get you the latest Item Piles code running.

## System Support Contributions

I welcome all systems, but with me having to manually add support myself has become a time sink. I instead require everyone that wants to add support for specific systems to follow the guide below.

### Adding system support through a pull request

**Note:
** You will need to follow the [Setting up your environment](#setting-up-your-environment) section above if you wish to go for this way.

In Item Piles, every single system has its own file, named after the system ID in its `system.json` file. [You can find them all here](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/tree/master/src/systems).

Taking [D&D5e's file](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/blob/master/src/systems/dnd5e.js) as an example, you can see it is a `.js` file containing a single object, that has a few properties. These properties are what determines system support.

- `VERSION` is the version of the **Item Piles support
  **. This means that you can change the file, then increment this version to make Item Piles recognize that something has changed to update the user's Item Piles system data.
- `ACTOR_CLASS_TYPE` is the name of the type of actor that will be used for the default item pile.
- `ITEM_QUANTITY_ATTRIBUTE` determines which property the system uses to determine the quantity of items. If there is none, you can remove this.
- `ITEM_PRICE_ATTRIBUTE` is the property on items that determine its price. If there is none, you can remove this.
- `ITEM_FILTERS` is an array of objects that determine which items are **not
  ** physical items that can be picked up, like spells, talents, etc. Each entry in this array must be an object that contains a `path` property pointing at a property that is shared across all items, such as `type`, and a `filters` property, which is a comma-delimited string that contains what should be considered as not an item.
- `ITEM_SIMILARITIES` is an array that contains all the item properties (dot-notated path, such as `type`, `name`, etc) that will be considered when comparing items and determining if they are the same item.

There are a few more, you can read the documentation about them all [here](https://fantasycomputer.works/FoundryVTT-ItemPiles/#/api?id=addsystemintegration). This is a function, yes, but the input content is the same as the system support `.js` file.

Once this file has been added, it can be imported and added to the [_index.js](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/blob/master/src/systems/_index.js) file. Anytime Item Piles loads in a system that has an ID that matches it in this file, it will be automatically loaded.

### Adding system support through a module or directly from the system

If you want to add support for Item Piles for a system in your module or directly in the system, you can do so through the [game.itempiles.API.addSystemIntegration](https://fantasycomputer.works/FoundryVTT-ItemPiles/#/api?id=addsystemintegration) function in Item Piles' API.

You can see an example how Item Piles support was added to the [Old-School Essentials system here](https://github.com/vttred/ose/blob/main/src/module/fvttModuleAPIs.js#L7-L62).
