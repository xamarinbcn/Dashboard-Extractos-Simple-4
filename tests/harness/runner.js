/**
 * Harness mínimo para tests de Fase 1.
 * 
 * Implementa sección 7.1 del alcance.
 * No usa dependencias externas.
 */

/**
 * Resultados acumulados de tests.
 */
const testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Ejecuta una suite de tests.
 * 
 * @param {string} name - Nombre de la suite
 * @param {Function} fn - Función asíncrona que contiene los tests
 */
export async function runSuite(name, fn) {
  console.group(`📋 Suite: ${name}`);
  try {
    await fn();
    console.groupEnd();
  } catch (error) {
    console.error(`❌ Suite ${name} failed:`, error);
    testResults.errors.push({ suite: name, error: error.message });
    console.groupEnd();
  }
}

/**
 * Ejecuta un test individual.
 * 
 * @param {string} name - Nombre descriptivo del test
 * @param {Function} fn - Función asíncrona del test
 */
export async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    testResults.passed++;
  } catch (error) {
    console.error(`  ❌ ${name}`);
    console.error(`     Error: ${error.message}`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
  }
}

/**
 * Assert que dos valores son iguales (===).
 */
export function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const msg = message || `Expected ${expected}, got ${actual}`;
    throw new Error(`${msg} (actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)})`);
  }
}

/**
 * Assert que un valor es truthy.
 */
export function assertTrue(value, message) {
  if (!value) {
    throw new Error(message || `Expected truthy value, got ${value}`);
  }
}

/**
 * Assert que un valor es falsy.
 */
export function assertFalse(value, message) {
  if (value) {
    throw new Error(message || `Expected falsy value, got ${value}`);
  }
}

/**
 * Assert que una promesa rechaza con un código de error específico.
 */
export async function assertRejectsWithCode(promise, code, message) {
  try {
    await promise;
    throw new Error(message || `Expected promise to reject with ${code}, but it resolved`);
  } catch (error) {
    if (error.code === code || error.message.includes(code)) {
      return;
    }
    throw new Error(message || `Expected error code ${code}, got ${error.code || error.message}`);
  }
}

/**
 * Obtiene resumen de resultados.
 */
export function getResults() {
  return { ...testResults };
}

/**
 * Imprime resumen final.
 */
export function printSummary() {
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Summary: ${testResults.passed} passed, ${testResults.failed} failed`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Failed tests:');
    testResults.errors.forEach(err => {
      console.log(`   - ${err.test || err.suite}: ${err.error}`);
    });
  }
  
  console.log('='.repeat(50));
  
  return testResults.failed === 0;
}

if (typeof window !== 'undefined') {
  window.TestRunner = {
    runSuite,
    test,
    assertEqual,
    assertTrue,
    assertFalse,
    assertRejectsWithCode,
    getResults,
    printSummary
  };
}
