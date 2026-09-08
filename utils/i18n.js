/**
 * Sistema de internacionalización (i18n) para Fase 1.
 * 
 * Soporta tres idiomas: ES, CAT, EN.
 * Carga ficheros JSON desde /i18n/ mediante fetch.
 * Sustitución de parámetros {{param}}.
 */

import { ERRORS, AppError } from './errors.js';

/**
 * Idiomas soportados (lista cerrada).
 */
const SUPPORTED_LANGUAGES = ['ES', 'CAT', 'EN'];

/**
 * Estado interno del módulo i18n.
 */
let currentLanguage = 'ES';
let translations = {};

/**
 * Inicializa el sistema i18n cargando todos los ficheros de idioma.
 * Debe llamarse una vez al arranque de la aplicación.
 * 
 * @param {string} [defaultLang='ES'] - Idioma inicial
 * @returns {Promise<void>}
 */
export async function initI18n(defaultLang = 'ES') {
  // Validar idioma por defecto
  if (!SUPPORTED_LANGUAGES.includes(defaultLang)) {
    console.warn(`[UI-025] Unsupported language: ${defaultLang}. Falling back to ES.`);
    defaultLang = 'ES';
  }
  
  // Cargar todos los ficheros de idioma en paralelo
  const loadPromises = SUPPORTED_LANGUAGES.map(async (lang) => {
    try {
      const response = await fetch(`i18n/${lang.toLowerCase()}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return { lang, data: await response.json() };
    } catch (error) {
      console.error(`[UI-032] Failed to load i18n/${lang.toLowerCase()}.json:`, error);
      return { lang, data: {} };
    }
  });
  
  const results = await Promise.all(loadPromises);
  
  // Construir diccionario de traducciones
  translations = {};
  for (const { lang, data } of results) {
    translations[lang] = data;
  }
  
  // Establecer idioma actual
  currentLanguage = defaultLang;
}

/**
 * Cambia el idioma actual y retorna las nuevas traducciones.
 * 
 * @param {string} lang - Código de idioma (ES, CAT, EN)
 * @returns {Promise<void>}
 * @throws {AppError} UI-025 si el idioma no está soportado
 */
export async function setLanguage(lang) {
  const normalizedLang = lang.toUpperCase();
  
  if (!SUPPORTED_LANGUAGES.includes(normalizedLang)) {
    throw new AppError(ERRORS.UI_PREFERENCE_NOT_ALLOWED, `Unsupported language: ${lang}`);
  }
  
  // Si el idioma ya está cargado, solo cambiar el actual
  if (translations[normalizedLang]) {
    currentLanguage = normalizedLang;
  } else {
    // Cargar dinámicamente si no estaba precargado
    try {
      const response = await fetch(`i18n/${normalizedLang.toLowerCase()}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      translations[normalizedLang] = await response.json();
      currentLanguage = normalizedLang;
    } catch (error) {
      console.error(`[UI-032] Failed to load language ${normalizedLang}:`, error);
      throw new AppError(ERRORS.UI_PREFERENCE_NOT_ALLOWED, `Cannot load language: ${lang}`);
    }
  }
}

/**
 * Obtiene el idioma actual.
 * 
 * @returns {string} - Código de idioma actual
 */
export function getLanguage() {
  return currentLanguage;
}

/**
 * Traduce una clave al idioma actual con sustitución de parámetros.
 * 
 * @param {string} key - Clave de traducción
 * @param {Object} [params={}] - Parámetros para sustitución {{param}}
 * @returns {string} - Cadena traducida o la clave si no existe
 * 
 * @example
 * t('login_title') → "Iniciar sesión"
 * t('error_code', { code: 'AU-002' }) → "Credenciales inválidas..."
 */
export function t(key, params = {}) {
  if (!key || typeof key !== 'string') {
    return key;
  }
  
  // Buscar en idioma actual
  const langData = translations[currentLanguage];
  let value = langData ? langData[key] : undefined;
  
  // Fallback a inglés si no existe
  if (value === undefined && currentLanguage !== 'EN') {
    value = translations['EN']?.[key];
  }
  
  // Si aún no existe, devolver la clave literal
  if (value === undefined) {
    return key;
  }
  
  // Sustituir parámetros {{param}}
  if (params && typeof params === 'object') {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      const regex = new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g');
      value = value.replace(regex, String(paramValue));
    }
  }
  
  return value;
}

/**
 * Obtiene todas las claves disponibles para un idioma.
 * Útil para tests de paridad (U-I18N-001).
 * 
 * @param {string} [lang] - Idioma específico o null para actual
 * @returns {string[]} - Lista de claves
 */
export function getKeysForLanguage(lang) {
  const targetLang = lang ? lang.toUpperCase() : currentLanguage;
  const langData = translations[targetLang];
  return langData ? Object.keys(langData) : [];
}

/**
 * Verifica si dos idiomas tienen las mismas claves.
 * Útil para tests de paridad.
 * 
 * @param {string} lang1 - Primer idioma
 * @param {string} lang2 - Segundo idioma
 * @returns {{equal: boolean, missingIn1: string[], missingIn2: string[]}}
 */
export function compareLanguageKeys(lang1, lang2) {
  const keys1 = new Set(getKeysForLanguage(lang1));
  const keys2 = new Set(getKeysForLanguage(lang2));
  
  const missingIn1 = [...keys2].filter(k => !keys1.has(k));
  const missingIn2 = [...keys1].filter(k => !keys2.has(k));
  
  return {
    equal: missingIn1.length === 0 && missingIn2.length === 0,
    missingIn1,
    missingIn2
  };
}
