<script>
	import SETTINGS from "../../constants/settings.js";

	import { getContext } from 'svelte';
	import { localize } from '#runtime/svelte/helper';
	import { ApplicationShell } from '#runtime/svelte/component/core';

	import * as helpers from "../../helpers/helpers.js"
	import { applyDefaultSettings } from "../../settings.js";

	import Setting from "./Setting.svelte";
	import SettingButton from "./SettingButton.svelte";
	import Tabs from "../components/Tabs.svelte";
	import { TJSDialog } from "#runtime/svelte/application";
	import CustomDialog from "../components/CustomDialog.svelte";

	const { application } = getContext('#external');

	export let elementRoot;
	let form;

	export let settings = {};
	let userCanChangeSettings = game.user.hasPermission("SETTINGS_MODIFY");

	getSettings();

	function getSettings() {
		settings = Object.fromEntries(Object.entries(SETTINGS.GET_DEFAULT()).map(entry => {
			entry[1].value = helpers.getSetting(entry[0]);
			return entry;
		}));

		settings[SETTINGS.POPULATION_TABLES_FOLDER].choices = {
			"root": "ITEM-PILES.Settings.PopulationTablesFolder.AllTables",
			...Object.fromEntries(
				game.folders
					.filter(f => f.type === "RollTable")
					.map(f => [f.id, f.name])
			)
		}
	}

	export function importSettings(incomingSettings) {
		for (const [key, value] of Object.entries(incomingSettings)) {
			if (settings[SETTINGS[key]] === undefined) continue;
			settings[SETTINGS[key]].value = value;
		}
		settings = settings;
	}

	function requestSubmit() {
		form.requestSubmit();
	}

	async function updateSettings() {
		let settingsToUpdate = Object.entries(settings).filter(entry => userCanChangeSettings || entry[1].scope === "client");
		for (let [key, setting] of settingsToUpdate) {
			await helpers.setSetting(key, setting.value);
		}
		const currencies = settings[SETTINGS.CURRENCIES].value.concat(settings[SETTINGS.SECONDARY_CURRENCIES].value)
		for (const currency of currencies) {
			if (!currency.data?.uuid) continue;
			const actualItem = await fromUuid(currency.data?.uuid);
			await actualItem.update({
				name: currency.name,
				img: currency.img
			});
		}
		application.close();
	}

	async function resetSettings() {

		const doThing = await TJSDialog.confirm({
			title: "Item Piles - " + game.i18n.localize("ITEM-PILES.Dialogs.ResetSettings.Title"),
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
		{ value: "module", label: localize("ITEM-PILES.Applications.Settings.Module"), hidden: !userCanChangeSettings },
		{ value: "styles", label: localize("ITEM-PILES.Applications.Settings.Styles"), hidden: !userCanChangeSettings },
		{ value: "system", label: localize("ITEM-PILES.Applications.Settings.System"), hidden: !userCanChangeSettings },
	];

	let activeTab = application?.options?.tab ?? tabs[0].value;

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
	<form autocomplete="off" bind:this={form} on:submit|once|preventDefault={updateSettings}>

		<h2 style="text-align: center; margin-bottom: 1rem;">{localize("ITEM-PILES.Applications.Settings.Title")}</h2>

		{#if userCanChangeSettings}
			<Tabs bind:activeTab {tabs}/>
		{/if}

		<section class="tab-body">

			<div class="tab flex" class:active={activeTab === 'local'} data-scope="primary" data-tab="local">

				<Setting bind:data="{settings[SETTINGS.INVERT_SHEET_OPEN]}" key={SETTINGS.INVERT_SHEET_OPEN}/>
				<Setting bind:data="{settings[SETTINGS.HIDE_ACTOR_HEADER_TEXT]}" key={SETTINGS.HIDE_ACTOR_HEADER_TEXT}/>
				<Setting bind:data="{settings[SETTINGS.HIDE_ACTOR_HEADER_BUTTON]}" key={SETTINGS.HIDE_ACTOR_HEADER_BUTTON}/>
				<Setting bind:data="{settings[SETTINGS.PRELOAD_FILES]}" key={SETTINGS.PRELOAD_FILES}/>
				<Setting bind:data="{settings[SETTINGS.DEBUG]}" key={SETTINGS.DEBUG}/>
				<Setting bind:data="{settings[SETTINGS.DEBUG_HOOKS]}" key={SETTINGS.DEBUG_HOOKS}/>

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
						<a href="https://ko-fi.com/fantasycomputerworks" style="text-decoration: none !important;" target="_blank">
							<button class="donate-button" type="button">
								<img src="https://storage.ko-fi.com/cdn/cup-border.png">
								<span>Donate</span>
							</button>
						</a>
					</p>
				</div>

			</div>

			{#if userCanChangeSettings}
				<div class="tab flex" class:active={activeTab === 'module'} data-scope="primary" data-tab="module">
					<Setting key={SETTINGS.ENABLE_DROPPING_ITEMS} bind:data="{settings[SETTINGS.ENABLE_DROPPING_ITEMS]}"/>
					<Setting key={SETTINGS.ENABLE_GIVING_ITEMS} bind:data="{settings[SETTINGS.ENABLE_GIVING_ITEMS]}"/>
					<Setting key={SETTINGS.ENABLE_TRADING} bind:data="{settings[SETTINGS.ENABLE_TRADING]}"/>
					<Setting key={SETTINGS.SHOW_TRADE_BUTTON} bind:data="{settings[SETTINGS.SHOW_TRADE_BUTTON]}"/>
					<Setting key={SETTINGS.INSPECT_ITEMS_IN_TRADE} bind:data="{settings[SETTINGS.INSPECT_ITEMS_IN_TRADE]}"/>
					<Setting key={SETTINGS.OUTPUT_TO_CHAT} bind:data="{settings[SETTINGS.OUTPUT_TO_CHAT]}"/>
					<Setting key={SETTINGS.DELETE_EMPTY_PILES} bind:data="{settings[SETTINGS.DELETE_EMPTY_PILES]}"/>
					<Setting key={SETTINGS.POPULATION_TABLES_FOLDER} bind:data="{settings[SETTINGS.POPULATION_TABLES_FOLDER]}"/>
					<Setting key={SETTINGS.HIDE_TOKEN_BORDER} bind:data="{settings[SETTINGS.HIDE_TOKEN_BORDER]}"/>
					<SettingButton key={SETTINGS.PRICE_PRESETS} bind:data="{settings[SETTINGS.PRICE_PRESETS]}"/>
					<SettingButton key={SETTINGS.CUSTOM_ITEM_CATEGORIES} bind:data="{settings[SETTINGS.CUSTOM_ITEM_CATEGORIES]}"/>
				</div>

				<div class="tab flex" class:active={activeTab === 'styles'} data-scope="primary" data-tab="styles">
					<SettingButton key={SETTINGS.CSS_VARIABLES} bind:data="{settings[SETTINGS.CSS_VARIABLES]}"/>
					<SettingButton key={SETTINGS.VAULT_STYLES} bind:data="{settings[SETTINGS.VAULT_STYLES]}"/>
				</div>

				<div class="tab flex" class:active={activeTab === 'system'} data-scope="primary" data-tab="system">
					<SettingButton data={{
            name: "ITEM-PILES.Settings.Reset.Title",
            hint: "ITEM-PILES.Settings.Reset.Hint",
            label: "ITEM-PILES.Settings.Reset.Label",
            icon: "fas fa-undo",
            hideResetButton: true
          }} callback={async () => {
            await resetSettings()
            getSettings();
          }}/>
					<Setting key={SETTINGS.ACTOR_CLASS_TYPE} bind:data="{settings[SETTINGS.ACTOR_CLASS_TYPE]}"
					         options={["None", ...Object.keys(game.system.documentTypes.Actor)]}/>
					<Setting key={SETTINGS.ITEM_CLASS_LOOT_TYPE} bind:data="{settings[SETTINGS.ITEM_CLASS_LOOT_TYPE]}"
					         options={["None", ...Object.keys(game.system.documentTypes.Item)]}/>
					<Setting key={SETTINGS.ITEM_CLASS_WEAPON_TYPE} bind:data="{settings[SETTINGS.ITEM_CLASS_WEAPON_TYPE]}"
					         options={["None", ...Object.keys(game.system.documentTypes.Item)]}/>
					<Setting key={SETTINGS.ITEM_CLASS_EQUIPMENT_TYPE} bind:data="{settings[SETTINGS.ITEM_CLASS_EQUIPMENT_TYPE]}"
					         options={["None", ...Object.keys(game.system.documentTypes.Item)]}/>
					<Setting key={SETTINGS.ITEM_QUANTITY_ATTRIBUTE} bind:data="{settings[SETTINGS.ITEM_QUANTITY_ATTRIBUTE]}"/>
					<Setting key={SETTINGS.ITEM_PRICE_ATTRIBUTE} bind:data="{settings[SETTINGS.ITEM_PRICE_ATTRIBUTE]}"/>
					<SettingButton key={SETTINGS.CURRENCIES} bind:data="{settings[SETTINGS.CURRENCIES]}"/>
					<SettingButton key={SETTINGS.SECONDARY_CURRENCIES} bind:data="{settings[SETTINGS.SECONDARY_CURRENCIES]}"/>
					<Setting key={SETTINGS.CURRENCY_DECIMAL_DIGITS} bind:data="{settings[SETTINGS.CURRENCY_DECIMAL_DIGITS]}"
					         disabled="{settings[SETTINGS.CURRENCIES].value.length !== 1}"/>
					<SettingButton key={SETTINGS.ITEM_FILTERS} bind:data="{settings[SETTINGS.ITEM_FILTERS]}"/>
					<SettingButton key={SETTINGS.ITEM_SIMILARITIES} bind:data="{settings[SETTINGS.ITEM_SIMILARITIES]}"/>
					<SettingButton key={SETTINGS.UNSTACKABLE_ITEM_TYPES} bind:data="{settings[SETTINGS.UNSTACKABLE_ITEM_TYPES]}"/>
				</div>
			{/if}

		</section>

		<footer>
			<button on:click|once={requestSubmit} type="button">
				<i class="far fa-save"></i> {localize("ITEM-PILES.Applications.Settings.Submit")}
			</button>
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
    max-height: 729px;
    min-height: 729px;
    overflow-y: scroll;
    padding: 5px;
  }

  footer {
    border-top: 1px solid rgba(0, 0, 0, 0.25);
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }

</style>
