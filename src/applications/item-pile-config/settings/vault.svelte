<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import VaultAccessEditor from "../../editors/vault-access-editor/vault-access-editor.js";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/svelte/application";
  import CustomDialog from "../../components/CustomDialog.svelte";
  import * as PileUtilities from "../../../helpers/pile-utilities.js";
  import CONSTANTS from "../../../constants/constants.js";

  export let pileData;
  export let pileActor;

  async function showVaultAccessEditor() {
    const data = pileData.vaultAccess || [];
    return VaultAccessEditor.show(data, {
      id: `vault-access-editor-item-pile-config-${pileActor.id}`,
      title: localize("ITEM-PILES.Applications.VaultAccessEditor.Title", { actor_name: pileActor.name }),
    }).then((result) => {
      pileData.vaultAccess = result || [];
    });
  }

  async function clearVaultLog() {
    const doThing = await TJSDialog.confirm({
      id: `sharing-dialog-item-pile-config-${pileActor.id}`,
      title: "Item Piles - " + localize("ITEM-PILES.Dialogs.ClearVaultLog.Title"),
      content: {
        class: CustomDialog,
        props: {
          header: localize("ITEM-PILES.Dialogs.ClearVaultLog.Title"),
          content: localize("ITEM-PILES.Dialogs.ClearVaultLog.Content", { actor_name: pileActor.name })
        },
      },
      modal: true
    });
    if (!doThing) return;
    return PileUtilities.clearVaultLog(pileActor);
  }

</script>

<div class="form-group">
	<label style="flex:6;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.Layout")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LayoutExplanation")}</p>
	</label>
	<div class="item-piles-grid-columns" style="flex: 3;">
		<div style="text-align: center; font-size: 0.7rem;">
			<i>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.Columns")}</i>
			<i>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.Rows")}</i>
		</div>
		<div style="align-items: center;">
			<input style="text-align: right;" type="number" placeholder="Enter a number..." bind:value={pileData.cols}/>
			<span style="flex: 0;">x</span>
			<input type="number" placeholder="Enter a number..." bind:value={pileData.rows}/>
		</div>
	</div>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.EnableExpansion")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.EnableExpansionExplanation")}</p>
	</label>
	<input type="checkbox" bind:checked={pileData.vaultExpansion}/>
</div>

<div class="form-group">
	<label style="flex:6;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.BaseExpansion")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.BaseExpansionExplanation")}</p>
	</label>
	<div class="item-piles-grid-columns" style="flex: 3;">
		<div style="text-align: center; font-size: 0.7rem;">
			<i>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.Columns")}</i>
			<i>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.Rows")}</i>
		</div>
		<div style="align-items: center;">
			<input disabled={!pileData.vaultExpansion} style="text-align: right;" type="number"
						 placeholder="Enter a number..." bind:value={pileData.baseExpansionCols}/>
			<span style="flex: 0;">x</span>
			<input disabled={!pileData.vaultExpansion} type="number" placeholder="Enter a number..."
						 bind:value={pileData.baseExpansionRows}/>
		</div>
	</div>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.Access")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.AccessExplanation")}</p>
	</label>
	<button style="flex:2;" type="button" on:click={() => showVaultAccessEditor()}>
		{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.ManageAccess")}
	</button>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LogVaultAccess")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LogVaultAccessExplanation")}</p>
	</label>
	<input type="checkbox" bind:checked={pileData.logVaultActions}/>
</div>

<div class="form-group">
	<label style="flex:4;">
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.ClearVaultLog")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.ClearVaultLogExplanation")}</p>
	</label>
	<button style="flex:2;" type="button" on:click={() => clearVaultLog()}>
		{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.ClearVaultLog")}
	</button>
</div>

<div class="form-group">
	<label>
		<span>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LoggingFormat")}</span>
		<p>{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LoggingFormatExplanation")}</p>
	</label>
</div>

<div class="form-group">
	<select bind:value={pileData.vaultLogType}>
		<option value={CONSTANTS.VAULT_LOGGING_TYPES.USER_ACTOR}>
			{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LoggingFormatUserActor")}
		</option>
		<option value={CONSTANTS.VAULT_LOGGING_TYPES.USER}>
			{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LoggingFormatUser")}
		</option>
		<option value={CONSTANTS.VAULT_LOGGING_TYPES.ACTOR}>
			{localize("ITEM-PILES.Applications.ItemPileConfig.Vault.LoggingFormatActor")}
		</option>
	</select>
</div>

<style lang="scss">
  .item-piles-grid-columns {
    display: flex;
    flex-direction: column;

    & > div {
      display: flex;
      flex-direction: row;
      align-items: center;

      & > * {
        flex: 1;
        margin: 0 0.25rem;
      }

      & > span {
        flex: 0;
      }
    }
  }

</style>
