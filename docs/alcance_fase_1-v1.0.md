# ESPECIFICACIÓN DE IMPLEMENTACIÓN Y PRUEBAS — FASE 1 v2.1

## 0. Orden de entrega a la IA

La IA recibirá dos bloques de contexto en este orden:

1. **Alcance global del proyecto**: `PR-SCD.md` completo.
2. **Requerimientos de Fase 1**: este documento completo.

Instrucción mínima para la IA:

```text
Implementa exactamente la Fase 1 definida en el segundo documento.
No añadas funcionalidades de fases posteriores.
No modifiques la estructura autorizada del proyecto.
Genera todos los ficheros runtime indicados.
Genera el set de pruebas indicado fuera del runtime si se autoriza directorio tests/.
No dejes placeholders, TODOs ni stubs no declarados.
Ante conflicto entre documentos, prevalece este documento de Fase 1 sobre PR-SCD.md
en los siguientes puntos (revisiones autorizadas pendientes de PR-SCD v1.6):
- D-10: 18 tablas (incluye `catalogo_tokens`) vs 17 tablas en PR 2-bis.2/2-bis.10.
- D-11: artefactos operator-provided (`sqlite3.js`, binarios UMD).
- D-14: código `UI-033` para stubs dialog (no `EXT-006`).
- D-15: CSP con `'wasm-unsafe-eval'` y nota sobre `frame-ancestors`.
- D-16: inclusión de `db/sqlite3.js` en estructura 3.5.
- Código `DB-017` (materialización dashboards) añadido al rango `DB-001→DB-016`.

Para el resto de secciones no listadas arriba, prevalece PR-SCD.md v1.5.
```

---

## 1. Objetivo cerrado de Fase 1

Fase 1 debe dejar operativo:

- Punto de entrada HTML local.
- Arquitectura de plataforma mediante adaptadores.
- Lock exclusivo de instancia.
- Persistencia OPFS con flush atómico.
- SQLite WASM con esquema completo.
- Criptografía AES-GCM y PBKDF2 con 600.000 iteraciones.
- Workers con contrato uniforme.
- Autenticación completa.
- Bootstrap de primer administrador.
- Onboarding sin banco/cuenta.
- Materialización idempotente de dashboards estándar en creación de usuario.
- Menú lateral completo, colapsable, redimensionable y basado en `menu.json`.
- Preferencias mínimas de menú cifradas en tabla `preferencias`.
- Panel mínimo de preferencias para `idioma` y `look`.
- i18n ES/CAT/EN.
- Tema claro/oscuro desde el primer arranque.
- Errores centralizados.
- Set de pruebas unitarias, SQL, integración, seguridad y UI.

No se implementan en Fase 1:

- Importación CSV.
- Norma 43 operativa.
- CRUD completo de maestros.
- Dashboards funcionales completos.
- Tarjetas de saldo.
- Recálculo de saldos.
- Backup/restauración.
- Responsive completo de paneles futuros.
- Gestión completa de usuarios por administrador.

---

## 2. Decisiones cerradas para Fase 1

Estas decisiones eliminan ambigüedad y deben aplicarse sin reinterpretación.

### D-01 Materialización de dashboards

Se materializan en creación de usuario mediante función idempotente `ensureStandardDashboards(idUsuario)`.

Fase 1 la invoca solo en bootstrap del primer administrador. Fase 3 la invocará al crear usuarios por administrador. Fase 4 solo verifica.

### D-02 Banco/cuenta inicial

El onboarding de Fase 1 no crea banco ni cuenta.

La creación de bancos/cuentas se implementa en Fase 2 antes de la importación.

### D-03 Tema por defecto

El tema por defecto del primer administrador es `O`, oscuro.

La base completa de tema oscuro debe funcionar en Fase 1.

### D-04 Panel visible en Fase 1

Tras login, el único panel visible será `panel-preferencias`.

Los demás nodos existen en `menu.json` con `visible: "none"`.

### D-05 Preferencias en Fase 1

Se implementa el servicio de preferencias cifradas para las claves:

```text
menu_ancho
menu_colapsado
```

El resto de claves de la whitelist se implementa en fases posteriores, pero el servicio ya valida whitelist completa.

### D-06 Idioma y look

`idioma` y `look` se editan en `panel-preferencias`, pero se persisten en `usuarios`, no en `preferencias`.

### D-07 Contraseña

Política mínima de Fase 1:

- Longitud mínima: 8 caracteres.
- Longitud máxima: 128 caracteres.
- Confirmación idéntica.
- Normalización NFC antes de derivar claves.
- Sin requisitos adicionales.

### D-08 Ficheros de pruebas

Se autoriza un directorio `/tests/` como artefacto de desarrollo.

Reglas:

- No forma parte del runtime.
- No se carga desde `index.html`.
- No se importa desde `app.js` ni módulos runtime.
- No modifica la estructura autorizada de producción.
- No añade dependencias externas.

### D-09 Versiones vendor

Versiones exactas cerradas:

```text
Tabulator: 6.3.1
ECharts: 5.6.0
```

La IA debe generar `vendor/versions.json` con hashes SHA-256 reales. Si no puede calcularlos, debe detenerse y solicitarlos. Está prohibido inventar hashes.

### D-10 Número de tablas

El esquema resultante contiene 18 tablas, incluyendo `catalogo_tokens`.

### D-11 Artefactos operator-provided
Los siguientes ficheros binarios son provistos por el operador humano y **NO** deben ser generados, simulados ni inventados por la IA:

- `db/sqlite3.wasm` (binario oficial SQLite, versión estable vigente al desplegar, **≥ 3.38.0**; la verificación de versión se realiza en runtime mediante `DB-014`, por lo que no se fija una versión exacta en este documento)
- `db/sqlite3.js` (glue JS oficial de distribución sqlite.org)
- `vendor/tabulator.min.js` (versión 6.3.1 UMD)
- `vendor/echarts.min.js` (versión 5.6.0 UMD)

La IA genera `vendor/versions.json` con los hashes SHA-256 como cadena vacía `""`. JSON no admite comentarios, por lo que el fichero contiene únicamente estructura válida con hashes pendientes:

```json
{
  "tabulator": {
    "file": "tabulator.min.js",
    "version": "6.3.1",
    "sha256": ""
  },
  "echarts": {
    "file": "echarts.min.js",
    "version": "5.6.0",
    "sha256": ""
  }
}
```

El arranque en runtime valida que los hashes no estén vacíos. Si alguno está vacío, emite error de configuración y aborta (código por definir, sugerido `UI-034`).

La IA incluye en `README.md` instrucciones de descarga y cálculo:
```text
1. Descargar sqlite-wasm oficial (versión estable >= 3.38.0) desde https://sqlite.org/download.html
2. Extraer sqlite3.wasm y sqlite3.js a /db/
3. Descargar tabulator 6.3.1 UMD desde https://github.com/olifolkerd/tabulator/releases
4. Descargar echarts 5.6.0 UMD desde https://github.com/apache/echarts/releases
5. Copiar a /vendor/
6. Calcular hashes: sha256sum vendor/tabulator.min.js vendor/echarts.min.js
7. Editar manualmente vendor/versions.json sustituyendo los campos "sha256": ""
   por los hashes calculados (en minúsculas, sin prefijo).
```

Nota: la descarga desde GitHub releases/unpkg es para obtención local; la prohibición de CDN (3.5-quater) aplica a la **carga en runtime**, no a la descarga manual por el operador.

### D-12 Cambio de contraseña en Fase 1

El flujo de cambio de contraseña se implementa en `panel-preferencias` (sección "Seguridad").

Campos del formulario:
- `contrasena_actual`
- `contrasena_nueva`
- `contrasena_nueva_confirm`

Flujo determinista:
1. Normalizar NFC todas las contraseñas.
2. Derivar AUTH con `password_salt` existente → verificar `password_hash`. Fallo: `AU-002`.
3. Validar política de `contrasena_nueva` (D-07): longitud [8, 128], confirmación idéntica, distinta de la actual.
4. Derivar WRAP con `contrasena_actual` + `password_salt` existente → **descifrar `frase_datos`** (bytes originales en memoria).
5. Generar nuevo `password_salt` (16 bytes aleatorios).
6. Derivar nueva AUTH (nueva contraseña + nuevo salt) → nuevo `password_hash`.
7. Derivar nueva WRAP (nueva contraseña + nuevo salt) → **re-envolver la MISMA `frase_datos`** → nueva `frase_cifrada` + nuevo `iv_frase`.
8. Transacción ACID: UPDATE `password_hash`, `password_salt`, `frase_cifrada`, `iv_frase`, `updated_at`. **`data_salt` NO cambia**.
9. Destruir claves de sesión y forzar re-autenticación.

**INVARIANTES (no negociables):**
- Los bytes de `frase_datos` NUNCA cambian (solo su wrapping cifrado).
- `data_salt` NUNCA cambia.
- Las claves DATA y HMAC NO se recalculan: derivan de los mismos bytes de `frase_datos` y del mismo `data_salt` → permanecen IDÉNTICAS → todos los datos cifrados existentes siguen siendo descifrables sin recifrado.

**Prohibido:** generar nueva `frase_datos`, modificar `data_salt`, recifrar datos de negocio.

NO se recifran datos de negocio (movimientos, extractos, preferencias).
    **Justificación técnica:** la `frase_datos` (valor de 32 bytes) NO cambia de contenido.
    Solo cambia su envoltorio (nuevo IV y nueva WRAP).
    Las claves DATA y HMAC se derivan del mismo contenido de `frase_datos`,
    por lo que los datos ya cifrados siguen siendo descifrables sin recifrado.
    Esto hace que el cambio de contraseña sea O(1) en coste de cifrado,
    no O(N) donde N es el número de campos cifrados.


### D-13 Semántica de bloqueo AU-001/AU-003
Estados de bloqueo en tabla `usuarios`:

| Condición | Código | Semántica |
|---|---|---|
| `estado='B'` AND `fecha_bloqueo IS NULL` | `AU-001` | Bloqueo administrativo (solo perfil A puede desbloquear) |
| `estado='B'` AND `fecha_bloqueo > NOW` | `AU-003` | Bloqueo temporal por intentos fallidos |
| `estado='B'` AND `fecha_bloqueo <= NOW` | (permitir intento) | Desbloqueo automático; resetear `intentos_fallidos=0` antes de validar |
| `estado='A'` AND `intentos_fallidos >= 5` | Transición a `AU-003` | Bloquear con `fecha_bloqueo = NOW + 15min` |

### D-14 Nuevo código UI-033
Los stubs de `dialog.pickCsvFiles()`, `dialog.pickDbFile()`, `dialog.saveDbFile()` en Fase 1 emiten `UI-033 FEATURE_UNAVAILABLE`, no `EXT-006`.

`EXT-006` queda reservado exclusivamente para `norma43-loader.js` (anexo técnico pendiente).

Añadir a `utils/errors.js`:
```js
UI_FEATURE_UNAVAILABLE: 'UI-033'
```

### D-15 CSP con wasm-unsafe-eval
La CSP en `index.html` debe incluir `'wasm-unsafe-eval'` en `script-src`, requerido por navegadores modernos para compilar módulos WebAssembly. Soporte mínimo: Chrome ≥ 103, Firefox ≥ 102, Safari ≥ 16.4.

### D-16 Inclusión de sqlite3.js en estructura
La estructura autorizada (3.5) se amplía para incluir `db/sqlite3.js`:
```text
db/
  sqlite3.wasm              → Motor SQLite WASM (operator-provided, D-11)
  sqlite3.js                → Glue JS oficial SQLite (operator-provided, D-11)
  init.sql
  migrations.sql
  fixtures/demo-data.sql
  adapters.js
  ...
```

### D-17 Regla general anti-alucinación
Si un dato canónico (DDL, seeds, configuración JSON, claves i18n) no está especificado literalmente en los documentos, la IA debe **detenerse y solicitarlo al operador**. Prohibido inventar valores.

Esta regla extiende la existente para hashes vendor a todo dato determinista.

---

## 3. Ficheros runtime que la IA debe crear

La IA debe generar exactamente esta estructura runtime:

```text
/index.html
/app.js
/app.css
/README.md

/db/
  sqlite3.wasm
  init.sql
  migrations.sql
  fixtures/demo-data.sql
  adapters.js
  browser-impl.js
  tauri-impl.js
  opfs.js
  sqlite-wasm.js
  extractos-loader.js
  norma43-loader.js
  movimientos-builder.js

/crypto/
  aes-gcm.js
  pbkdf2.js
  rango-importe.js

/vendor/
  tabulator.min.js
  echarts.min.js
  versions.json

/config/
  menu.json
  preferences-default.json

/i18n/
  es.json
  cat.json
  en.json

/ui/
  styles/
    theme-light.css
    theme-dark.css
  components/
    table.js
    chart.js
    panel.js
    card.js
    progress.js
  panels/
    panel-extractos.js
    panel-norma43.js
    panel-movimientos.js
    panel-usuarios.js
    panel-preferencias.js
    panel-maestros.js
  dashboards/
    dashboard-standard.js
    dashboard-custom.js
  forms/
    form-usuario.js
    form-preferencias.js
    form-cuenta.js
    form-tarjeta.js
    form-login.js
    form-banco.js
    form-activo.js
    form-grupo.js
    form-clasificacion.js

/workers/
  worker-clasificacion.js
  worker-hash.js
  worker-cifrado.js
  worker-normalizacion.js

/utils/
  errors.js
  iban.js
  i18n.js
  format.js

/assets/
  icons/
    default.svg
    dashboard.svg
    file.svg
    database.svg
    settings.svg
    users.svg
    cart.svg
    home.svg
    car.svg
    heart.svg
    game.svg
    wallet.svg
    bank.svg
    exchange.svg
    book.svg
    chart.svg
    shield.svg
```

Estado de implementación por fase:

| Fichero | Estado en Fase 1 |
|---|---|
| `db/sqlite3.wasm` | Operator-provided, no generado por IA |
| `db/sqlite3.js` | Operator-provided, no generado por IA |
| `index.html` | Completo |
| `app.js` | Completo |
| `app.css` | Completo |
| `README.md` | Completo |
| `db/adapters.js` | Completo |
| `db/browser-impl.js` | Completo |
| `db/tauri-impl.js` | Interfaz definida, implementación no operativa |
| `db/opfs.js` | Completo |
| `db/sqlite-wasm.js` | Completo |
| `db/init.sql` | Completo |
| `db/migrations.sql` | Completo para fresh install y guard de upgrade |
| `db/fixtures/demo-data.sql` | Vacío o con comentario `-- Phase 1: no demo data` |
| `db/extractos-loader.js` | Stub no operativo |
| `db/norma43-loader.js` | Stub que emite `EXT-006` |
| `db/movimientos-builder.js` | Stub no operativo |
| `crypto/*` | Completo |
| `vendor/*` | Ficheros UMD reales + `versions.json` con hashes reales |
| `config/menu.json` | Completo |
| `config/preferences-default.json` | Completo |
| `i18n/*.json` | Completo para Fase 1 |
| `ui/styles/*.css` | Completo |
| `ui/components/panel.js` | Completo |
| `ui/components/card.js` | Completo |
| `ui/components/progress.js` | Completo |
| `ui/components/table.js` | Wrapper mínimo |
| `ui/components/chart.js` | Wrapper mínimo |
| `ui/panels/panel-preferencias.js` | Completo para idioma/look |
| `ui/forms/form-login.js` | Completo |
| `ui/forms/form-preferencias.js` | Completo para idioma/look |
| Resto de panels/forms | Stub declarado |
| `workers/*` | Contrato completo; clasificación/normalización pueden ser mínimos |
| `utils/*` | Completo |

---

## 4. Contrato arquitectónico obligatorio

### 4.1 Prohibiciones de importación

Ningún módulo de `ui/`, `workers/`, `crypto/`, `utils/` o `config/` puede importar directamente:

```text
db/opfs.js
db/sqlite-wasm.js
db/tauri-impl.js
```

El único punto de acceso a plataforma es `db/adapters.js`.

### 4.2 Objeto `platform`

`db/adapters.js` devuelve un objeto `platform` con esta interfaz mínima:

```js
{
  detectCapabilities(): Promise<CapabilityReport>,
  lock: {
    acquire(): Promise<Function>
  },
  storage: {
    init(): Promise<void>,
    readFile(name): Promise<Uint8Array|null>,
    writeFileAtomic(name, bytes): Promise<void>,
    deleteFile(name): Promise<void>,
    exists(name): Promise<boolean>
  },
  db: {
    open(name): Promise<void>,
    exec(sql, params?): Promise<void>,
    select(sql, params?): Promise<Array<Object>>,
    transaction(fn): Promise<any>,
    close(): Promise<void>,
    flush(): Promise<void>,
    getUserVersion(): Promise<number>,
    setUserVersion(version): Promise<void>
  },
  dialog: {
    pickCsvFiles(): Promise<Array<PickedFile>>,
    pickDbFile(): Promise<PickedFile|null>,
    saveDbFile(bytes, filename): Promise<void>
  },
  logger: {
    log(level, code, detail?): void
  },
  resolveWorkerUrl(relativePath): string
}
```

### 4.3 `CapabilityReport`

```js
{
  webCrypto: boolean,
  locks: boolean,
  opfs: boolean,
  tauri: boolean
}
```

Si `webCrypto`, `locks` u `opfs` faltan en navegador, emitir `UI-031` y no inicializar.

### 4.4 Modelo de error

`utils/errors.js` debe exportar:

```js
export class AppError extends Error {
  constructor(code, detail = undefined) { ... }
}
```

Códigos mínimos de Fase 1 (lista completa en 5.13):

DB: DB-001, DB-002, DB-003, DB-010, DB-011, DB-012, DB-013, DB-014, DB-015, DB-016, DB-017
CR: CR-001, CR-002, CR-003, CR-004
AU: AU-001, AU-002, AU-003, AU-004, AU-005
UI: UI-020, UI-021, UI-022, UI-023, UI-024, UI-025, UI-026, UI-030, UI-031, UI-032, UI-033, UI-034
EXT: EXT-006

La lista canónica y completa está en `utils/errors.js` (5.13).
Cualquier código usado en Fase 1 debe estar presente en esa lista.

Reglas:

- Todo error funcional lanza `AppError`.
- El mensaje visible se resuelve por i18n.
- Si no existe clave i18n específica, se muestra `error_generic` + `error_code` con el código.
- Prohibido lanzar errores con texto libre como única identificación.

### 4.5 Logging

`platform.logger.log(level, code, detail)`:

Niveles autorizados (lista cerrada):
- `'debug'` → `console.debug`
- `'info'` → `console.info`
- `'warn'` → `console.warn`
- `'error'` → `console.error`

Formato del mensaje: `[level][code] detail`.
Ejemplo: `[warn][UI-033] Route not available in Phase 1: panel-extractos`

- En navegador, `detail` puede incluir objetos serializables.
- No persiste logs.
- Debe usarse para limpieza de preferencias obsoletas y fallback de workers.

---

## 5. Implementación detallada por módulo

## 5.1 `index.html`

> **Nota técnica:** `frame-ancestors` se elimina del `<meta>` porque la especificación CSP lo ignora en meta tags; solo aplica vía cabecera HTTP. En entorno local sin servidor, es best-effort. Si se despliega con servidor, añadir `frame-ancestors 'none'` como cabecera HTTP real.


Debe incluir:

```html
<!DOCTYPE html>
<html lang="es" data-theme="oscuro">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; worker-src 'self'; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none';" />
  <title>Dashboard Finanzas</title>
  <link rel="stylesheet" href="app.css" />
  <link rel="stylesheet" href="ui/styles/theme-light.css" />
  <link rel="stylesheet" href="ui/styles/theme-dark.css" />
  <script src="vendor/tabulator.min.js"></script>
  <script src="vendor/echarts.min.js"></script>
</head>
<body>
  <div id="app">
    <aside id="sidebar" class="sidebar" aria-label="menu"></aside>
    <main id="main" class="main" aria-label="content"></main>
  </div>
  <div id="modal-root"></div>
  <div id="loading-root"></div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

Reglas:
- No scripts inline.
- No estilos inline en componentes si pueden evitarse.
- Vendor UMD antes de `app.js` (exponen globals `window.Tabulator` y `window.echarts`).
- `app.js` como módulo ES.
- `app.js` NO importa vendor como ES module; accede vía `window.Tabulator` / `window.echarts`.

---

## 5.2 `app.js`

Responsabilidad:

- Orquestar bootstrap.
- Mostrar pantalla de carga.
- Inicializar plataforma.
- Inicializar workers.
- Inicializar i18n.
- Decidir onboarding o login.
- Gestionar sesión.
- Gestionar auto-lock.
- Renderizar menú.
- Enrutar paneles.
- Exponer objeto `session`.

### Flujo exacto

```js
async function bootstrap() {
  showLoading('loading_initializing');

  const platform = await createPlatform();
  await platform.detectCapabilities();

  const releaseLock = await platform.lock.acquire();
  registerLockRelease(releaseLock);

  await platform.storage.init();
  await platform.db.open('contabilidad.db');
  await verifySchema();

  await initI18n('ES');
  await initWorkers(platform);

  const usersCount = await countUsers();

  if (usersCount === 0) {
    await onboardingFlow(platform);
  } else {
    await loginFlow(platform);
  }

  hideLoading();
  startInactivityWatch();
}
```

### `verifySchema`

Debe:

1. Verificar SQLite version >= 3038000. Si inferior, emitir `DB-014` y abortar.
2. Leer `PRAGMA user_version`.
3. Si `0`: ejecutar `init.sql` y establecer `PRAGMA user_version = 2`.
4. Si `1`: ejecutar `migrations.sql`. Si falla, rollback y emitir `DB-002`.
5. Si `2`: no hacer nada. Esquema vigente.
6. Si `> 2`: la aplicación es más antigua que el esquema. Emitir `DB-003` y abortar.

### Router interno

El enrutado de paneles se gestiona mediante estado interno en `app.js`:

```js
const routes = {
  'panel-preferencias': () => import('./ui/panels/panel-preferencias.js')
  // Fases posteriores añaden rutas aquí SIN modificar el patrón:
  // 'panel-extractos': () => import('./ui/panels/panel-extractos.js'),
  // 'panel-maestros': () => import('./ui/panels/panel-maestros.js'),
  // etc.
};

async function navigate(route) {
  if (!routes[route]) {
    platform.logger.log('warn', 'UI-033', `Route not available in Phase 1: ${route}`);
    return;
  }
  const module = await routes[route]();
  const main = document.getElementById('main');
  main.innerHTML = '';
  module.render(main, session);
}
```

> Fase 1 solo expone `panel-preferencias`. Navegación a rutas no disponibles emite log `UI-033` sin error visible.


### Sesión

Objeto interno:
```js
{
  userId: number|null,
  perfil: 'A'|'U'|null,
  idioma: 'ES'|'CAT'|'EN'|null,
  look: 'C'|'O'|null,
  keys: {
    data: CryptoKey|null,
    hmac: CryptoKey|null
  },
  keysRaw: {
    data: ArrayBuffer|null,  // exportado vía crypto.subtle.exportKey('raw', ...)
    hmac: ArrayBuffer|null   // para envío a workers vía transferible
  }
}
```

Reglas:
- `frase_datos` no se conserva tras derivar DATA/HMAC.
- `keysRaw` se genera una vez tras login mediante `crypto.subtle.exportKey('raw', key)`.
- En logout o auto-lock, `keys.data`, `keys.hmac`, `keysRaw.data` y `keysRaw.hmac` se destruyen (sobrescribir con ceros antes de nullificar).
- Al enviar claves a workers, usar `keysRaw.data`/`keysRaw.hmac` como `ArrayBuffer` transferible (ver apéndice 10.6).
- Ninguna clave se persiste.

---

## 5.3 `db/adapters.js`

Debe exportar:

```js
export async function createPlatform();
```

Detección:

```js
const isTauri = !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
```

Si `isTauri` es `true`, carga dinámicamente `tauri-impl.js`.

En navegador:

```js
const impl = await import('./browser-impl.js');
return impl.createBrowserPlatform();
```

En Tauri Fase 1:

```js
throw new AppError(ERRORS.UI_031, 'Tauri implementation not available in Phase 1');
```

---

## 5.4 `db/browser-impl.js`

Implementa `platform` para navegador.

### Lock

```js
navigator.locks.request('scd_contabilidad_lock', { mode: 'exclusive' }, callback)
```

Reglas:

- Si no adquiere lock, emitir `UI-030`.
- No inicializar SQLite ni OPFS si falla.
- Devuelve función `release`.
- Registrar liberación en `beforeunload`.

### Storage

Usa `db/opfs.js` internamente.

`storage.init()` debe:

1. Obtener directorio OPFS.
2. Eliminar `contabilidad.db.tmp` residual si existe.
3. No crear `contabilidad.db` si no existe todavía.

### Database

Usa `db/sqlite-wasm.js` internamente.

`db.flush()` debe:

1. Exportar bytes de SQLite.
2. Escribir `contabilidad.db.tmp`.
3. Validar tamaño.
4. Renombrar a `contabilidad.db`.
5. Si falla, emitir `DB-016`.

### Dialog

> **Motivo:** D-14 reserva `EXT-006` exclusivamente para Norma 43. Los stubs de dialog deben emitir `UI-033`.

En Fase 1:

```js
pickCsvFiles: async () => { throw new AppError(ERRORS.UI_FEATURE_UNAVAILABLE); }
pickDbFile: async () => { throw new AppError(ERRORS.UI_FEATURE_UNAVAILABLE); }
saveDbFile: async () => { throw new AppError(ERRORS.UI_FEATURE_UNAVAILABLE); }
```

Estos métodos se implementan en fases posteriores.

---

## 5.5 `db/opfs.js`

Módulo interno de `browser-impl.js`.

API mínima:

```js
export async function getRoot();
export async function readFile(name);
export async function writeFileAtomic(name, bytes);
export async function deleteFile(name);
export async function exists(name);
export async function removeStaleTmp();
```

`writeFileAtomic`:

```text
1. Escribir bytes en name.tmp
2. Leer size escrito
3. Si size !== bytes.byteLength → DB-016
4. Renombrar tmp sobre name
```

Si `FileSystemFileHandle.move` no está disponible, se permite fallback seguro:

1. Escribir temporal.
2. Validar.
3. Borrar destino.
4. Mover/copiar temporal a destino.
5. Borrar temporal.

Si no se puede garantizar validación, emitir `DB-016`.

---

## 5.6 `db/sqlite-wasm.js`

Módulo interno de `browser-impl.js`.

Debe encapsular SQLite WASM.

API mínima:

```js
export async function initSqliteWasm();
export async function openDatabase(bytesOrNull);
export async function exec(sql, params);
export async function select(sql, params);
export async function transaction(fn);
export async function exportDatabase();
export async function closeDatabase();
export async function getLibVersion();
```

Requisitos:

- `foreign_keys = ON` al abrir.
- `busy_timeout = 5000` al abrir.
- Parámetros ligados, no concatenación SQL.
- BLOBs como `Uint8Array`.
- `select` devuelve objetos con BLOBs como `Uint8Array`.
    **Regla de implementación:** al construir el objeto fila, los campos de tipo `BLOB`
    deben envolverse explícitamente en `new Uint8Array(row[col])` para evitar
    que SQLite WASM devuelva `Array` ordinario.
    Esto garantiza que `crypto.subtle.decrypt` reciba siempre `BufferSource` válido.
- `transaction` abre transacción, ejecuta `fn`, hace COMMIT o ROLLBACK.
- Tras COMMIT exitoso, `browser-impl.js` invoca flush.
- Tras ROLLBACK, no flush.

---

## 5.7 `db/init.sql`

Debe crear el esquema completo vigente.

Orden de ejecución:

1. Tablas.
2. Índices.
3. Vistas.
4. Seeds de catálogos.
5. Seeds de dashboards/tarjetas.
6. `PRAGMA user_version = 2;`

Tablas:

```text
usuarios
preferencias
bancos
cuentas_bancarias
activos
catalogo_semantico
catalogo_tipos_grafico
grupos
subgrupos
clasificacion
extractos
norma43
movimientos
dashboards_usuario
catalogo_tarjetas
tarjetas_dashboard
saldos_cuenta
catalogo_tokens
```

Checks adicionales obligatorios en `catalogo_tarjetas`:

```sql
CHECK(json_extract(configuracion, '$.v') IS NOT NULL)
CHECK(json_type(json_extract(configuracion, '$.v')) = 'integer')
CHECK(json_extract(configuracion, '$.v') >= 1)
```

Seeds obligatorios:

- 12 filas en `catalogo_semantico`.
- 5 filas en `catalogo_tipos_grafico`.
- 8 tarjetas estándar en `catalogo_tarjetas`.
- 1 dashboard estándar global `dashboard_general`.
- 8 filas en `tarjetas_dashboard` asociando tarjetas estándar.

Reglas de seeds:

- No depender de IDs literales.
- Resolver por `nombre`.
- Usar `INSERT OR IGNORE` o `NOT EXISTS`.
- Tarjetas estándar con `nombre` como clave i18n.
- Configuraciones con `"v":1`.

## 5.7-bis Fuente db/init.sql`

> **Instrucción para la IA:**  
> El siguiente bloque de código SQL es la **fuente de verdad absoluta** para `db/init.sql`. La IA debe copiarlo íntegramente, sin modificar ni una coma. No está autorizada a reordenar las tablas, cambiar nombres de columnas, añadir ni eliminar índices, ni alterar los valores de los seeds. Cualquier desviación respecto a este bloque se considera un error crítico de implementación.



### 📌 Consecuencia de incluir este bloque en el documento

| Antes (sin código) | Después (con código literal) |
| :--- | :--- |
| La IA **interpreta** qué tablas crear y cómo hacer los seeds. | La IA **transcribe** el bloque exacto. |
| Riesgo de olvidar un índice o un CHECK. | Riesgo cero: el SCD verifica que el fichero generado coincide con el bloque. |
| Posible ambigüedad en los nombres de las tarjetas o colores. | Nombres, colores y tamaños fijados. |
| La IA debe deducir la sintaxis `json_extract`. | La sintaxis está escrita, solo hay que copiarla. |


---

## 5.8 `db/migrations.sql`

Debe contener guard transaccional.

Comportamiento:

```text
Si user_version = 0:
  No debe ejecutarse migrations.sql; debe ejecutarse init.sql.

Si user_version = 1:
  Aplicar transformación a v2 dentro de transacción.
  Si falta definición completa de v1.1, emitir DB-002.

Si user_version >= 2:
  No hacer nada.

Si user_version > 2:
  Emitir DB-003.
```

Para Fase 1, la IA debe implementar una migración defensiva:

```sql
BEGIN TRANSACTION;
-- Verificar existencia de objetos críticos.
-- Si falta algún objeto requerido por v1.5, ROLLBACK y error DB-002.
COMMIT;
PRAGMA user_version = 2;
```

No se permite inventar migraciones destructivas.

---

## 5.9 `crypto/pbkdf2.js`

API:

```js
export function normalizeNFC(value);

export function randomBytes(length);
// Implementación: return crypto.getRandomValues(new Uint8Array(length));
// NO usar Math.random() ni ninguna fuente no criptográfica.

export async function deriveAuthKey(password, salt);
export async function deriveWrapKey(password, salt);
export async function deriveDataKey(fraseDatos, salt);
export async function deriveHmacKey(fraseDatos, salt);
export async function hashPasswordHex(password, salt);
export async function verifyPasswordHex(password, salt, expectedHex);
export async function wrapFraseDatos(password, passwordSalt, fraseDatos);
export async function unwrapFraseDatos(password, passwordSalt, ivFrase, fraseCifrada);
```

Parámetros fijos:

```text
Algoritmo: PBKDF2-SHA256
Iteraciones: 600000
Longitud: 256 bits
```

Dominios:

```text
AUTH: UTF-8("AUTH:" + password NFC)
WRAP: UTF-8("WRAP:" + password NFC)
DATA: UTF-8("DATA:") + fraseDatos bytes
HMAC: UTF-8("HMAC:") + fraseDatos bytes
```

`hashPasswordHex` devuelve hexadecimal minúsculas de 64 caracteres.

`verifyPasswordHex` debe comparar hash derivado contra `expectedHex`.

`wrapFraseDatos`:

1. Derivar clave WRAP.
2. Generar IV de 12 bytes.
3. Cifrar `fraseDatos` con AES-GCM.
4. Devolver `{ frase_cifrada, iv_frase }`.

`unwrapFraseDatos`:

1. Derivar clave WRAP.
2. Descifrar.
3. Devolver `Uint8Array`.
4. Si falla, emitir `CR-004`.

---

## 5.10 `crypto/aes-gcm.js`

API:

```js
export function generateIv();
export async function importAesKey(rawKeyBytes);
export async function encryptBytes(key, bytes);
export async function decryptBytes(key, iv, data);
export async function encryptString(key, text);
export async function decryptString(key, iv, data);
export async function encryptAmountCents(key, cents);
export async function decryptAmountCents(key, iv, data);
```

Reglas:

- IV de 12 bytes.
- IV único por campo.
- IV generado con WebCrypto.
- `encryptString` codifica UTF-8.
- `decryptString` decodifica UTF-8.
- `encryptAmountCents` cifra la cadena UTF-8 del entero de céntimos.
- `decryptAmountCents` devuelve entero como `BigInt` o `Number` seguro. Para acumulación contable se prefiere `BigInt`.
- Fallo de descifrado: `CR-002`.

---

## 5.11 `crypto/rango-importe.js`

API:

```js
export function calcularRangoImporte(importeCents);
```

Entrada: céntimos enteros con signo (tipo `number` entero o `BigInt`).

Validación de entrada:
- Si `importeCents` no es entero (float, NaN, string, null, undefined): lanzar `TypeError('importeCents must be integer')`.
- Nunca aplicar coerción silenciosa (`Math.floor`, `parseInt`, `Number()`).


Buckets exactos:

```text
POS_0-10      [0, 1000)
POS_10-50     [1000, 5000)
POS_50-100    [5000, 10000)
POS_100-250   [10000, 25000)
POS_250-500   [25000, 50000)
POS_500-1000  [50000, 100000)
POS_1000-2500 [100000, 250000)
POS_2500-5000 [250000, 500000)
POS_5000+     [500000, +inf)

NEG usa valor absoluto con los mismos tramos.
```

Cero devuelve `POS_0-10`.

---

## 5.12 Workers

### Contrato común

Request:

```json
{
  "id": "uuid",
  "tipo": "string",
  "payload": {}
}
```

Response:

```json
{
  "id": "uuid",
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "id": "uuid",
  "ok": false,
  "error": "DB-012"
}
```

### `worker-cifrado.js`

Tipos:

```text
AES_ENCRYPT_BATCH
AES_DECRYPT_BATCH
```

Payload:

```js
{
  key: ArrayBuffer,
  items: [
    { id, text }
  ]
}
```

Respuesta:

```js
{
  results: [
    { id, iv, data }
  ]
}
```

Para decrypt:

```js
{
  key: ArrayBuffer,
  items: [
    { id, iv, data }
  ]
}
```

Lote máximo: 1000.

### `worker-hash.js`

Tipos:

```text
HMAC_SIGN
HMAC_SIGN_BATCH
```

Payload:

```js
{
  key: ArrayBuffer,
  messages: [string]
}
```

Respuesta:

```js
{
  hashes: [hex]
}
```

### `worker-normalizacion.js`

Tipo:

```text
NORMALIZE_TEXT
```

Debe aplicar normalización 5.5-bis:

1. NFC.
2. Trim.
3. Colapso de espacios.
4. Minúsculas.
5. Eliminación de tildes.

### `worker-clasificacion.js`

Tipo:

```text
TOKENIZE_CONCEPT
```

Debe:

1. Normalizar concepto.
2. Split por espacios y puntuación.
3. Deduplicar tokens.
4. Devolver tokens.

No calcula hashes si no recibe clave.

### Timeout

`app.js` debe envolver llamadas a worker con timeout de 30.000 ms mediante `Promise.race`:

```js
function callWorkerWithTimeout(worker, message, timeoutMs = 30000) {
  return Promise.race([
    new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const handler = (e) => {
        if (e.data.id === id) {
          worker.removeEventListener('message', handler);
          if (e.data.ok) resolve(e.data.data);
          else reject(new AppError(e.data.error));
        }
      };
      worker.addEventListener('message', handler);
      worker.postMessage({ id, ...message });
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new AppError(ERRORS.DB_TIMEOUT)), timeoutMs)
    )
  ]);
}
```

Si expira:

```text
DB-012
```

Si `new Worker` falla:

```text
UI-032
fallback a hilo principal con chunking setTimeout(0)
```

---

## 5.13 `utils/errors.js`

Debe exportar constante `ERRORS` con nombres legibles:

```js
export const ERRORS = {
  DB_NOT_INITIALIZED: 'DB-001',
  DB_MIGRATION_FAILED: 'DB-002',
  DB_INCOMPATIBLE_VERSION: 'DB-003',
  DB_IBAN_INVALID: 'DB-010',
  DB_TIMEOUT: 'DB-012',
  DB_SQLITE_VERSION: 'DB-014',
  DB_FLUSH_FAILED: 'DB-016',
  DB_DASHBOARD_MATERIALIZE_FAILED: 'DB-017',
  CRYPTO_KEY_MISSING: 'CR-001',
  CRYPTO_DECRYPT_FAILED: 'CR-002',
  CRYPTO_HMAC_INVALID: 'CR-003',
  CRYPTO_FRASE_MISSING: 'CR-004',
  AUTH_USER_BLOCKED_ADMIN: 'AU-001',
  AUTH_INVALID_CREDENTIALS: 'AU-002',
  AUTH_TEMP_BLOCKED: 'AU-003',
  AUTH_BOOTSTRAP_NOT_ALLOWED: 'AU-004',
  AUTH_LAST_ADMIN: 'AU-005',
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
  EXT_NORMA43_INOPERATIVE: 'EXT-006'
};
```

**Nota:** La constante `PBKDF2_ITERATIONS` se exporta ÚNICAMENTE desde `crypto/pbkdf2.js`.
`utils/errors.js` NO la exporta.
Todos los módulos que necesiten la constante la importan desde `crypto/pbkdf2.js`:
```js
import { PBKDF2_ITERATIONS } from './crypto/pbkdf2.js';
```

---

## 5.14 `utils/i18n.js`

API:

```js
export async function initI18n(lang);
export async function setLanguage(lang);
export function getLanguage();
export function t(key, params = {});
```

Reglas:

- Carga `i18n/es.json`, `i18n/cat.json`, `i18n/en.json` mediante `fetch`.
- Idiomas válidos: `ES`, `CAT`, `EN`.
- Si clave ausente, devuelve la clave literal.
- Sustitución de parámetros `{{param}}`.
- No permite idiomas adicionales.



Claves i18n mínimas de Fase 1 (lista cerrada):

**Login/Onboarding:**
- `login_title`, `login_email`, `login_password`, `login_submit`
- `onboarding_title`, `onboarding_name`, `onboarding_email`
- `onboarding_password`, `onboarding_password_confirm`
- `onboarding_language`, `onboarding_look`
- `onboarding_submit`, `warning_no_recovery`

**Errores:**
- `error_generic`, `error_code`
- `AU-001`, `AU-002`, `AU-003`, `AU-004`, `AU-005` (texto descriptivo)
- `DB-001`, `DB-002`, `DB-003`, `DB-010`, `DB-012`, `DB-014`, `DB-016`, `DB-017`
- `CR-001`, `CR-002`, `CR-003`, `CR-004`
- `UI-025`, `UI-026`, `UI-030`, `UI-031`, `UI-032`, `UI-033`
- `EXT-006`

**Preferencias:**
- `menu_preferencias`, `preferences_language`, `preferences_look`
- `preferences_save`, `preferences_saved`
- `security_change_password`, `security_current_password`
- `security_new_password`, `security_confirm_password`
- `security_password_changed`, `security_password_must_differ`

**Menú:**
- `menu_dashboards`, `menu_dashboard_standard`, `menu_dashboard_custom`
- `menu_extractos`, `menu_panel_extractos`, `menu_panel_norma43`, `menu_panel_movimientos`
- `menu_maestros`, `menu_preferencias`, `menu_admin`, `menu_panel_usuarios`

**UI general:**
- `loading_initializing`, `look_claro`, `look_oscuro`
- `language_es`, `language_cat`, `language_en`

Los ficheros `i18n/es.json`, `i18n/cat.json`, `i18n/en.json` deben contener
exactamente estas claves (más las de 7.2-bis para dashboards/tarjetas).
Test U-I18N-001 verifica paridad exacta entre los tres ficheros.

---

## 5.15 `utils/format.js`

API mínima:

```js
export function formatCents(cents, locale);
export function formatDateIso(dateStr);
export function formatPeriod(period);
export function utcNowIso();
```

Reglas:

- `formatCents` recibe céntimos enteros.
- No altera el valor interno.
- `utcNowIso` devuelve `YYYY-MM-DDTHH:MM:SSZ`.

---

## 5.16 `utils/iban.js`

API:

```js
export function normalizeIban(iban);
export function validateIban(iban);
```

Reglas:

- Mayúsculas.
- Sin espacios.
- Módulo 97.
- Solo IBAN español obligatorio.
- Si falla, emitir `DB-010` en formularios que lo usen.

---

## 5.17 `config/menu.json`

Contenido exacto para Fase 1:

```json
{
  "menu": [
    {
      "id": "dashboards",
      "i18n": "menu_dashboards",
      "icon": "dashboard",
      "route": null,
      "visible": "none",
      "children": [
        {
          "id": "dashboard-standard",
          "i18n": "menu_dashboard_standard",
          "icon": "dashboard",
          "route": "dashboard-standard",
          "visible": "none",
          "children": []
        },
        {
          "id": "dashboard-custom",
          "i18n": "menu_dashboard_custom",
          "icon": "dashboard",
          "route": "dashboard-custom",
          "visible": "none",
          "children": []
        }
      ]
    },
    {
      "id": "extractos",
      "i18n": "menu_extractos",
      "icon": "file",
      "route": null,
      "visible": "none",
      "children": [
        {
          "id": "panel-extractos",
          "i18n": "menu_panel_extractos",
          "icon": "file",
          "route": "panel-extractos",
          "visible": "none",
          "children": []
        },
        {
          "id": "panel-norma43",
          "i18n": "menu_panel_norma43",
          "icon": "file",
          "route": "panel-norma43",
          "visible": "none",
          "children": []
        },
        {
          "id": "panel-movimientos",
          "i18n": "menu_panel_movimientos",
          "icon": "file",
          "route": "panel-movimientos",
          "visible": "none",
          "children": []
        }
      ]
    },
    {
      "id": "maestros",
      "i18n": "menu_maestros",
      "icon": "database",
      "route": "panel-maestros",
      "visible": "none",
      "children": []
    },
    {
      "id": "preferencias",
      "i18n": "menu_preferencias",
      "icon": "settings",
      "route": "panel-preferencias",
      "visible": "all",
      "children": []
    },
    {
      "id": "admin",
      "i18n": "menu_admin",
      "icon": "users",
      "route": null,
      "visible": "none",
      "children": [
        {
          "id": "panel-usuarios",
          "i18n": "menu_panel_usuarios",
          "icon": "users",
          "route": "panel-usuarios",
          "visible": "none",
          "children": []
        }
      ]
    }
  ]
}
```

Reglas:

- Fase 2-5 solo cambian `visible`.
- No se añaden ni eliminan nodos.
- `panel-norma43` permanece `none`.
- Iconos deben existir en `assets/icons/`.
- Si falta icono, usar `default.svg`.

---

## 5.18 `config/preferences-default.json`

```json
{
  "menu_ancho": 260,
  "menu_colapsado": false,
  "dashboard_activo": null,
  "filtro_fecha_dashboard": "mes_actual",
  "importe_filtro_min": null,
  "importe_filtro_max": null,
  "ultima_vista_panel": "panel-preferencias"
}
```

Regla:

- En Fase 1 se usan activamente `menu_ancho` y `menu_colapsado`.
- `ultima_vista_panel` puede inicializarse a `panel-preferencias`.
- El resto se implementa en fases posteriores.

---

## 5.19 Servicio de preferencias

Las funciones `getPreference(key)`, `setPreference(key, value)` y `cleanupObsoletePreferences()` se implementan **como funciones internas dentro de `app.js`**. No se crea fichero separado.

Motivo: el servicio es de uso exclusivo del orquestador (menú, sesión) y no debe exponerse como módulo público. Ningún panel ni formulario accede directamente; los cambios de idioma/look se persisten en `usuarios`, no a través de este servicio.

API interna:

```js
async function getPreference(key)
async function setPreference(key, value)
async function cleanupObsoletePreferences()
```

Reglas:
- Whitelist exacta (copiada de PR-SCD 4.4-bis, vigente):
  - menu_ancho
  - menu_colapsado
  - dashboard_activo
  - filtro_fecha_dashboard
  - importe_filtro_min
  - importe_filtro_max
  - ultima_vista_panel

  En Fase 1 solo se usan activamente `menu_ancho` y `menu_colapsado`.
  El servicio valida TODAS las claves contra la whitelist completa,
  rechazando con UI-025 cualquier clave fuera de esta lista.

- Si clave no autorizada: `UI-025`.
- Valor se serializa con `JSON.stringify(value)`.
- Valor se cifra con clave DATA.
- Al leer, descifrar y parsear.
- Si no existe fila, devolver valor de `preferences-default.json`.
- `cleanupObsoletePreferences` elimina claves fuera de whitelist.
- La eliminación se registra con `platform.logger.log('info', 'UI-025', key)`.
- No emitir error visible en limpieza.

---

## 5.20 `ui/forms/form-login.js`

Debe implementar dos pantallas:

### Onboarding

Condiciones:

- Tabla `usuarios` vacía.
- Solo perfil `A`.
- Idioma por defecto `ES`.
- Look por defecto `O`.

Campos:

```text
nombre
email
password
password_confirm
idioma
look
```

Validaciones:

- `nombre` no vacío y <= 100.
- `email` no vacío, <= 254, normalizado a minúsculas.
- `password` >= 8 y <= 128.
- `password_confirm` igual.
- `idioma` en `ES|CAT|EN`.
- `look` en `C|O`.

Acción:

1. Generar `password_salt` 16 bytes.
2. Generar `data_salt` 16 bytes.
3. Generar `frase_datos` 32 bytes.
4. Derivar `password_hash` con dominio AUTH.
5. Cifrar `frase_datos` con WRAP.
6. Insertar usuario.
7. Ejecutar `ensureStandardDashboards(idUsuario)` en misma transacción.
8. Si falla, rollback y `DB-017`.
9. Auto-login con las credenciales recién creadas.
10. Mostrar advertencia de no recuperación antes de crear (clave i18n: `warning_no_recovery`).
    > El texto debe ser visible y requerir confirmación explícita (checkbox) antes de habilitar el botón "Crear usuario".

### Login

Campos:

```text
email
password
```

Acción:

1. Normalizar email a minúsculas.
2. Buscar usuario por email. Si no existe: `AU-002`.
3. Si `estado='B'` y `fecha_bloqueo IS NULL`: `AU-001` (bloqueo administrativo, solo perfil A puede desbloquear).
4. Si `estado='B'` y `fecha_bloqueo > now`: `AU-003` (bloqueo temporal activo).
5. Si `estado='B'` y `fecha_bloqueo <= now`: permitir intento; **resetear `intentos_fallidos=0` ANTES de validar** (desbloqueo automático).
6. Derivar AUTH con `password_salt` del usuario.
7. Comparar hash derivado con `password_hash`.
8. Si falla: incrementar `intentos_fallidos`. Si `intentos_fallidos >= 5`: establecer `estado='B'`, `fecha_bloqueo = now + 15 min`, emitir `AU-003`.
9. Si ok: `estado='A'`, `intentos_fallidos=0`, `fecha_bloqueo=NULL`, `fecha_ultimo_acceso=now`, `updated_at=now`.
10. Derivar WRAP con contraseña válida.
11. Descifrar `frase_datos` (bytes en memoria).
12. Derivar DATA y HMAC desde `frase_datos` + `data_salt`.
13. Destruir `frase_datos` de memoria (conservar solo claves DATA/HMAC).
14. Poblar objeto `session` (incluyendo `keysRaw` — ver A-8)

---

## 5.21 `ui/panels/panel-preferencias.js`

Fase 1 muestra dos secciones:

### Sección "General"
- Selector de idioma.
- Selector de look.
- Botón guardar.

### Sección "Seguridad" (cambio de contraseña, D-12)
- Campo `contrasena_actual` (password).
- Campo `contrasena_nueva` (password).
- Campo `contrasena_nueva_confirm` (password).
- Botón "Cambiar contraseña".

Validaciones:
- `contrasena_actual` debe verificar contra `password_hash` existente (AUTH). Si falla: `AU-002`.
- `contrasena_nueva`: longitud [8, 128].
- `contrasena_nueva_confirm` idéntica a `contrasena_nueva`.
- `contrasena_nueva` distinta de `contrasena_actual` (evitar cambio nulo).

Acción:
1. Generar nuevo `password_salt` (16 bytes aleatorios).
2. Derivar nueva clave AUTH → nuevo `password_hash`.
3. Derivar nueva clave WRAP.
4. Descifrar `frase_datos` con WRAP antigua.
5. Recifrar `frase_datos` con WRAP nueva (mismo contenido, nuevo IV).
6. Transacción ACID: actualizar `password_hash`, `password_salt`, `frase_cifrada`, `iv_frase`, `updated_at`.
7. Destruir claves de sesión.
8. Mostrar pantalla de login forzando re-autenticación.

**No se recifran datos de negocio**: DATA/HMAC se derivan del mismo contenido de `frase_datos`, por lo que los datos existentes siguen siendo descifrables.

Claves i18n requeridas:
- `security_change_password`
- `security_current_password`
- `security_new_password`
- `security_confirm_password`
- `security_password_changed`
- `security_password_must_differ`
---

## 5.22 Menú lateral

Responsabilidad de `app.js` o módulo interno.

Funcionalidad Fase 1:

- Renderiza nodos visibles.
- Respeta `visible`:
  - `none`: oculto.
  - `all`: visible para todos.
  - `admin`: solo perfil `A`.
  - `user`: solo perfil `U`.
- Colapsable.
- Resize manual.
- Iconos.
- Persistencia de `menu_ancho` y `menu_colapsado`.
- Al colapsar muestra solo iconos.
- Al hacer click en nodo con route, carga panel.
- En Fase 1, único route activo: `panel-preferencias`.

Reglas visuales:

- Ancho mínimo: 180px.
- Ancho máximo: 420px.
- Colapsado: 60px.
- Usa tokens CSS.
- Sin colores hardcoded.

---

## 5.23 Theming

`app.css` define layout y tokens estructurales.

`theme-light.css` y `theme-dark.css` definen tokens completos del alcance.

Reglas:

- `usuarios.look = 'C'` → `data-theme="claro"`.
- `usuarios.look = 'O'` → `data-theme="oscuro"`.
- Componentes usan `var(--token)`.
- Prohibido colores hardcoded en componentes.
- Cambio de look actualiza `data-theme` y persiste en `usuarios.look`.

---

## 5.24 `README.md`

Debe incluir:

- Proyecto local sin backend.
- Requisito de contexto seguro: `localhost` o `https`.
- `file://` no soportado.
- Cada usuario físico debe usar perfil de navegador o usuario de sistema operativo distinto.
- Si dos usuarios comparten perfil, comparten `contabilidad.db`; la protección es criptográfica, no aislamiento de proceso.
- La pérdida de contraseña impide recuperar datos.
- Backup solo estará disponible en fase posterior y solo para perfil A.
- No usar IndexedDB, LocalStorage ni sessionStorage.
- Instrucciones de arranque local.

---

## 6. Flujos completos de Fase 1

### 6.1 Primera ejecución

```text
1. Mostrar loading.
2. Detectar capacidades.
3. Adquirir lock.
4. Inicializar OPFS.
5. Abrir/crear contabilidad.db.
6. Crear esquema si user_version = 0.
7. Cargar i18n ES.
8. Detectar usuarios = 0.
9. Mostrar onboarding.
10. Crear admin.
11. Materializar dashboard estándar.
12. Auto-login.
13. Aplicar idioma/look.
14. Renderizar menú.
15. Renderizar panel-preferencias.
```

### 6.2 Ejecución posterior

```text
1. Mostrar loading.
2. Detectar capacidades.
3. Adquirir lock.
4. Inicializar OPFS.
5. Abrir contabilidad.db.
6. Verificar user_version.
7. Cargar i18n ES por defecto.
8. Mostrar login.
9. Autenticar.
10. Cargar idioma/look del usuario.
11. Cargar preferencias de menú.
12. Renderizar menú.
13. Renderizar panel-preferencias.
```

### 6.3 Auto-lock

```text
1. Registrar mousemove, keydown, click.
2. Timer de 15 minutos.
3. Si timeout:
   - Destruir claves DATA/HMAC.
   - Mostrar pantalla de reautenticación.
4. Si reautenticación válida:
   - Derivar WRAP.
   - Descifrar frase_datos.
   - Derivar DATA/HMAC.
   - Reanudar sesión.
5. Si reautenticación fallida:
   - Aplicar misma política de intentos fallidos.
```

---

## 7. Set de pruebas obligatorio

### 7.0 Entorno de ejecución

- Navegador: Chrome ≥ 120 (OPFS + Web Locks + WebCrypto).
- Contexto: `http://localhost` (no `file://`).
- BD de pruebas: SQLite en memoria (`:memory:`) para pruebas SQL; OPFS temporal para integración.
- Pruebas de doble pestaña: manuales (el operador abre dos pestañas y verifica `UI-030`).
- Pruebas de workers: mocks inyectables en el harness.

### 7.0-bis Tests adicionales de Fase 1

#### Criptografía
- `U-CRYPTO-009` Normalización NFC de contraseña antes de PBKDF2.
- `U-CRYPTO-010` Cambio de contraseña (flujo completo D-12):

Pasos:
1. Crear usuario con password `PassOld123`.
2. Cifrar datos de prueba con clave DATA derivada.
3. Invocar flujo de cambio a `PassNew456`.
4. Verificar:
   - `password_salt` ha cambiado.
   - `password_hash` es distinto.
   - `frase_cifrada` es distinta (nuevo IV y nueva WRAP).
   - `iv_frase` es distinto.
5. Intentar login con `PassOld123` → `AU-002`.
6. Login con `PassNew456` → exitoso.
7. Descifrar datos de prueba con nueva DATA → éxito (datos intactos, no recifrados).

#### Rango de importe
- `U-RANGO-002` Entrada no entera: lanza `TypeError`, nunca coerción silenciosa.

#### Base de datos
- `U-DB-001` Guard de versión SQLite: versión inyectada < 3038000 → `DB-014`.
- `I-DB-001` `user_version=0` → ejecuta `init.sql` → `user_version=2`.
- `I-DB-002` `user_version=1` → ejecuta `migrations.sql` → `user_version=2`.
- `I-DB-003` `user_version=3` → `DB-003`.
- `I-DB-004` Flush tras COMMIT sí, tras ROLLBACK no (modo interactivo).
- `SQL-PRAGMA-001` `foreign_keys=ON` y `busy_timeout=5000` tras abrir.
- `S-SQL-001` `init.sql` sin `ALTER TABLE` (regla 1.3 del PR).

#### Autenticación
- `I-AUTH-010` `estado='B'` + `fecha_bloqueo IS NULL` → `AU-001`.
- `I-AUTH-011` `estado='B'` + `fecha_bloqueo > NOW` → `AU-003`.
- `I-AUTH-012` `estado='B'` + `fecha_bloqueo <= NOW` → permite intento, resetea `intentos_fallidos=0`.
- `U-ONB-001` Password < 8 caracteres → error validación.
- `U-ONB-002` Password > 128 caracteres → error validación.
- `U-ONB-003` Password confirmación distinta → error validación.
- `U-ONB-004` Email con mayúsculas → normalizado a minúsculas.
- `U-ONB-005` Idioma/look fuera de enum → error validación.

#### Adaptadores
- `U-ADAPTER-001` Shape del objeto `platform`: todos los métodos presentes.

#### UI
- `I-ICON-001` Fallback a `default.svg` cuando falta icono referenciado.
- `I-UI-007` Router interno: navegación a `panel-preferencias` funcional.
- `I-UI-008` Stubs de dialog emiten `UI-033`:
  - `platform.dialog.pickCsvFiles()` → `AppError UI-033`.
  - `platform.dialog.pickDbFile()` → `AppError UI-033`.
  - `platform.dialog.saveDbFile()` → `AppError UI-033`.

#### i18n
- `U-I18N-004` Sustitución multiparámetro: `t('key', {a:1, b:2})`.

#### Seguridad
- `S-KEYS-003` Auto-lock: reloj inyectable en módulo de sesión; timeout 15min → claves destruidas.

#### Workers
- `U-WORKER-002` Lote > 1000: orquestador divide en `[1000, N]`; worker rechaza con `ok:false` si recibe >1000.
- `U-WORKER-005` Claves a workers: envío como `ArrayBuffer` (raw) vía `deriveBits`; `importKey` en cada lado.

### 7.1 Harness mínimo

`/tests/harness/runner.js` debe exportar:

```js
export async function runSuite(name, fn);
export async function test(name, fn);
export function assertEqual(actual, expected, message);
export function assertTrue(value, message);
export function assertFalse(value, message);
export async function assertRejectsWithCode(promise, code);
```

`/tests/harness/run.html` carga el runner y las suites.

---

### 7.2 Pruebas unitarias de criptografía

#### U-CRYPTO-001 Derivación AUTH reproducible

Entrada:

```text
password = "PruebaPass1"
salt = fixed 16 bytes
```

Esperado:

- Dos llamadas con misma entrada producen el mismo hash.
- El hash tiene 64 caracteres hex.

#### U-CRYPTO-002 Derivación sensible a salt

Entrada:

```text
mismo password
distinto salt
```

Esperado:

- Hash distinto.

### U-CRYPTO-003 Derivación sensible a dominio

Entrada:

```text
mismo password
mismo salt
dominios AUTH y WRAP
```

Esperado:

- Claves distintas.

### U-CRYPTO-004 AES roundtrip

Entrada:

```text
texto = "hola"
clave válida
```

Esperado:

- `decrypt(encrypt(texto)) === texto`.

### U-CRYPTO-005 IV único

Entrada:

```text
cifrar dos veces el mismo texto con la misma clave
```

Esperado:

- IV distintos.
- Ciphertext distintos.

### U-CRYPTO-006 Descifrado con clave incorrecta

Entrada:

```text
cifrar con clave A
descifrar con clave B
```

Esperado:

- `AppError CR-002`.

### U-CRYPTO-007 Wrap/unwrap de frase_datos

Entrada:

```text
frase_datos 32 bytes
password
```

Esperado:

- `unwrap(wrap(frase))` devuelve los mismos bytes.

### U-CRYPTO-008 Amount cents roundtrip

Entrada:

```text
123456
-98705
0
```

Esperado:

- Descifrado devuelve exactamente el mismo entero.

---

## 7.3 Pruebas unitarias de rango de importe

### U-RANGO-001 Tabla cerrada

Casos:

```text
0 → POS_0-10 (regla explícita PR-SCD 5.8-bis: "Cero se considera POS_0-10")
999 → POS_0-10
1000 → POS_10-50
4999 → POS_10-50
5000 → POS_50-100
9999 → POS_50-100
10000 → POS_100-250
24999 → POS_100-250
25000 → POS_250-500
49999 → POS_250-500
50000 → POS_500-1000
99999 → POS_500-1000
100000 → POS_1000-2500
249999 → POS_1000-2500
250000 → POS_2500-5000
499999 → POS_2500-5000
500000 → POS_5000+
-1 → NEG_0-10
-999 → NEG_0-10
-1000 → NEG_10-50
-5000 → NEG_50-100
-10000 → NEG_100-250
-25000 → NEG_250-500
-50000 → NEG_500-1000
-100000 → NEG_1000-2500
-250000 → NEG_2500-5000
-500000 → NEG_5000+
```

Esperado:

- Todos devuelven exactamente el bucket indicado.

---

## 7.4 Pruebas unitarias de utilidades

### U-ERRORS-001 Códigos únicos

Esperado:

- No hay códigos duplicados.
- Todos los códigos tienen formato `XX-###`.

### U-I18N-001 Paridad de claves

Esperado:

- `es.json`, `cat.json`, `en.json` tienen exactamente el mismo conjunto de claves.

### U-I18N-002 Fallback

Entrada:

```text
t('missing_key')
```

Esperado:

```text
'missing_key'
```

### U-I18N-003 Sustitución

Entrada:

```text
t('error_code', { code: 'AU-002' })
```

Esperado:

- Contiene `AU-002`.

### U-FORMAT-001 Format cents

Casos (locale fijo `es-ES` para aserción determinista):

```text
formatCents(123456, 'es-ES') === '1.234,56 €'
formatCents(-98705, 'es-ES') === '-987,05 €'
formatCents(0, 'es-ES') === '0,00 €'
```

Regla:

- El valor interno no se altera.
- El locale es parámetro obligatorio en la API para garantizar aserciones exactas en el harness.

### U-IBAN-001 IBAN válido

Entrada:

```text
ES9121000418450200051332
```

Esperado:

- `validateIban` devuelve `true`.

### U-IBAN-002 IBAN inválido

Entradas:

```text
ES9121000418450200051333
ES91 2100 0418 4502 0005 1332 con espacio alterado inválido
```

Esperado:

- `false`.

### U-IBAN-003 Normalización

Entrada:

```text
"es91 2100 0418 4502 0005 1332"
```

Esperado:

```text
"ES9121000418450200051332"
```

---

## 7.5 Pruebas SQL de esquema

Estas pruebas se ejecutan sobre una instancia limpia de SQLite WASM.

### SQL-SCHEMA-001 Tablas

Esperado: 18 tablas.

Lista exacta:

```text
usuarios
preferencias
bancos
cuentas_bancarias
activos
catalogo_semantico
catalogo_tipos_grafico
grupos
subgrupos
clasificacion
extractos
norma43
movimientos
dashboards_usuario
catalogo_tarjetas
tarjetas_dashboard
saldos_cuenta
catalogo_tokens
```

### SQL-SCHEMA-002 Vistas

Esperado: 10 vistas (lista exacta más abajo).

**Nota:** Las tablas `saldos_cuenta` y `catalogo_tokens` NO tienen vista auxiliar.
Esto es intencional: `saldos_cuenta` es derivada y se accede directamente;
`catalogo_tokens` se consulta con JOINs que no requieren filtrado por estado.

Lista:

```text
v_usuarios_activos
v_bancos_activos
v_cuentas_activas
v_activos_activos
v_grupos_activos
v_subgrupos_activos
v_clasificacion_activa
v_movimientos_activos
v_dashboards_usuario_activos
v_catalogo_tarjetas_activas
```

### SQL-SCHEMA-003 user_version

Esperado:

```text
PRAGMA user_version = 2
```

### SQL-SEEDS-001 catalogo_semantico

Esperado:

- 12 filas activas.
- Claves únicas.
- Todos los registros tienen `nombre_es` no vacío.

### SQL-SEEDS-002 catalogo_tipos_grafico

Esperado:

- 5 filas.
- `financiero` con `seleccionable = 0`.
- `linea`, `barra`, `circular`, `area` con `seleccionable = 1`.

### SQL-SEEDS-003 catalogo_tarjetas

Esperado:

- 8 tarjetas estándar.
- Todas con `origen = 'estandar'`.
- Todas con `id_usuario IS NULL`.
- Todas con `configuracion` válida.
- Todas con `json_extract(configuracion, '$.v') = 1`.

Nombres exactos:

```text
card_evolution_income
card_evolution_expenses
card_income_expenses
card_balance_evolution
card_movement_search
card_expenses_by_category
card_top10_movements
card_current_balance
```

### SQL-SEEDS-004 dashboard_general

Esperado:

- 1 fila en `dashboards_usuario` con:
  - `tipo = 'estandar'`
  - `id_usuario IS NULL`
  - `nombre = 'dashboard_general'`
  - `bloqueado = 1`
  - `estado = 'A'`

### SQL-SEEDS-005 tarjetas_dashboard

Esperado:

- 8 filas para el dashboard global.
- Órdenes únicos 1-8.
- Colores hex válidos.
- Tamaños válidos.

### SQL-FK-001 FK compuesta

Prueba:

```sql
INSERT INTO cuentas_bancarias (id_usuario, id_banco, iban, estado)
VALUES (999, 1, 'ES9121000418450200051332', 'A');
```

Sin banco para `id_usuario=999`.

Esperado:

- Fallo de FK.

### SQL-FK-002 FK simple nullable

Prueba:

```sql
INSERT INTO movimientos (...)
```

Con `id_grupo NULL`.

Esperado:

- No falla por FK nullable.

### SQL-CHECK-001 email lower

**Prueba A (aplicación normaliza):**
La aplicación normaliza `User@Example.com` a `user@example.com` antes del INSERT.
Esperado: INSERT exitoso. La fila persiste con `email = 'user@example.com'`.

**Prueba B (SQL directo sin normalización):**
Ejecutar directamente:
```sql
INSERT INTO usuarios (email, ...) VALUES ('User@Example.com', ...);
```
Esperado: Fallo por CHECK `email = lower(email)`.

### SQL-CHECK-002 rango_importe inválido

Prueba:

```sql
INSERT INTO extractos (..., rango_importe='POS_999')
```

Esperado:

- Falla por CHECK.

### SQL-CHECK-003 configuracion inválida

Prueba:

```sql
INSERT INTO catalogo_tarjetas (configuracion) VALUES ('{"a":1}')
```

Esperado:

- Falla por CHECK de `v`.

### SQL-CHECK-004 color_fondo inválido

Prueba:

```sql
INSERT INTO tarjetas_dashboard (color_fondo) VALUES ('#GGG')
```

Esperado:

- Falla por CHECK/GLOB.

---

## 7.6 Pruebas de autenticación

### U-AUTH-001 Hash password

Esperado:

- `password_hash` tiene 64 hex.
- No contiene la contraseña.

### U-AUTH-002 Verify password

Entrada:

```text
contraseña correcta
```

Esperado:

- `true`.

### U-AUTH-003 Verify password incorrecta

Esperado:

- `false`.

### I-AUTH-001 Onboarding crea admin

Pasos:

1. Arrancar BD vacía.
2. Completar onboarding.

Esperado:

- Usuario con `perfil='A'`, `estado='A'`.
- Idioma por defecto `ES` o seleccionado.
- Look por defecto `O` o seleccionado.
- `intentos_fallidos=0`.
- `password_salt`, `data_salt`, `frase_cifrada`, `iv_frase` no nulos.

### I-AUTH-002 Onboarding materializa dashboard

Esperado:

- Instancia de `dashboard_general` para el usuario.
- `tipo='estandar'`.
- `id_dashboard_origen` apunta a plantilla global.
- 8 tarjetas copiadas.
- Plantilla global sin cambios.

### I-AUTH-003 Idempotencia de materialización

Pasos:

1. Ejecutar `ensureStandardDashboards` dos veces.

Esperado:

- Una sola instancia.
- No duplica tarjetas.

### I-AUTH-004 Login correcto

Esperado:

- `fecha_ultimo_acceso` actualizado.
- `intentos_fallidos=0`.
- Claves DATA/HMAC en sesión.

### I-AUTH-005 Login fallido incrementa

Esperado:

- `intentos_fallidos` aumenta.
- Emite `AU-002`.

### I-AUTH-006 Bloqueo tras 5 fallos

Esperado:

- `estado='B'`.
- `fecha_bloqueo` aproximadamente `now + 15m`.
- Emite `AU-003`.

### I-AUTH-007 Bloqueo temporal no permite login

Pasos:

1. Bloquear usuario.
2. Intentar login antes de `fecha_bloqueo`.

Esperado:

- `AU-003`.

### I-AUTH-008 Desbloqueo automático

Pasos:

1. Insertar/actualizar `fecha_bloqueo` en pasado.
2. Login correcto.

Esperado:

- Usuario activo.
- `intentos_fallidos=0`.
- `fecha_bloqueo=NULL`.

### I-AUTH-009 Bootstrap no permitido

Pasos:

1. BD con al menos 1 usuario.
2. Intentar onboarding.

Esperado:

- `AU-004`.

---

## 7.7 Pruebas de preferencias

### U-PREFS-001 Whitelist

Entrada:

```js
setPreference('clave_invalida', 1)
```

Esperado:

- `AppError UI-025`.

### U-PREFS-002 Defaults

Entrada:

```js
getPreference('menu_ancho')
```

Sin fila en BD.

Esperado:

```text
260
```

### I-PREFS-001 Set/get roundtrip

Pasos:

1. `setPreference('menu_ancho', 300)`.
2. Recargar sesión.
3. `getPreference('menu_ancho')`.

Esperado:

```text
300
```

### I-PREFS-002 Valor cifrado

Pasos:

1. Guardar preferencia.
2. Leer fila directamente.

Esperado:

- `valor_cifrado` es BLOB.
- No contiene `300` en claro.

### I-PREFS-003 Cleanup

Pasos:

1. Insertar manualmente clave fuera de whitelist.
2. Ejecutar `cleanupObsoletePreferences`.

Esperado:

- Clave eliminada.
- Log interno registrado.
- Sin error visible.

---

## 7.8 Pruebas de OPFS y lock

### I-OPFS-001 Escritura atómica

Pasos:

1. `writeFileAtomic('contabilidad.db', bytes)`.

Esperado:

- `contabilidad.db` existe.
- `contabilidad.db.tmp` no existe.
- Tamaño coincide.

### I-OPFS-002 Fallo de validación

Simular tamaño esperado incorrecto.

Esperado:

- `DB-016`.
- `contabilidad.db` no reemplazado.

### I-OPFS-003 Tmp residual

Pasos:

1. Crear `contabilidad.db.tmp` residual.
2. `storage.init()`.

Esperado:

- Temporal eliminado.

### I-LOCK-001 Doble pestaña (prueba manual del operador)

Procedimiento:
1. Servir app en `http://localhost:8080`.
2. Abrir pestaña A en Chrome. Completar login.
3. Abrir pestaña B en la misma instancia de Chrome (mismo perfil).
4. Navegar a `http://localhost:8080` en B.

Esperado:
- Pestaña A: funciona normalmente.
- Pestaña B: muestra pantalla de error con código `UI-030` y mensaje i18n `error_instance_active`.
- Pestaña B: no muestra `panel-preferencias` ni ningún otro panel.
- Pestaña B: no crea fichero `contabilidad.db` ni accede a OPFS (verificable en DevTools → Application → OPFS).

Variante:
5. Cerrar pestaña A.
6. Recargar pestaña B.

Esperado:
- B arranca normalmente

### I-LOCK-002 Liberación

Pasos:

1. Cerrar pestaña A.
2. Abrir pestaña B.

Esperado:

- B arranca correctamente.

---

## 7.9 Pruebas de workers

### U-WORKER-001 Contrato request/response

Esperado:

- Todos los workers devuelven `id` y `ok`.
- Error incluye código.

### U-WORKER-002 Lote máximo

Entrada:

```text
1001 registros
```

Esperado:

- Error o división por parte del orquestador.
- Worker no procesa más de 1000 por mensaje.

### U-WORKER-003 Timeout

Simular worker sin respuesta > 30s.

Esperado:

- `DB-012`.

### U-WORKER-004 Fallback

Simular fallo de `new Worker`.

Esperado:

- `UI-032`.
- Operación continúa en hilo principal.

---

## 7.10 Pruebas de i18n y theming

### I-I18N-001 Cambio de idioma

Pasos:

1. Login con `ES`.
2. Cambiar a `CAT`.
3. Cambiar a `EN`.

Esperado:

- Textos visibles cambian.
- No hay recarga completa obligatoria.
- `usuarios.idioma` persistido.

### I-I18N-002 Claves de menú

Esperado:

- Todas las claves i18n usadas en `menu.json` existen en los tres idiomas.

### I-THEME-001 Look oscuro por defecto

Esperado:

- Primer usuario tiene `look='O'`.
- `document.documentElement.dataset.theme === 'oscuro'`.

### I-THEME-002 Cambio de look

Pasos:

1. Cambiar a claro.
2. Recargar.

Esperado:

- `data-theme="claro"`.
- Persistido en `usuarios.look`.

---

## 7.11 Pruebas de UI base

### I-UI-001 Pantalla de carga

Esperado:

- Visible durante bootstrap.
- Usa i18n.
- Desaparece tras login/onboarding.

### I-UI-002 Menú visible

Esperado:

- Solo `preferencias` visible en Fase 1.
- Todos los nodos futuros presentes pero ocultos.

### I-UI-003 Menú colapsable

Pasos:

1. Colapsar menú.
2. Recargar.

Esperado:

- `menu_colapsado=true`.
- Menú colapsado.

### I-UI-004 Menú resize

Pasos:

1. Redimensionar a 300px.
2. Recargar.

Esperado:

- `menu_ancho=300`.
- Menú con ancho 300.

### I-UI-005 Panel preferencias

Esperado:

- Idioma y look editables.
- Guardar actualiza UI.
- Mensaje `preferences_saved`.

### I-UI-006 Rutas ocultas

Pasos:

1. Intentar navegar manualmente a rutas no visibles.

Esperado:

- No se renderizan paneles no autorizados.
- No se generan errores no controlados.

---

## 7.12 Pruebas de seguridad y arquitectura

### S-ARCH-001 Grep prohibido

Comando:
```bash
grep -rnE "opfs\.js|sqlite-wasm\.js|navigator\.locks|__TAURI__|__TAURI_INTERNALS__|invoke\(|plugin:" ui/ workers/ crypto/ utils/ config/
```
Esperado:
0 resultados

**Nota:** se buscan las variables reales (`__TAURI__`, `__TAURI_INTERNALS__`) que usa Tauri v2, no cadenas genéricas.


### S-ARCH-002 Imports de plataforma

Esperado:

- Solo `db/adapters.js` resuelve implementaciones.
- `app.js` importa `db/adapters.js`.
- Ningún UI importa `db/browser-impl.js`.

### S-STORAGE-001 Almacenamientos prohibidos

Buscar en código:

```text
indexedDB
localStorage
sessionStorage
```

Esperado:

- 0 usos runtime.

### S-CSP-001 CSP presente

Esperado:

- Meta CSP exacta.
- Sin scripts inline.
- Sin CDN.

### S-KEYS-001 Claves no persistidas

Pasos:

1. Login.
2. Inspeccionar OPFS, IndexedDB, LocalStorage, sessionStorage.

Esperado:

- No existen claves, frase_datos ni password.

### S-KEYS-002 Logout destruye claves

Pasos:

1. Login.
2. Logout.

Esperado:

- `session.keys.data = null`.
- `session.keys.hmac = null`.

### S-KEYS-003 Auto-lock destruye claves

Pasos:
1. Login exitoso. Verificar `session.keys.data` y `session.keys.hmac` no son `null`.
2. Inyectar reloj mock: `injectClock(() => Date.now() + 15 * 60 * 1000 + 1)`.
3. Esperar 1 tick del `setInterval` interno (1 segundo).
4. Verificar:
   - `session.keys.data === null`.
   - `session.keys.hmac === null`.
   - UI muestra pantalla de reautenticación (elemento con data-testid="relogin-screen").
5. Introducir contraseña válida en pantalla de reautenticación.
6. Verificar que las claves se regeneran y la sesión continúa.

### S-PBKDF2-001 Iteraciones

Esperado:

- Todas las derivaciones usan 600000 iteraciones.
- No existe constante 100000.

### S-VENDOR-001 versions.json

> **Motivo:** La IA no puede calcular hashes reales (D-11). El test debe reformularse como verificación de estructura + validación por el operador.

**Responsabilidad del operador humano (no de la IA):**
- `tabulator.version = "6.3.1"`.
- `echarts.version = "5.6.0"`.
- Hashes SHA-256 reales (rellenados por el operador tras descargar los binarios).
- Hash de fichero local coincide con `versions.json`.

**Prueba automatizable por la IA (sin hashes):**
- `versions.json` existe y tiene estructura válida.
- Los campos `sha256` NO están vacíos (la IA los deja como `""`; esta prueba falla si el operador no los rellena, lo cual es correcto).
- Las versiones coinciden con las declaradas en D-09.

### S-VENDOR-002 Sin CDN

Esperado:

- Ningún `<script src="http...">`.
- Ningún `import` desde CDN.

---

## 7.13 Pruebas de SQL y datos de sesión

### I-SESSION-001 updated_at

Pasos:

1. Crear usuario.
2. Actualizar `fecha_ultimo_acceso`.

Esperado:

- `updated_at` actualizado a nivel de aplicación.

### I-SESSION-002 email único

Pasos:

1. Crear usuario con email `a@b.c`.
2. Intentar crear otro con `A@B.C`.

Esperado:

- Falla por unicidad/CHECK.

### I-SESSION-003 perfil y estado

Esperado:

- Solo valores `A`/`U` para perfil.
- Solo valores `A`/`B` para estado.

---

## 8. Gate de cierre de Fase 1

Fase 1 solo se cierra si se cumplen todos estos puntos:

- [ ] La aplicación arranca en contexto seguro local.
- [ ] La CSP está activa.
- [ ] El lock exclusivo funciona.
- [ ] Doble pestaña emite `UI-030`.
- [ ] OPFS crea/lee/elimina ficheros.
- [ ] Flush atómico funciona.
- [ ] Temporal residual se limpia.
- [ ] SQLite WASM abre con `foreign_keys = ON`.
- [ ] `busy_timeout = 5000`.
- [ ] Versión SQLite >= 3038000.
- [ ] `user_version = 2`.
- [ ] 18 tablas creadas.
- [ ] 10 vistas creadas.
- [ ] Seeds completos correctos.
- [ ] Bootstrap crea primer administrador.
- [ ] Onboarding no crea banco/cuenta.
- [ ] Materialización de dashboard estándar es idempotente.
- [ ] Login correcto funciona.
- [ ] Login fallido emite `AU-002`.
- [ ] Cambio de contraseña funcional (sección "Seguridad" de panel-preferencias).
- [ ] Tras cambio de contraseña, login antiguo falla.
- [ ] Tras cambio de contraseña, login nuevo funciona.
- [ ] Datos existentes siguen siendo accesibles tras cambio de contraseña (no se recifran).
- [ ] Bloqueo temporal emite `AU-003`.
- [ ] Desbloqueo automático funciona.
- [ ] Auto-lock destruye claves.
- [ ] Reautenticación restaura claves.
- [ ] Logout destruye claves.
- [ ] Preferencias `menu_ancho` y `menu_colapsado` persisten cifradas.
- [ ] Preferencias fuera de whitelist emiten `UI-025`.
- [ ] Idioma cambia sin recargar textos.
- [ ] Tema oscuro funciona desde el primer arranque.
- [ ] Tema claro funciona.
- [ ] Menú muestra solo nodos visibles.
- [ ] Menú colapsa, redimensiona y persiste.
- [ ] Panel preferencias edita idioma/look.
- [ ] Workers responden con contrato uniforme.
- [ ] Timeout de worker emite `DB-012`.
- [ ] Fallback de worker emite `UI-032`.
- [ ] Grep de arquitectura devuelve 0 resultados.
- [ ] No hay IndexedDB, LocalStorage ni sessionStorage.
- [ ] Vendor tiene hashes reales.
- [ ] Todos los errores usan `AppError`.
- [ ] No hay texto hardcoded en UI visible.
- [ ] Todas las suites de pruebas pasan.

---

## 9. Salida esperada de la IA

### 9.1 Responsabilidad de la IA

La IA entrega:

1. Árbol completo de ficheros runtime, **EXCLUYENDO** los artefactos operator-provided (D-11):
- `db/sqlite3.wasm`
- `db/sqlite3.js`
- `vendor/tabulator.min.js`
- `vendor/echarts.min.js`

  La IA NO genera estos cuatro ficheros. Genera el resto del árbol completo.

2. Código implementado sin placeholders ni TODOs.
3. `vendor/versions.json` con versiones exactas y hashes como cadena vacía `""` + instrucción de cálculo.
4. `db/init.sql` transcrito literalmente desde 5.7-bis.
5. `db/migrations.sql` completo.
6. `config/menu.json` exacto.
7. `config/preferences-default.json` exacto.
8. Ficheros i18n completos con todas las claves de Fase 1.
9. Assets SVG mínimos (`settings.svg`, `default.svg`; resto copias de `default.svg`).
10. Directorio `/tests/` con harness y suites.
11. **Manifiesto de trazabilidad**: tabla `[requisito_ID → fichero → función]`.
12. **Auto-checklist estática**: verificación mecánica de reglas arquitectónicas (grep de imports prohibidos, ausencia de IndexedDB/LocalStorage, CSP correcta).
13. **Lista de preguntas/blockers** si algún dato canónico falta.

### 9.2 Responsabilidad del operador humano

El operador ejecuta:

1. Descarga de binarios (D-11) y cálculo de hashes.

    Comandos por plataforma:

    **Linux/macOS:**
    ```bash
    cd vendor
    sha256sum tabulator.min.js echarts.min.js > hashes.tmp
    # Editar versions.json con los hashes resultantes
    ```

    **Windows (PowerShell):**
    ```powershell
    cd vendor
    (Get-FileHash tabulator.min.js -Algorithm SHA256).Hash
    (Get-FileHash echarts.min.js -Algorithm SHA256).Hash
    # Editar versions.json con los hashes resultantes (minúsculas)
    ```

    **Windows (cmd con certutil):**
    ```cmd
    certutil -hashfile tabulator.min.js SHA256
    certutil -hashfile echarts.min.js SHA256
    ```

    También para `db/`:
    ```bash
    sha256sum sqlite3.wasm sqlite3.js
    ```

2. Ejecución de `tests/harness/run.html` en Chrome ≥ 120 sobre `http://localhost`.
3. Ejecución del grep de arquitectura.
4. Adjuntar el **informe de resultados real** (no generado por la IA).

### 9.3 Prohibiciones absolutas a la IA

- Declarar "tests pasados" sin ejecutarlos (no tiene navegador ni OPFS).
- Inventar hashes SHA-256.
- Generar binarios (WASM, UMD).
- Inventar datos canónicos no especificados literalmente (D-17).

### 9.4 Entregables prohibidos

- Funcionalidades de Fase 2 o posteriores.
- CSV parsing real.
- Dashboards completos funcionales.
- Recálculo de saldos.
- Backup funcional.
- Dependencias externas no autorizadas.
- Bundlers, CDN, frameworks de testing externos.


## 10. Apéndice — Fragmentos de código de referencia

Estos fragmentos son **orientativos** para la IA. Deben adaptarse al contexto real pero sirven como ancla contra alucinaciones.

### 10.1 Exportar bytes de SQLite WASM

```js
// db/sqlite-wasm.js (usando API oficial sqlite3.js)
import { sqlite3InitModule } from './sqlite3.js';

let sqlite3, db;

export async function initSqliteWasm() {
  sqlite3 = await sqlite3InitModule();
}

export async function openDatabase(bytesOrNull) {
  if (bytesOrNull) {
    db = new sqlite3.oo1.DB(':memory:');
    const p = sqlite3.wasm.allocFromTypedArray(bytesOrNull);
    try {

      // NOTA: Los parámetros exactos de sqlite3_deserialize y sqlite3_serialize
      // pueden variar entre versiones de sqlite3.js. Consultar la documentación
      // oficial de la versión descargada (>= 3.38.0).
      // El fragmento mostrado es orientativo. Si los parámetros difieren,
      // adaptar manteniendo la semántica: deserializar bytes → abrir DB,
      // serializar DB → exportar bytes.
      const rc = sqlite3.capi.sqlite3_deserialize(
        db, 'main', p, bytesOrNull.byteLength,
        bytesOrNull.byteLength, bytesOrNull.byteLength,
        sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
      );

      if (rc !== 0) throw new AppError(ERRORS.DB_NOT_INITIALIZED);
    } catch (e) {
      sqlite3.wasm.dealloc(p);
      throw e;
    }
  } else {
    db = new sqlite3.oo1.DB(':memory:');
  }
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
}

export async function exportDatabase() {
  const pOut = sqlite3.wasm.allocPtr();
  const nOut = sqlite3.wasm.allocPtr();
  const rc = sqlite3.capi.sqlite3_serialize(db, 'main', pOut, nOut, 0);
  if (rc !== 0) throw new AppError(ERRORS.DB_FLUSH_FAILED);
  const ptr = sqlite3.wasm.peekPtr(pOut);
  const size = sqlite3.wasm.peekPtr(nOut);
  const bytes = new Uint8Array(sqlite3.wasm.memory.buffer, ptr, size);
  const copy = new Uint8Array(bytes); // copia fuera del heap WASM
  sqlite3.capi.sqlite3_free(ptr);
  sqlite3.wasm.dealloc(pOut);
  sqlite3.wasm.dealloc(nOut);
  return copy;
}
```

### 10.2 PBKDF2 con dominios

```js
// crypto/pbkdf2.js
export const PBKDF2_ITERATIONS = 600000;

export function normalizeNFC(value) {
  return value.normalize('NFC');
}

export async function deriveAuthKey(password, salt) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    'raw', enc.encode('AUTH:' + normalizeNFC(password)),
    'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material, 256
  );
  return new Uint8Array(bits);
}

// deriveWrapKey, deriveDataKey, deriveHmacKey: mismo patrón con prefijo
```

### 10.3 AES-GCM encrypt/decrypt

```js
// crypto/aes-gcm.js
export function generateIv() {
  return crypto.getRandomValues(new Uint8Array(12));
}

export async function importAesKey(rawKeyBytes) {
  return crypto.subtle.importKey('raw', rawKeyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptBytes(key, bytes) {
  const iv = generateIv();
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key, bytes
  );
  return { iv, data: new Uint8Array(ciphertext) };
}

export async function decryptBytes(key, iv, data) {
  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv }, key, data
    );
    return new Uint8Array(plaintext);
  } catch (e) {
    throw new AppError(ERRORS.CRYPTO_DECRYPT_FAILED);
  }
}
```

### 10.4 OPFS writeFileAtomic

```js
// db/opfs.js
export async function writeFileAtomic(name, bytes) {
  const root = await navigator.storage.getDirectory();
  const tmpName = name + '.tmp';
  const tmpHandle = await root.getFileHandle(tmpName, { create: true });
  const writable = await tmpHandle.createWritable();
  await writable.write(bytes);
  await writable.close();
  
  // Validación
  const tmpFile = await tmpHandle.getFile();
  if (tmpFile.size !== bytes.byteLength) {
    await root.removeEntry(tmpName);
    throw new AppError(ERRORS.DB_FLUSH_FAILED);
  }
  
  // Renombrado con fallback para navegadores sin soporte `move()`
  await root.removeEntry(name, { ignoreNotFound: true });
  const tmpHandle2 = await root.getFileHandle(tmpName);
  try {
    await tmpHandle2.move(name); // API moderna
  } catch (e) {
    // Fallback: leer bytes, escribir destino, borrar temporal
    const file = await tmpHandle2.getFile();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const destHandle = await root.getFileHandle(name, { create: true });
    const writable = await destHandle.createWritable();
    await writable.write(bytes);
    await writable.close();
    await root.removeEntry(tmpName);
  }
}
```

### 10.5 Web Locks API

```js
// db/browser-impl.js
let releaseLock = null;

async function acquireLock() {
  return new Promise((resolve, reject) => {
    navigator.locks.request(
      'scd_contabilidad_lock',
      { mode: 'exclusive', ifAvailable: true },
      (lock) => {
        if (!lock) {
          reject(new AppError(ERRORS.UI_INSTANCE_ALREADY_ACTIVE));
          return;
        }
        return new Promise((releaseCallback) => {
          releaseLock = releaseCallback;
          resolve();
        });
      }
    );
  });
}

function releaseLockFn() {
  if (releaseLock) releaseLock();
}
```

### 10.6 Worker con ArrayBuffer transfer

```js
// app.js - envío a worker
const keyBuffer = await crypto.subtle.exportKey('raw', session.keys.data);
worker.postMessage(
  { id: uuid(), tipo: 'AES_DECRYPT_BATCH', payload: { key: keyBuffer, items } },
  [keyBuffer] // transferible
);

// worker-cifrado.js - recepción
self.onmessage = async (e) => {
  const { id, tipo, payload } = e.data;
  const key = await crypto.subtle.importKey(
    'raw', payload.key, 'AES-GCM', false, ['decrypt']
  );
  // ... procesar
  self.postMessage({ id, ok: true, data: results });
};
```

### 10.7 Reloj inyectable para auto-lock

```js
// app.js
let nowFn = () => Date.now();
export function injectClock(fn) { nowFn = fn; } // test hook

function startInactivityWatch() {
  let lastActivity = nowFn();
  const handler = () => { lastActivity = nowFn(); };
  ['mousemove', 'keydown', 'click'].forEach(evt =>
    document.addEventListener(evt, handler)
  );
  setInterval(() => {
    if (nowFn() - lastActivity > 15 * 60 * 1000) {
      destroySessionKeys();
      showReloginScreen();
    }
  }, 1000);
}
```