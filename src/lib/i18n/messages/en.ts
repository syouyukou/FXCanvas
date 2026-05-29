import type { MessageTree } from '../types';

export const en: MessageTree = {
	lang: {
		switchLanguage: 'Switch language',
		zhTW: '繁體中文',
		zhCN: '简体中文',
		ja: '日本語',
		en: 'English',
		enZh: 'English & 中文'
	},
	app: {
		loadMedia: 'Load Media',
		undo: 'Undo (⌘Z)',
		redo: 'Redo (⌘⇧Z)',
		resizePanel: 'Resize effects panel',
		noMedia: 'No media loaded',
		preview: 'PREVIEW',
		footerTip:
			'Drag edge to resize · Scroll zoom · ⌘Z undo · ⌘V paste · Session auto-saves',
		explore: 'Explore'
	},
	explore: {
		pageTitle: 'Image Effects Library',
		title: 'Image Effects Library',
		subtitle:
			'Browse curated effects. Hover to compare before and after — click to try in the editor.',
		subtitleAnimated:
			'Effects with built-in motion on still images. Click to preview in the editor.',
		tabs: { effects: 'EFFECTS', animated: 'ANIMATED' },
		search: 'Search effects…',
		searchAnimated: 'Search animated effects…',
		noResults: 'No effects found',
		noResultsAnimated: 'No animated effects found',
		navLabel: 'Main',
		navExplore: 'Explore',
		navEditor: 'Editor',
		openEditor: 'Open editor',
		footerTagline: 'Processed locally in your browser — media never leaves your device.'
	},
	canvas: {
		dropImage: 'Drop an image here',
		orClickLoad: 'or click Load Media',
		pasteHint: '⌘V to paste from clipboard',
		trySamples: 'Try a sample',
		creditBy: 'by',
		creditAria: 'Photo credit',
		original: 'ORIGINAL',
		ariaCanvas: 'Canvas',
		ariaPreview: 'Preview canvas'
	},
	samples: {
		biomech: 'Biomech',
		illustration: 'Illustration',
		portrait: 'Portrait',
		neon: 'Neon',
		night: 'Night'
	},
	timeline: {
		aria: 'Animation timeline',
		play: 'Play',
		pause: 'Pause',
		duration: 'Duration',
		fps: 'Frame rate',
		scrub: 'Scrub timeline',
		hint: '◆ Add keyframes on layer params',
		toggleKeyframe: 'Toggle keyframe at playhead'
	},
	layers: {
		title: 'LAYERS',
		clearAll: 'CLEAR ALL',
		controls: 'CONTROLS',
		opacity: 'OPACITY',
		blendMode: 'BLEND',
		blendModes: {
			normal: 'Normal',
			multiply: 'Multiply',
			screen: 'Screen',
			overlay: 'Overlay',
			'soft-light': 'Soft light'
		},
		empty: 'No effects applied.',
		emptyHint: 'Click an effect to add it.',
		selectHint: 'Click a layer to configure',
		on: 'ON',
		off: 'OFF',
		collapse: 'Collapse',
		expand: 'Expand',
		removeGroup: 'Remove preset group',
		hideGroup: 'Hide group',
		showGroup: 'Show group',
		duplicate: 'Duplicate',
		delete: 'Delete',
		hide: 'Hide',
		show: 'Show',
		randomize: 'Randomize',
		reset: 'Reset',
		oneClickStyle: 'Quick styles',
		applyDitherPreset: 'Apply {label} settings',
		applyGlitchPreset: 'Apply {label}',
		groupFallback: 'GROUP',
		drag: 'drag'
	},
	effectsPanel: {
		tabs: {
			adjust: 'ADJUST',
			effects: 'EFFECTS',
			animated: 'ANIMATED',
			favorites: 'FAVORITES',
			presets: 'PRESETS'
		},
		adjustHint: 'Fine-tune exposure, tone, and sharpness — one layer at a time.',
		effectsHint: 'Stack creative looks — click to randomize, Shift+click for defaults.',
		searchAdjust: 'Search adjust…',
		searchEffects: 'Search effects…',
		noAdjust: 'No adjust tools found',
		tooltipAdjust: '{name} — Click: add layer · Shift+Click: defaults',
		animatedSection: 'ANIMATED',
		animBadge: 'ANIM',
		expandPanel: 'Expand effects panel',
		collapsePanel: 'Collapse effects panel',
		search: 'Search…',
		searchAnimated: 'Search animated…',
		searchPresets: 'Search presets…',
		popular: '★ MOST POPULAR',
		noEffects: 'No effects found',
		noAnimated: 'No animated effects found',
		noPresets: 'No presets found',
		layersCount: '{n} layers',
		layersPrefix: 'Layers:',
		favorite: 'Favorite',
		tooltipWithThumb: '{name} — Hover: before · Click: random · Shift+Click: defaults',
		tooltipNoThumb: '{name} — Click to add layer',
		presetAbbr: 'VP'
	},
	presetsMenu: {
		title: 'Presets',
		tooltip: 'Save / load effect stack',
		namePlaceholder: 'Preset name…',
		save: 'Save',
		saveCurrent: 'Save current stack…',
		empty: 'No saved presets yet',
		deletePreset: 'Delete preset',
		autoName: 'Preset {n}'
	},
	export: {
		title: 'Export',
		format: 'Format',
		size: 'Size',
		png: 'PNG',
		jpeg: 'JPEG',
		webp: 'WebP',
		webm: 'WebM (animation)',
		mp4: 'MP4 (video)',
		animation: 'Duration',
		animationSource: 'Full clip ({duration})',
		animation5s: '5 seconds',
		animation10s: '10 seconds',
		durationCapped: 'Clips longer than {max}s are trimmed',
		exportSummary: '~{duration} · {frames} frames @ {fps} FPS',
		frameRate: 'Frame rate',
		downloadWebm: 'Download WebM',
		downloadMp4: 'Download MP4',
		exporting: 'Exporting…',
		downloadLayers: 'Download layer PNGs',
		sizeLabel: '{label} — {w} × {h}',
		px: '{w} × {h} px',
		exceedsLimit: 'Exceeds {max}px limit — choose a smaller size',
		download: 'Download',
		sizes: {
			half: '0.5×',
			'1x': '1× Original',
			'2x': '2×',
			'3x': '3×',
			'4x': '4×',
			'1080p': '1080p (long edge)',
			'4k': '4K (long edge)'
		}
	},
	gradient: {
		hint: 'Drag to move · click swatch to change color'
	},
	categories: {
		adjust: 'Adjust',
		blur: 'Blur',
		color: 'Color',
		film: 'Film',
		distort: 'Distort',
		effects: 'Effects',
		generate: 'Generate'
	},
	dither: {
		distance: { rgb: 'RGB', natural: 'Natural' },
		patterns: [
			'Bayer 2×2',
			'Bayer 4×4',
			'Bayer 8×8',
			'Halftone',
			'Diagonal',
			'Blue noise',
			'Floyd-style',
			'Atkinson-style',
			'Cross hatch',
			'Grain',
			'Sierra-style',
			'Stucki-style',
			'Halftone dots',
			'Fine print'
		],
		palettes: [
			'B&W',
			'Grayscale',
			'RGB quantize',
			'Game Boy',
			'CGA 4-color',
			'EGA 16-color',
			'Risograph',
			'Ink B&W'
		],
		presets: {
			'effect-app': 'High-contrast B&W',
			gameboy: 'Game Boy',
			'bw-print': 'B&W print',
			riso: 'Risograph',
			ega: 'EGA retro'
		}
	},
	glitch: {
		digital: {
			subtle: 'Light glitch',
			cyber: 'Cyberpunk',
			broken: 'Heavy damage'
		},
		vhs: {
			subtle: 'Light VHS',
			worn: 'Old tape',
			broken: 'Broken VCR'
		}
	},
	effects: {
		gaussian_blur: { name: 'Gaussian Blur', params: { radius: { label: 'Radius' } } },
		sharpen: {
			name: 'Sharpen',
			params: {
				amount: { label: 'Amount', hint: 'Sharpening strength.' },
				radius: { label: 'Radius', hint: 'Blur radius for unsharp mask.' },
				threshold: { label: 'Threshold', hint: 'Ignore subtle differences below this level.' }
			}
		},
		curves: {
			name: 'Curves',
			params: {
				curves: { label: 'Curves' },
				apply_mode: {
					label: 'Apply mode',
					hint: 'N = normal, C = color, L = luminance.'
				}
			}
		},
		motion_blur: {
			name: 'Motion Blur',
			params: {
				strength: { label: 'Strength', hint: 'Blur distance in pixels.' },
				angle: { label: 'Angle', hint: 'Direction in degrees.' },
				box: { label: 'Box', hint: 'Use box blur instead of Gaussian weighting.' },
				both_directions: { label: 'Both Directions', hint: 'Blur symmetrically around each pixel.' },
				enable_mask: { label: 'Enable Mask', hint: 'Limit blur to a radial region.' },
				mask_center: { label: 'Mask Center' },
				mask_radius: { label: 'Mask Radius' },
				mask_falloff: { label: 'Mask Falloff' }
			}
		},
		gradient_map: {
			name: 'Gradient Map',
			params: {
				gradient: { label: 'Gradient map' },
				grad_shift: { label: 'Gradient shift', hint: 'Slide the tonal mapping along the gradient.' },
				grad_repeat: { label: 'Gradient repeat', hint: 'Repeat the gradient across the tonal range.' }
			}
		},
		exposure: {
			name: 'Exposure',
			params: {
				exposure: {
					label: 'Exposure',
					hint: 'Exposure (EV). Higher brightens; pairs well with Dither for contrast.'
				},
				offset: { label: 'Offset', hint: 'Overall brightness shift. Fine-tune midtones.' },
				gamma: { label: 'Gamma', hint: 'Gamma curve. Opens tonal range before dither.' }
			}
		},
		levels: {
			name: 'Levels',
			params: {
				shadows: { label: 'Shadows', hint: 'Raise to lift shadows; lower to crush.' },
				midtones: { label: 'Midtones', hint: 'Overall tonal balance.' },
				highlights: { label: 'Highlights', hint: 'Lower to compress highlights.' }
			}
		},
		brightness_contrast: {
			name: 'Brightness / Contrast',
			params: { brightness: { label: 'Brightness' }, contrast: { label: 'Contrast' } }
		},
		hue_saturation: {
			name: 'Hue / Saturation',
			params: { hue: { label: 'Hue' }, saturation: { label: 'Saturation' } }
		},
		duotone: {
			name: 'Duotone',
			params: { shadow: { label: 'Shadow' }, highlight: { label: 'Highlight' } }
		},
		monochrome: {
			name: 'Monochrome',
			params: { mix: { label: 'Mix' }, tint: { label: 'Tint' } }
		},
		noise: {
			name: 'Noise',
			params: {
				amount: { label: 'Amount' },
				size: { label: 'Size' },
				chroma: { label: 'Chroma' },
				shadow: { label: 'Shadow' },
				midtone: { label: 'Mid-tone' },
				highlight: { label: 'Highlight' }
			}
		},
		rgb_halftone: {
			name: 'RGB Halftone',
			params: {
				cellSize: { label: 'Dot size', hint: 'Dot size in px. 3–5 matches effect.app.' },
				gamma: { label: 'Gamma' },
				contrast: { label: 'Contrast' },
				saturation: { label: 'Saturation', hint: 'Pre-ink saturation for CMY dots.' },
				misregister: { label: 'Misregister' },
				dotGain: { label: 'Dot gain' },
				sharpness: { label: 'Dot sharpness' },
				inkBleed: { label: 'Ink bleed' },
				angleR: { label: 'Angle R' },
				angleG: { label: 'Angle G' },
				angleB: { label: 'Angle B' }
			}
		},
		soft_bleed: {
			name: 'Soft Bleed',
			params: { amount: { label: 'Bleed' }, radius: { label: 'Radius' } }
		},
		ink_bleed: {
			name: 'Ink Bleed',
			params: {
				spread: { label: 'Spread', hint: 'How far ink spreads from dark areas.' },
				decay: { label: 'Decay', hint: 'Falloff of the spread.' },
				intensity: { label: 'Intensity' },
				direction: { label: 'Direction', hint: 'Primary bleed angle (degrees).' },
				noise_size: { label: 'Noise size', hint: 'Micro variation in spread direction.' },
				grain: { label: 'Grain', hint: 'Paper fiber unevenness.' },
				grain_size: { label: 'Grain size' }
			}
		},
		paper_grain: {
			name: 'Paper Grain',
			params: {
				amount: { label: 'Amount' },
				scale: { label: 'Grain size' },
				contrast: { label: 'Contrast' },
				warmth: { label: 'Paper warmth' },
				blend: { label: 'Blend', hint: '0 = subtle overlay, 1 = full paper texture.' }
			}
		},
		print_stamp: {
			name: 'Print Stamp',
			params: {
				margin: { label: 'Margin' },
				fade: { label: 'Edge fade' },
				roughness: { label: 'Edge roughness' },
				paperColor: { label: 'Paper color' }
			}
		},
		glitch_digital: {
			name: 'Glitch Digital',
			params: {
				block_size: { label: 'Block size', hint: 'Larger blocks = heavier JPEG-style corruption.' },
				displacement: { label: 'Displacement' },
				block_opacity: { label: 'Block opacity' },
				color_split: { label: 'Color split' },
				line_tear: { label: 'Line tear' },
				pixelate: { label: 'Pixelate' },
				seed: { label: 'Seed' }
			}
		},
		glitch_vhs: {
			name: 'Glitch VHS',
			params: {
				grain: { label: 'Grain', hint: 'Analog film grain.' },
				glitch_blocks: { label: 'Glitch blocks' },
				rgb_shift: { label: 'RGB shift' },
				scanlines: { label: 'Scanlines', hint: 'CRT scanlines.' },
				noise: { label: 'Noise' },
				distortion: { label: 'Distortion' },
				seed: { label: 'Seed' }
			}
		},
		emboss: {
			name: 'Emboss',
			params: {
				scale: { label: 'Scale', hint: 'Relief height — how deep the emboss reads.' },
				color: { label: 'Color', hint: 'Blend original color (0 = mono, 100 = full).' },
				shadow_intensity: { label: 'Shadow intensity', hint: 'Strength of the shadow side.' },
				light_dir: { label: 'Light direction' },
				light_ani: { label: 'Light angle offset', hint: 'Extra light vector offset.' },
				shadow_dir: { label: 'Shadow direction' },
				lock_shadow: { label: 'Lock shadow', hint: 'Mirror shadow opposite to light.' }
			}
		},
		threshold: {
			name: 'Threshold',
			params: {
				threshold: { label: 'Threshold', hint: 'Brightness cutoff (0–255).' },
				edge_mode: { label: 'Edge mode', hint: 'Threshold Sobel edges instead of flat tones.' },
				offset_amount: { label: 'Offset amount', hint: 'Shift the threshold level.' },
				distance: { label: 'Distance', hint: 'Mix luminance vs color-distance metric.' },
				outline: { label: 'Outline', hint: 'Outline width at binary edges.' },
				outline_strength: { label: 'Outline strength' },
				outline_type: { label: 'Outline type' },
				blend_strength: { label: 'Blend strength' },
				blend_mode: { label: 'Blend mode' },
				color: { label: 'Color', hint: 'Shadow / low tone color.' }
			}
		},
		modulation_dither: {
			name: 'Modulation Dither',
			params: {
				mod_tc: { label: 'Modulation TC', hint: 'Wave frequency (time constant).' },
				mod_am: { label: 'AM', hint: 'Amplitude modulation — wave distortion strength.' },
				wave_dir: { label: 'Wave direction' },
				dither_strength: { label: 'Dither strength' },
				pixel_step: { label: 'Pixel step', hint: 'Dither cell size (1 = finest).' },
				invert: { label: 'Invert', hint: 'Negative-like tonal inversion.' },
				gamma: { label: 'Gamma' },
				shadow: { label: 'Shadow' },
				highlight: { label: 'Highlight' },
				grid: { label: 'CRT grid', hint: 'Phosphor aperture grille + scanlines.' },
				grain: { label: 'Grain' }
			}
		},
		crt: {
			name: 'CRT Screen',
			params: {
				scan_intensity: { label: 'Scan Lines' },
				curvature: { label: 'Curvature' },
				rgb_shift: { label: 'RGB Shift' }
			}
		},
		vignette: {
			name: 'Vignette',
			params: { strength: { label: 'Strength' }, softness: { label: 'Softness' } }
		},
		pixelate: {
			name: 'Pixelate',
			params: { size: { label: 'Pixel Size' } }
		},
		star_glow: {
			name: 'Star Glow',
			params: {
				highlight_boost: { label: 'highlight boost' },
				streaks: { label: 'streaks' },
				samples: { label: 'sample count' },
				length: { label: 'length' },
				alternate: { label: 'alternate' },
				falloff: { label: 'falloff' },
				angle: { label: 'angle deg' },
				colorize: { label: 'Colorize' },
				gradient: { label: 'Gradient map' },
				grad_shift: { label: 'Gradient shift' }
			}
		},
		bloom: {
			name: 'Bloom',
			params: {
				threshold: { label: 'Threshold' },
				softness: { label: 'Softness' },
				radius: { label: 'Radius' },
				intensity: { label: 'Intensity' }
			}
		},
		dither: {
			name: 'Dither',
			params: {
				pattern: {
					label: 'Pattern type',
					hint: 'Dot pattern (0–13). 13 = fine print; 6–7 = error-diffusion look.'
				},
				palette: {
					label: 'Palette type',
					hint: 'Palette (0–7). 7 = high-contrast ink B&W; 3 = Game Boy.'
				},
				colors: { label: 'Color count', hint: 'How many colors to keep. 13 ≈ effect.app default.' },
				distance: {
					label: 'Distance mode',
					hint: 'Color matching. 1 = natural (recommended); 0 = pure RGB math.'
				},
				strength: { label: 'Dither strength', hint: 'Grain strength. effect.app often uses 1.0–1.5.' },
				gamma: { label: 'Gamma', hint: 'Tonal curve. 2.7 gives strong B&W contrast.' },
				pixelStep: { label: 'Pixel step', hint: 'Block size. 1 = finest (effect.app default).' }
			}
		}
	},
	presets: {
		vintage_print: {
			name: 'Vintage print',
			group: 'OLD PAINTING',
			description:
				'RGB halftone overprint, soft bleed, Risograph grain, print stamp margin — tuned for effect.app.',
			layerLabels: [
				'CURVES',
				'LEVELS',
				'PAPER SCAN',
				'RGB HATCH',
				'SOFT BLEED',
				'RISO DITHER',
				'PAPER SCAN',
				'PRINT STAMP',
				'VIGNETTE'
			]
		},
		glitch_cyber: {
			name: 'Glitch cyber',
			group: 'DIGITAL',
			description: 'Digital corruption, neon bloom, and crushed vignette.',
			layerLabels: ['GLITCH DIGITAL', 'HUE/SAT', 'BLOOM', 'VIGNETTE']
		},
		lofi_vhs: {
			name: 'Lo-fi VHS',
			group: 'RETRO',
			description: 'Worn tape, CRT scanlines, warm duotone, and grain.',
			layerLabels: ['GLITCH VHS', 'CRT', 'NOISE', 'DUOTONE', 'VIGNETTE']
		},
		film_noir: {
			name: 'Film noir',
			group: 'FILM',
			description: 'Crushed curves, silver monochrome, overlay grain, heavy vignette.',
			layerLabels: ['CURVES', 'MONOCHROME', 'NOISE', 'VIGNETTE']
		}
	}
};
