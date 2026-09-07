# 📘 **PLAN DE FASES DE IMPLEMENTACIÓN — v2.0**
*(Alineado con PR‑SCD v1.5 — Sin alucinaciones — Determinista)*

---

## 0. PARÁMETROS PENDIENTES DE DEFINICIÓN

Antes de iniciar la implementación de cualquier fase, deben quedar fijados los siguientes parámetros. Sin ellos, el plan no es ejecutable.

| # | Parámetro | Estado | Fase afectada |
|---|-----------|--------|---------------|
| P-01 | Fórmula canónica definitiva de `hash_fila` para extractos | **PENDIENTE** | Fase 2 |
| P-02 | Fórmula canónica definitiva de `hash_fila` para Norma 43 | **PENDIENTE** | Fase 2 |
| P-03 | Umbral de errores para rollback total en importación CSV | **PENDIENTE** | Fase 2 |
| P-04 | Disparador oficial de materialización de dashboards estándar | **PENDIENTE** | Fase 1 / Fase 4 |
| P-05 | Estrategia para tarjetas de saldo (`card_balance_evolution`, `card_current_balance`) en Fase 4 | **PENDIENTE** | Fase 4 |
| P-06 | Alcance del cambio de `frase_datos` (exponer o no en UI) | **PENDIENTE** | Fase 3 |

**Fórmula propuesta para P-01 y P-02** (a confirmar):

```text
extractos:
hash_fila = HMAC-SHA256(
    clave_hmac_usuario,
    JSON.stringify([id_cuenta, fecha, 'extracto', tipo, importe_cents, rango_importe, concepto_normalizado])
)

norma43:
hash_fila = HMAC-SHA256(
    clave_hmac_usuario,
    JSON.stringify([id_cuenta, fecha, 'norma43', codigo_operacion, importe_cents, rango_importe, concepto_normalizado])
)
```

**Propuesta para P-03:** Rollback total si errores estructurales (cabecera, encoding, delimitador, transacción). Sin rollback total por filas individuales. Sin umbral adicional.

**Propuesta para P-04:** Servicio idempotente `ensureStandardDashboards(id_usuario)` invocado en creación de usuario (bootstrap y CRUD admin). Fase 4 solo renderiza y verifica idempotencia.

**Propuesta para P-05:** Desactivar `card_balance_evolution` y `card_current_balance` en Fase 4. Activarlas en Fase 5 cuando el motor de saldos esté operativo.

**Propuesta para P-06:** No exponer cambio de `frase_datos` en v1.5. Solo cambio de contraseña (recifra `frase_datos` con nueva clave WRAP, no recifra datos).

---

## 1. FASE 1 — Infraestructura + autenticación + bootstrap + UI base

### 1.1 Objetivo

Dejar operativo el núcleo del sistema: arranque seguro, persistencia, cifrado, autenticación, esquema completo de base de datos, esqueleto UI, menú lateral, theming base y módulos transversales.

### 1.2 Funcionalidades a programar

#### 1.2.1 Capa de plataforma y persistencia

- Capa de adaptadores de plataforma: `db/adapters.js`, `db/browser-impl.js`, `db/tauri-impl.js`.
  - La implementación Tauri es opcional en esta fase, pero la interfaz debe estar definida.
  - Ningún módulo fuera de `db/` importa directamente `opfs.js`, `sqlite-wasm.js` ni módulos de lock.
- Detección de capacidades unificada (3.2-cuater) usando `platform.detectCapabilities()`.
  - Verificar: `window.crypto?.subtle`, `navigator.locks?.request`, `navigator.storage?.getDirectory`.
  - Si alguna capacidad falta: emitir `UI-031` y no inicializar.
- Lock de instancia mediante `platform.lock.acquire()`.
  - Navegador: Web Locks API con nombre `scd_contabilidad_lock`.
  - Si lock no adquirible: emitir `UI-030`, no inicializar SQLite ni OPFS.
  - Tauri: comando Rust (interfaz definida, implementación diferida).
- Inicialización de OPFS con flush atómico.
  - Escritura en `contabilidad.db.tmp`.
  - Validación de tamaño.
  - Renombrado atómico a `contabilidad.db`.
  - Al arrancar: eliminar `contabilidad.db.tmp` residual.
  - Fallo de validación: emitir `DB-016`.

#### 1.2.2 Base de datos

- Conexión SQLite WASM con pragmas obligatorios:
  ```sql
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  ```
- Verificación de versión mínima: `sqlite3_libversion() >= 3038000`. Si inferior, emitir `DB-014` y abortar.
- Creación del esquema completo (`init.sql`):
  - Las 18 tablas con FKs compuestas, índices únicos compuestos, constraints y vistas.
  - Seeds: `catalogo_semantico`, `catalogo_tipos_grafico`, `catalogo_tarjetas`, dashboards estándar y tarjetas asociadas.
  - Los seeds resuelven por nombres y condiciones, no por IDs hardcoded.
  - `PRAGMA user_version = 2` tras creación.
- `migrations.sql` para upgrades desde versiones anteriores.
  - Cada migración en transacción.
  - Fallo: rollback y emitir `DB-002`.

#### 1.2.3 Criptografía

- `crypto/aes-gcm.js`: cifrado/descifrado AES-GCM con IV de 12 bytes por campo.
- `crypto/pbkdf2.js`: derivación de claves con PBKDF2-SHA256, 600.000 iteraciones.
  - Dominios: AUTH, WRAP, DATA, HMAC.
  - Contraseña normalizada a UTF-8 NFC antes de derivar.
  - `password_salt`: aleatorio, mínimo 16 bytes.
  - `data_salt`: aleatorio, mínimo 16 bytes.
  - `frase_datos`: aleatoria, mínimo 32 bytes, nunca visible al usuario.
- `crypto/rango-importe.js`: función pura de cálculo de bucket.
  - 18 buckets cerrados (9 POS + 9 NEG).
  - Sin dependencias externas, sin acceso a red ni estado.

#### 1.2.4 Workers

- Contrato de mensajes uniforme:
  ```json
  { "id": "string", "tipo": "string", "payload": {} }
  { "id": "string", "ok": true, "data": {} }
  ```
- `workers/worker-cifrado.js`: cifrado/descifrado en lotes de 1000.
- `workers/worker-hash.js`: HMAC-SHA256 en lotes de 1000.
- Timeout de 30.000 ms por mensaje. Si expira: emitir `DB-012`.
- Fallback: si `Worker` no disponible, emitir `UI-032` y ejecutar en hilo principal con `setTimeout(0)` chunking.
- Workers cargados con `{ type: 'module' }`.
- URLs resueltas vía `platform.resolveWorkerUrl()`.

#### 1.2.5 Autenticación y bootstrap

- Bootstrap si tabla `usuarios` vacía:
  - Crear administrador con perfil `A`, estado `A`.
  - Idioma por defecto: `ES`. Look por defecto: `O`.
  - Generar `password_salt`, `data_salt`, `frase_datos`.
  - Mostrar advertencia de no recuperación.
  - Invocar `ensureStandardDashboards(id_usuario)` para materializar dashboards estándar.
  - No crear banco/cuenta en onboarding (se crea en Fase 2 antes de importar).
- Login:
  - Derivar clave AUTH → verificar `password_hash`.
  - Derivar clave WRAP → descifrar `frase_datos`.
  - Derivar claves DATA y HMAC.
  - Claves en memoria durante sesión. Ninguna persistencia.
  - Bloqueo por intentos fallidos: umbral 5, bloqueo 15 min, error `AU-003`.
  - Desbloqueo automático cuando `fecha_bloqueo < NOW`.
  - Protección del último administrador: emitir `AU-005` si la operación afecta al único admin activo.
- Auto-lock por inactividad (5.2-cuater):
  - Tras 15 minutos sin interacción: destruir claves DATA y HMAC.
  - Mostrar pantalla de re-autenticación.
  - Tras re-autenticación válida: re-derivar claves.
- Logout: destruir claves de memoria.
- Cambio de contraseña (flujo completo):
  - Verificar contraseña actual.
  - Generar nuevo `password_salt`.
  - Recalcular `password_hash` con dominio AUTH.
  - Recifrar `frase_datos` con nueva clave WRAP.
  - No recifrar datos de negocio.

#### 1.2.6 UI base

- `index.html`:
  - CSP completa (3.9).
  - Carga UMD de `vendor/tabulator.min.js` y `vendor/echarts.min.js` antes de `app.js`.
  - Carga de `app.js` como módulo ES.
  - Carga estática de `app.css`, `theme-light.css`, `theme-dark.css`.
- `app.css`: estilos base del layout, media queries base (4.1.3).
- `ui/styles/theme-light.css`: tokens completos del tema claro.
- `ui/styles/theme-dark.css`: tokens completos del tema oscuro (Grafana).
- Aplicación de `data-theme` según `usuarios.look`:
  - `C` → `data-theme="claro"`
  - `O` → `data-theme="oscuro"`
- Menú lateral funcional:
  - Carga de `config/menu.json` completo con todos los nodos de 10.1-ter.
  - `visible: "all"` solo para lo operativo en Fase 1 (login, onboarding).
  - `visible: "none"` para el resto.
  - Colapsable, resize, iconos.
  - Preferencias de menú persistidas (ancho, colapsado) con valores por defecto hasta Fase 3.
- Área principal de paneles.
- Pantalla de carga durante bootstrap (PBKDF2 + WASM tardan).
- `form-login.js`: login y bootstrap.
- Router interno de paneles.

#### 1.2.7 Módulos transversales

- `utils/errors.js`: códigos centralizados (`DB-`, `CR-`, `AU-`, `EXT-`, `UI-`, `I18N-`).
- `utils/i18n.js`: resolución de claves, sustitución de parámetros, fallback a clave literal.
- `utils/format.js`: formateo de importes (céntimos), fechas, periodos.
- `i18n/es.json`, `i18n/cat.json`, `i18n/en.json`: claves mínimas para login, errores, onboarding, loading, menú.
- `config/menu.json`: fuente de verdad del menú.
- `config/preferences-default.json`: valores por defecto de la whitelist.

#### 1.2.8 Vendor

- `vendor/tabulator.min.js`: versión >= 6.2.0.
- `vendor/echarts.min.js`: versión >= 5.5.0.
- `vendor/versions.json`: versiones exactas y hashes SHA-256 reales.
  - Si no contiene valores reales: error de configuración de despliegue, no arrancar.
  - Verificación de hashes al desplegar.
  - Prohibido CDN.

#### 1.2.9 Servicio de materialización de dashboards

- Función idempotente `ensureStandardDashboards(id_usuario)`:
  - Si el usuario no tiene instancia del dashboard estándar: crearla.
  - Copiar filas de `tarjetas_dashboard` de la plantilla.
  - Transacción ACID.
  - Fallo: rollback y emitir `DB-017`.
- Invocada en:
  - Bootstrap (creación del primer admin).
  - Fase 3: creación de usuarios por administrador.
- No invocada en Fase 4 (Fase 4 solo renderiza y verifica).

### 1.3 Pruebas a realizar

#### 1.3.1 Unitarias

- Derivación de claves: AUTH, WRAP, DATA, HMAC.
- Cifrado/descifrado AES-GCM con IV único.
- Cálculo de `rango_importe` contra los 18 valores cerrados del CHECK.
- Normalización NFC de contraseña.
- Adaptadores de plataforma (mock).
- Lock: simular doble pestaña → `UI-030`.
- Flush OPFS atómico: escritura, validación, renombrado, fallo → `DB-016`.
- Limpieza de `contabilidad.db.tmp` residual al arrancar.
- Verificación de versión SQLite WASM → `DB-014` si inferior.
- `utils/format.js`: importes desde céntimos, fechas, periodos.
- `utils/i18n.js`: resolución, fallback, parámetros.
- `utils/errors.js`: todos los códigos definidos.

#### 1.3.2 Integración

- Arranque completo en navegador (sin Tauri).
- Creación de admin vía bootstrap.
- Login exitoso y fallido.
- Bloqueo temporal por 5 intentos fallidos.
- Desbloqueo automático tras expirar `fecha_bloqueo`.
- Protección del último administrador → `AU-005`.
- Auto-lock con timers mock.
- Cambio de contraseña: nueva clave WRAP, `frase_datos` recifrada, datos intactos.
- Materialización de dashboards estándar en bootstrap.
- Idempotencia de `ensureStandardDashboards`.
- Persistencia de preferencias de menú (valores por defecto).
- Cambio de look: `data-theme` actualizado, persistido en `usuarios.look`.
- Tema oscuro funcional desde el primer arranque (look por defecto `O`).
- Menú lateral: colapsar, resize, iconos.
- Pantalla de carga visible durante bootstrap.
- Grep de imports prohibidos: 0 resultados.
- Verificación de ausencia de IndexedDB, LocalStorage, sessionStorage.

#### 1.3.3 Gate de cierre de Fase 1

No se cierra Fase 1 sin:

- [ ] Arranque completo en navegador.
- [ ] Lock exclusivo funcional. Doble pestaña rechazada con `UI-030`.
- [ ] Bootstrap de administrador funcional.
- [ ] Login funcional.
- [ ] Claves derivadas correctamente (AUTH, WRAP, DATA, HMAC).
- [ ] Claves destruidas en logout.
- [ ] Auto-lock funcional.
- [ ] Tema oscuro base funcional (look por defecto `O`).
- [ ] Tema claro funcional.
- [ ] CSP activa y correcta.
- [ ] Vendor versionado con hashes reales.
- [ ] SQLite WASM validado (>= 3.38.0).
- [ ] Esquema completo creado. `PRAGMA user_version = 2`.
- [ ] Migraciones listas.
- [ ] Workers funcionales con timeout y fallback.
- [ ] `utils/errors.js`, `utils/i18n.js`, `utils/format.js` operativos.
- [ ] Ficheros i18n con claves mínimas.
- [ ] Menú lateral funcional.
- [ ] Grep de imports prohibidos: 0 resultados.
- [ ] Sin IndexedDB, LocalStorage, sessionStorage.

---

## 2. FASE 2 — Cuentas bancarias mínimas + carga de extractos

### 2.1 Objetivo

Implementar la gestión mínima de bancos y cuentas bancarias (prerequisito para importación) y la ingestión de ficheros CSV (Sabadell, Santander) con generación de movimientos, deduplicación y estados de procesamiento. Norma 43 queda preparada pero inoperativa.

### 2.2 Funcionalidades a programar

#### 2.2.1 CRUD mínimo de bancos y cuentas bancarias

- `form-banco.js`: crear, editar banco.
  - Campos: `nombre`, `codigo_entidad`, `estado`.
  - Validación de `codigo_entidad`: 4 u 8 dígitos numéricos.
  - Validación de longitud máxima: `nombre` 100 caracteres.
- `form-cuenta.js`: crear, editar cuenta.
  - Campos: `id_banco`, `iban`, `descripcion`, `saldo_inicial_cifrado`, `estado`.
  - Validación IBAN en `utils/iban.js`: normalización a mayúsculas sin espacios, módulo 97. Solo IBAN español obligatorio.
  - Cifrado de `saldo_inicial_cifrado` con clave DATA.
  - Validación de longitud máxima: `descripcion` 200 caracteres, `iban` 34 caracteres.
  - Índice único parcial: un IBAN activo por usuario.
  - FK compuesta: `cuentas_bancarias(id_usuario, id_banco) → bancos(id_usuario, id_banco)`.
- `panel-maestros.js`: sección de bancos y cuentas (sección de activos, grupos, subgrupos, clasificación se completa en Fase 3).
- Si el usuario no tiene ninguna cuenta activa y accede a importación:
  - Mostrar estado vacío con botón "Añadir cuenta".
  - Abrir `form-cuenta.js`.
  - No permitir importación sin cuenta seleccionada.

#### 2.2.2 Importación de extractos CSV

- `db/extractos-loader.js`:
  - Detección de banco por cabecera exacta (9.7):
    - Sabadell: `"Fecha","Concepto","Movimiento","Importe","Saldo"`
    - Santander: `"Fecha operación","Concepto","Importe","Saldo"`
  - Cabecera comparada tras: eliminar BOM, normalizar Unicode, recortar espacios extremos.
  - Cabecera desconocida: rechazar fichero con error determinista.
  - Encoding UTF-8. BOM aceptado y eliminado.
  - Delimitadores autorizados: coma, punto y coma. Detectado en primera línea.
  - Quoting RFC 4180.
  - Formatos de fecha autorizados: `DD/MM/YYYY`, `YYYY-MM-DD`.
  - Validación de fecha calendario real en JS antes de INSERT. Fallo: `EXT-007`.
  - Formatos de importe autorizados (9.7-ter):
    - `1.234,56`, `1234,56`, `1234.56`, `1234`, `-1.234,56`, `-1234,56`
    - Regla decimal: si coma y punto → coma decimal. Si solo coma → coma decimal. Si solo punto y cumple `^\d{1,3}(.\d{3})+$` → miles. Si solo punto y no cumple → decimal. Si no hay separador → entero.
  - Conversión de importes a céntimos enteros.
  - Cálculo de `rango_importe` sobre valor absoluto en céntimos.
  - Normalización de concepto (5.5-bis): NFC, trim, colapso espacios, minúsculas, eliminación de tildes.
  - Cálculo de `hash_fila` con fórmula canónica congelada (P-01).
  - Deduplicación: si `hash_fila` ya existe para el mismo usuario → omitir. Registrar en resumen.
  - Transacción única por fichero importado.
  - Flush único al COMMIT final del fichero.
  - Estados de procesamiento:
    - Fila inválida detectada en parseo: no se inserta. Se registra en resumen.
    - Fila insertable: se inserta con `estado_procesado = 'PENDIENTE'`.
    - Si `movimientos-builder.js` genera movimiento correctamente: `PROCESADO`.
    - Si falla la generación: `ERROR`.
  - Rollback total solo por errores estructurales:
    - Cabecera inválida.
    - Encoding inválido.
    - Delimitador indeterminable.
    - Ninguna fila válida.
    - Fallo de transacción SQLite.
  - No rollback total por filas individuales inválidas.

#### 2.2.3 Generación de movimientos

- `db/movimientos-builder.js`:
  - Generar movimiento desde extracto dentro de la misma transacción.
  - Tipo de movimiento:
    - Sabadell: columna `Movimiento` (`ingreso`, `gasto`, `transferencia`). Si no existe o no coincide: inferir del signo del importe. Positivo → `ingreso`, negativo → `gasto`.
    - Santander: inferir del signo. Positivo → `ingreso`, negativo → `gasto`.
  - Importe en céntimos enteros con signo.
  - `origen = 'extracto'`.
  - `id_extracto` vinculado.
  - `estado = 'ACTIVO'`.
  - Concepto cifrado y `concepto_hash` calculado.
  - `rango_importe` calculado.
  - Punto de extensión para recálculo de saldos (se implementa en Fase 5, pero la interfaz debe existir).

#### 2.2.4 Borrado de extractos

- Al borrar un extracto:
  - Borrar movimientos asociados por `id_extracto`.
  - Eliminar o desvincular snapshots de `saldos_cuenta` que referencien el extracto.
  - Recalcular saldos desde el primer periodo afectado (interfaz preparada, implementación completa en Fase 5).
  - Todo en transacción ACID.

#### 2.2.5 Paneles visuales

- `panel-extractos.js`: visualización de extractos con Tabulator.
  - Descifrado de conceptos e importes en `worker-cifrado.js`.
  - Formateo con `utils/format.js`.
  - Prohibido LIKE sobre campos cifrados.
  - Prohibido ORDER BY sobre `importe_cifrado`.
- `panel-movimientos.js`: visualización de movimientos con Tabulator.
  - Descifrado en worker.
  - Filtros por fecha (BETWEEN), cuenta, tipo.
- `panel-norma43.js`: stub que emite `EXT-006`.
  - Nodo de menú con `"visible": "none"`.
  - Tabla `norma43` creada en `init.sql`.
  - `norma43-loader.js` stub que devuelve `EXT-006`.

#### 2.2.6 UX de importación

- Zona drag & drop para múltiples ficheros.
- Selección múltiple de ficheros.
- Adaptador `platform.dialog.pickCsvFiles()`.
- Barra de progreso (`ui/components/progress.js`):
  - Progreso por filas procesadas.
  - Sin spinner continuo. Avance discreto.
  - Tokens CSS: `--progress-bg`, `--progress-fill`, `--progress-text`.
  - Al completar: 100% durante 2 segundos, luego resumen.
- Resumen de importación (9.8.1):
  - Total filas leídas.
  - Filas válidas insertadas.
  - Filas duplicadas omitidas.
  - Filas erróneas.
  - Tabla de errores: `num_fila`, `motivo`, `dato_original` (limitado a 200 caracteres).
  - Exportación de tabla de errores a CSV.
  - La tabla de errores no se persiste en base de datos.

#### 2.2.7 Menú

- Cambiar `visible` de `panel-extractos` y `panel-movimientos` a `"all"`.
- `panel-norma43` permanece con `"visible": "none"`.
- No añadir ni eliminar nodos del JSON.

### 2.3 Pruebas a realizar

#### 2.3.1 Unitarias

- Parseo de CSV con casos límite:
  - Importes con coma/punto: `1.234,56`, `1234.56`, `1234`, `-1.234,56`.
  - Fechas válidas e inválidas.
  - Fechas calendario real: 29/02/2024 válido, 29/02/2023 inválido → `EXT-007`.
  - Filas duplicadas.
  - Cabeceras válidas e inválidas.
  - BOM presente y ausente.
  - Delimitador coma y punto y coma.
- Cálculo de `hash_fila` con fórmula canónica congelada.
- Deduplicación: mismo hash → omitir.
- Normalización de concepto: NFC, trim, colapso, minúsculas, tildes.
- Cálculo de `rango_importe` para importes de importación.
- Validación IBAN: válidos, inválidos, normalización.
- Conversión de importes a céntimos.

#### 2.3.2 Integración

- Crear banco y cuenta antes de importar.
- Importar fichero Sabadell real de prueba.
- Importar fichero Santander real de prueba.
- Verificar movimientos generados.
- Verificar deduplicación: reimportar mismo fichero no duplica.
- Verificar resumen de importación completo.
- Verificar exportación de tabla de errores.
- Verificar barra de progreso.
- Borrar extracto → movimientos asociados eliminados.
- Verificar paneles visuales con descifrado en worker.
- Verificar que Norma 43 no aparece en menú.
- Verificar que `norma43-loader.js` devuelve `EXT-006`.
- Verificar transacción por fichero y flush único.
- Verificar que no se usa IndexedDB ni LocalStorage.
- Re-ejecutar suite completa de Fase 1.

#### 2.3.3 Gate de cierre de Fase 2

No se cierra Fase 2 sin:

- [ ] Banco/cuenta disponibles antes de importar.
- [ ] Importación Sabadell funcional.
- [ ] Importación Santander funcional.
- [ ] Deduplicación por `hash_fila` funcional.
- [ ] Filas inválidas reportadas.
- [ ] Duplicados omitidos.
- [ ] Resumen de importación completo.
- [ ] Exportación de errores funcional.
- [ ] Barra de progreso funcional.
- [ ] Borrado de extractos funcional.
- [ ] Borrado de movimientos asociados funcional.
- [ ] Paneles visuales con descifrado funcional.
- [ ] Norma 43 inoperativa y controlada.
- [ ] Transacción por fichero y flush único verificados.
- [ ] Grep de imports prohibidos: 0 resultados.
- [ ] Regresión de Fase 1 superada.

---

## 3. FASE 3 — CRUD de tablas auxiliares + preferencias + usuarios admin + búsqueda por tokens

### 3.1 Objetivo

Permitir la gestión completa de datos maestros (bancos, cuentas, activos, grupos, subgrupos, clasificación) y preferencias, así como la administración de usuarios y la búsqueda avanzada por tokens.

### 3.2 Funcionalidades a programar

#### 3.2.1 CRUD completo de maestros

- Completar `panel-maestros.js` con secciones de:
  - Activos: `form-activo.js`.
  - Grupos y subgrupos: `form-grupo.js`.
  - Clasificación: `form-clasificacion.js`.
- Bancos y cuentas ya implementados en Fase 2. Verificar integración completa.

#### 3.2.2 Activos

- `form-activo.js`: crear, editar activo.
  - Campos: `tipo`, `descripcion`, `indicador_alquiler_habitaciones`, `indicador_amortizacion`, `fecha_compra`, `valor_residual`, `anos_amortizacion`, `estado`.
  - `tipo` CHECK: `inmueble`, `vehiculo`, `terreno`, `parking`.
  - `valor_residual` en claro (declarado no sensible).
  - Validación de longitud máxima: `descripcion` 200 caracteres.
  - Validación de fecha `YYYY-MM-DD` con calendario real.

#### 3.2.3 Grupos y subgrupos

- `form-grupo.js`: crear, editar grupo.
  - Campos: `nombre`, `id_semantico`, `estado`.
  - `id_semantico` nullable → grupo libre.
  - Unicidad semántica activa: un grupo activo por `id_semantico` por usuario.
  - Validación de longitud máxima: `nombre` 100 caracteres.
- Subgrupos:
  - Campos: `nombre`, `id_grupo`, `estado`.
  - Heredan `id_semantico` del grupo padre.
  - No permitir subgrupo activo si grupo padre inactivo.
  - Validación de longitud máxima: `nombre` 100 caracteres.
  - FK compuesta: `subgrupos(id_usuario, id_grupo) → grupos(id_usuario, id_grupo)`.

#### 3.2.4 Clasificación

- `form-clasificacion.js`: crear, editar clasificación.
  - Campos: `id_grupo`, `id_subgrupo`, `concepto_cifrado`, `concepto_hash`, `estado`.
  - Cifrado de concepto con clave DATA.
  - Cálculo de `concepto_hash` con clave HMAC.
  - Normalización de concepto (5.5-bis) antes de calcular hash.
  - Índice único parcial: una clasificación activa por `concepto_hash` por usuario.
  - FK compuesta: `clasificacion(id_usuario, id_grupo) → grupos(id_usuario, id_grupo)`.
  - FK compuesta: `clasificacion(id_usuario, id_subgrupo) → subgrupos(id_usuario, id_subgrupo)`.

#### 3.2.5 Búsqueda por tokens

- `catalogo_tokens`: inserción de tokens al crear/editar clasificaciones.
- Algoritmo de inserción (en `worker-clasificacion.js`):
  - Normalizar concepto (5.5-bis).
  - Split por espacios y puntuación.
  - Deduplicar tokens.
  - Para cada token: `HMAC-SHA256(clave_hmac_usuario, token)`.
  - `INSERT OR IGNORE` en `catalogo_tokens`.
- Algoritmo de búsqueda:
  - Normalizar término de búsqueda.
  - Split en tokens.
  - Calcular hashes.
  - SQL: `SELECT id_clasificacion FROM catalogo_tokens WHERE id_usuario = ? AND token_hash IN (...) GROUP BY id_clasificacion HAVING COUNT(DISTINCT token_hash) = <num_tokens>`.
  - Resultado: clasificaciones que contienen TODOS los tokens (AND lógico).

#### 3.2.6 Preferencias

- `panel-preferencias.js`, `form-preferencias.js`.
- Whitelist de claves autorizadas (4.4-bis):
  - `menu_ancho`, `menu_colapsado`, `dashboard_activo`, `filtro_fecha_dashboard`, `importe_filtro_min`, `importe_filtro_max`, `ultima_vista_panel`.
- Clave fuera de whitelist en escritura: emitir `UI-025`.
- Limpieza de preferencias obsoletas al iniciar sesión:
  - Comparar claves existentes contra whitelist vigente.
  - Eliminar claves no autorizadas.
  - Registrar eliminación en log interno.
  - No emitir error al usuario.
- Valores por defecto desde `config/preferences-default.json`.
- Valor real persistido cifrado con clave DATA.

#### 3.2.7 CRUD de usuarios (solo perfil A)

- `panel-usuarios.js`, `form-usuario.js`.
- Operaciones: crear, modificar, bloquear/desbloquear.
- Campos modificables: `frase_cifrada`, `idioma`, `look`.
- Al crear usuario:
  - Generar `password_salt`, `data_salt`, `frase_datos`.
  - Invocar `ensureStandardDashboards(id_usuario)`.
  - Validación de email: normalizado en minúsculas, sin espacios.
  - Validación de longitud máxima: `nombre` 100, `email` 254.
- Al modificar:
  - Cambio de contraseña: nuevo `password_salt`, nuevo `password_hash`, recifrar `frase_datos` con nueva clave WRAP. No recifrar datos.
  - Cambio de `frase_datos`: según decisión P-06. Si no expuesto, no implementar.
- Bloqueo/desbloqueo:
  - Bloqueo: `estado = 'B'`, `fecha_bloqueo`.
  - Desbloqueo administrativo: `intentos_fallidos = 0`, `estado = 'A'`, `fecha_bloqueo = NULL`.
- Protección del último administrador: emitir `AU-005`.
- El administrador no puede ver frases de cifrado. UI enmascara.

#### 3.2.8 Validaciones transversales

- Longitudes máximas (UI-026) en todos los formularios.
- Formatos: `codigo_entidad`, IBAN, fechas.
- FKs compuestas verificadas.
- Aislamiento entre usuarios: un usuario no ve datos de otro.

#### 3.2.9 Menú

- Cambiar `visible` de `panel-maestros`, `panel-preferencias`, `panel-usuarios` a `"all"` o `"admin"` según perfil.
- No añadir ni eliminar nodos del JSON.

### 3.3 Pruebas a realizar

#### 3.3.1 Unitarias

- Validación IBAN: válidos, inválidos, normalización.
- Normalización de conceptos para tokens.
- Generación de hashes de tokens.
- Lógica de búsqueda AND.
- Validación de longitudes máximas.
- Validación de FKs compuestas.
- Limpieza de preferencias obsoletas.
- Cambio de contraseña: nueva clave WRAP, `frase_datos` recifrada.
- Protección del último administrador.

#### 3.3.2 Integración

- CRUD de cada tabla auxiliar.
- Aislamiento entre usuarios.
- Persistencia de preferencias tras recargar.
- Cambio de idioma/look.
- Bloqueo/desbloqueo de usuarios.
- Búsqueda por tokens devuelve resultados correctos.
- Crear usuario por admin → dashboards materializados.
- Cambio de contraseña por admin.
- Verificar que las FKs compuestas impiden insertar registros de otro usuario.
- Verificar que el administrador no puede ver frases de cifrado.
- Re-ejecutar suites de Fase 1 y Fase 2.

#### 3.3.3 Gate de cierre de Fase 3

No se cierra Fase 3 sin:

- [ ] CRUD completo de maestros funcional.
- [ ] IBAN validado y normalizado.
- [ ] Longitudes máximas validadas.
- [ ] Preferencias con whitelist funcional.
- [ ] Limpieza de preferencias obsoletas funcional.
- [ ] CRUD de usuarios funcional.
- [ ] Protección del último administrador funcional.
- [ ] Cambio de contraseña funcional.
- [ ] Búsqueda por tokens funcional.
- [ ] FKs compuestas verificadas.
- [ ] Materialización de dashboards para nuevos usuarios.
- [ ] Grep de imports prohibidos: 0 resultados.
- [ ] Regresión de Fases 1 y 2 superada.

---

## 4. FASE 4 — Dashboards con instancias por usuario y validación de tarjetas

### 4.1 Objetivo

Implementar la personalización de dashboards y tarjetas, incluyendo la materialización de instancias, el copy-on-write, la validación de configuraciones, la caché central de movimientos y el renderizado de tarjetas. Las tarjetas de saldo (`card_balance_evolution`, `card_current_balance`) se desactivan hasta Fase 5.

### 4.2 Funcionalidades a programar

#### 4.2.1 Materialización de dashboards estándar

- Verificar idempotencia de `ensureStandardDashboards(id_usuario)`.
- Si un usuario accede a dashboards y no tiene instancia (caso edge): crearla.
- La materialización principal ocurre en creación de usuario (Fase 1 bootstrap, Fase 3 admin).

#### 4.2.2 Dashboards customizados

- Crear, copiar, borrar, renombrar, bloquear (8.2).
- El usuario solo puede añadir a su dashboard tarjetas donde `origen='estandar'` OR `id_usuario = usuario_actual`.
- Copiar una estándar = nueva fila en `catalogo_tarjetas` con `origen='usuario'`, `id_usuario=usuario_actual`, `id_tarjeta_origen=id_original`, `configuracion` clonada y editable.

#### 4.2.3 Personalización de dashboards estándar

- Layout (posición, tamaño, color de fondo): se almacena en `tarjetas_dashboard`.
  - `tamano`: `1x1`, `2x1`, `1x2`, `2x2`.
  - `color_fondo`: hexadecimal 6 dígitos.
  - `orden`: entero único por dashboard.
- Definición (título, tipo de gráfico, configuración):
  - Tarjetas estándar no se editan directamente.
  - Copy-on-write: crear copia `origen='usuario'`, actualizar `tarjetas_dashboard.id_tarjeta`.

#### 4.2.4 Copy-on-write de tarjetas estándar (8.3-bis)

- Al editar título/tipo/config de una tarjeta estándar:
  - Crear nueva fila en `catalogo_tarjetas` con `origen='usuario'`, `id_tarjeta_origen=id_original`.
  - Actualizar `tarjetas_dashboard.id_tarjeta` al nuevo ID.
  - La tarjeta estándar original no se modifica.

#### 4.2.5 Propagación de ediciones sobre tarjetas estándar (8.3.1)

- Ediciones de `configuracion` en `catalogo_tarjetas` con `origen='estandar'` se propagan a todas las instancias que la referencian.
- Copias con `id_tarjeta_origen` quedan desacopladas.

#### 4.2.6 Renderizado de tarjetas modo tabla (8.3.4)

- `card_movement_search`:
  - Campos de búsqueda: `fecha_desde`, `fecha_hasta`, `importe_min`, `importe_max`, `tipo`, `id_grupo`, `id_subgrupo`, `id_clasificacion`, `origen`, `estado`, `concepto_exacto`.
  - Columnas: `fecha`, `tipo`, `concepto`, `importe`, `id_grupo`, `id_subgrupo`, `id_clasificacion`, `origen`, `estado`.
  - Búsqueda por rango de importe en dos fases (4.6): bucket + descifrado + filtro exacto.
  - Búsqueda por concepto exacto vía hash.
  - Prohibido LIKE.
- `card_top10_movements`:
  - Columnas fijas.
  - Filtro implícito: `periodo: "mes_actual"`, `orden: "importe_desc"`, `limite: 10`.
  - Ordenación por importe descifrado en JS. No SQL sobre cifrado.
- `card_current_balance`: **desactivada hasta Fase 5**.

#### 4.2.7 Renderizado de tarjetas gráficas

- `card_evolution_income`: línea, agregación mensual, serie ingreso.
- `card_evolution_expenses`: línea, agregación mensual, serie gasto.
- `card_income_expenses`: barra, agregación mensual, series ingreso y gasto.
- `card_expenses_by_category`: circular, agregación por `tipo_semantico`.
  - Resolución semántica: `catalogo_semantico` → `grupos` del usuario.
  - Si no hay grupo vinculado: estado vacío M-01.
  - Si hay ambigüedad: estado vacío M-02 con `UI-024`.
- `card_balance_evolution`: **desactivada hasta Fase 5**.
- Transferencias: no se contabilizan en series estándar de ingreso/gasto.

#### 4.2.8 Caché central de movimientos (5.7.1)

- Al activar un dashboard: construir caché central.
- Consulta base: movimientos ACTIVO del `id_usuario` de la sesión, acotados por filtros globales.
- Descifrado en `worker-cifrado.js` en lotes de 1000.
- Almacenamiento en `session.dashboardCache` con metadatos.
- Cada tarjeta recibe referencia a la caché.
- Aplica filtros específicos y agregaciones en JS puro.
- Límite máximo: 10.000 registros.
- Si supera límite: agregación previa, paginación, recorte con aviso i18n.
- Invalidación por: cambio de filtros globales, cambio de dashboard activo, logout, modificación de datos.
- No invalidación por: configuración individual de tarjeta, reordenación, cambio de look.

#### 4.2.9 Filtros globales de dashboard

- `filtro_fecha_dashboard`: persistido en preferencias.
- `importe_filtro_min`, `importe_filtro_max`: persistidos en preferencias.
- `dashboard_activo`: persistido en preferencias.
- Invalidación de caché al cambiar filtros.

#### 4.2.10 Validación de configuraciones

- Toda configuración incluye `"v": 1`.
- Validación de escritura en `form-tarjeta.js`.
- Validación de render en `dashboard-standard.js` y `dashboard-custom.js`.
- Tarjetas estándar: prohibido `id_grupo` e `id_subgrupo` literales.
- Tarjetas de usuario: permitido solo si el grupo/subgrupo pertenece al usuario actual.
- Códigos de error: `UI-020`, `UI-021`, `UI-022`, `UI-023`, `UI-024`.
- Versionado: si `v` mayor que soportado → `UI-023`. Si menor → migración JS autorizada (`v0 → v1`).

#### 4.2.11 Estados vacíos con motivo tipificado (8.3.6)

- Evaluar en orden: `M-04 → M-01 → M-02 → M-05 → M-06 → M-03`.
- Renderizar solo el primer motivo coincidente.
- Transmitir `emptyState` a `card.js`.
- Prohibido: tarjeta en blanco, "Sin datos" genérico, mezclar motivos.

#### 4.2.12 Editor de tarjetas de usuario (8.2.1)

- `form-tarjeta.js`: crear, editar, eliminar tarjetas con `origen='usuario'`.
- Campos: `modo_visualizacion`, `tipo_grafico`, `nombre`, `configuracion`.
- Antes de eliminar: verificar que no esté referenciada en `tarjetas_dashboard`.

#### 4.2.13 Theming de componentes

- `ui/components/chart.js`: leer computed styles en init, registrar tema ECharts.
- `ui/components/table.js`: overrides CSS para Tabulator.
- En cambio de tema: gráficos activos se actualizan o re-renderizan.
- Cifras tabulares: `font-variant-numeric: tabular-nums` en celdas de importe.

#### 4.2.14 Menú

- Cambiar `visible` de `dashboard-standard` y `dashboard-custom` a `"all"`.
- No añadir ni eliminar nodos del JSON.

### 4.3 Pruebas a realizar

#### 4.3.1 Unitarias

- Validación de esquemas de configuración.
- Versionado de configuraciones.
- Resolución semántica.
- Lógica de copy-on-write.
- Lógica de caché central.
- Invalidación de caché.
- Búsqueda por rango de importe en dos fases.
- Búsqueda por concepto exacto vía hash.
- Ordenación por importe descifrado.
- Estados vacíos: todos los motivos.

#### 4.3.2 Integración

- Crear dashboard customizado.
- Añadir tarjetas estándar y de usuario.
- Personalizar tamaño/orden/color.
- Editar tarjeta estándar → comprobar propagación.
- Copiar tarjeta estándar → verificar independencia.
- Bloquear dashboard → comprobar solo lectura.
- Tarjetas semánticas muestran estado vacío si no hay grupo vinculado.
- Filtros globales funcionan.
- Caché central con 10.000 movimientos.
- Cambio de tema afecta a gráficos y tablas.
- `card_balance_evolution` y `card_current_balance` desactivadas.
- Re-ejecutar suites de Fases 1, 2 y 3.

#### 4.3.3 Gate de cierre de Fase 4

No se cierra Fase 4 sin:

- [ ] Dashboards estándar materializados idempotentemente.
- [ ] Dashboards customizados funcionales.
- [ ] Copy-on-write de tarjetas funcional.
- [ ] Validación de configuraciones funcional.
- [ ] Versionado de configuraciones funcional.
- [ ] Caché central funcional.
- [ ] Invalidación de caché funcional.
- [ ] Estados vacíos completos funcionales.
- [ ] Tarjetas de tabla funcionales.
- [ ] Tarjetas gráficas funcionales.
- [ ] Filtros globales funcionales.
- [ ] Tarjetas de saldo desactivadas.
- [ ] Theming de ECharts y Tabulator funcional.
- [ ] Grep de imports prohibidos: 0 resultados.
- [ ] Regresión de Fases 1, 2 y 3 superada.

---

## 5. FASE 5 — Saldos, conciliación incremental, backup y cierre UI/UX

### 5.1 Objetivo

Implementar el cálculo y mantenimiento de saldos por cuenta, activar las tarjetas de saldo, implementar backup/restauración, y pulir la interfaz con responsive design, estilos DARK completos y rendimiento.

### 5.2 Funcionalidades a programar

#### 5.2.1 Motor de saldos

- Cálculo y persistencia de `saldos_cuenta` (snapshots mensuales) según 8.3.5 y 2.16.
- Periodo cerrado: `YYYY-MM`.
- Snapshot: saldo después del último movimiento ACTIVO del mes para la cuenta.
- Orden determinista del último movimiento: `fecha`, luego `id_movimiento`.
- Meses sin movimientos no generan snapshot.
- Saldo cifrado: `saldo_cifrado` + `iv_saldo`.
- Semilla: `cuentas_bancarias.saldo_inicial_cifrado`. Si NULL, semilla es 0.

#### 5.2.2 Recálculo incremental

- Cuando cambia un movimiento:
  - Determinar primer periodo afectado.
  - Buscar snapshot anterior válido o saldo inicial.
  - Recalcular desde el periodo afectado hasta el último periodo existente de la cuenta.
  - Solo movimientos `ACTIVO`. Solo extractos `PROCESADO`.
- Modificación de `saldo_inicial_cifrado`:
  - Determinar primer periodo con snapshot existente.
  - Recalcular todos los snapshots desde ese periodo hasta el último.
- Todo dentro de la misma transacción SQLite.

#### 5.2.3 Conciliación con extractos

- Si el último movimiento del mes está vinculado a extracto con `saldo_original_cifrado`:
  - Snapshot usa ese saldo. `modo = 'extracto'`.
- Si no:
  - Snapshot toma último extracto conciliado anterior o `saldo_inicial_cifrado`.
  - Suma movimientos posteriores. `modo = 'calculado'`.
- Si existe extracto de referencia y el cálculo acumulado no coincide:
  - `estado_conciliacion = 'DESCUADRE'`.
  - No bloquea escritura.
  - Debe mostrarse advertencia en UI.
  - No se usa como saldo fiable sin advertencia.

#### 5.2.4 Recálculo multi-cuenta

- Cuando una importación o edición afecta múltiples cuentas:
  - Recalcular por cada `id_cuenta` secuencialmente.
  - Dentro de la misma transacción SQLite.
  - Si cualquier cuenta falla: rollback total, emitir `DB-015`.

#### 5.2.5 Activación de tarjetas de saldo

- Activar `card_balance_evolution`:
  - Obtener snapshots existentes.
  - Para meses sin snapshot: arrastrar último saldo conocido.
  - Saldo arrastrado solo de presentación. No insertar snapshots calculados.
  - Si no hay snapshot ni saldo inicial: estado vacío.
- Activar `card_current_balance`:
  - Tabla simple sobre `cuentas_bancarias` + `saldo_inicial + acumulado(movimientos)`.
  - O usar `saldos_cuenta` directamente.

#### 5.2.6 Backup y restauración

- Export:
  - Solo perfil A.
  - Descarga `contabilidad.db`.
  - No descifra datos.
  - No modifica la base de datos.
- Import:
  - Solo perfil A.
  - Confirmación explícita.
  - Lock activo.
  - Cerrar conexión SQLite antes de reemplazar.
  - Reemplazar fichero.
  - Validar `PRAGMA user_version`.
  - Si incompatible: emitir `DB-003`.
  - Reabrir conexión.
- Advertencias obligatorias:
  - La pérdida de contraseña impide recuperar datos cifrados.
  - El backup contiene todas las filas de todos los usuarios lógicos del mismo origen.
  - Los metadatos en claro quedan expuestos.

#### 5.2.7 Responsive design (4.1.3)

- Breakpoints:
  - Mobile (< 768px): menú drawer, grid 1 columna, modales fullscreen.
  - Tablet (769-1200px): menú colapsable fijo, grid 2 columnas, modales centrados.
  - Desktop (> 1200px): menú fijo con resize, grid 3-4 columnas, modales centrados.
- Media queries en CSS, no detección JS.

#### 5.2.8 Pulido DARK completo

- Verificar que todos los componentes usan tokens.
- Remapeo completo de ECharts al tema oscuro.
- Remapeo completo de Tabulator al tema oscuro.
- Prueba visual exhaustiva.

#### 5.2.9 Pulido de mensajes y estados

- Mensajes de error i18n completos.
- Tooltips i18n.
- Estados vacíos definitivos.
- Barra de progreso en recálculo de saldos.

#### 5.2.10 Rendimiento

- Pruebas con volúmenes realistas (decenas de miles de movimientos).
- Verificación de flush OPFS eficiente.
- Verificación de que el flush no degrada perceptiblemente > 100 MB.

#### 5.2.11 Verificación de migración a Tauri

- Grep de verificación (3.10.0):
  ```bash
  grep -rnE "opfs.js|sqlite-wasm.js|navigator.locks|TAURI|invoke(|plugin:" ui/ workers/ crypto/ utils/ config/
  ```
  → 0 resultados.

### 5.3 Pruebas a realizar

#### 5.3.1 Unitarias

- Cálculo de snapshots.
- Lógica de conciliación.
- Arrastre de saldos.
- Export/import de bytes.
- Recálculo incremental.
- Recálculo multi-cuenta con rollback.
- Detección de descuadre.

#### 5.3.2 Integración

- Cargar extractos → verificar snapshots generados.
- Modificar un movimiento → comprobar recálculo.
- Descuadre detectado → advertencia visible.
- Modificar saldo inicial → recálculo completo.
- Backup export funcional.
- Backup import funcional.
- Backup import con versión incompatible → `DB-003`.
- Cambio de tema oscuro/claro afecta a gráficos y tablas.
- Responsive en viewports móvil/tablet/desktop.
- Rendimiento con volúmenes realistas.
- `card_balance_evolution` y `card_current_balance` funcionales.
- Regresión completa de Fases 1-4.

#### 5.3.3 Gate de cierre de Fase 5

No se cierra Fase 5 sin:

- [ ] Snapshots de saldo funcionales.
- [ ] Recálculo incremental funcional.
- [ ] Conciliación funcional.
- [ ] Descuadres visibles en UI.
- [ ] Recálculo multi-cuenta con rollback funcional.
- [ ] Tarjetas de saldo completas funcionales.
- [ ] Backup export/import funcional.
- [ ] Backup restringido a perfil A.
- [ ] Responsive funcional.
- [ ] Tema oscuro completo funcional.
- [ ] Rendimiento aceptable con volúmenes realistas.
- [ ] Grep de imports prohibidos: 0 resultados.
- [ ] Regresión completa de Fases 1-4 superada.

---

## 6. REGLAS TRANSVERSALES APLICABLES A TODAS LAS FASES

### 6.1 Regresión

- Cada fase debe re-ejecutar las suites de todas las fases anteriores.
- Fase 2: re-ejecutar Fase 1.
- Fase 3: re-ejecutar Fases 1 y 2.
- Fase 4: re-ejecutar Fases 1, 2 y 3.
- Fase 5: re-ejecutar Fases 1, 2, 3 y 4.

### 6.2 Grep de arquitectura

En cada fase, antes de darla por cerrada:

```bash
grep -rnE "opfs.js|sqlite-wasm.js|navigator.locks|TAURI|invoke(|plugin:" ui/ workers/ crypto/ utils/ config/
```

Resultado esperado: 0 líneas. Cualquier match es defecto de arquitectura.

### 6.3 Almacenamientos prohibidos

En cada fase, verificar ausencia de:

- IndexedDB
- LocalStorage
- sessionStorage

### 6.4 i18n

Todos los textos visibles deben resolverse desde `utils/i18n.js`. Prohibido texto hardcoded.

### 6.5 Errores

Todos los errores de runtime deben usar códigos centralizados de `utils/errors.js`. Prohibido texto libre como única identificación.

### 6.6 Importes

Todo importe interno se representa como céntimos enteros con signo. Prohibido float para acumulación contable.

### 6.7 Fechas

- Fecha operativa: `YYYY-MM-DD`, fecha local bancaria.
- Timestamps de sistema: `YYYY-MM-DDTHH:MM:SSZ`, UTC.
- Validación de fecha calendario real en JS antes de INSERT.

### 6.8 Transacciones

Toda operación crítica debe ejecutarse dentro de transacción ACID. Flush único al COMMIT final.

### 6.9 Workers

- Lote máximo: 1000 registros.
- Timeout: 30.000 ms.
- Fallback: `UI-032` con chunking en hilo principal.
- Workers nunca acceden directamente a SQLite.

### 6.10 Cifrado

- Claves DATA y HMAC en memoria durante sesión.
- Ninguna clave persistida.
- IV único por campo cifrado.
- Prohibido LIKE sobre campos cifrados.
- Prohibido rangos SQL directos sobre BLOB cifrado.
- Prohibido derivar clave por cada fila o búsqueda.

---

## 7. DEPENDENCIAS ENTRE FASES

```
Fase 1 (Infra + Auth + UI base)
    │
    ├──► Fase 2 (Cuentas mínimas + Extractos)
    │       │
    │       ├──► Fase 3 (Maestros + Preferencias + Usuarios)
    │       │       │
    │       │       └──► Fase 4 (Dashboards)
    │       │               │
    │       │               └──► Fase 5 (Saldos + Backup + Cierre)
    │       │
    │       └──► Fase 4 requiere movimientos de Fase 2
    │
    └──► Fase 4 requiere grupos/clasificación de Fase 3
```

---

## 8. RESUMEN EJECUTIVO DE FASES

| Fase | Entregable principal | Gate crítico |
|------|---------------------|--------------|
| 1 | Infraestructura, auth, bootstrap, UI base, theming, vendor | Lock, bootstrap, login, tema oscuro, CSP, vendor |
| 2 | Cuentas mínimas + importación CSV + paneles visuales | Importación Sabadell/Santander, deduplicación, borrado |
| 3 | Maestros completos + preferencias + usuarios + tokens | CRUD completo, aislamiento, búsqueda AND |
| 4 | Dashboards + tarjetas + caché + validación | Copy-on-write, caché, estados vacíos, filtros |
| 5 | Saldos + conciliación + backup + responsive + cierre | Snapshots, descuadre, backup, regresión completa |