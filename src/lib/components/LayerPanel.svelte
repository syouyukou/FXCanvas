<script lang="ts">
	import {
		appliedEffects,
		activeLayerIndex,
		removeEffect,
		duplicateEffect,
		toggleEffect,
		updateParam,
		beginParamEdit,
		applyParams,
		updateLayerOpacity,
		clearEffects,
		moveEffect,
		randomizeParams,
		resetParams
	} from '../stores/editor';
	import type { EffectParam } from '../engine/renderer';
	import type { GradientStop } from '../engine/gradient';
	import {
		DITHER_PRESETS,
		DITHER_PALETTE_ZH,
		DITHER_PATTERN_ZH
	} from '../effects/dither';
	import GradientMapParam from './GradientMapParam.svelte';

	let active = $derived(
		$activeLayerIndex >= 0 ? $appliedEffects[$activeLayerIndex] : null
	);

	let draggingIndex = $state<number | null>(null);

	function formatParamValue(
		param: EffectParam,
		value: unknown,
		effectId?: string
	): string {
		if (param.type === 'gradient') return '';
		if (param.type === 'bool') return value ? 'ON' : 'OFF';
		if (param.type === 'color') return String(value ?? param.default).toUpperCase();
		if (param.type === 'enum') {
			const opt = param.options?.find((o) => o.value === value);
			return opt?.label ?? String(value);
		}
		const n = Number(value ?? param.default);
		if (effectId === 'dither' && param.name === 'pattern') {
			return DITHER_PATTERN_ZH[n] ?? String(n);
		}
		if (effectId === 'dither' && param.name === 'palette') {
			return DITHER_PALETTE_ZH[n] ?? String(n);
		}
		if (effectId === 'dither' && param.name === 'distance') {
			return n < 0.5 ? 'RGB' : '自然';
		}
		const decimals = param.step && param.step < 0.1 ? 3 : param.step && param.step < 1 ? 2 : param.type === 'int' ? 0 : 1;
		return n.toFixed(decimals);
	}

	function applyDitherPreset(params: (typeof DITHER_PRESETS)[number]['params']) {
		applyParams($activeLayerIndex, params);
	}

	function matchesDitherPreset(
		current: Record<string, unknown>,
		preset: (typeof DITHER_PRESETS)[number]['params']
	): boolean {
		return (Object.keys(preset) as (keyof typeof preset)[]).every((key) => current[key] === preset[key]);
	}

	function onLayerKeyDown(e: KeyboardEvent, i: number) {
		if (e.key === 'Enter') {
			activeLayerIndex.set(i);
			return;
		}
		if ((e.key === 'Delete' || e.key === 'Backspace') && i === $activeLayerIndex) {
			e.preventDefault();
			removeEffect(i);
		}
	}

	function onDragStart(i: number, e: DragEvent) {
		draggingIndex = i;
		e.dataTransfer!.effectAllowed = 'move';
	}
	function onDragOver(i: number, e: DragEvent) {
		e.preventDefault();
		e.dataTransfer!.dropEffect = 'move';
	}
	function onDrop(i: number, e: DragEvent) {
		e.preventDefault();
		if (draggingIndex !== null && draggingIndex !== i) {
			moveEffect(draggingIndex, i);
			activeLayerIndex.set(i);
		}
		draggingIndex = null;
	}
	function onDragEnd() { draggingIndex = null; }
</script>

<aside class="layer-panel">
	<!-- Layers header -->
	<div class="panel-header">
		<span>LAYERS</span>
		{#if $appliedEffects.length > 0}
			<button class="clear-btn" onclick={clearEffects}>CLEAR ALL</button>
		{/if}
	</div>

	<div class="layers-list">
		{#if $appliedEffects.length === 0}
			<p class="empty">No effects applied.<br />Click an effect to add it.</p>
		{/if}

		{#each $appliedEffects as item, i}
			<div
				class="layer-row"
				class:selected={i === $activeLayerIndex}
				class:hidden-layer={!item.effect.enabled}
				class:dragging={draggingIndex === i}
				onclick={() => activeLayerIndex.set(i)}
				role="button"
				tabindex="0"
				onkeydown={(e) => onLayerKeyDown(e, i)}
				ondragover={(e) => onDragOver(i, e)}
				ondrop={(e) => onDrop(i, e)}
			>
				<span
					class="drag-dot"
					draggable="true"
					ondragstart={(e) => { e.stopPropagation(); onDragStart(i, e); }}
					ondragend={onDragEnd}
					role="img"
					aria-label="drag"
				>⠿</span>

				<span class="layer-name">{item.effect.name.toUpperCase()}</span>

				<div class="layer-actions">
					<button
						class="icon-btn"
						title="Duplicate"
						onclick={(e) => { e.stopPropagation(); duplicateEffect(i); }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<rect x="9" y="9" width="13" height="13" rx="2"/>
							<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
						</svg>
					</button>

					<!-- Delete -->
					<button
						class="icon-btn delete"
						title="Delete"
						onclick={(e) => { e.stopPropagation(); removeEffect(i); }}
					>
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
							<polyline points="3 6 5 6 21 6"/>
							<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
							<path d="M10 11v6M14 11v6"/>
							<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
						</svg>
					</button>

					<!-- Eye toggle -->
					<button
						class="icon-btn eye"
						class:eye-off={!item.effect.enabled}
						title={item.effect.enabled ? 'Hide' : 'Show'}
						onclick={(e) => { e.stopPropagation(); toggleEffect(i); }}
					>
						{#if item.effect.enabled}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
								<circle cx="12" cy="12" r="3"/>
							</svg>
						{:else}
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
								<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
								<path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
								<line x1="1" y1="1" x2="23" y2="23"/>
							</svg>
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>

	<!-- Configure panel -->
	{#if active}
		<div class="configure-area">
		<div class="panel-header configure-label">
			<div class="controls-title">
				<span>CONTROLS</span>
				<span class="controls-effect">{active.effect.name.toUpperCase()}</span>
			</div>
			<div class="config-actions">
				<button class="cfg-btn" title="Randomize" onclick={() => randomizeParams($activeLayerIndex)}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
						<polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
					</svg>
				</button>
				<button class="cfg-btn" title="Reset" onclick={() => resetParams($activeLayerIndex)}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
						<polyline points="3 3 3 8 8 8"/>
					</svg>
				</button>
			</div>
		</div>
		{#if active.effect.id === 'dither'}
			<div class="preset-section">
				<span class="preset-label">一鍵風格</span>
				<div class="preset-grid">
					{#each DITHER_PRESETS as preset (preset.id)}
						<button
							class="preset-btn"
							class:active={matchesDitherPreset(active.params, preset.params)}
							title="套用 {preset.label} 參數"
							onclick={() => applyDitherPreset(preset.params)}
						>
							{preset.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		<div class="layer-opacity">
			<div class="param-meta">
				<span class="param-label">OPACITY</span>
				<span class="param-value">{Math.round((active.opacity ?? 1) * 100)}%</span>
			</div>
			<input
				type="range"
				class="opacity-slider"
				min="0"
				max="1"
				step="0.01"
				value={active.opacity ?? 1}
				onpointerdown={beginParamEdit}
				oninput={(e) =>
					updateLayerOpacity($activeLayerIndex, parseFloat((e.target as HTMLInputElement).value))}
			/>
		</div>
		<div class="params-list">
			{#each active.effect.params as param}
				<div class="param-row" title={param.hint ?? ''}>
					<div class="param-meta">
						<span class="param-label">{param.label.toUpperCase()}</span>
						{#if param.type !== 'gradient'}
							<span class="param-value">
								{formatParamValue(param, active.params[param.name], active.effect.id)}
							</span>
						{/if}
					</div>
					{#if param.hint}
						<p class="param-hint">{param.hint}</p>
					{/if}
					{#if param.type === 'gradient'}
						<GradientMapParam
							stops={(active.params[param.name] ?? param.default) as GradientStop[]}
							onchange={(stops) => updateParam($activeLayerIndex, param.name, stops)}
						/>
					{:else if param.type === 'bool'}
						<button
							class="toggle-pill"
							class:on={active.params[param.name]}
							onclick={() => {
								beginParamEdit();
								updateParam($activeLayerIndex, param.name, !active.params[param.name]);
							}}
						>
							{active.params[param.name] ? 'ON' : 'OFF'}
						</button>
					{:else if param.type === 'enum' && param.options}
						<select
							class="param-select"
							value={active.params[param.name] ?? param.default}
							onchange={(e) => {
								beginParamEdit();
								updateParam(
									$activeLayerIndex,
									param.name,
									parseInt((e.target as HTMLSelectElement).value, 10)
								);
							}}
						>
							{#each param.options as opt}
								<option value={opt.value}>{opt.label}</option>
							{/each}
						</select>
					{:else if param.type === 'color'}
						<div class="color-row">
							<input
								type="color"
								class="color-input"
								value={active.params[param.name] ?? param.default}
								onpointerdown={beginParamEdit}
								oninput={(e) =>
									updateParam($activeLayerIndex, param.name, (e.target as HTMLInputElement).value)}
							/>
							<span class="color-hex">{formatParamValue(param, active.params[param.name])}</span>
						</div>
					{:else}
						<input
							type="range"
							min={param.min}
							max={param.max}
							step={param.step ?? (param.type === 'int' ? 1 : 0.01)}
							value={active.params[param.name] ?? param.default}
							onpointerdown={beginParamEdit}
							oninput={(e) => {
								const raw = (e.target as HTMLInputElement).value;
								updateParam(
									$activeLayerIndex,
									param.name,
									param.type === 'int' ? parseInt(raw, 10) : parseFloat(raw)
								);
							}}
						/>
					{/if}
				</div>
			{/each}
		</div>
		</div>
	{:else if $appliedEffects.length > 0}
		<div class="hint">Click a layer to configure</div>
	{/if}
</aside>

<style>
	.layer-panel {
		width: 260px;
		min-width: 220px;
		background: #161616;
		border-left: 1px solid #222;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: 'SF Mono', 'Fira Code', monospace;
	}

	/* ── Header ── */
	.panel-header {
		padding: 10px 14px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #444;
		border-bottom: 1px solid #222;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.configure-label {
		color: #888;
		border-top: 1px solid #222;
	}

	.controls-title {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.controls-effect {
		font-size: 9px;
		color: #555;
		letter-spacing: 0.1em;
	}

	.config-actions {
		display: flex;
		gap: 2px;
	}

	.cfg-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 3px;
		border-radius: 3px;
		color: #444;
		display: flex;
		align-items: center;
		transition: color 0.15s, background 0.15s;
	}
	.cfg-btn:hover { color: #aaa; background: #2a2a2a; }

	.clear-btn {
		background: none;
		border: none;
		color: #3a3a3a;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		font-family: inherit;
		transition: color 0.15s;
	}
	.clear-btn:hover { color: #c44; }

	/* ── Layer rows ── */
	.layers-list {
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		overflow-x: hidden;
		flex: 0 1 auto;
		min-height: 0;
		max-height: min(240px, 32vh);
		position: relative;
		z-index: 1;
	}

	.empty {
		color: #333;
		font-size: 11px;
		text-align: center;
		padding: 20px 12px;
		line-height: 1.7;
		letter-spacing: 0.05em;
		font-family: inherit;
	}

	.layer-row {
		display: flex;
		align-items: center;
		padding: 10px 14px;
		border-bottom: 1px solid #1e1e1e;
		cursor: pointer;
		transition: background 0.1s;
		gap: 8px;
		min-height: 42px;
		flex-shrink: 0;
	}
	.layer-row:hover { background: #1e1e1e; }
	.layer-row.selected { background: #1e1e1e; }
	.layer-row.dragging { opacity: 0.4; }

	.drag-dot {
		color: #2a2a2a;
		font-size: 13px;
		cursor: grab;
		flex-shrink: 0;
		transition: color 0.15s;
		line-height: 1;
	}
	.layer-row:hover .drag-dot { color: #444; }

	.layer-name {
		flex: 1;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #ccc;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color 0.15s;
	}

	.hidden-layer .layer-name { color: #3a3a3a; }

	/* ── Action buttons ── */
	.layer-actions {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.configure-area {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #161616;
		position: relative;
		z-index: 2;
	}

	.icon-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		color: #555;
		transition: color 0.15s, background 0.15s;
	}
	.icon-btn:hover { background: #2a2a2a; }
	.icon-btn.delete:hover { color: #c44; }
	.icon-btn.eye { color: #666; }
	.icon-btn.eye:hover { color: #bbb; }
	.icon-btn.eye-off { color: #3a3a3a; opacity: 1; }

	/* ── Configure ── */
	.layer-opacity {
		padding: 12px 14px 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
		flex-shrink: 0;
		border-top: 1px solid #222;
	}

	.opacity-slider {
		width: 100%;
		accent-color: #fff;
		cursor: pointer;
		height: 2px;
	}

	.params-list {
		flex: 1;
		overflow-y: auto;
		padding: 12px 14px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.preset-section {
		padding: 10px 14px 0;
		border-top: 1px solid #222;
		flex-shrink: 0;
	}

	.preset-label {
		display: block;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #555;
		margin-bottom: 8px;
	}

	.preset-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		margin-bottom: 4px;
	}

	.preset-btn {
		background: #1e1e1e;
		border: 1px solid #333;
		border-radius: 4px;
		color: #aaa;
		font-size: 10px;
		font-family: inherit;
		padding: 5px 8px;
		cursor: pointer;
		transition: all 0.15s;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
	}

	.preset-btn:hover {
		background: #2a2a2a;
		border-color: #555;
		color: #fff;
	}

	.preset-btn.active {
		background: #2a2a2a;
		border-color: #888;
		color: #fff;
	}

	.param-row { display: flex; flex-direction: column; gap: 6px; }

	.param-hint {
		font-size: 10px;
		line-height: 1.45;
		color: #444;
		margin: -2px 0 0;
	}

	.param-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.param-label {
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #555;
	}

	.param-value {
		font-size: 10px;
		color: #555;
		font-variant-numeric: tabular-nums;
	}

	input[type='range'] {
		width: 100%;
		accent-color: #fff;
		cursor: pointer;
		height: 2px;
	}

	.toggle-pill {
		background: #1e1e1e;
		border: 1px solid #333;
		border-radius: 4px;
		padding: 4px 12px;
		font-size: 9px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #555;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s;
	}
	.toggle-pill.on { background: #fff; color: #000; border-color: #fff; }

	.param-select {
		width: 100%;
		background: #1e1e1e;
		border: 1px solid #333;
		border-radius: 4px;
		color: #bbb;
		font-size: 10px;
		font-family: inherit;
		padding: 6px 8px;
		cursor: pointer;
	}

	.color-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.color-input {
		width: 32px;
		height: 24px;
		padding: 0;
		border: 1px solid #333;
		border-radius: 4px;
		background: none;
		cursor: pointer;
	}

	.color-hex {
		font-size: 10px;
		color: #555;
		letter-spacing: 0.05em;
	}

	.hint {
		color: #2e2e2e;
		font-size: 10px;
		letter-spacing: 0.1em;
		text-align: center;
		padding: 16px;
	}

	.layers-list::-webkit-scrollbar,
	.params-list::-webkit-scrollbar { width: 3px; }
	.layers-list::-webkit-scrollbar-thumb,
	.params-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
</style>
