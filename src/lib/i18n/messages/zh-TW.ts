import type { MessageTree } from '../types';

export const zhTW: MessageTree = {
	lang: {
		switchLanguage: '切換語言',
		zhTW: '繁體中文',
		zhCN: '简体中文',
		ja: '日本語',
		en: 'English',
		enZh: 'English & 中文'
	},
	app: {
		loadMedia: '載入媒體',
		undo: '復原 (⌘Z)',
		redo: '重做 (⌘⇧Z)',
		resizePanel: '調整效果面板寬度',
		noMedia: '尚未載入媒體',
		preview: '預覽',
		footerTip: '拖曳邊緣調整寬度 · 滾輪縮放 · ⌘Z 復原 · ⌘V 貼上 · 自動儲存工作階段'
	},
	canvas: {
		dropImage: '將圖片拖放到這裡',
		orClickLoad: '或點擊載入媒體',
		pasteHint: '⌘V 從剪貼簿貼上',
		original: '原圖',
		ariaCanvas: '畫布',
		ariaPreview: '預覽畫布'
	},
	layers: {
		title: '圖層',
		clearAll: '全部清除',
		controls: '控制項',
		opacity: '不透明度',
		blendMode: '混合',
		blendModes: {
			normal: '正常',
			multiply: '相乘',
			screen: '濾色',
			overlay: '疊加',
			'soft-light': '柔光'
		},
		empty: '尚未套用效果。',
		emptyHint: '點選左側效果以加入。',
		selectHint: '點選圖層以調整參數',
		on: '開',
		off: '關',
		collapse: '收合',
		expand: '展開',
		removeGroup: '移除預設群組',
		hideGroup: '隱藏群組',
		showGroup: '顯示群組',
		duplicate: '複製',
		delete: '刪除',
		hide: '隱藏',
		show: '顯示',
		randomize: '隨機',
		reset: '重設',
		oneClickStyle: '一鍵風格',
		applyDitherPreset: '套用 {label} 參數',
		applyGlitchPreset: '套用 {label}',
		groupFallback: '群組',
		drag: '拖曳'
	},
	effectsPanel: {
		tabs: { effects: '效果', favorites: '收藏', presets: '預設' },
		expandPanel: '展開效果面板',
		collapsePanel: '收合效果面板',
		search: '搜尋…',
		searchPresets: '搜尋預設…',
		popular: '★ 熱門',
		noEffects: '找不到效果',
		noPresets: '找不到預設',
		layersCount: '{n} 層',
		layersPrefix: '圖層：',
		favorite: '收藏',
		tooltipWithThumb: '{name} — 移入看原圖 · 點擊：隨機 · Shift+點擊：預設值',
		tooltipNoThumb: '{name} — 點擊加入圖層',
		presetAbbr: 'VP'
	},
	presetsMenu: {
		title: '預設',
		tooltip: '儲存 / 載入效果堆疊',
		namePlaceholder: '預設名稱…',
		save: '儲存',
		saveCurrent: '儲存目前堆疊…',
		empty: '尚無已儲存的預設',
		deletePreset: '刪除預設',
		autoName: '預設 {n}'
	},
	export: {
		title: '匯出',
		format: '格式',
		size: '尺寸',
		png: 'PNG',
		jpeg: 'JPEG',
		webp: 'WebP',
		downloadLayers: '下載圖層 PNG 序列',
		sizeLabel: '{label} — {w} × {h}',
		px: '{w} × {h} px',
		exceedsLimit: '超過 {max}px 上限 — 請選較小尺寸',
		download: '下載',
		sizes: {
			half: '0.5×',
			'1x': '1× 原始',
			'2x': '2×',
			'3x': '3×',
			'4x': '4×',
			'1080p': '1080p（長邊）',
			'4k': '4K（長邊）'
		}
	},
	gradient: {
		hint: '拖曳移動 · 點色票變更顏色'
	},
	categories: {
		blur: '模糊',
		color: '色彩',
		film: '膠片',
		distort: '扭曲',
		effects: '效果',
		generate: '生成'
	},
	dither: {
		distance: { rgb: 'RGB', natural: '自然' },
		patterns: [
			'Bayer 小格',
			'Bayer 中格',
			'Bayer 大格',
			'網點',
			'斜線',
			'藍噪點',
			'Floyd 風',
			'Atkinson 風',
			'交叉線',
			'雜點',
			'Sierra 風',
			'Stucki 風',
			'半調網點',
			'細緻印刷'
		],
		palettes: [
			'黑白',
			'灰階',
			'RGB 量化',
			'Game Boy',
			'CGA 四色',
			'EGA 16 色',
			'復古印刷',
			'墨水黑白'
		],
		presets: {
			'effect-app': '高對比黑白',
			gameboy: 'Game Boy',
			'bw-print': '黑白印刷',
			riso: '復古印刷',
			ega: 'EGA 復古'
		}
	},
	glitch: {
		digital: {
			subtle: '輕微壞檔',
			cyber: 'Cyberpunk',
			broken: '嚴重損壞'
		},
		vhs: {
			subtle: '輕微 VHS',
			worn: '舊磁帶',
			broken: '壞掉 VCR'
		}
	},
	effects: {
		gaussian_blur: { name: '高斯模糊', params: { radius: { label: '半徑' } } },
		sharpen: {
			name: '銳化',
			params: {
				amount: { label: '強度', hint: '銳化強度。' },
				radius: { label: '半徑', hint: '反銳化遮罩的模糊半徑。' },
				threshold: { label: '閾值', hint: '低於此值的差異會被忽略。' }
			}
		},
		curves: {
			name: '曲線',
			params: {
				shadows: { label: '暗部', hint: '提亮或壓暗暗部。' },
				darks: { label: '深調', hint: '調整四分之一色調。' },
				lights: { label: '淺調', hint: '調整四分之三色調。' },
				highlights: { label: '亮部', hint: '壓縮或拉開高光。' }
			}
		},
		exposure: {
			name: '曝光',
			params: {
				exposure: {
					label: '曝光',
					hint: '曝光量（EV）。調高畫面變亮，適合搭配 Dither 做高對比黑白。'
				},
				offset: { label: '偏移', hint: '整體明暗偏移。微調中間調。' },
				gamma: { label: '伽馬', hint: '伽馬曲線。配合 Dither 時可拉開明暗。' }
			}
		},
		levels: {
			name: '色階',
			params: {
				shadows: { label: '暗部', hint: '調高提亮陰影，調低壓暗暗部。' },
				midtones: { label: '中間調', hint: '調整整體明暗平衡。' },
				highlights: { label: '亮部', hint: '調低可壓縮高光。' }
			}
		},
		brightness_contrast: {
			name: '亮度 / 對比',
			params: { brightness: { label: '亮度' }, contrast: { label: '對比' } }
		},
		hue_saturation: {
			name: '色相 / 飽和',
			params: { hue: { label: '色相' }, saturation: { label: '飽和度' } }
		},
		duotone: {
			name: '雙色調',
			params: { shadow: { label: '暗部色' }, highlight: { label: '亮部色' } }
		},
		monochrome: {
			name: '單色',
			params: { mix: { label: '混合' }, tint: { label: '色調' } }
		},
		noise: {
			name: '雜訊',
			params: {
				amount: { label: '強度' },
				size: { label: '大小' },
				chroma: { label: '色度' },
				shadow: { label: '暗部' },
				midtone: { label: '中間調' },
				highlight: { label: '亮部' }
			}
		},
		rgb_halftone: {
			name: 'RGB 半調',
			params: {
				cellSize: { label: '網點大小', hint: '網點大小（像素）。3–5 最接近 effect.app。' },
				gamma: { label: '伽馬' },
				contrast: { label: '對比' },
				saturation: { label: '飽和度', hint: '套色前飽和度，保留粉/青網點。' },
				misregister: { label: '套印偏移' },
				dotGain: { label: '網點增益' },
				sharpness: { label: '網點銳利' },
				inkBleed: { label: '墨水滲透' },
				angleR: { label: '角度 R' },
				angleG: { label: '角度 G' },
				angleB: { label: '角度 B' }
			}
		},
		soft_bleed: {
			name: '柔和滲墨',
			params: { amount: { label: '滲墨' }, radius: { label: '半徑' } }
		},
		paper_grain: {
			name: '紙紋',
			params: {
				amount: { label: '強度' },
				scale: { label: '顆粒大小' },
				contrast: { label: '對比' },
				warmth: { label: '紙色暖度' },
				blend: { label: '混合', hint: '0=原圖疊紋，1=全 overlay 紙紋。' }
			}
		},
		print_stamp: {
			name: '印刷邊框',
			params: {
				margin: { label: '邊距' },
				fade: { label: '邊緣淡化' },
				roughness: { label: '邊緣粗糙' },
				paperColor: { label: '紙色' }
			}
		},
		glitch_digital: {
			name: '數位故障',
			params: {
				block_size: { label: '區塊大小', hint: '故障區塊大小。越大越像大塊 JPEG 壞檔。' },
				displacement: { label: '位移' },
				block_opacity: { label: '區塊透明度' },
				color_split: { label: '色彩分離' },
				line_tear: { label: '撕裂線' },
				pixelate: { label: '像素化' },
				seed: { label: '種子' }
			}
		},
		glitch_vhs: {
			name: 'VHS 故障',
			params: {
				grain: { label: '顆粒', hint: '類比膠片顆粒。' },
				glitch_blocks: { label: '故障區塊' },
				rgb_shift: { label: 'RGB 偏移' },
				scanlines: { label: '掃描線', hint: 'CRT 掃描線。' },
				noise: { label: '雜訊' },
				distortion: { label: '扭曲' },
				seed: { label: '種子' }
			}
		},
		crt: {
			name: 'CRT 螢幕',
			params: {
				scan_intensity: { label: '掃描線' },
				curvature: { label: '曲率' },
				rgb_shift: { label: 'RGB 偏移' }
			}
		},
		vignette: {
			name: '暗角',
			params: { strength: { label: '強度' }, softness: { label: '柔和' } }
		},
		pixelate: {
			name: '像素化',
			params: { size: { label: '像素大小' } }
		},
		star_glow: {
			name: '星芒',
			params: {
				highlight_boost: { label: '高光提升' },
				streaks: { label: '光線' },
				samples: { label: '取樣數' },
				length: { label: '長度' },
				alternate: { label: '交替' },
				falloff: { label: '衰減' },
				angle: { label: '角度' },
				colorize: { label: '上色' },
				gradient: { label: '漸層對應' },
				grad_shift: { label: '漸層偏移' }
			}
		},
		bloom: {
			name: '光暈',
			params: {
				threshold: { label: '閾值' },
				softness: { label: '柔和' },
				radius: { label: '半徑' },
				intensity: { label: '強度' }
			}
		},
		dither: {
			name: '網點化',
			params: {
				pattern: {
					label: '花紋類型',
					hint: '點點花紋（0–13）。13=細緻印刷感，6–7=誤差擴散風格。'
				},
				palette: {
					label: '配色類型',
					hint: '配色（0–7）。7=高對比黑白墨水，3=Game Boy。'
				},
				colors: { label: '顏色數', hint: '保留幾種顏色。13 接近 Effect.app 預設。' },
				distance: {
					label: '距離模式',
					hint: '怎麼配相近顏色。1=較自然（建議）；0=純 RGB 數學。'
				},
				strength: { label: '網點強度', hint: '顆粒強度。Effect.app 常用 1.0–1.5。' },
				gamma: { label: '伽馬', hint: '明暗曲線。2.7 可做出強烈黑白對比。' },
				pixelStep: { label: '像素步進', hint: '像素塊大小。1=最細緻（Effect.app 預設）。' }
			}
		}
	},
	presets: {
		vintage_print: {
			name: '復古印刷',
			group: '古典繪畫',
			description: 'RGB 半調套印、柔和滲墨、Riso 紙紋、印刷邊框 — 對齊 effect.app 質感。',
			layerLabels: [
				'曲線',
				'色階',
				'紙紋掃描',
				'RGB 網點',
				'柔和滲墨',
				'RISO 網點',
				'紙紋掃描',
				'印刷邊框',
				'暗角'
			]
		},
		glitch_cyber: {
			name: '賽博故障',
			group: '數位',
			description: '數位壞檔、霓虹光暈、壓暗暗角。',
			layerLabels: ['數位故障', '色相/飽和', '光暈', '暗角']
		},
		lofi_vhs: {
			name: 'Lo-fi VHS',
			group: '復古',
			description: '舊磁帶、CRT 掃描線、暖色雙色調、顆粒。',
			layerLabels: ['VHS 故障', 'CRT', '噪點', '雙色調', '暗角']
		},
		film_noir: {
			name: '黑色電影',
			group: '底片',
			description: '壓縮曲線、銀色單色、疊加顆粒、重暗角。',
			layerLabels: ['曲線', '單色', '噪點', '暗角']
		}
	}
};
