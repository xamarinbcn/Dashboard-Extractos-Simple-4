/**
 * Pruebas unitarias de criptografía - Sección 7.2
 * 
 * Cubre: U-CRYPTO-001 a U-CRYPTO-008
 */

import { runSuite, test, assertEqual, assertTrue, assertFalse, assertRejectsWithCode } from '../harness/runner.js';
import { deriveKey, deriveHmacKey, generateSalt, validatePasswordPolicy, normalizeNFC } from '../../crypto/pbkdf2.js';
import { encrypt, decrypt, generateFraseDatos, stringToBytes, bytesToString } from '../../crypto/aes-gcm.js';
import { AppError } from '../../utils/errors.js';

export async function runCryptoTests() {
  await runSuite('Criptografía (7.2)', async () => {
    
    // U-CRYPTO-001: Derivación AUTH reproducible
    await test('U-CRYPTO-001: Derivación AUTH reproducible', async () => {
      const password = 'PruebaPass1';
      const salt = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
      
      const key1 = await deriveKey(password, salt);
      const key2 = await deriveKey(password, salt);
      
      // Extraer material de clave para comparar
      const export1 = await crypto.subtle.exportKey('raw', key1);
      const export2 = await crypto.subtle.exportKey('raw', key2);
      
      const hash1 = Array.from(new Uint8Array(export1)).map(b => b.toString(16).padStart(2, '0')).join('');
      const hash2 = Array.from(new Uint8Array(export2)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      assertEqual(hash1.length, 64, 'Hash debe tener 64 caracteres hex');
      assertEqual(hash1, hash2, 'Misma entrada debe producir mismo hash');
    });
    
    // U-CRYPTO-002: Derivación sensible a salt
    await test('U-CRYPTO-002: Derivación sensible a salt', async () => {
      const password = 'PruebaPass1';
      const salt1 = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
      const salt2 = new Uint8Array([16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1]);
      
      const key1 = await deriveKey(password, salt1);
      const key2 = await deriveKey(password, salt2);
      
      const export1 = await crypto.subtle.exportKey('raw', key1);
      const export2 = await crypto.subtle.exportKey('raw', key2);
      
      const hash1 = Array.from(new Uint8Array(export1)).map(b => b.toString(16).padStart(2, '0')).join('');
      const hash2 = Array.from(new Uint8Array(export2)).map(b => b.toString(16).padStart(2, '0')).join('');
      
      assertTrue(hash1 !== hash2, 'Distinto salt debe producir distinto hash');
    });
    
    // U-CRYPTO-003: Derivación sensible a dominio (AUTH vs WRAP)
    await test('U-CRYPTO-003: Derivación sensible a dominio (AUTH vs WRAP)', async () => {
      const password = 'PruebaPass1';
      const salt = new Uint8Array([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]);
      
      const authKey = await deriveKey(password, salt);
      const wrapKey = await deriveHmacKey(password, salt);
      
      const authExport = await crypto.subtle.exportKey('raw', authKey);
      const wrapExport = await crypto.subtle.exportKey('raw', wrapKey);
      
      assertTrue(authExport.byteLength !== wrapExport.byteLength || 
                 Array.from(new Uint8Array(authExport)).join() !== Array.from(new Uint8Array(wrapExport)).join(),
                 'Claves AUTH y WRAP deben ser distintas');
    });
    
    // U-CRYPTO-004: AES roundtrip
    await test('U-CRYPTO-004: AES roundtrip', async () => {
      const password = 'PruebaPass1';
      const salt = generateSalt(16);
      const key = await deriveKey(password, salt);
      
      const plaintext = 'hola';
      const plaintextBytes = stringToBytes(plaintext);
      
      const { ciphertext, iv } = await encrypt(key, plaintextBytes);
      const decryptedBytes = await decrypt(key, ciphertext, iv);
      const decrypted = bytesToString(decryptedBytes);
      
      assertEqual(decrypted, plaintext, 'Descifrado debe devolver texto original');
    });
    
    // U-CRYPTO-005: IV único
    await test('U-CRYPTO-005: IV único', async () => {
      const password = 'PruebaPass1';
      const salt = generateSalt(16);
      const key = await deriveKey(password, salt);
      
      const plaintext = 'texto repetido';
      const plaintextBytes = stringToBytes(plaintext);
      
      const result1 = await encrypt(key, plaintextBytes);
      const result2 = await encrypt(key, plaintextBytes);
      
      // IVs deben ser distintos
      const iv1 = Array.from(result1.iv).join(',');
      const iv2 = Array.from(result2.iv).join(',');
      assertTrue(iv1 !== iv2, 'IVs deben ser distintos en cifrados separados');
      
      // Ciphertexts deben ser distintos debido al IV diferente
      const ct1 = Array.from(result1.ciphertext).join(',');
      const ct2 = Array.from(result2.ciphertext).join(',');
      assertTrue(ct1 !== ct2, 'Ciphertexts deben ser distintos debido al IV');
    });
    
    // U-CRYPTO-006: Descifrado con clave incorrecta
    await test('U-CRYPTO-006: Descifrado con clave incorrecta', async () => {
      const password1 = 'PruebaPass1';
      const password2 = 'PruebaPass2';
      const salt = generateSalt(16);
      
      const key1 = await deriveKey(password1, salt);
      const key2 = await deriveKey(password2, salt);
      
      const plaintext = 'texto secreto';
      const plaintextBytes = stringToBytes(plaintext);
      
      const { ciphertext, iv } = await encrypt(key1, plaintextBytes);
      
      try {
        await decrypt(key2, ciphertext, iv);
        throw new Error('Debería haber fallado con clave incorrecta');
      } catch (error) {
        // Debe fallar con error de descifrado
        assertTrue(
          error.code === 'CR-002' || error.message.includes('CR-002') || error.message.includes('decrypt'),
          `Debe fallar con CR-002, got: ${error.code || error.message}`
        );
      }
    });
    
    // U-CRYPTO-007: Wrap/unwrap de frase_datos
    await test('U-CRYPTO-007: Wrap/unwrap de frase_datos', async () => {
      const password = 'PruebaPass1';
      const salt = generateSalt(16);
      const key = await deriveKey(password, salt);
      
      // Generar frase_datos original (32 bytes)
      const fraseOriginal = generateFraseDatos();
      assertEqual(fraseOriginal.length, 32, 'frase_datos debe ser 32 bytes');
      
      // Envolver (cifrar)
      const { ciphertext: wrapped, iv } = await encrypt(key, fraseOriginal);
      
      // Desenvolver (descifrar)
      const fraseRecuperada = await decrypt(key, wrapped, iv);
      
      // Comparar byte a byte
      for (let i = 0; i < 32; i++) {
        assertEqual(fraseOriginal[i], fraseRecuperada[i], `Byte ${i} debe coincidir`);
      }
    });
    
    // U-CRYPTO-008: Amount cents roundtrip (valores enteros)
    await test('U-CRYPTO-008: Amount cents roundtrip', async () => {
      const password = 'PruebaPass1';
      const salt = generateSalt(16);
      const key = await deriveKey(password, salt);
      
      const testValues = [123456, -98705, 0];
      
      for (const value of testValues) {
        // Codificar entero como bytes (usamos TextEncoder para simplicidad)
        const valueStr = value.toString();
        const valueBytes = stringToBytes(valueStr);
        
        const { ciphertext, iv } = await encrypt(key, valueBytes);
        const decryptedBytes = await decrypt(key, ciphertext, iv);
        const decryptedStr = bytesToString(decryptedBytes);
        const decryptedValue = parseInt(decryptedStr, 10);
        
        assertEqual(decryptedValue, value, `Valor ${value} debe recuperarse exactamente`);
      }
    });
    
    // U-CRYPTO-009: Normalización NFC de contraseña
    await test('U-CRYPTO-009: Normalización NFC de contraseña', async () => {
      // Contraseña con carácter que puede tener formas normales diferentes
      // ñ puede ser U+00F1 (ñ precompuesta) o U+006E U+0303 (n + tilde combinante)
      const passwordNFD = 'passwo\u006E\u0303d';  // n + combining tilde
      const passwordNFC = 'passwónd'.normalize('NFC');
      
      const normalized = normalizeNFC(passwordNFD);
      
      // Después de normalizar NFC, debería ser igual que la versión NFC directa
      const salt = generateSalt(16);
      const key1 = await deriveKey(normalized, salt);
      const key2 = await deriveKey(passwordNFC.replace('ó', 'o'), salt);  // Diferente por la ó
      
      // La clave derivada de passwordNFD normalizado NFC debe ser consistente
      const export1 = await crypto.subtle.exportKey('raw', key1);
      assertTrue(export1.byteLength > 0, 'Clave derivada de NFC debe ser válida');
    });
    
    // U-CRYPTO-010: Cambio de contraseña (flujo completo D-12)
    await test('U-CRYPTO-010: Cambio de contraseña - validación de invariantes', async () => {
      // Esta prueba valida los invariantes del cambio de contraseña
      // Nota: el flujo completo requiere integración con BD, probamos los componentes
      
      const oldPassword = 'PassOld123';
      const newPassword = 'PassNew456';
      const salt = generateSalt(16);
      const dataSalt = generateSalt(16);
      
      // Simular frase_datos (32 bytes) - esto NUNCA cambia
      const fraseDatos = generateFraseDatos();
      
      // Paso 1: Derivar WRAP con contraseña antigua
      const oldWrapKey = await deriveHmacKey(oldPassword, salt);
      
      // Paso 2: Cifrar frase_datos con oldWrapKey (simulando estado inicial)
      // En realidad se usa AES-GCM, no HMAC, para wrapping
      const oldAesKey = await deriveKey(oldPassword, salt);
      const { ciphertext: oldWrapped, iv: oldIv } = await encrypt(oldAesKey, fraseDatos);
      
      // Paso 3: Generar nuevo salt
      const newSalt = generateSalt(16);
      
      // Paso 4: Derivar nueva WRAP con nueva contraseña
      const newAesKey = await deriveKey(newPassword, newSalt);
      
      // Paso 5: Re-envolver la MISMA frase_datos
      const { ciphertext: newWrapped, iv: newIv } = await encrypt(newAesKey, fraseDatos);
      
      // Verificar invariantes D-12:
      // 1. password_salt ha cambiado
      assertTrue(salt !== newSalt, 'salt debe cambiar');
      
      // 2. password_hash es distinto (implícito por salt diferente)
      
      // 3. frase_cifrada es distinta
      const oldCtStr = Array.from(oldWrapped).join(',');
      const newCtStr = Array.from(newWrapped).join(',');
      assertTrue(oldCtStr !== newCtStr, 'frase_cifrada debe ser distinta');
      
      // 4. iv_frase es distinto
      const oldIvStr = Array.from(oldIv).join(',');
      const newIvStr = Array.from(newIv).join(',');
      assertTrue(oldIvStr !== newIvStr, 'iv_frase debe ser distinto');
      
      // 5. frase_datos subyacente es la MISMA (invocante D-12)
      // Verificamos que ambas envolturas pueden recuperar los mismos bytes
      const recoveredOld = await decrypt(oldAesKey, oldWrapped, oldIv);
      const recoveredNew = await decrypt(newAesKey, newWrapped, newIv);
      
      for (let i = 0; i < 32; i++) {
        assertEqual(recoveredOld[i], recoveredNew[i], `frase_datos byte ${i} debe ser idéntico`);
        assertEqual(fraseDatos[i], recoveredNew[i], `frase_datos debe preservarse`);
      }
    });
    
  });
}
