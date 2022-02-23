<script>
   import { getContext }         from 'svelte';
   import { fade, scale }        from 'svelte/transition';
   import { ApplicationShell }   from '@typhonjs-fvtt/runtime/svelte/component/core';

   export let elementRoot;
   export let message;

   const foundryApp = getContext('external').foundryApp;

   // Provides one-way bindings to application options. If changed externally updates will not be received here.
   // Below in the `input element` for draggable you could also just set it to `{foundryApp.reactive.draggable}` and
   // omit the reactive statement below.
   let draggable = foundryApp.reactive.draggable;

   // This is a reactive statement. When `draggable` changes `foundryApp.reactive.draggable` is set.
   $: foundryApp.reactive.draggable = false;

   // Provides two-way bindings to application options. By using the stores external updates will be received here.
   const storeMinimizable = foundryApp.reactive.storeAppOptions.minimizable;
   const storeResizable = foundryApp.reactive.storeAppOptions.resizable;
   const storeTitle = foundryApp.reactive.storeAppOptions.title;

   function onClick()
   {
      TJSDialog.prompt({
         title: 'A modal dialog!',
         draggable: false,
         modal: false,
         content: 'A cool modal dialog!',  // You can set content with a Svelte component!
         label: 'Ok'
      });
   }
</script>

<svelte:options accessors={true}/>

<ApplicationShell bind:elementRoot>
   <main in:fade={{duration: 5000}}>
      <h1>Hello {message}!</h1>
      <label>
         Message:&nbsp;<input bind:value={message}>
      </label>
      <br>
      <label>
         Change title:&nbsp;<input bind:value={$storeTitle}>
      </label>
      <button on:click={onClick}>Launch a modal dialog</button>
      <div class=container>
         Make application:
         <label><input type=checkbox bind:checked={foundryApp.reactive.draggable}> Draggable</label>
         <label><input type=checkbox bind:checked={$storeMinimizable}> Minimizable</label>
         <label><input type=checkbox bind:checked={$storeResizable}> Resizable</label>
      </div>
      <div class=bottom>
         <a href="https://svelte.dev/tutorial">Interactive Svelte tutorial (highly recommended)</a>
         <br>
         <a href="https://www.youtube.com/playlist?list=PLoKaNN3BjQX3mxDEVG3oGJx2ByXnue_gR">Svelte tutorial videos</a>
      </div>
   </main>
</ApplicationShell>