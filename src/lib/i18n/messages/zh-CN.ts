import type { MessageTree } from '../types';

/** Simplified Chinese — UI + metadata (effects mirror zh-TW where shared). */
export const zhCN: MessageTree = {
	lang: {
		switchLanguage: '切换语言',
		zhTW: '繁體中文',
		zhCN: '简体中文',
		ja: '日本語',
		en: 'English',
		enZh: 'English & 中文'
	},
	app: {
		loadMedia: '载入媒体',
		undo: '撤销 (⌘Z)',
		redo: '重做 (⌘⇧Z)',
		resizePanel: '调整效果面板宽度',
		noMedia: '尚未载入媒体',
		preview: '预览',
		footerTip: '拖拽边缘调整宽度 · 滚轮缩放 · ⌘Z 撤销 · ⌘V 粘贴 · 自动保存会话'
	},
	canvas: {
		dropImage: '将图片拖放到这里',
		orClickLoad: '或点击载入媒体',
		pasteHint: '⌘V 从剪贴板粘贴',
		original: '原图',
		ariaCanvas: '画布',
		ariaPreview: '预览画布'
	},
	timeline: {
		aria: '动画时间轴',
		play: '播放',
		pause: '暂停',
		duration: '长度',
		fps: '帧率',
		scrub: '拖动时间轴',
		hint: '◆ 在图层参数上添加关键帧',
		toggleKeyframe: '在当前时间添加/移除关键帧'
	},
	layers: {
		title: '图层',
		clearAll: '全部清除',
		controls: '控制项',
		opacity: '不透明度',
		blendMode: '混合',
		blendModes: {
			normal: '正常',
			multiply: '相乘',
			screen: '滤色',
			overlay: '叠加',
			'soft-light': '柔光'
		},
		empty: '尚未应用效果。',
		emptyHint: '点击左侧效果以添加。',
		selectHint: '点击图层以调整参数',
		on: '开',
		off: '关',
		collapse: '折叠',
		expand: '展开',
		removeGroup: '移除预设组',
		hideGroup: '隐藏组',
		showGroup: '显示组',
		duplicate: '复制',
		delete: '删除',
		hide: '隐藏',
		show: '显示',
		randomize: '随机',
		reset: '重置',
		oneClickStyle: '一键风格',
		applyDitherPreset: '应用 {label} 参数',
		applyGlitchPreset: '应用 {label}',
		groupFallback: '组',
		drag: '拖拽'
	},
	effectsPanel: {
		tabs: { effects: '效果', favorites: '收藏', presets: '预设' },
		animatedSection: '动态效果',
		animBadge: '动态',
		expandPanel: '展开效果面板',
		collapsePanel: '折叠效果面板',
		search: '搜索…',
		searchPresets: '搜索预设…',
		popular: '★ 热门',
		noEffects: '找不到效果',
		noPresets: '找不到预设',
		layersCount: '{n} 层',
		layersPrefix: '图层：',
		favorite: '收藏',
		tooltipWithThumb: '{name} — 悬停看原图 · 点击：随机 · Shift+点击：默认值',
		tooltipNoThumb: '{name} — 点击添加图层',
		presetAbbr: 'VP'
	},
	presetsMenu: {
		title: '预设',
		tooltip: '保存 / 加载效果堆栈',
		namePlaceholder: '预设名称…',
		save: '保存',
		saveCurrent: '保存当前堆栈…',
		empty: '尚无已保存的预设',
		deletePreset: '删除预设',
		autoName: '预设 {n}'
	},
	export: {
		title: '导出',
		format: '格式',
		size: '尺寸',
		png: 'PNG',
		jpeg: 'JPEG',
		webp: 'WebP',
		webm: 'WebM（动画）',
		animation: '动画长度',
		animation5s: '5 秒',
		animation10s: '10 秒',
		frameRate: '帧率',
		downloadWebm: '下载 WebM',
		exporting: '导出中…',
		downloadLayers: '下载图层 PNG 序列',
		sizeLabel: '{label} — {w} × {h}',
		px: '{w} × {h} px',
		exceedsLimit: '超过 {max}px 上限 — 请选择较小尺寸',
		download: '下载',
		sizes: {
			half: '0.5×',
			'1x': '1× 原始',
			'2x': '2×',
			'3x': '3×',
			'4x': '4×',
			'1080p': '1080p（长边）',
			'4k': '4K（长边）'
		}
	},
	gradient: { hint: '拖拽移动 · 点击色块更改颜色' },
	categories: {
		blur: '模糊',
		color: '色彩',
		film: '胶片',
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
			'网点',
			'斜线',
			'蓝噪点',
			'Floyd 风',
			'Atkinson 风',
			'交叉线',
			'杂点',
			'Sierra 风',
			'Stucki 风',
			'半调网点',
			'细致印刷'
		],
		palettes: [
			'黑白',
			'灰阶',
			'RGB 量化',
			'Game Boy',
			'CGA 四色',
			'EGA 16 色',
			'复古印刷',
			'墨水黑白'
		],
		presets: {
			'effect-app': '高对比黑白',
			gameboy: 'Game Boy',
			'bw-print': '黑白印刷',
			riso: '复古印刷',
			ega: 'EGA 复古'
		}
	},
	glitch: {
		digital: { subtle: '轻微坏档', cyber: 'Cyberpunk', broken: '严重损坏' },
		vhs: { subtle: '轻微 VHS', worn: '旧磁带', broken: '坏掉 VCR' }
	},
	effects: {
		gaussian_blur: { name: '高斯模糊', params: { radius: { label: '半径' } } },
		sharpen: {
			name: '锐化',
			params: {
				amount: { label: '强度', hint: '锐化强度。' },
				radius: { label: '半径', hint: '反锐化蒙版的模糊半径。' },
				threshold: { label: '阈值', hint: '低于此值的差异会被忽略。' }
			}
		},
		curves: {
			name: '曲线',
			params: {
				shadows: { label: '暗部', hint: '提亮或压暗暗部。' },
				darks: { label: '深调', hint: '调整四分之一色调。' },
				lights: { label: '浅调', hint: '调整四分之三色调。' },
				highlights: { label: '亮部', hint: '压缩或拉开高光。' }
			}
		},
		exposure: {
			name: '曝光',
			params: {
				exposure: {
					label: '曝光',
					hint: '曝光量（EV）。调高画面变亮，适合搭配 Dither 做高对比黑白。'
				},
				offset: { label: '偏移', hint: '整体明暗偏移。微调中间调。' },
				gamma: { label: '伽马', hint: '伽马曲线。配合 Dither 时可拉开明暗。' }
			}
		},
		levels: {
			name: '色阶',
			params: {
				shadows: { label: '暗部', hint: '调高提亮阴影，调低压暗暗部。' },
				midtones: { label: '中间调', hint: '调整整体明暗平衡。' },
				highlights: { label: '亮部', hint: '调低可压缩高光。' }
			}
		},
		brightness_contrast: {
			name: '亮度 / 对比',
			params: { brightness: { label: '亮度' }, contrast: { label: '对比' } }
		},
		hue_saturation: {
			name: '色相 / 饱和',
			params: { hue: { label: '色相' }, saturation: { label: '饱和度' } }
		},
		duotone: {
			name: '双色调',
			params: { shadow: { label: '暗部色' }, highlight: { label: '亮部色' } }
		},
		monochrome: {
			name: '单色',
			params: { mix: { label: '混合' }, tint: { label: '色调' } }
		},
		noise: {
			name: '噪点',
			params: {
				amount: { label: '强度' },
				size: { label: '大小' },
				chroma: { label: '色度' },
				shadow: { label: '暗部' },
				midtone: { label: '中间调' },
				highlight: { label: '亮部' }
			}
		},
		rgb_halftone: {
			name: 'RGB 半调',
			params: {
				cellSize: { label: '网点大小', hint: '网点大小（像素）。3–5 最接近 effect.app。' },
				gamma: { label: '伽马' },
				contrast: { label: '对比' },
				saturation: { label: '饱和度', hint: '套色前饱和度，保留粉/青网点。' },
				misregister: { label: '套印偏移' },
				dotGain: { label: '网点增益' },
				sharpness: { label: '网点锐利' },
				inkBleed: { label: '墨水渗透' },
				angleR: { label: '角度 R' },
				angleG: { label: '角度 G' },
				angleB: { label: '角度 B' }
			}
		},
		soft_bleed: {
			name: '柔和渗墨',
			params: { amount: { label: '渗墨' }, radius: { label: '半径' } }
		},
		paper_grain: {
			name: '纸纹',
			params: {
				amount: { label: '强度' },
				scale: { label: '颗粒大小' },
				contrast: { label: '对比' },
				warmth: { label: '纸色暖度' },
				blend: { label: '混合', hint: '0=原图叠纹，1=全 overlay 纸纹。' }
			}
		},
		print_stamp: {
			name: '印刷边框',
			params: {
				margin: { label: '边距' },
				fade: { label: '边缘淡化' },
				roughness: { label: '边缘粗糙' },
				paperColor: { label: '纸色' }
			}
		},
		glitch_digital: {
			name: '数字故障',
			params: {
				block_size: { label: '区块大小', hint: '故障区块大小。越大越像大块 JPEG 坏档。' },
				displacement: { label: '位移' },
				block_opacity: { label: '区块透明度' },
				color_split: { label: '色彩分离' },
				line_tear: { label: '撕裂线' },
				pixelate: { label: '像素化' },
				seed: { label: '种子' }
			}
		},
		glitch_vhs: {
			name: 'VHS 故障',
			params: {
				grain: { label: '颗粒', hint: '模拟胶片颗粒。' },
				glitch_blocks: { label: '故障区块' },
				rgb_shift: { label: 'RGB 偏移' },
				scanlines: { label: '扫描线', hint: 'CRT 扫描线。' },
				noise: { label: '噪点' },
				distortion: { label: '扭曲' },
				seed: { label: '种子' }
			}
		},
		crt: {
			name: 'CRT 屏幕',
			params: {
				scan_intensity: { label: '扫描线' },
				curvature: { label: '曲率' },
				rgb_shift: { label: 'RGB 偏移' }
			}
		},
		vignette: {
			name: '暗角',
			params: { strength: { label: '强度' }, softness: { label: '柔和' } }
		},
		pixelate: {
			name: '像素化',
			params: { size: { label: '像素大小' } }
		},
		star_glow: {
			name: '星芒',
			params: {
				highlight_boost: { label: '高光提升' },
				streaks: { label: '光线' },
				samples: { label: '取样数' },
				length: { label: '长度' },
				alternate: { label: '交替' },
				falloff: { label: '衰减' },
				angle: { label: '角度' },
				colorize: { label: '上色' },
				gradient: { label: '渐变映射' },
				grad_shift: { label: '渐变偏移' }
			}
		},
		bloom: {
			name: '光晕',
			params: {
				threshold: { label: '阈值' },
				softness: { label: '柔和' },
				radius: { label: '半径' },
				intensity: { label: '强度' }
			}
		},
		dither: {
			name: '网点化',
			params: {
				pattern: {
					label: '花纹类型',
					hint: '点点花纹（0–13）。13=细致印刷感，6–7=误差扩散风格。'
				},
				palette: {
					label: '配色类型',
					hint: '配色（0–7）。7=高对比黑白墨水，3= Game Boy。'
				},
				colors: { label: '颜色数', hint: '保留几种颜色。13 接近 Effect.app 预设。' },
				distance: {
					label: '距离模式',
					hint: '如何配相近颜色。1=较自然（建议）；0=纯 RGB 数学。'
				},
				strength: { label: '网点强度', hint: '颗粒强度。Effect.app 常用 1.0–1.5。' },
				gamma: { label: '伽马', hint: '明暗曲线。2.7 可做出强烈黑白对比。' },
				pixelStep: { label: '像素步进', hint: '像素块大小。1=最细致（Effect.app 预设）。' }
			}
		}
	},
	presets: {
		vintage_print: {
			name: '复古印刷',
			group: '古典绘画',
			description: 'RGB 半调套印、柔和渗墨、Riso 纸纹、印刷边框 — 对齐 effect.app 质感。',
			layerLabels: [
				'曲线',
				'色阶',
				'纸纹扫描',
				'RGB 网点',
				'柔和渗墨',
				'RISO 网点',
				'纸纹扫描',
				'印刷边框',
				'暗角'
			]
		},
		glitch_cyber: {
			name: '赛博故障',
			group: '数字',
			description: '数字坏档、霓虹光晕、压暗暗角。',
			layerLabels: ['数字故障', '色相/饱和', '光晕', '暗角']
		},
		lofi_vhs: {
			name: 'Lo-fi VHS',
			group: '复古',
			description: '旧磁带、CRT 扫描线、暖色双色调、颗粒。',
			layerLabels: ['VHS 故障', 'CRT', '噪点', '双色调', '暗角']
		},
		film_noir: {
			name: '黑色电影',
			group: '胶片',
			description: '压缩曲线、银色单色、叠加颗粒、重暗角。',
			layerLabels: ['曲线', '单色', '噪点', '暗角']
		}
	}
};
