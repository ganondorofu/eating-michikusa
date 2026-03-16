// ===== SVG Icons =====
function svg(paths, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
const ICONS = {
  elegance:   svg(`<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>`),
  chefDesire: svg(`<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/>`),
  rarity:     svg(`<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`),
  roadside:   svg(`<path d="M8 2v20"/><path d="M16 2v20"/><path d="m2 12 2-2 4 4 4-4 4 4 2-2"/>`),
  regret:     svg(`<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>`),
  wine:       svg(`<path d="M8 22h8"/><path d="M12 11v11"/><path d="M7 2h10l-1.5 9a4 4 0 0 1-7 0L7 2z"/>`),
  cooking:    svg(`<path d="M15 11h.01"/><path d="M11 15h.01"/><path d="M16 16h.01"/><path d="m2 16 20 6-6-20A20 20 0 0 0 2 16"/><path d="M5.71 17.11a17.04 17.04 0 0 1 11.4-11.4"/>`),
  utensils:   svg(`<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`, 18),
};

// ===================================================================
// ML PLANT DETECTION — TensorFlow.js MobileNet v2
// ===================================================================

let mobileNetModel = null;
let plantClassNames = null; // モデルの全1000クラスから抽出した植物クラス名 Set

async function loadMobileNet() {
  if (mobileNetModel) return mobileNetModel;
  // alpha:0.5 = チャンネル数半減モデル (~5MB)、精度と速度のバランス
  mobileNetModel = await mobilenet.load({ version: 2, alpha: 0.5 });
  // モデルロード直後に全クラス名を取得して植物クラス Set を構築
  await buildPlantClassSet(mobileNetModel);
  return mobileNetModel;
}

// 1×1 ダミーキャンバスで classify(topk=1000) を呼び、
// モデルが実際に使う全クラス名を取得してキーワードでフィルタリング
async function buildPlantClassSet(model) {
  if (plantClassNames) return plantClassNames;
  const dummy = document.createElement('canvas');
  dummy.width = dummy.height = 4;
  const allPreds = await model.classify(dummy, 1000);
  plantClassNames = new Set(allPreds.map(p => p.className).filter(isPlantClass));
  console.debug('[MICHIKUSA] 植物クラス数:', plantClassNames.size);
  console.debug('[MICHIKUSA] 植物クラス一覧:', [...plantClassNames].sort().join(', '));
  return plantClassNames;
}

// ===================================================================
// ImageNet 1000クラスのうち植物・菌類に該当するもの (MobileNet v2 準拠)
// classify() が返す className の完全一致 or 部分一致でチェック
//
// 出典: ILSVRC 2012 synset → TF.js mobilenet ラベルファイル
// ===================================================================

// 菌類 8クラス (ImageNet 菌類クラス全数)
const FUNGI_CLASSES = new Set([
  'agaric',
  'gyromitra',
  'stinkhorn, carrion fungus',
  'earthstar',
  "hen-of-the-woods, maitake",
  'bolete',
  'coral fungus',
  'mushroom',
]);

// 野生植物・花・種子 (ImageNet 植物クラス)
const WILD_PLANT_CLASSES = new Set([
  'daisy',
  "yellow lady's slipper, yellow lady-slipper, Cypripedium calceolus, Cypripedium parviflorum",
  'corn poppy, Flanders poppy, field poppy, Papaver rhoeas',
  'rapeseed',
  'corn',
  'acorn',
  'hip, rose hip, rosehip',
  'buckeye, horse chestnut, conker',
  'ear, spike, capitulum',
]);

// 果物クラス (接写写真で出やすい)
const FRUIT_CLASSES = new Set([
  'Granny Smith',
  'strawberry',
  'orange',
  'lemon',
  'fig',
  'pineapple, ananas',
  'banana',
  'jackfruit, jak, jack',
  'custard apple',
  'pomegranate',
]);

// 野菜クラス
const VEGETABLE_CLASSES = new Set([
  'broccoli',
  'cauliflower',
  'head cabbage, drumhead cabbage',
  'zucchini, courgette',
  'acorn squash',
  'butternut squash',
  'cucumber, cuke',
  'artichoke, globe artichoke',
  'bell pepper',
  'cardoon',
]);

// 全植物クラスを統合
const ALL_PLANT_CLASSES = new Set([
  ...FUNGI_CLASSES,
  ...WILD_PLANT_CLASSES,
  ...FRUIT_CLASSES,
  ...VEGETABLE_CLASSES,
]);

// 鉢植え・栽培植物を示す ImageNet クラス
const CULTIVATED_CLASSES = new Set([
  'pot, flowerpot',
  'vase',
  'greenhouse, nursery, glasshouse',
]);

function isCultivatedClass(className) {
  if (CULTIVATED_CLASSES.has(className)) return true;
  const lower = className.toLowerCase();
  return lower.includes('flowerpot') || lower.includes('flower pot') || lower === 'pot';
}

// モデルが返す className と照合
// ImageNet のラベルは「主名称, 別名1, 別名2」形式なので先頭一致も使う
function isPlantClass(className) {
  if (ALL_PLANT_CLASSES.has(className)) return true;
  // 主名称だけで一致 (例: "agaric" が "agaric, ..." の先頭にある場合)
  const primary = className.split(',')[0].trim().toLowerCase();
  for (const c of ALL_PLANT_CLASSES) {
    if (c.toLowerCase().startsWith(primary) || primary.startsWith(c.toLowerCase().split(',')[0].trim())) {
      return true;
    }
  }
  return false;
}

async function detectPlant(imgEl, model) {
  // 上位20クラスで判定（植物が10位以内に入らないケースに対応）
  const predictions = await model.classify(imgEl, 20);
  const classSet = plantClassNames || new Set();
  let plantScore = 0, cultivatedScore = 0;
  let topPlantClass = null;
  for (const pred of predictions) {
    if (isCultivatedClass(pred.className)) cultivatedScore += pred.probability;
    if (classSet.has(pred.className)) {
      plantScore += pred.probability;
      if (!topPlantClass) topPlantClass = pred.className;
    }
  }
  console.debug('[MICHIKUSA] top-3:', predictions.slice(0, 3).map(p => `${p.className}:${(p.probability*100).toFixed(1)}%`).join(', '));
  console.debug('[MICHIKUSA] plantScore:', plantScore.toFixed(3), 'cultivatedScore:', cultivatedScore.toFixed(3));

  let rejectionType = null;
  if (cultivatedScore >= 0.12) rejectionType = 'cultivated';
  else if (plantScore <= 0.05) rejectionType = 'non-plant';

  return {
    isPlant: rejectionType === null,
    confidence: plantScore,
    cultivatedScore,
    rejectionType,
    className: topPlantClass,
    topPrediction: predictions[0].className,
    allPredictions: predictions,
  };
}

// 植物種別スコア補正テーブル (ImageNet クラス名の主名称をキーに)
const PLANT_SCORE_MODS = {
  'daisy':           { elegance: 0.8, roadside: 1.2 },
  'corn poppy':      { elegance: 1.2, roadside: 1.5, rarity: 0.5 },
  'rapeseed':        { roadside: 1.5, chefDesire: 0.5 },
  'corn':            { chefDesire: 1.0, roadside: -0.5 },
  'acorn':           { roadside: 1.0, rarity: 0.8 },
  'hip':             { elegance: 0.8, rarity: 1.0 },
  'buckeye':         { roadside: 1.2, rarity: 0.5 },
  'ear':             { roadside: 1.5, chefDesire: 0.8 },
  // 菌類
  'agaric':          { rarity: 1.5, regret: 1.2, chefDesire: 1.0 },
  'gyromitra':       { rarity: 2.5, regret: 3.0 },        // 猛毒
  'stinkhorn':       { rarity: 2.0, regret: 2.0, elegance: -0.5 },
  'earthstar':       { rarity: 2.5, regret: 1.8, elegance: 0.5 },
  'hen-of-the-woods':{ rarity: 1.5, chefDesire: 2.5, elegance: 1.0 },
  'bolete':          { rarity: 1.8, chefDesire: 2.0, regret: 0.8 },
  'coral fungus':    { rarity: 2.2, elegance: 1.5, regret: 1.0 },
  'mushroom':        { rarity: 1.0, chefDesire: 1.5, regret: 0.5 },
  // 果物・野菜
  'Granny Smith':    { elegance: 1.5, chefDesire: 1.5, roadside: -1.0 },
  'strawberry':      { elegance: 1.2, chefDesire: 1.5 },
  'artichoke':       { elegance: 1.0, chefDesire: 1.5, rarity: 0.5 },
  'bell pepper':     { elegance: 0.8, chefDesire: 1.0 },
};

function applyPlantMods(scores, detection) {
  if (!detection.className) return scores;
  const lower = detection.className.toLowerCase();
  const result = { ...scores };
  for (const [plant, mods] of Object.entries(PLANT_SCORE_MODS)) {
    if (lower.includes(plant.toLowerCase())) {
      const weight = clamp(detection.confidence * 2, 0, 1);
      for (const [key, delta] of Object.entries(mods)) {
        result[key] = Math.round(clamp((result[key] || 0) + delta * weight, 0, 5) * 10) / 10;
      }
      break;
    }
  }
  return result;
}

// 植物非検出時の拒否UI
const REJECTION = {
  'non-plant': {
    title: '審査対象外 — 植物が検出されませんでした',
    msgs: [
      '審査委員会は草以外の審査を承っておりません。',
      '道草ではないものを評論することは、我々の職域を逸脱しております。',
      '当グルメ評論は野草・雑草専門です。他の被写体はご遠慮ください。',
    ],
  },
  'cultivated': {
    title: '審査対象外 — 鉢植え・栽培植物',
    msgs: [
      '鉢植えの植物は、道草とは認められません。野に咲くものをお連れください。',
      'テロワールとは大地との対話。花瓶の中に道草は宿りません。',
      '栽培された植物は、当委員会の審査基準を満たしておりません。野草をお持ちください。',
    ],
  },
};

function showRejection(detection) {
  const type = detection.rejectionType || 'non-plant';
  const { title, msgs } = REJECTION[type];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];
  document.getElementById('rejectionTitle').textContent = title;
  document.getElementById('rejectionMsg').textContent = msg;
  document.getElementById('rejectionDetected').textContent =
    type === 'cultivated'
      ? `AI判定: 「${detection.topPrediction}」 / 鉢植えスコア: ${(detection.cultivatedScore * 100).toFixed(1)}%`
      : `AI判定: 「${detection.topPrediction}」 / 植物スコア: ${(detection.confidence * 100).toFixed(1)}%`;
  document.getElementById('rejectionCard').hidden = false;
  scorePreview.hidden = true;
  btnGroup.hidden = true;
}

// ===== State =====
let currentImageDataUrl = null;
let currentScores = null;
let currentDetection = null;

// ===== DOM =====
const multiAnalyzeBtn    = document.getElementById('multiAnalyzeBtn');
const multiResultSection = document.getElementById('multiResultSection');
const personaProgress    = document.getElementById('personaProgress');
const personaTabs        = document.getElementById('personaTabs');
const personaReviews     = document.getElementById('personaReviews');
const resetBtn3          = document.getElementById('resetBtn3');
const fileInput          = document.getElementById('fileInput');
const uploadBtn        = document.getElementById('uploadBtn');
const cameraBtn        = document.getElementById('cameraBtn');
const dropZone         = document.getElementById('dropZone');
const uploadSection    = document.getElementById('uploadSection');
const previewSection   = document.getElementById('previewSection');
const previewImage     = document.getElementById('previewImage');
const analysisCanvas   = document.getElementById('analysisCanvas');
const analysisLoading  = document.getElementById('analysisLoading');
const analysisBars     = document.getElementById('analysisBars');
const analysisStep     = document.getElementById('analysisStep');
const scorePreview     = document.getElementById('scorePreview');
const scoreBars        = document.getElementById('scoreBars');
const btnGroup         = document.getElementById('btnGroup');
const analyzeBtn       = document.getElementById('analyzeBtn');
const loadingSection   = document.getElementById('loadingSection');
const loadingSpinner   = document.getElementById('loadingSpinner');
const loadingText      = document.getElementById('loadingText');
const resultSection    = document.getElementById('resultSection');
const resultImage      = document.getElementById('resultImage');
const starRating       = document.getElementById('starRating');
const reviewTagline    = document.getElementById('reviewTagline');
const reviewScores     = document.getElementById('reviewScores');
const reviewBody       = document.getElementById('reviewBody');
const reviewPairing    = document.getElementById('reviewPairing');
const reviewCooking    = document.getElementById('reviewCooking');
const shareBtn         = document.getElementById('shareBtn');
const resetBtn         = document.getElementById('resetBtn');
const resetBtn2        = document.getElementById('resetBtn2');

// ボタンにSVGアイコンをセット
document.getElementById('btnIcon').innerHTML = ICONS.utensils;
document.getElementById('btnMultiIcon').innerHTML = svg(
  `<circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><circle cx="17" cy="17" r="4"/><path d="m19 15-2 2 1 1"/>`, 18
);

// ===== Upload Handlers =====
uploadBtn.addEventListener('click', () => { fileInput.removeAttribute('capture'); fileInput.click(); });
cameraBtn.addEventListener('click', () => { fileInput.setAttribute('capture', 'environment'); fileInput.click(); });
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) return alert('画像ファイルを選択してください');
  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageDataUrl = e.target.result;
    previewImage.src = currentImageDataUrl;
    previewImage.onload = async () => {
      showSection(previewSection);
      hideSection(uploadSection);
      await analyzeImage();
    };
  };
  reader.readAsDataURL(file);
}

// ===== Reset =====
function resetAll() {
  currentImageDataUrl = null; currentScores = null; currentDetection = null; fileInput.value = '';
  scorePreview.hidden = true;
  btnGroup.hidden = true;
  loadingSpinner.hidden = false;
  document.getElementById('rejectionCard').hidden = true;
  showSection(uploadSection);
  hideSection(previewSection); hideSection(loadingSection);
  hideSection(resultSection); hideSection(multiResultSection);
  reviewBody.textContent = '';
  personaProgress.innerHTML = '';
  personaTabs.hidden = true;
  personaReviews.innerHTML = '';
}
resetBtn.addEventListener('click', resetAll);
resetBtn2.addEventListener('click', resetAll);
resetBtn3.addEventListener('click', resetAll);

// ===== Helpers =====
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function showSection(el) { el.hidden = false; }
function hideSection(el) { el.hidden = true; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===================================================================
// ML SCORING LAYER — CIELab色空間 + k-means++植物領域セグメンテーション
//
// アルゴリズム:
//   1. RGB → CIELab (知覚的に均一な色空間, D65白色点)
//   2. k-means++ (k=4, 15 iterations) でピクセルをクラスタリング
//   3. Lab の a* 軸 (負=緑, 正=赤) で植物クラスタを同定
//   4. 植物マスク内ピクセルのみで各スコアを算出
//   5. Sobelフィルタでエッジ密度 (テクスチャ) を計算
// ===================================================================

// sRGB → linear RGB (ガンマ除去)
function srgbLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

// RGB [0-255] → CIELab [L:0-100, a:-128-127, b:-128-127]
function rgbToLab(r, g, b) {
  const rl = srgbLinear(r/255), gl = srgbLinear(g/255), bl = srgbLinear(b/255);
  // D65 illuminant matrix
  const X = rl*0.4124564 + gl*0.3575761 + bl*0.1804375;
  const Y = rl*0.2126729 + gl*0.7151522 + bl*0.0721750;
  const Z = rl*0.0193339 + gl*0.1191920 + bl*0.9503041;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787*t + 16/116;
  const fX = f(X/0.95047), fY = f(Y/1.00000), fZ = f(Z/1.08883);
  return [116*fY - 16, 500*(fX - fY), 200*(fY - fZ)];
}

// k-means++ クラスタリング (Lab色空間)
// k-means++ の初期化で収束が速く局所解を避けやすい
function kMeansLab(pixels, k = 4, iters = 15) {
  const n = pixels.length;
  // k-means++ 初期化
  const centroids = [[...pixels[Math.floor(Math.random() * n)]]];
  for (let ci = 1; ci < k; ci++) {
    const dists = pixels.map(p => {
      let minD = Infinity;
      for (const c of centroids) {
        const d = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
        if (d < minD) minD = d;
      }
      return minD;
    });
    const sum = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    let idx = 0;
    while (idx < n-1 && r > dists[idx]) r -= dists[idx++];
    centroids.push([...pixels[idx]]);
  }
  const assignments = new Int32Array(n);
  for (let iter = 0; iter < iters; iter++) {
    // 割り当てステップ
    for (let i = 0; i < n; i++) {
      let best = 0, bestD = Infinity;
      for (let c = 0; c < k; c++) {
        const d = (pixels[i][0]-centroids[c][0])**2 + (pixels[i][1]-centroids[c][1])**2 + (pixels[i][2]-centroids[c][2])**2;
        if (d < bestD) { bestD = d; best = c; }
      }
      assignments[i] = best;
    }
    // 重心更新ステップ
    const sums = Array.from({length: k}, () => [0,0,0]);
    const counts = new Int32Array(k);
    for (let i = 0; i < n; i++) {
      const c = assignments[i];
      sums[c][0] += pixels[i][0]; sums[c][1] += pixels[i][1]; sums[c][2] += pixels[i][2];
      counts[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) centroids[c] = sums[c].map(s => s / counts[c]);
    }
  }
  return { centroids, assignments };
}

// Sobelフィルタでエッジ密度を計算 (植物マスク内のみ)
// 高エッジ密度 = ざらつき = regret 向上
function sobelEdgeDensity(data, W, H, mask) {
  let edgeSum = 0, count = 0;
  for (let y = 1; y < H-1; y++) {
    for (let x = 1; x < W-1; x++) {
      const idx = y*W + x;
      if (!mask[idx]) continue;
      count++;
      const lum = i => { const j = i*4; return 0.299*data[j] + 0.587*data[j+1] + 0.114*data[j+2]; };
      const tl=lum((y-1)*W+x-1), tc=lum((y-1)*W+x), tr=lum((y-1)*W+x+1);
      const ml=lum(y*W+x-1),                          mr=lum(y*W+x+1);
      const bl=lum((y+1)*W+x-1), bc=lum((y+1)*W+x), br=lum((y+1)*W+x+1);
      const gx = -tl - 2*ml - bl + tr + 2*mr + br;
      const gy = -tl - 2*tc - tr + bl + 2*bc + br;
      edgeSum += Math.sqrt(gx*gx + gy*gy);
    }
  }
  return count > 0 ? edgeSum / (count * 255 * 4) : 0;
}

// Shannon entropy of histogram
function shannonEntropy(hist) {
  const total = hist.reduce((s, v) => s + v, 0);
  if (total === 0) return 0;
  let H = 0;
  for (const c of hist) if (c > 0) { const p = c / total; H -= p * Math.log2(p); }
  return H;
}

async function analyzeImage() {
  // ローディング表示を先に出す
  analysisBars.innerHTML = Array.from({length: 14}, (_, i) =>
    `<div class="analysis-bar" style="animation-delay:${(i*0.065).toFixed(2)}s"></div>`
  ).join('');
  showSection(analysisLoading);
  btnGroup.hidden = true;
  document.getElementById('rejectionCard').hidden = true;

  // ===== Step 1: MobileNet 植物検出 =====
  let detection = { isPlant: true, confidence: 0, className: null, topPrediction: '不明' };
  if (typeof mobilenet !== 'undefined') {
    analysisStep.textContent = mobileNetModel
      ? 'AI植物認識モデル準備完了'
      : 'MobileNet v2 読み込み中... (初回のみ ~5MB)';
    await sleep(50); // 描画
    try {
      const model = await loadMobileNet();
      analysisStep.textContent = '植物クラス分類中 (MobileNet v2)...';
      await sleep(50);
      detection = await detectPlant(previewImage, model);
      console.debug('[MICHIKUSA MobileNet]', detection);

      if (!detection.isPlant) {
        hideSection(analysisLoading);
        showRejection(detection);
        return;
      }
    } catch (e) {
      console.warn('[MICHIKUSA] MobileNet 失敗、色彩解析にフォールバック:', e);
      // MobileNet 失敗時は色彩解析のみで続行
    }
  } else {
    console.warn('[MICHIKUSA] mobilenet ライブラリ未ロード、色彩解析のみで続行');
  }

  // 植物確認済み — ステップ表示をCIELab解析に切り替え
  const detectedLabel = detection.className
    ? `検出: ${detection.className} (${(detection.confidence*100).toFixed(0)}%)`
    : 'RGB → CIELab 変換中...';
  analysisStep.textContent = detectedLabel;

  const STEPS = [
    detectedLabel,
    'RGB → CIELab 変換中...',
    'k-means++ 初期化中...',
    'クラスタ収束計算中 (iter 1/15)...',
    'クラスタ収束計算中 (iter 8/15)...',
    '植物領域マスク生成中...',
    'Sobelエッジ検出中...',
    'Shannon entropy H = -Σp·log₂p ...',
    '審査委員会へ報告書作成中...',
  ];
  let stepI = 0;
  const stepTimer = setInterval(() => {
    analysisStep.textContent = STEPS[stepI++ % STEPS.length];
  }, 400);

  // Canvas 解析 (ローディング表示後に実行)
  await sleep(100); // ブラウザに描画させる
  const canvas = analysisCanvas;
  const ctx    = canvas.getContext('2d');
  const W = 200, H = 200, N = W * H;
  canvas.width = W; canvas.height = H;
  ctx.drawImage(previewImage, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  // --- Step 1: 全ピクセルを CIELab に変換 ---
  const labPixels = [];
  for (let i = 0; i < N; i++) {
    labPixels.push(rgbToLab(data[i*4], data[i*4+1], data[i*4+2]));
  }

  // --- Step 2: k-means++ クラスタリング (k=4) ---
  const { centroids, assignments } = kMeansLab(labPixels, 4, 15);

  // --- Step 3: 植物クラスタ同定 ---
  // Lab の a* 軸: 負 → 緑, 正 → 赤
  // 最も a* が負 (緑寄り) のクラスタを植物とみなす
  // 閾値 a < -2 を満たすクラスタを全て植物領域に含める
  const plantClusters = new Set();
  centroids.forEach((c, i) => { if (c[1] < -2) plantClusters.add(i); });
  // 緑クラスタが無い場合は最も緑に近いクラスタ1つを採用
  if (plantClusters.size === 0) {
    const greenest = centroids.reduce((best, c, i) => c[1] < centroids[best][1] ? i : best, 0);
    plantClusters.add(greenest);
  }

  // --- Step 4: 植物マスク生成 ---
  const plantMask = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (plantClusters.has(assignments[i])) plantMask[i] = 1;
  }
  const plantCount = plantMask.reduce((s, v) => s + v, 0);
  const plantRatio = plantCount / N;

  // --- Step 5: 植物ピクセルのみで統計量を計算 ---
  const plantLab = [];
  for (let i = 0; i < N; i++) {
    if (plantMask[i]) plantLab.push(labPixels[i]);
  }
  const pN = plantLab.length || 1;

  // Chroma (彩度): C* = sqrt(a*² + b*²)  高いほど鮮やか
  const chromas = plantLab.map(([, a, b]) => Math.sqrt(a*a + b*b));
  const meanChroma = chromas.reduce((s, v) => s + v, 0) / pN;
  const chromaStd  = Math.sqrt(chromas.reduce((s, v) => s + (v-meanChroma)**2, 0) / pN);

  // 植物ピクセルの平均 a* (緑度: 負が大きいほど純緑)
  const meanA = plantLab.reduce((s, [,a]) => s + a, 0) / pN;

  // Hue angle (色相角): h_ab = atan2(b*, a*)
  const hueHist = new Float32Array(36);
  const lumaHist = new Float32Array(20);
  for (const [L, a, b] of plantLab) {
    let hab = Math.atan2(b, a) * (180 / Math.PI);
    if (hab < 0) hab += 360;
    hueHist[Math.min(35, Math.floor(hab / 10))]++;
    lumaHist[Math.min(19, Math.floor(L / 5))]++;
  }
  const hueEntropyNorm  = shannonEntropy(hueHist)  / Math.log2(36); // 0~1
  const lumaEntropyNorm = shannonEntropy(lumaHist) / Math.log2(20); // 0~1

  // 暗部ピクセル (L* < 20)
  const darkRatio = plantLab.filter(([L]) => L < 20).length / pN;

  // 不審色 (黄変: a*>-5 かつ b*>20, または褐色: a*>5 かつ L<50)
  const suspRatio = plantLab.filter(([L,a,b]) =>
    (a > -5 && b > 20 && L > 25) || (a > 5 && L < 50 && L > 15)
  ).length / pN;

  // 警戒色 — 毒・危険を想起させる色彩 (CIELab)
  //   赤系  : a* > 18  (毒キノコ・毒果実の赤)
  //   橙系  : a* > 10 かつ b* > 15  (アマニタ・毒ウコギ系)
  //   紫系  : b* < -10  (植物に紫は自然界での警告色)
  //   超高彩度: C* > 50  (自然物として不自然に鮮やか)
  const warningRatio = plantLab.filter(([L, a, b]) => {
    const C = Math.sqrt(a * a + b * b);
    return (a > 18 && L > 20 && L < 78)           // 赤
        || (a > 10 && b > 15 && L > 30 && L < 78) // 橙
        || (b < -10 && L > 15 && L < 65)           // 紫
        || (C > 50 && L > 20);                     // 超高彩度
  }).length / pN;

  // --- Step 6: Sobelエッジ密度 ---
  const edgeDensity = sobelEdgeDensity(data, W, H, plantMask);

  // ===== スコア計算 =====
  //
  // 1. 外見の気品 (elegance)
  //    植物ピクセルの平均 Chroma C* を使用
  //    C* が高い = 鮮やかで美しい. 正規化: C* / 35 * 5
  const elegance = clamp(meanChroma / 35 * 5, 0, 5);

  // 2. シェフ熱望度 (chefDesire)
  //    緑度 (|meanA| / 20) と色の均一性 (1 - chromaStd/meanChroma) の積
  const greenDegree = clamp(-meanA / 20, 0, 1);
  const chromaUnif  = clamp(1 - chromaStd / (meanChroma + 0.1), 0, 1);
  const chefDesire  = clamp((greenDegree * 0.65 + chromaUnif * 0.35) * 5, 0, 5);

  // 3. 珍味感 (rarity)
  //    植物ピクセルの hue entropy: 多様な色相 = 複雑な風味を示唆
  const rarity = clamp(hueEntropyNorm * 5.5, 0, 5);

  // 4. 道端感 (roadside)
  //    植物被覆率 (plantRatio) + 輝度エントロピー (自然な明暗変化)
  const roadside = clamp((Math.pow(plantRatio, 0.6) * 0.7 + lumaEntropyNorm * 0.3) * 6, 0, 5);

  // 5. 食後の後悔予想 (regret)
  //    暗部率 + 不審色率 + Sobelエッジ密度 + 警戒色率
  //    警戒色は自然界の危険サインとして最大ウェイト
  const regret = clamp(
    (darkRatio * 0.15 + suspRatio * 0.2 + edgeDensity * 0.15 + warningRatio * 0.5) * 16,
    0, 5
  );

  let scores = {};
  for (const [k, v] of Object.entries({ elegance, chefDesire, rarity, roadside, regret })) {
    scores[k] = Math.round(clamp(v, 0, 5) * 10) / 10;
  }
  // 警戒色比率はUI表示せず、プロンプト用に別保持
  scores._warningRatio = Math.round(warningRatio * 100) / 100;

  // 植物種別スコア補正 (MobileNet 検出結果を反映)
  scores = applyPlantMods(scores, detection);

  console.debug('[MICHIKUSA ML]', {
    plantRatio: plantRatio.toFixed(3), plantClusters: [...plantClusters],
    meanChroma: meanChroma.toFixed(2), meanA: meanA.toFixed(2),
    hueEntropyNorm: hueEntropyNorm.toFixed(3), edgeDensity: edgeDensity.toFixed(4),
    warningRatio: warningRatio.toFixed(3),
    centroids: centroids.map(c => c.map(v => v.toFixed(1))), scores,
  });

  await sleep(1700);
  clearInterval(stepTimer);
  hideSection(analysisLoading);

  currentScores = scores;
  currentDetection = detection;
  renderScoreBars(scores);
  showSection(scorePreview);
  btnGroup.hidden = false;

  console.debug('[MICHIKUSA scores]', scores);
}

const SCORE_META = {
  elegance:   { label: '外見の気品',    icon: ICONS.elegance },
  chefDesire: { label: 'シェフ熱望度',  icon: ICONS.chefDesire },
  rarity:     { label: '珍味感',        icon: ICONS.rarity },
  roadside:   { label: '道端感',        icon: ICONS.roadside },
  regret:     { label: '食後の後悔予想', icon: ICONS.regret },
};

function renderScoreBars(scores) {
  scoreBars.innerHTML = '';
  for (const [key, val] of Object.entries(scores)) {
    if (!SCORE_META[key]) continue; // _warningRatio など内部フィールドを除外
    const pct = (val / 5) * 100;
    const { label } = SCORE_META[key];
    scoreBars.innerHTML += `
      <div class="score-bar-item">
        <span class="score-bar-label">${label}</span>
        <div class="score-bar-track"><div class="score-bar-fill" style="width:${pct}%"></div></div>
        <span class="score-bar-value">${val.toFixed(1)}</span>
      </div>`;
  }
}

// ===== Analyze Buttons =====
analyzeBtn.addEventListener('click', async () => {
  if (!currentImageDataUrl || !currentScores) return;
  await runGourmetReview();
});

// ===== Loading messages =====
const LOADING_MESSAGES = [
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
  '食後酒を提案中...',
];
let loadingInterval = null;
function startLoadingAnimation() {
  let i = 0; loadingText.textContent = LOADING_MESSAGES[0];
  loadingInterval = setInterval(() => { i = (i+1) % LOADING_MESSAGES.length; loadingText.textContent = LOADING_MESSAGES[i]; }, 1800);
}
function stopLoadingAnimation() {
  if (loadingInterval) { clearInterval(loadingInterval); loadingInterval = null; }
}

// ===================================================================
// API LAYER — Zhipu AI (GLM-4.6V-Flash) multimodal
// ===================================================================

// 429 時に指数バックオフでリトライ
async function fetchWithRetry(url, options, maxRetries = 3) {
  let delay = 4000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status !== 429) return res;
    if (attempt === maxRetries) return res; // 最終試行は呼び出し元にまかせる
    loadingText.textContent = `混雑中... ${delay / 1000}秒後にリトライ (${attempt}/${maxRetries - 1})`;
    await sleep(delay);
    delay *= 2; // 4s → 8s → 16s
  }
}

async function runGourmetReview() {
  if (typeof API_KEY === 'undefined' || !API_KEY) {
    alert('config.js にAPIキーを設定してください。');
    return;
  }

  analyzeBtn.disabled = true;
  hideSection(previewSection);
  loadingSpinner.hidden = false;
  showSection(loadingSection);
  startLoadingAnimation();

  const s = currentScores;

  try {
    const response = await fetchWithRetry('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4.6v-flash',
        stream: false,
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: currentImageDataUrl } },
            { type: 'text', text: buildPrompt(s, currentDetection?.className) },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const json = await response.json();
    const fullText = json.choices?.[0]?.message?.content ?? '';
    console.debug('[MICHIKUSA response]', fullText);

    stopLoadingAnimation();
    hideSection(loadingSection);
    loadingSpinner.hidden = false;

    resultImage.src = currentImageDataUrl;
    renderStars(computeOverallScore(s));
    renderResultScores(s);
    reviewPairing.innerHTML = '';
    reviewCooking.innerHTML = '';

    // まず全文を表示（セクション解析前の確実なフォールバック）
    reviewBody.textContent = fullText;
    showSection(resultSection);

    // セクション解析で上書き
    finalizeResult(fullText);
    analyzeBtn.disabled = false;

  } catch (err) {
    stopLoadingAnimation();
    hideSection(loadingSection);
    loadingSpinner.hidden = false;
    showSection(previewSection);
    analyzeBtn.disabled = false;
    console.error(err);
    alert(`APIエラー: ${err.message}`);
  }
}

function buildPrompt(s, detectedClass) {
  const plantInfo = detectedClass
    ? `\n【AI植物認識結果】\nMobileNet v2による植物クラス分類: ${detectedClass}\n`
    : '';
  const warningRatio = s._warningRatio ?? 0;
  const warningNote = warningRatio > 0.25
    ? `\n【警戒色アラート】警戒色比率 ${(warningRatio * 100).toFixed(0)}% — 赤・橙・紫系の高彩度色が植物の${(warningRatio * 100).toFixed(0)}%を占めています。「食後の後悔予想」の評価文では、この外見の禍々しさを修辞的かつ婉曲に、しかし明確に表現してください。`
    : '';
  // プロンプトには_warningRatioを含めない
  const { _warningRatio: _, ...displayScores } = s;
  return `あなたは世界的に著名なグルメ評論家です。今、目の前に「道端で採取された野草」が持ち込まれました。
添付の画像と以下の解析スコア（各軸0〜5点満点）をもとに、真剣なグルメレビューを日本語で書いてください。
${plantInfo}${warningNote}
【画像解析スコア】
${JSON.stringify(displayScores, null, 2)}

【スコアの算出根拠】
- elegance（外見の気品）: 色相ShannonエントロピーH×平均彩度^0.6の幾何平均
- chefDesire（シェフ熱望度）: 緑ピクセル平均彩度×空間連結性√coherence
- rarity（珍味感）: 輝度ヒストグラムの正規化Shannonエントロピー
- roadside（道端感）: 緑被覆率^0.6×ゾーン均一性(1/(1+CV))
- regret（食後の後悔予想）: 暗部率×0.35+不審色率×0.35+輝度コントラストtanh×0.30

【出力形式（必ずこの構成で出力すること）】

[タグライン]
一言で表す詩的なキャッチコピー（20字以内）

[総評]
全体的なグルメ評価（150〜200字。ミシュランガイドのような格調ある文体で）

[各軸コメント]
- 外見の気品：（スコア${s.elegance}点をもとに、見た目の評価を2〜3文で）
- シェフ熱望度：（スコア${s.chefDesire}点をもとに、プロの調理人が唸るかどうかを2〜3文で）
- 珍味感：（スコア${s.rarity}点をもとに、希少性・複雑さを2〜3文で）
- 道端感：（スコア${s.roadside}点をもとに、野生のテロワールを2〜3文で）
- 食後の後悔予想：（スコア${s.regret}点をもとに、リスクを婉曲に2〜3文で）

[推奨ペアリング]
このグルメ体験に相応しい飲み物を1〜2種類、具体的に理由とともに提案

[ありえない調理法]
この野草を最大限に活かす、本格的だが完全に非現実的な調理法を1つ提案（100〜150字）

重要：全編にわたって終始真剣なトーンを保つこと。笑いを狙わず、本物のグルメ評論として書くこと。
末尾に必ず「※食べないでください」と添えること。`;
}

// ===== 総合スコア → 星 =====
function computeOverallScore(s) {
  const pos = s.elegance * 1.5 + s.chefDesire * 2.0 + s.rarity * 1.0 + s.roadside * 0.8;
  return clamp((pos - s.regret * 1.2) / (1.5 + 2.0 + 1.0 + 0.8), 0, 5);
}

function renderStars(score) {
  const full = Math.floor(score);
  const half = score - full >= 0.4 ? 1 : 0;
  starRating.textContent = '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}

function renderResultScores(s) {
  reviewScores.innerHTML = '<h3>審査スコア詳細</h3>';
  for (const [key, { label, icon }] of Object.entries(SCORE_META)) {
    const val = s[key], pct = (val / 5) * 100;
    reviewScores.innerHTML += `
      <div class="review-score-item">
        <div class="review-score-header">
          <span class="review-score-name">${icon}${label}</span>
          <span class="review-score-num">${val.toFixed(1)} / 5.0</span>
        </div>
        <div class="review-score-track"><div class="review-score-fill" style="width:${pct}%"></div></div>
        <p class="review-score-comment" id="score-comment-${key}"></p>
      </div>`;
  }
}

// ===== 最終レンダリング =====
function finalizeResult(text) {
  const sec = (label) => {
    const m = text.match(new RegExp(`\\[${label}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
    return m ? m[1].trim() : '';
  };

  const tagline = sec('タグライン');
  const total   = sec('総評');
  const axis    = sec('各軸コメント');
  const pairing = sec('推奨ペアリング');
  const cooking = sec('ありえない調理法');

  if (tagline) reviewTagline.textContent = tagline;
  reviewBody.textContent = total || text; // パース失敗時はフルテキストを表示

  const axisKeys   = ['elegance', 'chefDesire', 'rarity', 'roadside', 'regret'];
  const axisLabels = ['外見の気品', 'シェフ熱望度', '珍味感', '道端感', '食後の後悔予想'];
  axisKeys.forEach((key, i) => {
    const re = new RegExp(`[−\\-]\\s*${axisLabels[i]}[：:]+\\s*([^\\n\\-−]+(?:\\n(?![−\\-])[^\\n\\-−]+)*)`);
    const m  = axis.match(re);
    const el = document.getElementById(`score-comment-${key}`);
    if (el && m) el.textContent = m[1].trim();
  });

  if (pairing) reviewPairing.innerHTML = `<h3>${ICONS.wine}推奨ペアリング</h3><p>${pairing}</p>`;
  if (cooking) reviewCooking.innerHTML = `<h3>${ICONS.cooking}推奨調理法</h3><p>${cooking}</p>`;
}

// ===================================================================
// 多視点審査モード
// ===================================================================

const PERSONAS = [
  {
    id: 'french',
    name: 'Pierre Dubois',
    role: 'パリ三つ星 料理長',
    icon: svg(`<path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z"/><line x1="6" x2="18" y1="17" y2="17"/>`, 22),
    weightFn: (s) => (s.elegance * 2.5 + s.chefDesire * 2.0 + s.rarity * 1.5 - s.roadside * 0.5 - s.regret * 1.5) / 5.5,
    buildPrompt: (s, imageContext) => `You are Pierre Dubois, head chef of the three-Michelin-star restaurant "La Maison Verte" in Paris.
Evaluate the wild herb described below with absolute seriousness.

【Objective image analysis】
${imageContext || '(no image analysis available)'}

Scores: ${JSON.stringify(s)}

Output in the following format. Each section must be written FIRST in French, then followed immediately by a Japanese translation in parentheses （日本語訳：…）:

[一言]
A brief evaluation in 20 characters or fewer — write in French first, then （日本語訳：〇〇）

[評価文]
Your assessment as head chef (~150 characters of Japanese equivalent). Write the French paragraph first, then （日本語訳：…） with the full translation. Discuss comparisons to French cuisine and potential as an ingredient with full seriousness.

[一押しポイント]
How this herb could be used in French cuisine, including specific techniques or dish names (~50 characters of Japanese equivalent). French first, then （日本語訳：…）.

Maintain an entirely serious tone throughout. End with "※食べないでください".`,
  },
  {
    id: 'edo',
    name: '山田宗次郎',
    role: '江戸天保年間の食通',
    icon: svg(`<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`, 22),
    weightFn: (s) => (s.roadside * 2.5 + s.rarity * 2.0 + s.elegance * 1.0 - s.regret * 0.8) / 5.0,
    buildPrompt: (s, imageContext) => `あなたは江戸時代天保年間の食通、山田宗次郎です。
古風な日本語（候文や江戸言葉）を用いて、以下の野草を真剣に評価してください。

【客観的画像分析】
${imageContext || '（画像分析なし）'}

スコア: ${JSON.stringify(s)}

以下の形式で出力してください：

[一言]
20字以内の古風な評価

[評価文]
この野草についての食通としての評価（150字程度）。季節感、侘び寂び、自然との調和を重視しつつ真剣に論じること。

[一押しポイント]
この野草を江戸料理に活かすとしたら（50字程度）

終始真剣かつ古風なトーンで。※食べないでください を末尾に。`,
  },
  {
    id: 'herbalist',
    name: '李 文徳',
    role: '東洋医学 薬草研究家',
    icon: svg(`<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>`, 22),
    weightFn: (s) => (s.rarity * 2.0 + s.chefDesire * 1.5 + s.roadside * 2.0 - s.regret * 0.3) / 5.5,
    buildPrompt: (s, imageContext) => `汝乃東洋醫學藥草研究家李文徳。以「氣・陰陽・五行」之觀點，嚴肅分析以下野草。

【客觀畫像分析】
${imageContext || '（無畫像分析）'}

評分數據: ${JSON.stringify(s)}

請依下列格式輸出。各節先以文言漢文（古典的な漢文）で記述し、直後に（日本語訳：…）を付すこと：

[一言]
二十字以內之藥草評語——先に漢文、次に（日本語訳：〇〇）

[評価文]
此野草之藥草評價（日本語換算150字相当）。先に漢文の段落、次に（日本語訳：…）にて全文翻訳。氣の流れ・陰陽バランス・五臓への作用を論じること。評分數値も漢方的に解釈すること。

[一押しポイント]
此野草之藥效與適合之體質・症狀（日本語換算50字相当）。先に漢文、次に（日本語訳：…）。

終始嚴肅な漢方醫のトーンで。末尾に「※食べないでください」を付すこと。`,
  },
];

multiAnalyzeBtn.addEventListener('click', async () => {
  if (!currentImageDataUrl || !currentScores) return;
  await runMultiReview();
});

// ビジョンモデルで画像を客観的に分析してテキスト記述を返す（多視点審査の前処理）
async function runVisionAnalysis() {
  const response = await fetchWithRetry('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'glm-4.6v-flash',
      stream: false,
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: currentImageDataUrl } },
          { type: 'text', text:
            `この植物の画像を客観的に観察し、以下の項目を箇条書きで簡潔に記述してください。評価・感想は一切含めず、観察事実のみ。
- 形態：葉の形・大きさ・縁の形状・茎や枝の特徴
- 色彩：全体の色、グラデーション、斑点・縞・変色の有無
- 質感：表面の艶・毛・ざらつき・肉厚感
- 状態：生育状況・鮮度・傷みの有無
- 特徴的部位：花・実・とげ・根・その他目立つ部位
${currentDetection?.className ? `AI認識クラス: ${currentDetection.className}` : ''}` },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error(`Vision HTTP ${response.status}: ${await response.text()}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

// テキストモデル専用（ビジョン不要・多視点審査のペルソナ呼び出しに使用）
async function callAPIText(prompt) {
  const response = await fetchWithRetry('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({
      model: 'glm-4.7-flash',
      stream: false,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

async function runMultiReview() {
  if (typeof API_KEY === 'undefined' || !API_KEY) {
    alert('config.js にAPIキーを設定してください。');
    return;
  }

  analyzeBtn.disabled = true;
  multiAnalyzeBtn.disabled = true;
  hideSection(previewSection);
  showSection(multiResultSection);

  // プログレスUI初期化（ビジョン分析ステップ + ペルソナ）
  personaTabs.hidden = true;
  personaReviews.innerHTML = '';
  personaProgress.innerHTML = `
    <p class="persona-progress-title">多視点審査 — 専門家パネル</p>
    <div class="persona-progress-item" id="prog-vision">
      <div class="persona-status-icon active" id="picon-vision">…</div>
      <div class="persona-progress-info">
        <div class="persona-progress-name">画像分析AI</div>
        <div class="persona-progress-role">客観的画像記述 (GLM-4.6V-Flash)</div>
      </div>
      <span class="persona-progress-status active" id="pstat-vision">分析中</span>
    </div>
    ${PERSONAS.map(p => `
      <div class="persona-progress-item" id="prog-${p.id}">
        <div class="persona-status-icon pending" id="picon-${p.id}">–</div>
        <div class="persona-progress-info">
          <div class="persona-progress-name">${p.name}</div>
          <div class="persona-progress-role">${p.role}</div>
        </div>
        <span class="persona-progress-status pending" id="pstat-${p.id}">待機中</span>
      </div>`).join('')}`;

  // Step 1: ビジョンモデルで客観的画像分析（1回だけ）
  let visionAnalysis = '';
  try {
    visionAnalysis = await runVisionAnalysis();
    document.getElementById('picon-vision').className = 'persona-status-icon done';
    document.getElementById('picon-vision').innerHTML = svg(`<polyline points="20 6 9 17 4 12"/>`, 14);
    document.getElementById('pstat-vision').className = 'persona-progress-status done';
    document.getElementById('pstat-vision').textContent = '分析完了';
    console.debug('[MICHIKUSA vision analysis]', visionAnalysis);
  } catch (err) {
    document.getElementById('pstat-vision').textContent = 'エラー（スコアのみで継続）';
    console.error('vision analysis failed:', err);
  }

  // Step 2: 各ペルソナをテキストモデルで実行
  const results = [];
  for (const persona of PERSONAS) {
    document.getElementById(`picon-${persona.id}`).className = 'persona-status-icon active';
    document.getElementById(`picon-${persona.id}`).textContent = '…';
    document.getElementById(`pstat-${persona.id}`).className = 'persona-progress-status active';
    document.getElementById(`pstat-${persona.id}`).textContent = '審査中';

    try {
      const text = await callAPIText(persona.buildPrompt(currentScores, visionAnalysis));
      results.push({ persona, text });
      document.getElementById(`picon-${persona.id}`).className = 'persona-status-icon done';
      document.getElementById(`picon-${persona.id}`).innerHTML = svg(`<polyline points="20 6 9 17 4 12"/>`, 14);
      document.getElementById(`pstat-${persona.id}`).className = 'persona-progress-status done';
      document.getElementById(`pstat-${persona.id}`).textContent = '評価完了';
    } catch (err) {
      document.getElementById(`pstat-${persona.id}`).textContent = 'エラー';
      console.error(persona.name, err);
    }
    await sleep(1500);
  }

  renderMultiResult(results);
  analyzeBtn.disabled = false;
  multiAnalyzeBtn.disabled = false;
}

async function callAPISimple(prompt) {
  const response = await fetchWithRetry('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4.6v-flash',
      stream: false,
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: currentImageDataUrl } },
          { type: 'text', text: prompt },
        ],
      }],
    }),
  });
  if (!response.ok) {
    const t = await response.text();
    throw new Error(`HTTP ${response.status}: ${t}`);
  }
  const json = await response.json();
  return json.choices?.[0]?.message?.content ?? '';
}

function renderMultiResult(results) {
  // タブ生成
  personaTabs.innerHTML = results.map((r, i) =>
    `<button class="persona-tab${i === 0 ? ' active' : ''}" data-idx="${i}">
      <span class="tab-name">${r.persona.name}</span>
      <span class="tab-role">${r.persona.role}</span>
    </button>`
  ).join('');
  personaTabs.hidden = false;

  personaTabs.querySelectorAll('.persona-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      personaTabs.querySelectorAll('.persona-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      personaReviews.querySelectorAll('.persona-review-card').forEach(c => c.classList.remove('active'));
      personaReviews.querySelector(`[data-card="${btn.dataset.idx}"]`).classList.add('active');
    });
  });

  // カード生成
  personaReviews.innerHTML = results.map((r, i) => {
    const sec = (label) => {
      const m = r.text.match(new RegExp(`\\[${label}\\]\\s*([\\s\\S]*?)(?=\\[|$)`));
      return m ? m[1].trim() : '';
    };
    const tagline  = sec('一言');
    const comment  = sec('評価文');
    const highlight = sec('一押しポイント');
    const score    = clamp(r.persona.weightFn(currentScores), 0, 5);
    const stars    = '★'.repeat(Math.floor(score)) + (score % 1 >= 0.4 ? '½' : '') + '☆'.repeat(5 - Math.floor(score) - (score % 1 >= 0.4 ? 1 : 0));

    return `
      <div class="persona-review-card${i === 0 ? ' active' : ''}" data-card="${i}">
        <div class="persona-header">
          <div class="persona-avatar">${r.persona.icon}</div>
          <div>
            <div class="persona-name">${r.persona.name}</div>
            <div class="persona-role">${r.persona.role}</div>
            <div class="persona-stars">${stars}</div>
          </div>
        </div>
        <div class="persona-body">
          ${tagline ? `<p class="persona-tagline">「${tagline}」</p>` : ''}
          <p class="persona-comment">${comment || r.text}</p>
        </div>
        ${highlight ? `<div class="persona-highlight">
          <span class="persona-highlight-label">注目ポイント</span>
          ${highlight}
        </div>` : ''}
        <p class="persona-disclaimer">※このアプリは純粋なエンタメです。実際に野草を食べないでください。</p>
      </div>`;
  }).join('');
}

// ===== Share =====
shareBtn.addEventListener('click', async () => {
  const score = computeOverallScore(currentScores);
  const stars = '★'.repeat(Math.round(score)) + '☆'.repeat(5 - Math.round(score));
  const text  = `道草グルメ MICHIKUSA\n${stars}\n${reviewTagline.textContent}\n\n#道草グルメ #MICHIKUSA`;
  if (navigator.share) {
    try { await navigator.share({ title: 'MICHIKUSA 道草グルメ評論', text }); } catch (_) {}
  } else {
    await navigator.clipboard.writeText(text);
    alert('クリップボードにコピーしました！');
  }
});
