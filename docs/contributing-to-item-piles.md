# Contributing to Item Piles

Anyone can help evolve Item Piles as they see fit, as it is an open sourced module, meaning no one truly "owns" the module, and everyone can contribute to the codebase!

## Setting up your environment

### Forking the repository

You can fork the Item Piles GitHub repository in order to create your own version of the module you can edit and submit to. [Read more](https://docs.github.com/en/get-started/quickstart/fork-a-repo#forking-a-repository) to find out how to do this. You can fork Item Piles by clicking [this link](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/fork).

### Editing your fork

After you've forked it, you can now edit it [directly on GitHub](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files), or clone it to a local folder. If you would like to test it locally on your own Foundry VTT installation, follow the next section.

### Running your fork locally

Once you have gotten your fork cloned locally to your computer, you need to put it into the
`modules` folder under your Foundry data. The folder
**must** be named `item-piles` for the next steps to work.

In order to actually get it running, you need to run `npm install` in your code editor's terminal while in the
`item-piles`. You can open the terminal by pressing Ctrl/Cmd + \` and then typing running the command. This will install all the prerequisite files for Item Piles to function.

Once that has finished running, you need to run
`npm run build`, which will package everything into a Foundry-ready package. This is required even if you only want to get the hot-reload steps later.

You can now launch Foundry VTT and enable Item Piles in the module list of your world. However, every time you make a change, you will need to re-run
`npm run build`, which can be annoying. Instead, after running build, you can run
`npm run dev`, which will set up a hot-reload build process, which means that anytime you change any code, it will be recognized and Foundry will reload as the module rebuilds. You will need to connect to your Foundry VTT instance through a browser and through your normal IP or address, but with port
`29999` instead of port `30000`.

Once connected to (for example)
`127.0.0.1:29999`, anytime you change any code in the module, it will refresh Foundry VTT and get you the latest Item Piles code running.

## Adding system support

I welcome all systems, but it has become a time sink and a delaying factor for me to add support for all of Foundry's game systems into Item Piles.

Going forward, I insist everyone that wants to add support for specific systems to instead create their own system-specific Item Piles compatibility module.

Please see the [Item Piles: D&D 5e](https://github.com/fantasycalendar/FoundryVTT-ItemPilesDnD5e) as an example. All previous integrations can be found in the [Item Piles repository](https://github.com/fantasycalendar/FoundryVTT-ItemPiles/tree/master/systems)

You will need to register a new hook on `item-piles-ready`, which then will need to call `game.itempiles.API.addSystemIntegration`. You can find more information regarding this [method here](api.md#addsystemintegration).

The main one to look out for is `VERSION` - it acts as your system configuration version, and when your system config is applied, it checks the `VERSION` against the user's stored `VERSION`, and override it if it is newer. I.E. if the user has version `1.0.1` of your config and you update it to be `1.0.2`, your config will override theirs. This means users can configure their item pile system data (eg, delete currencies or create new ones), and your config is only applied when you increment it.

Taking the `Item Piles: D&D 5e` module as an example, you can see it meets the above requirements, and that it defines a `ITEMPILES` variable. Within, there's a few objects with properties, and it is these properties that determines the system support. This module also handles multiple different system versions.

If you want to add support for Item Piles for a system in your module or directly in the system, you can do so through the same API function.

You can see an example how Item Piles support was added to the [Old-School Essentials system here](https://github.com/vttred/ose/blob/main/src/module/fvttModuleAPIs.js#L7-L62).
