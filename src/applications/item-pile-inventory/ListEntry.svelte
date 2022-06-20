<script>

  import { fade } from 'svelte/transition';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';

  export let store;
  export let data;

  const editQuantitiesStore = store.editQuantities;

</script>

<div class="flexrow item-piles-item-row item-piles-even-color" transition:fade={{duration: 250}}
     class:item-piles-disabled={!$editQuantitiesStore && !data.shareLeft}>

  <div class="item-piles-img-container">
    <!--<img class="item-piles-img"
         src="{data.img}"
         on:mouseenter={mouseEnterImage}
         on:mouseleave={mouseLeaveImage}
    />-->
    <img class="item-piles-img" src="{data.img}"/>
  </div>

  <div class="item-piles-name">
    <div class="item-piles-name-container">
      <!--<a class="item-piles-clickable" on:click={previewItem(item)}>{data.name}</a>-->
      <a class="item-piles-clickable">{data.name}</a>
      <span class="item-piles-small-text">(x{data.quantity})</span>
    </div>
  </div>

  <div class="item-piles-quantity-container" style="flex:2.5;">

    {#if $editQuantitiesStore}

      <div class="item-piles-quantity-input-container">
        <input class="item-piles-quantity" type="number" min="0" bind:value="{data.quantity}"/>
      </div>

    {:else}

      {#if data.shareLeft}
        <div class="item-piles-quantity-input-container">
          <input class="item-piles-quantity" type="number" min="1" bind:value="{data.currentQuantity}"
                 max="{data.quantity}" disabled="{!data.quantity}"/>

          <span class="item-piles-input-divider" class:item-piles-text-right={!store.recipientActor}>
             / {data.shareLeft}
          </span>
        </div>
      {:else}
        <span>
          {localize(`ITEM-PILES.Inspect.${data.toShare ? "NoShareLeft" : "NoneLeft"}`)}
        </span>
      {/if}
    {/if}

  </div>

  {#if !$editQuantitiesStore}

    <button
        on:click={store.take(data)}
        class="item-piles-item-take-button"
        type="button"
        disabled={!data.shareLeft}>
      {localize("ITEM-PILES.Inspect.Take")}
    </button>

  {/if}

</div>

<style lang="scss">

  .item-piles-item-row {
    padding: 0 2px 0 0;
    border-radius: 4px;

    .item-piles-disabled {
      background-color: var(--color-bg-btn-minor-inactive, #c9c7b8)
    }

    .item-piles-disabled {
      background-color: var(--color-bg-btn-minor-inactive, #c9c7b8)
    }

    .item-piles-name {

      margin-left: 5px;
      text-wrap: normal;
      flex: 1 0 45%;
      display: inline-flex;
      flex-direction: column;
      align-items: flex-start;

      .item-piles-name-container {
        flex: 1;
        display: inline-flex;
        flex-direction: row;
        align-items: center;

        a {
          flex: 1 0 auto;
        }

        span {
          margin-left: 5px;
          margin-top: 2px;
          flex: 0 1 auto;
        }
      }

      span {
        line-height: 1;
        flex: 0;
      }
    }

    .item-piles-quantity-container {

      align-items: center;
      display: flex;

      .item-piles-quantity-input-container {

        height: 100%;
        display: flex;
        flex: 1;
        align-items: center;
        flex-direction: row;
        padding: 2px;

        .item-piles-quantity {
          height: 20px;
          flex: 1;
          margin-left: 0.5rem;
          text-align: right;
        }

      }
    }

    .item-piles-input-divider {
      flex: 1;
      margin: 0.1rem 0.5rem 0 0.25rem;
      font-size: 0.8rem;
      line-height: 1.25rem;
    }

    .item-piles-item-take-button, .item-piles-currency-take-button {
      flex: 0;
      min-width: 4rem;
      height: 22px;
      padding: 1px 3px;
      margin: 3px;
      line-height: inherit;
      border-radius: 4px;
    }

  }

</style>