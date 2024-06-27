<script>

	import { localize } from "#runtime/svelte/helper";

	export let item;
	export let quantity;
	export let sourceActor;
	export let targetActor;

</script>


<div class="item-piles-dialog-root">

	<p class="header">
		{localize("ITEM-PILES.Dialogs.ReceiveItem.Header")}
	</p>

	<div class="item-piles-give-image-container">
		<img src="{sourceActor.img}"/>
		<i class="fas fa-arrow-right"></i>
		<img src="{targetActor.img}"/>
	</div>

	<div class="item-piles-give-item-container">
		<img src="{item.img}"/>
		<span>{item.name} ({quantity})</span>
	</div>

	<p>{localize("ITEM-PILES.Dialogs.ReceiveItem.Content", {
		source_actor_name: sourceActor.name,
		target_actor_name: targetActor.name
	})}</p>

</div>

<style lang="scss">

  .item-piles-dialog-root {

    margin-bottom: 0.5rem;
    font-size: 0.9rem;
    text-align: center;

    .header {
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
      font-weight: bold;
    }

    .item-piles-give-item-container, .item-piles-give-image-container {
      display: grid;

      grid-auto-flow: column;
      align-items: center;
      justify-items: center;
      justify-content: center;
      align-content: center;
      gap: 1rem;

      margin-bottom: 0.5rem;

    }

    .item-piles-give-image-container {

      font-size: 2rem;

      img {
        max-height: 70px;
        border: 0;
      }
    }

    .item-piles-give-item-container {

      font-size: 1rem;

      img {
        max-height: 40px;
        border: 0;
        border-radius: 0.5rem;
      }

    }

  }

</style>
