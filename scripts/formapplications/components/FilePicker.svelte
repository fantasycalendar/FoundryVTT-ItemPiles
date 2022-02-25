<script>
   export let index;
   export let img;
   export let showImg = false;
   let filepicker;

   function handleClick(){
      if(filepicker) return filepicker.render(false, { focus: true });
      filepicker = new FilePicker({
         type: "image",
         current: img,
         callback: path => {
            img = path;
         }
      }).render(true);
   }
</script>

<div>
   {#if showImg}<img alt="Currency" src="{img}" style="flex:0 1 auto;">{/if}
   <input type="text" placeholder="path/image.png" bind:value="{img}"/>
   <button on:click={handleClick} type="button"><i class="fas fa-file-import"></i></button>
</div>

<style lang="scss">

   div {
      flex:1;
      display:inline-flex;
      flex-direction: row;
      align-items: center;

      img {
         width: auto;
         max-height:26px;
         margin-right: 3px;
         border-radius: 3px;
      }

      button {
         padding: 0.25rem 0.25rem;
         line-height: 1rem;
         flex:0;
      }
   }

</style>