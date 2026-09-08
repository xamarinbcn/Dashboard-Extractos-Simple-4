/**
 * Polyfill para Web Crypto API en Node.js
 * Permite usar crypto.subtle en entorno Node.js 18+
 */

import { webcrypto } from 'node:crypto';

// Si no existe global.crypto (entorno Node), lo añadimos
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = webcrypto;
}

// Exportamos crypto para uso directo si es necesario
export const crypto = globalThis.crypto;

// Verificación de disponibilidad
export function isCryptoAvailable() {
  return typeof globalThis.crypto !== 'undefined' && 
         typeof globalThis.crypto.subtle !== 'undefined';
}

// Función helper para verificar que PBKDF2 está soportado
export async function verifyPBKDF2Support() {
  if (!isCryptoAvailable()) {
    throw new Error('Web Crypto API no disponible');
  }
  
  try {
    await globalThis.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(16),
        iterations: 1000,
        hash: 'SHA-256'
      },
      await globalThis.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('test'),
        'PBKDF2',
        false,
        ['deriveKey']
      ),
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    return true;
  } catch (e) {
    throw new Error(`PBKDF2 no soportado: ${e.message}`);
  }
}
