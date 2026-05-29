import type { MessageTree } from '../types';

export const ja: MessageTree = {
	lang: {
		switchLanguage: '言語を切り替え',
		zhTW: '繁體中文',
		zhCN: '简体中文',
		ja: '日本語',
		en: 'English',
		enZh: 'English & 中文'
	},
	app: {
		loadMedia: 'メディアを読み込む',
		undo: '元に戻す (⌘Z)',
		redo: 'やり直し (⌘⇧Z)',
		resizePanel: 'エフェクトパネルの幅を変更',
		noMedia: 'メディア未読み込み',
		preview: 'プレビュー',
		footerTip:
			'端をドラッグで幅変更 · スクロールでズーム · ⌘Z 元に戻す · ⌘V 貼り付け · セッション自動保存',
		explore: '探索'
	},
	explore: {
		pageTitle: '画像エフェクトライブラリ',
		title: '画像エフェクトライブラリ',
		subtitle:
			'厳選エフェクトを閲覧。ホバーでビフォーアフター、クリックでエディターで試せます。',
		subtitleAnimated:
			'静止画でも組み込みモーションが再生されるエフェクト。クリックでエディターでプレビュー。',
		tabs: { effects: 'エフェクト', animated: 'アニメ' },
		search: 'エフェクトを検索…',
		searchAnimated: 'アニメエフェクトを検索…',
		noResults: 'エフェクトが見つかりません',
		noResultsAnimated: 'アニメエフェクトが見つかりません',
		navLabel: 'メイン',
		navExplore: '探索',
		navEditor: 'エディター',
		openEditor: 'エディターを開く',
		footerTagline: 'ブラウザ内でローカル処理 — メディアは端末から送信されません。'
	},
	canvas: {
		dropImage: 'ここに画像をドロップ',
		orClickLoad: 'またはメディアを読み込む',
		pasteHint: '⌘V でクリップボードから貼り付け',
		trySamples: 'サンプル画像を試す',
		creditBy: 'by',
		creditAria: '写真クレジット',
		original: 'オリジナル',
		ariaCanvas: 'キャンバス',
		ariaPreview: 'プレビューキャンバス'
	},
	samples: {
		biomech: 'バイオメカ',
		illustration: 'イラスト',
		portrait: 'ポートレート',
		neon: 'ネオン',
		night: '夜景'
	},
	timeline: {
		aria: 'アニメーションタイムライン',
		play: '再生',
		pause: '一時停止',
		duration: '長さ',
		fps: 'フレームレート',
		scrub: 'タイムラインをスクラブ',
		hint: '◆ レイヤーパラメータにキーフレームを追加',
		toggleKeyframe: '現在位置でキーフレームを切替'
	},
	layers: {
		title: 'レイヤー',
		clearAll: 'すべてクリア',
		controls: 'コントロール',
		opacity: '不透明度',
		blendMode: '合成',
		blendModes: {
			normal: '通常',
			multiply: '乗算',
			screen: 'スクリーン',
			overlay: 'オーバーレイ',
			'soft-light': 'ソフトライト'
		},
		empty: 'エフェクトがありません。',
		emptyHint: '左のエフェクトをクリックして追加。',
		selectHint: 'レイヤーをクリックして調整',
		on: 'ON',
		off: 'OFF',
		collapse: '折りたたむ',
		expand: '展開',
		removeGroup: 'プリセットグループを削除',
		hideGroup: 'グループを非表示',
		showGroup: 'グループを表示',
		duplicate: '複製',
		delete: '削除',
		hide: '非表示',
		show: '表示',
		randomize: 'ランダム',
		reset: 'リセット',
		oneClickStyle: 'クイックスタイル',
		applyDitherPreset: '{label} を適用',
		applyGlitchPreset: '{label} を適用',
		groupFallback: 'グループ',
		drag: 'ドラッグ'
	},
	effectsPanel: {
		tabs: { effects: 'エフェクト', animated: 'アニメ', favorites: 'お気に入り', presets: 'プリセット' },
		animatedSection: 'アニメ',
		animBadge: 'ANIM',
		expandPanel: 'エフェクトパネルを展開',
		collapsePanel: 'エフェクトパネルを折りたたむ',
		search: '検索…',
		searchAnimated: 'アニメを検索…',
		searchPresets: 'プリセットを検索…',
		popular: '★ 人気',
		noEffects: 'エフェクトが見つかりません',
		noAnimated: 'アニメエフェクトが見つかりません',
		noPresets: 'プリセットが見つかりません',
		layersCount: '{n} レイヤー',
		layersPrefix: 'レイヤー：',
		favorite: 'お気に入り',
		tooltipWithThumb: '{name} — ホバーで原図 · クリック：ランダム · Shift+クリック：デフォルト',
		tooltipNoThumb: '{name} — クリックで追加',
		presetAbbr: 'VP'
	},
	presetsMenu: {
		title: 'プリセット',
		tooltip: 'スタックの保存 / 読み込み',
		namePlaceholder: 'プリセット名…',
		save: '保存',
		saveCurrent: '現在のスタックを保存…',
		empty: '保存済みプリセットはありません',
		deletePreset: 'プリセットを削除',
		autoName: 'プリセット {n}'
	},
	export: {
		title: '書き出し',
		format: '形式',
		size: 'サイズ',
		png: 'PNG',
		jpeg: 'JPEG',
		webp: 'WebP',
		webm: 'WebM（アニメ）',
		mp4: 'MP4（動画）',
		animation: '長さ',
		animationSource: '動画全体（{duration}）',
		animation5s: '5 秒',
		animation10s: '10 秒',
		durationCapped: '{max} 秒を超える部分は書き出されません',
		exportSummary: '約 {duration} · {frames} フレーム @ {fps} FPS',
		frameRate: 'フレームレート',
		downloadWebm: 'WebM をダウンロード',
		downloadMp4: 'MP4 をダウンロード',
		exporting: '書き出し中…',
		downloadLayers: 'レイヤー PNG シーケンス',
		sizeLabel: '{label} — {w} × {h}',
		px: '{w} × {h} px',
		exceedsLimit: '{max}px の上限を超えています — 小さいサイズを選択',
		download: 'ダウンロード',
		sizes: {
			half: '0.5×',
			'1x': '1× オリジナル',
			'2x': '2×',
			'3x': '3×',
			'4x': '4×',
			'1080p': '1080p（長辺）',
			'4k': '4K（長辺）'
		}
	},
	gradient: { hint: 'ドラッグで移動 · スウォッチをクリックで色変更' },
	categories: {
		blur: 'ぼかし',
		color: 'カラー',
		film: 'フィルム',
		distort: '歪み',
		effects: 'エフェクト',
		generate: '生成'
	},
	dither: {
		distance: { rgb: 'RGB', natural: '自然' },
		patterns: [
			'Bayer 2×2',
			'Bayer 4×4',
			'Bayer 8×8',
			'ハーフトーン',
			'斜線',
			'ブルーノイズ',
			'Floyd風',
			'Atkinson風',
			'クロスハッチ',
			'グレイン',
			'Sierra風',
			'Stucki風',
			'ドット',
			'細印刷'
		],
		palettes: [
			'白黒',
			'グレー',
			'RGB量子化',
			'ゲームボーイ',
			'CGA 4色',
			'EGA 16色',
			'リソグラフ',
			'インク白黒'
		],
		presets: {
			'effect-app': '高コントラスト白黒',
			gameboy: 'ゲームボーイ',
			'bw-print': '白黒印刷',
			riso: 'リソグラフ',
			ega: 'EGAレトロ'
		}
	},
	glitch: {
		digital: { subtle: '軽いグリッチ', cyber: 'サイバー', broken: '重度の破損' },
		vhs: { subtle: '軽いVHS', worn: '古いテープ', broken: '壊れたVCR' }
	},
	effects: {
		gaussian_blur: { name: 'ガウスぼかし', params: { radius: { label: '半径' } } },
		sharpen: {
			name: 'シャープ',
			params: {
				amount: { label: '強度', hint: 'シャープネスの強さ。' },
				radius: { label: '半径', hint: 'アンシャープマスクのぼかし半径。' },
				threshold: { label: 'しきい値', hint: 'この値未満の差分は無視。' }
			}
		},
		curves: {
			name: 'トーンカーブ',
			params: {
				shadows: { label: 'シャドウ', hint: '深い影を持ち上げ／潰す。' },
				darks: { label: 'ダーク', hint: '1/4 トーンを調整。' },
				lights: { label: 'ライト', hint: '3/4 トーンを調整。' },
				highlights: { label: 'ハイライト', hint: 'ハイライトのロールオフ。' }
			}
		},
		exposure: {
			name: '露出',
			params: {
				exposure: { label: '露出', hint: '露出（EV）。上げると明るく。Ditherと相性良好。' },
				offset: { label: 'オフセット', hint: '全体の明るさシフト。' },
				gamma: { label: 'ガンマ', hint: 'トーンカーブ。' }
			}
		},
		levels: {
			name: 'レベル',
			params: {
				shadows: { label: 'シャドウ', hint: '上げると影を持ち上げ。' },
				midtones: { label: 'ミッドトーン', hint: '中間調のバランス。' },
				highlights: { label: 'ハイライト', hint: '下げるとハイライトを圧縮。' }
			}
		},
		brightness_contrast: {
			name: '明るさ / コントラスト',
			params: { brightness: { label: '明るさ' }, contrast: { label: 'コントラスト' } }
		},
		hue_saturation: {
			name: '色相 / 彩度',
			params: { hue: { label: '色相' }, saturation: { label: '彩度' } }
		},
		duotone: {
			name: 'デュオトーン',
			params: { shadow: { label: 'シャドウ' }, highlight: { label: 'ハイライト' } }
		},
		monochrome: {
			name: 'モノクロ',
			params: { mix: { label: 'ミックス' }, tint: { label: 'ティント' } }
		},
		noise: {
			name: 'ノイズ',
			params: {
				amount: { label: '量' },
				size: { label: 'サイズ' },
				chroma: { label: 'クロマ' },
				shadow: { label: 'シャドウ' },
				midtone: { label: 'ミッド' },
				highlight: { label: 'ハイライト' }
			}
		},
		rgb_halftone: {
			name: 'RGBハーフトーン',
			params: {
				cellSize: { label: 'ドットサイズ', hint: 'ピクセル単位。3–5がeffect.appに近い。' },
				gamma: { label: 'ガンマ' },
				contrast: { label: 'コントラスト' },
				saturation: { label: '彩度', hint: 'インク前の彩度。' },
				misregister: { label: 'ズレ' },
				dotGain: { label: 'ドットゲイン' },
				sharpness: { label: 'シャープ' },
				inkBleed: { label: 'にじみ' },
				angleR: { label: '角度 R' },
				angleG: { label: '角度 G' },
				angleB: { label: '角度 B' }
			}
		},
		soft_bleed: {
			name: 'ソフトブリード',
			params: { amount: { label: 'ブリード' }, radius: { label: '半径' } }
		},
		paper_grain: {
			name: '紙目',
			params: {
				amount: { label: '量' },
				scale: { label: '粒サイズ' },
				contrast: { label: 'コントラスト' },
				warmth: { label: '紙の暖色' },
				blend: { label: 'ブレンド', hint: '0=控えめ、1=全面紙テクスチャ。' }
			}
		},
		print_stamp: {
			name: 'プリント枠',
			params: {
				margin: { label: '余白' },
				fade: { label: 'エッジフェード' },
				roughness: { label: 'エッジ粗さ' },
				paperColor: { label: '紙色' }
			}
		},
		glitch_digital: {
			name: 'デジタルグリッチ',
			params: {
				block_size: { label: 'ブロックサイズ', hint: '大きいほどJPEG破損風。' },
				displacement: { label: '変位' },
				block_opacity: { label: 'ブロック不透明度' },
				color_split: { label: '色分離' },
				line_tear: { label: 'ティア' },
				pixelate: { label: 'ピクセル化' },
				seed: { label: 'シード' }
			}
		},
		glitch_vhs: {
			name: 'VHSグリッチ',
			params: {
				grain: { label: 'グレイン', hint: 'アナログ粒子。' },
				glitch_blocks: { label: 'グリッチブロック' },
				rgb_shift: { label: 'RGBシフト' },
				scanlines: { label: '走査線', hint: 'CRT走査線。' },
				noise: { label: 'ノイズ' },
				distortion: { label: '歪み' },
				seed: { label: 'シード' }
			}
		},
		crt: {
			name: 'CRT',
			params: {
				scan_intensity: { label: '走査線' },
				curvature: { label: '曲率' },
				rgb_shift: { label: 'RGBシフト' }
			}
		},
		vignette: {
			name: 'ビネット',
			params: { strength: { label: '強度' }, softness: { label: 'ソフト' } }
		},
		pixelate: {
			name: 'ピクセル化',
			params: { size: { label: 'ピクセルサイズ' } }
		},
		star_glow: {
			name: 'スターグロー',
			params: {
				highlight_boost: { label: 'ハイライト' },
				streaks: { label: 'ストリーク' },
				samples: { label: 'サンプル数' },
				length: { label: '長さ' },
				alternate: { label: '交互' },
				falloff: { label: '減衰' },
				angle: { label: '角度' },
				colorize: { label: 'カラー化' },
				gradient: { label: 'グラデーションマップ' },
				grad_shift: { label: 'グラデーションシフト' }
			}
		},
		bloom: {
			name: 'ブルーム',
			params: {
				threshold: { label: 'しきい値' },
				softness: { label: 'ソフト' },
				radius: { label: '半径' },
				intensity: { label: '強度' }
			}
		},
		dither: {
			name: 'ディザ',
			params: {
				pattern: {
					label: 'パターン',
					hint: 'パターン（0–13）。13=細かい印刷、6–7=誤差拡散風。'
				},
				palette: {
					label: 'パレット',
					hint: 'パレット（0–7）。7=高コントラスト白黒。'
				},
				colors: { label: '色数', hint: '保持する色数。' },
				distance: {
					label: '距離モード',
					hint: '1=自然（推奨）、0=RGB数学。'
				},
				strength: { label: '強度', hint: 'effect.appは1.0–1.5が多い。' },
				gamma: { label: 'ガンマ', hint: '2.7で強い白黒コントラスト。' },
				pixelStep: { label: 'ピクセルステップ', hint: '1=最も細かい。' }
			}
		}
	},
	presets: {
		vintage_print: {
			name: 'ヴィンテージ印刷',
			group: '古典絵画',
			description: 'RGBハーフトーン、ソフトブリード、紙目、プリント枠 — effect.app風。',
			layerLabels: [
				'カーブ',
				'レベル',
				'紙スキャン',
				'RGBハッチ',
				'ソフトブリード',
				'RISOディザ',
				'紙スキャン',
				'プリント枠',
				'ビネット'
			]
		},
		glitch_cyber: {
			name: 'グリッチサイバー',
			group: 'デジタル',
			description: 'デジタル破損、ネオングロー、強いビネット。',
			layerLabels: ['デジタルグリッチ', '色相/彩度', 'ブルーム', 'ビネット']
		},
		lofi_vhs: {
			name: 'Lo-fi VHS',
			group: 'レトロ',
			description: '古いテープ、CRT走査線、暖色デュオトーン、グレイン。',
			layerLabels: ['VHSグリッチ', 'CRT', 'ノイズ', 'デュオトーン', 'ビネット']
		},
		film_noir: {
			name: 'フィルムノワール',
			group: 'フィルム',
			description: '潰したカーブ、シルバーモノクロ、オーバーレイグレイン。',
			layerLabels: ['カーブ', 'モノクロ', 'ノイズ', 'ビネット']
		}
	}
};
