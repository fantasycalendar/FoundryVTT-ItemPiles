<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import * as Utilities from "../../helpers/utilities.js";

  export let store;

  let editQuantitiesStore = store.editQuantities;

  let changingActor = false;
  let playerActors = game.actors.filter(actor => actor.isOwner && actor !== store.pileActor && actor.data.token.actorLink);
  let recipientActorUuid = Utilities.getUuid(store.recipientActor);

  function changeRecipientActor() {
    store.recipientActor = playerActors.find(actor => Utilities.getUuid(actor) === recipientActorUuid);
    store.update();
    changingActor = false;
  }

</script>

<div>

  {#if $editQuantitiesStore}
    <p style="text-align: center; flex: 0 1 auto;">{localize("ITEM-PILES.Inspect.Owner")}</p>
  {:else}
    <p style="text-align: center; flex: 0 1 auto; height: 27px;">
      {localize("ITEM-PILES.Inspect.AsActor", { actorName: store.recipientActor.name })}
      {#if playerActors.length > 1}
        {#if !changingActor}
          <a class='item-piles-highlight' on:click={() => { changingActor = true }} class:active={!changingActor}>Change
            actor.</a>
        {:else}
          <select
              class="item-piles-change-actor-select"
              bind:value={recipientActorUuid}
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
    </p>
  {/if}

</div>