/**
 * Simple test framework for MICHIKUSA
 * @module testFramework
 */

const testSuites = [];
let currentSuite = null;

/**
 * Defines a test suite
 * @param {string} name - Suite name
 * @param {Function} fn - Suite definition function
 */
export function describe(name, fn) {
  const suite = { name, tests: [] };
  testSuites.push(suite);
  currentSuite = suite;
  fn();
  currentSuite = null;
}

/**
 * Defines a test case
 * @param {string} name - Test name
 * @param {Function} fn - Test function
 */
export function it(name, fn) {
  if (!currentSuite) {
    throw new Error('it() must be called inside describe()');
  }
  currentSuite.tests.push({ name, fn });
}

/**
 * Assertion helper
 */
export const expect = {
  /**
   * Checks if value equals expected
   * @param {*} actual - Actual value
   * @returns {Object} Assertion object
   */
  equal(actual) {
    return {
      toBe(expected) {
        if (actual !== expected) {
          throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toEqual(expected) {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`);
        }
      },
      toBeGreaterThan(expected) {
        if (actual <= expected) {
          throw new Error(`Expected ${actual} to be greater than ${expected}`);
        }
      },
      toBeLessThan(expected) {
        if (actual >= expected) {
          throw new Error(`Expected ${actual} to be less than ${expected}`);
        }
      },
      toBeCloseTo(expected, precision = 2) {
        const diff = Math.abs(actual - expected);
        const tolerance = Math.pow(10, -precision);
        if (diff > tolerance) {
          throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`);
        }
      },
      toBeTruthy() {
        if (!actual) {
          throw new Error(`Expected ${actual} to be truthy`);
        }
      },
      toBeFalsy() {
        if (actual) {
          throw new Error(`Expected ${actual} to be falsy`);
        }
      },
      toContain(item) {
        if (!actual.includes(item)) {
          throw new Error(`Expected array to contain ${item}`);
        }
      },
      toBeInstanceOf(constructor) {
        if (!(actual instanceof constructor)) {
          throw new Error(`Expected ${actual} to be instance of ${constructor.name}`);
        }
      },
      toThrow() {
        try {
          actual();
          throw new Error('Expected function to throw an error');
        } catch (e) {
          // Expected
        }
      }
    };
  }
};

/**
 * Runs all test suites
 * @returns {Promise<Object>} Test results by suite name
 */
export async function runTests() {
  const results = {};

  for (const suite of testSuites) {
    results[suite.name] = [];

    for (const test of suite.tests) {
      try {
        await test.fn();
        results[suite.name].push({
          name: test.name,
          passed: true
        });
      } catch (error) {
        results[suite.name].push({
          name: test.name,
          passed: false,
          error: error.message || String(error)
        });
      }
    }
  }

  return results;
}

/**
 * Clears all registered test suites
 */
export function clearTests() {
  testSuites.length = 0;
}
