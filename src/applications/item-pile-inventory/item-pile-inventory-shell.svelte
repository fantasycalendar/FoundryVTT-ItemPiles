<script>
   import {getContext} from 'svelte';
   import {fade} from 'svelte/transition';
   import {localize} from '@typhonjs-fvtt/runtime/svelte/helper';
   import {ApplicationShell} from '@typhonjs-fvtt/runtime/svelte/component/core';
   import * as lib from "../../lib/lib";
   import * as utils from "../../lib/utils";
   import API from "../../api";
   import DropCurrencyDialog from "../drop-currency-dialog";
   import ItemList from "./ItemList.svelte";
   import PrivateAPI from "../../private-api.js";
   import AttributeList from "./AttributeList.svelte";
   import ItemPileStore from "./item-pile-store.js";

   const { application } = getContext('external');

   export let elementRoot;

   export let pileActor;
   export let recipient;
   export let overrides;

   let recipientActor = recipient?.actor ?? recipient;
   let editQuantities = !recipient && pileActor.isOwner && game.user.isGM;
   let playerActors = game.actors.filter(actor => actor.isOwner && actor !== pileActor && actor.data.token.actorLink);

   const store = new ItemPileStore(pileActor, recipientActor);

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

      return PrivateAPI._dropData(canvas, data, { target: pile });

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
                  <input type="text" bind:value={search} on:keyup={foundry.utils.debounce(() => { store.filterByName(search) }, 250)}>
               </div>
               {/if}
            {/if}

            <div class="item-piles-items-list" bind:this={itemListElement} on:scroll={evaluateShadow}>

               {#if scrolled}
                  <div class="item-pile-shadow scroll-shadow-top" transition:fade={{duration:300}}></div><div></div>
               {/if}

               <ItemList {store}/>

               {#if !!items.length && !!currencies.length}
               <hr>
               {/if}

               <AttributeList {store}/>

            </div>

         {/if}


         <footer class="sheet-footer flexrow item-piles-top-divider">
            {#if !recipient && editQuantities}
               <button type="button" on:click={updatePile}>
                  <i class="fas fa-save"></i> {localize("ITEM-PILES.Applications.ItemPileConfig.Update")}
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

   .item-piles-img-container {
      min-height: 25px;
      max-width: 25px;
      max-height: 25px;
      margin: 2px;
   }
</style>