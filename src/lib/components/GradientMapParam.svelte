<script lang="ts">
	import type { GradientStop } from '../engine/gradient';

	let {
		stops = $bindable<GradientStop[]>(),
		onchange
	}: {
		stops: GradientStop[];
		onchange?: (stops: GradientStop[]) => void;
	} = $props();

	let barEl: HTMLDivElement;
	let dragging = $state<number | null>(null);

	const barStyle = $derived(
		`linear-gradient(90deg, ${[...stops]
			.sort((a, b) => a.pos - b.pos)
			.map((s) => `${s.color} ${s.pos * 100}%`)
			.join(', ')})`
	);

	function emit(next: GradientStop[]) {
		stops = next;
		onchange?.(next);
	}

	function updateStop(index: number, patch: Partial<GradientStop>) {
		const next = stops.map((s, i) => (i === index ? { ...s, ...patch } : { ...s }));
		emit(next);
	}

	function posFromEvent(e: PointerEvent): number {
		if (!barEl) return 0;
		const r = barEl.getBoundingClientRect();
		return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
	}

	function onBarPointerDown(index: number, e: PointerEvent) {
		dragging = index;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		updateStop(index, { pos: posFromEvent(e) });
	}

	function onBarPointerMove(e: PointerEvent) {
		if (dragging === null) return;
		updateStop(dragging, { pos: posFromEvent(e) });
	}

	function onBarPointerUp() {
		dragging = null;
	}
</script>

<div class="gradient-param">
	<div
		class="grad-bar"
		bind:this={barEl}
		style="background: {barStyle}"
		role="presentation"
	>
		{#each stops as stop, i}
			<button
				type="button"
				class="grad-stop"
				class:active={dragging === i}
				style="left: {stop.pos * 100}%"
				title="Drag to move · click swatch to change color"
				onpointerdown={(e) => onBarPointerDown(i, e)}
				onpointermove={onBarPointerMove}
				onpointerup={onBarPointerUp}
				onpointercancel={onBarPointerUp}
			>
				<input
					type="color"
					class="grad-color"
					value={stop.color}
					onclick={(e) => e.stopPropagation()}
					oninput={(e) =>
						updateStop(i, { color: (e.target as HTMLInputElement).value })}
				/>
			</button>
		{/each}
	</div>
</div>

<style>
	.gradient-param {
		width: 100%;
	}

	.grad-bar {
		position: relative;
		height: 22px;
		border-radius: 4px;
		border: 1px solid #333;
		overflow: visible;
	}

	.grad-stop {
		position: absolute;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 14px;
		height: 22px;
		padding: 0;
		border: 2px solid #fff;
		border-radius: 3px;
		background: transparent;
		cursor: ew-resize;
		box-shadow: 0 0 0 1px #0006;
	}

	.grad-stop.active {
		border-color: #fff;
		box-shadow: 0 0 0 2px #888;
	}

	.grad-color {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		opacity: 0;
		cursor: pointer;
		border: none;
		padding: 0;
	}
</style>
