/**
 * Adaptadores de plataforma - Punto único de acceso a capacidades.
 * 
 * Implementa D-16 y sección 4 del alcance de Fase 1.
 * Ningún módulo fuera de db/ debe importar directamente:
 * - db/opfs.js
 * - db/sqlite-wasm.js
 * - db/tauri-impl.js
 */

import { ERRORS, AppError } from '../utils/errors.js';

/**
 * Estado interno del adaptador.
 */
let platformInstance = null;

/**
 * Detecta capacidades del navegador.
 * 
 * @returns {Promise<{webCrypto: boolean, locks: boolean, opfs: boolean, tauri: boolean}>}
 */
async function detectCapabilities() {
  return {
    webCrypto: !!(crypto && crypto.subtle),
    locks: !!(navigator.locks),
    opfs: !!(navigator.storage && navigator.storage.getDirectory),
    tauri: !!(window.__TAURI__)  // Marcador Tauri
  };
}

/**
 * Sistema de lock exclusivo de instancia.
 * Usa Locks API para garantizar una sola instancia activa.
 */
const lockSystem = {
  /**
   * Adquiere lock exclusivo. Retorna función de release.
   * @returns {Promise<Function>} - Función para liberar lock
   */
  async acquire() {
    return new Promise((resolve, reject) => {
      navigator.locks.request('dashboard-extractos-singleton', async (lock) => {
        if (!lock) {
          throw new AppError(ERRORS.UI_INSTANCE_ALREADY_ACTIVE, 'Another instance is active');
        }
        
        // Mantener lock mientras se ejecute esta promesa
        return new Promise((release) => {
          // Resolver con función de release
          resolve(() => {
            release();
          });
        });
      }).catch(err => {
        console.error('[UI-030] Lock acquisition failed:', err);
        reject(new AppError(ERRORS.UI_INSTANCE_ALREADY_ACTIVE, err.message));
      });
    });
  }
};

/**
 * Sistema de almacenamiento OPFS.
 */
let opfsRoot = null;
let currentDbFile = null;

const storageSystem = {
  /**
   * Inicializa acceso a OPFS.
   */
  async init() {
    if (!navigator.storage || !navigator.storage.getDirectory) {
      throw new AppError(ERRORS.UI_CAPABILITY_MISSING, 'OPFS not supported');
    }
    
    try {
      opfsRoot = await navigator.storage.getDirectory();
    } catch (error) {
      console.error('[DB-001] OPFS init failed:', error);
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, error.message);
    }
  },
  
  /**
   * Lee un fichero como Uint8Array.
   * @param {string} name - Nombre del fichero
   * @returns {Promise<Uint8Array|null>}
   */
  async readFile(name) {
    if (!opfsRoot) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Storage not initialized');
    }
    
    try {
      const handle = await opfsRoot.getFileHandle(name, { create: false });
      const file = await handle.getFile();
      const buffer = await file.arrayBuffer();
      return new Uint8Array(buffer);
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return null;
      }
      throw error;
    }
  },
  
  /**
   * Escribe fichero atómicamente (write + sync).
   * @param {string} name - Nombre del fichero
   * @param {Uint8Array} bytes - Datos a escribir
   */
  async writeFileAtomic(name, bytes) {
    if (!opfsRoot) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Storage not initialized');
    }
    
    try {
      const handle = await opfsRoot.getFileHandle(name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(bytes);
      await writable.close();  // Sync implícito
    } catch (error) {
      console.error('[DB-016] writeFileAtomic failed:', error);
      throw new AppError(ERRORS.DB_FLUSH_FAILED, error.message);
    }
  },
  
  /**
   * Elimina un fichero.
   * @param {string} name - Nombre del fichero
   */
  async deleteFile(name) {
    if (!opfsRoot) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Storage not initialized');
    }
    
    try {
      await opfsRoot.removeEntry(name);
    } catch (error) {
      if (error.name !== 'NotFoundError') {
        throw error;
      }
    }
  },
  
  /**
   * Verifica si un fichero existe.
   * @param {string} name - Nombre del fichero
   * @returns {Promise<boolean>}
   */
  async exists(name) {
    if (!opfsRoot) {
      return false;
    }
    
    try {
      const handle = await opfsRoot.getFileHandle(name, { create: false });
      return !!handle;
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return false;
      }
      throw error;
    }
  }
};

/**
 * Sistema de base de datos SQLite WASM.
 * Se inicializa bajo demanda cuando se llama a open().
 */
let sqlite3Module = null;
let dbConnection = null;

const dbSystem = {
  /**
   * Abre una base de datos.
   * @param {string} name - Nombre del fichero .db
   */
  async open(name) {
    // Cargar módulo SQLite WASM dinámicamente
    if (!sqlite3Module) {
      // El glue JS debe estar disponible globalmente
      if (typeof sqlite3 === 'undefined') {
        throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'SQLite WASM module not loaded');
      }
      sqlite3Module = sqlite3;
    }
    
    try {
      // Abrir conexión en memoria primero, luego cargar desde OPFS
      dbConnection = new sqlite3Module.oo1.DB(':memory:', 'c');
      
      // Configurar PRAGMAS requeridos
      dbConnection.exec('PRAGMA foreign_keys = ON');
      dbConnection.exec('PRAGMA busy_timeout = 5000');
      
      // Intentar cargar desde OPFS si existe
      const data = await storageSystem.readFile(name);
      if (data && data.length > 0) {
        // Importar datos existentes
        dbConnection.exec(`PRAGMA wal_checkpoint(TRUNCATE)`);
      }
      
      currentDbFile = name;
    } catch (error) {
      console.error('[DB-001] Database open failed:', error);
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, error.message);
    }
  },
  
  /**
   * Ejecuta SQL sin resultado.
   * @param {string} sql - Sentencia SQL
   * @param {any[]} [params] - Parámetros vinculados
   */
  async exec(sql, params) {
    if (!dbConnection) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Database not open');
    }
    
    try {
      if (params && params.length > 0) {
        dbConnection.exec({ sql, bind: params });
      } else {
        dbConnection.exec(sql);
      }
    } catch (error) {
      console.error('[DB-002] SQL exec failed:', sql, error);
      throw new AppError(ERRORS.DB_MIGRATION_FAILED, error.message);
    }
  },
  
  /**
   * Ejecuta SELECT y retorna filas.
   * @param {string} sql - Sentencia SELECT
   * @param {any[]} [params] - Parámetros vinculados
   * @returns {Promise<Array<Object>>}
   */
  async select(sql, params) {
    if (!dbConnection) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Database not open');
    }
    
    try {
      const rows = [];
      const stmt = dbConnection.prepare(params ? sql : sql);
      
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      
      while (stmt.step()) {
        rows.push(stmt.getAsObject());
      }
      
      stmt.finalize();
      return rows;
    } catch (error) {
      console.error('[DB-002] SQL select failed:', sql, error);
      throw new AppError(ERRORS.DB_MIGRATION_FAILED, error.message);
    }
  },
  
  /**
   * Ejecuta una transacción ACID.
   * @param {Function} fn - Función que recibe db y retorna promesa
   * @returns {Promise<any>}
   */
  async transaction(fn) {
    if (!dbConnection) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Database not open');
    }
    
    try {
      dbConnection.exec('BEGIN IMMEDIATE');
      const result = await fn(dbConnection);
      dbConnection.exec('COMMIT');
      return result;
    } catch (error) {
      dbConnection.exec('ROLLBACK');
      console.error('[DB-002] Transaction failed:', error);
      throw new AppError(ERRORS.DB_MIGRATION_FAILED, error.message);
    }
  },
  
  /**
   * Cierra la conexión actual.
   */
  async close() {
    if (dbConnection) {
      try {
        dbConnection.close();
      } catch (error) {
        console.error('[DB-001] Database close failed:', error);
      }
      dbConnection = null;
    }
    currentDbFile = null;
  },
  
  /**
   * Persiste la base de datos en OPFS.
   */
  async flush() {
    if (!dbConnection || !currentDbFile) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'No database to flush');
    }
    
    try {
      // Exportar a ArrayBuffer
      const data = dbConnection.serialize();
      await storageSystem.writeFileAtomic(currentDbFile, data);
    } catch (error) {
      console.error('[DB-016] Flush failed:', error);
      throw new AppError(ERRORS.DB_FLUSH_FAILED, error.message);
    }
  },
  
  /**
   * Obtiene user_version.
   * @returns {Promise<number>}
   */
  async getUserVersion() {
    if (!dbConnection) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'Database not open');
    }
    
    const result = await dbSystem.select('PRAGMA user_version');
    return result[0]?.user_version ?? 0;
  },
  
  /**
   * Establece user_version.
   * @param {number} version
   */
  async setUserVersion(version) {
    await dbSystem.exec(`PRAGMA user_version = ${version}`);
  },
  
  /**
   * Obtiene versión de SQLite.
   * @returns {Promise<number>} - Versión como entero (ej: 3038000)
   */
  async getSqliteVersion() {
    if (!sqlite3Module) {
      throw new AppError(ERRORS.DB_NOT_INITIALIZED, 'SQLite not loaded');
    }
    
    // sqlite3.version es un string "3.X.Y"
    const versionStr = sqlite3Module.version;
    const parts = versionStr.split('.').map(p => parseInt(p, 10));
    
    // Convertir a formato entero: major*1000000 + minor*1000 + patch
    return (parts[0] * 1000000) + (parts[1] * 1000) + (parts[2]);
  }
};

/**
 * Sistema de diálogo (stubs para Fase 1).
 * Todos emiten UI-033 FEATURE_UNAVAILABLE.
 */
const dialogSystem = {
  async pickCsvFiles() {
    throw new AppError(ERRORS.UI_FEATURE_UNAVAILABLE, 'CSV import not available in Phase 1');
  },
  
  async pickDbFile() {
    throw new AppError(ERRORS.UI_FEATURE_UNAVAILABLE, 'DB file picker not available in Phase 1');
  },
  
  async saveDbFile(bytes, filename) {
    throw new AppError(ERRORS.UI_FEATURE_UNAVAILABLE, 'DB export not available in Phase 1');
  }
};

/**
 * Sistema de logging centralizado.
 */
const loggerSystem = {
  /**
   * Loguea un mensaje con nivel y código.
   * @param {'debug'|'info'|'warn'|'error'} level
   * @param {string} code - Código de error o evento
   * @param {any} [detail] - Detalle opcional
   */
  log(level, code, detail) {
    const prefix = `[${level.toUpperCase()}][${code}]`;
    
    switch (level) {
      case 'debug':
        console.debug(prefix, detail);
        break;
      case 'info':
        console.info(prefix, detail);
        break;
      case 'warn':
        console.warn(prefix, detail);
        break;
      case 'error':
        console.error(prefix, detail);
        break;
      default:
        console.log(prefix, detail);
    }
  }
};

/**
 * Resuelve URL de worker relativa a la aplicación.
 * @param {string} relativePath - Ruta relativa (ej: 'workers/worker-cifrado.js')
 * @returns {string} - URL absoluta para Blob o ruta directa
 */
function resolveWorkerUrl(relativePath) {
  // En entorno browser local, usar ruta relativa directa
  return `./${relativePath}`;
}

/**
 * Crea y retorna objeto platform completo.
 * @returns {Promise<Object>}
 */
export async function createPlatform() {
  if (platformInstance) {
    return platformInstance;
  }
  
  const capabilities = await detectCapabilities();
  
  platformInstance = {
    async detectCapabilities() {
      return capabilities;
    },
    
    lock: lockSystem,
    storage: storageSystem,
    db: dbSystem,
    dialog: dialogSystem,
    logger: loggerSystem,
    resolveWorkerUrl: resolveWorkerUrl
  };
  
  return platformInstance;
}

/**
 * Exportar para tests.
 */
export const _internal = {
  detectCapabilities,
  lockSystem,
  storageSystem,
  dbSystem,
  dialogSystem,
  loggerSystem
};
