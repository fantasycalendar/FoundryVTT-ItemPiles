# Usage with Typescript

Item Piles is written purely in Javascript, however types have been provided to make it easier to integrate with third party typescript apps. Please note: as these types are written separately from the javascript code, these can desync after certain updates. If these are found, please open an issue.

## Getting Started

The easiest way to get started with the types is to install the package via npm and github. Add the following line to your package.json:

```json
{
  //...
    "devDependencies": {
      //...
        "item-piles": "github:fantasycalendar/FoundryVTT-ItemPiles#master",
      //...
    }
  //...
}
```

Then run `npm install`. Note: if you see an errors during install, these might be due to post install scripts for esbuild or something similar so you can try `npm install --ignore-scripts` instead.

Afterwards, open up your "tsconfig.json" and add "item-piles" to your types.

```json
{
  // ...
  "types": ["item-piles"],
  // ...
}
```

You can now access the Item Piles types from the `ItemPiles` namespace globally.

## Attaching to game and other types

The types defined are contained within the `ItemPiles` namespace an attaching it to the `game` type must be done manually. Additionally, no types for the inbuilt foundry types are provided as that would be out of scope and difficult to maintain.

However, the types provided allow for easy attachment to the `game` type using `ItemPiles.ItemPilesGameInterface`, and easy integration with foundry types defined from the outside using declaration merging on the `ItemPiles.FoundryTypes` interface.

A thing to note is that the types in `FoundryTypes` do not need to all be included, and will default to unknown. You can add the types if and when they're needed.

### Example with no types defined or self defined types

Start by creating a `item-piles.d.ts` (the name is not important, the extension is though only if you're making sure all `.d.ts` files are included in your project). Inside the file you could then add:

```ts
export {}

// just as an example
type BasicDocument = {
  id: string
  uuid: string
  name: string
}

declare global {
  declare namespace ItemPiles {
    // Define our FoundryTypes for the ItemPiles types to use
    export interface FoundryTypes {
      Actor: BasicDocument
      Item: BasicDocument
      Token: BasicDocument
      TokenDocument: BasicDocument
      RollTable: BasicDocument
      User: BasicDocument
      // Note: roll data is somewhat complicated so it would be best to
      // only include what you need
      RollData: {
        actor: BasicDocument
      }
    }
  }

  declare const game = {
    itempiles: ItemPiles.ItemPilesGameInterface
  }
}

You should now have `game.itempiles` available to use and fully typed with the shared types.


```


### Example with Foundry VTT Types
The following example uses the [foundry-vtt-types](https://github.com/League-of-Foundry-Developers/foundry-vtt-types) provided by the League of Foundry Developers and assumes you have set up that already. Start by creating a `item-piles.d.ts` (the name is not important, the extension is though only if you're making sure all `.d.ts` files are included in your project). Inside the file you could then add:

```ts
export {};

declare global {
  declare namespace ItemPiles {
    // Define our FoundryTypes for the ItemPiles types to use
    export interface FoundryTypes {
      Actor: foundry.documents.Actor;
      Item: foundry.documents.Item;
      Token: foundry.documents.BaseToken;
      TokenDocument: foundry.documents.TokenDocument;
      RollTable: foundry.documents.RollTable;
      User: foundry.documents.User;
      // Note: roll data is somewhat complicated so it would be best to
      // only include what you need
      RollData: {
        actor: foundry.documents.Actor;
      };
    }
  }

  interface ReadyGame {
    itempiles: ItemPiles.ItemPilesGameInterface;
  }

  interface SetupGame {
    itempiles: ItemPiles.ItemPilesGameInterface;
  }
}
```

You should now have `game.itempiles` available to use and fully typed with the shared types.
