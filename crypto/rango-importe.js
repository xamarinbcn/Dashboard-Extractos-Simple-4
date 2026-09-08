/**
 * Cálculo de rango de importe para bucketing hash.
 * 
 * Especificación Fase 1 (5.11):
 * - Entrada: céntimos enteros con signo (number entero o BigInt)
 * - Validación estricta: no coerción silenciosa
 * - Buckets cerrados para positivos y negativos (valor absoluto)
 */

import { ERRORS, AppError } from '../utils/errors.js';

/**
 * Límites de buckets en céntimos (valores absolutos).
 * Los intervalos son [inicio, fin) excepto el último que es [inicio, +inf).
 */
const BUCKETS = [
  { label: 'POS_0-10',      min: 0,       max: 1000 },
  { label: 'POS_10-50',     min: 1000,    max: 5000 },
  { label: 'POS_50-100',    min: 5000,    max: 10000 },
  { label: 'POS_100-250',   min: 10000,   max: 25000 },
  { label: 'POS_250-500',   min: 25000,   max: 50000 },
  { label: 'POS_500-1000',  min: 50000,   max: 100000 },
  { label: 'POS_1000-2500', min: 100000,  max: 250000 },
  { label: 'POS_2500-5000', min: 250000,  max: 500000 },
  { label: 'POS_5000+',     min: 500000,  max: Infinity }
];

/**
 * Valida que un valor es un entero seguro (number o BigInt).
 * Lanza TypeError si no es entero, sin coerción silenciosa.
 * 
 * @param {any} value - Valor a validar
 * @returns {bigint} - Valor normalizado a BigInt
 * @throws {TypeError} Si no es entero
 */
function validateInteger(value) {
  // BigInt es válido
  if (typeof value === 'bigint') {
    return value;
  }
  
  // Number debe ser entero finito
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new TypeError('importeCents must be integer');
    }
    if (!Number.isFinite(value)) {
      throw new TypeError('importeCents must be finite');
    }
    return BigInt(value);
  }
  
  // Cualquier otro tipo es inválido
  throw new TypeError('importeCents must be integer');
}

/**
 * Calcula el rango de importe para un valor en céntimos.
 * 
 * @param {number|bigint} importeCents - Importe en céntimos (con signo)
 * @returns {string} - Etiqueta del bucket (ej: 'POS_0-10', 'NEG_50-100')
 * @throws {TypeError} Si la entrada no es entera
 */
export function calcularRangoImporte(importeCents) {
  // Validar entrada (lanza TypeError si no es entero)
  const cents = validateInteger(importeCents);
  
  // Manejar cero explícitamente (D-07: cero se considera POS_0-10)
  if (cents === 0n) {
    return 'POS_0-10';
  }
  
  // Determinar signo y valor absoluto
  const isNegative = cents < 0n;
  const absCents = isNegative ? -cents : cents;
  
  // Buscar bucket
  for (const bucket of BUCKETS) {
    if (absCents >= bucket.min && absCents < bucket.max) {
      return isNegative ? bucket.label.replace('POS_', 'NEG_') : bucket.label;
    }
  }
  
  // Caso límite: bucket superior (5000+)
  return isNegative ? 'NEG_5000+' : 'POS_5000+';
}

/**
 * Obtiene todos los rangos posibles (útil para validaciones UI).
 * 
 * @returns {string[]} - Lista de todos los rangos válidos
 */
export function getAllRangos() {
  const positives = BUCKETS.map(b => b.label);
  const negatives = BUCKETS
    .filter(b => b.min > 0 || b.label === 'POS_0-10')  // Excluir duplicado de cero
    .map(b => b.label.replace('POS_', 'NEG_'));
  
  return [...positives, ...negatives];
}

/**
 * Valida si una cadena es un rango válido.
 * 
 * @param {string} rango - Cadena a validar
 * @returns {boolean}
 */
export function isValidRango(rango) {
  if (typeof rango !== 'string') {
    return false;
  }
  return getAllRangos().includes(rango);
}
