<script>
   export let value;
   export let type;
   export let placeholder;

   let filepicker = false;

   function handleClick(){
      if(!filepicker){
         filepicker = new FilePicker({
            type: type,
            current: value,
            callback: path => {
               value = path;
            }
         });
      }

      filepicker.render(true, { focus: true });
   }

</script>

<div>
   <input type="text" placeholder="{placeholder}" bind:value="{value}"/>
   <button on:click={handleClick} type="button"><i class="fas fa-file-import"></i></button>
</div>

<style lang="scss">

   div {
      width:100%;
      display:inline-flex;
      flex-direction: row;
      align-items: center;

      button {
         padding: 0.25rem 0.25rem;
         line-height: 1rem;
         flex:0;
      }
   }

</style>