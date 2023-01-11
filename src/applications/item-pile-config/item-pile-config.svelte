<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import CONSTANTS from "../../constants/constants.js";
  import * as Helpers from "../../helpers/helpers.js";

  import Tabs from "../components/Tabs.svelte";
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { writable } from "svelte/store";

  import MerchantApp from "../merchant-app/merchant-app.js";
  import ItemPileInventoryApp from "../item-pile-inventory-app/item-pile-inventory-app.js";
  import VaultApp from "../vault-app/vault-app.js";

  import MainSettings from "./settings/main.svelte";
  import MerchantSettings from "./settings/merchant.svelte";
  import ItemPileSettings from "./settings/itempile.svelte";
  import ContainerSettings from "./settings/container.svelte";
  import SharingSettings from "./settings/sharing.svelte";
  import VaultSettings from "./settings/vault.svelte";
  import CustomSettings from "./settings/custom.svelte";

  const { application } = getContext('external');

  export let elementRoot;
  export let pileActor;

  let form;

  let pileData = PileUtilities.getActorFlagData(pileActor);

  if (typeof pileData?.deleteWhenEmpty === "boolean") {
    pileData.deleteWhenEmpty = !!pileData?.deleteWhenEmpty;
  }

  let pileEnabled = writable(pileData.enabled);

  $: pileData.enabled = $pileEnabled;

  async function updateSettings() {

    let defaults = foundry.utils.duplicate(CONSTANTS.PILE_DEFAULTS);

    const types = [
      "closedImage",
      "emptyImage",
      "openedImage",
      "lockedImage",
      "closeSound",
      "openSound",
      "lockedSound",
      "unlockedSound",
    ];

    for (let type of types) {
      if (pileData[type].includes("*")) {
        pileData[type + "s"] = await Helpers.getFiles(pileData[type], { applyWildCard: true, softFail: true });
        pileData[type + "s"] = pileData[type + "s"] || [];
      }
    }

    const data = foundry.utils.mergeObject(defaults, pileData);

    data.deleteWhenEmpty = {
      "default": "default",
      "true": true,
      "false": false
    }[data.deleteWhenEmpty];

    const currentData = PileUtilities.getActorFlagData(pileActor);
    const diff = Object.keys(foundry.utils.diffObject(currentData, foundry.utils.deepClone(data)));

    game.itempiles.API.updateItemPile(pileActor, data).then(async () => {
      if (diff.includes("enabled") || diff.includes("type")) {
        const promises = [];
        let apps = [];
        switch (currentData.type) {
          case CONSTANTS.PILE_TYPES.MERCHANT:
            if (MerchantApp.getActiveApp(pileActor.id)) {
              promises.push(MerchantApp.getActiveApp(pileActor.id).close());
            }
            if (MerchantApp.getActiveApp(pileActor?.token?.id)) {
              promises.push(MerchantApp.getActiveApp(pileActor?.token?.id).close());
            }
            break;

          case CONSTANTS.PILE_TYPES.VAULT:
            apps = VaultApp.getActiveApps(pileActor.id)
              .concat(VaultApp.getActiveApps(pileActor?.token?.id));
            break;

          default:
            apps = ItemPileInventoryApp.getActiveApps(pileActor.id)
              .concat(ItemPileInventoryApp.getActiveApps(pileActor?.token?.id));
            break;
        }

        for (let app of apps) {
          promises.push(app.close());
        }

        if (currentData.type === CONSTANTS.PILE_TYPES.MERCHANT) {
        } else {
        }
        if (promises.length || pileActor?.sheet.rendered) {
          await Promise.allSettled(promises);
          if (data.enabled) {
            pileActor?.sheet.close();
            game.itempiles.API.renderItemPileInterface(pileActor);
          } else if (!data.enabled) {
            pileActor?.sheet.render(true);
          }
        }
      }
    });

    application.close();

  }

  function requestSubmit() {
    form.requestSubmit();
  }

  let tabs = [];
  $: {
    tabs = [
      {
        value: "mainsettings",
        label: "ITEM-PILES.Applications.ItemPileConfig.Main.Title",
        highlight: !$pileEnabled
      },
      {
        value: "othersettings",
        label: "ITEM-PILES.Applications.ItemPileConfig.Other.Title"
      }
    ]
  }

  let activeTab = "mainsettings";

  const customTypes = Object.keys(CONSTANTS.CUSTOM_PILE_TYPES);

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

  <form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete=off
        class="item-piles-config-container">

    <Tabs bind:activeTab bind:tabs/>

    <section class="tab-body">

      <div class="tab">

        {#if activeTab === 'mainsettings'}

          <MainSettings bind:pileData {pileActor} {pileEnabled}/>

        {/if}

        {#if activeTab === "othersettings"}

          <div class="form-group">
            <label style="flex:4;">
              <span>{localize("ITEM-PILES.Applications.ItemPileConfig.Other.Type")}</span>
              <p>{localize("ITEM-PILES.Applications.ItemPileConfig.Other.TypeExplanation")}</p>
            </label>
            <select style="flex:4;" bind:value={pileData.type}>
              {#each Object.values(CONSTANTS.PILE_TYPES) as type}
                <option value={type}>
                  {localize(`ITEM-PILES.Types.${type}`)}
                </option>
              {/each}
              {#each customTypes as customType}
                <option value={customType}>
                  {localize(`ITEM-PILES.Types.${customType}`)}
                </option>
              {/each}
            </select>
          </div>

          <hr>

          {#if pileData.type === CONSTANTS.PILE_TYPES.MERCHANT}

            <MerchantSettings bind:pileData {pileActor}/>

          {:else if pileData.type === CONSTANTS.PILE_TYPES.PILE || pileData.type === CONSTANTS.PILE_TYPES.CONTAINER}

            {#if pileData.type === CONSTANTS.PILE_TYPES.PILE}

              <ItemPileSettings bind:pileData/>

            {/if}

            {#if pileData.type === CONSTANTS.PILE_TYPES.CONTAINER}

              <ContainerSettings bind:pileData/>

            {/if}

            <hr>

            <SharingSettings bind:pileData {pileActor}/>

          {:else if pileData.type === CONSTANTS.PILE_TYPES.VAULT}

            <VaultSettings bind:pileData {pileActor}/>

          {:else if customTypes.includes(pileData.type)}

            <CustomSettings bind:pileData {pileActor}/>

          {/if}

        {/if}

      </div>

    </section>

    <footer>
      <button type="button" on:click|once={requestSubmit}>
        <i class="far fa-save"></i>
        {localize("ITEM-PILES.Applications.ItemPileConfig.Update")}
      </button>
    </footer>

  </form>

</ApplicationShell>
