/**
 * Unit tests for utils module
 */

import { describe, it, expect } from './testFramework.js';
import { clamp, rgbToLab, shannonEntropy, computeOverallScore, renderStars } from '../src/utils.js';

describe('Utils Module', () => {
  it('clamp should limit values to min-max range', () => {
    expect.equal(clamp(5, 0, 10)).toBe(5);
    expect.equal(clamp(-5, 0, 10)).toBe(0);
    expect.equal(clamp(15, 0, 10)).toBe(10);
    expect.equal(clamp(7.5, 0, 10)).toBe(7.5);
  });

  it('rgbToLab should convert RGB to CIELab correctly', () => {
    // Pure red
    const [L1, a1, b1] = rgbToLab(255, 0, 0);
    expect.equal(L1).toBeGreaterThan(40); // L should be moderate
    expect.equal(a1).toBeGreaterThan(60); // a* should be strongly positive (red)

    // Pure green
    const [L2, a2, b2] = rgbToLab(0, 255, 0);
    expect.equal(L2).toBeGreaterThan(80); // L should be high
    expect.equal(a2).toBeLessThan(-60); // a* should be strongly negative (green)

    // Pure blue
    const [L3, a3, b3] = rgbToLab(0, 0, 255);
    expect.equal(L3).toBeGreaterThan(20); // L should be low-moderate
    expect.equal(b3).toBeLessThan(-60); // b* should be strongly negative (blue)

    // Black
    const [L4, a4, b4] = rgbToLab(0, 0, 0);
    expect.equal(L4).toBeCloseTo(0, 1); // L should be near 0

    // White
    const [L5, a5, b5] = rgbToLab(255, 255, 255);
    expect.equal(L5).toBeCloseTo(100, 0); // L should be near 100
  });

  it('shannonEntropy should calculate entropy correctly', () => {
    // Uniform distribution - maximum entropy
    const uniform = new Float32Array([1, 1, 1, 1]);
    const entropyUniform = shannonEntropy(uniform);
    expect.equal(entropyUniform).toBeCloseTo(2, 1); // log2(4) = 2

    // Single value - minimum entropy
    const single = new Float32Array([4, 0, 0, 0]);
    const entropySingle = shannonEntropy(single);
    expect.equal(entropySingle).toBeCloseTo(0, 1);

    // Empty array
    const empty = new Float32Array([0, 0, 0, 0]);
    const entropyEmpty = shannonEntropy(empty);
    expect.equal(entropyEmpty).toBe(0);

    // Mixed distribution
    const mixed = new Float32Array([10, 5, 3, 2]);
    const entropyMixed = shannonEntropy(mixed);
    expect.equal(entropyMixed).toBeGreaterThan(1);
    expect.equal(entropyMixed).toBeLessThan(2);
  });

  it('computeOverallScore should calculate weighted score', () => {
    const scores1 = {
      elegance: 5,
      chefDesire: 5,
      rarity: 5,
      roadside: 5,
      regret: 0
    };
    const overall1 = computeOverallScore(scores1);
    expect.equal(overall1).toBeCloseTo(5, 1); // Perfect score

    const scores2 = {
      elegance: 0,
      chefDesire: 0,
      rarity: 0,
      roadside: 0,
      regret: 5
    };
    const overall2 = computeOverallScore(scores2);
    expect.equal(overall2).toBeLessThan(0); // Should be negative due to high regret

    const scores3 = {
      elegance: 2.5,
      chefDesire: 2.5,
      rarity: 2.5,
      roadside: 2.5,
      regret: 2.5
    };
    const overall3 = computeOverallScore(scores3);
    expect.equal(overall3).toBeGreaterThan(0);
    expect.equal(overall3).toBeLessThan(3);
  });

  it('renderStars should generate correct star strings', () => {
    expect.equal(renderStars(5)).toBe('★★★★★');
    expect.equal(renderStars(0)).toBe('☆☆☆☆☆');
    expect.equal(renderStars(3)).toBe('★★★☆☆');
    expect.equal(renderStars(4.5)).toBe('★★★★½');
    expect.equal(renderStars(2.3)).toBe('★★☆☆☆'); // No half star (< 0.4)
    expect.equal(renderStars(2.4)).toBe('★★½☆☆'); // Half star (>= 0.4)
  });
});
