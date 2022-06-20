<script>

  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  export let actor;
  export let actors;

  let changingActor = false;
  let multipleActors = actors.length > 1 && !game.user.isGM;
  let hasUnlinkedTokenOwnership = actors.filter(a => !a.data.token.actorLink).length > 0;

  function setActorFromSelectedToken() {
    if (canvas.tokens.controlled.length === 0) return;
    actor = canvas.tokens.controlled[0].actor;
  }

  function dropData(event) {

    let data;
    try {
      data = JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch (err) {
      return false;
    }

    if (data.type !== "Actor") return;

    actor = game.actors.get(data.id);

    counter = 0;

  }

  let counter = 0;

  function dragEnter() {
    counter++;
  }

  function dragLeave() {
    counter--;
  }

  function preventDefault(event) {
    event.preventDefault();
  }

</script>


<div class="item-piles-bottom-divider">
  <div class="form-group item-piles-actor-container align-center-row"
       class:item-piles-box-highlight={counter > 0}
       on:dragstart={preventDefault}
       on:drop={dropData}
       on:dragover={preventDefault}
       on:dragenter={dragEnter}
       on:dragleave={dragLeave}
  >
    {#if actor}
      <div class="align-center-col">
        {#if actor.data.img}
          <img src="{actor.data.img}">
        {/if}

        {#if multipleActors}
          <span>
            {#if changingActor}
              <select class="item-piles-change-actor-select"
                      bind:value={actor}
                      on:change={() => { changingActor = false }}
              >
                {#each actors as potentialActor (potentialActor.id)}
                <option value="{potentialActor}">{ potentialActor.name }</option>
                {/each}
              </select>
            {:else}
              <a class='item-piles-change-actor item-piles-highlight'
                 on:click={() => { changingActor = true }}>{ actor.name }</a>
            {/if}
          </span>
        {:else}
          <span>{ actor.name }</span>
        {/if}

      </div>
    {:else}
      <p>{ localize("ITEM-PILES.Trade.Prompt.DropActor") }</p>
    {/if}
  </div>
  {#if hasUnlinkedTokenOwnership}
    <div class="flexrow">
      <button type="button" on:click={setActorFromSelectedToken}>
        <i class="fas fa-expand"></i>
        {localize("ITEM-PILES.Trade.Prompt.PickToken")}
      </button>
    </div>
  {/if}
</div>

<style lang="scss">

  .item-piles-actor-container {
    margin-bottom: 1rem;
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

</style>