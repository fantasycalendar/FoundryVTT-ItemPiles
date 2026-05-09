<script>

	export let callback;
	export let isHovering;
	export let active = true;
	export let enterCallback = () => {
	};
	export let overCallback = () => {
	};
	export let leaveCallback = () => {
	};

	function dropData(event, ...args) {
		if (!active) return;
		counter = 0;
		let data;
		try {
			data = JSON.parse(event.dataTransfer.getData('text/plain'));
		} catch (err) {
			return false;
		}
		callback(data, event, ...args);
	}

	let counter = 0;

	function enter(event) {
		if (!active) return;
		counter++;
		if (counter === 1) {
			enterCallback(event);
		}
	}

	function leave(event) {
		if (!active) return;
		counter--;
		if (counter === 0) {
			leaveCallback(event);
		}
	}

	$: isHovering = counter > 0;

</script>

<!-- Only cancel dragstart events that originate on the drop zone itself.
	Draggable slotted children, such as item pile inventory rows, need their
	bubbling dragstart event to remain uncancelled so Foundry can start the
	item drag operation. -->
<div
	class={$$props.class}
	on:dragenter={enter}
	on:dragleave={leave}
	on:dragover={overCallback}
	on:dragstart|self|preventDefault
	on:drop|preventDefault={dropData}
	style={$$props.style}
>
	<slot/>
</div>
