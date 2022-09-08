<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { getContext } from "svelte";
  import ActorDropSelect from "./ActorDropSelect.svelte";
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";

  const { application } = getContext('external');

  export let elementRoot;
  export let isPrivate;
  export let users;
  export let user;
  export let actors;
  export let actor;

  let isGM = game.user.isGM;

  users = game.users.filter(user => user.active && user !== game.user);
  user = user || users?.[0] || false;
  actors = actors || game.actors.filter(actor => actor.isOwner);
  actor = actor || game.user.character || (!isGM ? actors?.[0] : false);

  function requestTrade() {
    application.options.resolve({
      user,
      actor,
      isPrivate
    });
    application.close();
  }

</script>

<ApplicationShell bind:elementRoot>

  <div class="item-piles-flexcol trade-dialog">

    <p><i class="item-piles-header-icon fas fa-handshake"></i></p>

    <p style="margin-bottom: 1rem">
      <strong style="font-size:1.2rem;">
        {localize("ITEM-PILES.Trade.Prompt.Title")}
      </strong>
    </p>

    <p>{localize("ITEM-PILES.Trade.Prompt.User")}</p>

    <div class="item-piles-bottom-divider">
      <div class="form-group align-center-row">
        <select name="user" style="width: 66%;" bind:value={user}>
          {#each users as potentialUser (potentialUser.id)}
            <option value="{potentialUser}">{potentialUser.name}</option>
          {/each}
        </select>
      </div>
    </div>
    <div class="item-piles-bottom-divider">
      <div class="form-group align-center-col">
        <label class="align-center-row">
          <input type="checkbox" name="private" bind:checked={isPrivate}>
          <span>{localize("ITEM-PILES.Trade.Private")}</span>
        </label>
        <small>{localize("ITEM-PILES.Trade.PrivateExplanation")}</small>
      </div>
    </div>

    {#if actor}
      <p>{localize("ITEM-PILES.Trade.Prompt.PickedActor")}</p>
    {:else}
      <p>{localize("ITEM-PILES.Trade.Prompt.PickActor")}</p>
    {/if}

    <ActorDropSelect bind:actor={actor} {actors}/>

    <footer class="sheet-footer item-piles-flexrow">
      <button type="button" on:click|once={requestTrade} disabled={!actor}>
        <i class="fas fa-check"></i> {localize("ITEM-PILES.Trade.Prompt.Label")}
      </button>
    </footer>

  </div>

</ApplicationShell>


<style lang="scss">

  .trade-dialog {
    text-align: center;
  }

  .item-piles-header-icon {
    font-size: 3rem;
  }

  .item-piles-actor-container {
    margin-bottom: 0.25rem;
    min-height: 150px;
    padding: 0.5rem;
    text-align: center;
    border: 1px solid gray;
    border-radius: 5px;

    img {
      border: 0;
      max-height: 80px;
      max-width: 80px;
      width: auto;
      height: auto;
      border-radius: 5px;
      filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
      margin-bottom: 10px;
    }

    span {
      font-size: 1.5rem;
      text-align: center;
    }
  }

  .item-piles-box-highlight {
    box-shadow: 0 0 20px inset var(--color-shadow-highlight, #ff6400);
  }

  .item-piles-change-actor-select {
    height: 23px;
  }

  button:disabled {
    opacity: 0.75;
  }

</style>