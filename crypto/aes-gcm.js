/**
 * Cifrado AES-GCM para datos sensibles.
 * 
 * Especificación Fase 1:
 * - Algoritmo: AES-GCM
 * - Longitud clave: 256 bits
 * - IV: 12 bytes (96 bits) - estándar NIST para GCM
 * - Tag autenticación: 128 bits (por defecto en Web Crypto)
 */

import { ERRORS, AppError } from '../utils/errors.js';

/**
 * Longitud de IV para AES-GCM en bytes (12 bytes = 96 bits).
 * Recomendado por NIST SP 800-38D.
 * @constant {number}
 */
const IV_LENGTH_BYTES = 12;

/**
 * Cifra datos usando AES-GCM con una clave CryptoKey.
 * 
 * @param {CryptoKey} key - Clave AES-GCM (256 bits)
 * @param {Uint8Array} plaintext - Datos a cifrar
 * @returns {Promise<{ciphertext: Uint8Array, iv: Uint8Array}>} - Datos cifrados + IV
 * @throws {AppError} CR-002 si falla el cifrado
 */
export async function encrypt(key, plaintext) {
  if (!key || !(key instanceof CryptoKey)) {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Valid CryptoKey required');
  }
  
  if (!plaintext || !(plaintext instanceof Uint8Array) || plaintext.length === 0) {
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, 'Plaintext must be non-empty Uint8Array');
  }
  
  try {
    // Generar IV aleatorio criptográficamente seguro
    const iv = new Uint8Array(IV_LENGTH_BYTES);
    crypto.getRandomValues(iv);
    
    // Cifrar con AES-GCM
    const ciphertextBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      plaintext
    );
    
    return {
      ciphertext: new Uint8Array(ciphertextBuffer),
      iv: iv
    };
  } catch (error) {
    console.error('[CR-002] encrypt failed:', error);
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, error.message);
  }
}

/**
 * Descifra datos usando AES-GCM con una clave CryptoKey.
 * 
 * @param {CryptoKey} key - Clave AES-GCM (256 bits)
 * @param {Uint8Array} ciphertext - Datos cifrados
 * @param {Uint8Array} iv - Vector de inicialización usado en cifrado
 * @returns {Promise<Uint8Array>} - Datos descifrados
 * @throws {AppError} CR-002 si falla el descifrado (incluye tag inválido)
 */
export async function decrypt(key, ciphertext, iv) {
  if (!key || !(key instanceof CryptoKey)) {
    throw new AppError(ERRORS.CRYPTO_KEY_MISSING, 'Valid CryptoKey required');
  }
  
  if (!ciphertext || !(ciphertext instanceof Uint8Array) || ciphertext.length === 0) {
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, 'Ciphertext must be non-empty Uint8Array');
  }
  
  if (!iv || !(iv instanceof Uint8Array) || iv.length !== IV_LENGTH_BYTES) {
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, `IV must be ${IV_LENGTH_BYTES} bytes`);
  }
  
  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );
    
    return new Uint8Array(plaintextBuffer);
  } catch (error) {
    // El descifrado falla si el tag de autenticación no coincide
    console.error('[CR-002] decrypt failed:', error);
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, error.message);
  }
}

/**
 * Convierte un ArrayBuffer o TypedArray a Uint8Array.
 * Utilidad para normalizar entradas.
 * 
 * @param {ArrayBuffer|TypedArray} buffer - Buffer de entrada
 * @returns {Uint8Array}
 */
export function toUint8Array(buffer) {
  if (buffer instanceof Uint8Array) {
    return buffer;
  }
  if (buffer instanceof ArrayBuffer) {
    return new Uint8Array(buffer);
  }
  if (ArrayBuffer.isView(buffer)) {
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  }
  throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, 'Invalid buffer type');
}

/**
 * Convierte una cadena UTF-8 a Uint8Array.
 * 
 * @param {string} str - Cadena a codificar
 * @returns {Uint8Array}
 */
export function stringToBytes(str) {
  if (typeof str !== 'string') {
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, 'Input must be string');
  }
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convierte Uint8Array a cadena UTF-8.
 * 
 * @param {Uint8Array} bytes - Bytes a decodificar
 * @returns {string}
 */
export function bytesToString(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED, 'Input must be Uint8Array');
  }
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(bytes);
}

/**
 * Genera una frase de datos aleatoria de 32 bytes.
 * Esta frase se usa como semilla para derivar claves DATA y HMAC.
 * 
 * @returns {Uint8Array} - 32 bytes aleatorios
 */
export function generateFraseDatos() {
  const frase = new Uint8Array(32);
  crypto.getRandomValues(frase);
  return frase;
}
