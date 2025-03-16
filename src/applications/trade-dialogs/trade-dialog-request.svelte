<script>

	import { localize } from '#runtime/util/i18n';
	import { getContext } from "svelte";
	import { tweened } from 'svelte/motion';
	import { linear } from 'svelte/easing';
	import * as Helpers from "../../helpers/helpers.js";
	import ActorDropSelect from "./ActorDropSelect.svelte";
	import { ApplicationShell } from "#runtime/svelte/component/application";

	const { application } = getContext('#external');

	export let elementRoot;
	export let isPrivate;
	export let tradingActor;
	export let tradingUser;
	export let users;
	export let user;
	export let actors;
	export let actor;

	let isGM = game.user.isGM;

	users = game.users.filter(user => user.active && user !== game.user);
	user = user || users?.[0] || false;
	actors = actors || game.actors.filter(actor => actor.isOwner);
	actor = actor || game.user.character || (!isGM ? actors?.[0] : false);

	let done = false;

	async function accept() {
		application.options.resolve(actor);
		close();
	}

	async function decline() {
		application.options.resolve(false);
		close();
	}

	async function mute() {
		application.options.resolve("mute");
		close();
	}

	async function disconnected() {
		Helpers.custom_warning(game.i18n.localize("ITEM-PILES.Trade.Disconnected"), true)
		close();
	}

	const progress = tweened(0, {
		duration: 20000,
		easing: linear
	});

	$: actualProgress = $progress * 100;

	let timeout = setTimeout(() => {
		if (done) return;
		progress.set(1);
		timeout = setTimeout(() => {
			if (done) return;
			Helpers.custom_warning(localize("ITEM-PILES.Trade.AutoDecline"), true)
			decline();
		}, 21000)
	}, 14000);

	const connection = setInterval(() => {
		const user = game.users.get(tradingUser.id)
		if (!user.active) {
			disconnected();
		}
	}, 100);

	function close() {
		clearInterval(connection);
		clearTimeout(timeout);
		done = true;
		application.close();
	}

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<div class="item-piles-flexcol trade-dialog">

		<p><i class="item-piles-header-icon fas fa-handshake"></i></p>

		<p style="margin-bottom: 1rem">
			<strong style="font-size:1.2rem;">
				{ localize("ITEM-PILES.Trade.Request.Title") }
			</strong>
		</p>

		<div class="item-piles-bottom-divider">
			{#if isPrivate}
				<p>{@html localize("ITEM-PILES.Trade.Request.PrivateContent", {
					trading_user_name: tradingUser.name,
					trading_actor_name: tradingActor.name
				})}</p>
			{:else}
				<p>{localize("ITEM-PILES.Trade.Request.Content", {
					trading_user_name: tradingUser.name,
					trading_actor_name: tradingActor.name
				})}</p>
			{/if}
			<p>{localize("ITEM-PILES.Trade.Request.AcceptQuery")}</p>
		</div>

		{#if actor}
			<p>{localize("ITEM-PILES.Trade.Prompt.PickedActor")}</p>
		{:else}
			<p>{localize("ITEM-PILES.Trade.Prompt.PickActor")}</p>
		{/if}

		<ActorDropSelect {actors} bind:actor={actor}/>

		<footer class="sheet-footer item-piles-flexrow">
			<button disabled={!actor} on:click|once={accept} type="button">
				<i class="fas fa-check"></i> {localize("ITEM-PILES.Trade.Accept")}
			</button>
			<button on:click|once={decline} type="button">
				<i class="fas fa-times"></i> {localize("ITEM-PILES.Trade.Decline")}
			</button>
			<button on:click|once={mute} type="button">
				<i class="fas fa-comment-slash"></i> {localize("ITEM-PILES.Trade.Mute")}
			</button>
		</footer>

		<div class="item-piles-progress" class:active={actualProgress > 0} style="flex: 1 0 auto;">
			<span class="progress-bar" style="width: {actualProgress}%;"></span>
		</div>
	</div>

</ApplicationShell>

<style lang="scss">

  .trade-dialog {
    text-align: center;
  }

  .item-piles-header-icon {
    font-size: 3rem;
  }

  .item-piles-progress {
    width: calc(100% - 4px);
    background: #e1e4e8;
    border-radius: 3px;
    overflow: hidden;
    margin: 0.25rem 2px 0 2px;
    height: 6px;
    display: none;

    &.active {
      display: block;
    }

    .progress-bar {
      display: block;
      height: 100%;
      background-color: rgba(255, 20, 20, 0.65);
    }
  }

  button:disabled {
    opacity: 0.75;
  }

</style>
