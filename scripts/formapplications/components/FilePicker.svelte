<script>
   export let index;
   export let img;
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
   <input type="text" name="{index}.img" placeholder="path/image.png" value="{img}"/>
   <button on:click={handleClick} type="button"><i class="fas fa-file-import"></i></button>
</div>

<style lang="scss">

   div {
      display:inline-flex;
      flex-direction: row;

      button {
         padding: 0.25rem 0.25rem;
         line-height: 1rem;
         flex:0;
      }
   }

</style>