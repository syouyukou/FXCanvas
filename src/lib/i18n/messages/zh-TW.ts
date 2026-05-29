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
	menu: {
		workspace: '工作區設定',
		mediaPreview: '媒體預覽',
		mediaPreviewHint: '按住 Space 可對照原圖',
		controls: '控制項',
		controlsSidebar: '側欄',
		controlsCorner: '角落',
		back: '返回'
	},
	app: {
		loadMedia: '載入媒體',
		undo: '復原 (⌘Z)',
		redo: '重做 (⌘⇧Z)',
		resizePanel: '調整效果面板寬度',
		noMedia: '尚未載入媒體',
		preview: '預覽',
		footerTip: '拖曳邊緣調整寬度 · 滾輪縮放 · ⌘Z 復原 · ⌘V 貼上 · 自動儲存工作階段',
		explore: '探索'
	},
	explore: {
		pageTitle: '影像特效庫',
		title: '影像特效庫',
		subtitle: '瀏覽策展特效。移入卡片可對照前後效果，點擊即可在編輯器中試用。',
		subtitleAnimated: '靜態圖片也能呈現內建動態的效果。點擊即可在編輯器中預覽。',
		tabs: { effects: '特效', animated: '動態' },
		search: '搜尋特效…',
		searchAnimated: '搜尋動態特效…',
		noResults: '找不到特效',
		noResultsAnimated: '找不到動態特效',
		navLabel: '主要導覽',
		navExplore: '探索',
		navEditor: '編輯器',
		openEditor: '開啟編輯器',
		footerTagline: '所有處理都在瀏覽器本地完成 — 媒體不會離開你的裝置。'
	},
	canvas: {
		dropImage: '將圖片拖放到這裡',
		orClickLoad: '或點擊載入媒體',
		pasteHint: '⌘V 從剪貼簿貼上',
		trySamples: '試試範例圖',
		creditBy: 'by',
		creditAria: '照片作者',
		original: '原圖',
		ariaCanvas: '畫布',
		ariaPreview: '預覽畫布'
	},
	samples: {
		biomech: '生物機械',
		illustration: '插畫',
		portrait: '人像',
		neon: '霓虹',
		night: '夜景'
	},
	timeline: {
		aria: '動畫時間軸',
		animation: '動畫',
		off: '關',
		play: '播放',
		pause: '暫停',
		duration: '長度',
		fps: '影格率',
		scrub: '拖曳時間軸',
		hint: '◆ 在圖層參數上加入 keyframe',
		toggleKeyframe: '在目前時間加入/移除 keyframe'
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
		tabs: {
			adjust: '微調',
			effects: '效果',
			animated: '動態',
			favorites: '收藏',
			presets: '預設'
		},
		adjustHint: '修正曝光、色調、銳利 — 單層精修。',
		effectsHint: '堆疊風格效果 — 點擊隨機 · Shift+點擊預設值。',
		searchAdjust: '搜尋微調…',
		searchEffects: '搜尋效果…',
		noAdjust: '找不到微調工具',
		tooltipAdjust: '{name} — 點擊加入圖層 · Shift+點擊：預設值',
		animatedSection: '動態效果',
		animBadge: '動態',
		expandPanel: '展開效果面板',
		collapsePanel: '收合效果面板',
		search: '搜尋…',
		searchAnimated: '搜尋動態效果…',
		searchPresets: '搜尋預設…',
		popular: '★ 熱門',
		noEffects: '找不到效果',
		noAnimated: '找不到動態效果',
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
		webm: 'WebM（動畫）',
		mp4: 'MP4（影片）',
		frames: '影格（PNG 序列）',
		animation: '長度',
		animationSource: '完整影片（{duration}）',
		animation5s: '5 秒',
		animation10s: '10 秒',
		durationCapped: '超過 {max} 秒的部分不會匯出',
		exportSummary: '約 {duration} · {frames} 格 @ {fps} FPS',
		frameRate: '影格率',
		downloadWebm: '下載 WebM',
		downloadMp4: '下載 MP4',
		downloadFrames: '下載影格序列',
		exporting: '匯出中…',
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
		adjust: '調整',
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
			'隨機',
			'Bayer 16×16',
			'XOR',
			'ADD',
			'Bayer 2×2',
			'Bayer 4×4',
			'Bayer 8×8',
			'橫線網',
			'直線網',
			'右斜網',
			'左斜網',
			'橫交叉線',
			'直交叉線',
			'鋸齒橫 4×4',
			'鋸齒直 4×4',
			'鋸齒橫 8×8',
			'鋸齒直 8×8',
			'棋盤',
			'魚網',
			'圓點 4×4',
			'圓點 8×8',
			'半調',
			'方塊 4×4'
		],
		palettes: [
			'Elevate',
			'Primaries',
			'Imperial',
			'Galaxy',
			'Ocean',
			'Sepia',
			'Neon',
			'Monochrome',
			'Wildberry',
			'Crystals',
			'Faded',
			'Sunny'
		],
		presets: {
			'effect-app': 'Imperial（Effect.app）',
			'mono-print': '高對比黑白',
			gameboy: '復古四色',
			halftone: '半調網點',
			neon: '霓虹'
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
				curves: { label: '曲線' },
				apply_mode: {
					label: '套用模式',
					hint: 'N = 一般，C = 色彩，L = 亮度。'
				}
			}
		},
		motion_blur: {
			name: '動態模糊',
			params: {
				strength: { label: '強度', hint: '模糊距離（像素）。' },
				angle: { label: '角度', hint: '方向（度）。' },
				box: { label: '方塊', hint: '使用方塊模糊而非高斯權重。' },
				both_directions: { label: '雙向', hint: '以像素為中心雙向模糊。' },
				enable_mask: { label: '啟用遮罩', hint: '將模糊限制在徑向區域。' },
				mask_center: { label: '遮罩中心' },
				mask_radius: { label: '遮罩半徑' },
				mask_falloff: { label: '遮罩衰減' }
			}
		},
		depth_of_field: {
			name: '景深',
			params: {
				center: { label: '對焦中心' },
				radius: { label: '半徑' },
				aspect: { label: '長寬拉伸' },
				mask_rotation: { label: '遮罩旋轉' },
				falloff: { label: '衰減' },
				max_radius: { label: '模糊強度' },
				samples: { label: '取樣數', hint: '越高越細緻、越慢。' },
				blades: { label: '光圈葉片' },
				roundness: { label: '葉片圓度' },
				aperture_rot: { label: '光圈旋轉' },
				feather: { label: '光圈羽化' },
				anamorphic: { label: '變形寬銀幕' },
				catadioptric: { label: '反射鏡頭' },
				invert_mask: { label: '反轉遮罩', hint: '對焦區外模糊（柔焦邊緣）。' }
			}
		},
		gradient_map: {
			name: '漸層對應',
			params: {
				gradient: { label: '漸層對應' },
				grad_shift: { label: '漸層位移', hint: '沿色階滑動漸層對應。' },
				grad_repeat: { label: '漸層重複', hint: '在明暗範圍內重複漸層。' }
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
		ink_bleed: {
			name: '墨水滲開',
			params: {
				spread: { label: 'Spread', hint: '暗部墨水向外擴散距離。' },
				decay: { label: 'Decay', hint: '擴散衰減。' },
				intensity: { label: 'Intensity' },
				direction: { label: 'Direction', hint: '主要滲開角度（度）。' },
				noise_size: { label: 'Noise size', hint: '方向微變化。' },
				grain: { label: 'Grain', hint: '紙纖維不均勻度。' },
				grain_size: { label: 'Grain size' }
			}
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
		stripe: {
			name: '條紋',
			params: {
				freq: { label: 'Repetitions' },
				w_min: { label: 'Min thickness' },
				w_max: { label: 'Max thickness' },
				angle: { label: 'Angle' },
				edge: { label: 'Edge softness' },
				pattern: { label: 'Pattern type' },
				scroll_speed: { label: 'Scroll speed' },
				led_mode: { label: 'Color mode' },
				phase_r: { label: 'Red phase' },
				phase_g: { label: 'Green phase' },
				phase_b: { label: 'Blue phase' },
				benday_mode: { label: 'Row shift' },
				shift_freq: { label: 'Row shift freq' },
				animate: { label: 'Animate' }
			}
		},
		cubify: {
			name: 'Cubify',
			params: {
				scale: { label: 'Cube size' },
				aspect: { label: 'Cube stretch' },
				strength: { label: 'Depth distortion' },
				hard: { label: 'Hard edges' },
				angle: { label: 'Rotation' },
				phase: { label: 'Position offset' },
				animate_speed: { label: 'Animation speed' },
				dispersion: { label: 'Dispersion' },
				animate: { label: 'Animate' }
			}
		},
		circular_blur: {
			name: 'Circular Blur',
			params: {
				radius: { label: 'Radius' },
				samples: { label: 'Repetitions' },
				passes: { label: 'Passes' },
				decay: { label: 'Pass decay' }
			}
		},
		rgb_shift: {
			name: 'RGB Shift',
			params: {
				amount: { label: 'Amount' },
				angle: { label: 'Angle' },
				animate: { label: 'Animate' }
			}
		},
		emboss: {
			name: '浮雕',
			params: {
				scale: { label: 'Scale', hint: '浮雕高度。' },
				color: { label: 'Color', hint: '保留原色（0 = 單色，100 = 全彩）。' },
				shadow_intensity: { label: 'Shadow intensity', hint: '陰影強度。' },
				light_dir: { label: 'Light direction' },
				light_ani: { label: 'Light angle offset', hint: '光源向量偏移。' },
				shadow_dir: { label: 'Shadow direction' },
				lock_shadow: { label: 'Lock shadow', hint: '陰影與光源對稱鎖定。' }
			}
		},
		threshold: {
			name: '閾值',
			params: {
				threshold: { label: 'Threshold', hint: '亮度切點（0–255）。' },
				edge_mode: { label: 'Edge mode', hint: '對邊緣做閾值而非平塗色調。' },
				offset_amount: { label: 'Offset amount', hint: '偏移切點。' },
				distance: { label: 'Distance', hint: '亮度與色彩距離混合。' },
				outline: { label: 'Outline', hint: '二值邊緣描邊寬度。' },
				outline_strength: { label: 'Outline strength' },
				outline_type: { label: 'Outline type' },
				blend_strength: { label: 'Blend strength' },
				blend_mode: { label: 'Blend mode' },
				color: { label: 'Color', hint: '暗部 / 低色調顏色。' }
			}
		},
		thermal: { name: '熱成像' },
		motion_trails: { name: '動態殘影' },
		blob_tracker: { name: '色塊追蹤' },
		layer_mix: { name: '圖層混合' },
		modulation_dither: {
			name: '調變網點',
			params: {
				mod_tc: { label: 'Modulation TC', hint: '波形頻率（時間常數）。' },
				mod_am: { label: 'AM', hint: '振幅調變 — 波形扭曲強度。' },
				wave_dir: { label: 'Wave direction' },
				dither_strength: { label: 'Dither strength' },
				pixel_step: { label: 'Pixel step', hint: '網點格大小（1 = 最細）。' },
				invert: { label: 'Invert', hint: '負片式色調反轉。' },
				gamma: { label: 'Gamma' },
				shadow: { label: 'Shadow' },
				highlight: { label: 'Highlight' },
				grid: { label: 'CRT grid', hint: '磷光柵格 + 掃描線。' },
				grain: { label: 'Grain' }
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
		rgb_hatch: {
			name: 'RGB Hatch',
			group: 'RGB HATCH',
			description: '垂直條紋、Cubify 折射、RGB 漂移 — 動畫設為 5s。',
			layerLabels: [
				'EXPOSURE',
				'GAUSSIAN BLUR',
				'NOISE',
				'RGB SHIFT',
				'CUBIFY',
				'STRIPE',
				'CIRCULAR BLUR',
				'BLUR/SHARP',
				'LEVELS',
				'HUE/SAT',
				'MOTION BLUR'
			]
		},
		vintage_print: {
			name: '復古印刷',
			group: '古典繪畫',
			description: 'RGB 套印错位、墨水滲開、印刷留白 — Risograph 質感，不是一般復古濾鏡。',
			layerLabels: ['色階', '紙紋', 'RGB 網點', '滲墨', '印刷邊框', '暗角']
		},
		cyanotype: {
			name: '藍曬',
			group: '古典繪畫',
			description: '普魯士藍曬印、硬剪影 — 冷色化學感，無暖色紙紋。',
			layerLabels: ['色階', '雙色調', '單色', '門檻', '網點', '暗角']
		},
		soft_editorial: {
			name: '柔光編輯',
			group: '編輯',
			description: '霧面漸層 + 邊緣柔焦 — 中心清晰，適合人像。',
			layerLabels: ['曝光', '色階', '漸層對應', '邊緣模糊', '暗角']
		},
		lofi_vhs: {
			name: 'Lo-fi VHS',
			group: '復古',
			description: '家用錄影帶：跳軌、CRT、洋紅暗部 — 動畫設 5 秒。',
			layerLabels: ['VHS 故障', 'CRT', '雙色調', '顆粒', '暗角']
		},
		film_noir: {
			name: '黑色電影',
			group: '底片',
			description: '硬 S 曲線銀調、暗部顆粒、重暗角。',
			layerLabels: ['曲線', '色階', '單色', '銳利', '顆粒', '暗角']
		},
		glitch_cyber: {
			name: '賽博故障',
			group: '數位',
			description: '數位壞檔、霓虹光暈、壓暗暗角。',
			layerLabels: ['數位故障', '色相/飽和', '光暈', '暗角']
		}
	}
};
