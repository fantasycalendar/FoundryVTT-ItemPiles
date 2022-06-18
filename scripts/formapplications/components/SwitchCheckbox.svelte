<script>
    export let onText;
    export let offText;
    export let checked;
</script>

<div>

    <label class="switch">
        <input type="checkbox" on:click bind:checked>
        <div class="slider round">
            <!--ADDED HTML -->
            <span class="on">{onText}</span>
            <span class="off">{offText}</span>
            <!--END-->
        </div>
    </label>

</div>


<style lang="scss">

  .switch {
    position: relative;
    display: inline-block;
    width: 180px;
    height: 34px;
  }

  .switch input {display:none;}

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #2e712e;
    -webkit-transition: .4s;
    transition: .4s;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    -webkit-transition: .4s;
    transition: .4s;
  }

  input:checked + .slider {
    background-color: #2e2e8e;
  }

  input:focus + .slider {
    box-shadow: 0 0 1px #2196F3;
  }

  input:checked + .slider:before {
    -webkit-transform: translateX(145px);
    -ms-transform: translateX(145px);
    transform: translateX(145px);
  }

  /*------ ADDED CSS ---------*/
  .on
  {
    display: none;
  }

  .on, .off
  {
    color: white;
    position: absolute;
    transform: translate(-50%,-50%);
    top: 50%;
    left: 50%;
    font-size: 10px;
    font-family: Verdana, sans-serif;
  }

  input:checked+ .slider .on
  {display: block;}

  input:checked + .slider .off
  {display: none;}

  /*--------- END --------*/

  /* Rounded sliders */
  .slider.round {
    border-radius: 34px;
    box-shadow: 0 0 5px 3px inset rgb(0 0 0 / 25%);
  }

  .slider.round:before {
    border-radius: 50%;
  }

</style>