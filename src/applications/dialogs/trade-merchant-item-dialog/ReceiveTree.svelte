<script>
	export let nodes = [];
	export let nested = false;
</script>

<ul class="item-piles-receive-tree" class:nested>
	{#each nodes as node}
		<li class="item-piles-receive-entry">
			<div class="item-piles-receive-row">
				<div class="item-piles-img-container" style="margin-right: 0.25rem;">
					<img class="item-piles-img" src={node.entry.img}/>
				</div>
				<span class="item-piles-receive-name" data-tooltip={node.entry.name}>
					{node.entry.quantity > 1 ? node.entry.quantity + " " : ""}{node.entry.name}
				</span>
			</div>
			{#if node.children.length}
				<svelte:self nodes={node.children} nested/>
			{/if}
		</li>
	{/each}
</ul>

<style lang="scss">

  .item-piles-receive-tree {
    list-style: none;
    margin: 0;
    padding: 0;

    &:not(.nested) {
      align-self: flex-end;
      max-width: 100%;
    }

    li {
      min-width: 0;
    }

    &.nested {
      margin-left: 0.7rem;

      > li {
        position: relative;
        padding-left: 0.75rem;

        &::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 0.6rem;
          height: 14px;
          border-left: 1px solid var(--item-piles-divider);
          border-bottom: 1px solid var(--item-piles-divider);
        }

        &:not(:last-child)::after {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          border-left: 1px solid var(--item-piles-divider);
        }
      }
    }
  }

  .item-piles-receive-row {
    display: flex;
    align-items: center;
    min-width: 0;

    .item-piles-img-container {
      flex: 0 0 auto;
    }
  }

  .item-piles-receive-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

</style>
