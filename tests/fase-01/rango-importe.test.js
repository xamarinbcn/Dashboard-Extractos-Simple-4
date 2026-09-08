/**
 * Pruebas unitarias de rango de importe - Sección 7.3
 * 
 * Cubre: U-RANGO-001, U-RANGO-002
 */

import { runSuite, test, assertEqual, assertTrue } from '../harness/runner.js';
import { calcularRangoImporte, getAllRangos, isValidRango } from '../../crypto/rango-importe.js';

export async function runRangoImporteTests() {
  await runSuite('Rango de Importe (7.3)', async () => {
    
    // U-RANGO-001: Tabla cerrada - casos positivos
    await test('U-RANGO-001: Cero → POS_0-10', async () => {
      assertEqual(calcularRangoImporte(0), 'POS_0-10', 'Cero debe ser POS_0-10');
    });
    
    await test('U-RANGO-001: 999 → POS_0-10', async () => {
      assertEqual(calcularRangoImporte(999), 'POS_0-10');
    });
    
    await test('U-RANGO-001: 1000 → POS_10-50', async () => {
      assertEqual(calcularRangoImporte(1000), 'POS_10-50');
    });
    
    await test('U-RANGO-001: 4999 → POS_10-50', async () => {
      assertEqual(calcularRangoImporte(4999), 'POS_10-50');
    });
    
    await test('U-RANGO-001: 5000 → POS_50-100', async () => {
      assertEqual(calcularRangoImporte(5000), 'POS_50-100');
    });
    
    await test('U-RANGO-001: 9999 → POS_50-100', async () => {
      assertEqual(calcularRangoImporte(9999), 'POS_50-100');
    });
    
    await test('U-RANGO-001: 10000 → POS_100-250', async () => {
      assertEqual(calcularRangoImporte(10000), 'POS_100-250');
    });
    
    await test('U-RANGO-001: 24999 → POS_100-250', async () => {
      assertEqual(calcularRangoImporte(24999), 'POS_100-250');
    });
    
    await test('U-RANGO-001: 25000 → POS_250-500', async () => {
      assertEqual(calcularRangoImporte(25000), 'POS_250-500');
    });
    
    await test('U-RANGO-001: 49999 → POS_250-500', async () => {
      assertEqual(calcularRangoImporte(49999), 'POS_250-500');
    });
    
    await test('U-RANGO-001: 50000 → POS_500-1000', async () => {
      assertEqual(calcularRangoImporte(50000), 'POS_500-1000');
    });
    
    await test('U-RANGO-001: 99999 → POS_500-1000', async () => {
      assertEqual(calcularRangoImporte(99999), 'POS_500-1000');
    });
    
    await test('U-RANGO-001: 100000 → POS_1000-2500', async () => {
      assertEqual(calcularRangoImporte(100000), 'POS_1000-2500');
    });
    
    await test('U-RANGO-001: 249999 → POS_1000-2500', async () => {
      assertEqual(calcularRangoImporte(249999), 'POS_1000-2500');
    });
    
    await test('U-RANGO-001: 250000 → POS_2500-5000', async () => {
      assertEqual(calcularRangoImporte(250000), 'POS_2500-5000');
    });
    
    await test('U-RANGO-001: 499999 → POS_2500-5000', async () => {
      assertEqual(calcularRangoImporte(499999), 'POS_2500-5000');
    });
    
    await test('U-RANGO-001: 500000 → POS_5000+', async () => {
      assertEqual(calcularRangoImporte(500000), 'POS_5000+');
    });
    
    // Casos negativos
    await test('U-RANGO-001: -1 → NEG_0-10', async () => {
      assertEqual(calcularRangoImporte(-1), 'NEG_0-10');
    });
    
    await test('U-RANGO-001: -999 → NEG_0-10', async () => {
      assertEqual(calcularRangoImporte(-999), 'NEG_0-10');
    });
    
    await test('U-RANGO-001: -1000 → NEG_10-50', async () => {
      assertEqual(calcularRangoImporte(-1000), 'NEG_10-50');
    });
    
    await test('U-RANGO-001: -5000 → NEG_50-100', async () => {
      assertEqual(calcularRangoImporte(-5000), 'NEG_50-100');
    });
    
    await test('U-RANGO-001: -10000 → NEG_100-250', async () => {
      assertEqual(calcularRangoImporte(-10000), 'NEG_100-250');
    });
    
    await test('U-RANGO-001: -25000 → NEG_250-500', async () => {
      assertEqual(calcularRangoImporte(-25000), 'NEG_250-500');
    });
    
    await test('U-RANGO-001: -50000 → NEG_500-1000', async () => {
      assertEqual(calcularRangoImporte(-50000), 'NEG_500-1000');
    });
    
    await test('U-RANGO-001: -100000 → NEG_1000-2500', async () => {
      assertEqual(calcularRangoImporte(-100000), 'NEG_1000-2500');
    });
    
    await test('U-RANGO-001: -250000 → NEG_2500-5000', async () => {
      assertEqual(calcularRangoImporte(-250000), 'NEG_2500-5000');
    });
    
    await test('U-RANGO-001: -500000 → NEG_5000+', async () => {
      assertEqual(calcularRangoImporte(-500000), 'NEG_5000+');
    });
    
    // U-RANGO-002: Entrada no entera debe lanzar TypeError
    await test('U-RANGO-002: Entrada float lanza TypeError', async () => {
      let threw = false;
      try {
        calcularRangoImporte(1000.5);
      } catch (error) {
        threw = true;
        assertTrue(
          error instanceof TypeError,
          `Debe lanzar TypeError, got: ${error.constructor.name}`
        );
      }
      assertTrue(threw, 'Debe lanzar excepción para entrada no entera');
    });
    
    await test('U-RANGO-002: Entrada string lanza TypeError', async () => {
      let threw = false;
      try {
        calcularRangoImporte('1000');
      } catch (error) {
        threw = true;
        assertTrue(
          error instanceof TypeError,
          `Debe lanzar TypeError, got: ${error.constructor.name}`
        );
      }
      assertTrue(threw, 'Debe lanzar excepción para entrada string');
    });
    
    await test('U-RANGO-002: Entrada null lanza TypeError', async () => {
      let threw = false;
      try {
        calcularRangoImporte(null);
      } catch (error) {
        threw = true;
        assertTrue(
          error instanceof TypeError,
          `Debe lanzar TypeError, got: ${error.constructor.name}`
        );
      }
      assertTrue(threw, 'Debe lanzar excepción para entrada null');
    });
    
    // Pruebas con BigInt
    await test('U-RANGO-001: BigInt positivo', async () => {
      assertEqual(calcularRangoImporte(1000n), 'POS_10-50');
    });
    
    await test('U-RANGO-001: BigInt negativo', async () => {
      assertEqual(calcularRangoImporte(-1000n), 'NEG_10-50');
    });
    
    // Utilidades
    await test('U-RANGO-001: getAllRangos devuelve lista completa', async () => {
      const rangos = getAllRangos();
      assertTrue(rangos.length > 0, 'Debe devolver rangos');
      assertTrue(rangos.includes('POS_0-10'), 'Debe incluir POS_0-10');
      assertTrue(rangos.includes('NEG_5000+'), 'Debe incluir NEG_5000+');
    });
    
    await test('U-RANGO-001: isValidRango valida correctamente', async () => {
      assertTrue(isValidRango('POS_0-10'), 'POS_0-10 debe ser válido');
      assertTrue(isValidRango('NEG_5000+'), 'NEG_5000+ debe ser válido');
      assertFalse(isValidRango('POS_999'), 'POS_999 debe ser inválido');
      assertFalse(isValidRango(null), 'null debe ser inválido');
    });
    
  });
}
