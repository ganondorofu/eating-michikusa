/**
 * Image analysis module for plant scoring
 * Uses CIELab color space, k-means++ clustering, and Sobel edge detection
 * @module imageAnalysis
 */

import { clamp, rgbToLab, shannonEntropy } from './utils.js';

/**
 * Performs k-means++ clustering in CIELab color space
 * k-means++ initialization avoids local minima
 * @param {Array<Array<number>>} pixels - Array of [L, a, b] pixels
 * @param {number} [k=4] - Number of clusters
 * @param {number} [iterations=15] - Number of iterations
 * @returns {{centroids: Array<Array<number>>, assignments: Int32Array}} Clustering result
 */
export function kMeansLab(pixels, k = 4, iterations = 15) {
  const n = pixels.length;

  // k-means++ initialization
  const centroids = [[...pixels[Math.floor(Math.random() * n)]]];
  for (let ci = 1; ci < k; ci++) {
    const distances = pixels.map(pixel => {
      let minDistance = Infinity;
      for (const centroid of centroids) {
        const distance =
          (pixel[0] - centroid[0]) ** 2 +
          (pixel[1] - centroid[1]) ** 2 +
          (pixel[2] - centroid[2]) ** 2;
        if (distance < minDistance) minDistance = distance;
      }
      return minDistance;
    });

    const sum = distances.reduce((a, b) => a + b, 0);
    let random = Math.random() * sum;
    let idx = 0;
    while (idx < n - 1 && random > distances[idx]) {
      random -= distances[idx++];
    }
    centroids.push([...pixels[idx]]);
  }

  const assignments = new Int32Array(n);

  // Iterate to convergence
  for (let iter = 0; iter < iterations; iter++) {
    // Assignment step
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDistance = Infinity;
      for (let c = 0; c < k; c++) {
        const distance =
          (pixels[i][0] - centroids[c][0]) ** 2 +
          (pixels[i][1] - centroids[c][1]) ** 2 +
          (pixels[i][2] - centroids[c][2]) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = c;
        }
      }
      assignments[i] = best;
    }

    // Update step
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Int32Array(k);
    for (let i = 0; i < n; i++) {
      const cluster = assignments[i];
      sums[cluster][0] += pixels[i][0];
      sums[cluster][1] += pixels[i][1];
      sums[cluster][2] += pixels[i][2];
      counts[cluster]++;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = sums[c].map(s => s / counts[c]);
      }
    }
  }

  return { centroids, assignments };
}

/**
 * Calculates edge density using Sobel filter within a mask
 * Higher edge density indicates texture/roughness
 * @param {Uint8ClampedArray} imageData - RGBA image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {Uint8Array} mask - Binary mask (1 for included pixels)
 * @returns {number} Normalized edge density (0-1)
 */
export function sobelEdgeDensity(imageData, width, height, mask) {
  let edgeSum = 0;
  let count = 0;

  const getLuminance = (index) => {
    const i = index * 4;
    return 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
  };

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (!mask[idx]) continue;
      count++;

      // Get 3x3 neighborhood luminance
      const tl = getLuminance((y - 1) * width + x - 1);
      const tc = getLuminance((y - 1) * width + x);
      const tr = getLuminance((y - 1) * width + x + 1);
      const ml = getLuminance(y * width + x - 1);
      const mr = getLuminance(y * width + x + 1);
      const bl = getLuminance((y + 1) * width + x - 1);
      const bc = getLuminance((y + 1) * width + x);
      const br = getLuminance((y + 1) * width + x + 1);

      // Sobel operators
      const gx = -tl - 2 * ml - bl + tr + 2 * mr + br;
      const gy = -tl - 2 * tc - tr + bl + 2 * bc + br;
      edgeSum += Math.sqrt(gx * gx + gy * gy);
    }
  }

  return count > 0 ? edgeSum / (count * 255 * 4) : 0;
}

/**
 * Analyzes an image and computes plant quality scores
 * @param {HTMLImageElement} imageElement - Image to analyze
 * @param {HTMLCanvasElement} canvas - Canvas for processing
 * @returns {Promise<Object>} Scores object with elegance, chefDesire, rarity, roadside, regret
 */
export async function analyzeImageScores(imageElement, canvas) {
  const ctx = canvas.getContext('2d');
  const W = 200;
  const H = 200;
  const N = W * H;

  canvas.width = W;
  canvas.height = H;
  ctx.drawImage(imageElement, 0, 0, W, H);
  const { data } = ctx.getImageData(0, 0, W, H);

  // Step 1: Convert all pixels to CIELab
  const labPixels = [];
  for (let i = 0; i < N; i++) {
    labPixels.push(rgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]));
  }

  // Step 2: k-means++ clustering
  const { centroids, assignments } = kMeansLab(labPixels, 4, 15);

  // Step 3: Identify plant clusters
  // Lab a* axis: negative = green, positive = red
  // Select clusters with a* < -2 as plant regions
  const plantClusters = new Set();
  centroids.forEach((centroid, i) => {
    if (centroid[1] < -2) plantClusters.add(i);
  });

  // If no green clusters, use the greenest one
  if (plantClusters.size === 0) {
    const greenest = centroids.reduce(
      (best, c, i) => (c[1] < centroids[best][1] ? i : best),
      0
    );
    plantClusters.add(greenest);
  }

  // Step 4: Generate plant mask
  const plantMask = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (plantClusters.has(assignments[i])) plantMask[i] = 1;
  }
  const plantCount = plantMask.reduce((sum, v) => sum + v, 0);
  const plantRatio = plantCount / N;

  // Step 5: Calculate statistics from plant pixels only
  const plantLab = [];
  for (let i = 0; i < N; i++) {
    if (plantMask[i]) plantLab.push(labPixels[i]);
  }
  const pN = plantLab.length || 1;

  // Chroma (saturation): C* = sqrt(a*² + b*²)
  const chromas = plantLab.map(([, a, b]) => Math.sqrt(a * a + b * b));
  const meanChroma = chromas.reduce((s, v) => s + v, 0) / pN;
  const chromaStd = Math.sqrt(
    chromas.reduce((s, v) => s + (v - meanChroma) ** 2, 0) / pN
  );

  // Mean a* (greenness: more negative = purer green)
  const meanA = plantLab.reduce((s, [, a]) => s + a, 0) / pN;

  // Hue angle histogram
  const hueHist = new Float32Array(36);
  const lumaHist = new Float32Array(20);
  for (const [L, a, b] of plantLab) {
    let hueAngle = Math.atan2(b, a) * (180 / Math.PI);
    if (hueAngle < 0) hueAngle += 360;
    hueHist[Math.min(35, Math.floor(hueAngle / 10))]++;
    lumaHist[Math.min(19, Math.floor(L / 5))]++;
  }
  const hueEntropyNorm = shannonEntropy(hueHist) / Math.log2(36);
  const lumaEntropyNorm = shannonEntropy(lumaHist) / Math.log2(20);

  // Dark pixels (L* < 20)
  const darkRatio = plantLab.filter(([L]) => L < 20).length / pN;

  // Suspicious color (yellowing or browning)
  const suspRatio =
    plantLab.filter(
      ([L, a, b]) =>
        (a > -5 && b > 20 && L > 25) || (a > 5 && L < 50 && L > 15)
    ).length / pN;

  // Warning colors (toxic-looking colors in CIELab)
  const warningRatio =
    plantLab.filter(([L, a, b]) => {
      const C = Math.sqrt(a * a + b * b);
      return (
        (a > 18 && L > 20 && L < 78) ||           // Red
        (a > 10 && b > 15 && L > 30 && L < 78) || // Orange
        (b < -10 && L > 15 && L < 65) ||          // Purple
        (C > 50 && L > 20)                         // Ultra-high chroma
      );
    }).length / pN;

  // Step 6: Sobel edge density
  const edgeDensity = sobelEdgeDensity(data, W, H, plantMask);

  // Score calculation
  // 1. Elegance: based on mean chroma
  const elegance = clamp((meanChroma / 35) * 5, 0, 5);

  // 2. Chef desire: green degree + chroma uniformity
  const greenDegree = clamp(-meanA / 20, 0, 1);
  const chromaUnif = clamp(1 - chromaStd / (meanChroma + 0.1), 0, 1);
  const chefDesire = clamp((greenDegree * 0.65 + chromaUnif * 0.35) * 5, 0, 5);

  // 3. Rarity: hue entropy
  const rarity = clamp(hueEntropyNorm * 5.5, 0, 5);

  // 4. Roadside: plant coverage + luma entropy
  const roadside = clamp(
    (Math.pow(plantRatio, 0.6) * 0.7 + lumaEntropyNorm * 0.3) * 6,
    0,
    5
  );

  // 5. Regret: dark ratio + suspicious color + edge density + warning colors
  const regret = clamp(
    (darkRatio * 0.15 + suspRatio * 0.2 + edgeDensity * 0.15 + warningRatio * 0.5) * 16,
    0,
    5
  );

  const scores = {
    elegance: Math.round(elegance * 10) / 10,
    chefDesire: Math.round(chefDesire * 10) / 10,
    rarity: Math.round(rarity * 10) / 10,
    roadside: Math.round(roadside * 10) / 10,
    regret: Math.round(regret * 10) / 10,
    _warningRatio: Math.round(warningRatio * 100) / 100
  };

  console.debug('[MICHIKUSA ML]', {
    plantRatio: plantRatio.toFixed(3),
    plantClusters: [...plantClusters],
    meanChroma: meanChroma.toFixed(2),
    meanA: meanA.toFixed(2),
    hueEntropyNorm: hueEntropyNorm.toFixed(3),
    edgeDensity: edgeDensity.toFixed(4),
    warningRatio: warningRatio.toFixed(3),
    centroids: centroids.map(c => c.map(v => v.toFixed(1))),
    scores
  });

  return scores;
}
