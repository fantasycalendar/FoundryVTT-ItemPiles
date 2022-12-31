<script>

  import { localize } from "@typhonjs-fvtt/runtime/svelte/helper";
  import VaultAccessEditor from "../../editors/vault-access-editor/vault-access-editor.js";

  export let pileData;
  export let pileActor;

  async function showVaultAccessEditor() {
    const data = pileData.vaultAccess || [];
    return VaultAccessEditor.show(
      data,
      {
        id: `vault-access-editor-item-pile-config-${pileActor.id}`,
        title: game.i18n.format("ITEM-PILES.Applications.VaultAccessEditor.Title", { actor_name: pileActor.name }),
      }
    ).then((result) => {
      pileData.vaultAccess = result || [];
    });
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
