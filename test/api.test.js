/**
 * Unit tests for API module
 */

import { describe, it, expect } from './testFramework.js';
import { buildGourmetPrompt, buildPersonaPrompt } from '../src/api.js';

describe('API Module', () => {
  it('buildGourmetPrompt should include all score values', () => {
    const scores = {
      elegance: 4.5,
      chefDesire: 3.2,
      rarity: 4.8,
      roadside: 2.1,
      regret: 1.5
    };

    const prompt = buildGourmetPrompt(scores);

    expect.equal(prompt).toContain('4.5');
    expect.equal(prompt).toContain('3.2');
    expect.equal(prompt).toContain('4.8');
    expect.equal(prompt).toContain('2.1');
    expect.equal(prompt).toContain('1.5');
    expect.equal(prompt).toContain('グルメ評論家');
    expect.equal(prompt).toContain('[タグライン]');
    expect.equal(prompt).toContain('[総評]');
    expect.equal(prompt).toContain('[各軸コメント]');
    expect.equal(prompt).toContain('※食べないでください');
  });

  it('buildGourmetPrompt should include detected class when provided', () => {
    const scores = {
      elegance: 3.0,
      chefDesire: 3.0,
      rarity: 3.0,
      roadside: 3.0,
      regret: 3.0
    };

    const promptWithClass = buildGourmetPrompt(scores, 'daisy');
    expect.equal(promptWithClass).toContain('MobileNet v2');
    expect.equal(promptWithClass).toContain('daisy');

    const promptWithoutClass = buildGourmetPrompt(scores);
    expect.equal(promptWithoutClass).not.toContain('MobileNet v2');
  });

  it('buildGourmetPrompt should include warning alert for high warning ratio', () => {
    const scoresHighWarning = {
      elegance: 3.0,
      chefDesire: 3.0,
      rarity: 3.0,
      roadside: 3.0,
      regret: 4.0,
      _warningRatio: 0.3
    };

    const promptWithWarning = buildGourmetPrompt(scoresHighWarning);
    expect.equal(promptWithWarning).toContain('警戒色アラート');
    expect.equal(promptWithWarning).toContain('30%');

    const scoresLowWarning = {
      elegance: 3.0,
      chefDesire: 3.0,
      rarity: 3.0,
      roadside: 3.0,
      regret: 1.0,
      _warningRatio: 0.1
    };

    const promptNoWarning = buildGourmetPrompt(scoresLowWarning);
    expect.equal(promptNoWarning).not.toContain('警戒色アラート');
  });

  it('buildGourmetPrompt should not expose internal _warningRatio in scores JSON', () => {
    const scores = {
      elegance: 3.0,
      chefDesire: 3.0,
      rarity: 3.0,
      roadside: 3.0,
      regret: 3.0,
      _warningRatio: 0.5
    };

    const prompt = buildGourmetPrompt(scores);

    // Should not appear in the JSON.stringify output
    const jsonMatch = prompt.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      expect.equal(jsonMatch[0]).not.toContain('_warningRatio');
    }
  });

  it('buildPersonaPrompt should generate French chef prompt', () => {
    const scores = {
      elegance: 4.0,
      chefDesire: 4.5,
      rarity: 3.5,
      roadside: 2.0,
      regret: 1.0
    };

    const prompt = buildPersonaPrompt('french', scores, 'Test image context');

    expect.equal(prompt).toContain('Pierre Dubois');
    expect.equal(prompt).toContain('Michelin');
    expect.equal(prompt).toContain('Test image context');
    expect.equal(prompt).toContain('French');
    expect.equal(prompt).toContain('日本語訳');
    expect.equal(prompt).toContain('※食べないでください');
  });

  it('buildPersonaPrompt should generate Edo period prompt', () => {
    const scores = {
      elegance: 3.0,
      chefDesire: 3.0,
      rarity: 4.0,
      roadside: 4.5,
      regret: 2.0
    };

    const prompt = buildPersonaPrompt('edo', scores);

    expect.equal(prompt).toContain('山田宗次郎');
    expect.equal(prompt).toContain('江戸');
    expect.equal(prompt).toContain('天保');
    expect.equal(prompt).toContain('候文');
    expect.equal(prompt).toContain('※食べないでください');
  });

  it('buildPersonaPrompt should generate herbalist prompt', () => {
    const scores = {
      elegance: 2.5,
      chefDesire: 3.0,
      rarity: 4.5,
      roadside: 3.5,
      regret: 2.5
    };

    const prompt = buildPersonaPrompt('herbalist', scores);

    expect.equal(prompt).toContain('李 文徳');
    expect.equal(prompt).toContain('東洋醫學');
    expect.equal(prompt).toContain('陰陽');
    expect.equal(prompt).toContain('五行');
    expect.equal(prompt).toContain('日本語訳');
    expect.equal(prompt).toContain('※食べないでください');
  });

  it('buildPersonaPrompt should throw error for unknown persona', () => {
    const scores = { elegance: 3, chefDesire: 3, rarity: 3, roadside: 3, regret: 3 };

    expect.equal(() => buildPersonaPrompt('unknown', scores)).toThrow();
  });

  it('buildPersonaPrompt should handle missing image context', () => {
    const scores = {
      elegance: 3.0,
      chefDesire: 3.0,
      rarity: 3.0,
      roadside: 3.0,
      regret: 3.0
    };

    const promptFrench = buildPersonaPrompt('french', scores);
    expect.equal(promptFrench).toContain('画像分析なし');

    const promptEdo = buildPersonaPrompt('edo', scores);
    expect.equal(promptEdo).toContain('画像分析なし');

    const promptHerbalist = buildPersonaPrompt('herbalist', scores);
    expect.equal(promptHerbalist).toContain('畫像分析');
  });
});
