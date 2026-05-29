<script lang="ts">
	import {
		appliedEffects,
		activeLayerIndex,
		updateParam,
		beginParamEdit,
		applyParams,
		updateLayerOpacity,
		updateLayerBlendMode,
		randomizeParams,
		resetParams
	} from '../stores/editor';
	import type { BlendMode } from '../engine/renderer';
	import type { EffectParam } from '../engine/renderer';
	import type { GradientStop } from '../engine/gradient';
	import { DITHER_PRESETS } from '../effects/dither';
	import { GLITCH_DIGITAL_PRESETS, GLITCH_VHS_PRESETS } from '../effects/glitch';
	import GradientMapParam from './GradientMapParam.svelte';
	import CurveEditor from './CurveEditor.svelte';
	import XYPad from './XYPad.svelte';
	import type { CurvesData } from '../engine/curve';
	import { i18n } from '$lib/i18n';
	import { animation } from '../stores/animation';
	import { hasKeyframeAt, toggleActiveParamKeyframe, OPACITY_PARAM } from '../stores/keyframes';
	import { isKeyframeableParam, resolveLayerId } from '../engine/keyframeEngine';

	let { variant = 'sidebar' }: { variant?: 'sidebar' | 'corner' } = $props();

	const BLEND_MODES: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'];

	let active = $derived(
		$activeLayerIndex >= 0 ? $appliedEffects[$activeLayerIndex] : null
	);

	function formatParamValue(
		param: EffectParam,
		value: unknown,
		effectId?: string
	): string {
		if (param.type === 'gradient') return '';
		if (param.type === 'bool') return value ? $i18n.t('layers.on') : $i18n.t('layers.off');
		if (param.type === 'color') return String(value ?? param.default).toUpperCase();
		if (param.type === 'enum') {
			const opt = param.options?.find((o) => o.value === value);
			return opt?.label ?? String(value);
		}
		const n = Number(value ?? param.default);
		if (effectId === 'dither' && param.name === 'pattern') {
			return $i18n.ditherPatternLabel(n, String(n));
		}
		if (effectId === 'dither' && param.name === 'palette') {
			return $i18n.ditherPaletteLabel(n, String(n));
		}
		if (effectId === 'dither' && param.name === 'distance') {
			return $i18n.ditherDistanceLabel(n);
		}
		const decimals = param.step && param.step < 0.1 ? 3 : param.step && param.step < 1 ? 2 : param.type === 'int' ? 0 : 1;
		return n.toFixed(decimals);
	}

	function applyDitherPreset(params: (typeof DITHER_PRESETS)[number]['params']) {
		applyParams($activeLayerIndex, params);
	}

	function applyGlitchPreset(params: Record<string, number>) {
		applyParams($activeLayerIndex, params);
	}

	function matchesPreset(
		current: Record<string, unknown>,
		preset: Record<string, number>
	): boolean {
		return Object.keys(preset).every((key) => current[key] === preset[key]);
	}

	function matchesDitherPreset(
		current: Record<string, unknown>,
		preset: (typeof DITHER_PRESETS)[number]['params']
	): boolean {
		return (Object.keys(preset) as (keyof typeof preset)[]).every((key) => current[key] === preset[key]);
	}

	function paramHasKeyframe(paramName: string): boolean {
		if ($activeLayerIndex < 0) return false;
		const item = $appliedEffects[$activeLayerIndex];
		if (!item) return false;
		const layerId = resolveLayerId(item, $activeLayerIndex);
		return hasKeyframeAt(layerId, paramName, $animation.currentTime);
	}

	function toggleParamKeyframe(paramName: string) {
		toggleActiveParamKeyframe($animation.currentTime, paramName);
	}
</script>

{#if active}
	<div class="controls-panel" class:controls-panel--corner={variant === 'corner'} class:controls-panel--sidebar={variant === 'sidebar'}>
		<div class="configure-area">
		<div class="panel-header configure-label">
			<div class="controls-title">
				<span>{$i18n.t('layers.controls')}</span>
				<span class="controls-effect"
					>{$i18n.effectName(active.effect.id, active.effect.name).toUpperCase()}</span
				>
			</div>
			<div class="config-actions">
				<button class="cfg-btn" title={$i18n.t('layers.randomize')} onclick={() => randomizeParams($activeLayerIndex)}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
						<polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
					</svg>
				</button>
				<button class="cfg-btn" title={$i18n.t('layers.reset')} onclick={() => resetParams($activeLayerIndex)}>
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
						<polyline points="3 3 3 8 8 8"/>
					</svg>
				</button>
			</div>
		</div>
		{#if active.effect.id === 'dither'}
			<div class="preset-section">
				<span class="preset-label">{$i18n.t('layers.oneClickStyle')}</span>
				<div class="preset-grid">
					{#each DITHER_PRESETS as preset (preset.id)}
						<button
							class="preset-btn"
							class:active={matchesDitherPreset(active.params, preset.params)}
							title={$i18n.t('layers.applyDitherPreset', {
								label: $i18n.ditherPresetLabel(preset.id, preset.label)
							})}
							onclick={() => applyDitherPreset(preset.params)}
						>
							{$i18n.ditherPresetLabel(preset.id, preset.label)}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		{#if active.effect.id === 'glitch_digital'}
			<div class="preset-section">
				<span class="preset-label">{$i18n.t('layers.oneClickStyle')}</span>
				<div class="preset-grid">
					{#each GLITCH_DIGITAL_PRESETS as preset (preset.id)}
						<button
							class="preset-btn"
							class:active={matchesPreset(active.params, preset.params)}
							title={$i18n.t('layers.applyGlitchPreset', {
								label: $i18n.glitchDigitalPresetLabel(preset.id, preset.label)
							})}
							onclick={() => applyGlitchPreset(preset.params)}
						>
							{$i18n.glitchDigitalPresetLabel(preset.id, preset.label)}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		{#if active.effect.id === 'glitch_vhs'}
			<div class="preset-section">
				<span class="preset-label">{$i18n.t('layers.oneClickStyle')}</span>
				<div class="preset-grid">
					{#each GLITCH_VHS_PRESETS as preset (preset.id)}
						<button
							class="preset-btn"
							class:active={matchesPreset(active.params, preset.params)}
							title={$i18n.t('layers.applyGlitchPreset', {
								label: $i18n.glitchVhsPresetLabel(preset.id, preset.label)
							})}
							onclick={() => applyGlitchPreset(preset.params)}
						>
							{$i18n.glitchVhsPresetLabel(preset.id, preset.label)}
						</button>
					{/each}
				</div>
			</div>
		{/if}
		<div class="layer-opacity">
			<div class="param-meta">
				<span class="param-label">{$i18n.t('layers.opacity')}</span>
				<div class="param-meta-right">
					<button
						type="button"
						class="kf-btn"
						class:active={paramHasKeyframe(OPACITY_PARAM)}
						title={$i18n.t('timeline.toggleKeyframe')}
						onclick={() => toggleParamKeyframe(OPACITY_PARAM)}
					>◆</button>
					<span class="param-value">{Math.round((active.opacity ?? 1) * 100)}%</span>
				</div>
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
		<div class="layer-blend">
			<div class="param-meta">
				<span class="param-label">{$i18n.t('layers.blendMode')}</span>
			</div>
			<select
				class="param-select"
				value={active.blendMode ?? 'normal'}
				onchange={(e) => {
					beginParamEdit();
					updateLayerBlendMode(
						$activeLayerIndex,
						(e.target as HTMLSelectElement).value as BlendMode
					);
				}}
			>
				{#each BLEND_MODES as mode}
					<option value={mode}>{$i18n.t(`layers.blendModes.${mode}`)}</option>
				{/each}
			</select>
		</div>
		<div class="params-list">
			{#each active.effect.params as param}
				{#if active.effect.id === 'curves' && param.name === 'apply_mode'}
					<!-- rendered inside CurveEditor -->
				{:else}
				<div
					class="param-row"
					class:param-row--curve={param.type === 'curve'}
					title={$i18n.paramHint(active.effect.id, param.name) ?? param.hint ?? ''}
				>
					{#if param.type !== 'curve'}
					<div class="param-meta">
						<span class="param-label"
							>{$i18n.paramLabel(active.effect.id, param.name, param.label).toUpperCase()}</span
						>
						<div class="param-meta-right">
							{#if isKeyframeableParam(param)}
								<button
									type="button"
									class="kf-btn"
									class:active={paramHasKeyframe(param.name)}
									title={$i18n.t('timeline.toggleKeyframe')}
									onclick={() => toggleParamKeyframe(param.name)}
								>◆</button>
							{/if}
							{#if param.type !== 'gradient' && param.type !== 'vec2'}
								<span class="param-value">
									{formatParamValue(param, active.params[param.name], active.effect.id)}
								</span>
							{/if}
						</div>
					</div>
					{/if}
					{#if param.type === 'curve'}
						<CurveEditor
							value={(active.params[param.name] ?? param.default) as CurvesData}
							applyMode={Number(active.params.apply_mode ?? 0)}
							onchange={(data) => {
								beginParamEdit();
								updateParam($activeLayerIndex, param.name, data);
							}}
							onApplyModeChange={(mode) => {
								beginParamEdit();
								updateParam($activeLayerIndex, 'apply_mode', mode);
							}}
						/>
					{:else if param.type === 'gradient'}
						<GradientMapParam
							stops={(active.params[param.name] ?? param.default) as GradientStop[]}
							onchange={(stops) => updateParam($activeLayerIndex, param.name, stops)}
						/>
					{:else if param.type === 'segment' && param.options}
						<div class="segment-row">
							{#each param.options as opt}
								<button
									type="button"
									class="segment-btn"
									class:active={(active.params[param.name] ?? param.default) === opt.value}
									onclick={() => {
										beginParamEdit();
										updateParam($activeLayerIndex, param.name, opt.value);
									}}
								>
									{opt.label}
								</button>
							{/each}
						</div>
					{:else if param.type === 'vec2'}
						{@const vec = (active.params[param.name] ?? param.default) as [number, number]}
						<XYPad
							x={vec[0]}
							y={vec[1]}
							minX={param.min ?? 0}
							maxX={param.max ?? 1}
							minY={param.min ?? 0}
							maxY={param.max ?? 1}
							onchange={(x, y) => {
								beginParamEdit();
								updateParam($activeLayerIndex, param.name, [x, y]);
							}}
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
							{active.params[param.name] ? $i18n.t('layers.on') : $i18n.t('layers.off')}
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
				{/if}
			{/each}
		</div>
		</div>
	</div>
{/if}

<style>
	.controls-panel {
		font-family: var(--font-mono);
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	.controls-panel--sidebar {
		flex: 1;
		overflow: hidden;
		background: #161616;
		position: relative;
		z-index: 2;
	}
	.controls-panel--corner {
		position: absolute;
		right: var(--space-3);
		bottom: var(--space-3);
		width: min(320px, calc(100% - var(--space-6)));
		max-height: min(45vh, 480px);
		z-index: 20;
		border: 1px solid var(--border-panel);
		border-radius: var(--radius-md);
		background: var(--bg-surface);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
		overflow: hidden;
		pointer-events: auto;
	}

	.controls-panel--corner .configure-area {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		background: #161616;
	}
	.configure-label {
		color: var(--accent);
		border-top: 1px solid var(--border-panel);
	}

	.controls-title {
		display: flex;
		flex-direction: column;
		gap: var(--panel-gap-tight);
	}

	.controls-effect {
		font-size: var(--text-panel-body);
		color: var(--text-muted);
		letter-spacing: 0.06em;
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
	.cfg-btn:hover,
	.cfg-btn:focus-visible {
		color: var(--accent);
		background: var(--border-subtle);
	}

	.clear-btn {
		background: none;
		border: none;
		color: var(--text-faint);
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		font-family: inherit;
		transition: color var(--transition-fast);
	}

	.clear-btn:hover,
	.clear-btn:focus-visible {
		color: var(--text-danger);
	}

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
		color: var(--text-faint);
		font-size: var(--text-panel-body);
		text-align: center;
		padding: var(--space-4) var(--panel-padding-x);
		line-height: 1.5;
		letter-spacing: 0.04em;
		font-family: inherit;
	}

	.layer-row {
		display: flex;
		align-items: center;
		padding: 6px var(--panel-padding-x);
		border-bottom: 1px solid var(--bg-muted);
		cursor: pointer;
		transition: background var(--transition-fast);
		gap: 6px;
		min-height: var(--panel-row-height);
		flex-shrink: 0;
	}
	.layer-row:hover,
	.layer-row:focus-visible {
		background: var(--bg-muted);
	}
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
		font-size: var(--text-panel-body);
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-body);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		transition: color var(--transition-fast);
	}

	.hidden-layer .layer-name { color: #3a3a3a; }

	.group-block {
		border-bottom: 1px solid #1e1e1e;
	}

	.group-header {
		display: flex;
		align-items: center;
		padding: 6px var(--panel-padding-x) 6px var(--space-2);
		gap: 6px;
		cursor: default;
		background: #121212;
		min-height: var(--panel-row-height);
	}

	.group-header.selected { background: #1e1e1e; }

	.group-name {
		cursor: pointer;
		color: #e8e8e8;
	}

	.chevron-btn {
		background: none;
		border: none;
		padding: 2px 4px;
		cursor: pointer;
		color: #666;
		display: flex;
		align-items: center;
		flex-shrink: 0;
	}

	.chevron-btn:hover { color: #aaa; }

	.chevron-btn svg {
		transition: transform 0.15s;
	}

	.chevron-btn svg.collapsed {
		transform: rotate(-90deg);
	}

	.layer-row.nested {
		padding-left: 8px;
		background: #0e0e0e;
	}

	.tree-gutter {
		position: relative;
		width: 18px;
		flex-shrink: 0;
		align-self: stretch;
		min-height: var(--panel-row-height);
	}

	.tree-line-v {
		position: absolute;
		left: 8px;
		top: 0;
		bottom: 0;
		width: 0;
		border-left: 1px dashed #333;
	}

	.tree-line-v.tree-last {
		bottom: 50%;
	}

	.tree-line-h {
		position: absolute;
		left: 8px;
		top: 50%;
		width: 10px;
		height: 0;
		border-top: 1px dashed #333;
	}

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
		padding: var(--panel-padding-y) var(--panel-padding-x) 0;
		display: flex;
		flex-direction: column;
		gap: var(--panel-gap-tight);
		flex-shrink: 0;
		border-top: 1px solid var(--border-panel);
	}

	.layer-blend {
		padding: var(--panel-padding-y) var(--panel-padding-x) 0;
		display: flex;
		flex-direction: column;
		gap: var(--panel-gap-tight);
		flex-shrink: 0;
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
		padding: var(--panel-padding-y) var(--panel-padding-x);
		display: flex;
		flex-direction: column;
		gap: var(--panel-gap);
	}

	.preset-section {
		padding: var(--panel-padding-y) var(--panel-padding-x) 0;
		border-top: 1px solid var(--border-panel);
		flex-shrink: 0;
	}

	.preset-label {
		display: block;
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-muted);
		margin-bottom: 6px;
	}

	.preset-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 6px;
		margin-bottom: 4px;
	}

	.preset-btn {
		background: var(--bg-muted);
		border: 1px solid var(--border-default);
		border-radius: 4px;
		color: var(--accent);
		font-size: var(--text-panel-label);
		font-family: inherit;
		padding: 4px 6px;
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-align: center;
	}

	.preset-btn:hover,
	.preset-btn:focus-visible {
		background: var(--border-subtle);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.preset-btn.active {
		background: #2a2a2a;
		border-color: #888;
		color: #fff;
	}

	.param-row { display: flex; flex-direction: column; gap: var(--panel-gap-tight); }
	.param-row--curve { gap: 0; }

	.segment-row {
		display: flex;
		gap: 0;
		background: var(--bg-inset);
		border-radius: var(--radius-sm);
		padding: 2px;
		width: fit-content;
	}

	.segment-btn {
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

	.segment-btn.active {
		background: var(--text-primary);
		color: var(--bg-surface);
	}

	.segment-btn:hover:not(.active) {
		color: var(--text-secondary);
	}

	.param-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.param-meta-right {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.kf-btn {
		background: none;
		border: none;
		color: var(--text-faint);
		font-size: 10px;
		line-height: 1;
		padding: 0 2px;
		cursor: pointer;
		transition: color var(--transition-fast);
	}

	.kf-btn:hover,
	.kf-btn.active {
		color: #5dade2;
	}

	.param-label {
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--text-muted);
	}

	.param-value {
		font-size: var(--text-panel-body);
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	input[type='range'] {
		width: 100%;
		accent-color: #fff;
		cursor: pointer;
		height: 2px;
	}

	.toggle-pill {
		background: var(--bg-muted);
		border: 1px solid var(--border-default);
		border-radius: 4px;
		padding: 4px 10px;
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		cursor: pointer;
		font-family: inherit;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}
	.toggle-pill.on {
		background: var(--bg-light);
		color: var(--text-on-light);
		border-color: var(--bg-light);
	}
	.toggle-pill:focus-visible {
		border-color: var(--border-strong);
	}

	.param-select {
		width: 100%;
		background: var(--bg-muted);
		border: 1px solid var(--border-default);
		border-radius: 4px;
		color: var(--text-secondary);
		font-size: var(--text-panel-body);
		font-family: inherit;
		padding: 5px 8px;
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
		font-size: var(--text-panel-body);
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	.hint {
		color: var(--text-faint);
		font-size: var(--text-panel-label);
		letter-spacing: 0.08em;
		text-align: center;
		padding: var(--space-4);
	}

	.params-list::-webkit-scrollbar { width: 3px; }
	.params-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }

</style>
