<script>
  import { getContext } from 'svelte';
  import { localize } from '@typhonjs-fvtt/runtime/svelte/helper';
  import { fade } from 'svelte/transition';
  import { ApplicationShell } from '@typhonjs-fvtt/runtime/svelte/component/core';
  import * as PileUtilities from "../../helpers/pile-utilities.js";
  import Tabs from "../components/Tabs.svelte";

  const { application } = getContext('external');

  export let elementRoot;

  export let merchant;
  export let buyer;

  let merchantData;
  let merchantItems;
  let description;
  let search = '';

  updateContents();

  export function updateContents() {

    merchantData = PileUtilities.getActorFlagData(merchant);

    merchantItems = PileUtilities.getMerchantItemsForActor(merchant, buyer);

    console.log(merchantItems);

    merchantItems.sort((a, b) => {
      return a.type < b.type || a.name < b.name ? -1 : 1;
    })

    merchantItems = merchantItems.reduce(function (list, item) {
      list[item.type] = list[item.type] || [];
      list[item.type].push(item);
      console.log(item)
      return list;
    }, {});

    description = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    filterItems();
  }

  function filterItems() {
    Object.values(merchantItems).forEach(itemGroup => {
      itemGroup.forEach(item => {
        item.visible = !search || item.name.toLowerCase().includes(search.toLowerCase());
      });
    });
    merchantItems = merchantItems;
  }

  function getOpenTimes() {
    let open = merchantData.openTimes.open;
    let close = merchantData.openTimes.close;
    open = `${open.hour.toString().padStart(2, "0")}:${open.minute.toString().padStart(2, "0")}`;
    close = `${close.hour.toString().padStart(2, "0")}:${close.minute.toString().padStart(2, "0")}`;
    return `${open} - ${close}`;
  }

  function previewItem(item) {
    item = merchant.items.get(item.id);
    if (game.user.isGM || item.data.permission[game.user.id] === 3) {
      return item.sheet.render(true);
    }
    const cls = item._getSheetClass()
    const sheet = new cls(item, { editable: false })
    return sheet._render(true);
  }

  function buyItem(item) {
    console.log(item)
  }

  let activeSidebarTab = "description";

</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
  <main>

    <div class="flexrow merchant-top-bar item-piles-bottom-divider">
      <div class="merchant-name">{ merchant.name }</div>
      {#if merchantData.openTimes.enabled}
        <div class="opening-hours flexcol">
          <span>Opening hours</span>
          <span style="font-style: italic;">{getOpenTimes()}</span>
        </div>
      {/if}
    </div>

    <div class="flexrow item-pile-merchant-content">

      <div class="merchant-left-pane flexcol">

        <div class="merchant-img">
          <img src="{ merchant.img }">
        </div>

        <div class="flexcol item-piles-top-divider">

          <Tabs style="flex: 0 1 auto;" tabs="{[
            { value: 'description', label: 'Description' },
            { value: 'settings', label: 'Settings', hidden: !game.user.isGM },
          ]}" bind:activeTab={activeSidebarTab}/>

          <section class="tab-body item-piles-sections flexcol" style="padding:0.25rem;margin-top:0.5rem;">

            {#if activeSidebarTab === 'description'}
              <div class="tab flex item-piles-grow">
                { description }
              </div>
            {/if}

            {#if activeSidebarTab === 'settings'}
              <div class="tab flex item-piles-grow">
                WHATUP
              </div>
            {/if}

          </section>

        </div>

      </div>

      <div class="merchant-right-pane">

        <h2 style="flex: 0; border:0;">For sale</h2>

        <input type="text" bind:value={search} on:keyup={foundry.utils.debounce(filterItems, 250)}>

        {#each Object.entries(merchantItems) as [type, items] (type)}

          {#if items.filter(item => item.visible).length}

            <div transition:fade={{duration: 150}}>

              <h3 class="merchant-item-group-type flexrow">
                <div>
                  {type}
                </div>
                <div style="flex: 0 1 162px;">
                  <small>Price(s)</small>
                </div>
              </h3>

              <div class="item-piles-items-list">

                {#each items as item (item.id)}

                  {#if item.visible}

                    <div class="flexrow item-piles-item-row item-piles-odd-color" transition:fade={{duration: 250}}
                         style="flex: 1 0 auto;">

                      <div class="item-piles-img-container"><img class="item-piles-img" src="{item.img}"/></div>

                      <div class="item-piles-name item-piles-text">
                        <div class="item-piles-name-container">
                          {#if merchantData.canInspectItems || game.user.isGM}
                            <a class="item-piles-clickable" on:click={previewItem(item)}>{item.name}</a>
                          {:else}
                            {item.name}
                          {/if}
                        </div>
                      </div>

                      {#if item.prices.length === 1}
                        <div class="flexrow" style="flex-direction:row; flex: 0 1 100px; align-items: center;">
                          <img src="{item.prices[0].img}" title="{localize(item.prices[0].name)}"
                               style=" border-radius: 4px; max-height:20px; max-width: 20px; margin-right: 5px;">
                          <small>{item.prices[0].cost}</small>
                        </div>
                      {/if}

                      <div class="flexrow" style="flex: 0 1 50px; align-items: center;">
                        <a class="item-piles-buy-button" on:click={buyItem(item)}><i class="fas fa-shopping-cart"></i>
                          Buy</a>
                      </div>

                    </div>

                  {/if}

                {/each}

              </div>

            </div>

          {/if}

        {/each}

      </div>

    </div>

  </main>
</ApplicationShell>


<style lang="scss">

  .hidden {
    display: none;
  }

  main {

    display: flex;
    flex-direction: column;
    height: 100%;

    .merchant-top-bar {

      flex: 0 1 auto;

      .opening-hours {
        text-align: right;
        flex: 0 1 auto;
      }

      .merchant-name {
        font-size: 2em;
      }

    }

    .item-pile-merchant-content {

      flex: 1;
      max-height: calc(100% - 53px);

      .merchant-left-pane {

        flex: 0 1 35%;
        padding-right: 10px;
        margin-right: 10px;
        border-right: 1px solid rgba(0, 0, 0, 0.5);
        max-height: 100%;
        max-width: 300px;
        min-width: 250px;
        overflow-y: scroll;

        .merchant-img {
          flex: 0 1 auto;
          border-radius: 5px;
          margin-bottom: 5px;

          img {
            width: 100%;
            height: auto;
            border: 0;
            border-radius: 3px;
          }
        }

        .merchant-description {
          overflow-y: scroll;
          padding: 5px 10px 5px 5px;
          border-radius: 3px;
          border: 1px solid rgba(0, 0, 0, 0.25);
          margin-bottom: 5px;
        }

        .merchant-details {
          padding: 5px;
          border-radius: 3px;
          border: 1px solid rgba(0, 0, 0, 0.25);
          flex: 0;
        }

      }

      .merchant-right-pane {
        flex: 1;
        max-height: 100%;

        overflow-y: scroll;

        .merchant-item-group-type {
          border-bottom: 1px solid rgba(0, 0, 0, 0.2);
          text-transform: capitalize;
          margin-top: 10px;
        }

        .item-piles-items-list {
          overflow: auto;
          padding-right: 10px;

          .item-piles-item-row {

            margin: 0;

            .item-piles-text {
              font-size: inherit;
              padding-left: 0.25rem;
            }

            .item-piles-img-container {
              min-height: 20px;
              max-width: 20px;
              max-height: 20px;
              margin: 2px;

              overflow: hidden;
              border-radius: 4px;
              border: 1px solid black;
              align-self: center;

              .item-piles-img {
                border: 0;
                width: auto;
                height: 100%;
                transition: transform 150ms;

                &:hover {
                  transform: scale(1.125, 1.125);
                }
              }
            }

            .item-piles-name-container {
              line-height: 1.6;
            }

            .item-piles-disabled {
              background-color: var(--color-bg-btn-minor-inactive, #c9c7b8)
            }

          }
        }
      }
    }
  }


</style>