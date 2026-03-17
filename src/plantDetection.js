/**
 * Plant detection module using TensorFlow.js MobileNet v2
 * @module plantDetection
 */

import {
  ALL_PLANT_CLASSES,
  CULTIVATED_CLASSES,
  PLANT_SCORE_MODS
} from './constants.js';
import { clamp } from './utils.js';

let mobileNetModel = null;
let plantClassNames = null;

/**
 * Loads MobileNet v2 model for plant classification
 * @returns {Promise<Object>} Loaded MobileNet model
 */
export async function loadMobileNet() {
  if (mobileNetModel) return mobileNetModel;

  // alpha:0.5 = half-channel model (~5MB), balance between accuracy and speed
  mobileNetModel = await mobilenet.load({ version: 2, alpha: 0.5 });

  // Build plant class set immediately after loading
  await buildPlantClassSet(mobileNetModel);
  return mobileNetModel;
}

/**
 * Builds a set of plant class names from the model
 * Uses a dummy canvas to get all 1000 class names and filters for plants
 * @param {Object} model - MobileNet model
 * @returns {Promise<Set<string>>} Set of plant class names
 */
async function buildPlantClassSet(model) {
  if (plantClassNames) return plantClassNames;

  const dummy = document.createElement('canvas');
  dummy.width = dummy.height = 4;
  const allPredictions = await model.classify(dummy, 1000);
  plantClassNames = new Set(
    allPredictions
      .map(p => p.className)
      .filter(isPlantClass)
  );

  console.debug('[MICHIKUSA] 植物クラス数:', plantClassNames.size);
  console.debug('[MICHIKUSA] 植物クラス一覧:', [...plantClassNames].sort().join(', '));
  return plantClassNames;
}

/**
 * Checks if a class name represents a cultivated plant
 * @param {string} className - ImageNet class name
 * @returns {boolean} True if cultivated
 */
function isCultivatedClass(className) {
  if (CULTIVATED_CLASSES.has(className)) return true;
  const lower = className.toLowerCase();
  return lower.includes('flowerpot') || lower.includes('flower pot') || lower === 'pot';
}

/**
 * Checks if a class name represents a plant
 * @param {string} className - ImageNet class name
 * @returns {boolean} True if plant
 */
function isPlantClass(className) {
  if (ALL_PLANT_CLASSES.has(className)) return true;

  // Check primary name (before first comma)
  const primary = className.split(',')[0].trim().toLowerCase();
  for (const plantClass of ALL_PLANT_CLASSES) {
    const plantPrimary = plantClass.toLowerCase().split(',')[0].trim();
    if (plantClass.toLowerCase().startsWith(primary) || primary.startsWith(plantPrimary)) {
      return true;
    }
  }
  return false;
}

/**
 * Detects if image contains a plant and classifies it
 * @param {HTMLImageElement} imgElement - Image element to analyze
 * @param {Object} model - MobileNet model
 * @returns {Promise<Object>} Detection result with isPlant, confidence, className, etc.
 */
export async function detectPlant(imgElement, model) {
  // Classify top 20 classes (plants may not be in top 10)
  const predictions = await model.classify(imgElement, 20);
  const classSet = plantClassNames || new Set();

  let plantScore = 0;
  let cultivatedScore = 0;
  let topPlantClass = null;

  for (const pred of predictions) {
    if (isCultivatedClass(pred.className)) {
      cultivatedScore += pred.probability;
    }
    if (classSet.has(pred.className)) {
      plantScore += pred.probability;
      if (!topPlantClass) topPlantClass = pred.className;
    }
  }

  console.debug(
    '[MICHIKUSA] top-3:',
    predictions.slice(0, 3).map(p => `${p.className}:${(p.probability * 100).toFixed(1)}%`).join(', ')
  );
  console.debug('[MICHIKUSA] plantScore:', plantScore.toFixed(3), 'cultivatedScore:', cultivatedScore.toFixed(3));

  let rejectionType = null;
  if (cultivatedScore >= 0.12) {
    rejectionType = 'cultivated';
  } else if (plantScore <= 0.05) {
    rejectionType = 'non-plant';
  }

  return {
    isPlant: rejectionType === null,
    confidence: plantScore,
    cultivatedScore,
    rejectionType,
    className: topPlantClass,
    topPrediction: predictions[0].className,
    allPredictions: predictions
  };
}

/**
 * Applies plant-specific score modifiers based on detected plant class
 * @param {Object} scores - Base scores object
 * @param {Object} detection - Plant detection result
 * @returns {Object} Modified scores object
 */
export function applyPlantMods(scores, detection) {
  if (!detection.className) return scores;

  const lower = detection.className.toLowerCase();
  const result = { ...scores };

  for (const [plant, mods] of Object.entries(PLANT_SCORE_MODS)) {
    if (lower.includes(plant.toLowerCase())) {
      const weight = clamp(detection.confidence * 2, 0, 1);
      for (const [key, delta] of Object.entries(mods)) {
        result[key] = Math.round(
          clamp((result[key] || 0) + delta * weight, 0, 5) * 10
        ) / 10;
      }
      break;
    }
  }

  return result;
}
