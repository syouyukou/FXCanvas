<script lang="ts">
	import { savedPresets, saveCurrentPreset, loadPreset, deletePreset } from '../stores/presets';
	import { i18n } from '$lib/i18n';

	let open = $state(false);
	let saveOpen = $state(false);
	let name = $state('');

	function toggle() {
		open = !open;
		saveOpen = false;
	}

	function onSave() {
		saveCurrentPreset(name);
		name = '';
		saveOpen = false;
		open = false;
	}

	function onLoad(id: string) {
		loadPreset(id);
		open = false;
	}

	function onDelete(e: MouseEvent, id: string) {
		e.stopPropagation();
		deletePreset(id);
	}
</script>

<div class="preset-menu">
	<button class="btn-ghost" onclick={toggle} title={$i18n.t('presetsMenu.tooltip')}>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
			<polyline points="17 21 17 13 7 13 7 21"/>
			<polyline points="7 3 7 8 15 8"/>
		</svg>
		{$i18n.t('presetsMenu.title')}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="backdrop" role="presentation" onclick={() => (open = false)}></div>
		<div class="dropdown">
			{#if saveOpen}
				<div class="save-row">
					<input
						type="text"
						placeholder={$i18n.t('presetsMenu.namePlaceholder')}
						bind:value={name}
						onkeydown={(e) => e.key === 'Enter' && onSave()}
					/>
					<button class="save-btn" onclick={onSave}>{$i18n.t('presetsMenu.save')}</button>
				</div>
			{:else}
				<button class="menu-item accent" onclick={() => (saveOpen = true)}>
					{$i18n.t('presetsMenu.saveCurrent')}
				</button>
			{/if}

			{#if $savedPresets.length === 0}
				<p class="empty">{$i18n.t('presetsMenu.empty')}</p>
			{:else}
				<div class="list">
					{#each $savedPresets as preset (preset.id)}
						<div class="preset-row">
							<button class="menu-item preset-load" onclick={() => onLoad(preset.id)}>
								<span class="preset-name">{preset.name}</span>
							</button>
							<button
								class="delete-btn"
								title={$i18n.t('presetsMenu.deletePreset')}
								onclick={(e) => onDelete(e, preset.id)}
							>✕</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.preset-menu {
		position: relative;
	}

	.btn-ghost {
		display: flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		padding: 6px var(--space-3);
		color: var(--text-secondary);
		font-size: var(--text-base);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.btn-ghost:hover,
	.btn-ghost:focus-visible {
		background: var(--bg-hover);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 99;
	}

	.dropdown {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 220px;
		background: #1c1c1c;
		border: 1px solid #333;
		border-radius: 8px;
		padding: 6px;
		z-index: 100;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}

	.menu-item {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-radius: 4px;
		padding: 8px 10px;
		color: #ccc;
		font-size: 12px;
		cursor: pointer;
	}

	.menu-item:hover,
	.menu-item:focus-visible {
		background: var(--border-subtle);
		color: var(--text-primary);
	}

	.menu-item.accent {
		color: #aaa;
		font-weight: 600;
		border-bottom: 1px solid #2a2a2a;
		margin-bottom: 4px;
		border-radius: 4px 4px 0 0;
	}

	.empty {
		font-size: 11px;
		color: #555;
		padding: 8px 10px;
	}

	.save-row {
		display: flex;
		gap: 6px;
		padding: 4px;
		margin-bottom: 6px;
	}

	.save-row input {
		flex: 1;
		background: #111;
		border: 1px solid #333;
		border-radius: 4px;
		padding: 6px 8px;
		color: #eee;
		font-size: 12px;
	}

	.save-btn {
		background: #333;
		border: none;
		border-radius: 4px;
		padding: 0 10px;
		color: #fff;
		font-size: 11px;
		cursor: pointer;
	}

	.list {
		max-height: 240px;
		overflow-y: auto;
	}

	.preset-row {
		display: flex;
		align-items: center;
		gap: 4px;
		border-radius: 4px;
	}

	.preset-row:hover {
		background: #2a2a2a;
	}

	.preset-load {
		flex: 1;
		min-width: 0;
	}

	.preset-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.delete-btn {
		background: none;
		border: none;
		color: #555;
		cursor: pointer;
		padding: 2px 4px;
		font-size: 10px;
	}

	.delete-btn:hover,
	.delete-btn:focus-visible {
		color: var(--text-danger);
	}
</style>
