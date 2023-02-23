# Constants

Item Piles utilizes constants throughout its code; constants are simply variables that do not change. They are useful because Item Piles declares and assigns them once, but can be referred to over and over again throughout its code, or your code.

## Hooks

`game.itempiles.hooks`

This constant contains every hook that you can listen to through `Hooks.once` or `Hooks.on`.

Example:

```js
Hooks.once(game.itempiles.hooks.READY, () => {
  /// Called once Item Piles is ready to be used
});
```

## Flags

`game.itempiles.flags`

This constant contains every flag property that items or item piles can have.

```js
// Logs the selected token's item piles flags
console.log(getProperty(token.actor, game.itempiles.flags.PILE));
```

## Pile Flag Defaults

`game.itempiles.pile_flag_defaults`

This constant contains every flag that can be potentially set on item piles.

## Pile Types

`game.itempiles.pile_types`

This constant contains every item piles type available:

- `game.itempiles.pile_types.PILE`
- `game.itempiles.pile_types.CONTAINER`
- `game.itempiles.pile_types.MERCHANT`
- `game.itempiles.pile_types.VAULT`

Example:

```js
game.itempiles.API.turnTokensIntoItemPiles(token, {
  pileSettings: {
    type: game.itempiles.pile_types.CONTAINER
  }
});
```

## Item Flag Defaults

`game.itempiles.item_flag_defaults`

This constant contains every flag that can be potentially set on items themselves.
