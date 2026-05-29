<script lang="ts">
	import { i18n } from '$lib/i18n';
	import {
		controlsPlacement,
		mediaPreviewEnabled,
		type ControlsPlacement
	} from '$lib/stores/view';

	let open = $state(false);
	let subView = $state<'main' | 'controls'>('main');

	function clickOutside(node: HTMLElement) {
		const onDoc = (e: MouseEvent) => {
			if (!node.contains(e.target as Node)) closeMenu();
		};
		document.addEventListener('click', onDoc, true);
		return {
			destroy() {
				document.removeEventListener('click', onDoc, true);
			}
		};
	}

	function closeMenu() {
		open = false;
		subView = 'main';
	}

	function toggleOpen(e: MouseEvent) {
		e.stopPropagation();
		if (open) closeMenu();
		else {
			open = true;
			subView = 'main';
		}
	}

	function setPlacement(value: ControlsPlacement) {
		controlsPlacement.set(value);
	}

	function placementLabel(value: ControlsPlacement): string {
		return value === 'corner'
			? $i18n.t('menu.controlsCorner')
			: $i18n.t('menu.controlsSidebar');
	}
</script>

<div class="app-menu-wrap" use:clickOutside>
	<button
		class="app-menu-btn"
		title={$i18n.t('menu.workspace')}
		aria-label={$i18n.t('menu.workspace')}
		aria-expanded={open}
		aria-haspopup="menu"
		onclick={toggleOpen}
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="8" r="4"/>
			<path d="M6 20v-1a6 6 0 0112 0v1"/>
		</svg>
	</button>

	{#if open}
		<div class="app-menu" role="menu">
			{#if subView === 'main'}
				<div class="menu-section">
					<button
						type="button"
						class="menu-row"
						role="menuitem"
						onclick={() => mediaPreviewEnabled.update((v) => !v)}
					>
						<span class="menu-label">{$i18n.t('menu.mediaPreview')}</span>
						<span class="menu-value"
							>{$mediaPreviewEnabled ? $i18n.t('layers.on') : $i18n.t('layers.off')}</span
						>
					</button>
					<button
						type="button"
						class="menu-row"
						role="menuitem"
						onclick={(e) => {
							e.stopPropagation();
							subView = 'controls';
						}}
					>
						<span class="menu-label">{$i18n.t('menu.controls')}</span>
						<span class="menu-value">{placementLabel($controlsPlacement)}</span>
					</button>
				</div>
				<p class="menu-hint">{$i18n.t('menu.mediaPreviewHint')}</p>
			{:else}
				<div class="menu-subhead">
					<button
						type="button"
						class="menu-back"
						aria-label={$i18n.t('menu.back')}
						onclick={() => (subView = 'main')}
					>
						<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<polyline points="15 18 9 12 15 6"/>
						</svg>
					</button>
					<span>{$i18n.t('menu.controls')}</span>
				</div>
				<div class="placement-picker" role="group" aria-label={$i18n.t('menu.controls')}>
					<button
						type="button"
						class="placement-opt"
						class:active={$controlsPlacement === 'sidebar'}
						onclick={() => setPlacement('sidebar')}
					>
						{$i18n.t('menu.controlsSidebar')}
					</button>
					<button
						type="button"
						class="placement-opt"
						class:active={$controlsPlacement === 'corner'}
						onclick={() => setPlacement('corner')}
					>
						{$i18n.t('menu.controlsCorner')}
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.app-menu-wrap {
		position: relative;
	}

	.app-menu-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: 1px solid var(--border-default);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			border-color var(--transition-fast),
			color var(--transition-fast);
	}

	.app-menu-btn:hover,
	.app-menu-btn:focus-visible {
		background: var(--bg-hover);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.app-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 240px;
		background: var(--bg-dropdown);
		border: 1px solid var(--border-default);
		border-radius: var(--radius-md);
		padding: var(--space-2);
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
		z-index: 100;
		font-family: var(--font-mono);
	}

	.menu-section {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.menu-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-3);
		width: 100%;
		padding: var(--space-2) var(--space-3);
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.1em;
		font-family: inherit;
		cursor: pointer;
		text-align: left;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.menu-row:hover,
	.menu-row:focus-visible {
		background: var(--border-subtle);
		color: var(--text-primary);
	}

	.menu-label {
		flex: 1;
	}

	.menu-value {
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
	}

	.menu-hint {
		margin: var(--space-2) var(--space-3) 0;
		font-size: var(--text-panel-label);
		line-height: 1.4;
		letter-spacing: 0.04em;
		color: var(--text-faint);
	}

	.menu-subhead {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-1) var(--space-2) var(--space-2);
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.12em;
		color: var(--text-muted);
	}

	.menu-back {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.menu-back:hover,
	.menu-back:focus-visible {
		background: var(--border-subtle);
		color: var(--text-primary);
	}

	.placement-picker {
		display: flex;
		gap: 0;
		background: var(--bg-inset);
		border-radius: var(--radius-sm);
		padding: 2px;
		margin: 0 var(--space-1);
	}

	.placement-opt {
		flex: 1;
		padding: 8px 10px;
		border: none;
		background: transparent;
		color: var(--text-faint);
		font-family: inherit;
		font-size: var(--text-panel-label);
		font-weight: 700;
		letter-spacing: 0.1em;
		cursor: pointer;
		border-radius: 4px;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.placement-opt.active {
		background: var(--text-primary);
		color: var(--bg-surface);
	}

	.placement-opt:hover:not(.active) {
		color: var(--text-secondary);
	}
</style>
