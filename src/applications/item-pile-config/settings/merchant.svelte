<script>

  import ItemTypePriceModifiersEditor
    from "../../editors/item-type-price-modifiers-editor/item-type-price-modifiers-editor.js";
  import PriceModifiersEditor from "../../editors/price-modifiers-editor/price-modifiers-editor.js";
  import FilePicker from "../../components/FilePicker.svelte";
  import SliderInput from "../../components/SliderInput.svelte";
  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let pileData;
  export let pileActor;

  const simpleCalendarActive = game.modules.get('foundryvtt-simple-calendar')?.active;

  async function showItemTypePriceModifiers() {
    const data = pileData.itemTypePriceModifiers || [];
    return ItemTypePriceModifiersEditor.show(
      data,
      { id: `item-type-price-modifier-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.ItemTypePriceModifiersEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.itemTypePriceModifiers = result || [];
    });
  }

  async function showActorPriceModifiers() {
    const data = pileData.actorPriceModifiers || [];
    return PriceModifiersEditor.show(
      data,
      { id: `price-modifier-item-pile-config-${pileActor.id}` },
      { title: game.i18n.format("ITEM-PILES.Applications.PriceModifiersEditor.TitleActor", { actor_name: pileActor.name }), }
    ).then((result) => {
      pileData.actorPriceModifiers = result || [];
    });
  }

</script>

<div class="tab flex">

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantImage")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.MerchantImageExplanation")}</p>
    </label>
    <div class="form-fields">
      <FilePicker type="imagevideo" bind:value={pileData.merchantImage} placeholder="path/image.png"/>
    </div>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteQuantity")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteQuantityExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.infiniteQuantity}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteCurrency")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.InfiniteCurrencyExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.infiniteCurrencies}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.KeepZero")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.KeepZeroExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.keepZeroQuantity}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantity")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityExplanation")}</p>
    </label>
    <div class="break"></div>
    <select style="flex:4;" bind:value={pileData.displayQuantity}>
      <option value="yes">
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityYes")}
      </option>
      <option value="no">
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityNo")}
      </option>
      <option value="alwaysyes">
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityYesAlways")}
      </option>
      <option value="alwaysno">
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.DisplayQuantityNoAlways")}
      </option>
    </select>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PurchaseOnly")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PurchaseOnlyExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.purchaseOnly}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItems")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.HideNewItemsExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.hideNewItems}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OnyAcceptBasePrice")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OnyAcceptBasePriceExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.onlyAcceptBasePrice}/>
  </div>

  <div class="form-group slider-group">
    <label style="flex:3;">
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PriceModifierTitle")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.PriceModifierExplanation")}</p>
    </label>
  </div>

  <div class="form-group slider-group">
    <label style="flex:3;">
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.BuyPriceModifier")}</span>
    </label>
    <SliderInput style="flex:4;" bind:value={pileData.buyPriceModifier}/>
  </div>

  <div class="form-group slider-group">
    <label style="flex:3;">
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.SellPriceModifier")}</span>
    </label>
    <SliderInput style="flex:4;" bind:value={pileData.sellPriceModifier}/>
  </div>

  <div class="form-group">
    <div class="item-piles-flexcol">
      <label>
        <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ItemTypeModifier")}</span>
        <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ItemTypeModifiersExplanation")}</p>
      </label>
      <button type="button" on:click={() => { showItemTypePriceModifiers() }}>
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureItemTypePriceModifiers")}
      </button>
    </div>
  </div>

  <div class="form-group">
    <div class="item-piles-flexcol">
      <label>
        <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ActorPriceModifiers")}</span>
        <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ActorPriceModifiersExplanation")}</p>
      </label>
      <button type="button" on:click={() => { showActorPriceModifiers() }}>
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.ConfigureActorPriceModifiers")}
      </button>
    </div>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatus")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusExplanation")}</p>
    </label>
    <div class="break"></div>
    <select style="flex:4;" bind:value={pileData.openTimes.status}>
      <option value="open">
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusOpen")}
      </option>
      <option value="closed">
        {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusClosed")}
      </option>
      {#if simpleCalendarActive && pileData.openTimes.enabled}
        <option value="auto">
          {localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenStatusAuto")}
        </option>
      {/if}
    </select>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimes")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Merchant.OpenTimesExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.openTimes.enabled}/>
  </div>

  <div class="form-group item-piles-open-times-container"
       class:item-piles-disabled={!pileData.openTimes.enabled}>
    <div class="item-piles-flexcol" style="margin-right:1rem">
      <label class="item-piles-text-center">
        Open Time:
      </label>
      <div class="item-piles-flexrow">
        <input type="number" style="text-align: right;" disabled="{!pileData.openTimes.enabled}"
               bind:value="{pileData.openTimes.open.hour}"/>
        <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
        <input type="number" disabled="{!pileData.openTimes.enabled}"
               bind:value="{pileData.openTimes.open.minute}"/>
      </div>
    </div>
    <div class="item-piles-flexcol">
      <label class="item-piles-text-center">
        Close Time:
      </label>
      <div class="item-piles-flexrow">
        <input type="number" style="text-align: right;" disabled="{!pileData.openTimes.enabled}"
               bind:value="{pileData.openTimes.close.hour}"/>
        <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
        <input type="number" disabled="{!pileData.openTimes.enabled}"
               bind:value="{pileData.openTimes.close.minute}"/>
      </div>
    </div>
  </div>
</div>