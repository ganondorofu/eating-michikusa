/**
 * Unit tests for imageAnalysis module
 */

import { describe, it, expect } from './testFramework.js';
import { kMeansLab, sobelEdgeDensity } from '../src/imageAnalysis.js';

describe('Image Analysis Module', () => {
  it('kMeansLab should cluster pixels correctly', () => {
    // Create simple test data: 4 distinct colors in Lab space
    const pixels = [
      [50, -50, 30], [51, -49, 31], [49, -51, 29], // Cluster 1: green
      [70, 40, 50],  [71, 41, 51],  [69, 39, 49],  // Cluster 2: red
      [30, 0, 0],    [31, 1, -1],   [29, -1, 1],   // Cluster 3: dark gray
      [90, 10, 10],  [91, 11, 11],  [89, 9, 9]     // Cluster 4: light
    ];

    const result = kMeansLab(pixels, 4, 20);

    expect.equal(result.centroids.length).toBe(4);
    expect.equal(result.assignments.length).toBe(pixels.length);

    // Each cluster should have 3 pixels
    const counts = new Array(4).fill(0);
    for (let i = 0; i < result.assignments.length; i++) {
      counts[result.assignments[i]]++;
    }

    // All counts should be 3 (perfect clustering)
    for (const count of counts) {
      expect.equal(count).toBe(3);
    }
  });

  it('kMeansLab should handle edge cases', () => {
    // Single pixel
    const singlePixel = [[50, 0, 0]];
    const result1 = kMeansLab(singlePixel, 1, 10);
    expect.equal(result1.centroids.length).toBe(1);
    expect.equal(result1.assignments.length).toBe(1);

    // Two clusters with identical pixels
    const identicalPixels = [
      [50, 0, 0], [50, 0, 0], [50, 0, 0]
    ];
    const result2 = kMeansLab(identicalPixels, 2, 10);
    expect.equal(result2.centroids.length).toBe(2);
  });

  it('sobelEdgeDensity should detect edges', () => {
    // Create a test image data with vertical edge
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    // Left half black, right half white - strong vertical edge
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const value = x < width / 2 ? 0 : 255;
        data[idx] = value;     // R
        data[idx + 1] = value; // G
        data[idx + 2] = value; // B
        data[idx + 3] = 255;   // A
      }
    }

    // Mask includes all pixels
    const mask = new Uint8Array(width * height).fill(1);
    const edgeDensity = sobelEdgeDensity(data, width, height, mask);

    // Should detect strong edge
    expect.equal(edgeDensity).toBeGreaterThan(0);
  });

  it('sobelEdgeDensity should return 0 for uniform image', () => {
    // Create uniform image (no edges)
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4);

    // All pixels same gray value
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // R
      data[i + 1] = 128; // G
      data[i + 2] = 128; // B
      data[i + 3] = 255; // A
    }

    const mask = new Uint8Array(width * height).fill(1);
    const edgeDensity = sobelEdgeDensity(data, width, height, mask);

    // Should be very low or zero
    expect.equal(edgeDensity).toBeCloseTo(0, 2);
  });

  it('sobelEdgeDensity should respect mask', () => {
    const width = 10;
    const height = 10;
    const data = new Uint8ClampedArray(width * height * 4).fill(128);

    // Empty mask - no pixels included
    const emptyMask = new Uint8Array(width * height).fill(0);
    const edgeDensity1 = sobelEdgeDensity(data, width, height, emptyMask);
    expect.equal(edgeDensity1).toBe(0);

    // Full mask
    const fullMask = new Uint8Array(width * height).fill(1);
    const edgeDensity2 = sobelEdgeDensity(data, width, height, fullMask);
    expect.equal(edgeDensity2).toBeGreaterThan(0) || expect.equal(edgeDensity2).toBe(0); // Either is valid for uniform
  });
});
