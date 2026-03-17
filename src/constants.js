/**
 * Constants and configuration for MICHIKUSA application
 * @module constants
 */

/**
 * SVG icon path data
 * @constant {Object.<string, string>}
 */
export const ICON_PATHS = {
  elegance: '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
  chefDesire: '<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/>',
  rarity: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  roadside: '<path d="M8 2v20"/><path d="M16 2v20"/><path d="m2 12 2-2 4 4 4-4 4 4 2-2"/>',
  regret: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  wine: '<path d="M8 22h8"/><path d="M12 11v11"/><path d="M7 2h10l-1.5 9a4 4 0 0 1-7 0L7 2z"/>',
  cooking: '<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/>',
  utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'
};

/**
 * ImageNet fungi classes for plant detection
 * @constant {Set<string>}
 */
export const FUNGI_CLASSES = new Set([
  'agaric',
  'gyromitra',
  'stinkhorn, carrion fungus',
  'earthstar',
  'hen-of-the-woods, maitake',
  'bolete',
  'coral fungus',
  'mushroom'
]);

/**
 * ImageNet wild plant classes
 * @constant {Set<string>}
 */
export const WILD_PLANT_CLASSES = new Set([
  'daisy',
  "yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum",
  'corn poppy, Flanders poppy, field poppy, Papaver rhoeas',
  'rapeseed',
  'corn',
  'acorn',
  'hip, rose hip, rosehip',
  'buckeye, horse chestnut, conker',
  'ear, spike, capitulum'
]);

/**
 * ImageNet fruit classes
 * @constant {Set<string>}
 */
export const FRUIT_CLASSES = new Set([
  'Granny Smith',
  'strawberry',
  'orange',
  'lemon',
  'fig',
  'pineapple, ananas',
  'banana',
  'jackfruit, jak, jack',
  'custard apple',
  'pomegranate'
]);

/**
 * ImageNet vegetable classes
 * @constant {Set<string>}
 */
export const VEGETABLE_CLASSES = new Set([
  'broccoli',
  'cauliflower',
  'head cabbage, drumhead cabbage',
  'zucchini, courgette',
  'acorn squash',
  'butternut squash',
  'cucumber, cuke',
  'artichoke, globe artichoke',
  'bell pepper',
  'cardoon'
]);

/**
 * Combined plant classes
 * @constant {Set<string>}
 */
export const ALL_PLANT_CLASSES = new Set([
  ...FUNGI_CLASSES,
  ...WILD_PLANT_CLASSES,
  ...FRUIT_CLASSES,
  ...VEGETABLE_CLASSES
]);

/**
 * Cultivated plant indicator classes
 * @constant {Set<string>}
 */
export const CULTIVATED_CLASSES = new Set([
  'pot, flowerpot',
  'vase',
  'greenhouse, nursery, glasshouse'
]);

/**
 * Plant-specific score modifiers based on detected class
 * @constant {Object.<string, Object.<string, number>>}
 */
export const PLANT_SCORE_MODS = {
  'daisy': { elegance: 0.8, roadside: 1.2 },
  'corn poppy': { elegance: 1.2, roadside: 1.5, rarity: 0.5 },
  'rapeseed': { roadside: 1.5, chefDesire: 0.5 },
  'corn': { chefDesire: 1.0, roadside: -0.5 },
  'acorn': { roadside: 1.0, rarity: 0.8 },
  'hip': { elegance: 0.8, rarity: 1.0 },
  'buckeye': { roadside: 1.2, rarity: 0.5 },
  'ear': { roadside: 1.5, chefDesire: 0.8 },
  'agaric': { rarity: 1.5, regret: 1.2, chefDesire: 1.0 },
  'gyromitra': { rarity: 2.5, regret: 3.0 },
  'stinkhorn': { rarity: 2.0, regret: 2.0, elegance: -0.5 },
  'earthstar': { rarity: 2.5, regret: 1.8, elegance: 0.5 },
  'hen-of-the-woods': { rarity: 1.5, chefDesire: 2.5, elegance: 1.0 },
  'bolete': { rarity: 1.8, chefDesire: 2.0, regret: 0.8 },
  'coral fungus': { rarity: 2.2, elegance: 1.5, regret: 1.0 },
  'mushroom': { rarity: 1.0, chefDesire: 1.5, regret: 0.5 },
  'Granny Smith': { elegance: 1.5, chefDesire: 1.5, roadside: -1.0 },
  'strawberry': { elegance: 1.2, chefDesire: 1.5 },
  'artichoke': { elegance: 1.0, chefDesire: 1.5, rarity: 0.5 },
  'bell pepper': { elegance: 0.8, chefDesire: 1.0 }
};

/**
 * Score metadata for UI rendering
 * @constant {Object.<string, {label: string}>}
 */
export const SCORE_META = {
  elegance: { label: '外見の気品' },
  chefDesire: { label: 'シェフ熱望度' },
  rarity: { label: '珍味感' },
  roadside: { label: '道端感' },
  regret: { label: '食後の後悔予想' }
};

/**
 * Rejection messages for non-plant or cultivated plants
 * @constant {Object.<string, {title: string, msgs: string[]}>}
 */
export const REJECTION = {
  'non-plant': {
    title: '審査対象外 — 植物が検出されませんでした',
    msgs: [
      '審査委員会は草以外の審査を承っておりません。',
      '道草ではないものを評論することは、我々の職域を逸脱しております。',
      '当グルメ評論は野草・雑草専門です。他の被写体はご遠慮ください。'
    ]
  },
  'cultivated': {
    title: '審査対象外 — 鉢植え・栽培植物',
    msgs: [
      '鉢植えの植物は、道草とは認められません。野に咲くものをお連れください。',
      'テロワールとは大地との対話。花瓶の中に道草は宿りません。',
      '栽培された植物は、当委員会の審査基準を満たしておりません。野草をお持ちください。'
    ]
  }
};

/**
 * Loading messages shown during AI response generation
 * @constant {string[]}
 */
export const LOADING_MESSAGES = [
  'グルメ審査員を召喚中...',
  'テイスティングノートを準備中...',
  'ソムリエが香りを確認中...',
  'ミシュランの星を磨いています...',
  'ペアリングワインを選定中...',
  '調理法を思案中...',
  'シェフの技を分析中...',
  '食材の産地を確認中...',
  '盛り付けの美学を評価中...',
  '旨味成分を検出中...',
  '食感のハーモニーを確認中...',
  '香りの層を解析中...',
  '余韻の長さを測定中...',
  'フードペアリングを検討中...',
  '調味料のバランスを吟味中...',
  '火入れ加減を確認中...',
  '皿の温度を測定中...',
  '色彩バランスを分析中...',
  '季節感を評価中...',
  '伝統と革新を比較中...',
  '食材の鮮度を判定中...',
  'ソースの濃度を確認中...',
  '切り方の精度を検証中...',
  'だしの深みを探求中...',
  'スパイスの配合を解読中...',
  '発酵度合いを確認中...',
  '焼き加減を精査中...',
  'テクスチャーの層を分析中...',
  '温度のコントラストを評価中...',
  '酸味と甘味のバランスを確認中...',
  '油脂の質を判定中...',
  '塩梅の妙を探っています...',
  '器との調和を確認中...',
  '地域性を考察中...',
  'ストーリー性を評価中...',
  'クリエイティビティを採点中...',
  'テクニカルスキルを分析中...',
  'コストパフォーマンスを算出中...',
  'リピート価値を判定中...',
  'インスタ映えを評価中...',
  '栄養バランスを確認中...',
  'アレルゲン情報を確認中...',
  'カロリーを計算中...',
  '食べ合わせを検証中...',
  '箸休めを考案中...',
  'ドリンクとの相性を確認中...',
  '日本酒のペアリングを検討中...',
  'ビールとの相性を吟味中...',
  'デザートワインを選定中...',
  '食後酒を提案中...'
];

/**
 * Persona configurations for multi-perspective review
 * @constant {Array<Object>}
 */
export const PERSONAS = [
  {
    id: 'french',
    name: 'Pierre Dubois',
    role: 'パリ三つ星 料理長',
    weightFn: (s) => (s.elegance * 2.5 + s.chefDesire * 2.0 + s.rarity * 1.5 - s.roadside * 0.5 - s.regret * 1.5) / 5.5
  },
  {
    id: 'edo',
    name: '山田宗次郎',
    role: '江戸天保年間の食通',
    weightFn: (s) => (s.roadside * 2.5 + s.rarity * 2.0 + s.elegance * 1.0 - s.regret * 0.8) / 5.0
  },
  {
    id: 'herbalist',
    name: '李 文徳',
    role: '東洋医学 薬草研究家',
    weightFn: (s) => (s.rarity * 2.0 + s.chefDesire * 1.5 + s.roadside * 2.0 - s.regret * 0.3) / 5.5
  }
];
