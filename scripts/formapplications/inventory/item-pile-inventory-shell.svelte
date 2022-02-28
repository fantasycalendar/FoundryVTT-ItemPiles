<script>
   import {getContext} from 'svelte';
   import {fade} from 'svelte/transition';
   import {localize} from '@typhonjs-fvtt/runtime/svelte/helper';
   import {ApplicationShell} from '@typhonjs-fvtt/runtime/svelte/component/core';
   import * as lib from "../../lib/lib";
   import * as utils from "../../lib/utils";
   import API from "../../api";
   import DropCurrencyDialog from "../drop-currency-dialog";
   import {isPileInventoryOpenForOthers} from "../../socket";

   const { application } = getContext('external');

   export let elementRoot;

   export let pile;
   export let recipient;
   export let overrides;

   let pileActor = pile?.actor ?? pile;
   let recipientActor = recipient?.actor ?? recipient;
   let editQuantities = !recipient && pile.isOwner && game.user.isGM;
   let playerActors = game.actors.filter(actor => actor.isOwner && actor !== pileActor && actor.data.token.actorLink);

   let recipientActorUuid = recipientActor ? recipientActor.uuid : false;

   let items;
   let currencies;
   let hasSplittableItems;
   let hasSplittableCurrencies;
   let deleted = false;
   let pileData = lib.getItemPileData(pileActor);
   let sharingData = lib.getItemPileSharingData(pileActor);
   let num_players = lib.getPlayersForItemPile(pileActor).length;
   let interactionId = randomID();
   let showSearch = false;

   updateContents();

   let isPileEmpty = !items.length && !currencies.length;

   export function updateContents(){

      updateItems();
      updateCurrencies();

      pileData = lib.getItemPileData(pileActor);
      sharingData = lib.getItemPileSharingData(pileActor);
      num_players = lib.getPlayersForItemPile(pileActor).length;

      hasSplittableItems = pileData.shareItemsEnabled && items && !!items?.find(item => {
         let quantity = item.quantity;
         if(sharingData.currencies){
            const itemSharingData = sharingData.currencies.find(sharingCurrency => sharingCurrency.path === item.path);
            if(itemSharingData){
               quantity += itemSharingData.actors.reduce((acc, data) => acc + data.quantity, 0);
            }
         }
         return (quantity / num_players) >= 1;
      });

      hasSplittableCurrencies = pileData.shareCurrenciesEnabled && currencies && !!currencies?.find(currency => {
         let quantity = currency.quantity;
         if(sharingData.currencies) {
            const currencySharingData = sharingData.currencies.find(sharingCurrency => sharingCurrency.path === currency.path);
            if (currencySharingData) {
               quantity += currencySharingData.actors.reduce((acc, data) => acc + data.quantity, 0);
            }
         }
         return (quantity / num_players) >= 1;
      });

      showSearch = (items.length + currencies.length) > 10;

   }

   function updateItems() {

      // Get all of the items on the actor right now
      const newItems = lib.getItemPileItemsForActor(pileActor, recipientActor);

      if(!items){
         items = newItems;
         return;
      }

      // If there are none, stop displaying them in the UI
      if (!newItems.length) {
         items = [];
         return;
      }

      // Otherwise, loop through the old items
      for (let oldItem of items) {

         // If we find an item that was previously listed
         const foundItem = lib.findSimilarItem(newItems, oldItem);

         // We update the previously listed attribute to reflect this
         oldItem.quantity = foundItem ? foundItem.quantity : 0;
         oldItem.shareLeft = foundItem ? foundItem.shareLeft : 0;
         oldItem.currentQuantity = foundItem ? Math.min(oldItem.currentQuantity, foundItem.shareLeft) : 0;

         // We then remove it from the incoming list, as we already have it
         if (foundItem) {
            newItems.splice(newItems.indexOf(foundItem), 1)
         }

      }

      // Add the new items to the list
      items = items.concat(newItems);

   }

   function updateCurrencies(){

      // Get all of the currencies on the actor right now
      const newCurrencies = lib.getItemPileCurrenciesForActor(pileActor, recipientActor);

      if(!currencies){
         currencies = newCurrencies;
         return;
      }

      // If there are none, stop displaying them in the UI
      if (!newCurrencies.length) {
         currencies = [];
         return;
      }

      // Otherwise, loop through the old currencies
      for (let oldCurrency of currencies) {

         // If we find an currency that was previously listed
         const foundCurrency = newCurrencies.find(newCurrency => newCurrency.path === oldCurrency.path);

         // We update the previously listed currency to reflect this
         oldCurrency.quantity = foundCurrency ? foundCurrency.quantity : 0;
         oldCurrency.shareLeft = foundCurrency ? foundCurrency.shareLeft : 0;
         oldCurrency.currentQuantity = foundCurrency ? Math.min(oldCurrency.currentQuantity, foundCurrency.shareLeft) : 0;

         if (foundCurrency) {
            // We then remove it from the incoming list, as we already have it
            newCurrencies.splice(newCurrencies.indexOf(foundCurrency), 1)
         }

      }

      // Add the new currencies to the list
      currencies = currencies.concat(newCurrencies);

   }

   let changingActor = false;

   function changeInspectActor(){
      recipient = playerActors.find(actor => actor.uuid === recipientActorUuid);
      recipientActor = recipient?.actor ?? recipient;
      changingActor = false;
   }

   function take(data){

      const quantity = Math.min(data.currentQuantity, data.quantity);

      if(data.id) {
         return API.transferItems(pile, recipient, [{ _id: data.id,quantity }], { interactionId });
      }

      return API.transferAttributes(pile, recipient, { [data.path]: quantity }, { interactionId });

   }

   function takeAll(){
      API.transferEverything(pile, recipient, { interactionId });
   }

   function closeContainer(){
      isPileInventoryOpenForOthers.query(pile).then((result) => {
         debugger;
         if (!result) API.closeItemPile(pile, recipient);
      });
      application.close();
   }

   let search = '';
   function filterByName(){
      items.forEach(item => {
         item.visible = !search || item.name.toLowerCase().includes(search.toLowerCase());
      });
      currencies.forEach(currency => {
         currency.visible = !search || currency.name.toLowerCase().includes(search.toLowerCase());
      });
      items = items;
      currencies = currencies;
   }

   function previewItem(item){
      item = pileActor.items.get(item.id);
      if (game.user.isGM || item.data.permission[game.user.id] === 3) {
         return item.sheet.render(true);
      }
      const cls = item._getSheetClass()
      const sheet = new cls(item, { editable: false })
      return sheet._render(true);
   }

   async function splitAll(){
      await API.splitItemPileContents(pileActor);
   }

   async function updatePile(){
      utils.custom_notify("Item Pile successfully updated.");

      const itemsToUpdate = [];
      const currenciesToUpdate = {};

      for(let item of items){
         itemsToUpdate.push({
            _id: item.id,
            [API.ITEM_QUANTITY_ATTRIBUTE]: item.quantity
         })
      }

      for(let currency of currencies){
         currenciesToUpdate[currency.path] = currency.quantity;
      }

      const pileSharingData = lib.getItemPileSharingData(pile);

      const hasAttributes = !foundry.utils.isObjectEmpty(currenciesToUpdate);

      if (hasAttributes) {
         await pileActor.update(currenciesToUpdate);
         if (pileSharingData?.currencies) {
            pileSharingData.currencies = pileSharingData.currencies.map(currency => {
               if (currenciesToUpdate[currency.path] !== undefined) {
                  currency.actors = currency.actors.map(actor => {
                     actor.quantity = Math.max(0, Math.min(actor.quantity, currenciesToUpdate[currency.path]));
                     return actor;
                  })
               }
               return currency;
            })
         }
      }

      if (itemsToUpdate.length) {
         await pileActor.updateEmbeddedDocuments("Item", itemsToUpdate);
         if (pileSharingData?.items) {
            pileSharingData.items = pileSharingData.items.map(item => {
               const sharingItem = itemsToUpdate.find(item => item._id === item.id);
               if (sharingItem) {
                  item.actors = item.actors.map(actor => {
                     actor.quantity = Math.max(0, Math.min(actor.quantity, sharingItem.quantity));
                     return actor;
                  })
               }
               return item;
            })
         }
      }

      if (itemsToUpdate.length || hasAttributes) {
         await lib.updateItemPileSharingData(pile, pileSharingData);
      }
   }

   async function addCurrency(){

      if (recipientActor) {
         const currencyToAdd = await DropCurrencyDialog.query({
            target: pileActor,
            source: recipientActor
         })
         return API.transferAttributes(recipientActor, pileActor, currencyToAdd);
      } else if (game.user.isGM) {
         const currencyToAdd = await DropCurrencyDialog.query({
            target: pileActor,
            source: recipientActor,
            includeAllCurrencies: true
         })
         return API.addAttributes(pileActor, currencyToAdd);
      }
   }

   let imageContainer;
   let imageContainerTop = 0;
   let imageContainerLeft = 0;
   let hoverImage = '';
   let showImage = false;
   let timer;
   function mouseEnterImage(event){
      const element = event.target;
      hoverImage = element.src;
      timer = setTimeout(function () {
         showImage = true;
         imageContainerTop = event.clientY - 150 - 11;
         imageContainerLeft = event.clientX - 340;
      }, 250);
   }

   function mouseLeaveImage(){
      hoverImage = '';
      showImage = false;
      clearTimeout(timer);
   }

   function dropData(event){

      debugger;

      event.preventDefault();

      let data;
      try {
         data = JSON.parse(event.dataTransfer.getData('text/plain'));
      } catch (err) {
         return false;
      }

      return API._dropData(canvas, data, { target: pile });

   }

   function preventDefault(event){
      event.preventDefault();
   }

   let itemListElement;
   let scrolled = false;

   function evaluateShadow(){
      scrolled = itemListElement.scrollTop > 20;
   }

</script>

<svelte:options accessors={true}/>

<div bind:this={imageContainer}
     id="item-piles-preview-container"
     style="left: {imageContainerLeft}px; top: {imageContainerTop}px;"
>
   {#if showImage}
      <img id="item-piles-preview-image" src="{hoverImage}" transition:fade={{duration:150}}/>
   {/if}
</div>

<ApplicationShell bind:elementRoot>

   <main in:fade={{duration: 500}}>

      <div class="item-piles-item-drop-container" on:dragstart={preventDefault} on:drop={dropData} on:dragover={preventDefault}>

         {#if deleted}
            <p style="text-align: center; flex: 0 1 auto;">{localize("ITEM-PILES.Inspect.Destroyed")}</p>
         {:else}

            {#if editQuantities}
               <p style="text-align: center; flex: 0 1 auto;">{localize("ITEM-PILES.Inspect.Owner")}</p>
            {:else}
               <p style="text-align: center; flex: 0 1 auto; height: 27px;">
                  {localize("ITEM-PILES.Inspect.AsActor", { actorName: recipientActor.name })}
                  <a class='item-piles-highlight' on:click={() => { changingActor = true }} class:hidden={changingActor}>Change actor.</a>
                  <select class="item-piles-change-actor-select" bind:value={recipientActorUuid} on:change={changeInspectActor} class:hidden={!changingActor} style="height:auto;">
                     {#each playerActors as actor, index (index)}
                        <option value="{actor.uuid}">{actor.name}</option>
                     {/each}
                  </select>
               </p>
            {/if}

            {#if isPileEmpty}
               <p class="item-piles-top-divider" style="text-align: center; flex: 0 1 auto;">{localize("ITEM-PILES.Inspect.Empty")}</p>
            {:else}
               {#if showSearch}
               <div class="form-group flexrow item-piles-top-divider item-piles-bottom-divider" style="margin-bottom: 0.5rem; align-items: center;" transition:fade={{duration: 250}}>
                  <label style="flex:0 1 auto; margin-right: 5px;">Search:</label>
                  <input type="text" bind:value={search} on:keyup={foundry.utils.debounce(filterByName, 250)}>
               </div>
               {/if}
            {/if}

            <div class="item-piles-items-list" bind:this={itemListElement} on:scroll={evaluateShadow}>

               {#if scrolled}
                  <div class="item-pile-shadow scroll-shadow-top" transition:fade={{duration:300}}></div><div></div>
               {/if}

               {#if !!items.length}

               <div class="flexrow"><h3>{localize("ITEM-PILES.Items")}:</h3></div>

               {#each items as item (item.id)}
               {#if item.visible}

               <div class="flexrow item-piles-item-row item-piles-even-color" transition:fade={{duration: 250}} class:item-piles-disabled={!editQuantities && !item.shareLeft}>

                  <div class="item-piles-img-container"><img class="item-piles-img" src="{item.img}" on:mouseenter={mouseEnterImage} on:mouseleave={mouseLeaveImage}/></div>

                  <div class="item-piles-name">
                     <div class="item-piles-name-container">
                        <a class="item-piles-clickable" on:click={previewItem(item)}>{item.name}</a> <span class="item-piles-small-text">(x{item.quantity})</span>
                     </div>
                  </div>

                  <div style="flex:2.5;">

                     {#if editQuantities}

                        <div class="item-piles-quantity-container">
                           <input class="item-piles-quantity" type="number" min="0" bind:value="{item.quantity}"/>
                        </div>

                     {:else}

                        {#if item.shareLeft}
                           <div class="item-piles-quantity-container">
                              <input class="item-piles-quantity" type="number" min="1" bind:value="{item.currentQuantity}" max="{item.quantity}" disabled="{!item.quantity}"/>

                              <span class="item-piles-input-divider" class:item-piles-text-right={!recipientActor}>
                                 / {item.shareLeft}
                              </span>
                           </div>
                        {:else}
                           <span>{localize(`ITEM-PILES.Inspect.${pileData.shareItemsEnabled ? "NoShareLeft" : "NoneLeft"}`)}</span>
                        {/if}
                     {/if}

                  </div>

                  {#if !editQuantities}

                     <button on:click={take(item)} class="item-piles-item-take-button" type="button" disabled={!item.shareLeft}>{localize("ITEM-PILES.Inspect.Take")}</button>

                  {/if}

               </div>

               {/if}

               {/each}

               {/if}

               {#if !!items.length && !!currencies.length}
               <hr>
               {/if}

               {#if !!currencies.length}

               <div class="flexrow">
                  <h3>{localize("ITEM-PILES.Currencies")}:</h3>
                  {#if recipient}
                  <a class="item-piles-clickable item-piles-text-right item-piles-small-text item-piles-middle" on:click={addCurrency}>
                     <i class="fas fa-plus"></i> {localize("ITEM-PILES.Inspect.AddCurrency")}
                  </a>
                  {/if}
               </div>

               {#each currencies as currency, index (currency.path)}

                  {#if currency.visible}

                  <div class="flexrow item-piles-item-row item-piles-even-color" class:item-piles-disabled={!editQuantities && !currency.shareLeft}>

                     <div class="item-piles-img-container"><img class="item-piles-img" on:mouseenter={mouseEnterImage} on:mouseleave={mouseLeaveImage} src="{currency.img}"/></div>

                     <div class="item-piles-name">
                        <div class="item-piles-name-container">
                           <a class="item-piles-clickable">{currency.name}</a>
                           <span class="item-piles-small-text">x{currency.quantity}</span>
                        </div>
                     </div>

                     <div style="flex:2.5;">

                        {#if editQuantities}

                           <div class="item-piles-quantity-container">
                              <input class="item-piles-quantity" type="number" min="0" bind:value="{currency.quantity}"/>
                           </div>

                        {:else}

                           {#if currency.shareLeft}
                              <div class="item-piles-quantity-container">
                                 <input class="item-piles-quantity" type="number" min="1" bind:value="{currency.currentQuantity}" max="{currency.quantity}" disabled="{!currency.quantity}"/>
                                 <span class="item-piles-input-divider" class:item-piles-text-right={!recipientActor}>
                                 / {currency.shareLeft}
                              </span>
                              </div>
                           {:else}
                              <span>{localize(`ITEM-PILES.Inspect.${pileData.shareCurrenciesEnabled ? "NoShareLeft" : "NoneLeft"}`)}</span>
                           {/if}
                        {/if}

                     </div>

                     {#if !editQuantities}

                        <button on:click={take(currency)} class="item-piles-item-take-button" type="button" disabled={!currency.shareLeft}>{localize("ITEM-PILES.Inspect.Take")}</button>


                     {/if}

                  </div>

                  {/if}

               {/each}

               {/if}

            </div>

         {/if}


         <footer class="sheet-footer flexrow item-piles-top-divider">
            {#if !recipient && editQuantities}
               <button type="button" on:click={updatePile}>
                  <i class="fas fa-save"></i> {localize("ITEM-PILES.ItemPileConfig.Update")}
               </button>
            {/if}

            {#if pileData.splitAllEnabled && (recipient || game.user.isGM) && (hasSplittableItems || hasSplittableCurrencies)}
               <button type="button" on:click={splitAll} disabled={!num_players || !(hasSplittableItems || hasSplittableCurrencies)}>
                  <i class="fas fa-handshake"></i>
                  {#if pileData.shareItemsEnabled && pileData.shareCurrenciesEnabled}
                     {localize("ITEM-PILES.Inspect.SplitAll", { num_players })}
                  {:else if pileData.shareItemsEnabled}
                     {localize("ITEM-PILES.Inspect.SplitAll", { num_players })}
                  {:else}
                     {localize("ITEM-PILES.Inspect.SplitCurrencies", { num_players })}
                  {/if}
               </button>
            {/if}

            {#if recipient && pileData.takeAllEnabled}
               <button type="submit" on:click={takeAll}>
                  <i class="fas fa-fist-raised"></i> {localize("ITEM-PILES.Inspect.TakeAll")}
               </button>
            {/if}

            {#if pileData.isContainer && !overrides.remove}
               <button type="submit" on:click={closeContainer}>
                  <i class="fas fa-box"></i> {localize("ITEM-PILES.Inspect.Close")}
               </button>
            {/if}

            <button type="submit" on:click={() => { application.close() }}>
               <i class="fas fa-sign-out-alt"></i> {localize("ITEM-PILES.Inspect.Leave")}
            </button>
         </footer>

      </div>

   </main>
</ApplicationShell>

<style lang="scss">

   #item-piles-preview-container {

      position: absolute;
      display: inline-block;

      #item-piles-preview-image {
         border: 0;
         width: 300px;
         border-radius: 1rem;
         box-shadow: rgba(0, 0, 0, 0.25) 0px 54px 55px, rgba(0, 0, 0, 0.12) 0px -12px 30px, rgba(0, 0, 0, 0.12) 0px 4px 6px, rgba(0, 0, 0, 0.17) 0px 12px 13px, rgba(0, 0, 0, 0.09) 0px -3px 5px;
      }
   }

   .hidden{
      display:none;
   }

   .item-piles-items-list {
      max-height: 500px;
      overflow-y: scroll;
      display:block;
      padding-right: 5px;

      .item-pile-shadow {

         position:absolute;
         width: calc(100% - 1rem);
         height: 50px;
         z-index: 25;
         pointer-events: none;
         border-radius: 5px;

         &.scroll-shadow-top {
            box-shadow: inset 0px 22px 15px -14px rgba(0, 0, 0, 0.5);
         }

      }

      .item-piles-change-actor-select {
         display: none;
      }

      .item-piles-add-currency {
         margin-right: 5px;
         flex: 0 1 auto;
         vertical-align: middle;
      }

      .item-piles-item-row {
         padding: 0 2px 0 0;
         border-radius: 4px;

         .item-piles-disabled {
            background-color: var(--color-bg-btn-minor-inactive, #c9c7b8)
         }

         .item-piles-disabled {
            background-color: var(--color-bg-btn-minor-inactive, #c9c7b8)
         }

         .item-piles-name {

            margin-left: 5px;
            text-wrap: normal;
            flex: 1 0 45%;
            display: inline-flex;
            flex-direction: column;
            align-items: flex-start;

            .item-piles-name-container {
               flex: 1;
               display: inline-flex;
               flex-direction: row;
               align-items: center;

               a {
                  flex: 1 0 auto;
               }

               span {
                  margin-left: 5px;
                  margin-top: 2px;
                  flex: 0 1 auto;
               }
            }

            span {
               line-height: 1;
               flex: 0;
            }
         }

         .item-piles-quantity-container {

            height: 100%;
            display: flex;
            align-items: center;
            flex-direction: row;
            padding: 2px;

            .item-piles-quantity {
               height: 20px;
               flex: 1;
               margin-left: 0.5rem;
               text-align: right;
            }

         }

         .item-piles-input-divider {
            flex: 1;
            margin: 0.1rem 0.5rem 0 0.25rem;
            font-size: 0.8rem;
            line-height: 1.5rem;
         }

         .item-piles-item-take-button, .item-piles-currency-take-button {
            flex: 0;
            min-width: 4rem;
            height: 22px;
            padding: 1px 3px;
            margin: 3px;
            line-height: inherit;
            border-radius: 4px;
         }

      }

   }

   .item-piles-img-container {
      min-height: 25px;
      max-width: 25px;
      max-height: 25px;
      margin: 2px;
   }
</style>