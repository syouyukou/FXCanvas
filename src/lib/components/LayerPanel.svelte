<script lang="ts">
	import {
		appliedEffects,
		activeLayerIndex,
		removeEffect,
		toggleEffect,
		updateParam,
		clearEffects,
		moveEffect
	} from '../stores/editor';

	let active = $derived(
		$activeLayerIndex >= 0 ? $appliedEffects[$activeLayerIndex] : null
	);

	// Drag-and-drop state
	let draggingIndex: number | null = null;

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

	function onDragEnd() {
		draggingIndex = null;
	}
</script>

<aside class="layer-panel">
	<!-- Layers header -->
	<div class="section-header">
		<span>LAYERS</span>
		{#if $appliedEffects.length > 0}
			<button class="clear-btn" onclick={clearEffects} title="Clear all">✕ Clear</button>
		{/if}
	</div>

	<div class="layers-list">
		{#if $appliedEffects.length === 0}
			<p class="empty">No effects applied.<br />Click an effect to add it.</p>
		{/if}

		{#each $appliedEffects as item, i}
			<div
				class="layer-item"
				class:active-layer={i === $activeLayerIndex}
				class:disabled={!item.effect.enabled}
				class:dragging={draggingIndex === i}
				onclick={() => activeLayerIndex.set(i)}
				role="button"
				tabindex="0"
				onkeydown={(e) => e.key === 'Enter' && activeLayerIndex.set(i)}
				ondragover={(e) => onDragOver(i, e)}
				ondrop={(e) => onDrop(i, e)}
			>
				<!-- Drag handle — only this element is draggable -->
				<span
					class="drag-handle"
					title="Drag to reorder"
					draggable="true"
					ondragstart={(e) => { e.stopPropagation(); onDragStart(i, e); }}
					ondragend={onDragEnd}
					role="img"
					aria-label="drag handle"
				>
					<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
						<circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
						<circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
						<circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
					</svg>
				</span>

				<!-- Eye toggle -->
				<button
					class="eye-btn"
					class:hidden-effect={!item.effect.enabled}
					title={item.effect.enabled ? 'Hide effect' : 'Show effect'}
					onclick={(e) => { e.stopPropagation(); toggleEffect(i); }}
				>
					{#if item.effect.enabled}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
							<circle cx="12" cy="12" r="3"/>
						</svg>
					{:else}
						<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
							<path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
							<line x1="1" y1="1" x2="23" y2="23"/>
						</svg>
					{/if}
				</button>

				<!-- Name -->
				<span class="layer-name">{item.effect.name}</span>

				<!-- Move up/down -->
				<div class="order-btns">
					<button
						class="order-btn"
						title="Move up"
						disabled={i === 0}
						onclick={(e) => { e.stopPropagation(); moveEffect(i, i - 1); activeLayerIndex.set(i - 1); }}
					>
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
					</button>
					<button
						class="order-btn"
						title="Move down"
						disabled={i === $appliedEffects.length - 1}
						onclick={(e) => { e.stopPropagation(); moveEffect(i, i + 1); activeLayerIndex.set(i + 1); }}
					>
						<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
					</button>
				</div>

				<!-- Delete -->
				<button
					class="del-btn"
					title="Remove effect"
					onclick={(e) => { e.stopPropagation(); removeEffect(i); }}
				>
					<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
						<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			</div>
		{/each}
	</div>

	<!-- Configure panel -->
	{#if active}
		<div class="section-header configure-header">
			<span>CONFIGURE</span>
			<span class="effect-name-badge">{active.effect.name}</span>
		</div>
		<div class="params-list">
			{#each active.effect.params as param}
				<div class="param-row">
					<div class="param-meta">
						<label class="param-label">{param.label}</label>
						<span class="param-value">
							{typeof active.params[param.name] === 'boolean'
								? active.params[param.name] ? 'On' : 'Off'
								: Number(active.params[param.name] ?? param.default).toFixed(
										param.step && param.step < 0.1 ? 3 : param.step && param.step < 1 ? 2 : 1
									)}
						</span>
					</div>
					{#if param.type === 'bool'}
						<button
							class="toggle-pill"
							class:on={active.params[param.name]}
							onclick={() => updateParam($activeLayerIndex, param.name, !active.params[param.name])}
						>
							{active.params[param.name] ? 'ON' : 'OFF'}
						</button>
					{:else}
						<input
							type="range"
							min={param.min}
							max={param.max}
							step={param.step ?? 0.01}
							value={active.params[param.name] ?? param.default}
							oninput={(e) =>
								updateParam($activeLayerIndex, param.name, parseFloat((e.target as HTMLInputElement).value))}
						/>
					{/if}
				</div>
			{/each}
		</div>
	{:else if $appliedEffects.length > 0}
		<div class="hint">Select a layer to configure</div>
	{/if}
</aside>

<style>
	.layer-panel {
		width: 260px;
		min-width: 220px;
		background: #1a1a1a;
		border-left: 1px solid #2a2a2a;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.section-header {
		padding: 10px 12px;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #555;
		border-bottom: 1px solid #2a2a2a;
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-shrink: 0;
	}

	.configure-header {
		margin-top: 0;
	}

	.effect-name-badge {
		font-size: 10px;
		color: #888;
		font-weight: 500;
		letter-spacing: 0;
		text-transform: none;
		max-width: 130px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.clear-btn {
		background: none;
		border: none;
		color: #555;
		font-size: 10px;
		cursor: pointer;
		padding: 2px 6px;
		border-radius: 4px;
		transition: color 0.15s;
	}
	.clear-btn:hover { color: #e55; }

	.layers-list {
		padding: 6px;
		display: flex;
		flex-direction: column;
		gap: 3px;
		max-height: 280px;
		overflow-y: auto;
		flex-shrink: 0;
	}

	.empty {
		color: #444;
		font-size: 12px;
		text-align: center;
		padding: 16px 8px;
		line-height: 1.6;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 5px;
		padding: 6px 8px;
		border-radius: 6px;
		background: #232323;
		border: 1px solid transparent;
		cursor: pointer;
		transition: background 0.1s, border-color 0.1s;
		user-select: none;
	}
	.layer-item:hover { background: #2a2a2a; }
	.layer-item.active-layer { border-color: #484848; background: #272727; }
	.layer-item.disabled { opacity: 0.4; }
	.layer-item.dragging { opacity: 0.5; border-style: dashed; border-color: #555; }

	.drag-handle {
		color: #3a3a3a;
		cursor: grab;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		padding: 0 1px;
		transition: color 0.15s;
	}
	.layer-item:hover .drag-handle { color: #555; }

	.eye-btn {
		background: none;
		border: none;
		color: #777;
		cursor: pointer;
		padding: 1px;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		border-radius: 3px;
		transition: color 0.15s;
	}
	.eye-btn:hover { color: #bbb; }
	.eye-btn.hidden-effect { color: #444; }

	.layer-name {
		flex: 1;
		font-size: 12px;
		color: #c0c0c0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.order-btns {
		display: flex;
		flex-direction: column;
		gap: 1px;
		flex-shrink: 0;
	}

	.order-btn {
		background: none;
		border: none;
		color: #444;
		cursor: pointer;
		padding: 1px 2px;
		display: flex;
		align-items: center;
		border-radius: 2px;
		line-height: 1;
		transition: color 0.15s;
	}
	.order-btn:hover:not(:disabled) { color: #aaa; }
	.order-btn:disabled { opacity: 0.2; cursor: default; }

	.del-btn {
		background: none;
		border: none;
		color: #444;
		cursor: pointer;
		padding: 2px;
		border-radius: 3px;
		display: flex;
		align-items: center;
		flex-shrink: 0;
		transition: color 0.15s;
	}
	.del-btn:hover { color: #e55; }

	/* Configure */
	.params-list {
		flex: 1;
		overflow-y: auto;
		padding: 10px 12px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.param-row { display: flex; flex-direction: column; gap: 5px; }

	.param-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.param-label { font-size: 11px; color: #888; }

	.param-value {
		font-size: 11px;
		color: #666;
		font-variant-numeric: tabular-nums;
	}

	input[type='range'] {
		width: 100%;
		accent-color: #fff;
		cursor: pointer;
		height: 4px;
	}

	.toggle-pill {
		background: #2a2a2a;
		border: 1px solid #444;
		border-radius: 20px;
		padding: 3px 14px;
		font-size: 10px;
		color: #888;
		cursor: pointer;
		letter-spacing: 0.05em;
		transition: all 0.15s;
	}
	.toggle-pill.on { background: #fff; color: #000; border-color: #fff; }

	.hint { color: #444; font-size: 12px; text-align: center; padding: 16px; }

	.params-list::-webkit-scrollbar,
	.layers-list::-webkit-scrollbar { width: 4px; }
	.params-list::-webkit-scrollbar-thumb,
	.layers-list::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
</style>
