/**
 * UI and DOM manipulation module
 * @module ui
 */

import { SCORE_META, PERSONAS, REJECTION, LOADING_MESSAGES } from './constants.js';
import { svg, showSection, hideSection, parseSection, renderStars } from './utils.js';
import { ICON_PATHS } from './constants.js';

let loadingInterval = null;

/**
 * Creates SVG icons from icon paths
 * @returns {Object} Icon HTML strings
 */
export function createIcons() {
  const icons = {};
  for (const [key, paths] of Object.entries(ICON_PATHS)) {
    icons[key] = svg(paths);
  }
  return icons;
}

/**
 * Renders score bars in the preview section
 * @param {Object} scores - Scores object
 * @param {HTMLElement} container - Container element
 */
export function renderScoreBars(scores, container) {
  container.innerHTML = '';
  for (const [key, value] of Object.entries(scores)) {
    if (!SCORE_META[key]) continue; // Skip internal fields

    const percent = (value / 5) * 100;
    const { label } = SCORE_META[key];

    container.innerHTML += `
      <div class="score-bar-item">
        <span class="score-bar-label">${label}</span>
        <div class="score-bar-track">
          <div class="score-bar-fill" style="width:${percent}%"></div>
        </div>
        <span class="score-bar-value">${value.toFixed(1)}</span>
      </div>`;
  }
}

/**
 * Renders detailed scores in result section
 * @param {Object} scores - Scores object
 * @param {HTMLElement} container - Container element
 * @param {Object} icons - Icon objects
 */
export function renderResultScores(scores, container, icons) {
  container.innerHTML = '<h3>審査スコア詳細</h3>';

  for (const [key, { label }] of Object.entries(SCORE_META)) {
    const value = scores[key];
    const percent = (value / 5) * 100;
    const icon = icons[key] || '';

    container.innerHTML += `
      <div class="review-score-item">
        <div class="review-score-header">
          <span class="review-score-name">${icon}${label}</span>
          <span class="review-score-num">${value.toFixed(1)} / 5.0</span>
        </div>
        <div class="review-score-track">
          <div class="review-score-fill" style="width:${percent}%"></div>
        </div>
        <p class="review-score-comment" id="score-comment-${key}"></p>
      </div>`;
  }
}

/**
 * Displays rejection card for non-plant or cultivated plants
 * @param {Object} detection - Detection result
 */
export function showRejection(detection) {
  const type = detection.rejectionType || 'non-plant';
  const { title, msgs } = REJECTION[type];
  const msg = msgs[Math.floor(Math.random() * msgs.length)];

  document.getElementById('rejectionTitle').textContent = title;
  document.getElementById('rejectionMsg').textContent = msg;

  const detectedText =
    type === 'cultivated'
      ? `AI判定: 「${detection.topPrediction}」 / 鉢植えスコア: ${(detection.cultivatedScore * 100).toFixed(1)}%`
      : `AI判定: 「${detection.topPrediction}」 / 植物スコア: ${(detection.confidence * 100).toFixed(1)}%`;

  document.getElementById('rejectionDetected').textContent = detectedText;
  document.getElementById('rejectionCard').hidden = false;
  document.getElementById('scorePreview').hidden = true;
  document.getElementById('btnGroup').hidden = true;
}

/**
 * Starts loading animation cycle
 */
export function startLoadingAnimation() {
  const loadingText = document.getElementById('loadingText');
  if (!loadingText) return;

  let index = 0;
  loadingText.textContent = LOADING_MESSAGES[0];
  loadingInterval = setInterval(() => {
    index = (index + 1) % LOADING_MESSAGES.length;
    loadingText.textContent = LOADING_MESSAGES[index];
  }, 1800);
}

/**
 * Stops loading animation
 */
export function stopLoadingAnimation() {
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
}

/**
 * Parses and displays final review result
 * @param {string} text - AI response text
 */
export function finalizeResult(text) {
  const tagline = parseSection(text, 'タグライン');
  const total = parseSection(text, '総評');
  const axis = parseSection(text, '各軸コメント');
  const pairing = parseSection(text, '推奨ペアリング');
  const cooking = parseSection(text, 'ありえない調理法');

  const reviewTagline = document.getElementById('reviewTagline');
  const reviewBody = document.getElementById('reviewBody');
  const reviewPairing = document.getElementById('reviewPairing');
  const reviewCooking = document.getElementById('reviewCooking');

  if (tagline && reviewTagline) reviewTagline.textContent = tagline;
  if (reviewBody) reviewBody.textContent = total || text;

  // Parse individual axis comments
  const axisKeys = ['elegance', 'chefDesire', 'rarity', 'roadside', 'regret'];
  const axisLabels = ['外見の気品', 'シェフ熱望度', '珍味感', '道端感', '食後の後悔予想'];

  axisKeys.forEach((key, i) => {
    const regex = new RegExp(
      `[−\\-]\\s*${axisLabels[i]}[：:]+\\s*([^\\n\\-−]+(?:\\n(?![−\\-])[^\\n\\-−]+)*)`
    );
    const match = axis.match(regex);
    const element = document.getElementById(`score-comment-${key}`);
    if (element && match) {
      element.textContent = match[1].trim();
    }
  });

  const icons = createIcons();
  if (pairing && reviewPairing) {
    reviewPairing.innerHTML = `<h3>${icons.wine}推奨ペアリング</h3><p>${pairing}</p>`;
  }
  if (cooking && reviewCooking) {
    reviewCooking.innerHTML = `<h3>${icons.cooking}推奨調理法</h3><p>${cooking}</p>`;
  }
}

/**
 * Renders multi-persona review results
 * @param {Array} results - Array of persona review results
 * @param {Object} scores - Current scores for weight calculation
 */
export function renderMultiResult(results, scores) {
  const personaTabs = document.getElementById('personaTabs');
  const personaReviews = document.getElementById('personaReviews');

  if (!personaTabs || !personaReviews) return;

  // Generate tabs
  personaTabs.innerHTML = results
    .map((r, i) => `
      <button class="persona-tab${i === 0 ? ' active' : ''}" data-idx="${i}">
        <span class="tab-name">${r.persona.name}</span>
        <span class="tab-role">${r.persona.role}</span>
      </button>`)
    .join('');
  personaTabs.hidden = false;

  // Add tab click handlers
  personaTabs.querySelectorAll('.persona-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      personaTabs.querySelectorAll('.persona-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      personaReviews.querySelectorAll('.persona-review-card').forEach(c => c.classList.remove('active'));
      personaReviews.querySelector(`[data-card="${btn.dataset.idx}"]`).classList.add('active');
    });
  });

  // Generate review cards
  personaReviews.innerHTML = results
    .map((r, i) => {
      const tagline = parseSection(r.text, '一言');
      const comment = parseSection(r.text, '評価文');
      const highlight = parseSection(r.text, '一押しポイント');

      const persona = PERSONAS.find(p => p.id === r.persona.id);
      const score = persona ? persona.weightFn(scores) : 0;
      const stars = renderStars(Math.max(0, Math.min(5, score)));

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
          ${
            highlight
              ? `<div class="persona-highlight">
                <span class="persona-highlight-label">注目ポイント</span>
                ${highlight}
              </div>`
              : ''
          }
          <p class="persona-disclaimer">※このアプリは純粋なエンタメです。実際に野草を食べないでください。</p>
        </div>`;
    })
    .join('');
}

/**
 * Updates persona progress UI during multi-review
 * @param {string} personaId - Persona ID or 'vision'
 * @param {string} status - 'active', 'done', or 'error'
 * @param {string} [message] - Status message
 */
export function updatePersonaProgress(personaId, status, message) {
  const icon = document.getElementById(`picon-${personaId}`);
  const statusEl = document.getElementById(`pstat-${personaId}`);

  if (!icon || !statusEl) return;

  if (status === 'active') {
    icon.className = 'persona-status-icon active';
    icon.textContent = '…';
    statusEl.className = 'persona-progress-status active';
    statusEl.textContent = message || '処理中';
  } else if (status === 'done') {
    icon.className = 'persona-status-icon done';
    icon.innerHTML = svg('<polyline points="20 6 9 17 4 12"/>', 14);
    statusEl.className = 'persona-progress-status done';
    statusEl.textContent = message || '完了';
  } else if (status === 'error') {
    icon.className = 'persona-status-icon error';
    icon.textContent = '✗';
    statusEl.className = 'persona-progress-status error';
    statusEl.textContent = message || 'エラー';
  }
}

/**
 * Initializes persona progress UI
 * @param {Array} personas - Array of persona objects
 */
export function initPersonaProgress(personas) {
  const personaProgress = document.getElementById('personaProgress');
  if (!personaProgress) return;

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
    ${personas
      .map(
        p => `
      <div class="persona-progress-item" id="prog-${p.id}">
        <div class="persona-status-icon pending" id="picon-${p.id}">–</div>
        <div class="persona-progress-info">
          <div class="persona-progress-name">${p.name}</div>
          <div class="persona-progress-role">${p.role}</div>
        </div>
        <span class="persona-progress-status pending" id="pstat-${p.id}">待機中</span>
      </div>`
      )
      .join('')}`;
}
