<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { ApplicationShell } from "@typhonjs-fvtt/runtime/svelte/component/core";
  import { get, writable } from "svelte/store";

  const { application } = getContext('#external');

  let form;

  export let data;
  export let elementRoot;

  const vaultAccessStore = writable(data.map(access => {
    return foundry.utils.mergeObject({
      view: true,
      organize: true,
      items: {
        withdraw: true,
        deposit: true
      },
      currencies: {
        withdraw: true,
        deposit: true
      }
    }, access)
  }));

  const validUsers = Array.from(game.users).filter(user => !user.isGM);

  const validActors = Array.from(game.actors).filter(actor => actor.hasPlayerOwner);

  const validDocs = validUsers.concat(validActors).map(document => ({ uuid: document.uuid, document }));

  $: validDocuments = validDocs.filter(document => !$vaultAccessStore.some(access => access.uuid === document.uuid))
  $: validUuids = new Set(validDocuments.map(document => document.uuid));

  function addAccess() {
    if (!validDocuments.length) return
    vaultAccessStore.update(value => {
      value.push({
        uuid: validDocuments[0].uuid,
        document: validDocuments[0].document,
        view: true,
        organize: true,
        items: {
          withdraw: true,
          deposit: true
        },
        currencies: {
          withdraw: true,
          deposit: true
        }
      });
      return value;
    });
  }

  function removeAccess(index) {
    vaultAccessStore.update(value => {
      value.splice(index, 1)
      return value;
    })
  }

  async function updateSettings() {
    application.options.resolve?.(get(vaultAccessStore).map(access => {
      delete access.document;
      return access;
    }));
    application.close();
  }

  export function requestSubmit() {
    form.requestSubmit();
  }

  function preventDefault(event) {
    event.preventDefault();
  }

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>

	<form bind:this={form} on:submit|preventDefault={updateSettings} autocomplete=off>

		<p style="text-align: center;">
			{localize("ITEM-PILES.Applications.VaultAccessEditor.Explanation")}
		</p>

		<div class="form-group item-pile-access-grid">
			<div class="item-piles-grid-row-wrapper">
				<div style="text-align: left;">
					<span>{localize("ITEM-PILES.Applications.VaultAccessEditor.Character")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Applications.VaultAccessEditor.View")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Applications.VaultAccessEditor.Organize")}</span>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Items")}</span>
					<div><i>{localize("ITEM-PILES.Applications.VaultAccessEditor.Withdraw")}</i> |
						<i>{localize("ITEM-PILES.Applications.VaultAccessEditor.Deposit")}</i></div>
				</div>
				<div class="item-piles-flexcol">
					<span>{localize("ITEM-PILES.Currencies")}</span>
					<div><i>{localize("ITEM-PILES.Applications.VaultAccessEditor.Withdraw")}</i> |
						<i>{localize("ITEM-PILES.Applications.VaultAccessEditor.Deposit")}</i></div>
				</div>
				<a on:click={() => addAccess()} style="margin-right: 0.5rem;">
					<i class="fas fa-plus"></i>
				</a>
			</div>

			{#each $vaultAccessStore as access, index (access.uuid)}
				<div class="item-piles-grid-row-wrapper">
					<div>
						<select bind:value={access.uuid}>
							{#each validDocs as document (document.uuid)}
								{#if access.uuid === document.uuid || validUuids.has(document.uuid)}
									<option value={document.uuid}>{document.document.name}</option>
								{/if}
							{/each}
						</select>
					</div>
					<div style="text-align: center;">
						<input type="checkbox" bind:checked={access.view}>
					</div>
					<div style="text-align: center;">
						<input type="checkbox" bind:checked={access.organize}>
					</div>
					<div style="text-align: center;">
						<input type="checkbox" bind:checked={access.items.withdraw}>
						<input type="checkbox" bind:checked={access.items.deposit}>
					</div>
					<div style="text-align: center;">
						<input type="checkbox" bind:checked={access.currencies.withdraw}>
						<input type="checkbox" bind:checked={access.currencies.deposit}>
					</div>
					<a on:click={() => removeAccess(index)} class="item-piles-clickable-red" style="margin-right: 0.5rem;">
						<i class="fas fa-times"></i>
					</a>
				</div>
			{/each}
		</div>

		<footer class="item-piles-top-divider">
			<button type="button" on:click|once={requestSubmit}>
				<i class="far fa-save"></i> {localize("Save")}
			</button>
			<button type="button" on:click|once={() => { application.close(); }}>
				<i class="far fa-times"></i> { localize("Cancel") }
			</button>
		</footer>

	</form>

</ApplicationShell>


<style lang="scss">

  .item-pile-access-grid {
    display: grid;
    grid-template-columns: 1.5fr 0.5fr 0.5fr 1fr 1fr auto;
    gap: 4px;

    select {
      width: 100%;
    }

    .item-piles-grid-row-wrapper {
      display: contents;
      border-bottom: 1px solid rgba(0, 0, 0, 0.5);
    }

    .item-piles-grid-row-wrapper:first-of-type {
      > div {
        margin-bottom: 0.25rem;
        text-align: center;

        > div {
          font-size: 0.75rem;
        }
      }
    }
  }

</style>
