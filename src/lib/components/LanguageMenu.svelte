<script lang="ts">
	import { i18n, locale } from '$lib/i18n';
	import { LOCALE_OPTIONS, type LocaleId } from '$lib/i18n/types';
	let open = $state(false);

	function select(id: LocaleId) {
		locale.set(id);
		open = false;
	}

	function clickOutside(node: HTMLElement) {
		const onDoc = (e: MouseEvent) => {
			if (!node.contains(e.target as Node)) open = false;
		};
		document.addEventListener('click', onDoc, true);
		return {
			destroy() {
				document.removeEventListener('click', onDoc, true);
			}
		};
	}
</script>

<div class="lang-wrap" use:clickOutside>
	<button
		class="lang-btn"
		title={$i18n.t('lang.switchLanguage')}
		aria-label={$i18n.t('lang.switchLanguage')}
		aria-expanded={open}
		aria-haspopup="listbox"
		onclick={(e) => {
			e.stopPropagation();
			open = !open;
		}}
	>
		<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="12" cy="12" r="10"/>
			<path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
		</svg>
	</button>

	{#if open}
		<ul class="lang-menu" role="listbox">
			{#each LOCALE_OPTIONS as opt (opt.id)}
				<li>
					<button
						class="lang-option"
						class:active={$locale === opt.id}
						role="option"
						aria-selected={$locale === opt.id}
						onclick={() => select(opt.id)}
					>
						{$i18n.t(opt.labelKey)}
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.lang-wrap {
		position: relative;
	}

	.lang-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: 1px solid #333;
		border-radius: 6px;
		color: #bbb;
		cursor: pointer;
		transition: all 0.15s;
	}

	.lang-btn:hover {
		background: #252525;
		border-color: #555;
		color: #fff;
	}

	.lang-menu {
		position: absolute;
		top: calc(100% + 6px);
		right: 0;
		min-width: 168px;
		background: #1e1e1e;
		border: 1px solid #333;
		border-radius: 8px;
		padding: 4px;
		list-style: none;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
		z-index: 100;
	}

	.lang-option {
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		border-radius: 6px;
		padding: 8px 12px;
		color: #bbb;
		font-size: 13px;
		cursor: pointer;
		transition: background 0.12s, color 0.12s;
	}

	.lang-option:hover {
		background: #2a2a2a;
		color: #fff;
	}

	.lang-option.active {
		background: #333;
		color: #fff;
	}
</style>
