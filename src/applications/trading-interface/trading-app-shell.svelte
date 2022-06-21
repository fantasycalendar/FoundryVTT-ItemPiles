<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import DropZone from "../components/DropZone.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import * as Helpers from "../../helpers/helpers.js";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { hotkeyState } from "../../hotkeys.js";
  import ItemPileSocket from "../../socket.js";
  import SETTINGS from "../../constants/settings.js";

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

  const canPreview = Helpers.getSetting(SETTINGS.INSPECT_ITEMS_IN_TRADE)

  function previewItem() {
    if (!canPreview) return;
    const item = store.pileActor.items.get(data.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
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

                <div class="flexrow item-piles-item-row item-piles-even-color">

                  <div style="flex: 0 1 auto; margin: 0 6px;">
                    <a class="item-piles-clickable-red" on:click={store.removeItem(item)}>
                      <i class="fas fa-times"></i>
                    </a>
                  </div>

                  <div class="item-piles-img-container">
                    <img class="item-piles-img" src="{item.img}"/>
                  </div>

                  <div class="item-piles-name item-piles-text">
                    <div class="item-piles-name-container">
                      <p class="item-piles-clickable">{item.name}</p>
                    </div>
                  </div>

                  {#if item.editing}
                    <div style="flex: 0 1 auto; margin: 0 5px;">
                      <a class="item-piles-clickable-green item-piles-confirm-quantity" on:click="{() => {
                            item.quantity = Math.max(0, Math.min(item.maxQuantity, item.newQuantity));
                            if(item.quantity === 0){
                              return store.removeItem(item);
                            }
                            item.newQuantity = item.quantity;
                            item.editing = false;
                          }}">
                        <i class="fas fa-check"></i>
                      </a>
                    </div>
                  {/if}

                  <div class="item-piles-text-right item-piles-quantity-container">
                    {#if item.editing}
                      <div style="flex-direction: row;">
                        <input
                            class="item-piles-quantity"
                            type="number"
                            min="0"
                            max="{item.maxQuantity}"
                            bind:value={item.newQuantity}
                            on:input={() => { item.newQuantity = Math.max(0, Math.min(item.maxQuantity, item.newQuantity)); }}
                        />
                      </div>
                    {:else}
                      <span class="item-piles-text-right item-piles-quantity-text"
                            on:click="{ () => { item.editing = true }}">
                        {item.quantity}
                      </span>
                    {/if}
                  </div>
                </div>

              {/each}

            </div>

            {#if systemHasCurrencies}

              <div class="row item-piles-items-list item-piles-currency-list">

                <div class="flexrow item-piles-top-divider">
                  {#if isGM}
                    <a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle item-piles-gm-add-currency"><i
                        class="fas fa-plus"></i>
                      {localize("ITEM-PILES.Trade.GMAddCurrency")}
                    </a>
                  {/if}
                  <a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle item-piles-add-currency"><i
                      class="fas fa-plus"></i>
                    {localize("ITEM-PILES.Inspect.AddCurrency")}
                  </a>
                </div>

                {#each $leftCurrencies as currency (currency.path)}}

                  <div class="flexrow item-piles-item-row" data-type="currency" data-currency="{currency.path}">

                    <div style="flex: 0 1 auto; margin: 0 6px;">
                      <a class="item-piles-clickable-red item-piles-remove-item"><i class="fas fa-times"></i></a>
                    </div>

                    <div class="item-piles-img-container"><img class="item-piles-img" src="{currency.img}"/></div>

                    <div class="item-piles-name item-piles-text">
                      <div class="item-piles-name-container">
                        <a class="item-piles-clickable">{currency.name}</a>
                      </div>
                    </div>

                    {#if currency.editing}
                      <div style="flex: 0 1 auto; margin: 0 5px;">
                        <a class="item-piles-clickable-green item-piles-confirm-quantity">
                          <i class="fas fa-check"></i>
                        </a>
                      </div>
                    {/if}

                    <div style="flex:1;">
                      {#if currency.editing}
                        <div style="flex-direction: row;" class="item-piles-quantity-container">
                          <input
                              class="item-piles-quantity"
                              type="number"
                              min="0"
                              value="{currency.quantity}"
                              max="{currency.maxQuantity}"
                              on:change="{(event) => setEntryQuantity(event, currency)}"
                          />
                        </div>
                      {:else}
                    <span class="item-piles-text-right item-piles-quantity-text"
                          on:click="{ () => { currency.editing = true }}">
                      {currency.quantity}
                    </span>
                      {/if}
                    </div>

                  </div>

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

              <div class="flexrow item-piles-item-row">

                <div class="item-piles-img-container"><img class="item-piles-img" src="{item.img}"/></div>

                <div class="item-piles-name item-piles-text">
                  <div class="item-piles-name-container">
                    <a class="item-piles-clickable">{item.name}</a>
                  </div>
                </div>

                <div>
                  <span class="item-piles-text-right item-piles-text">{item.quantity}</span>
                </div>
              </div>

            {/each}

          </div>

          {#if systemHasCurrencies}

            <div class="row item-piles-items-list item-piles-currency-list">

              {#if $rightCurrencies.length }
                <div class="row item-piles-top-divider"></div>
              {/if}

              {#each $rightCurrencies as currency (currency.path)}}

                <div class="flexrow item-piles-item-row">

                  <div class="item-piles-img-container"><img class="item-piles-img" src="{currency.img}"/></div>

                  <div class="item-piles-name item-piles-text">
                    <div class="item-piles-name-container">
                      <a class="item-piles-clickable">{currency.name}</a>
                    </div>
                  </div>

                  <div>
                    <span class="item-piles-text-right item-piles-text">{currency.quantity}</span>
                  </div>
                </div>

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