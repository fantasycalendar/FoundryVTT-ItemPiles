<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";

  export let pileData;

</script>


<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOne")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.DisplayOneExplanation")}</p>
	</label>
	<input bind:checked={pileData.displayOne} type="checkbox"/>
</div>

<div class="item-pile-display-one-settings">

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemName")}</span>
			<p>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.ItemNameExplanation")}</p>
		</label>
		<input bind:checked={pileData.showItemName} type="checkbox"/>
	</div>

	<div class="form-group">
		<label>
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.OverrideScale")}</span>
		</label>
		<input bind:checked={pileData.overrideSingleItemScale} type="checkbox"/>
	</div>

	<div class="form-group" class:item-piles-disabled={!pileData.overrideSingleItemScale}>
		<label style="flex:3;">
			<span>{localize("ITEM-PILES.Applications.ItemPileConfig.SingleItem.Scale")}</span>
		</label>
		<input bind:value="{pileData.singleItemScale}" class="item-piles-scaleRange"
					 disabled="{!pileData.overrideSingleItemScale}" max="3" min="0.2" step="0.01"
					 style="flex:3;" type="range"/>
		<input bind:value="{pileData.singleItemScale}" class="item-piles-scaleInput"
					 disabled="{!pileData.overrideSingleItemScale}" step="0.01"
					 style="flex:0.5; margin-left:1rem;" type="number"/>
	</div>

</div>
