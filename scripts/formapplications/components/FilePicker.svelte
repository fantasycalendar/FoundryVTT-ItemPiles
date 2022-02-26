<script>
   export let index;
   export let img;
   let filepicker = new FilePicker({
      type: "image",
      current: img,
      callback: path => {
         img = path;
      }
   });
   function handleClick(){
      filepicker.render(true, { focus: true });
   }
</script>

<div>
   <input type="text" placeholder="path/image.png" bind:value="{img}"/>
   <button on:click={handleClick} type="button"><i class="fas fa-file-import"></i></button>
</div>

<style lang="scss">

   div {
      width:100%;
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