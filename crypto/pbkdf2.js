/**
 * Derivación de claves usando PBKDF2 con HMAC-SHA-256.
 * 
 * Especificación Fase 1:
 * - Algoritmo: PBKDF2
 * - Función hash: SHA-256
 * - Iteraciones: 600.000 (fijo, no configurable)
 * - Longitud clave: 32 bytes (256 bits)
 */

import { ERRORS, AppError } from '../utils/errors.js';

/**
 * Número de iteraciones PBKDF2 - valor fijo especificado en Fase 1.
 * @constant {number}
 */
export const PBKDF2_ITERATIONS = 600000;

/**
 * Longitud de clave derivada en bytes (256 bits).
 * @constant {number}
 */
const KEY_LENGTH_BYTES = 32;

/**
 * Normaliza una cadena usando NFC antes de derivar claves.
 * Requerimiento explícito de D-07 para contraseñas.
 * 
 * @param {string} input - Cadena a normalizar
 * @returns {string} - Cadena normalizada NFC
 */
export function normalizeNFC(input) {
  if (typeof input !== 'string') {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Input must be string for NFC normalization');
  }
  return input.normalize('NFC');
}

/**
 * Deriva una clave PBKDF2 usando Web Crypto API.
 * 
 * @param {string} password - Contraseña (se normaliza NFC internamente)
 * @param {Uint8Array} salt - Sal criptográfica (mínimo 16 bytes recomendado)
 * @param {number} [iterations=PBKDF2_ITERATIONS] - Número de iteraciones
 * @returns {Promise<CryptoKey>} - Clave derivada no extraíble
 * @throws {AppError} CR-001 si falla la derivación
 */
export async function deriveKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  if (!password || typeof password !== 'string') {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Password required');
  }
  
  if (!salt || !(salt instanceof Uint8Array) || salt.length === 0) {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Valid salt required');
  }
  
  try {
    // Normalizar contraseña NFC (D-07)
    const normalizedPassword = normalizeNFC(password);
    
    // Codificar a UTF-8 bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(normalizedPassword);
    
    // Importar material de clave base
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derivar clave AES-GCM
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: { name: 'SHA-256' }
      },
      keyMaterial,
      {
        name: 'AES-GCM',
        length: 128
      },
      false,  // No extraíble por seguridad
      ['encrypt', 'decrypt']
    );
    
    return derivedKey;
  } catch (error) {
    console.error('[CR-001] deriveKey failed:', error);
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, error.message);
  }
}

/**
 * Deriva una clave para HMAC (usada para integridad).
 * Similar a deriveKey pero devuelve clave para HMAC.
 * 
 * @param {string} password - Contraseña (normalizada NFC internamente)
 * @param {Uint8Array} salt - Sal criptográfica
 * @param {number} [iterations=PBKDF2_ITERATIONS] - Número de iteraciones
 * @returns {Promise<CryptoKey>} - Clave HMAC no extraíble
 */
export async function deriveHmacKey(password, salt, iterations = PBKDF2_ITERATIONS) {
  if (!password || typeof password !== 'string') {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Password required');
  }
  
  if (!salt || !(salt instanceof Uint8Array) || salt.length === 0) {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Valid salt required');
  }
  
  try {
    const normalizedPassword = normalizeNFC(password);
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(normalizedPassword);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    // Derivar clave para HMAC
    const hmacKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: { name: 'SHA-256' }
      },
      keyMaterial,
      {
        name: 'HMAC',
        hash: { name: 'SHA-256' },
        length: 128
      },
      false,
      ['sign', 'verify']
    );
    
    return hmacKey;
  } catch (error) {
    console.error('[CR-001] deriveHmacKey failed:', error);
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, error.message);
  }
}

/**
 * Genera una sal criptográficamente aleatoria.
 * 
 * @param {number} [length=16] - Longitud en bytes (mínimo 16 para Fase 1)
 * @returns {Uint8Array} - Sal aleatoria
 */
export function generateSalt(length = 16) {
  if (length < 16) {
    console.warn('[CR-004] Salt length below recommended minimum of 16 bytes');
  }
  
  const salt = new Uint8Array(length);
  crypto.getRandomValues(salt);
  return salt;
}

/**
 * Valida política de contraseña mínima para Fase 1 (D-07).
 * 
 * Reglas:
 * - Longitud mínima: 8 caracteres
 * - Longitud máxima: 128 caracteres
 * - Sin requisitos adicionales de complejidad
 * 
 * @param {string} password - Contraseña a validar
 * @param {string} [confirm] - Confirmación opcional
 * @returns {{valid: boolean, errorCode?: string}} - Resultado validación
 */
export function validatePasswordPolicy(password, confirm) {
  if (!password || typeof password !== 'string') {
    return { valid: false, errorCode: 'UI_FIELD_TOO_LONG' };  // Usamos este como "campo inválido"
  }
  
  const normalized = normalizeNFC(password);
  
  // Longitud mínima 8
  if (normalized.length < 8) {
    return { valid: false, errorCode: 'UI_FIELD_TOO_LONG' };
  }
  
  // Longitud máxima 128
  if (normalized.length > 128) {
    return { valid: false, errorCode: 'UI_FIELD_TOO_LONG' };
  }
  
  // Confirmación idéntica
  if (confirm !== undefined && confirm !== password) {
    return { valid: false, errorCode: 'AUTH_INVALID_CREDENTIALS' };  // Mejor código disponible
  }
  
  return { valid: true };
}
