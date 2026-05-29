<script lang="ts">
	interface Props {
		x?: number;
		y?: number;
		minX?: number;
		maxX?: number;
		minY?: number;
		maxY?: number;
		onchange?: (x: number, y: number) => void;
	}

	let {
		x = 0.5,
		y = 0.5,
		minX = 0,
		maxX = 1,
		minY = -1,
		maxY = 1,
		onchange
	}: Props = $props();

	const SIZE = 100;
	const PAD = 6;

	let dragging = $state(false);

	function normToPx(nx: number, ny: number): { px: number; py: number } {
		const tx = (nx - minX) / (maxX - minX);
		const ty = (ny - minY) / (maxY - minY);
		return {
			px: PAD + tx * (SIZE - PAD * 2),
			py: SIZE - PAD - ty * (SIZE - PAD * 2)
		};
	}

	function pxToNorm(clientX: number, clientY: number, el: HTMLElement): { x: number; y: number } {
		const rect = el.getBoundingClientRect();
		const tx = (clientX - rect.left - PAD) / (SIZE - PAD * 2);
		const ty = 1 - (clientY - rect.top - PAD) / (SIZE - PAD * 2);
		return {
			x: minX + Math.min(1, Math.max(0, tx)) * (maxX - minX),
			y: minY + Math.min(1, Math.max(0, ty)) * (maxY - minY)
		};
	}

	function onPointerDown(e: PointerEvent) {
		e.preventDefault();
		dragging = true;
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		move(e);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		move(e);
	}

	function move(e: PointerEvent) {
		const pad = (e.currentTarget as HTMLElement).closest('.xy-pad') as HTMLElement;
		if (!pad) return;
		const { x: nx, y: ny } = pxToNorm(e.clientX, e.clientY, pad);
		onchange?.(nx, ny);
	}

	function onPointerUp() {
		dragging = false;
	}

	let dot = $derived(normToPx(x, y));

	function formatVal(v: number): string {
		return v.toFixed(2);
	}
</script>

<div class="xy-pad-wrap">
	<div class="xy-values">
		<span>{formatVal(x)}</span>
		<span>{formatVal(y)}</span>
	</div>
	<div
		class="xy-pad"
		style:width="{SIZE}px"
		style:height="{SIZE}px"
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointerleave={onPointerUp}
		role="slider"
		aria-label="XY position"
		tabindex="0"
	>
		<svg width={SIZE} height={SIZE} viewBox="0 0 {SIZE} {SIZE}">
			<rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2} class="pad-bg" />
			<line
				x1={PAD + (SIZE - PAD * 2) / 2}
				y1={PAD}
				x2={PAD + (SIZE - PAD * 2) / 2}
				y2={SIZE - PAD}
				class="crosshair"
			/>
			<line
				x1={PAD}
				y1={PAD + (SIZE - PAD * 2) / 2}
				x2={SIZE - PAD}
				y2={PAD + (SIZE - PAD * 2) / 2}
				class="crosshair"
			/>
			<circle cx={dot.px} cy={dot.py} r="4" class="dot" />
		</svg>
	</div>
</div>

<style>
	.xy-pad-wrap {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.xy-values {
		display: flex;
		justify-content: space-between;
		font-size: var(--text-panel-label);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.xy-pad {
		cursor: crosshair;
		touch-action: none;
		border-radius: var(--radius-sm);
	}

	.pad-bg {
		fill: var(--bg-inset);
		stroke: var(--border-default);
		stroke-width: 1;
	}

	.crosshair {
		stroke: rgba(255, 255, 255, 0.08);
		stroke-width: 1;
	}

	.dot {
		fill: var(--text-primary);
		stroke: var(--bg-surface);
		stroke-width: 1.5;
	}
</style>
