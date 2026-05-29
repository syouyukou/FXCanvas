<script lang="ts">
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/tokens.css';
	import { initDefaultThumbnails } from '$lib/engine/effectThumbnails';

	let { children } = $props();

	onMount(() => {
		initDefaultThumbnails();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
