<script>
	import { fade } from 'svelte/transition';
	import { onMount } from "svelte";

	export let item;
	export let index;
	export let columns;

	const doc = item.itemDocument;
	const itemFlagData = item.itemFlagData;

	let element = false;

	$: {
		$doc;
		item.rendered(element);
	}

	onMount(() => {
		item.rendered(element);
	});

</script>

<div class="item-piles-flexrow item-piles-item-row"
     bind:this={element}
     class:item-piles-child-even-color={index%2===0}
     class:item-piles-child-odd-color={index%2===1}
     class:merchant-item-hidden={$itemFlagData.hidden}
     on:mouseover={() => { item.mouseEnter(element) }}
     on:mouseleave={() => { item.mouseLeave(element) }}
     transition:fade|local={{duration: 250}}>

	{#each columns as column}
		{#if column?.data}
			<svelte:component this={column.component} {item} data={column.data}/>
		{:else}
			<svelte:component this={column.component} {item}/>
		{/if}
	{/each}

</div>


<style lang="scss">


  .item-piles-item-row:global(.item-piles-child-even-color > *) {
    background-color: var(--item-piles-even-color);
  }

  .item-piles-item-row:global(.item-piles-child-odd-color > *) {
    background-color: var(--item-piles-odd-color);
  }

  .item-piles-item-row {
    margin: 0;
    overflow: visible;
    display: contents;
    flex: 1 0 auto;

    & > * {
      padding: 0 10px;
      text-align: center;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
    }

    &.merchant-item-hidden > * {
      font-style: italic;
      opacity: 0.5;
    }

    .item-piles-text {
      font-size: inherit;
    }

    .item-piles-img-container {
      min-width: 20px;
      max-height: 20px;
      margin: 2px;
      flex: 1 0 auto;

      overflow: hidden;
      border-radius: 4px;
      border: 1px solid black;
      align-self: center;
    }

    .item-piles-name-container {
      line-height: 1.6;
    }

  }

</style>
