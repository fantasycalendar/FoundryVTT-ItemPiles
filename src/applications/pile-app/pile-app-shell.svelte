<script>
	import { ApplicationShell } from '#runtime/svelte/component/application';
	import { getContext, onDestroy } from "svelte";
	import ActorStore from "../../stores/actor-store.js";

	export let elementRoot;
	export let actor;

	const { application } = getContext('#external');

	const store = ActorStore(actor);

	store.addApplication(application.id);

	$: {
		$store.items;
		console.log("here")
		application.setPosition();
	}

	onDestroy(() => {
		store.removeApplication(application.id);
	})
</script>

<!-- This is necessary for Svelte to generate accessors TRL can access for `elementRoot` -->
<svelte:options accessors={true}/>

<!-- ApplicationShell provides the popOut / application shell frame, header bar, content areas -->
<!-- ApplicationShell exports `elementRoot` which is the outer application shell element -->
<ApplicationShell bind:elementRoot>
	<main>
		<div style="display:flex; flex-direction: column;">
			{#each $store.items as item (item.id)}
				<div style="display:flex; align-items: center;">
					<img src="{item.img}" style="width:32px; margin-right: 0.5rem;"/>
					<div>{item.name}</div>
				</div>
			{/each}
		</div>
	</main>
</ApplicationShell>