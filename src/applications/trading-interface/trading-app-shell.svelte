<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import DropZone from "../components/DropZone.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import * as Helpers from "../../helpers/helpers.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { hotkeyState } from "../../hotkeys.js";
  import ItemPileSocket from "../../socket.js";
  import SETTINGS from "../../constants/settings.js";
  import TradeEntry from "./TradeEntry.svelte";
  import DropCurrencyDialog from "../drop-currency-dialog/drop-currency-dialog.js";

  export let elementRoot;
  export let store;

  const leftItems = store.leftTraderItems;
  const leftCurrencies = store.leftTraderCurrencies;
  const leftItemCurrencies = store.leftTraderItemCurrencies;
  const leftTraderAccepted = store.leftTraderAccepted;

  const rightItems = store.rightTraderItems;
  const rightCurrencies = store.rightTraderCurrencies;
  const rightItemCurrencies = store.rightTraderItemCurrencies;
  const rightTraderAccepted = store.rightTraderAccepted;

  let isGM = game.user.isGM;
  let systemHasCurrencies = game.itempiles.CURRENCIES.items.length > 0
    && game.itempiles.CURRENCIES.attributes.length > 0;

  async function dropItem(data) {

    if (data.type !== "Item") return;

    if (!data.actorId) {
      if (!game.user.isGM) return Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Errors.NoSourceDrop"), true)
    }

    if (!game.user.isGM && data.actorId && data.actorId !== store.leftTraderActor.id) {
      throw Helpers.custom_error(`You cannot drop items into the trade UI from a different actor than ${store.leftTraderActor.name}!`)
    }

    let item = await Item.implementation.fromDropData(data);
    let itemData = item.toObject();

    if (!itemData) {
      console.error(data);
      throw Helpers.custom_error("Something went wrong when dropping this item!")
    }

    const disallowedType = PileUtilities.isItemInvalid(store.rightTraderActor, item);
    if (disallowedType) {
      if (!game.user.isGM) {
        return Helpers.custom_warning(game.i18n.format("ITEM-PILES.Errors.DisallowedItemDrop", { type: disallowedType }), true);
      }
      if (!hotkeyState.shiftDown) {
        const force = await Dialog.confirm({
          title: game.i18n.localize("ITEM-PILES.Dialogs.DropTypeWarning.Title"),
          content: `<p class="item-piles-dialog">${game.i18n.format("ITEM-PILES.Dialogs.DropTypeWarning.Content", { type: disallowedType })}</p>`,
          defaultYes: false
        });
        if (!force) {
          return false;
        }
      }
    }

    return store.addItem(itemData, game.user.isGM);

  }

  leftItems.subscribe(async (items) => {
    await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_UPDATE_ITEMS, [store.leftTraderUser.id, store.rightTraderUser.id], store.privateTradeId, game.user.id, items);
    return executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_UPDATE_ITEMS, store.publicTradeId, game.user.id, items);
  })

  leftTraderAccepted.subscribe(async (acceptedState) => {
    await ItemPileSocket.executeForUsers(ItemPileSocket.HANDLERS.PRIVATE_TRADE_STATE, [store.leftTraderUser.id, store.rightTraderUser.id], store.privateTradeId, game.user.id, acceptedState);
    return executeSocketAction(ItemPileSocket.HANDLERS.PUBLIC_TRADE_STATE, store.publicTradeId, game.user.id, acceptedState);
  })

  async function executeSocketAction(socketHandler, ...args) {
    if (store.isPrivate) {
      return ItemPileSocket.executeForUsers(socketHandler, [store.leftTraderUser.id, store.rightTraderUser.id], ...args);
    }
    return ItemPileSocket.executeForEveryone(socketHandler, ...args);
  }

  async function addCurrency(asGM = false) {

    const currencyToAdd = await DropCurrencyDialog.show(
      store.leftTraderActor,
      store.rightTraderActor,
      {
        existingCurrencies: store.getExistingCurrencies(),
        title: game.i18n.localize("ITEM-PILES.Trade.AddCurrency.Title"),
        content: game.i18n.format("ITEM-PILES.Trade.AddCurrency.Content", { trader_actor_name: store.rightTraderActor.name }),
        button: game.i18n.localize("ITEM-PILES.Trade.AddCurrency.Label"),
        unlimitedCurrencies: asGM
      }
    );

    console.log(currencyToAdd)

    /*if (!currencyToAdd) return;

    const currencies = lib.getFormattedActorCurrencies(this.leftTraderActor, { getAll: asGM });

    Object.entries(currencyToAdd).forEach(entry => {

      const existingCurrency = this.leftTraderActorCurrencies.find(currency => currency.path === entry[0]);

      if (existingCurrency) {
        existingCurrency.quantity = entry[1];
        return;
      }

      const currency = currencies.find(currency => currency.path === entry[0]);

      this.leftTraderActorCurrencies.push({
        path: entry[0],
        quantity: entry[1],
        name: currency.name,
        img: currency.img,
        maxQuantity: !asGM ? currency.quantity : Infinity,
        index: currency.index
      });

    });

    this.leftTraderActorCurrencies = this.leftTraderActorCurrencies.filter(currency => currency.quantity);

    this.leftTraderActorCurrencies.sort((a, b) => a.index - b.index);

    await itemPileSocket.executeForUsers(SOCKET_HANDLERS.PRIVATE.TRADE_UPDATE_CURRENCIES, [this.leftTraderUser.id, this.rightTraderUser.id], this.privateTradeId, game.user.id, this.leftTraderActorCurrencies);
    return this.executeSocketAction(SOCKET_HANDLERS.PUBLIC.TRADE_UPDATE_CURRENCIES, this.publicTradeId, game.user.id, this.leftTraderActorCurrencies);
*/
  }


</script>


<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <div class="flexcol">

    <div class="flexrow">

      <div class="col flexcol">

        <div class="character-header item-piles-bottom-divider">
          <img src="{store.leftTraderActor.img}">
          <h2 class="character-name">
            <div>{store.leftTraderActor.name}</div>
          </h2>
        </div>

        <DropZone callback={dropItem}>

          <div class="flexcol" class:accepted={$leftTraderAccepted}>

            <div class="row item-piles-items-list">

              {#if !$leftItems.length}
                <div class="flexcol">
                  <h3 class="item-piles-text-center">{localize("ITEM-PILES.Trade.DragDrop")}</h3>
                </div>
              {/if}

              {#each $leftItems as item (item.id)}
                <TradeEntry bind:data={item} {store}/>
              {/each}

            </div>

            {#if systemHasCurrencies}

              <div class="row item-piles-items-list item-piles-currency-list">

                <div class="flexrow item-piles-top-divider">
                  {#if isGM}
                    <a on:click={() => { addCurrency(true) }}
                       class="item-piles-text-right item-piles-small-text item-piles-middle item-piles-gm-add-currency">
                      <i class="fas fa-plus"></i>
                      {localize("ITEM-PILES.Trade.GMAddCurrency")}
                    </a>
                  {/if}
                  <a on:click={() => { addCurrency() }}
                     class="item-piles-text-right item-piles-small-text item-piles-middle item-piles-add-currency">
                    <i class="fas fa-plus"></i>
                    {localize("ITEM-PILES.Inspect.AddCurrency")}
                  </a>
                </div>

                {#each $leftCurrencies as currency (currency.path)}}
                  <TradeEntry bind:data={currency} {store} editable={false}/>
                {/each}

              </div>

            {/if}

          </div>

        </DropZone>

        <button type="button" style="flex:0 1 auto;" on:click={() => { store.toggleAccepted(store.leftTraderUser.id) }}>
          {#if $leftTraderAccepted}
            <i class="fas fa-times"></i>
            {localize("Cancel")}
          {:else}
            <i class="fas fa-check"></i>
            {localize("ITEM-PILES.Trade.Accept")}
          {/if}
        </button>

      </div>

      <div class="col flexcol">

        <div class="character-header trader item-piles-bottom-divider">
          <h2 class="character-name">
            {store.rightTraderActor.name}
          </h2>
          <img src="{store.rightTraderActor.img}">
        </div>

        <div class="flexcol" class:accepted={$rightTraderAccepted}>

          <div class="row item-piles-items-list">

            {#each $rightItems as item (item.id)}
              <TradeEntry bind:data={item} {store} editable={false}/>
            {/each}

          </div>

          {#if systemHasCurrencies}

            <div class="row item-piles-items-list item-piles-currency-list">

              {#if $rightCurrencies.length }
                <div class="row item-piles-top-divider"></div>
              {/if}

              {#each $rightCurrencies as currency (currency.path)}}
                <TradeEntry bind:data={currency} {store} editable={false}/>
              {/each}

            </div>

          {/if}

        </div>

      </div>
    </div>

  </div>

</ApplicationShell>


<style lang="scss">

  .col {
    flex-direction: column;
    margin: 0 5px;
  }

  .col:not(:last-child) {
    padding-right: 10px;
    border-right: 1px solid black;
  }

  .row {
    flex: 1;
  }

  .row:last-child {
    flex: 0 1 auto;
  }

  .trader {

  }

</style>