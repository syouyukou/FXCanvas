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
			'Drag edge to resize · Scroll zoom · ⌘Z undo · ⌘V paste · Session auto-saves'
	},
	canvas: {
		dropImage: 'Drop an image here',
		orClickLoad: 'or click Load Media',
		pasteHint: '⌘V to paste from clipboard',
		original: 'ORIGINAL',
		ariaCanvas: 'Canvas',
		ariaPreview: 'Preview canvas'
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
		tabs: { effects: 'EFFECTS', favorites: 'FAVORITES', presets: 'PRESETS' },
		animatedSection: 'ANIMATED',
		animBadge: 'ANIM',
		expandPanel: 'Expand effects panel',
		collapsePanel: 'Collapse effects panel',
		search: 'Search…',
		searchPresets: 'Search presets…',
		popular: '★ MOST POPULAR',
		noEffects: 'No effects found',
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
		animation: 'Animation',
		animation5s: '5 seconds',
		animation10s: '10 seconds',
		frameRate: 'Frame rate',
		downloadWebm: 'Download WebM',
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
				shadows: { label: 'Shadows', hint: 'Lift or crush deep shadows.' },
				darks: { label: 'Darks', hint: 'Adjust quarter-tone response.' },
				lights: { label: 'Lights', hint: 'Adjust three-quarter tones.' },
				highlights: { label: 'Highlights', hint: 'Compress or open highlight roll-off.' }
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
