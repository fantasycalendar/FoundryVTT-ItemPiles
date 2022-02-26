<script>
    import { getContext } from 'svelte';
    import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
    import FilePicker from "../components/FilePicker.svelte";

    const { application } = getContext('external');

    let form;
    export let pileData;

    async function updateSettings() {
        application.update(pileData);
        application.close();
    }

    function requestSubmit(){
        form.requestSubmit();
    }

    async function showCurrenciesEditor(){
        application.showCurrenciesEditor();
    }

    async function showItemFiltersEditor(){
        application.showItemFiltersEditor();
    }

    async function showActorPriceOverrides(){
        application.showActorPriceOverrides();
    }

</script>

<svelte:options accessors={true}/>

<form bind:this={form} on:submit|once|preventDefault={updateSettings} autocomplete=off class="item-piles-config-container">

    <nav class="tabs" data-group="primary">
        <a class="item active" data-tab="mainsettings">{localize("ITEM-PILES.ItemPileConfig.Main.Title")}</a>
        <a class="item" data-tab="othersettings">{localize("ITEM-PILES.ItemPileConfig.Other.Title")}</a>
    </nav>

    <section class="tab-body">

        <div class="tab mainsettings flex" data-group="primary" data-tab="mainsettings">

            <div class="form-group">
                <label>
                    {localize("ITEM-PILES.ItemPileConfig.Main.EnabledPile")}<br>
                    <p>{localize("ITEM-PILES.ItemPileConfig.Main.EnabledPileExplanation")}</p>
                </label>
                <input type="checkbox" bind:checked={pileData.enabled}/>
            </div>

            <div class="form-group">
                <label style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.Distance")}<br>
                    <p>{localize("ITEM-PILES.ItemPileConfig.Main.GridUnits")}</p>
                </label>
                <input style="flex:4;" type="number" placeholder="Infinity" bind:value={pileData.distance}/>
            </div>

            <div class="form-group">
                <label>
                    {localize("ITEM-PILES.ItemPileConfig.Main.InspectItems")}<br>
                    <p>{localize("ITEM-PILES.ItemPileConfig.Main.InspectItemsExplanation")}</p>
                </label>
                <input type="checkbox" bind:checked={pileData.canInspectItems}/>
            </div>

            <div class="form-group">
                <label style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.DeleteWhenEmpty")}<br>
                    <p >{localize("ITEM-PILES.ItemPileConfig.Main.DeleteWhenEmptyExplanation")}</p>
                </label>
                <select style="flex:4;" bind:value={pileData.deleteWhenEmpty}>
                    <option value="default">{localize("ITEM-PILES.ItemPileConfig.Main.DeleteWhenEmptyDefault")}</option>
                    <option value="true">{localize("ITEM-PILES.ItemPileConfig.Main.DeleteWhenEmptyYes")}</option>
                    <option value="false">{localize("ITEM-PILES.ItemPileConfig.Main.DeleteWhenEmptyNo")}</option>
                </select>
            </div>

            <div class="form-group">
                <label style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.Macro")}<br>
                    <p>{localize("ITEM-PILES.ItemPileConfig.Main.MacroExplanation")}</p>
                </label>
                <input style="flex:4;" type="text" placeholder={localize("ITEM-PILES.ItemPileConfig.Main.MacroPlaceholder")} bind:value="{pileData.macro}"/>
            </div>

            <div class="form-group">
                <label style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.OverrideCurrencies")}<br>
                    <p>{localize("ITEM-PILES.ItemPileConfig.Main.OverrideCurrenciesExplanation")}</p>
                </label><br>
                <input type="checkbox" bind:checked={pileData.overrideCurrencies}/>
            </div>

            <div class="form-group">
                <button type="button" on:click={showCurrenciesEditor} disabled={!pileData.overrideCurrencies} style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.ConfigureOverrideCurrencies")}
                </button>
            </div>

            <div class="form-group">
                <label style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.OverrideItemFilters")}<br>
                    <p>{localize("ITEM-PILES.ItemPileConfig.Main.OverrideItemFiltersExplanation")}</p>
                </label><br>
                <input type="checkbox" bind:checked={pileData.overrideItemFilters}/>
            </div>

            <div class="form-group">
                <button type="button" on:click={showItemFiltersEditor} disabled={!pileData.overrideItemFilters} style="flex:4;">
                    {localize("ITEM-PILES.ItemPileConfig.Main.ConfigureOverrideItemFilters")}
                </button>
            </div>

        </div>

        <div class="tab othersettings flex item-piles-grow" data-group="primary" data-tab="othersettings">

            <details class="item-piles-collapsible item-piles-clickable">

                <summary>{localize("ITEM-PILES.ItemPileConfig.SingleItem.Title")}</summary>

                <strong class="display-one-warning" style="display:none;">{localize("ITEM-PILES.ItemPileConfig.SingleItem.DisplayOneContainerWarning")}</strong>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.SingleItem.DisplayOne")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.SingleItem.DisplayOneExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.displayOne}/>
                </div>

                <div class="item-pile-display-one-settings">

                    <div class="form-group">
                        <label>
                            {localize("ITEM-PILES.ItemPileConfig.SingleItem.ItemName")}<br>
                            <p>{localize("ITEM-PILES.ItemPileConfig.SingleItem.ItemNameExplanation")}</p>
                        </label>
                        <input type="checkbox" bind:checked={pileData.showItemName}/>
                    </div>

                    <div class="form-group">
                        <label>
                            {localize("ITEM-PILES.ItemPileConfig.SingleItem.OverrideScale")}<br>
                        </label>
                        <input type="checkbox" bind:checked={pileData.overrideSingleItemScale}/>
                    </div>

                    <div class="form-group">
                        <label style="flex:3;">
                            {localize("ITEM-PILES.ItemPileConfig.SingleItem.Scale")}<br>
                        </label>
                        <input style="flex:3;" type="range" min="0.2" step="0.1" max="3" class="item-piles-scaleRange" bind:value="{pileData.singleItemScale}"/>
                        <input style="flex:0.5; margin-left:1rem;" type="number" step="0.1" class="item-piles-scaleInput" bind:value="{pileData.singleItemScale}"/>
                    </div>

                </div>

            </details>

            <details class="item-piles-collapsible item-piles-clickable">

                <summary>{localize("ITEM-PILES.ItemPileConfig.Container.Title")}</summary>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.IsContainer")}</label>
                    <input type="checkbox" bind:checked={pileData.isContainer}/>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.Closed")}</label>
                    <input type="checkbox" bind:checked={pileData.closed}/>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.Locked")}</label>
                    <input type="checkbox" bind:checked={pileData.locked}/>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.ClosedImagePath")}</label>
                    <div class="form-fields">
                        <FilePicker type="imagevideo" bind:value={pileData.closedImage} placeholder="path/image.png"/>
                    </div>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.OpenedImagePath")}</label>
                    <div class="form-fields">
                        <FilePicker type="imagevideo" bind:value={pileData.openedImage} placeholder="path/image.png"/>
                    </div>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.EmptyImagePath")}</label>
                    <div class="form-fields">
                        <FilePicker type="imagevideo" bind:value={pileData.emptyImage} placeholder="path/image.png"/>
                    </div>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.LockedImagePath")}</label>
                    <div class="form-fields">
                        <FilePicker type="imagevideo" bind:value={pileData.lockedImage} placeholder="path/image.png"/>
                    </div>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.CloseSoundPath")}</label>
                    <div class="form-fields">
                        <FilePicker type="audio" bind:value={pileData.closeSound} placeholder="path/sound.wav"/>
                    </div>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.OpenSoundPath")}</label>
                    <div class="form-fields">
                        <FilePicker type="audio" bind:value={pileData.openSound} placeholder="path/sound.wav"/>
                    </div>
                </div>

                <div class="form-group">
                    <label>{localize("ITEM-PILES.ItemPileConfig.Container.LockedSoundPath")}</label>
                    <div class="form-fields">
                        <FilePicker type="audio" bind:value={pileData.lockedSound} placeholder="path/sound.wav"/>
                    </div>
                </div>

            </details>

            <details class="item-piles-collapsible item-piles-clickable">

                <summary>{localize("ITEM-PILES.ItemPileConfig.Sharing.Title")}</summary>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Sharing.ShareItemsEnabled")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Sharing.ShareItemsEnabledExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.shareItemsEnabled}/>
                </div>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Sharing.ShareCurrenciesEnabled")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Sharing.ShareCurrenciesEnabledExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.shareCurrenciesEnabled}/>
                </div>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Sharing.TakeAllEnabled")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Sharing.TakeAllEnabledExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.takeAllEnabled}/>
                </div>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Sharing.SplitAllEnabled")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Sharing.SplitAllEnabledExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.splitAllEnabled}/>
                </div>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Sharing.InactivePlayers")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Sharing.InactivePlayersExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.activePlayers}/>
                </div>

                <div class="form-group">
                    <label style="flex:4;">
                        {localize("ITEM-PILES.ItemPileConfig.Sharing.ResetSharingData")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Sharing.ResetSharingDataExplanation")}</p>
                    </label>
                </div>

                <div class="form-group">
                    <button type="button" class="item-piles-config-reset-sharing-data" style="flex:4;">{localize("ITEM-PILES.ItemPileConfig.Sharing.ResetSharingData")}</button>
                </div>

            </details>

            <details class="item-piles-collapsible item-piles-clickable">

                <summary>{localize("ITEM-PILES.ItemPileConfig.Merchant.Title")}</summary>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Merchant.Enabled")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Merchant.EnabledExplanation")}</p>
                    </label>
                    <input type="checkbox" class="item-piles-config-merchant-enabled" bind:checked={pileData.isMerchant}/>
                </div>

                <div class="form-group">
                    <label style="flex:3;">
                        {localize("ITEM-PILES.ItemPileConfig.Merchant.PriceModifier")}<br>
                    </label>
                    <input style="flex:3;" type="range" min="0" step="1" max="200" bind:value="{pileData.priceModifier}"/>
                    <input style="flex:0.5; margin-left:1rem;" type="number" min="0" step="1" required bind:value="{pileData.priceModifier}"/>
                </div>

                <div class="form-group">
                    <label style="flex:3;">
                        {localize("ITEM-PILES.ItemPileConfig.Merchant.SellModifier")}<br>
                    </label>
                    <input style="flex:3;" type="range" min="0" step="1" max="200" bind:value="{pileData.sellModifier}"/>
                    <input style="flex:0.5; margin-left:1rem;" type="number" min="0" step="1" required bind:value="{pileData.sellModifier}"/>
                </div>

                <div class="form-group">
                    <div class="flexcol">
                        <label>
                            {localize("ITEM-PILES.ItemPileConfig.Merchant.ActorPriceModifiers")}<br>
                            <p>{localize("ITEM-PILES.ItemPileConfig.Merchant.ActorPriceModifiersExplanation")}</p>
                        </label>
                        <button type="button" on:click={showActorPriceOverrides}>
                            {localize("ITEM-PILES.ItemPileConfig.Merchant.ConfigureActorPriceModifiers")}
                        </button>
                    </div>
                </div>

                <div class="form-group">
                    <label>
                        {localize("ITEM-PILES.ItemPileConfig.Merchant.OpenTimes")}<br>
                        <p>{localize("ITEM-PILES.ItemPileConfig.Merchant.OpenTimesExplanation")}</p>
                    </label>
                    <input type="checkbox" bind:checked={pileData.openTimes.enabled}/>
                </div>

                <div class="form-group item-piles-open-times-container" class:item-piles-disabled={!pileData.openTimes.enabled}>
                    <div class="flexcol" style="margin-right:1rem">
                        <label class="item-piles-text-center">
                            Open Time:
                        </label>
                        <div class="flexrow">
                            <input type="number" style="text-align: right;" bind:value="{pileData.openTimes.open.hour}"/>
                            <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
                            <input type="number" bind:value="{pileData.openTimes.open.minute}"/>
                        </div>
                    </div>
                    <div class="flexcol">
                        <label class="item-piles-text-center">
                            Close Time:
                        </label>
                        <div class="flexrow">
                            <input type="number" style="text-align: right;" bind:value="{pileData.openTimes.close.hour}"/>
                            <span style="flex: 0; line-height:1.7; margin: 0 0.25rem;">:</span>
                            <input type="number" bind:value="{pileData.openTimes.close.minute}"/>
                        </div>
                    </div>
                </div>

            </details>

        </div>

    </section>

    <footer>
        <button type="button" on:click={requestSubmit}><i class="far fa-save"></i> {localize("ITEM-PILES.ItemPileConfig.Update")}</button>
    </footer>

</form>

<style lang="scss">

  form {

    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow: hidden;
    height: calc(100%);
    max-height: calc(100%);

    nav {
      margin-bottom: 0.25rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid var(--color-border-light-primary, #b5b3a4);
    }

    .form-group{
      border-radius: 5px;
      margin: 0.2rem 0;
    }

    section {
      padding: 0.25rem;
      height: calc(100% - 70px);
      max-height: calc(100% - 70px);
      overflow-y: auto;
    }

    p {
      flex: 0;
      line-height: 14px;
      font-size: var(--font-size-12);
      color: var(--color-text-dark-secondary);
      padding-right: 1rem;
      margin-top: 0;
      overflow-y: hidden;
    }

    footer {
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--color-border-light-primary, #b5b3a4);
    }
  }

</style>