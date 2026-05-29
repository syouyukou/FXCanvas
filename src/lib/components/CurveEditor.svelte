<script lang="ts">
	import {
		type CurvePoint,
		type CurvesData,
		type CurveChannelId,
		CURVE_CHANNEL_COLORS,
		cloneCurvesData,
		defaultCurvesData,
		interpolateCurve
	} from '../engine/curve';

	interface Props {
		value?: CurvesData;
		applyMode?: number;
		onchange?: (data: CurvesData) => void;
		onApplyModeChange?: (mode: number) => void;
	}

	let {
		value = defaultCurvesData(),
		applyMode = 0,
		onchange,
		onApplyModeChange
	}: Props = $props();

	const APPLY_MODES = [
		{ value: 0, label: 'N' },
		{ value: 1, label: 'C' },
		{ value: 2, label: 'L' }
	] as const;

	const CHANNELS: { id: CurveChannelId; label: string }[] = [
		{ id: 'rgb', label: 'RGB curve' },
		{ id: 'r', label: 'Red channel' },
		{ id: 'g', label: 'Green channel' },
		{ id: 'b', label: 'Blue channel' }
	];

	let dragging = $state<{ channel: CurveChannelId; index: number } | null>(null);
	const PAD = 8;
	const SIZE = 120;

	function channelPoints(channel: CurveChannelId): CurvePoint[] {
		return value[channel];
	}

	function emit(data: CurvesData) {
		onchange?.(cloneCurvesData(data));
	}

	function setApplyMode(mode: number) {
		onApplyModeChange?.(mode);
	}

	function curvePath(channel: CurveChannelId): string {
		const pts = channelPoints(channel);
		const steps = 48;
		let d = '';
		for (let i = 0; i <= steps; i++) {
			const x = i / steps;
			const y = interpolateCurve(pts, x);
			const px = PAD + x * (SIZE - PAD * 2);
			const py = SIZE - PAD - y * (SIZE - PAD * 2);
			d += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`;
		}
		return d;
	}

	function toNorm(clientX: number, clientY: number, svg: SVGSVGElement): CurvePoint {
		const rect = svg.getBoundingClientRect();
		const x = (clientX - rect.left - PAD) / (SIZE - PAD * 2);
		const y = 1 - (clientY - rect.top - PAD) / (SIZE - PAD * 2);
		return { x: Math.min(1, Math.max(0, x)), y: Math.min(1, Math.max(0, y)) };
	}

	function onPointerDown(
		e: PointerEvent,
		channel: CurveChannelId,
		index: number,
		svg: SVGSVGElement
	) {
		e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		dragging = { channel, index };
		movePoint(e, svg);
	}

	function onPointerMove(e: PointerEvent, channel: CurveChannelId, svg: SVGSVGElement) {
		if (!dragging || dragging.channel !== channel) return;
		movePoint(e, svg);
	}

	function movePoint(e: PointerEvent, svg: SVGSVGElement) {
		if (!dragging) return;
		const { channel, index } = dragging;
		const norm = toNorm(e.clientX, e.clientY, svg);
		const next = cloneCurvesData(value);
		const pts = [...next[channel]];
		const isEndpoint = index === 0 || index === pts.length - 1;

		if (isEndpoint) {
			if (index === 0) {
				pts[0] = { x: 0, y: norm.y };
			} else {
				pts[pts.length - 1] = { x: 1, y: norm.y };
			}
		} else {
			const prevX = index > 0 ? pts[index - 1].x + 0.01 : 0;
			const nextX = index < pts.length - 1 ? pts[index + 1].x - 0.01 : 1;
			pts[index] = {
				x: Math.min(nextX, Math.max(prevX, norm.x)),
				y: norm.y
			};
		}
		next[channel] = pts;
		emit(next);
	}

	function onPointerUp() {
		dragging = null;
	}

	function onCurveClick(e: MouseEvent, channel: CurveChannelId, svg: SVGSVGElement) {
		if (dragging) return;
		const norm = toNorm(e.clientX, e.clientY, svg);
		const next = cloneCurvesData(value);
		const pts = [...next[channel]];
		if (pts.some((p) => Math.abs(p.x - norm.x) < 0.04)) return;
		pts.push({ x: norm.x, y: norm.y });
		pts.sort((a, b) => a.x - b.x);
		next[channel] = pts;
		emit(next);
	}

	function channelTint(channel: CurveChannelId): string {
		if (channel === 'rgb') return 'rgba(255,255,255,0.04)';
		const hex = CURVE_CHANNEL_COLORS[channel];
		return `${hex}14`;
	}
</script>

<div class="curves-editor">
	<div class="apply-mode">
		<span class="apply-label">apply mode</span>
		<div class="segment">
			{#each APPLY_MODES as mode}
				<button
					type="button"
					class:active={applyMode === mode.value}
					onclick={() => setApplyMode(mode.value)}
				>
					{mode.label}
				</button>
			{/each}
		</div>
	</div>

	{#each CHANNELS as ch}
		<div class="curve-block">
			<span class="curve-label">{ch.label}</span>
			<svg
				class="curve-svg"
				class:curve-svg--rgb={ch.id === 'rgb'}
				class:curve-svg--r={ch.id === 'r'}
				class:curve-svg--g={ch.id === 'g'}
				class:curve-svg--b={ch.id === 'b'}
				width={SIZE}
				height={SIZE}
				viewBox="0 0 {SIZE} {SIZE}"
				style:--curve-color={CURVE_CHANNEL_COLORS[ch.id]}
				style:--curve-tint={channelTint(ch.id)}
				onclick={(e) => onCurveClick(e, ch.id, e.currentTarget as SVGSVGElement)}
				onpointermove={(e) => onPointerMove(e, ch.id, e.currentTarget as SVGSVGElement)}
				onpointerup={onPointerUp}
				onpointerleave={onPointerUp}
				role="img"
				aria-label={ch.label}
			>
				<rect x={PAD} y={PAD} width={SIZE - PAD * 2} height={SIZE - PAD * 2} class="curve-bg" />
				{#each [0.33, 0.66] as g}
					<line
						x1={PAD}
						y1={PAD + g * (SIZE - PAD * 2)}
						x2={SIZE - PAD}
						y2={PAD + g * (SIZE - PAD * 2)}
						class="grid-line"
					/>
					<line
						x1={PAD + g * (SIZE - PAD * 2)}
						y1={PAD}
						x2={PAD + g * (SIZE - PAD * 2)}
						y2={SIZE - PAD}
						class="grid-line"
					/>
				{/each}
				<line
					x1={PAD}
					y1={SIZE - PAD}
					x2={SIZE - PAD}
					y2={PAD}
					class="diag-line"
				/>
				<path d={curvePath(ch.id)} class="curve-path" fill="none" />
				{#each channelPoints(ch.id) as pt, i}
					{@const px = PAD + pt.x * (SIZE - PAD * 2)}
					{@const py = SIZE - PAD - pt.y * (SIZE - PAD * 2)}
					<circle
						cx={px}
						cy={py}
						r="4"
						class="handle"
						onpointerdown={(e) =>
							onPointerDown(e, ch.id, i, e.currentTarget!.closest('svg') as SVGSVGElement)}
					/>
				{/each}
			</svg>
		</div>
	{/each}
</div>

<style>
	.curves-editor {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.apply-mode {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.apply-label {
		font-size: var(--text-panel-label);
		color: var(--text-faint);
		letter-spacing: 0.06em;
		text-transform: lowercase;
	}

	.segment {
		display: flex;
		gap: 0;
		background: var(--bg-inset);
		border-radius: var(--radius-sm);
		padding: 2px;
		width: fit-content;
	}

	.segment button {
		min-width: 32px;
		padding: 4px 10px;
		border: none;
		background: transparent;
		color: var(--text-faint);
		font-family: inherit;
		font-size: var(--text-panel-body);
		font-weight: 600;
		cursor: pointer;
		border-radius: 4px;
		transition: background 0.15s, color 0.15s;
	}

	.segment button.active {
		background: var(--text-primary);
		color: var(--bg-surface);
	}

	.segment button:hover:not(.active) {
		color: var(--text-secondary);
	}

	.curve-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.curve-label {
		font-size: var(--text-panel-label);
		color: var(--text-faint);
		letter-spacing: 0.04em;
	}

	.curve-svg {
		border-radius: var(--radius-sm);
		cursor: crosshair;
		touch-action: none;
	}

	.curve-bg {
		fill: var(--curve-tint);
	}

	.grid-line {
		stroke: rgba(255, 255, 255, 0.06);
		stroke-width: 1;
	}

	.diag-line {
		stroke: rgba(255, 255, 255, 0.08);
		stroke-width: 1;
	}

	.curve-path {
		stroke: var(--curve-color);
		stroke-width: 1.5;
	}

	.handle {
		fill: var(--curve-color);
		stroke: var(--bg-surface);
		stroke-width: 1.5;
		cursor: grab;
	}

	.handle:active {
		cursor: grabbing;
	}
</style>
