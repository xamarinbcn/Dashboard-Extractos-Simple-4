/**
 * Sistema centralizado de errores de la aplicación.
 * 
 * Todos los errores funcionales deben lanzar AppError con un código
 * definido en ERRORS. Los mensajes visibles se resuelven vía i18n.
 */

/**
 * Catálogo de códigos de error para Fase 1.
 * Lista cerrada - no añadir códigos sin especificación.
 */
export const ERRORS = {
  // Database errors (DB-001 → DB-017)
  DB_NOT_INITIALIZED: 'DB-001',
  DB_MIGRATION_FAILED: 'DB-002',
  DB_INCOMPATIBLE_VERSION: 'DB-003',
  DB_IBAN_INVALID: 'DB-010',
  DB_TIMEOUT: 'DB-012',
  DB_SQLITE_VERSION: 'DB-014',
  DB_FLUSH_FAILED: 'DB-016',
  DB_DASHBOARD_MATERIALIZE_FAILED: 'DB-017',
  
  // Crypto errors (CR-001 → CR-004)
  CRYPTO_KEY_MISSING: 'CR-001',
  CRYPTO_DECRYPT_FAILED: 'CR-002',
  CRYPTO_HMAC_INVALID: 'CR-003',
  CRYPTO_FRASE_MISSING: 'CR-004',
  
  // Auth errors (AU-001 → AU-005)
  AUTH_USER_BLOCKED_ADMIN: 'AU-001',
  AUTH_INVALID_CREDENTIALS: 'AU-002',
  AUTH_TEMP_BLOCKED: 'AU-003',
  AUTH_BOOTSTRAP_NOT_ALLOWED: 'AU-004',
  AUTH_LAST_ADMIN: 'AU-005',
  
  // UI errors (UI-020 → UI-034)
  UI_CARD_CONFIG_INVALID: 'UI-020',
  UI_TABLE_CARD_CONFIG_INVALID: 'UI-021',
  UI_EVOLUTION_CARD_CONFIG_INVALID: 'UI-022',
  UI_CONFIG_VERSION_UNSUPPORTED: 'UI-023',
  UI_SEMANTIC_AMBIGUOUS: 'UI-024',
  UI_PREFERENCE_NOT_ALLOWED: 'UI-025',
  UI_FIELD_TOO_LONG: 'UI-026',
  UI_INSTANCE_ALREADY_ACTIVE: 'UI-030',
  UI_CAPABILITY_MISSING: 'UI-031',
  UI_WORKER_FALLBACK: 'UI-032',
  UI_FEATURE_UNAVAILABLE: 'UI-033',
  UI_VENDOR_CONFIG_INVALID: 'UI-034',
  
  // Extension errors
  EXT_NORMA43_INOPERATIVE: 'EXT-006'
};

/**
 * Clase base para errores de la aplicación.
 * 
 * @param {string} code - Código de error del catálogo ERRORS
 * @param {any} [detail] - Detalle opcional para logging (objeto, string, etc.)
 */
export class AppError extends Error {
  constructor(code, detail = undefined) {
    // Buscar nombre legible del código
    const codeName = Object.keys(ERRORS).find(key => ERRORS[key] === code) || 'UNKNOWN';
    super(`${code} (${codeName})`);
    this.name = 'AppError';
    this.code = code;
    this.detail = detail;
    
    // Capturar stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Factory para crear errores con detalle.
 * 
 * @param {string} errorCode - Clave de ERRORS (ej: 'AUTH_INVALID_CREDENTIALS')
 * @param {any} [detail] - Detalle opcional
 * @returns {AppError}
 */
export function createError(errorCode, detail) {
  const code = ERRORS[errorCode];
  if (!code) {
    throw new Error(`Código de error desconocido: ${errorCode}`);
  }
  return new AppError(code, detail);
}
