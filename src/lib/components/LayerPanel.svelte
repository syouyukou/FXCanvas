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
		clearEffects,
		moveEffect,
		type LayerGroup
	} from '../stores/editor';
	import type { AppliedEffect, BlendMode } from '../engine/renderer';
	import { i18n } from '$lib/i18n';
	import { controlsPlacement } from '../stores/view';
	import ControlsPanel from './ControlsPanel.svelte';

	let draggingIndex = $state<number | null>(null);

	type LayerSegment = { type: 'layer'; index: number; item: AppliedEffect };
	type GroupSegment = {
		type: 'group';
		group: LayerGroup;
		children: { index: number; item: AppliedEffect }[];
	};
	type ListSegment = LayerSegment | GroupSegment;

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

<aside class="layer-panel" class:layer-panel--corner={$controlsPlacement === 'corner'}>
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

	{#if $controlsPlacement === 'sidebar'}
		<ControlsPanel variant="sidebar" />
	{/if}
	{#if $activeLayerIndex < 0 && $appliedEffects.length > 0}
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

	.layer-panel--corner .layers-list {
		flex: 1;
		max-height: none;
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

	.hint {
		color: var(--text-faint);
		font-size: var(--text-panel-label);
		letter-spacing: 0.08em;
		text-align: center;
		padding: var(--space-4);
	}

	.layers-list::-webkit-scrollbar { width: 3px; }
	.layers-list::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
</style>
