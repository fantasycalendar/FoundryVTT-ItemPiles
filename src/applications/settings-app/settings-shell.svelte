<script>
  import SETTINGS from "../../constants/settings.js";

  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';

  import * as helpers from "../../helpers/helpers.js"
  import { applyDefaultSettings } from "../../settings.js";

  import Setting from "./Setting.svelte";
  import SettingButton from "./SettingButton.svelte";
  import Tabs from "../components/Tabs.svelte";
  import { TJSDialog } from "@typhonjs-fvtt/runtime/_dist/svelte/application/index.js";
  import CustomDialog from "../components/CustomDialog.svelte";

  const { application } = getContext('external');

  export let elementRoot;
  let form;

  let settings = Object.fromEntries(Object.entries(SETTINGS.GET_DEFAULT()).map(entry => {
    entry[1].value = helpers.getSetting(entry[0]);
    return entry;
  }));

  let userIsGM = game.user.isGM;

  function requestSubmit() {
    form.requestSubmit();
  }

  async function updateSettings() {
    let settingsToUpdate = Object.entries(settings).filter(entry => userIsGM || entry[1].scope === "client");
    for (let [key, setting] of settingsToUpdate) {
      await helpers.setSetting(key, setting.value);
    }
    application.close();
  }

  async function resetSettings() {

    const doThing = await TJSDialog.confirm({
      title: game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Title"),
      content: {
        class: CustomDialog,
        props: {
          content: game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Content")
        }
      },
      buttons: {
        yes: {
          icon: '<i class="fas fa-check"></i>',
          label: game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Confirm")
        },
        no: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize("No")
        }
      },
      modal: true,
      draggable: false,
      rejectClose: false,
      defaultYes: true,
      options: {
        height: "auto"
      }
    });

    if (!doThing) return;

    return applyDefaultSettings();
  }

  let tabs = [
    { value: "local", label: localize("ITEM-PILES.Applications.Settings.Local") },
    { value: "module", label: localize("ITEM-PILES.Applications.Settings.Module"), hidden: !userIsGM },
    { value: "system", label: localize("ITEM-PILES.Applications.Settings.System"), hidden: !userIsGM },
  ];

  let activeTab = tabs[0].value;

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete="off">

    <h2 style="text-align: center; margin-bottom: 1rem;">{localize("ITEM-PILES.Applications.Settings.Title")}</h2>

    <Tabs bind:activeTab {tabs}/>

    <section class="tab-body">

      <div class="tab flex" class:active={activeTab === 'local'} data-scope="primary" data-tab="local">

        <Setting bind:data="{settings[SETTINGS.INVERT_SHEET_OPEN]}"/>
        <Setting bind:data="{settings[SETTINGS.HIDE_ACTOR_HEADER_TEXT]}"/>
        <Setting bind:data="{settings[SETTINGS.PRELOAD_FILES]}"/>
        <Setting bind:data="{settings[SETTINGS.DEBUG]}"/>
        <Setting bind:data="{settings[SETTINGS.DEBUG_HOOKS]}"/>

        <div style="text-align: center; font-size: 1rem; margin-top:3rem;">
          <p>{localize("ITEM-PILES.Applications.Settings.MoreToCome")}
          <p>
          <p style="margin-bottom:1rem;">
            <a class="link-text"
               href="https://github.com/fantasycalendar/FoundryVTT-ItemPiles/issues/new?assignees=&labels=&template=feature_request.md&title="
               target="_blank"
            >{localize("ITEM-PILES.Applications.Settings.Request")}</a>
          </p>
          <p>
            {localize("ITEM-PILES.Applications.Settings.Donate")}
          </p>
          <p>
            <a href="https://ko-fi.com/fantasycomputerworks" target="_blank" style="text-decoration: none !important;">
              <button class="donate-button" type="button">
                <img src="https://storage.ko-fi.com/cdn/cup-border.png">
                <span>Donate</span>
              </button>
            </a>
          </p>
        </div>

      </div>

      {#if userIsGM}
        <div class="tab flex" class:active={activeTab === 'module'} data-scope="primary" data-tab="module">
          <Setting bind:data="{settings[SETTINGS.ENABLE_DROPPING_ITEMS]}"/>
          <Setting bind:data="{settings[SETTINGS.OUTPUT_TO_CHAT]}"/>
          <Setting bind:data="{settings[SETTINGS.DELETE_EMPTY_PILES]}"/>
          <Setting bind:data="{settings[SETTINGS.ENABLE_TRADING]}"/>
          <Setting bind:data="{settings[SETTINGS.SHOW_TRADE_BUTTON]}"/>
          <Setting bind:data="{settings[SETTINGS.INSPECT_ITEMS_IN_TRADE]}"/>
        </div>

        <div class="tab flex" class:active={activeTab === 'system'} data-scope="primary" data-tab="system">
          <SettingButton data={{
            name: "ITEM-PILES.Settings.Reset.Title",
            hint: "ITEM-PILES.Settings.Reset.Hint",
            label: "ITEM-PILES.Settings.Reset.Label",
            icon: "fas fa-undo",
            hideResetButton: true
          }} callback={() => { resetSettings() }}/>
          <Setting bind:data="{settings[SETTINGS.ACTOR_CLASS_TYPE]}" options={game.system.template.Actor.types}/>
          <Setting bind:data="{settings[SETTINGS.ITEM_QUANTITY_ATTRIBUTE]}"/>
          <Setting bind:data="{settings[SETTINGS.ITEM_PRICE_ATTRIBUTE]}"/>
          <SettingButton bind:data="{settings[SETTINGS.CURRENCIES]}"/>
          <SettingButton bind:data="{settings[SETTINGS.ITEM_FILTERS]}"/>
          <SettingButton bind:data="{settings[SETTINGS.ITEM_SIMILARITIES]}"/>
          <SettingButton bind:data="{settings[SETTINGS.PRICE_PRESETS]}"/>
        </div>
      {/if}

    </section>

    <footer>
      <button type="button" on:click|once={requestSubmit}><i
        class="far fa-save"></i> {localize("ITEM-PILES.Applications.Settings.Submit")}</button>
    </footer>
  </form>
</ApplicationShell>

<style lang="scss">

  .link-text {
    color: var(--color-text-hyperlink);
  }

  .donate-button {
    border: 0;
    border-radius: 9999px;
    background-color: #00bfa5;
    align-items: center;
    font-family: nunito, quicksand, sans-serif;
    font-size: 16px;
    width: max-content;
    justify-content: space-between;
    padding: 5px 15px;
    font-weight: 700;
    cursor: pointer;
    -webkit-border-radius: 100px;
    display: flex;
    margin: 10px auto;

    img {
      border: 0;
      width: 39px;
    }

    span {
      margin-left: 8px;
      color: white !important;
    }
  }

  .preset-select {
    display: flex;
    flex-direction: row;
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    margin-bottom: 0.5rem;
    padding-bottom: 0.5rem;

    align-items: center;

    label {
      flex: 0 1 auto;
      margin-right: 0.5rem;
    }

    select {
      flex: 1;
    }

    button {
      margin-left: 0.25rem;
      flex: 0 1 auto;
      width: auto;
      height: 27px;
      text-align: center;
      line-height: normal;
    }
  }

  .tab-body {
    max-height: 715px;
    min-height: 715px;
    overflow-y: scroll;
    padding: 5px;
  }

  footer {
    border-top: 1px solid rgba(0, 0, 0, 0.25);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }

</style>