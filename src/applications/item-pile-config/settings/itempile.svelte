<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let pileData;

</script>


<div class="form-group">
  <label>
    <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOne")}</span>
    <p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOneExplanation")}</p>
  </label>
  <input type="checkbox" bind:checked={pileData.displayOne}/>
</div>

<div class="item-pile-display-one-settings">

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemName")}</span>
      <p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemNameExplanation")}</p>
    </label>
    <input type="checkbox" bind:checked={pileData.showItemName}/>
  </div>

  <div class="form-group">
    <label>
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.OverrideScale")}</span>
    </label>
    <input type="checkbox" bind:checked={pileData.overrideSingleItemScale}/>
  </div>

  <div class="form-group" class:item-piles-disabled={!pileData.overrideSingleItemScale}>
    <label style="flex:3;">
      <span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.Scale")}</span>
    </label>
    <input style="flex:3;" type="range" min="0.2" step="0.01" max="3" class="item-piles-scaleRange"
           disabled="{!pileData.overrideSingleItemScale}" bind:value="{pileData.singleItemScale}"/>
    <input style="flex:0.5; margin-left:1rem;" type="number" step="0.01" class="item-piles-scaleInput"
           disabled="{!pileData.overrideSingleItemScale}" bind:value="{pileData.singleItemScale}"/>
  </div>

</div>
