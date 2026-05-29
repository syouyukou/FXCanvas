<script lang="ts">
	interface Props {
		effectId: string;
		size?: number;
	}

	let { effectId, size = 18 }: Props = $props();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.6"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#if effectId === 'curves'}
		<rect x="3" y="3" width="18" height="18" rx="1" opacity="0.35" />
		<path d="M5 18 C 9 18, 11 8, 19 6" />
	{:else if effectId === 'levels'}
		<rect x="4" y="14" width="3" height="6" rx="0.5" fill="currentColor" stroke="none" />
		<rect x="10.5" y="9" width="3" height="11" rx="0.5" fill="currentColor" stroke="none" />
		<rect x="17" y="5" width="3" height="15" rx="0.5" fill="currentColor" stroke="none" />
	{:else if effectId === 'exposure'}
		<circle cx="12" cy="12" r="4" />
		<path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
	{:else if effectId === 'motion_blur'}
		<circle cx="8" cy="12" r="2.5" opacity="0.45" />
		<path d="M11 12h10M15 10l4 2-4 2" />
	{:else if effectId === 'sharpen'}
		<path d="M12 3l2.2 6.8H21l-5.5 4 2.1 6.7L12 16.5 6.4 20.5l2.1-6.7L3 9.8h6.8L12 3z" />
	{:else if effectId === 'gaussian_blur'}
		<circle cx="12" cy="12" r="6" opacity="0.35" />
		<circle cx="12" cy="12" r="3" />
	{:else if effectId === 'gradient_map'}
		<rect x="3" y="3" width="18" height="18" rx="1" opacity="0.35" />
		<path d="M5 18 L12 12 L19 6" stroke-width="2" />
		<circle cx="5" cy="18" r="1.5" fill="#e74c3c" stroke="none" />
		<circle cx="12" cy="12" r="1.5" fill="#888" stroke="none" />
		<circle cx="19" cy="6" r="1.5" fill="#3498db" stroke="none" />
	{:else if effectId === 'brightness_contrast'}
		<circle cx="12" cy="12" r="7" />
		<path d="M12 5v14" />
		<path d="M12 5a7 7 0 0 1 0 14" fill="currentColor" stroke="none" opacity="0.35" />
	{:else}
		<rect x="5" y="5" width="14" height="14" rx="2" />
		<path d="M9 12h6M12 9v6" />
	{/if}
</svg>
