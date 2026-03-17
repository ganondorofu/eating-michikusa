/**
 * Test runner - imports and runs all tests
 */

import { runTests, clearTests } from './testFramework.js';

// Import all test files
import './utils.test.js';
import './imageAnalysis.test.js';
import './api.test.js';

/**
 * Runs all registered tests
 * @returns {Promise<Object>} Test results
 */
export async function runAllTests() {
  console.log('🧪 Running MICHIKUSA test suite...');
  const results = await runTests();

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const [suiteName, suiteResults] of Object.entries(results)) {
    console.log(`\n📦 ${suiteName}`);
    for (const result of suiteResults) {
      totalTests++;
      if (result.passed) {
        passedTests++;
        console.log(`  ✓ ${result.name}`);
      } else {
        failedTests++;
        console.log(`  ✗ ${result.name}`);
        console.log(`    ${result.error}`);
      }
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Total: ${totalTests} | Passed: ${passedTests} | Failed: ${failedTests}`);
  console.log('='.repeat(50));

  return results;
}
