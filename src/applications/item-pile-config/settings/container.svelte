<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import FilePicker from "../../components/FilePicker.svelte";

  export let pileData;

</script>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.Closed")}</label>
	<input bind:checked={pileData.closed} type="checkbox"/>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.Locked")}</label>
	<input bind:checked={pileData.locked} type="checkbox"/>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.ClosedImagePath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.closedImage} placeholder="path/image.png" type="imagevideo"/>
	</div>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.OpenedImagePath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.openedImage} placeholder="path/image.png" type="imagevideo"/>
	</div>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.EmptyImagePath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.emptyImage} placeholder="path/image.png" type="imagevideo"/>
	</div>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.LockedImagePath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.lockedImage} placeholder="path/image.png" type="imagevideo"/>
	</div>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.CloseSoundPath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.closeSound} placeholder="path/sound.wav" type="audio"/>
	</div>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.OpenSoundPath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.openSound} placeholder="path/sound.wav" type="audio"/>
	</div>
</div>

<div class="form-group">
	<label>{localize("ITEM-PILES.Applications.ItemPileConfig.Container.LockedSoundPath")}</label>
	<div class="form-fields">
		<FilePicker bind:value={pileData.lockedSound} placeholder="path/sound.wav" type="audio"/>
	</div>
</div>
