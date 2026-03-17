/**
 * Utility functions for MICHIKUSA application
 * @module utils
 */

/**
 * Clamps a value between a minimum and maximum
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Creates an SVG icon string
 * @param {string} paths - SVG path data
 * @param {number} [size=16] - Icon size in pixels
 * @returns {string} SVG HTML string
 */
export function svg(paths, size = 16) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/**
 * Shows a section by removing the hidden attribute
 * @param {HTMLElement} element - Element to show
 */
export function showSection(element) {
  if (element) element.hidden = false;
}

/**
 * Hides a section by adding the hidden attribute
 * @param {HTMLElement} element - Element to hide
 */
export function hideSection(element) {
  if (element) element.hidden = true;
}

/**
 * Async sleep utility
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Converts sRGB to linear RGB by removing gamma correction
 * @param {number} c - Color component value (0-1)
 * @returns {number} Linear RGB value
 */
export function srgbLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Converts RGB to CIELab color space
 * Uses D65 illuminant for white point
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {[number, number, number]} [L*, a*, b*] values
 */
export function rgbToLab(r, g, b) {
  const rl = srgbLinear(r / 255);
  const gl = srgbLinear(g / 255);
  const bl = srgbLinear(b / 255);

  // D65 illuminant matrix transformation
  const X = rl * 0.4124564 + gl * 0.3575761 + bl * 0.1804375;
  const Y = rl * 0.2126729 + gl * 0.7151522 + bl * 0.0721750;
  const Z = rl * 0.0193339 + gl * 0.1191920 + bl * 0.9503041;

  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fX = f(X / 0.95047);
  const fY = f(Y / 1.00000);
  const fZ = f(Z / 1.08883);

  return [
    116 * fY - 16,        // L*
    500 * (fX - fY),      // a*
    200 * (fY - fZ)       // b*
  ];
}

/**
 * Calculates Shannon entropy of a histogram
 * @param {Array<number>|Float32Array} histogram - Frequency histogram
 * @returns {number} Entropy value in bits
 */
export function shannonEntropy(histogram) {
  const total = histogram.reduce((sum, value) => sum + value, 0);
  if (total === 0) return 0;

  let entropy = 0;
  for (const count of histogram) {
    if (count > 0) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }
  }
  return entropy;
}

/**
 * Fetches a URL with exponential backoff retry on 429 errors
 * @param {string} url - URL to fetch
 * @param {RequestInit} options - Fetch options
 * @param {number} [maxRetries=3] - Maximum retry attempts
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithRetry(url, options, maxRetries = 3) {
  let delay = 4000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    if (response.status !== 429) return response;
    if (attempt === maxRetries) return response;

    // Show retry message if loading text element exists
    const loadingText = document.getElementById('loadingText');
    if (loadingText) {
      loadingText.textContent = `混雑中... ${delay / 1000}秒後にリトライ (${attempt}/${maxRetries - 1})`;
    }

    await sleep(delay);
    delay *= 2; // Exponential backoff: 4s → 8s → 16s
  }
}

/**
 * Parses a section from AI response text
 * @param {string} text - Full response text
 * @param {string} sectionLabel - Section label to extract
 * @returns {string} Extracted section content
 */
export function parseSection(text, sectionLabel) {
  const regex = new RegExp(`\\[${sectionLabel}\\]\\s*([\\s\\S]*?)(?=\\[|$)`);
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Computes overall score from individual scores
 * @param {Object} scores - Score object with elegance, chefDesire, rarity, roadside, regret
 * @returns {number} Overall score (0-5)
 */
export function computeOverallScore(scores) {
  const positive =
    scores.elegance * 1.5 +
    scores.chefDesire * 2.0 +
    scores.rarity * 1.0 +
    scores.roadside * 0.8;
  const totalWeight = 1.5 + 2.0 + 1.0 + 0.8;
  return clamp((positive - scores.regret * 1.2) / totalWeight, 0, 5);
}

/**
 * Renders star rating from score
 * @param {number} score - Score value (0-5)
 * @returns {string} Star rating string (★☆½)
 */
export function renderStars(score) {
  const full = Math.floor(score);
  const half = score - full >= 0.4 ? 1 : 0;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
}
