<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as Utilities from "../../helpers/utilities.js";

  export let store;
  export let localization = "ITEM-PILES.Inspect.AsActor";
  export let style = "text-align: center; flex: 0 1 auto; height: 27px;";

  let editQuantities = store.editQuantities;

  let changingActor = false;
  let playerActors = game.actors.filter(actor => actor.isOwner && actor !== store.pileActor && actor.prototypeToken.actorLink);
  let recipientUuid = Utilities.getUuid(store.recipient);
  const recipientDoc = store.recipientDocument;

  $: {
    $recipientDoc;
    recipientUuid = store.recipient ? Utilities.getUuid(store.recipient) : false;
  }

  function changeRecipientActor() {
    store.recipient = playerActors.find(actor => Utilities.getUuid(actor) === recipientUuid);
    store.update();
    changingActor = false;
  }

</script>

{#if $editQuantities}
	<div {style}>{localize("ITEM-PILES.Inspect.Owner")}</div>
{:else}
	<div {style}>
		{#if !changingActor}
			{localize(localization, { actorName: $recipientDoc.name })}
		{/if}
		{#if playerActors.length > 1}
			{#if !changingActor}
				<a class='item-piles-highlight' on:click={() => { changingActor = true }} class:active={!changingActor}>
					Change.
				</a>
			{:else}
				<select
					class="item-piles-change-actor-select"
					bind:value={recipientUuid}
					on:change={changeRecipientActor}
					class:active={changingActor}
					style="height:auto;"
				>
					{#each playerActors as actor, index (index)}
						<option value="{Utilities.getUuid(actor.uuid)}">{actor.name}</option>
					{/each}
				</select>
			{/if}
		{/if}
	</div>
{/if}
