<script lang="ts">
	import {
		appliedEffects,
		layerGroups,
		activeLayerIndex,
		removeEffect,
		removeGroup,
		duplicateEffect,
		toggleEffect,
		toggleGroupExpanded,
		toggleGroupEnabled,
		updateParam,
		beginParamEdit,
		applyParams,
		updateLayerOpacity,
		updateLayerBlendMode,
		clearEffects,
		moveEffect,
		randomizeParams,
		resetParams,
		type LayerGroup
	} from '../stores/editor';
	import type { AppliedEffect, BlendMode } from '../engine/renderer';
	import type { EffectParam } from '../engine/renderer';
	import type { GradientStop } from '../engine/gradient';
	import { DITHER_PRESETS } from '../effects/dither';
	import {
		GLITCH_DIGITAL_PRESETS,
		GLITCH_VHS_PRESETS
	} from '../effects/glitch';
	import GradientMapParam from './GradientMapParam.svelte';
	import { i18n } from '$lib/i18n';

	let active = $derived(
		$activeLayerIndex >= 0 ? $appliedEffects[$activeLayerIndex] : null
	);

	let draggingIndex = $state<number | null>(null);

	type LayerSegment = { type: 'layer'; index: number; item: AppliedEffect };
	type GroupSegment = {
		type: 'group';
		group: LayerGroup;
		children: { index: number; item: AppliedEffect }[];
	};
	type ListSegment = LayerSegment | GroupSegment;
	const BLEND_MODES: BlendMode[] = ['normal', 'multiply', 'screen', 'overlay', 'soft-light'];

	function buildSegments(effects: AppliedEffect[], groups: LayerGroup[]): ListSegment[] {
		const groupMap = new Map(groups.map((g) => [g.id, g]));
		const segments: ListSegment[] = [];
		let i = 0;
		while (i < effects.length) {
			const item = effects[i];
			const group = item.groupId ? groupMap.get(item.groupId) : undefined;
			if (group) {
				const children: { index: number; item: AppliedEffect }[] = [];
				while (i < effects.length && effects[i].groupId === group.id) {
					children.push({ index: i, item: effects[i] });
					i++;
				}
				segments.push({ type: 'group', group, children });
				continue;
			}
			segments.push({ type: 'layer', index: i, item });
			i++;
		}
		return segments;
	}

	let segments = $derived(buildSegments($appliedEffects, $layerGroups));

	function groupAllEnabled(group: LayerGroup, children: AppliedEffect[]): boolean {
		if (!group.enabled) return false;
		return children.every((c) => c.effect.enabled);
	}

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
		<span>{$i18n.t('layers.title')}</span>
		{#if $appliedEffects.length > 0}
			<button class="clear-btn" onclick={clearEffects}>{$i18n.t('layers.clearAll')}</button>
		{/if}
	</div>

	<div class="layers-list">
		{#if $appliedEffects.length === 0}
			<p class="empty">{$i18n.t('layers.empty')}<br />{$i18n.t('layers.emptyHint')}</p>
		{/if}

		{#each segments as segment (segment.type === 'group' ? segment.group.id : `layer-${segment.index}`)}
			{#if segment.type === 'group'}
				{@const groupVisible = groupAllEnabled(
					segment.group,
					segment.children.map((c) => c.item)
				)}
				<div class="group-block">
					<div
						class="group-header"
						class:selected={segment.children.some((c) => c.index === $activeLayerIndex)}
						class:hidden-layer={!groupVisible}
					>
						<button
							class="chevron-btn"
							title={segment.group.expanded ? $i18n.t('layers.collapse') : $i18n.t('layers.expand')}
							onclick={(e) => {
								e.stopPropagation();
								toggleGroupExpanded(segment.group.id);
							}}
						>
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								class:collapsed={!segment.group.expanded}
							>
								<polyline points="6 9 12 15 18 9" />
							</svg>
						</button>
						<span
							class="layer-name group-name"
							role="button"
							tabindex="0"
							onclick={() => activeLayerIndex.set(segment.children[0]?.index ?? -1)}
							onkeydown={(e) => {
								if (e.key === 'Enter') activeLayerIndex.set(segment.children[0]?.index ?? -1);
							}}
						>
							{segment.group.name.toUpperCase()}
						</span>
						<div class="layer-actions">
							<button
								class="icon-btn delete"
								title={$i18n.t('layers.removeGroup')}
								onclick={(e) => {
									e.stopPropagation();
									removeGroup(segment.group.id);
								}}
							>
								<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
									<polyline points="3 6 5 6 21 6"/>
									<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
									<path d="M10 11v6M14 11v6"/>
									<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
								</svg>
							</button>
							<button
								class="icon-btn eye"
								class:eye-off={!groupVisible}
								title={groupVisible ? $i18n.t('layers.hideGroup') : $i18n.t('layers.showGroup')}
								onclick={(e) => {
									e.stopPropagation();
									toggleGroupEnabled(segment.group.id);
								}}
							>
								{#if groupVisible}
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
					{#if segment.group.expanded}
						{#each segment.children as child, childIdx (child.index)}
							<div
								class="layer-row nested"
								class:selected={child.index === $activeLayerIndex}
								class:hidden-layer={!child.item.effect.enabled}
								class:dragging={draggingIndex === child.index}
								class:last-nested={childIdx === segment.children.length - 1}
								onclick={() => activeLayerIndex.set(child.index)}
								role="button"
								tabindex="0"
								onkeydown={(e) => onLayerKeyDown(e, child.index)}
								ondragover={(e) => onDragOver(child.index, e)}
								ondrop={(e) => onDrop(child.index, e)}
							>
								<span class="tree-gutter" aria-hidden="true">
									<span class="tree-line-v" class:tree-last={childIdx === segment.children.length - 1}></span>
									<span class="tree-line-h"></span>
								</span>
								<span
									class="drag-dot"
									draggable="true"
									ondragstart={(e) => {
										e.stopPropagation();
										onDragStart(child.index, e);
									}}
									ondragend={onDragEnd}
									role="img"
									aria-label={$i18n.t('layers.drag')}
								>⠿</span>
								<span class="layer-name"
									>{$i18n.effectName(child.item.effect.id, child.item.effect.name).toUpperCase()}</span
								>
								<div class="layer-actions">
									<button
										class="icon-btn"
										title={$i18n.t('layers.duplicate')}
										onclick={(e) => {
											e.stopPropagation();
											duplicateEffect(child.index);
										}}
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
											<rect x="9" y="9" width="13" height="13" rx="2"/>
											<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
										</svg>
									</button>
									<button
										class="icon-btn delete"
										title={$i18n.t('layers.delete')}
										onclick={(e) => {
											e.stopPropagation();
											removeEffect(child.index);
										}}
									>
										<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
											<polyline points="3 6 5 6 21 6"/>
											<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
											<path d="M10 11v6M14 11v6"/>
											<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
										</svg>
									</button>
									<button
										class="icon-btn eye"
										class:eye-off={!child.item.effect.enabled}
										title={child.item.effect.enabled ? $i18n.t('layers.hide') : $i18n.t('layers.show')}
										onclick={(e) => {
											e.stopPropagation();
											toggleEffect(child.index);
										}}
									>
										{#if child.item.effect.enabled}
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
					{/if}
				</div>
			{:else}
				{@const i = segment.index}
				{@const item = segment.item}
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

					<span class="layer-name">{$i18n.effectName(item.effect.id, item.effect.name).toUpperCase()}</span>

					<div class="layer-actions">
						<button
							class="icon-btn"
							title={$i18n.t('layers.duplicate')}
							onclick={(e) => { e.stopPropagation(); duplicateEffect(i); }}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
								<rect x="9" y="9" width="13" height="13" rx="2"/>
								<path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
							</svg>
						</button>

						<button
							class="icon-btn delete"
							title={$i18n.t('layers.delete')}
							onclick={(e) => { e.stopPropagation(); removeEffect(i); }}
						>
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
								<polyline points="3 6 5 6 21 6"/>
								<path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
								<path d="M10 11v6M14 11v6"/>
								<path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
							</svg>
						</button>

						<button
							class="icon-btn eye"
							class:eye-off={!item.effect.enabled}
							title={item.effect.enabled ? $i18n.t('layers.hide') : $i18n.t('layers.show')}
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
			{/if}
		{/each}
	</div>

	<!-- Configure panel -->
	{#if active}
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
				<div
					class="param-row"
					title={$i18n.paramHint(active.effect.id, param.name) ?? param.hint ?? ''}
				>
					<div class="param-meta">
						<span class="param-label"
							>{$i18n.paramLabel(active.effect.id, param.name, param.label).toUpperCase()}</span
						>
						{#if param.type !== 'gradient'}
							<span class="param-value">
								{formatParamValue(param, active.params[param.name], active.effect.id)}
							</span>
						{/if}
					</div>
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
			{/each}
		</div>
		</div>
	{:else if $appliedEffects.length > 0}
		<div class="hint">{$i18n.t('layers.selectHint')}</div>
	{/if}
</aside>

<style>
	.layer-panel {
		width: 260px;
		min-width: 220px;
		background: var(--bg-surface);
		border-left: 1px solid var(--border-panel);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		font-family: var(--font-mono);
	}

	/* ── Header ── */
	.panel-header {
		padding: var(--panel-padding-y) var(--panel-padding-x);
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border-panel);
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
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

	.param-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
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

	.layers-list::-webkit-scrollbar,
	.params-list::-webkit-scrollbar { width: 3px; }
	.layers-list::-webkit-scrollbar-thumb,
	.params-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
</style>
