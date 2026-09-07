
# 📘 **PR-SCD.md — ALCANCE Y OBJETIVO. Versión 1.5**  
*(Terminología para IA — Sin alucinaciones)*


# 1. ALCANCE DEL PROYECTO

## 1.1 Definición y precondiciones de despliegue

Este módulo define el **alcance operativo** del Sistema Cognitivo Determinista (SCD) para el proyecto:

> Dashboard de análisis de extractos bancarios españoles para finanzas personales, ejecutado en entorno local, sin backend, sin servidor, sin dependencias externas.

**Precondición de despliegue:** el aislamiento entre usuarios NO es una garantía de la aplicación, es una garantía del entorno de ejecución. Cada usuario debe ejecutar la app en un perfil de navegador distinto (o, en la variante Tauri, una instancia de sistema-operativo/usuario distinta). Dentro de un mismo perfil/origen, cualquier «usuario» de la tabla `usuarios` es solo una partición lógica protegida por cifrado, no un límite de proceso.

El alcance es **cerrado**, **determinista**, **no expansivo**, y **no admite creatividad** ni **suposiciones**. El SCD debe operar **únicamente** dentro de los límites definidos en este bloque y en los bloques posteriores del PR.

## 1.2 Stack tecnológico autorizado

- HTML
- JavaScript modular (ES Modules nativos)
- SQLite WASM (≥ 3.38.0)
- OPFS (Origin Private File System)
- WebCrypto AES-GCM
- Tabulator ≥ 6.2.0 (UMD)
- ECharts ≥ 5.5.0 (UMD)

## 1.3 Canonicalización del esquema v1.2

El esquema normativo de v1.2 es el resultante de integrar todos los bloques base y todos los bloques bis.

**Reglas:**

- `init.sql` debe contener `CREATE TABLE` completos con todos los campos y constraints finales de v1.2.
- `migrations.sql` solo contiene transformaciones desde versiones anteriores.
- No se permite que `init.sql` dependa de `ALTER TABLE` posteriores para alcanzar el esquema v1.2.

**Versionado:**

| Escenario | Acción |
|-----------|--------|
| Instalación nueva | `PRAGMA user_version = 2;` |
| Upgrade desde v1.1 | `migrations.sql` aplica cambios y establece `PRAGMA user_version = 2` |

## 1.4 Formato temporal determinista

### Fecha operativa

Campos: `movimientos.fecha`, `extractos.fecha`, `norma43.fecha`, `saldos_cuenta.fecha_ultimo_movimiento`.

- **Formato:** `YYYY-MM-DD`
- **Semántica:** fecha local bancaria. No se convierte a UTC.
- **Validación:** el `CHECK` SQL valida únicamente formato. La validación de fecha calendario real (días por mes, bisiestos) se realiza en JavaScript antes del `INSERT`. Fallo → `EXT-007`.

### Timestamps de sistema

Campos: `usuarios.fecha_creacion`, `usuarios.fecha_ultimo_acceso`, `usuarios.fecha_bloqueo`, `updated_at`.

- **Formato:** `YYYY-MM-DDTHH:MM:SSZ`
- **Semántica:** UTC.

## 1.5 Condición operativa de Norma 43

La tabla `norma43`, la opción de menú y el loader (`norma43-loader.js`) deben estar contemplados y estructurados, aunque **inoperativos** hasta la aprobación del anexo técnico (ver 9.9). El nodo de menú se incluye con `"visible": "none"`.

---

# 2. OBJETIVO DEL SISTEMA

> Construir una página HTML local que ejecuta múltiples módulos JavaScript, organizados por responsabilidad funcional, con un menú lateral colapsable y un área de paneles estructurados, proporcionando análisis financiero sobre extractos bancarios españoles, con soporte multilenguaje y multiusuario.

El SCD debe procesar este objetivo de forma **determinista**, **sin interpretación**, **sin ampliación**, **sin reducción**, y **sin creatividad**.

## 2.1 Estructura general del sistema

El sistema debe:

- Ejecutarse **en local**, dentro del navegador del usuario.
- Utilizar **múltiples ficheros `.js`**, cada uno con responsabilidad aislada.
- Renderizar un **menú lateral colapsable**, con capacidad de:
  - cambiar ancho
  - colapsar
  - mostrar iconos
  - guardar preferencias del usuario
- Renderizar un **frame principal** con **paneles** y **tarjetas** del dashboard.
- Mantener una arquitectura **modular**, **determinista**, **no especulativa**.

## 2.2 Idiomas soportados (multilenguaje)

El sistema debe ser **totalmente idiomático**, soportando:

- **ES** — Castellano
- **CAT** — Catalán
- **EN** — Inglés

El SCD debe procesar esta sección sin añadir idiomas no definidos.

**Elementos que deben ser multilenguaje:**

- opciones de menú
- labels
- etiquetas de campos
- títulos de tarjetas
- mensajes de error
- mensajes de advertencia
- ejes X/Y de gráficos
- botones
- textos de interfaz
- textos de dashboards
- textos de preferencias

El SCD debe garantizar que **todos los textos** se obtienen desde un **módulo de internacionalización** definido en el alcance, sin inventar claves ni estructuras no especificadas.

## 2.3 Restricciones cognitivas

El SCD debe:

- **No inventar** funcionalidades no mencionadas.
- **No añadir** idiomas adicionales.
- **No modificar** la estructura del menú.
- **No alterar** la arquitectura HTML/JS.
- **No proponer** mejoras.
- **No interpretar** la intención del usuario.
- **No generar** contenido fuera del alcance.
- **No extrapolar** comportamientos del sistema.

Si el usuario solicita algo fuera de este alcance:

```
ERROR-SCD: Información fuera del alcance. Solicitar especificación adicional.
```

---

# 2-bis. VISIÓN GENERAL DEL SISTEMA (Referencia visual)

> **AVISO NORMATIVO:** Esta sección contiene diagramas de referencia para orientación del SCD. No sustituye la especificación normativa de las secciones 1-11. En caso de discrepancia, prevalece el texto normativo. **Prohibido editar estos diagramas sin actualizar primero la fuente normativa correspondiente.**
>
> **Mantenimiento:** Los diagramas de flujos y el grafo de dependencias funcionales (2-bis.3 y 2-bis.9) deben revisarse periódicamente para garantizar su alineación estricta con el código real implementado.

## 2-bis.1 Núcleo tecnológico

```
┌─────────────────────────────────────────────────────────┐
│              SISTEMA COGNITIVO DETERMINISTA             │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ SQLite WASM │  │    OPFS     │  │ WebCrypto AES-GCM│ │
│  │ (Motor BD)  │  │(Persistencia)│  │  (Cifrado)      │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │       Capa de Abstracción (Ports & Adapters)     │   │
│  │   db/adapters.js → browser-impl / tauri-impl     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Tabulator│ │ ECharts  │ │ Workers  │               │
│  │ (Tablas) │ │(Gráficos)│ │(Paralelo)│               │
│  └──────────┘ └──────────┘ └──────────┘               │
└─────────────────────────────────────────────────────────┘
```

## 2-bis.2 Modelo de datos por dominios (18 tablas)

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOMINIO: USUARIOS                        │
├─────────────────────────────────────────────────────────────────┤
│  usuarios ──────► preferencias                                  │
│     │                  │                                        │
│     │                  └── clave/valor cifrado                  │
│     │                                                           │
│     └──► frase_cifrada, password_hash, data_salt                │
│         idioma (ES/CAT/EN), look (C/O), perfil (A/U)            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DOMINIO: MAESTROS                            │
├─────────────────────────────────────────────────────────────────┤
│  bancos ──────► cuentas_bancarias ──────► activos               │
│     │                  │                                         │
│     │                  └── iban, saldo_inicial_cifrado           │
│     │                                                           │
│     └── codigo_entidad (4-8 dígitos)                            │
│                                                                 │
│  catalogo_semantico (12 claves: ALIMENTACION, VIVIENDA...)     │
│  catalogo_tipos_grafico (linea, barra, circular, area...)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  DOMINIO: CLASIFICACIÓN                         │
├─────────────────────────────────────────────────────────────────┤
│  grupos ──────► subgrupos                                       │
│     │              │                                            │
│     │              └── id_grupo (FK compuesta)                  │
│     │                                                           │
│     └── id_semantico (nullable → grupo libre)                   │
│                                                                 │
│  clasificacion ──────► catalogo_tokens                          │
│     │                    │                                      │
│     │                    └── token_hash (HMAC-SHA256)           │
│     │                                                           │
│     └── concepto_cifrado, concepto_hash                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DOMINIO: TRANSACCIONAL                       │
├─────────────────────────────────────────────────────────────────┤
│  extractos ──────► movimientos ◄────── norma43                  │
│     │                  │                    │                   │
│     │                  │                    └── (inoperativa     │
│     │                  │                         hasta anexo)    │
│     │                  │                                        │
│     │                  └── id_extracto / id_norma43             │
│     │                      tipo: ingreso|gasto|transferencia    │
│     │                      importe_cifrado, rango_importe       │
│     │                                                           │
│     └── hash_fila (HMAC-SHA256)                                 │
│         estado_procesado: PENDIENTE→PROCESADO|ERROR             │
│                                                                 │
│  saldos_cuenta (tabla derivada, NO CRUD)                        │
│     └── periodo YYYY-MM, saldo_cifrado                          │
│         modo: extracto|calculado                                │
│         estado_conciliacion: OK|DESCUADRE                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   DOMINIO: DASHBOARDS                           │
├─────────────────────────────────────────────────────────────────┤
│  dashboards_usuario ──────► tarjetas_dashboard                  │
│     │                           │                               │
│     │                           └── id_tarjeta, tamano,         │
│     │                               color_fondo, orden          │
│     │                                                           │
│     └── tipo: estandar|usuario                                  │
│         id_usuario NULL = plantilla global                      │
│         id_dashboard_origen (copy-on-write)                     │
│                                                                 │
│  catalogo_tarjetas                                              │
│     └── origen: estandar|usuario                                │
│         modo_visualizacion: grafico|tabla                       │
│         configuracion: JSON con "v":1                           │
│         tipo_grafico → catalogo_tipos_grafico                   │
└─────────────────────────────────────────────────────────────────┘
```

## 2-bis.3 Flujos críticos

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE BOOTSTRAP                        │
├─────────────────────────────────────────────────────────────┤
│ 1. platform.detectCapabilities()                            │
│ 2. platform.lock.acquire()                                  │
│ 3. platform.storage.init()                                  │
│ 4. platform.db.open('contabilidad.db')                      │
│ 5. PRAGMA user_version → migraciones si necesario           │
│ 6. Si usuarios vacío → Onboarding primer usuario (perfil A) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                    │
├─────────────────────────────────────────────────────────────┤
│ 1. Usuario introduce contraseña                             │
│ 2. Derivar AUTH → verificar password_hash                   │
│ 3. Derivar WRAP → descifrar frase_datos                     │
│ 4. Derivar DATA (AES-GCM) + HMAC (hashes búsqueda)         │
│ 5. Claves en memoria durante sesión                         │
│ 6. Auto-lock tras 15 min inactividad                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 FLUJO DE IMPORTACIÓN CSV                    │
├─────────────────────────────────────────────────────────────┤
│ 1. pickCsvFiles() → detectar banco por cabecera             │
│ 2. Parsear CSV (UTF-8, BOM, delimitador , o ;)              │
│ 3. Validar formato fecha (DD/MM/YYYY | YYYY-MM-DD)          │
│ 4. Convertir importe a céntimos enteros                     │
│ 5. Calcular hash_fila = HMAC-SHA256(...)                    │
│ 6. BEGIN TRANSACTION                                        │
│    ├── INSERT extractos (estado_procesado='PENDIENTE')      │
│    ├── movimientos-builder.js genera movimiento             │
│    ├── UPDATE extractos.estado_procesado='PROCESADO'        │
│    └── Recalcular saldos_cuenta afectados                   │
│ 7. COMMIT + flush OPFS único                                │
│ 8. Mostrar resumen importación                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              FLUJO DE RENDERIZADO DASHBOARD                  │
├─────────────────────────────────────────────────────────────┤
│ 1. Activar dashboard → construir caché central movimientos  │
│ 2. Consulta SQL: movimientos ACTIVO + filtros globales      │
│ 3. Descifrar en worker-cifrado.js (lotes 1000)              │
│ 4. Guardar en session.dashboardCache                        │
│ 5. Cada tarjeta aplica filtros específicos + agregación     │
│ 6. ECharts/Tabulator renderiza con datos descifrados        │
│ 7. Invalidación: cambio filtros, datos, dashboard, logout   │
└─────────────────────────────────────────────────────────────┘
```

## 2-bis.4 Modelo de credenciales y cifrado

```
┌─────────────────────────────────────────────────────────────┐
│                   MODELO DE CREDENCIALES                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Contraseña usuario (única entrada)                        │
│       │                                                     │
│       ├──► AUTH: password_hash (verificación)               │
│       │      PBKDF2-SHA256, 600k iter, salt password_salt   │
│       │                                                     │
│       ├──► WRAP: cifrar frase_datos (interna, aleatoria)    │
│       │      PBKDF2-SHA256, 600k iter, salt password_salt   │
│       │                                                     │
│       └──► frase_datos (descifrada con WRAP)                │
│              │                                              │
│              ├──► DATA: clave AES-GCM para datos            │
│              │      PBKDF2-SHA256, 600k iter, salt data_salt│
│              │                                              │
│              └──► HMAC: clave HMAC-SHA256 para hashes       │
│                     PBKDF2-SHA256, 600k iter, salt data_salt│
│                                                             │
│  CAMPOS CIFRADOS:                                           │
│  - importe, concepto, descripción                           │
│  - saldo inicial, snapshots saldo                           │
│  - frase_cifrada, valor_cifrado (preferencias)              │
│                                                             │
│  CAMPOS EN CLARO:                                           │
│  - fecha, banco_id, cuenta_id, id_clasificacion             │
│  - tipo_movimiento, concepto_hash, rango_importe            │
│  - valor_residual (declarado no sensible)                   │
│                                                             │
│  BÚSQUEDAS AUTORIZADAS:                                     │
│  ✔ Por fecha (BETWEEN)                                      │
│  ✔ Por igualdad (concepto_hash = HMAC)                      │
│  ✔ Por rango importe (bucket + descifrado + filtro JS)      │
│  ✔ Por tokens hasheados (AND lógico)                        │
│  ❌ LIKE sobre cifrados                                     │
│  ❌ Rangos SQL directos sobre BLOB cifrado                  │
└─────────────────────────────────────────────────────────────┘
```

## 2-bis.5 Buckets de rango de importe

```
┌─────────────────────────────────────────────────────────────┐
│  POS_0-10    POS_10-50   POS_50-100  POS_100-250            │
│  POS_250-500 POS_500-1000 POS_1000-2500 POS_2500-5000       │
│  POS_5000+                                                  │
│                                                             │
│  NEG_0-10    NEG_10-50   NEG_50-100  NEG_100-250            │
│  NEG_250-500 NEG_500-1000 NEG_1000-2500 NEG_2500-5000       │
│  NEG_5000+                                                  │
│                                                             │
│  Cálculo: crypto/rango-importe.js                           │
│  Uso: WHERE rango_importe IN (...) → descifrar → filtrar JS │
└─────────────────────────────────────────────────────────────┘
```

## 2-bis.6 Roles y permisos

```
┌─────────────────────────────────────────────────────────────┐
│  PERFIL A (Administrador)                                   │
│  ├── CRUD usuarios                                          │
│  ├── Backup export/import                                   │
│  ├── Desbloqueo usuarios                                    │
│  └── NO puede ver frases de cifrado                         │
│                                                             │
│  PERFIL U (Usuario)                                         │
│  ├── CRUD: preferencias, bancos, cuentas, activos,          │
│  │         grupos, subgrupos, clasificacion                  │
│  ├── CRUD visual: extractos, norma43, movimientos           │
│  ├── Carga de extractos                                     │
│  └── Dashboards estándar + customizados                     │
│                                                             │
│  PROTECCIÓN ÚLTIMO ADMIN:                                   │
│  Si solo queda 1 admin activo → no se puede:                │
│  - Cambiar perfil A→U                                       │
│  - Cambiar estado A→B                                       │
│  - Borrado lógico                                           │
│  Error: AU-005                                              │
└─────────────────────────────────────────────────────────────┘
```

## 2-bis.7 Dominios de error

```
┌─────────────────────────────────────────────────────────────┐
│  DB-001 → DB-016  : Base de datos / SQLite / OPFS           │
│  CR-001 → CR-004  : Cifrado / Claves                        │
│  AU-001 → AU-005  : Autenticación / Usuarios                │
│  EXT-001 → EXT-007: Extractos / CSV                         │
│  UI-020 → UI-032  : Interfaz / Configuración                │
│  I18N-            : Internacionalización                    │
└─────────────────────────────────────────────────────────────┘
```

## 2-bis.8 Reglas de oro

```
┌─────────────────────────────────────────────────────────────┐
│  PROHIBICIONES                                              │
│  ❌ NO inventar funcionalidades                             │
│  ❌ NO añadir idiomas adicionales                           │
│  ❌ NO modificar estructura de menú                         │
│  ❌ NO alterar arquitectura HTML/JS                         │
│  ❌ NO proponer mejoras                                     │
│  ❌ NO interpretar intención del usuario                     │
│  ❌ NO generar contenido fuera del alcance                  │
│  ❌ NO extrapolar comportamientos                           │
│  ❌ NO usar float para acumulación contable                 │
│  ❌ NO LIKE sobre campos cifrados                           │
│  ❌ NO rangos SQL directos sobre BLOB cifrado               │
│  ❌ NO bundler (webpack, vite, rollup)                      │
│  ❌ NO CDN para vendor                                      │
│  ❌ NO IndexedDB ni LocalStorage                            │
│                                                             │
│  OBLIGACIONES                                               │
│  ✔ SIEMPRE usar códigos de error centralizados              │
│  ✔ SIEMPRE resolver textos desde i18n                       │
│  ✔ SIEMPRE usar import/export ES nativos                    │
│  ✔ SIEMPRE transacciones ACID para operaciones críticas     │
│  ✔ SIEMPRE hash_fila para deduplicación                     │
│  ✔ SIEMPRE céntimos enteros para importes                   │
└─────────────────────────────────────────────────────────────┘
```

## 2-bis.9 Grafo de dependencias funcionales

```
index.html
    │
    ▼
app.js (orquestador)
    │
    ├──► db/adapters.js ──────► browser-impl.js ──► opfs.js
    │         │                                   └──► sqlite-wasm.js
    │         └────────────────► tauri-impl.js
    │
    ├──► crypto/aes-gcm.js
    ├──► crypto/pbkdf2.js
    ├──► crypto/rango-importe.js
    │
    ├──► utils/errors.js
    ├──► utils/i18n.js
    ├──► utils/format.js
    ├──► utils/iban.js
    │
    ├──► ui/components/ (table, chart, panel, card, progress)
    ├──► ui/panels/ (extractos, movimientos, usuarios, etc.)
    ├──► ui/dashboards/ (standard, custom)
    ├──► ui/forms/ (login, usuario, cuenta, tarjeta, etc.)
    │
    ├──► workers/ (clasificacion, hash, cifrado, normalizacion)
    │
    └──► db/extractos-loader.js
         db/norma43-loader.js
         db/movimientos-builder.js
```

## 2-bis.10 Resumen ejecutivo

| Aspecto | Detalle |
|---------|---------|
| **Tipo** | Dashboard local de análisis financiero personal |
| **Stack** | HTML + JS ES Modules + SQLite WASM + OPFS + WebCrypto |
| **Tablas** | 18 tablas SQLite |
| **Idiomas** | ES, CAT, EN |
| **Roles** | A (Admin), U (Usuario) |
| **Cifrado** | AES-GCM con PBKDF2 (600k iteraciones) |
| **Importes** | Céntimos enteros con signo |
| **Fechas** | YYYY-MM-DD (local bancaria) |
| **Timestamps** | ISO-8601 UTC (YYYY-MM-DDTHH:MM:SSZ) |
| **Vendor** | Tabulator ≥6.2.0, ECharts ≥5.5.0 (UMD, sin CDN) |
| **Workers** | 4 workers (clasificación, hash, cifrado, normalización) |
| **Lock** | Web Locks API / Rust lock (Tauri) |
| **Flush** | Atómico: tmp → validar → renombrar |
| **Migración** | Tauri v2 con adaptadores (sin reescribir lógica) |

---

# # **3. ARQUITECTURA TÉCNICA (BOUNDARY-CORE)**

Este bloque define la **arquitectura técnica autorizada** para el Sistema Cognitivo Determinista (SCD).  
El SCD debe operar **exclusivamente** dentro de estos componentes, sin añadir tecnologías no especificadas, sin sustituir módulos, sin ampliar alcance y sin generar interpretaciones.

---

# ## **3.1 Módulo SQLite WASM (Motor de Datos Determinista)**

El sistema utiliza **SQLite WASM**, que es la compilación del motor SQLite a WebAssembly.  
El SCD debe reconocer este módulo como **motor de base de datos real**, con las siguientes capacidades autorizadas:

- soporte para **hasta 18 tablas** definidas en el alcance  
- soporte para **JOINs**  
- soporte para **índices**  
- soporte para **integridad referencial**  
- soporte para **triggers**  
- soporte para **vistas**  
- soporte para **transacciones ACID**  
- soporte para **consultas complejas**  
- soporte para volúmenes realistas de uso personal (decenas de miles de registros por usuario); agregados (sumas, medias) se calculan en JS tras descifrado del subconjunto filtrado por `rango_importe` y fecha, no mediante SQL nativo sobre campos cifrados

El SCD debe procesar SQLite WASM como **equivalente funcional** a SQLite nativo, sin inventar limitaciones ni capacidades adicionales.


**Versión mínima autorizada de SQLite WASM: 3.38.0**

Razón: soporte para función json_valid() utilizada en CHECK de catalogo_tarjetas.configuracion.
- El SCD debe verificar sqlite3_libversion() >= 3038000 al inicializar.
- Si la versión es inferior, emitir DB-014 y abortar.


# ## **3.1-bis Inicialización determinista de conexión

Toda conexión SQLite debe ejecutar al abrir:

PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

La versión de esquema se lee mediante:

PRAGMA user_version;

Las migraciones se aplican en orden ascendente.
Cada migración se ejecuta dentro de una transacción.
Si una migración falla, se hace rollback y se emite DB-002.

No se aplican migraciones hacia atrás.

---

# ## **3.2 Módulo OPFS (Sistema de Almacenamiento Persistente)**

El sistema utiliza OPFS — Origin Private File System como almacenamiento persistente.
OPFS aísla por origen de navegador (protocolo+dominio+puerto+perfil), no por usuario lógico. Dos usuarios en el mismo perfil de navegador comparten el mismo árbol OPFS y el mismo fichero `contabilidad.db`; la separación entre ellos depende exclusivamente del cifrado por clave derivada de contraseña (5.2), no de OPFS.

El SCD debe tratar OPFS como **único medio autorizado** para almacenar el fichero de base de datos:

- almacenamiento del fichero `contabilidad.db`  
- persistencia real  
- soporte para tamaños grandes (GB)  
- acceso rápido  
- aislamiento por origen  
- sin uso de IndexedDB  
- sin uso de LocalStorage  

El SCD debe evitar cualquier referencia a otros sistemas de almacenamiento no definidos.

# ## **3.2-bis Condiciones de ejecución

OPFS solo se usa en contexto seguro:
http://localhost
https://
Tauri
file:// no se considera entorno soportado.
Una sola instancia activa por origen:
El sistema solicita un lock de ejecución al iniciar.
Si ya existe una instancia activa, la segunda pestaña muestra error UI-030.
No se permite escritura concurrente desde múltiples pestañas.
El lock no sustituye al aislamiento por perfil de navegador.

## 3.2-ter Implementación del lock de ejecución

El lock se implementa exclusivamente mediante la Web Locks API del navegador, sin dependencias externas.

Reglas deterministas:
- Al iniciar la aplicación, se solicita un lock con nombre fijo derivado del origen: scd_contabilidad_lock.
- Se utiliza navigator.locks.request('scd_contabilidad_lock', { mode: 'exclusive' }, callback).
- El callback se mantiene activo durante toda la sesión.
- Si el lock no puede adquirirse porque ya está en uso, la aplicación muestra inmediatamente el error UI-030 y no continúa con la inicialización de SQLite ni de OPFS.
- El lock se libera automáticamente al cerrar la pestaña o recargar la página.
- No se utiliza IndexedDB, LocalStorage ni ninguna otra API de almacenamiento para gestionar el lock.
- La Web Locks API es compatible con los contextos seguros autorizados.

## 3.2-cuater Detección de capacidades del entorno

Antes de inicializar SQLite u OPFS, app.js invoca platform.detectCapabilities()
que verifica SIEMPRE (en ambos entornos):
  - window.crypto?.subtle → WebCrypto (necesario para AES-GCM en WebView Tauri).
  - navigator.locks?.request → Web Locks (navegador) / adaptador Rust (Tauri).
Capacidades específicas por entorno:
  Navegador:
    - navigator.storage?.getDirectory → OPFS.
  Tauri:
    - Invoca platform.checkPlugins() → verifica comandos Rust disponibles.

Si alguna capacidad falta:
  Se muestra error UI-031 con detalle de capacidades ausentes.
  No se inicializa la aplicación.

Nota: IndexedDB NO se verifica; su uso está prohibido en 3.2.

## 3.2-quinquies Política de persistencia OPFS

Dos modos de flush autorizados:

Modo interactivo (edición CRUD de usuario):
- Flush síncrono tras COMMIT exitoso.
- No flush tras ROLLBACK.

Modo bulk (extractos-loader.js, norma43-loader.js):
- Una única transacción SQLite por fichero importado.
- Flush único al COMMIT final del fichero.
- Justificación: hash_fila hace la importación idempotente;
  un crash a mitad de fichero pierde el import completo,
  que es reimportable sin duplicados.

Mecanismo técnico de flush:
- opfs.js obtiene bytes de la DB mediante sqlite3_serialize()
  o export binario equivalente.
- No flush debounced.
- Si flush falla, emitir DB-016.
- Tamaño realista soportado: hasta 500 MB.
- Nota de rendimiento: coste de flush = O(tamaño DB);
  documentar degradación perceptible > 100 MB.

## 3.2-sexies Atomicidad del flush

El flush escribe en 'contabilidad.db.tmp', valida bytes escritos
y renombra (move) sobre 'contabilidad.db'.

Reglas:
- Escritura en temporal: 'contabilidad.db.tmp'.
- Validación: tamaño bytes escritos == tamaño esperado.
- Renombrado atómico (move) sobre 'contabilidad.db'.
- Al arrancar: si existe 'contabilidad.db.tmp' residual,
  se elimina antes de abrir conexión.
- Fallo de validación → DB-016.

---

# ## **3.3 Módulo WebCrypto AES‑GCM (Cifrado Determinista)**

El sistema utiliza **WebCrypto AES‑GCM** como mecanismo de cifrado autorizado.  
El SCD debe aplicar este módulo únicamente para:

- cifrado de toda la base de datos (si se solicita)  
- cifrado de tablas sensibles  
- cifrado de campos sensibles  

AES‑GCM es el único algoritmo autorizado para:

- extractos bancarios  
- usuarios autorizados  
- preferencias  
- criterios de selección  

El SCD debe evitar cualquier referencia a algoritmos no definidos (RSA, ECC, ChaCha20, etc.).

---

# ## **3.4 Migración futura a Tauri (Compatibilidad Determinista)**

El SCD debe garantizar que la arquitectura es **migrable a Tauri** sin alteraciones estructurales.  
La migración debe cumplir:

- **SQLite WASM → SQLite nativo**  
- **OPFS → fichero local en disco**  
- **JS → permanece igual**  
- **SQL → permanece igual**  
- **Tablas → permanecen iguales**  
- **Lógica → permanece igual**

El único cambio permitido es el **driver de acceso a SQLite**.  
El SCD debe evitar cualquier modificación no autorizada durante la migración.

---

# ## **3.5 Estructura de proyecto autorizada**

El SCD debe reconocer la siguiente estructura como **única estructura válida**.  
El SCD tiene prohibido añadir, eliminar, renombrar o modificar cualquier fichero o subdirectorio no incluido en esta estructura (sección 3.5).


```t
/
├── index.html                         → Punto de entrada determinista. Carga módulos JS y estructura inicial.
├── app.js                             → Orquestador cognitivo. Inicializa módulos, carga configuración y activa la UI.
├── app.css                            → Estilos base del layout y variables CSS para theming claro/oscuro.
├── README.md                          → Instrucciones de despliegue y precondiciones de seguridad (6.0).
│
├── db/                                 → Subsistema de persistencia determinista (SQLite WASM + OPFS + ingestión).
│   ├── sqlite3.wasm                    → Motor SQLite WASM autorizado.
│   ├── init.sql                        → Script determinista de creación de tablas, índices y constraints.
│   ├── migrations.sql                  → Script de migraciones autorizadas.
│   ├── fixtures/                       → Datos de test/demo permitidos.
│   │   └── demo-data.sql
│   │
│   ├── adapters.js                     → Factory de adaptadores + detección de entorno (3.10.0).
│   ├── browser-impl.js                 → Implementaciones navegador (usa opfs.js/sqlite-wasm.js).
│   ├── tauri-impl.js                   → Implementaciones Tauri v2 (rusqlite vía IPC).
│   ├── opfs.js                         → Acceso OPFS (uso interno de browser-impl.js).
│   ├── sqlite-wasm.js                  → Acceso SQLite WASM (uso interno de browser-impl.js).
│   │
│   ├── extractos-loader.js             → Ingestión determinista de extractos CSV.
│   ├── norma43-loader.js               → Ingestión determinista de Norma 43.
│   ├── movimientos-builder.js          → Unificación extractos + norma43 → movimientos.
│
├── crypto/                             → Subdirectorio autorizado para módulos de cifrado.
│   ├── aes-gcm.js                      → Implementación determinista del cifrado AES‑GCM.
│   ├── pbkdf2.js                       → Derivación de claves mediante PBKDF2.
│   ├── rango-importe.js                → Cálculo determinista de bucket de rango_importe (ver 5.8).
│
├── vendor/                             → Librerías externas autorizadas (UMD, sin build step).
│   ├── tabulator.min.js                → Librería tabular autorizada (Tabulator).
│   ├── echarts.min.js                  → Librería gráfica autorizada (ECharts).
│   └── versions.json                   → Control de versiones y hashes SHA-256 de librerías vendor.
│
├── config/                             → Configuración determinista del sistema.
│   ├── menu.json                       → Fuente de verdad del menú lateral en tiempo de ejecución (10.1).
│   └── preferences-default.json        → Valores iniciales; el estado real vive en la tabla `preferencias`.
│
├── i18n/                               → Subdirectorio autorizado para internacionalización.
│   ├── es.json                         → Textos en castellano.
│   ├── cat.json                        → Textos en catalán.
│   └── en.json                         → Textos en inglés.
│
├── ui/                                 → Subdirectorio autorizado para componentes de interfaz.
│   ├── styles/                         → Hojas de estado para theming determinista.
│   │   ├── theme-light.css             → Variables y reglas del tema claro.
│   │   └── theme-dark.css              → Variables y reglas del tema oscuro (estilo Grafana).
│   │
│   ├── components/                     → Componentes UI reutilizables.
│   │   ├── table.js                    → Componente Tabulator determinista.
│   │   ├── chart.js                    → Componente ECharts determinista.
│   │   ├── panel.js                    → Componente de panel.
│   │   ├── card.js                     → Componente de tarjeta.
│   │   └── progress.js                → Barra de progreso determinista para importaciones y recálculos.
│   │
│   ├── panels/                         → Paneles funcionales del sistema.
│   │   ├── panel-extractos.js          → Panel de extractos.
│   │   ├── panel-norma43.js            → Panel de Norma 43.
│   │   ├── panel-movimientos.js        → Panel de movimientos.
│   │   ├── panel-usuarios.js           → Panel de usuarios (solo perfil A).
│   │   ├── panel-preferencias.js       → Panel de preferencias de usuario.
│   │   └── panel-maestros.js           → Gestión de bancos, cuentas, activos, grupos, subgrupos, clasificación.
│   │
│   ├── dashboards/                     → Dashboards estándar y customizados.
│   │   ├── dashboard-standard.js       → Dashboards estándar.
│   │   └── dashboard-custom.js         → Dashboards customizados.
│   │
│   └── forms/                          → Formularios de mantenimiento.
│       ├── form-usuario.js             → Formulario de usuario.
│       ├── form-preferencias.js        → Formulario de preferencias.
│       ├── form-cuenta.js              → Formulario de cuentas bancarias.
│       ├── form-tarjeta.js             → Formulario de creación/edición de tarjetas de usuario.
│       ├── form-login.js               → Login y bootstrap inicial.
│       ├── form-banco.js               → Formulario de bancos.
│       ├── form-activo.js              → Formulario de activos.
│       ├── form-grupo.js               → Formulario de grupos y subgrupos.
│       └── form-clasificacion.js       → Formulario de clasificación.
│
├── workers/                            → Subdirectorio autorizado para procesamiento paralelo.
│   ├── worker-clasificacion.js         → Worker de clasificación determinista.
│   ├── worker-hash.js                  → Worker de hash `HMAC-SHA256`.
│   ├── worker-cifrado.js               → Worker de cifrado AES‑GCM.
│   └── worker-normalizacion.js         → Worker de normalización de datos.
│
├── utils/                              → Utilidades deterministas sin dependencias externas.
│   ├── errors.js                       → Códigos de error centralizados.
│   ├── iban.js                         → Validación IBAN (ES) sin librerías externas.
│   ├── i18n.js                         → Resolución de claves i18n, sustitución de parámetros, fallback.
│   └── format.js                       → Formateo de importes (céntimos), fechas y periodos.
│
└── assets/                             → Recursos estáticos autorizados.
    └── icons/                          → Iconos SVG para el menú lateral y UI.
```

El SCD tiene prohibido:
- proponer estructuras alternativas a la definida en este bloque
- eliminar o renombrar carpetas ya definidas
- modificar rutas ya definidas
- añadir carpetas o ficheros que no estén ya enumerados en la sección 3.5 vigente

La estructura de la sección 3.5 es la única versión autorizada; su ampliación solo ocurre mediante una revisión explícita de este PR-SCD.md, nunca por inferencia del SCD en tiempo de generación de código.


# ## **3.5 bis Control de versiones vendor

Se autoriza añadir:

vendor/versions.json

Contenido mínimo:

{
  "tabulator": {
    "file": "tabulator.min.js",
    "version": "<version_exacta>",
    "sha256": "<hash>"
  },
  "echarts": {
    "file": "echarts.min.js",
    "version": "<version_exacta>",
    "sha256": "<hash>"
  }
}

Reglas:

Toda actualización de vendor requiere revisión del PR-SCD.
El hash SHA-256 permite verificar integridad local.
No se permite carga desde CDN.

# ## **3.5-ter Módulos funcionales mínimos autorizados**

Se autoriza añadir los siguientes ficheros para hacer operativo el alcance:

utils/i18n.js
utils/format.js
ui/forms/form-login.js
ui/panels/panel-preferencias.js
ui/panels/panel-maestros.js
ui/forms/form-banco.js
ui/forms/form-activo.js
ui/forms/form-grupo.js
ui/forms/form-clasificacion.js

Responsabilidad:

utils/i18n.js:
Resolución de claves i18n.
Sustitución de parámetros.
Fallback a clave visible en caso de ausencia.

utils/format.js:
Formateo de importes desde céntimos.
Formateo de fechas.
Formateo de periodos.

ui/forms/form-login.js:
Login.
Bootstrap si no existen usuarios.

ui/panels/panel-preferencias.js:
Preferencias de usuario autorizadas.

ui/panels/panel-maestros.js:
Gestión de bancos, cuentas, activos, grupos, subgrupos y clasificación.

Los formularios de cuentas, bancos, activos, grupos y clasificación deben reutilizar componentes UI autorizados y no introducir librerías nuevas.

# ## **3.5-quater Versiones vendor obligatorias**
Las versiones mínimas autorizadas son:

Tabulator: >= 6.2.0
ECharts: >= 5.5.0

Antes de iniciar implementación, se debe generar vendor/versions.json 
con versiones exactas y hashes SHA-256 reales mediante el siguiente procedimiento:

1. Descargar la versión UMD minificada oficial de cada librería.
2. Calcular SHA-256: sha256sum tabulator.min.js
3. Registrar en vendor/versions.json:

{
  "tabulator": {
    "file": "tabulator.min.js",
    "version": "6.2.x",
    "sha256": "<hash_real>"
  },
  "echarts": {
    "file": "echarts.min.js",
    "version": "5.5.x",
    "sha256": "<hash_real>"
  }
}

4. Verificar que los hashes coinciden al desplegar.

El SCD no puede seleccionar versiones por inferencia.
Los placeholders "<hash_real>" y "6.2.x"/"5.5.x" deben sustituirse 
por valores reales antes de generar código.
Si vendor/versions.json no contiene valores reales, el sistema emite 
error de configuración de despliegue y no arranca.

## 3.5-quinties Estrategia de carga de módulos

index.html carga app.js como módulo ES:
  <script type="module" src="app.js"></script>

Todos los módulos JS del proyecto usan export/import ES nativos.
Carga de vendor (Tabulator, ECharts):
  <script src="vendor/tabulator.min.js"></script>
  <script src="vendor/echarts.min.js"></script>
  (UMD clásico, previo a app.js, expone globals).

Workers se cargan con { type: 'module' }:
  new Worker(url, { type: 'module' })

Prohibido bundler (webpack, vite, rollup, esbuild).

---

# ## **3.6 Resumen determinista del módulo**

El SCD debe procesar los siguientes axiomas como **verdades operativas inmutables**:

- **OPFS no es una base de datos**  
- **SQLite WASM sí es una base de datos**  
- **SQLite WASM puede usarse desde el inicio**  
- **El sistema soporta 18 tablas** (ver listado completo en la Definición SQL del Modelo de Datos)
- **El sistema soporta cifrado**  
- **El sistema es migrable a Tauri sin reescritura**

---

# ## **3.7 Resumen determinista del modelo de datos**

El SCD debe mantener los siguientes principios:

- cifrado por usuario  
- hash para búsquedas por igualdad  
- campos normalizados  
- tabla unificada de movimientos  
- separación extractos / norma43  
- integridad contable  
- migración perfecta a Tauri  

# ## **3.8 Contrato determinista de workers**

Todo worker usa el mismo formato de mensaje.

Request:
{
  id: string,
  tipo: string,
  payload: object
}

Response:
{
  id: string,
  ok: boolean,
  data?: object,
  error?: string
}

Reglas:

El worker nunca accede directamente a SQLite.
El worker recibe datos ya leídos por la capa db.
El worker no persiste datos descifrados.
El tamaño máximo de lote por mensaje es 1000 registros.
Si una operación supera el lote, el orquestador divide el trabajo.
Los errores usan códigos de utils/errors.js.


**Timeout de operaciones:**
  - Cada mensaje al worker-cifrado.js o a sqlite-wasm.js lleva un timestamp de inicio.
  - Si la respuesta no llega en 30.000 ms, el orquestador emite DB-012 y aborta la operación.
  - La caché del dashboard se invalida.

# ## **3.9 Content Security Policy**

index.html debe incluir una CSP orientada a local-only.

Política mínima:

default-src 'self';
script-src 'self';
style-src 'self';
style-src-attr 'unsafe-inline';
img-src 'self' data:;
worker-src 'self';
connect-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'none';
frame-ancestors 'none';

**Justificación**: excepción estrecha (solo atributos de estilo, no bloques `<style>`). ECharts no puede desactivar estilos inline en tooltips sin parchear la librería. Alternativa no viable: reescribir el renderizado de ECharts.

Reglas:

No se permiten scripts inline.
No se permiten estilos inline si pueden evitarse.
Los colores dinámicos de tarjeta deben aplicarse mediante CSSOM o custom properties.
No se permite carga desde CDN.

# ## 3.10 Anexo de migración a Tauri

La migración a Tauri requiere adaptadores específicos para reemplazar APIs del navegador no disponibles o subóptimas en entornos nativos.

### 3.10.0 Capa de Abstracción de Plataforma (Ports & Adapters)

**Regla determinista:**
- Ningún módulo (ui/, workers/, crypto/, loaders/) puede importar directamente db/opfs.js, db/sqlite-wasm.js, db/tauri-fs.js, db/sqlite-tauri.js ni módulos de lock.
- El único punto de resolución es db/adapters.js, invocado por app.js durante bootstrap antes de inicializar la UI.
- Todos los módulos reciben dependencias por inyección, nunca por import directo.

**Estructura de ficheros resultante:**
  db/adapters.js         → Factory de adaptadores por entorno.
  db/browser-impl.js     → Implementaciones para navegador.
  db/tauri-impl.js       → Implementaciones para Tauri v2.



```txt
┌─────────────────────────────────────────────────────────────────┐
│              CAPA DE ABSTRACCIÓN UNIFICADA                      │
├─────────────────────────────────────────────────────────────────┤
│  app.js → detecta entorno (window.__TAURI__ ? 'tauri' : 'web')  │
│         → carga db/adapters.js (único punto de entrada)         │
│         → la plataforma expone:                                 │
│           • initStorage()      → OPFS o Tauri FS                │
│           • initDatabase()     → SQLite WASM o tauri-plugin-sql │
│           • acquireLock()      → Web Locks o Rust lock          │
│           • pickCsvFiles()     → <input> o dialog.open()        │
│           • readFile()         → FileReader o fs.readFile()     │
│           • exportDatabase()   → Blob URL o dialog.save()       │
├─────────────────────────────────────────────────────────────────┤
│  db/adapters.js                                                 │
│  ├── browser-impl.js    (OPFS + SQLite WASM + Web Locks)        │
│  └── tauri-impl.js      (tauri-plugin-fs + tauri-plugin-sql)    │
└─────────────────────────────────────────────────────────────────┘
```

```
┌─────────────────────────────────────────┐
│  Lógica de negocio (idéntica)           │
│  - panel-extractos.js                   │
│  - dashboard-standard.js                │
│  - movimientos-builder.js               │
│  - form-*.js                            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Interfaces comunes (contratos)         │
│  - StorageAdapter                       │
│  - DatabaseAdapter                      │
│  - LockAdapter                          │
│  - FilePickerAdapter                    │
└─────────────────────────────────────────┘
           │                    │
           ▼                    ▼
┌──────────────────┐  ┌──────────────────┐
│  Navegador       │  │  Tauri           │
│  opfs.js         │  │  tauri-fs.js     │
│  sqlite-wasm.js  │  │  sqlite-tauri.js │
│  Web Locks API   │  │  Rust lock file  │
│  <input file>    │  │  dialog.open()   │
└──────────────────┘  └──────────────────┘
```

Regla determinista:
Ningún módulo (ui/, workers/, crypto/, loaders/) puede importar
directamente db/opfs.js, db/sqlite-wasm.js ni módulos de lock/tauri.
El único punto de resolución es db/adapters.js, invocado por app.js
durante bootstrap antes de inicializar la UI.
Todos los módulos reciben dependencias por inyección, nunca por import directo.

Verificación mecánica obligatoria (grep en CI):
  grep -rnE "opfs\.js|sqlite-wasm\.js|navigator\.locks|__TAURI__|invoke\(|plugin:" \
    ui/ workers/ crypto/ utils/ config/
  → debe devolver 0 resultados. Cualquier match es defecto de arquitectura.

Interfaces obligatorias (contrato):

StorageAdapter:
  init(): Promise<void>
  readFile(name): Promise<Uint8Array>
  writeFile(name, data): Promise<void>
  deleteFile(name): Promise<void>
  exists(name): Promise<boolean>

DatabaseAdapter:
  open(name): Promise<void>
  exec(sql, params?): Promise<any>
  prepare(sql): Promise<Statement>
  close(): Promise<void>
  transaction<T>(fn): Promise<T>
  exportBytes(): Promise<Uint8Array>

LockAdapter:
  acquire(): Promise<() => void>   // devuelve release function
  //释放 se invoca en logout/beforeunload

FilePickerAdapter:
  pickCsvFiles(): Promise<PickedFile[]>
  pickDbFile(): Promise<PickedFile | null>
  saveDbFile(data: Uint8Array, filename: string): Promise<void>

LoggerAdapter:
  log(level, code, detail): void

DTO neutro (no DOM, no Tauri):
  interface PickedFile { name: string; bytes: Uint8Array; }

Estructura de ficheros resultante:
  db/adapters.js         → Factory + detección de entorno.
  db/browser-impl.js     → Implementaciones navegador (usa opfs.js/sqlite-wasm.js internamente).
  db/tauri-impl.js       → Implementaciones Tauri v2.
  db/opfs.js             → Uso exclusivo desde browser-impl.js (no público).
  db/sqlite-wasm.js      → Uso exclusivo desde browser-impl.js (no público).

Resolución de entorno:
  const isTauri = !!(window.__TAURI_INTERNALS__ || window.__TAURI__);
  Carga dinámica mediante import(): los adaptadores del otro entorno
  nunca se cargan ni parsean.

## 3.10.1 Adaptador de persistencia (Tauri)

Interfaz StorageAdapter implementada en db/tauri-impl.js:
- Windows/Linux: appDataDir() de Tauri v2 API.
- Android: appDataDir() + verificación MANAGE_EXTERNAL_STORAGE (11+)
  o Storage Access Framework (10-).

## 3.10.2 Adaptador de SQLite (Tauri)

Decisión determinista ÚNICA: comandos Rust con rusqlite.
Prohibido: tauri-plugin-sql.
Justificación: tauri-plugin-sql (sqlx) serializa BLOBs por IPC JSON;
los campos cifrados del sistema (importes, IVs, conceptos) como
arrays JSON/base64 multiplican el coste por byte y rompen el
rendimiento con lotes de 1000 registros en entornos de recursos
limitados.

Implementación obligatoria:
- Comando Rust `execute_sql` que recibe SQL + params (incluyendo
  Uint8Array como Vec<u8> nativo, no JSON).
- Comando Rust `select_sql` que devuelve rows con BLOBs como
  Uint8Array directo al JS vía IPC binario.
- Pragmas obligatorios (idénticos a WASM):
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

### 3.10.3 Adaptador de lock de ejecución

El módulo de lock usa un mecanismo diferente según el entorno:

**Entorno navegador:**
```javascript
// Web Locks API
await navigator.locks.request('contabilidad-lock', async () => {
  // Aplicación activa
});
```

**Entorno Tauri:**
```rust
// Comando Rust
#[tauri::command]
fn acquire_lock(app: tauri::AppHandle) -> Result<bool, String> {
    let lock_path = app.path_resolver()
        .app_data_dir()
        .ok_or("No data dir")?
        .join(".lock");
    
    // Intentar crear fichero lock con flock() en Unix o CreateFile con FILE_FLAG_DELETE_ON_CLOSE en Windows
    match try_create_lock_file(&lock_path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false), // Lock ya existe
    }
}
```

**Detección en `app.js`:**
```javascript
Entorno navegador (en db/browser-impl.js):
  let releaseWebLock;
  async function acquireLock() {
    return new Promise((resolve, reject) => {
      navigator.locks.request('scd_contabilidad_lock', { mode: 'exclusive' },
        () => new Promise(release => {
          releaseWebLock = release;
          resolve();
        })
      ).catch(() => reject(new Error('UI-030')));
    });
  }
  // En logout/beforeunload: if (releaseWebLock) releaseWebLock();

Entorno Tauri (en db/tauri-impl.js):
  #[tauri::command]
  fn acquire_lock(app: tauri::AppHandle) -> Result<bool, String> {
      let lock_path = app.path()
          .app_data_dir()
          .map_err(|e| e.to_string())?
          .join(".lock");
      match try_create_lock_file(&lock_path) {
          Ok(_) => Ok(true),
          Err(_) => Ok(false),
      }
  }

Detección en db/adapters.js (NO en lógica de negocio):
  app.js invoca adapters.acquireLock() sin conocer el entorno.
```



### 3.10.5 Ajustes de CSP para Tauri

La CSP en index.html para Tauri v2 debe extender 3.9 sin relajar:

<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' tauri://localhost http://tauri.localhost; 
               style-src 'self';
               style-src-attr 'unsafe-inline';
               img-src 'self' asset: https://asset.localhost data:; 
               font-src 'self' asset: https://asset.localhost;
               worker-src 'self' asset: https://asset.localhost blob:;
               connect-src 'self' tauri://localhost http://tauri.localhost 
                            ipc: ipc://localhost http://ipc.localhost;
               frame-ancestors 'none';">

Justificación:
- `worker-src 'self' asset: https://asset.localhost blob:` — cubre workers servidos vía `asset:` (Tauri v2), `blob:` (URL.createObjectURL para workers inline si se requieren) y `'self'` (navegador).
- `font-src` añadido para resolver caso 2.
- style-src-attr 'unsafe-inline' (no style-src): misma excepción estrecha
  que 3.9, requerida por tooltips de ECharts.
- ipc: scheme: requerido en Linux/macOS Tauri v2 (http://ipc.localhost
  solo cubre Windows).
- frame-ancestors 'none' en meta es ignorado por especificación HTTP;
  para despliegue web estático debe configurarse en el servidor
  (nginx, caddy) como cabecera HTTP real.

**Nota:** `asset:` y `https://asset.localhost` son necesarios para cargar recursos locales en Tauri v2.

## 3.10.6 Importación de ficheros CSV

extractos-loader.js invoca el adaptador sin conocer el entorno:
  const files = await platform.dialog.pickCsvFiles();
  for (const f of files) {
    // f.bytes es Uint8Array tanto en navegador como en Tauri
    await parseCsv(f.bytes, f.name);
  }

Implementación navegador (browser-impl.js):
  pickCsvFiles(): usa <input type="file" multiple>,
    lee cada File con file.arrayBuffer() → PickedFile{ name, bytes }.

Implementación Tauri (tauri-impl.js):
  pickCsvFiles(): usa @tauri-apps/plugin-dialog open() + readFile()
    de @tauri-apps/plugin-fs → PickedFile{ name, bytes }.

## 3.10.7 Backup y restauración

Export:
  const data = await platform.db.exportBytes();
  await platform.dialog.saveDbFile(data, 'contabilidad-backup.db');

Import:
  const picked = await platform.dialog.pickDbFile();
  if (picked) await platform.db.replaceWith(picked.bytes);

## 3.10.8 Logging

En lógica de negocio:
  platform.logger.log('info', 'EXT-000', 'Importación completada');

browser-impl.js → console.log.
tauri-impl.js → @tauri-apps/plugin-log (import { log } from ...).

## 3.10.9 Inicialización asíncrona

app.js bootstrap unificado:
  showLoadingScreen('Inicializando...');
  await platform.detectCapabilities();        // unificado con 3.2-cuater
  await platform.lock.acquire();
  await platform.storage.init();
  await platform.db.open('contabilidad.db');
  hideLoadingScreen();
  showMainUI();

La pantalla de carga aplica a AMBOS entornos (no solo Tauri),
pues el bootstrap web (WASM + OPFS + PBKDF2 600k) tarda segundos.


## 3.10.10 Resolución de URLs de Workers

Responsabilidad:
  FileDialogAdapter y WorkerFactory residen en db/adapters.js.
  Ningún módulo (workers/, ui/, crypto/) construye URLs de worker.

Resolución por entorno (implementada en db/browser-impl.js y db/tauri-impl.js):

Navegador (browser-impl.js):
  resolveWorkerUrl(relativePath: string): string {
    return new URL(relativePath, import.meta.url).href;
  }
  // Ejemplo: '../workers/worker-cifrado.js'
  // → 'http://localhost:5173/workers/worker-cifrado.js'

Tauri (tauri-impl.js):
  resolveWorkerUrl(relativePath: string): string {
    // asset: protocol resuelve contra el bundle empaquetado por Tauri.
    // asset.localhost es el alias HTTP requerido por CSP en Windows.
    const assetBase = (window.location.protocol === 'asset:')
      ? 'asset:'
      : 'https://asset.localhost';
    return `${assetBase}/${relativePath.replace(/^\.\.\//, '')}`;
  }
  // Ejemplo: '../workers/worker-cifrado.js'
  // → 'asset:/workers/worker-cifrado.js' (Linux/macOS)
  // → 'https://asset.localhost/workers/worker-cifrado.js' (Windows WebView2)

Uso en app.js (único punto de creación):
  const workerUrl = platform.resolveWorkerUrl('workers/worker-cifrado.js');
  const worker = new Worker(workerUrl, { type: 'module' });

Estrategia de empaquetado Tauri (tauri.conf.json):
  "bundle": {
    "resources": ["../workers/*"]
  }
  Los workers se copian al bundle como recursos estáticos.
  No se compilan ni transforman; permanecen como ES modules.

Fallback determinista:
  Si new Worker() lanza SecurityError o TypeError:
    - Se emite error UI-032 al log interno.
    - La operación se ejecuta en hilo principal con setTimeout(0) chunking.
    - No se bloquea la UI.
  Este fallback NO sustituye la estrategia principal; es contingencia
  para WebViews antiguos (< Chrome 90 en Android).

**Fallback:** Si Workers no están disponibles, ejecutar operaciones pesadas en hilo principal con `setTimeout(0)` para no bloquear la UI.

---


## Definición SQL del Modelo de Datos


### **0. Identidad del módulo**
Este módulo define **únicamente** las tablas, constraints, índices y vistas permitidas en el alcance del proyecto.  
El SCD debe procesar este contenido **de forma determinista**, **sin añadir campos**, **sin eliminar campos**, **sin modificar tipos**, **sin inventar relaciones**, **sin alterar semántica**.

---

### **1. Convenciones SQL**
- Motor: **SQLite** (compatible con SQLite WASM y SQLite nativo en Tauri).  
- Codificación: **UTF‑8**.  
- Tipos:  
  - `INTEGER`  
  - `TEXT`  
  - `BLOB`  
  - `REAL`  
- Cifrado: campos marcados como `CIFRADO` deben almacenarse como `BLOB`.
- Hash: campos marcados como `HASH` deben almacenarse como `TEXT`.
- IV: campos marcados como `IV` deben almacenarse como `BLOB`.
- Importe: `importe_cifrado` almacena el importe con signo. El signo no se deduce de `tipo`.
- Constraints: toda tabla lleva `IF NOT EXISTS`; toda restricción de dominio lleva `CHECK`.  
- Versionado: la versión del esquema se gestiona mediante `PRAGMA user_version`. `migrations.sql` debe incrementar este valor en cada migración.
- Índices: los índices esenciales para rendimiento se definen explícitamente; el SCD no debe inferir índices adicionales.


**Longitudes máximas autorizadas (validadas en JS antes de INSERT/UPDATE):**

- usuarios.nombre: 100 caracteres
- usuarios.email: 254 caracteres
- bancos.nombre: 100 caracteres
- bancos.codigo_entidad: 4 dígitos numéricos (banco) + 4 dígitos (opcional)
- cuentas_bancarias.descripcion: 200 caracteres
- cuentas_bancarias.iban: 34 caracteres (máximo IBAN)
- activos.descripcion: 200 caracteres
- grupos.nombre: 100 caracteres
- subgrupos.nombre: 100 caracteres
- catalogo_tarjetas.nombre: 200 caracteres
- dashboards_usuario.nombre: 100 caracteres
- dashboards_usuario.nombre_override: 100 caracteres

Regla:
Todo campo que supere la longitud máxima genera error UI-026: campo excede longitud.

---

### **2. Definición de tablas en SQL + descripción técnica de IA**

> **Ver el fichero `ìnit.sql`** para disponer de toda la estructura.

---

#### **2.1 Tabla `usuarios`**

**Notas técnicas:**
- `COLLATE NOCASE` + `CHECK(email = lower(email))` garantiza unicidad insensible a mayúsculas y normalización en aplicación.
- `fecha_creacion` usa formato ISO-8601 UTC (`YYYY-MM-DDTHH:MM:SSZ`).
- La contraseña debe normalizarse a UTF-8 NFC en JS antes de derivar con PBKDF2 (ver 5.2-bis).


### **Descripción técnica campo a campo**
- `frase_cifrada`: frase de cifrado del usuario, cifrada con AES‑GCM.  
- `iv_frase`: vector de inicialización asociado a la frase.  
- `estado`: control de bloqueo por intentos fallidos. Valores cerrados: `A`, `B`.  
- `perfil`: determina acceso a CRUD de usuarios. `A`=Administrador, `U`=Usuario.  
- `password_hash`: derivación PBKDF2 con prefijo de dominio `AUTH` sobre la contraseña del usuario (Argon2id no está disponible en WebCrypto; ver 5.1).

### Reglas

email:
  Debe almacenarse normalizado en minúsculas.
  Sin espacios iniciales ni finales.

password_hash:
  PBKDF2-SHA256 con dominio AUTH.
  Iteraciones: 600000.
  Salt mínimo 16 bytes.

intentos_fallidos:
  Se incrementa en cada autenticación fallida.
  Se reinicia a 0 tras autenticación correcta.

fecha_bloqueo:
  ISO-8601.
  Indica hasta cuándo está bloqueado el usuario.
  NULL indica sin bloqueo temporal activo.

---

#### **2.2 Tabla `preferencias`**

**Nota:** La whitelist de claves se valida en aplicación (`4.4-bis`). SQLite no soporta CHECK dinámico contra lista externa.


### **Descripción técnica**
- `valor_cifrado`: valor de preferencia cifrado por usuario.  
- `clave`: identificador determinista de preferencia.  
- Constraint `UNIQUE(id_usuario, clave)`: impide duplicados lógicos por usuario.  

---

#### **2.3 Tabla `bancos`**

---

#### **2.4 Tabla `cuentas_bancarias`**

**Consideración crítica:** Índice único parcial `idx_cuentas_usuario_iban` evita duplicación de IBAN activos por usuario. El IBAN debe normalizarse en JS a mayúsculas sin espacios antes de INSERT/UPDATE.


---

#### **2.5 Tabla `activos`**


**Decisión explícita:** `valor_residual` se declara NO sensible y permanece en claro. Debe añadirse en sección 5.4 del PR-SCD:
> "5.4 Campos no cifrados — ... valor_residual (declarado no sensible para permitir agregados patrimoniales sin descifrado)."

---

### **2.6 Tabla `catalogo_semantico`** *(nueva tabla, se inserta antes de `grupos`)*

**Consideración:** `icono` con valor por defecto `'default'`. En aplicación, si `assets/icons/{icono}.svg` no existe, se usa `assets/icons/default.svg`. Crear icono fallback determinista.


**Valores iniciales autorizados** (INSERT determinista para `init.sql`):

> **Regla**: Las tarjetas estándar (`catalogo_tarjetas.origen = 'estandar'`) **solo pueden referenciar claves presentes en `catalogo_semantico`**. Si una tarjeta estándar usa una clave que no existe en esta tabla, el SCD debe considerarlo un error de configuración (no de datos de usuario).


> **Impacto en tarjetas estándar**

La configuración JSON de una tarjeta estándar sigue usando `"tipo_semantico": "ALIMENTACION"`, pero ahora el renderizado hace:

```sql
SELECT g.*, s.nombre_es, s.icono
FROM grupos g
JOIN catalogo_semantico s ON g.id_semantico = s.id_semantico
WHERE g.id_usuario = ? 
  AND s.clave = 'ALIMENTACION'
  AND g.estado = 'A';
```

- Si el usuario **no tiene** ningún grupo vinculado a esa clave semántica → la tarjeta muestra estado vacío + enlace para vincular un grupo existente (comportamiento ya definido en 8.3).
- Si la clave no existe en `catalogo_semantico` → error de configuración de sistema, no de usuario.

> **Nota sobre migración a Tauri**

La tabla `catalogo_semantico` es **datos de sistema**, no datos de usuario. En la migración a Tauri:
- Se mantiene como tabla SQLite (igual que el resto).
- Los INSERTs iniciales van en `init.sql` o en un script de seeding separado.
- No requiere cambios en la lógica JS ni en la estructura de directorios.

### **2.6-bis Tabla `catalogo_tipos_grafico`**

**Consideración:** Campo `seleccionable` permite deshabilitar tipos sin configuración definida. Formularios deben filtrar `WHERE seleccionable = 1`.

### **2.7 Tabla `grupos`**

**Nota:** Unicidad semántica activa resuelta con índice parcial. Subgrupos heredan `id_semantico` del grupo padre; validación en transacción JS.

### **2.7-bis Unicidad semántica por usuario

Regla de resolución:

Las tarjetas estándar con tipo_semantico resuelven exactamente un grupo activo.
Si no existe grupo activo:
  La tarjeta muestra estado vacío.
  Ofrece acción para vincular grupo.
Si existe más de uno:
  Se considera error de integridad UI-024.

---

#### **2.8 Tabla `subgrupos`**


**Cambio estructural:** Se elimina `id_semantico` de subgrupos. La semántica se hereda del grupo padre. Validación transaccional en JS: no permitir subgrupo activo si grupo padre está inactivo.

---

#### **2.9 Tabla `clasificacion`**

**Consideración:** Índice único parcial garantiza que un usuario no pueda tener dos clasificaciones activas con el mismo `concepto_hash`, eliminando ambigüedad en búsquedas por `concepto_exacto`.

---

#### **2.10 Tabla `extractos`**

**Cambios aplicados:**
- `hash_fila TEXT NOT NULL` integrado en definición canónica.
- `fecha` con constraint GLOB para formato `YYYY-MM-DD`.
- Índice único `idx_extractos_usuario_hash_fila` para deduplicación determinista.

**Fórmula de `hash_fila` (canonicalización):**

```
hash_fila = HMAC-SHA256(
    clave_hmac_usuario,
    JSON.stringify([id_cuenta, fecha, origen, importe_cents, rango_importe, concepto_normalizado])
)
```

---

#### **2.11 Tabla `norma43`**


**Canonicalización del hash::**

```text
hash_fila = HMAC-SHA256(
  clave_hmac_usuario,
  JSON.stringify([
    id_cuenta,
    fecha,
    tipo_o_codigo,
    importe_cents,
    rango_importe,
    concepto_normalizado
  ])
)
```

Resultado:
Texto hexadecimal minúsculas.


**Nota:** Tabla inoperativa hasta anexo técnico Norma 43 (ver 9.9 propuesto). Estructura lista para uso futuro.

---

#### **2.12 Tabla `movimientos`**

**Nota:** Los FKs de `movimientos` a `grupos`, `subgrupos`, `clasificacion`, `extractos` y `norma43` son **nullable** (solo aplican cuando la columna no es NULL). SQLite permite FKs compuestos con columnas NULL: si cualquier columna del FK compuesto es NULL, la restricción no se evalúa. Esto es coherente con la semántica existente.

**Consideraciones aplicadas:**
- Constraint de coherencia para `descripcion_cifrada`/`iv_descripcion`.
- Dos índices únicos parciales: evitan movimientos ACTIVO duplicados desde el mismo extracto o norma43.
- Formato `fecha` validado con GLOB.
- Regla transaccional JS: si `id_clasificacion` está presente, `id_grupo` e `id_subgrupo` deben ser coherentes con la clasificación referenciada.

#### **2.13 Tabla `dashboards_usuario`**


Semántica:

```text
tipo='estandar' AND id_usuario IS NULL:
Plantilla estándar global.

tipo='estandar' AND id_usuario IS NOT NULL:
Instancia de usuario de una plantilla estándar.

tipo='usuario':
Dashboard propio del usuario.

nombre_override:
Si es NULL, se usa nombre.
Si existe, se usa como título visible para la instancia.
```

**Semántica:**
- `tipo='estandar'` + `id_usuario IS NULL`: plantilla global del sistema.
- `tipo='estandar'` + `id_usuario IS NOT NULL`: instancia personalizada de usuario (materialización de plantilla).
- `tipo='usuario'`: dashboard propio del usuario.
- `nombre_override`: si existe, sustituye a `nombre` (clave i18n) para el título visible de la instancia.

---

#### **2.14 Tabla `catalogo_tarjetas`**

-- Para dashboards y tarjetas con `origen='estandar'`, el campo `nombre` debe almacenar **claves i18n** en lugar de texto literal.  
-- Ejemplos:
-- - `'dashboard_general'`
-- - `'card_evolution_income'`
-- - `'card_evolution_expenses'`
-- 
-- Y los textos reales se resuelven en `i18n/es.json`, `i18n/cat.json`, `i18n/en.json`.
-- 
-- Para dashboards y tarjetas con `origen='usuario'`, el campo `nombre` sigue siendo texto libre en el idioma del usuario.


**Consideraciones aplicadas:**
- Todas las configuraciones incluyen `"v":1` como primera clave.
- `CHECK(json_valid(configuracion))` garantiza JSON válido en SQLite 3.38+.
- Tres tarjetas adicionales materializadas con configuraciones coherentes.

##### Tarjetas adicionales recomendadas (no bloquean nada, encajan sin migración)

- **Gasto por categoría (mes actual)** — circular, `tipo_semantico`, reutiliza 8.3.2 tal cual, sin cambios de esquema.
- **Top 10 movimientos por importe (mes actual)** — tabla, mismo patrón que la tarjeta de búsqueda (8.3.3) pero con `columnas` fijas y sin `campos_busqueda` (filtro implícito: mes actual, orden por importe descendente).
- **Saldo actual por cuenta** — tabla simple sobre `cuentas_bancarias` + `saldo_inicial + acumulado(movimientos)`; mismo cálculo que 8.3.4/saldo_acumulado pero sin serie temporal, solo el último valor.


---

#### **2.15 Tabla `tarjetas_dashboard`**

**Atención:** `dashboards_usuario` y `catalogo_tarjetas` pueden tener `id_usuario = NULL` (plantillas estándar). El índice único compuesto no puede incluir NULL de forma fiable para matching. **Estas dos FKs permanecen simples.**

**Consideraciones aplicadas:**
- `updated_at` integrado en `CREATE TABLE`.
- `CHECK(color_fondo GLOB ...)` valida formato hexadecimal 6 dígitos.
- Índice único `idx_tarjetas_dashboard_dashboard_orden` evita órdenes duplicados por dashboard.

**Mecanismo copy-on-write para customización semántica de tarjetas estándar:**
- Cuando el usuario edita título/tipo/config de una tarjeta estándar, se crea nueva fila en `catalogo_tarjetas` con `origen='usuario'`, `id_tarjeta_origen=id_original`, y se actualiza `tarjetas_dashboard.id_tarjeta` al nuevo ID.

**Reglas:**

- No puede existir más de una tarjeta con el mismo orden dentro del mismo dashboard.
- color_fondo debe ser hexadecimal de 6 dígitos.
- Toda modificación de tarjetas_dashboard actualiza updated_at a nivel de aplicación.

#### **2.16 Tabla `saldos_cuenta`**

> **Nota:** `saldos_cuenta` es una tabla derivada. No está autorizada como CRUD de usuario; se regenera determinísticamente desde `movimientos`, `extractos` y `cuentas_bancarias.saldo_inicial_cifrado`.

**Consideraciones aplicadas:**
- `updated_at` integrado en definición canónica.
- `fecha_ultimo_movimiento` validada con formato `YYYY-MM-DD`.
- `periodo` validado con formato `YYYY-MM`.

**Renderizado de meses sin snapshot:** Para `card_balance_evolution`, los meses sin fila en `saldos_cuenta` arrastran el último saldo conocido. No se insertan snapshots calculados por este motivo.


#### **2.16-bis Extensión y recálculo

Recálculo incremental:

Cuando cambia un movimiento:
  Se determina el primer periodo afectado.
  Se busca el snapshot anterior válido o saldo inicial.
  Se recalculan periodos desde el periodo afectado hasta el último periodo existente de la cuenta.
  Los extractos PROCESADO con saldo actúan como anclas de conciliación.

Un snapshot DESCUADRE:
  No bloquea la escritura.
  Debe mostrarse como advertencia en UI.
  No se usa como saldo fiable en dashboards sin advertencia.


#### **2.17 Seeds iniciales de dashboards y tarjetas estándar**

Los siguientes INSERT deben ejecutarse en `init.sql` **después** de crear todas las tablas y después de insertar las tarjetas estándar en `catalogo_tarjetas`. Asumen que el dashboard "General" recibe `id_dashboard = 1` y que las tarjetas estándar reciben ids 1 a 5 según el orden de inserción definido en 2.14.

```sql
-- Dashboard estándar global
INSERT OR IGNORE INTO dashboards_usuario (id_usuario, nombre, tipo, bloqueado, orden, estado) VALUES
(NULL, 'dashboard_general', 'estandar', 1, 1, 'A');

-- Asociación de tarjetas estándar al dashboard General
INSERT INTO tarjetas_dashboard (id_dashboard, id_tarjeta, tamano, color_fondo, orden)
SELECT
    d.id_dashboard,
    c.id_tarjeta,
    CASE c.nombre
        WHEN 'card_expenses_by_category' THEN '1x1'
        WHEN 'card_current_balance'      THEN '1x1'
        ELSE '2x1'
    END,
    CASE c.nombre
        WHEN 'card_evolution_income'    THEN '#1f77b4'
        WHEN 'card_evolution_expenses'  THEN '#d62728'
        WHEN 'card_income_expenses'     THEN '#ff7f0e'
        WHEN 'card_balance_evolution'   THEN '#2ca02c'
        WHEN 'card_movement_search'     THEN '#9467bd'
        WHEN 'card_expenses_by_category' THEN '#ffbb78'
        WHEN 'card_top10_movements'     THEN '#98df8a'
        WHEN 'card_current_balance'     THEN '#c5b0d5'
        ELSE '#1f77b4'
    END,
    CASE c.nombre
        WHEN 'card_evolution_income'    THEN 1
        WHEN 'card_evolution_expenses'  THEN 2
        WHEN 'card_income_expenses'     THEN 3
        WHEN 'card_balance_evolution'   THEN 4
        WHEN 'card_movement_search'     THEN 5
        WHEN 'card_expenses_by_category' THEN 6
        WHEN 'card_top10_movements'     THEN 7
        WHEN 'card_current_balance'     THEN 8
        ELSE 99
    END
FROM catalogo_tarjetas c
JOIN dashboards_usuario d
    ON d.nombre = 'dashboard_general'
    AND d.tipo = 'estandar'
    AND d.id_usuario IS NULL
WHERE c.origen = 'estandar'
  AND c.id_usuario IS NULL
  AND c.nombre IN (
      'card_evolution_income',
      'card_evolution_expenses',
      'card_income_expenses',
      'card_balance_evolution',
      'card_movement_search',
      'card_expenses_by_category',
      'card_top10_movements',
      'card_current_balance'
  )
  AND NOT EXISTS (
      SELECT 1 FROM tarjetas_dashboard td
      WHERE td.id_dashboard = d.id_dashboard
        AND td.id_tarjeta = c.id_tarjeta
  );
```

#### 2.18 catalogo_tokens

> No hay observaciones por el momento


---

### **3. Notas de integridad referencial**

- No se declara `ON DELETE CASCADE` en ninguna FK.  
- El borrado físico de un usuario está **prohibido** por lógica de negocio; debe usarse `estado = 'B'` + `fecha_baja`.  
- No se declara `ON UPDATE` en ninguna FK (decisión explícita, no omisión).
    Justificación: todas las claves primarias referenciadas son `INTEGER PRIMARY KEY`
    autoincrementales de SQLite. Una vez asignado un `rowid`, SQLite no permite
    modificarlo mediante UPDATE — la PK es inmutable por diseño del motor.
    Por tanto, `ON UPDATE CASCADE` sería una cláusula muerta que nunca se ejecutaría.
    La única excepción teórica sería una migración manual con `PRAGMA writable_schema = ON`,
    operación prohibida en este alcance (3.1-bis: migraciones solo vía `migrations.sql`
    con transacciones ACID estándar, sin manipulación directa de `sqlite_master`).
- El SCD debe garantizar que cualquier operación de baja lógica actualice `fecha_baja` y `estado` de forma atómica (transacción SQLite).  
- Los índices definidos en este bloque son los únicos autorizados; el SCD no debe inferir índices adicionales ni omitir los aquí especificados.
- `updated_at` se actualiza a nivel de aplicación en cada `INSERT`/`UPDATE` de la fila afectada. No se emplean triggers para evitar recursión y dependencias ocultas.
- `saldos_cuenta` es una tabla derivada: sus filas se recalculan y persisten dentro de la misma transacción que modifica `movimientos`, `extractos` o `norma43`.


---


## **4. FUNCIONALIDADES AUTORIZADAS (BOUNDARY-FEATURES)**

Este bloque define las funcionalidades permitidas para el Sistema Cognitivo Determinista (SCD).  
El SCD debe operar **únicamente** dentro de estas funcionalidades, sin añadir, modificar, eliminar ni reinterpretar ninguna de ellas.

---

### **4.1 Módulo Multi-Look (Tema Claro/Oscuro)**

El sistema debe soportar dos modos visuales:

- **look_claro**  
- **look_oscuro** (similar al estilo visual de Grafana)

El usuario puede seleccionar el look.  

> El SCD debe almacenar esta selección en la columna `usuarios.look`.

Implementación determinista del theming:
- El theming se resuelve mediante custom properties CSS definidas en `ui/styles/theme-light.css` y `ui/styles/theme-dark.css`.
- El documento raíz expone el atributo `data-theme` con valores cerrados `claro` | `oscuro`.
- JS únicamente alterna `data-theme` y persiste la preferencia; no calcula estilos.
- ECharts no hereda variables CSS en canvas; `ui/components/chart.js` debe resolver el tema en `init` leyendo los valores computados de las custom properties o registrando tema ECharts.

El SCD tiene prohibido:

- añadir nuevos looks  
- modificar la semántica de los looks  
- generar estilos no definidos  

### Carga de hojas de estilo
Ambos ficheros de tema, ui/styles/theme-light.css y ui/styles/theme-dark.css, se cargan de forma estática en index.html mediante <link rel="stylesheet">.
Las reglas están condicionadas al atributo data-theme del elemento raíz:
- theme-light.css: :root[data-theme='claro'] { ... }
- theme-dark.css: :root[data-theme='oscuro'] { ... }
No se utiliza inyección dinámica de CSS desde JavaScript.

### Mapeo de usuarios.look a data-theme
La columna usuarios.look usa valores cerrados 'C' (Claro) y 'O' (Oscuro).
Al cargar la interfaz, app.js aplica:
- look = 'C' → document.documentElement.setAttribute('data-theme', 'claro')
- look = 'O' → document.documentElement.setAttribute('data-theme', 'oscuro')

Cualquier cambio de look actualiza simultáneamente usuarios.look y data-theme.

### 4.1.1 Tokens DARK estilo Grafana

El tema oscuro usa custom properties CSS.
JS no calcula colores.
JS solo alterna data-theme.

:root[data-theme='oscuro'] {
  --bg-app: #111217;
  --bg-panel: #181B1F;
  --bg-card: #1E2024;
  --bg-hover: #22252A;
  --bg-selected: #20242B;
  --bg-input: #0F1013;

  --border-strong: #2C3235;
  --border-subtle: #24272B;

  --text-primary: #D8D9DA;
  --text-secondary: #A0A4A8;
  --text-muted: #7B8084;

  --accent-primary: #3D71D9;
  --accent-hover: #4A7FE0;
  --accent-soft: rgba(61, 113, 217, 0.15);

  --color-success: #73BF69;
  --color-warning: #F2CC0C;
  --color-error: #E02F44;
  --color-info: #3D71D9;

  --chart-grid: #24272B;
  --chart-axis: #8E8E8E;
  --chart-tooltip-bg: #1E2024;
  --chart-tooltip-border: #2C3235;

  --scrollbar-thumb: #33373D;
  --scrollbar-track: #111217;

  --radius-card: 6px;
  --radius-panel: 8px;
  --shadow-card: none;
}

ECharts:

ui/components/chart.js debe registrar tema oscuro leyendo computed styles.
Debe remapear:
  backgroundColor
  textStyle
  axisLine
  axisLabel
  splitLine
  tooltip
  legend

Tabulator:

ui/components/table.js debe aplicar overrides CSS para:
  header
  row hover
  selected row
  borders
  cell text
  scrollbar

### 4.1.2 Contrato de theming

Los temas claro y oscuro deben exponer exactamente las mismas custom properties.

Index.html carga:
app.css
ui/styles/theme-light.css
ui/styles/theme-dark.css

El documento usa:
<html data-theme="claro">
o
<html data-theme="oscuro">

JS únicamente:
alterna data-theme
persiste look en usuarios.look
solicita re-render de gráficos si cambia el tema

Componentes:
No pueden usar colores hardcoded.
Deben usar var(--token).

ECharts:
chart.js lee computed styles en init.
chart.js registra tema ECharts.
En cambio de tema, los gráficos activos se actualizan o re-renderizan.

Tabulator:
Los overrides visuales se resuelven por CSS.
No se permite modificar la semántica de Tabulator para theming.


Tokens mínimos adicionales para ambos temas:
Estos tokens deben existir en ambos temas con los mismos nombres. Los valores se resuelven via las custom properties base ya definidas.

**Impacto:**
- No requiere cambios en 3.5 ni en CSP.
- No añade recursos estáticos.
- Tabulator usa `--font-family` vía override CSS (4.1.2 ya lo permite).
- Cifras tabulares se fuerzan con `font-variant-numeric: tabular-nums` en celdas de importe (añadir a `ui/components/table.js`).

```css
:root {
   --font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
   --font-family-mono: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, monospace;
   /* Si se requiere Inter: añadir assets/fonts/inter.woff2 + @font-face en app.css
   y documentar en 3.5 como fichero autorizado; CSP ya permite font-src 'self' por defecto (default-src). */
   /* Inter no aporta valor diferencial en UI de tablas financieras donde `tabular-nums` es la propiedad crítica, no la familia tipográfica. */

  --focus-ring: 0 0 0 2px var(--accent-soft);

  --button-primary-bg: var(--accent-primary);
  --button-primary-text: #FFFFFF;
  --button-secondary-bg: transparent;
  --button-secondary-text: var(--text-primary);
  --button-secondary-border: var(--border-strong);

  --input-bg: var(--bg-input);
  --input-border: var(--border-strong);
  --input-text: var(--text-primary);
  --input-placeholder: var(--text-muted);

  --modal-bg: var(--bg-panel);
  --modal-backdrop: rgba(0, 0, 0, 0.6);

  --badge-success-bg: rgba(115, 191, 105, 0.15);
  --badge-warning-bg: rgba(242, 204, 12, 0.15);
  --badge-error-bg: rgba(224, 47, 68, 0.15);
  --badge-info-bg: rgba(61, 113, 217, 0.15);

  /* Tablas (Tabulator) */
  --table-header-bg: var(--bg-panel);
  --table-header-text: var(--text-primary);
  --table-row-alt-bg: var(--bg-hover);
  --table-row-hover-bg: var(--bg-selected);
  --table-row-selected-bg: var(--accent-soft);
  --table-border: var(--border-subtle);
  --table-cell-text: var(--text-secondary);

  /* Modales */
  --modal-shadow: 0 8px 24px rgba(0,0,0,0.2);

  /* Enlaces */
  --link-color: var(--accent-primary);
  --link-hover: var(--accent-hover);

  /* Badges */
  --badge-text: var(--text-primary);

  /* Progreso */
  --progress-bg: var(--bg-input);
  --progress-fill: var(--accent-primary);
  --progress-text: var(--text-secondary);  
}
```


Tokens claros mínimos propuestos:

```css
:root[data-theme='claro'] {
  --bg-app: #F4F5F5;
  --bg-panel: #FFFFFF;
  --bg-card: #FFFFFF;
  --bg-hover: #F1F3F4;
  --bg-selected: #E9EEF6;
  --bg-input: #FFFFFF;

  --border-strong: #D8D9DA;
  --border-subtle: #E4E5E6;

  --text-primary: #24272F;
  --text-secondary: #6E7178;
  --text-muted: #8E8E8E;

  --accent-primary: #3D71D9;
  --accent-hover: #4A7FE0;
  --accent-soft: rgba(61, 113, 217, 0.12);

  --color-success: #73BF69;
  --color-warning: #F2CC0C;
  --color-error: #E02F44;
  --color-info: #3D71D9;

  --chart-grid: #E4E5E6;
  --chart-axis: #6E7178;
  --chart-tooltip-bg: #FFFFFF;
  --chart-tooltip-border: #D8D9DA;

  --scrollbar-thumb: #C7D0D9;
  --scrollbar-track: #F4F5F5;

  --radius-card: 6px;
  --radius-panel: 8px;
  --shadow-card: 0 1px 2px rgba(0, 0, 0, 0.08);
}
```

### 4.1.3  Responsive Design

Breakpoints autorizados:

--bp-mobile:  max-width: 768px
--bp-tablet:  min-width: 769px and max-width: 1200px
--bp-desktop: min-width: 1201px

Reglas por breakpoint:

Mobile (< 768px):
- Menú lateral: drawer deslizable con overlay.
- Grid de tarjetas: 1 columna.
- Modales: fullscreen.

Tablet (769-1200px):
- Menú lateral: colapsable fijo.
- Grid de tarjetas: 2 columnas.
- Modales: centrados con backdrop.

Desktop (> 1200px):
- Menú lateral: fijo con resize.
- Grid de tarjetas: 3-4 columnas según ancho.
- Modales: centrados con backdrop.

Componentes UI deben usar media queries de CSS, no detección JS.
app.css incluye las media queries base.

---

### **4.2 Módulo de Cifrado Total por Usuario**

El sistema debe cifrar **todos los datos sensibles** utilizando:

- **frase de cifrado del usuario**  
- derivación de clave mediante **PBKDF2**  
- cifrado **AES‑GCM**  
- IV por campo cifrado  

El SCD debe garantizar:

- cada usuario cifra con su propia clave  
- ningún usuario puede descifrar datos de otro  
- el administrador no puede ver frases de cifrado  
- los datos cifrados no permiten búsquedas por LIKE ni por rangos  

El SCD debe evitar cualquier referencia a algoritmos no definidos.

---

### **4.3 Módulo Multiusuario**

El sistema debe soportar múltiples usuarios, cada uno con:

- id_usuario  
- email  
- nombre  
- password  
- estado (activo / bloqueado)  
- perfil (A / U)  
- idioma (ES / CAT / EN)  
- look (claro / oscuro)  
- frase_cifrada  
- iv_frase  

El SCD debe garantizar:

- aislamiento total por id_usuario  
- cada usuario solo puede CRUD sus propios datos  
- el administrador solo puede CRUD usuarios  
- el administrador no puede ver frases de cifrado  

El SCD debe evitar:

- creación de perfiles no definidos  
- modificación de roles  
- ampliación de permisos  

---

### **4.4 Módulo de Customizaciones por Usuario**

El sistema debe almacenar customizaciones del usuario en tablas específicas:

- criterios de búsqueda  
- dashboards creados o asociados  
- ubicación de tarjetas dentro de cada dashboard  

El SCD debe procesar estas customizaciones sin añadir nuevas categorías.

### 4.4-bis Whitelist de preferencias

#### Claves autorizadas en preferencias:

menu_ancho
menu_colapsado
dashboard_activo
filtro_fecha_dashboard
importe_filtro_min
importe_filtro_max
ultima_vista_panel

Reglas:
- No se permiten claves fuera de esta lista.
- Las preferencias de idioma y look permanecen en usuarios.
- Toda preferencia fuera de whitelist genera error UI-025.


#### Limpieza de preferencias obsoletas

Al iniciar sesión, el sistema compara las claves existentes en preferencias 
del usuario contra la whitelist vigente.

Claves fuera de whitelist:
  Se eliminan de la tabla preferencias.
  La eliminación se registra en el log interno.
  No se emite error al usuario.

Esto garantiza que claves retiradas en versiones futuras no permanezcan 
como datos cifrados huérfanos.

### 4.4-ter Valores por defecto autorizados

preferences-default.json debe contener únicamente claves de la whitelist:

{
  "menu_ancho": 260,
  "menu_colapsado": false,
  "dashboard_activo": null,
  "filtro_fecha_dashboard": "mes_actual",
  "importe_filtro_min": null,
  "importe_filtro_max": null,
  "ultima_vista_panel": "dashboard"
}

Reglas:

Estos valores se usan cuando no existe fila en preferencias.
El valor real persiste cifrado.
No se permite añadir claves nuevas sin revisión del PR-SCD.

---

### **4.5 Módulo de Cifrado (Reglas Deterministas)**

Ver bloque 5 (SISTEMA DE CIFRADO) — fuente única de verdad para algoritmo, frase de usuario, campos cifrados/no cifrados y hashes autorizados.

### **4.6 Módulo de Búsquedas Deterministas**

El SCD debe permitir únicamente las siguientes búsquedas:

#### ✔ Búsquedas por fecha  
```
WHERE fecha BETWEEN ...
```

#### ✔ Búsquedas por banco  
```
WHERE banco_id = ...
```

#### ✔ Búsquedas por cuenta  
```
WHERE cuenta_id = ...
```

#### ✔ Búsquedas por epígrafe  
```
WHERE id_clasificacion = ...
...
id_clasificacion
```

#### ✔ Búsquedas por igualdad de concepto  
```
WHERE concepto_hash = HMAC-SHA256(clave_derivada_usuario, valor_normalizado)
```

#### ❌ Búsquedas por LIKE  
Prohibidas sobre campos cifrados.

#### ❌ Búsquedas por rangos sobre importe cifrado (SQL directo)  
Prohibidas: no existe operador `>`/`<` válido sobre `BLOB` cifrado.

#### ✔ Búsqueda por rango de importe (algoritmo autorizado en dos fases)
1. SQL: `WHERE rango_importe IN (<buckets que solapan [importe_min, importe_max]>) AND fecha BETWEEN ...` — preselección por bucket, no por valor exacto.
2. JS: descifrar solo el subconjunto devuelto (vía `worker-cifrado.js`, 5.7) y aplicar filtro exacto `importe_min <= importe_descifrado <= importe_max`.
El resultado final es exacto; el SQL solo acota candidatos.
---

## 4.6-ter Búsqueda por tokens hasheados (AND lógico)

Búsqueda parcial autorizada sobre conceptos mediante tokens hasheados. Ver tabla `catalogo_tokens`.

Algoritmo de inserción (en worker-clasificacion.js):
1. Normalizar concepto (5.5-bis).
2. Split por espacios y puntuación.
3. Deduplicar tokens.
4. Para cada token: HMAC-SHA256(clave_hmac_usuario, token).
5. INSERT OR IGNORE en catalogo_tokens.

Algoritmo de búsqueda:
1. Normalizar término de búsqueda.
2. Split en tokens.
3. Calcular hashes.
4. SQL: SELECT id_clasificacion FROM catalogo_tokens 
        WHERE id_usuario = ? AND token_hash IN (...)
        GROUP BY id_clasificacion
        HAVING COUNT(DISTINCT token_hash) = <num_tokens>
5. Resultado: clasificaciones que contienen TODOS los tokens (AND).

Privacidad:
- Tokens hasheados con clave de usuario.
- No revelan concepto original.
- No permiten LIKE ni búsquedas por prefijo.
- Invalidan rainbow tables entre usuarios.

Código de error asociado: ninguno nuevo (reutiliza UI-021 si falla).


### **4.7 Módulo de Menú Lateral**

El menú lateral debe ser:

- idiomático  
- colapsable  
- con resize del ancho  
- con iconos cuando está colapsado  
- con preferencias guardadas por usuario  
- definido mediante fichero JSON  
- con profundidad máxima de **5 niveles**

El SCD debe evitar:

- añadir niveles adicionales  
- modificar estructura  
- añadir opciones no definidas  

---

### **4.8 Opciones del Menú Lateral (Deterministas)**

#### **1. Administrador**
Solo disponible si `perfil = 'A'`.

##### 1.1 CRUD de usuarios  
Operaciones permitidas:

- crear usuario  
- modificar usuario  
- borrar usuario  

Tabla afectada: `usuarios`.

---

#### **2. CRUD de tablas del sistema**

##### 2.1 CRUD solo visual (sin modificar)
Tablas:

- `extractos`  
- `norma43`  
- `movimientos`  

##### 2.2 CRUD por usuario (solo sus propios datos)
Tablas:

- `preferencias`  
- `bancos`  
- `cuentas_bancarias`  
- `activos`  
- `grupos`  
- `subgrupos`  
- `clasificacion`  

##### 2.3 Campos modificables en `usuarios`
- frase_cifrada  
- idioma  
- look  

---

#### **3. Carga de extractos bancarios**

El sistema debe:

- aceptar CSV de diferentes bancos  
- detectar banco por cabecera del CSV  
- soportar Sabadell  
- soportar Santander  
- permitir arrastrar múltiples ficheros  
- unificar extractos y norma43 en `movimientos`  
- permitir borrar extractos y borrar movimientos asociados  

##### Subopciones:
- CRUD visual de extractos  
- CRUD visual de Norma 43  
- CRUD visual de movimientos  

---

#### **4. Dashboards**

##### 4.1 Dashboards estándar
El sistema debe incluir dashboards predefinidos.

El usuario puede customizar:

- quitar tarjetas  
- cambiar tamaño  
- añadir tarjetas  
- cambiar título  
- cambiar tipo de gráfico  
- cambiar orden  
- cambiar color de fondo  

##### 4.2 Dashboards customizados
El usuario puede:

- crear dashboards propios  
- borrar dashboards propios  
- copiar dashboards propios  
- renombrar dashboards  
- bloquear dashboards para ocultarlos  

---


### **4.9 Módulos UI Autorizados (Tabulator + ECharts)s**

El sistema cognitivo determinista (SCD) debe utilizar **únicamente** las siguientes librerías de interfaz para la representación tabular y gráfica.  
Estas librerías están **autorizadas**, **validadas**, **deterministas**, y **compatibles** con la arquitectura técnica definida.

El SCD tiene prohibido:

- sustituirlas  
- proponer alternativas  
- añadir nuevas librerías  
- modificar su semántica  
- generar componentes no definidos  

---

### **4.9.1 Librería Tabular Autorizada: TABULATOR**

**Tabulator** (licencia MIT, formato UMD, sin build step) es la librería autorizada para:

- tablas tipo Excel  
- edición de celdas  
- ordenación múltiple  
- ocultar/mostrar columnas  
- mover columnas  
- formateo condicional  
- integración con datos cifrados/normalizados  
- consistencia visual con dashboards  
- compatibilidad con SQLite WASM  

El SCD debe reconocer Tabulator como **único módulo tabular autorizado**.

#### Capacidades deterministas autorizadas:
- `movableColumns: true`  
- `columnHeaderSortMulti: true`  
- `showColumn` / `hideColumn`  
- `cellEdited`  
- `editor` por columna  
- `formatter` con color condicional  

El SCD debe evitar cualquier referencia a otras librerías tabulares.

---

### **4.9.2 Librería Gráfica Autorizada: ECHARTS**

**ECharts** (Apache-2.0, formato UMD, sin build step) es la librería autorizada para:

- gráficos de líneas  
- gráficos de barras  
- gráficos circulares  
- gráficos de área  
- gráficos financieros  
- dashboards estándar y customizados  
- soporte nativo de tema claro/oscuro  
- integración determinista con el sistema multilenguaje  

El SCD debe reconocer ECharts como **único módulo gráfico autorizado**.

#### Capacidades deterministas autorizadas:
- theming claro/oscuro  
- series múltiples  
- ejes X/Y multilenguaje  
- tooltips multilenguaje  
- compatibilidad con datos normalizados  
- tipos de gráfico soportados: los definidos en `catalogo_tipos_grafico` con `estado='A'` (ver 2.6-bis)

El SCD debe evitar cualquier referencia a otras librerías gráficas.

---

### **4.9.3 Prohibiciones cognitivas del módulo UI**

El SCD tiene prohibido:
- sustituir Tabulator (tabular) o ECharts (gráficos) por cualquier otra librería
- generar código o estructuras no definidas
- ampliar capacidades de estas librerías no documentadas en **4.9.1/4.9.2**.

---


### 4.10 Validaciones deterministas de dominio
Validación de IBAN para `cuentas_bancarias.iban`:
- Implementada en `utils/iban.js`.
- Sin librerías externas.
- Algoritmo: normalización, reordenación, módulo 97.
- Solo IBAN español (`ES`) es obligatorio; otros IBAN pueden aceptarse si el módulo lo implementa explícitamente.
- Fallo de validación genera error determinista, nunca inserción parcial.


**Borrado de cuenta bancaria:**

Si la cuenta tiene movimientos asociados:
  El borrado físico se impide.
  Se emite error DB-013: "cuenta con movimientos, solo desactivación permitida".
  La cuenta pasa a estado 'I' (inactiva).

Si la cuenta no tiene movimientos:
  Se permite borrado lógico (estado 'I' + fecha_baja).
  El borrado físico está prohibido en todo el sistema (ver sección 4 integridad).

### 4.11 Errores deterministas
Todo error de runtime debe usar códigos centralizados definidos en `utils/errors.js`.

Reglas:
- Prohibido lanzar errores con texto libre como única identificación.
- El mensaje visible se resuelve siempre mediante i18n.
- Los códigos se agrupan por dominio: `DB-`, `CR-`, `AU-`, `EXT-`, `UI-`, `I18N-`.

Ejemplo autorizado:
```javascript
export const ERRORS = {
  DB_NOT_INITIALIZED: 'DB-001',
  CRYPTO_KEY_MISSING: 'CR-001',
  USER_BLOCKED: 'AU-001',
  IBAN_INVALID: 'DB-010',
  CARD_CONFIG_INVALID: 'UI-020',
  TABLE_CARD_CONFIG_INVALID: 'UI-021',
  EVOLUTION_CARD_CONFIG_INVALID: 'UI-022'
};
```

### 4.11-bis Códigos adicionales autorizados

DB-002: migración fallida.
DB-003: versión de base de datos incompatible.
DB-010: IBAN inválido.
DB-011: cuenta duplicada.
DB-012: timeout de operación SQLite o worker.
DB-013: cuenta con movimientos no eliminable.
DB-014: versión de SQLite WASM insuficiente.
DB-015: error en recálculo de saldos multi-cuenta.
DB-016: fallo en flush de OPFS (contabilidad.db.tmp corrupto o validación fallida).

CR-001: clave de cifrado ausente.
CR-002: descifrado fallido.
CR-003: HMAC inválido.
CR-004: frase de datos no disponible.

AU-001: usuario bloqueado.
AU-002: credenciales inválidas.
AU-003: usuario temporalmente bloqueado.
AU-004: bootstrap no permitido.
AU-005: operación bloqueada — último administrador activo.

EXT-001: cabecera CSV inválida.
EXT-002: encoding CSV inválido.
EXT-003: fila CSV inválida.
EXT-004: fila duplicada omitida.
EXT-005: rollback de importación.
EXT-006: Norma 43 inoperativa (anexo técnico pendiente).
EXT-007: fecha calendario inválida.

UI-020: configuración inválida de tarjeta estándar semántica.
UI-021: configuración inválida de tarjeta de tabla.
UI-022: configuración inválida de tarjeta de evolución temporal.
UI-023: versión de configuración no soportada.
UI-024: resolución semántica ambigua.
UI-025: preferencia no autorizada.
UI-030: instancia de aplicación ya activa.
UI-032: worker no inicializable — fallback a hilo principal.

### 4.12 Backup local determinista

El sistema debe permitir exportar e importar contabilidad.db.

Export:
  Descarga el fichero OPFS contabilidad.db.
  No descifra datos.
  No modifica la base de datos.

Import:
  Requiere confirmación explícita.
  Requiere lock activo.
  Reemplaza contabilidad.db.
  Tras importar, se valida PRAGMA user_version.
  Si la versión es incompatible, se emite DB-003.

Advertencia obligatoria:

La pérdida de contraseña impide recuperar datos cifrados.
El backup no sustituye la contraseña.

### 4.12-bis Permisos de backup

Export:
Solo disponible para perfil A.

Import:
Solo disponible para perfil A.
Requiere confirmación explícita.
Requiere lock activo.
Cierra la conexión SQLite antes de reemplazar contabilidad.db.
Reabre tras validar PRAGMA user_version.

Advertencia:
El backup contiene todas las filas de todos los usuarios lógicos del mismo origen.
Aunque los datos sensibles estén cifrados, los metadatos en claro quedan expuestos.
Por tanto, el backup no debe estar disponible para usuarios con perfil U si existen múltiples usuarios lógicos en el mismo origen.

### 4.13 Flujos de usuario mínimos

**Onboarding inicial:**

Si no existen usuarios:
  Crear administrador.
  Elegir idioma.
  Elegir look.
  Crear credenciales.
  Mostrar advertencia de no recuperación.
  Finalizar con acceso directo a carga de extractos.

**Importación:**

Mostrar zona drag & drop.
Mostrar detección de banco por fichero.
Mostrar resumen posterior:
  total filas
  válidas
  duplicadas
  erróneas
  movimientos generados

**Estados vacíos:**

Dashboard sin datos:
  Mostrar mensaje i18n.
  Ofrecer carga de extractos.

Tarjeta semántica sin grupo:
  Mostrar estado vacío.
  Ofrecer vinculación de grupo.

Búsqueda sin resultados:
  Mostrar estado vacío.
  No mostrar error.


**Indicador de progreso:**

Las operaciones largas (importación de ficheros, recálculo de saldos) 
deben mostrar una barra de progreso determinista implementada en 
ui/components/progress.js.

Reglas:
- El progreso se calcula como porcentaje de filas procesadas / total filas.
- La barra usa tokens CSS --progress-bg, --progress-fill, --progress-text.
- No se permite animación CSS continua (spinner); solo avance discreto.
- El componente recibe actualizaciones desde el orquestador (app.js) 
  que monitorea los lotes enviados al worker.
- Al completar, la barra muestra 100% durante 2 segundos y luego 
  cede al resumen de importación (9.8.1).

### 4.13-bis Onboarding operativo completo

Onboarding de primer usuario:

1. Crear usuario administrador.
2. Elegir idioma.
3. Elegir look.
4. Mostrar advertencia de no recuperación.
5. Ofrecer creación de banco inicial.
6. Ofrecer creación de cuenta inicial.
7. Si se crea cuenta:
   Validar IBAN.
   Cifrar saldo inicial.
   Persistir banco y cuenta.
8. Finalizar con acceso a carga de extractos.

Si el usuario omite banco/cuenta:
La carga de extractos exige crear o seleccionar cuenta antes de procesar ficheros.

# # **5. SISTEMA DE CIFRADO (BOUNDARY-CRYPTO)**

Este módulo define las reglas deterministas del cifrado autorizado.  
El SCD debe operar **únicamente** dentro de estas reglas.

---

## **5.1 Algoritmo autorizado**
- **AES‑GCM**  
- Proveedor: **WebCrypto API**  
- Derivación de clave: **PBKDF2**  
- Longitud de clave: definida por WebCrypto  
- IV: generado por WebCrypto, único por campo cifrado  

El SCD tiene prohibido usar cualquier otro algoritmo.

---

## **5.2 Frase de cifrado por usuario**
Cada usuario posee una **frase de cifrado** que:

- se almacena **cifrada**  
- se acompaña de su **IV**  
- se deriva mediante **PBKDF2**  
- genera la clave AES‑GCM del usuario  

El administrador **no puede ver** la frase.

## **5.2-bis Modelo operativo de credenciales**

El usuario final introduce una única contraseña.

El sistema mantiene una frase de datos interna, invisible para el usuario, generada aleatoriamente en la creación del usuario.

Dominios de derivación autorizados:

AUTH:
  Propósito: generar password_hash.
  Entrada: "AUTH:" + contraseña.
  Salt: password_salt.
  Algoritmo: PBKDF2-SHA256.
  Iteraciones: 600000.
  Longitud de clave: 256 bits.

WRAP:
  Propósito: cifrar la frase de datos.
  Entrada: "WRAP:" + contraseña.
  Salt: password_salt.
  Algoritmo: PBKDF2-SHA256.
  Iteraciones: 600000.
  Longitud de clave: 256 bits.

DATA:
  Propósito: generar clave AES-GCM para cifrado de datos.
  Entrada: "DATA:" + frase_datos.
  Salt: data_salt.
  Algoritmo: PBKDF2-SHA256.
  Iteraciones: 600000.
  Longitud de clave: 256 bits.

HMAC:
  Propósito: generar clave HMAC-SHA256 para hashes de búsqueda.
  Entrada: "HMAC:" + frase_datos.
  Salt: data_salt.
  Algoritmo: PBKDF2-SHA256.
  Iteraciones: 600000.
  Longitud de clave: 256 bits.

Requisitos:

password_salt:
  Aleatorio.
  Mínimo 16 bytes.
  Generado con WebCrypto.

data_salt:
  Aleatorio.
  Mínimo 16 bytes.
  Generado con WebCrypto.

frase_datos:
  Aleatoria.
  Mínimo 32 bytes.
  Nunca se muestra al usuario.
  Se almacena cifrada con clave WRAP.

AES-GCM:
  IV de 12 bytes.
  IV único por campo cifrado.
  IV generado con WebCrypto.

Cambio de contraseña:
  No requiere recifrar datos.
  Genera nueva password_salt.
  Recalcula password_hash.
  Recifra frase_datos con nueva clave WRAP.

Cambio de frase_datos:
  Requiere recifrar todos los campos cifrados del usuario.
  Solo se permite tras autenticación válida.

Olvido de contraseña:
  No existe recuperación.
  El sistema debe mostrar advertencia explícita durante setup y preferencias.


## **5.2-ter Claves de sesión**

Tras autenticación válida:

1. Se deriva clave AUTH para verificar password_hash.
2. Se deriva clave WRAP para descifrar frase_datos.
3. Con frase_datos descifrada, se derivan:
   clave DATA
   clave HMAC
4. Las claves DATA y HMAC se mantienen en memoria durante la sesión.
5. Ninguna clave se persiste en OPFS, IndexedDB, LocalStorage ni sessionStorage.
6. En logout, las claves se destruyen de memoria.

Prohibido:
Derivar clave DATA o HMAC por cada fila cifrada.
Derivar clave DATA o HMAC por cada búsqueda.

## 5.2-cuater Auto-lock por inactividad

Tras 15 minutos sin interacción del usuario (mousemove, keydown, click):
- Las claves DATA y HMAC se destruyen de memoria.
- La UI muestra pantalla de re-autenticación.
- La sesión no se cierra; solo se suspende el acceso a datos cifrados.
- Tras re-autenticación válida, se re-derivan DATA y HMAC.

---

## **5.3 Campos cifrados**
El SCD debe cifrar:

- importe
- concepto
- descripción
- saldo inicial
- snapshots de saldo
- campos sensibles de tablas auxiliares

---

## **5.4 Campos no cifrados**
El SCD debe mantener sin cifrar:

- fecha
- banco_id
- cuenta_id
- id_clasificacion
- tipo_movimiento
- concepto_hash
- rango_importe
- valor_residual: (declarado no sensible para permitir agregados patrimoniales sin descifrado)

---

## **5.5 Hashes autorizados**
- **HMAC-SHA256(clave_derivada_usuario, valor_normalizado)**  
- Uso: búsquedas por igualdad, ligadas a la clave del usuario — invalida ataques de diccionario/rainbow table entre usuarios y entre exportaciones de la BD.
- No permite LIKE  
- No permite rangos  


## 5.5-bis Normalización de conceptos

Antes de calcular HMAC-SHA256, el concepto se normaliza:

1. Unicode NFC.
2. Trim de espacios iniciales y finales.
3. Colapso de espacios múltiples a un único espacio.
4. Minúsculas.
5. Eliminación de tildes mediante NFD y descarte de marcas diacríticas.

Ejemplo:

"  Recibo   LUZ " → "recibo luz"

La búsqueda por concepto_exacto aplica la misma normalización al texto introducido por el usuario.

---

## **5.6 Prohibiciones cognitivas**
El SCD no puede:

- cifrar campos no definidos como sensibles  
- descifrar datos de otros usuarios  
- generar claves alternativas  
- usar algoritmos no definidos  
- permitir búsquedas sobre campos cifrados  


## 5.7 Estrategia de descifrado para lectura (dashboards)

El descifrado de lectura para renderizado de tarjetas se ejecuta en worker-cifrado.js, nunca en el hilo principal.

## 5.7.1 Caché central por dashboard activo

Al activar un dashboard, el sistema construye una caché central en memoria con los movimientos descifrados compartida por todas las tarjetas del dashboard.

### Responsabilidad de gestión
- La caché es gestionada por `dashboard-standard.js` y `dashboard-custom.js`. Ambos módulos comparten una referencia a la caché activa mediante un objeto de sesión definido en `app.js`.
- `app.js` expone `session.dashboardCache` como punto único de acceso.
- Ningún otro módulo lee ni escribe directamente sobre la caché.


### Construcción
1. Consulta base: una única consulta SQL obtiene movimientos ACTIVO del id_usuario de la sesión, acotados por filtros globales del dashboard (fecha, rango_importe), usando índices autorizados.
2. Descifrado único: las filas cifradas se envían a worker-cifrado.js en lotes de 1000 (según 3.8). El worker devuelve un array de objetos descifrados.
3. Almacenamiento: el array se guarda en memoria con metadatos (id_usuario, dashboard_activo, filtros_globales, timestamp).

### Acceso de tarjetas
- Cada tarjeta recibe referencia a la caché central.
- Aplica filtros específicos (id_grupo, id_subgrupo, tipo) y agregaciones en JS puro.
- No ejecuta SQL ni descifrado individual mientras la caché sea válida.

### Alcance de la caché
La caché central aplica exclusivamente a la tabla movimientos. 
Las tarjetas que necesiten datos de otras tablas (cuentas_bancarias, 
bancos, grupos, catalogo_semantico, saldos_cuenta) deben ejecutar 
sus propias consultas SQL y, si corresponde, descifrar los campos 
sensibles mediante worker-cifrado.js.

La caché de movimientos no impide ni sustituye dichas consultas.

Cuando una tarjeta combine movimientos con otras tablas y la caché 
no contenga todos los movimientos necesarios (por límite de registros 
o filtros globales), la tarjeta debe obtener los datos faltantes 
mediante consultas adicionales respetando las reglas de cifrado 
y rendimiento (5.7.2).

Ejemplo: card_current_balance necesita el histórico completo de 
movimientos por cuenta. Si el filtro global del dashboard es 
"mes actual", la caché no contiene el histórico. La tarjeta debe 
ejecutar su propia consulta de saldos acumulados o usar la tabla 
saldos_cuenta directamente.

### Invalidación
Se invalida y reconstruye en:
- Cambio de filtros globales del dashboard.
- Cambio de dashboard activo.
- Logout o expiración de sesión.
- Modificación de datos subyacentes (importación, edición, borrado).

No se invalida por:
- Cambios de configuración individual de tarjeta.
- Reordenación de tarjetas.
- Cambio de look.

## 5.7.2 Límite de 10.000 registros

Cada caché de dashboard tiene un límite máximo de 10.000 registros descifrados.

Si la consulta base supera este límite, se aplican en orden de prioridad:
1. Agregación previa: para tarjetas gráficas, agrupar en SQL/JS antes del descifrado.
2. Paginación: para tarjetas de tabla, descifrar solo el bloque visible (1.000 filas).
3. Recorte con aviso i18n: si no es posible agregar ni paginar.

## 5.7.3 Persistencia
Ningún dato descifrado se escribe en OPFS, IndexedDB ni LocalStorage. La caché vive exclusivamente en RAM y se libera al invalidarse.

## **5.8 Definición de buckets de `rango_importe`**

`rango_importe` se calcula en el momento de cifrado como `"<signo>_<tramo>"`:

- `signo`: `POS` (importe >= 0) | `NEG` (importe < 0)
- `tramo` sobre valor absoluto, tramos fijos deterministas (en euros):
  `0-10 | 10-50 | 50-100 | 100-250 | 250-500 | 500-1000 | 1000-2500 | 2500-5000 | 5000+`

Ejemplo: importe = -134,20 → `rango_importe = 'NEG_100-250'`.

Implementación: `crypto/rango-importe.js`, función pura `calcularRangoImporte(importe: number): string`, sin dependencias externas, sin acceso a red ni a estado.

El SCD no puede modificar los tramos ni el criterio de signo sin revisión explícita de este PR-SCD.

## 5.8-bis Resolución de buckets en búsquedas por importe

Los tramos usan límite inferior inclusivo y límite superior exclusivo, salvo el último tramo:

POS_0-10: [0, 10)
POS_10-50: [10, 50)
POS_50-100: [50, 100)
POS_100-250: [100, 250)
POS_250-500: [250, 500)
POS_500-1000: [500, 1000)
POS_1000-2500: [1000, 2500)
POS_2500-5000: [2500, 5000)
POS_5000+: [5000, +infinito)

NEG usa los mismos tramos sobre valor absoluto.

Para filtrar por [importe_min, importe_max]:

1. Se separan rangos negativos y positivos.
2. Se calculan buckets NEG cuyo intervalo absoluto se solape con [abs(importe_max), abs(importe_min)] cuando importe_min < 0.
3. Se calculan buckets POS cuyo intervalo se solape con [importe_min, importe_max] cuando importe_max >= 0.
4. SQL usa WHERE rango_importe IN (...).
5. JS descifra el subconjunto y aplica filtro exacto.

Cero:
  importe = 0 se considera POS_0-10.

## **5.9 Representación monetaria determinista

Todo importe del sistema se representa internamente como céntimos enteros con signo.

Prohibido:
Usar float para acumulación contable.
Usar Number como representación final de cálculo monetario.
Mezclar coma decimal y punto decimal en cálculos sin normalizar.

Cifrado:
El payload cifrado de un importe es la cadena UTF-8 del entero de céntimos.
Ejemplo: 1234.56 EUR → "123456"
Ejemplo: -987.05 EUR → "-98705"

Rango_importe:
Se calcula sobre el valor absoluto en céntimos.

Presentación:
El formateo visible se realiza en el último paso mediante i18n y locale autorizado.
La presentación nunca altera el valor interno.

---


# # **6. SISTEMA MULTIUSUARIO (BOUNDARY-USERS)**

## 6.0 Modelo de aislamiento físico (precondición, no funcionalidad)
Este sistema es multiusuario a nivel de **datos** (tabla `usuarios`, cifrado por clave derivada), no a nivel de **proceso**.

Requisito de despliegue obligatorio:
- cada usuario físico ejecuta la app en un perfil de navegador distinto, o
- en la variante Tauri, cada usuario físico ejecuta una instancia bajo su propia cuenta de sistema operativo.

Si dos usuarios comparten perfil de navegador y origen, ambos comparten el mismo `contabilidad.db` en OPFS y cualquiera con acceso a devtools de ese perfil puede leer las filas de `usuarios` de otros, aunque no pueda descifrar su contenido sin la frase derivada de su contraseña. El SCD no puede presentar esto como "aislamiento total" (contradice 6.4 tal como está escrito); debe presentarlo como cifrado por usuario dentro de un almacén compartido.

---

## **6.1 Roles autorizados**
- **A** → Administrador  
- **U** → Usuario  

No existen otros roles.

---

## **6.2 Permisos por rol**

### Administrador (A)
- CRUD completo de tabla `usuarios`  
- No puede ver frases de cifrado  
- No puede descifrar datos de otros usuarios  

### Usuario (U)
- CRUD de sus propias tablas:  
  - preferencias  
  - bancos  
  - cuentas_bancarias  
  - activos  
  - grupos  
  - subgrupos  
  - clasificacion  
- CRUD visual (solo lectura) de:  
  - extractos  
  - norma43  
  - movimientos  


## **6.2-bis Política de bloqueo

Umbral máximo de intentos fallidos: 5.

Al alcanzar 5 intentos fallidos:
  estado = 'B'
  fecha_bloqueo = NOW + 15 minutos

Durante el bloqueo:
  El usuario no puede autenticarse.
  El sistema muestra error AU-003.

Desbloqueo temporal:
  Automático cuando fecha_bloqueo < NOW.
  El estado pasa a 'A' en el siguiente intento válido.

Desbloqueo administrativo:
  Solo perfil A.
  Reinicia intentos_fallidos = 0.
  estado = 'A'.
  fecha_bloqueo = NULL.

Si el único usuario administrador queda bloqueado:
  No existe recuperación automática.
  Debe documentarse en README que la única vía es restaurar backup o reinicializar OPFS.


**Protección del último administrador:**

Antes de ejecutar cualquier cambio de perfil o estado sobre un usuario con perfil 'A':
  El sistema cuenta los usuarios con perfil = 'A' AND estado = 'A'.
  Si el conteo es 1 y la operación afecta a ese usuario:
    Cambio de perfil de 'A' a 'U': bloqueado. Emitir AU-005.
    Cambio de estado de 'A' a 'B': bloqueado. Emitir AU-005.
    Borrado lógico (fecha_baja): bloqueado. Emitir AU-005.
  La validación se ejecuta en la transacción, antes del UPDATE.

---

## **6.3 Campos modificables en tabla `usuarios` por el usuario**
- frase_cifrada  
- idioma  
- look  

---

## **6.4 Aislamiento determinista**
El SCD debe garantizar, dentro de los límites de 6.0:
- cada usuario solo puede DESCIFRAR sus propios datos (garantía criptográfica, real)
- el administrador y otros usuarios no pueden descifrar frases ni contenido cifrado ajeno (garantía criptográfica, real)
- la separación de LECTURA de filas en claro (metadatos no cifrados: fechas, IDs, estados) depende del perfil de navegador separado exigido en 6.0, no es una garantía de esta aplicación


## **6.5 Bootstrap determinista**

Si la tabla usuarios está vacía:
  El sistema muestra flujo de creación inicial.
  Solo puede crearse un usuario con perfil A.
  El usuario se crea con estado A.
  Idioma por defecto: ES.
  Look por defecto: O.
  El sistema genera password_salt, data_salt y frase_datos.
  Tras crear el usuario, se inicializan instancias de dashboards estándar para ese usuario.

Si la tabla usuarios no está vacía:
  No se permite crear usuarios sin autenticación administrativa.
  El flujo de bootstrap queda deshabilitado.


---


# # **7. SISTEMA MULTILENGUAJE (BOUNDARY-I18N)**

---

## **7.1 Idiomas autorizados**
- **ES** — Castellano  
- **CAT** — Catalán  
- **EN** — Inglés  

No existen otros idiomas.

---

## **7.2 Elementos multilenguaje**
El SCD debe obtener textos desde un módulo JSON:

- menús  
- labels  
- títulos  
- botones  
- mensajes de error  
- mensajes de advertencia  
- ejes X/Y de gráficos  
- textos de dashboards  
- textos de preferencias  

---


## 7.2-bis Claves i18n para dashboards y tarjetas estándar

Los nombres de dashboards y tarjetas con `origen='estandar'` o `tipo='estandar'` se almacenan como **claves i18n**, no como texto literal.

Claves autorizadas:

| Clave i18n                 | ES                          | CAT                              | EN                          |
|----------------------------|-----------------------------|----------------------------------|-----------------------------|
| `dashboard_general`        | General                     | General                          | General                     |
| `card_evolution_income`    | Evolución de ingresos (mensual) | Evolució d'ingressos (mensual) | Income evolution (monthly) |
| `card_evolution_expenses`  | Evolución de gastos (mensual)   | Evolució de despeses (mensual) | Expenses evolution (monthly)|
| `card_income_expenses`     | Ingresos vs gastos (mensual)    | Ingressos vs despeses (mensual)| Income vs expenses (monthly)|
| `card_balance_evolution`   | Evolución del saldo (mensual)   | Evolució del saldo (mensual)   | Balance evolution (monthly)|
| `card_movement_search`     | Búsqueda de movimientos         | Cerca de moviments              | Movement search             |
| card_expenses_by_category   |Gasto por categoría (mes actual)|Despesa per categoria (mes actual)|Expenses by category (current month)|
| card_top10_movements        |Top 10 movimientos (mes actual) |Top 10 moviments (mes actual)     |Top 10 movements (current month)|
| card_current_balance        |Saldo actual por cuenta         |Saldo actual per compte           |Current balance by account|

Reglas de resolución:
- Si `catalogo_tarjetas.origen = 'estandar'` → `nombre` es clave i18n.
- Si `catalogo_tarjetas.origen = 'usuario'` → `nombre` es texto libre del usuario.
- Si `dashboards_usuario.tipo = 'estandar'` → `nombre` es clave i18n.
- Si `dashboards_usuario.tipo = 'usuario'` → `nombre` es texto libre del usuario.

Los textos reales se resuelven desde los ficheros `i18n/es.json`, `i18n/cat.json` y `i18n/en.json`


### Claves i18n a definir en los ficheros JSON

Deben añadirse las siguientes entradas en los tres ficheros: `i18n/es.json`, `i18n/cat.json`, `i18n/en.json`.

#### `i18n/es.json`
```json
{
    "dashboard_general": "General",
    "card_evolution_income": "Evolución de ingresos (mensual)",
    "card_evolution_expenses": "Evolución de gastos (mensual)",
    "card_income_expenses": "Ingresos vs gastos (mensual)",
    "card_balance_evolution": "Evolución del saldo (mensual)",
    "card_movement_search": "Búsqueda de movimientos",

    "card_expenses_by_category": "Gasto por categoría (mes actual)",
    "card_top10_movements": "Top 10 movimientos (mes actual)",
    "card_current_balance": "Saldo actual por cuenta"  
}
```

#### `i18n/cat.json`
```json
{
    "dashboard_general": "General",
    "card_evolution_income": "Evolució d'ingressos (mensual)",
    "card_evolution_expenses": "Evolució de despeses (mensual)",
    "card_income_expenses": "Ingressos vs despeses (mensual)",
    "card_balance_evolution": "Evolució del saldo (mensual)",
    "card_movement_search": "Cerca de moviments",
    "card_expenses_by_category": "Despesa per categoria (mes actual)",
    "card_top10_movements": "Top 10 moviments (mes actual)",
    "card_current_balance": "Saldo actual per compte"
}
```

#### `i18n/en.json`
```json
{
    "dashboard_general": "General",
    "card_evolution_income": "Income evolution (monthly)",
    "card_evolution_expenses": "Expenses evolution (monthly)",
    "card_income_expenses": "Income vs expenses (monthly)",
    "card_balance_evolution": "Balance evolution (monthly)",
    "card_movement_search": "Movement search",

    "card_expenses_by_category": "Expenses by category (current month)",
    "card_top10_movements": "Top 10 movements (current month)",
    "card_current_balance": "Current balance by account"
}
```

### Nota sobre resolución en UI

El sistema debe aplicar esta regla de resolución de nombres:

- Si `catalogo_tarjetas.origen = 'estandar'` → el valor de `nombre` es una **clave i18n**.  
- Si `origen = 'usuario'` → `nombre` es texto libre y no se traduce.

Para `dashboards_usuario`:
- Si `tipo = 'estandar'` → `nombre` es clave i18n.  
- Si `tipo = 'usuario'` → `nombre` es texto libre.


## **7.3 Prohibiciones cognitivas**
El SCD no puede:

- añadir idiomas  
- modificar claves  
- generar textos no definidos  
- traducir contenido no incluido en el JSON  

---

## 7.2-ter Precedencia de resolución i18n

Orden de resolución para cualquier texto visible:

1. Si el registro tiene columna nombre_<idioma> NO NULL 
   (catalogo_semantico, catalogo_tipos_grafico): usar ese valor.
2. Si no, buscar clave en i18n/<idioma>.json.
3. Si no existe en JSON, mostrar la clave literal como fallback.

Regla para tarjetas y dashboards estándar:
- catalogo_tarjetas.nombre y dashboards_usuario.nombre con 
  origen/tipo='estandar' son SIEMPRE claves i18n (regla 7.2-bis vigente).
- Las columnas multilenguaje de catálogos (catalogo_semantico, 
  catalogo_tipos_grafico) usan regla 1.

---


# # **8. DASHBOARDS (BOUNDARY-DASH)**


## **8.0 Instancias de dashboards estándar**

- Los dashboards estándar globales son plantillas.
- Cada usuario posee una instancia propia de cada dashboard estándar activo.

**Modificación de dashboards_usuario:**

ALTER TABLE dashboards_usuario
ADD COLUMN id_dashboard_origen INTEGER NULL
REFERENCES dashboards_usuario(id_dashboard);

Nueva semántica:

tipo = 'estandar' AND id_usuario IS NULL:
  Plantilla estándar del sistema.

tipo = 'estandar' AND id_usuario IS NOT NULL:
  Instancia personalizada del usuario.

tipo = 'usuario':
  Dashboard creado por el usuario.

**Materialización:**
En el primer acceso al módulo de dashboards:
Si el usuario no tiene instancia del dashboard estándar:
  BEGIN TRANSACTION;
    INSERT INTO dashboards_usuario
      (id_usuario, tipo, id_dashboard_origen, nombre, bloqueado, estado, orden)
      VALUES (usuario_actual, 'estandar', id_plantilla, clave_i18n, 0, 'A', orden_plantilla);
    INSERT INTO tarjetas_dashboard
      (id_dashboard, id_tarjeta, tamano, color_fondo, orden)
      SELECT last_insert_rowid(), id_tarjeta, tamano, color_fondo, orden
      FROM tarjetas_dashboard
      WHERE id_dashboard = id_plantilla;
  COMMIT;
  Si falla cualquier INSERT: ROLLBACK y emitir DB-017.

  Se copian las filas de tarjetas_dashboard de la plantilla a la instancia.

Customizaciones:

Las customizaciones de tamaño, orden, color, eliminación o adición de tarjetas se guardan sobre la instancia del usuario.
La plantilla global no se modifica.

**Semántica de bloqueado:**

La semántica de `bloqueado` en 8.0 define:
- `bloqueado = 0`: totalmente editable
- `bloqueado = 1`: en instancia de usuario: impide customización

bloqueado = 1 en plantilla estándar global:
  Indica que la plantilla no puede ser eliminada ni desactivada.
  No impide customización de instancias de usuario.

bloqueado = 1 en instancia de usuario:
  Impide customización de layout y definición.
  Solo lectura.

bloqueado = 0:
  Totalmente editable.

Materialización de instancia:
  La instancia de usuario se crea con bloqueado = 0.
  Hereda bloqueado de la plantilla solo si el administrador lo fuerza.

## **8.1 Dashboards estándar**
El sistema incluye dashboards predefinidos.  
El usuario puede customizarlos.

---

## **8.2 Dashboards customizados**
El usuario puede:

- crear  
- copiar  
- borrar  
- renombrar  
- bloquear  
- el usuario solo puede añadir a su dashboard tarjetas donde `origen='estandar'` OR `id_usuario = usuario_actual`. Copiar una estándar = nueva fila en `catalogo_tarjetas` con `origen='usuario'`, `id_usuario=usuario_actual`, `id_tarjeta_origen=id_original`, `configuracion` clonada y editable.

## **8.2.1 Editor básico de tarjetas de usuario**

El usuario puede crear una tarjeta nueva desde cero mediante un formulario básico en `ui/forms/form-tarjeta.js` (nuevo fichero autorizado). Los campos del formulario son:
- `modo_visualizacion`: `grafico` | `tabla`
- `tipo_grafico`: solo si `modo_visualizacion = grafico`; valores de `catalogo_tipos_grafico`
- `nombre`: texto libre (se guarda en el idioma del usuario)
- `configuracion`: generada automáticamente según el tipo:
  - Para `grafico`: elegir métrica (ingreso/gasto/saldo_acumulado) y agrupación (`mensual` o `tipo_semantico`).
  - Para `tabla`: elegir columnas y filtros básicos (fechas, tipo, cuenta, grupo/subgrupo).
- La tarjeta se guarda en `catalogo_tarjetas` con `origen='usuario'`, `id_usuario=usuario_actual`, `id_tarjeta_origen=NULL`.
- La validación de configuración para tarjetas de usuario sigue las mismas reglas que las estándar (8.3.2/8.3.3/8.3.4) pero **permite** literales `id_grupo` e `id_subgrupo`.


## **8.2.2 Personalización de tarjetas en dashboards de usuario**

El usuario puede personalizar las tarjetas de sus dashboards, distinguiendo layout y definición.

### Layout (posición, tamaño, color de fondo)
- Se almacena exclusivamente en tarjetas_dashboard de la instancia del usuario.
- Modificar tamano, color_fondo u orden no afecta a otros usuarios ni a la plantilla estándar.

### Definición (título, tipo de gráfico, configuración)
- Las tarjetas con origen='estandar' son compartidas y no pueden editarse directamente desde un dashboard de usuario.
- Si el usuario desea cambiar título, tipo de gráfico o configuración de una tarjeta estándar, debe copiarla:
  1. Se crea una nueva fila en catalogo_tarjetas con:
     - origen='usuario'
     - id_usuario=usuario_actual
     - id_tarjeta_origen=id_tarjeta de la estándar original
     - configuracion clonada y editable
     - nombre como texto libre.
  2. Se actualiza la fila en tarjetas_dashboard para apuntar a la nueva tarjeta.
  3. A partir de ese momento, la tarjeta es independiente.

### Edición de tarjetas de usuario
- form-tarjeta.js permite crear, editar y eliminar tarjetas con origen='usuario'.
- Antes de eliminar, se verifica que no esté referenciada en tarjetas_dashboard. Si existen referencias, se impide el borrado.

### Restricciones
- El usuario no puede editar ni eliminar tarjetas con origen='estandar'.
- Toda validación (8.3.2/8.3.3/8.3.4) aplica a tarjetas de usuario, permitiendo literales id_grupo/id_subgrupo propios del usuario.

---

## **8.3 Customizaciones permitidas**
- quitar tarjetas  
- cambiar tamaño  
- añadir tarjetas  
- cambiar título  
- cambiar tipo de gráfico  
- cambiar orden  
- cambiar color de fondo  


## ** 8.3-bis Customización semántica de tarjetas estándar**

Las customizaciones de instancia se guardan directamente en tarjetas_dashboard:
- tamano
- orden
- color_fondo

Las customizaciones semánticas de tarjeta son:
- título
- tipo_grafico
- configuracion

Si una customización semántica se aplica sobre una tarjeta estándar:
1. Se crea una nueva fila en catalogo_tarjetas con:
   origen = 'usuario'
   id_usuario = usuario_actual
   id_tarjeta_origen = id_tarjeta_estandar
   nombre = título elegido por el usuario
   configuracion = configuración clonada y modificada
   estado = 'A'
2. La fila de tarjetas_dashboard correspondiente se actualiza para apuntar a la nueva tarjeta.
3. La tarjeta estándar original no se modifica.

Si la customización semántica se aplica sobre una tarjeta de usuario:
Se actualiza directamente la fila propietaria en catalogo_tarjetas.

Las ediciones directas sobre catalogo_tarjetas.origen='estandar' siguen siendo globales y solo están permitidas al administrador según el alcance vigente.

## 8.3.0 Esquema común de configuracion

Toda tarjeta almacena configuracion como JSON válido.

Toda configuracion debe incluir:

{
  "v": 1
}

Validación de escritura:

form-tarjeta.js valida antes de INSERT/UPDATE.
dashboard-standard.js valida antes de render.

Reglas generales:

No se permiten claves con espacios finales.
No se permiten valores fuera de enums autorizados.
Las tarjetas estándar no pueden contener id_grupo ni id_subgrupo literales.
Las tarjetas de usuario pueden contener id_grupo/id_subgrupo solo si pertenecen al usuario actual.

Códigos de error:

UI-020: configuración inválida de tarjeta estándar semántica.
UI-021: configuración inválida de tarjeta de tabla.
UI-022: configuración inválida de tarjeta de evolución temporal.
UI-023: versión de configuración no soportada.
UI-024: resolución semántica ambigua.

## 8.3.0-bis Política de versionado de configuracion

Toda configuracion incluye "v": <entero positivo>.

Reglas de validación:
- dashboard-standard.js y dashboard-custom.js verifican "v" antes de render.
- Si "v" es mayor que la versión soportada por el módulo: emitir UI-023 
  y mostrar estado vacío con mensaje i18n.
- Si "v" es menor: aplicar migración JS pura antes de render.

Migraciones autorizadas (lista cerrada):
- v0 → v1: añadir "v":1 (solo para datos legacy).
- No existen migraciones v1 → v2 en este alcance.

Cualquier modificación de schema de configuracion requiere:
1. Incrementar "v" en nuevas inserciones.
2. Implementar migración en dashboard-standard.js.
3. Documentar en este PR-SCD.

CHECK SQL adicional en catalogo_tarjetas:
  CHECK(json_extract(configuracion, '$.v') IS NOT NULL)
  CHECK(json_type(json_extract(configuracion, '$.v')) = 'integer')
  CHECK(json_extract(configuracion, '$.v') >= 1)

## 8.3.1 Propagación de ediciones sobre tarjetas estándar

Las tarjetas de `catalogo_tarjetas` con `origen='estandar'` se referencian por `id_tarjeta` desde `tarjetas_dashboard` sin copia. Cualquier edición de `configuracion` en el catálogo se propaga de forma inmediata a todas las colocaciones existentes en todos los dashboards de todos los usuarios lógicos que comparten la misma base de datos local (tabla `usuarios`, 6.0) — comportamiento intencional, no un defecto a corregir. No implica sincronización entre instalaciones distintas: no existe backend ni mecanismo de propagación entre orígenes de navegador separados.

Cuando el usuario copia una tarjeta estándar (`id_tarjeta_origen` no nulo, `origen='usuario'`), la copia queda desacoplada: ediciones futuras sobre la estándar original NO afectan a la copia, ni al revés.


## 8.3.2 Validación de configuración de tarjetas estándar por categoría
Toda tarjeta con `origen='estandar'` cuya `configuracion` agrupe por categoría semántica (ver 2.6/8.3) debe validarse antes de renderizado. Esta regla NO aplica a tarjetas de evolución temporal (8.3.4) ni a tarjetas de búsqueda (8.3.3), que no usan `tipo_semantico`.

**Validación mínima determinista:**
- `configuracion` debe ser JSON válido.
- Debe contener `tipo_semantico`.
- Si agregacion = "categoria":
  Debe contener `tipo_semantico`.
  `tipo_semantico` debe existir en `catalogo_semantico` con `estado = 'A'`.
- Si agregacion = "tipo_semantico":
  El gráfico muestra una sección por cada clave de catalogo_semantico con movimientos en el periodo.
- Queda prohibido que una tarjeta estándar contenga literales `id_grupo` o `id_subgrupo`.
- Si la validación falla, el sistema debe emitir un error determinista (`UI-020`) y no renderizar la tarjeta.

La validación se implementa en `ui/dashboards/dashboard-standard.js` mediante un esquema JS simple, sin librerías externas.


**Cuando agregacion = "tipo_semantico":**
- El gráfico circular muestra una sección por cada clave de catalogo_semantico que tenga movimientos asociados en el periodo filtrado.
- Cada sección usa el nombre i18n de la clave semántica.
- No requiere tipo_semantico fijo en configuracion.


## 8.3.3 Validación de configuración de tarjetas de evolución temporal
Toda tarjeta con `origen='estandar'`, `modo_visualizacion='grafico'`, agrupada por `movimientos.tipo` (no por categoría), debe validar `configuracion`:

- Debe contener `agregacion: "mensual"` (único valor autorizado en este alcance).
- Debe contener `series`: array de 1–2 objetos `{tipo_movimiento, operacion}`, donde `tipo_movimiento ∈ {ingreso, gasto, saldo_acumulado}` y `operacion ∈ {suma}` (o `acumulado` para `saldo_acumulado`).
- Si falla, error determinista `UI-022`, no renderizar.

Implementada en `ui/dashboards/dashboard-standard.js`, mismo esquema JS simple que 8.3.2.

Transferencias:
  Los movimientos con tipo = 'transferencia' no se contabilizan 
  en series de ingreso ni gasto.
  Para visualización de transferencias, el usuario debe crear 
  una tarjeta de usuario con tipo_movimiento = 'transferencia'.
  El catálogo estándar no incluye tarjetas de evolución de transferencias.

## 8.3.4 Tarjeta de búsqueda (modo tabla)

`modo_visualizacion='tabla'`, `origen='estandar'`, sin `tipo_semantico` (no aplica 8.3.2).

`configuracion` (JSON):
{
  "campos_busqueda": [
    "fecha_desde", "fecha_hasta",
    "importe_min", "importe_max",
    "tipo",            -- ingreso | gasto | transferencia
    "id_grupo", "id_subgrupo", "id_clasificacion",
    "origen",          -- extracto | manual | norma43 (movimientos manuales no soportados en v1.4)
    "estado",          -- ACTIVO | ANULADO
    "concepto_exacto"  -- igualdad exacta vía hash, NO texto libre (ver 4.6/5.5)
  ],
  "columnas": ["fecha","tipo","concepto","importe","id_grupo","id_subgrupo","id_clasificacion","origen","estado"]
}

Reglas:
- `campos_busqueda` es subconjunto cerrado de la lista anterior; cualquier clave fuera de esa lista invalida la tarjeta (`UI-021`).
- `importe_min`/`importe_max` se resuelven con el algoritmo de 4.6 (bucket + descifrado + filtro exacto) y 5.8 (definición de buckets).
- `concepto_exacto` compara contra `concepto_hash` (HMAC-SHA256, 5.5); no admite coincidencia parcial.
- Tabular mediante Tabulator (4.9.1); resultado siempre acotado por `id_usuario` de la sesión activa.


**Validación de filtro_implicito (opcional en tarjetas de tabla):**

Claves autorizadas:
  periodo: "mes_actual" | "anio_actual" | "ultimo_trimestre"
  orden: "fecha_desc" | "fecha_asc" | "importe_desc" | "importe_asc"
  limite: entero positivo (máximo 1000)
  solo_activas: booleano (para tarjetas de saldo)
Cualquier clave fuera de esta lista invalida la tarjeta (UI-021).

## 8.3.5 Saldo mensual por cuenta
El sistema mantiene snapshots mensuales de saldo por cuenta en `saldos_cuenta`.

Reglas:
- Periodo cerrado: `YYYY-MM`.
- No hay snapshot diario.
- El snapshot representa el saldo después del último movimiento `ACTIVO` del mes para la cuenta.
- El orden determinista del último movimiento es: `fecha`, luego `id_movimiento`.
- Los meses sin movimientos no generan fila en `saldos_cuenta`.
- El saldo se almacena cifrado: `saldo_cifrado` + `iv_saldo`.
- `cuentas_bancarias.saldo_inicial_cifrado` es la semilla cifrada. Si es `NULL`, la semilla es 0.
- La reconciliación con `extractos.saldo_original_cifrado` es obligatoria cuando existe extracto procesado con saldo en o antes del periodo.
- `modo='extracto'` cuando el saldo del snapshot procede directamente de un extracto con `saldo_original_cifrado`.
- `modo='calculado'` cuando el saldo se obtiene desde un extracto de referencia o desde `saldo_inicial_cifrado` más movimientos posteriores.
- Si existe extracto de referencia y el cálculo acumulado no coincide con `extractos.saldo_original_cifrado`, el snapshot se guarda con `estado_conciliacion='DESCUADRE'`.
- El snapshot no se calcula mediante SQL sobre campos cifrados; se calcula en JS tras descifrado y se persiste cifrado.

## 8.3.5-bis Renderizado de meses sin snapshot

saldos_cuenta no genera filas para meses sin movimientos.

Para renderizar card_balance_evolution:

1. Se obtienen los snapshots existentes.
2. Para cada mes sin snapshot, se arrastra el último saldo conocido.
3. El saldo arrastrado es solo de presentación.
4. No se insertan snapshots calculados por este motivo.

Si no existe ningún snapshot ni saldo inicial:
La tarjeta muestra estado vacío.


**Recálculo multi-cuenta en una transacción:**

Cuando una importación o edición afecta movimientos de múltiples cuentas:
  El recálculo se ejecuta por cada id_cuenta afectado, secuencialmente, 
  dentro de la misma transacción SQLite.
  Para cada cuenta:
    1. Se identifica el primer periodo afectado.
    2. Se recalculan snapshots desde ese periodo hasta el último existente.
    3. Se verifica conciliación contra extractos procesados.
  Si el recálculo de cualquier cuenta falla:
    Se hace rollback de toda la transacción.
    Se emite DB-015.

---


## 8.3.6 Estados vacíos de tarjetas con motivo tipificado

Toda tarjeta que no pueda renderizar datos debe mostrar el motivo
específico del estado vacío, nunca un hueco visual genérico.

Motivos autorizados (lista cerrada):

M-01: Grupo semántico no vinculado.
  Condición: tarjeta estándar con tipo_semantico y el usuario
  no tiene ningún grupo activo vinculado a esa clave.
  Presentación: mensaje i18n "no_group_linked" + botón "Vincular grupo"
  que abre el modal de grupos filtrado por la clave semántica.
  Código de error: ninguno (estado informativo).

M-02: Resolución semántica ambigua.
  Condición: existen dos o más grupos activos vinculados a la misma
  clave semántica.
  Presentación: mensaje i18n "ambiguous_semantic" + enlace "Resolver"
  que navega al panel de gestión de grupos.
  Código de error: UI-024.

M-03: Sin movimientos en el periodo filtrado.
  Condición: el usuario tiene grupo(s) válido(s) vinculado(s) pero
  no existen movimientos ACTIVO que coincidan con los filtros
  globales del dashboard y los filtros específicos de la tarjeta.
  Presentación: mensaje i18n "no_movements_in_period" + enlace
  "Ampliar periodo" (si hay filtros de fecha activos) o
  "Cargar extractos" (si no existe ningún movimiento en la cuenta).
  Código de error: ninguno.

M-04: Sin cuentas bancarias activas.
  Condición: el usuario no tiene ninguna cuenta_bancaria con estado='A'.
  Presentación: mensaje i18n "no_active_accounts" + botón "Añadir cuenta"
  que abre form-cuenta.js.
  Código de error: ninguno.
  Aplica a: card_current_balance, card_balance_evolution.

M-05: Configuración inválida.
  Condición: fallo de validación de configuracion (8.3.0, 8.3.2, 8.3.3).
  Presentación: mensaje i18n con el código de error (UI-020/UI-021/UI-022)
  + enlace "Configurar tarjeta" (solo si origen='usuario') o
  "Contactar administrador" (si origen='estandar').
  Código de error: UI-020, UI-021 o UI-022.

M-06: Versión de configuración no soportada.
  Condición: configuracion.v mayor que la versión soportada por el módulo.
  Presentación: mensaje i18n "unsupported_version" + código UI-023.
  Código de error: UI-023.

Reglas de implementación:
  dashboard-standard.js y dashboard-custom.js evalúan los motivos
  en orden M-04 → M-01 → M-02 → M-05 → M-06 → M-03.
  El primer motivo coincidente se renderiza; los demás se ignoran.
  El motivo se transmite al componente card.js mediante una propiedad
  `emptyState: { code: string, message: string, action?: { label, handler } }`.
  card.js renderiza el estado vacío con estilo uniforme:
  icono centrado (--text-muted), mensaje principal, acción opcional
  como botón secundario (--button-secondary-*).

Prohibiciones:
  Mostrar tarjeta completamente en blanco.
  Mostrar "Sin datos" sin especificar motivo.
  Mezclar motivos en un mismo render.

---

## **8.4 Prohibiciones cognitivas**

El SCD no puede:

- añadir filas a `catalogo_tipos_grafico` sin revisión explícita del PR-SCD  
- añadir tarjetas no definidas  
- modificar semántica de dashboards  
- referenciar id_grupo/id_subgrupo literal dentro de configuracion de una tarjeta con origen='estandar'

---


# # **9. EXTRACTOS Y NORMA 43 (BOUNDARY-EXTRACTOS)**

---

## **9.1 Fuentes autorizadas**
- CSV Sabadell  
- CSV Santander  
- Norma 43  

---

## **9.2 Detección automática**
El SCD debe detectar el banco por la cabecera del CSV.

---

## **9.3 Unificación**
El SCD debe unificar:

- extractos  
- norma43  

en la tabla `movimientos`.

La unificación debe conservar trazabilidad determinista:
- movimientos generados desde `extractos` llevan `id_extracto`
- movimientos generados desde `norma43` llevan `id_norma43`
- movimientos manuales no están soportados en v1.4; toda fila de `movimientos` debe proceder de `extractos` o `norma43`. Soporte para movimientos manuales queda reservado para futura ampliación.

Tras la unificación, el SCD recalcula los snapshots de `saldos_cuenta` afectados.

## **9.3-bis Estados de importación**

Cada fila importada se inserta inicialmente en extractos con estado_procesado = 'PENDIENTE'.

Dentro de la misma transacción:
movimientos-builder.js genera el movimiento asociado.
Si la generación es correcta:
  extractos.estado_procesado = 'PROCESADO'
Si la generación falla:
  extractos.estado_procesado = 'ERROR'

Reglas de rollback:

Se hace rollback total si:
- la cabecera es inválida
- el encoding es inválido
- el delimitador no puede determinarse
- no existe ninguna fila válida
- falla la transacción SQLite

No se hace rollback total por filas individuales inválidas:
Estas se excluyen.
Se registran en el resumen de importación.

---

## **9.4 CRUD visual**
El usuario puede visualizar:

- extractos  
- norma43  
- movimientos  

---

## **9.5 Borrado determinista**

Si se borra:
un extracto → se borran movimientos asociados mediante `movimientos.id_extracto`
una norma43 → se borran movimientos asociados mediante `movimientos.id_norma43`

Antes de borrar un extracto o una norma43, el SCD debe eliminar o desvincular los snapshots de `saldos_cuenta` que referencien el registro afectado.
Tras el borrado, el SCD recalcula los snapshots de la cuenta afectada desde el primer periodo afectado hasta el último periodo existente.

## **9.6 Recálculo de saldos mensuales**
El recálculo de `saldos_cuenta` se ejecuta únicamente en `movimientos-builder.js` dentro de la misma transacción SQLite que inserta, actualiza, anula o borra movimientos.

Reglas de recálculo:
- Solo se consideran movimientos `estado='ACTIVO'`.
- Solo se consideran extractos `estado_procesado='PROCESADO'`.
- El periodo se deriva de `movimientos.fecha` como `YYYY-MM`.
- El snapshot se calcula para el último movimiento ACTIVO del mes, ordenado por `fecha` y `id_movimiento`.
- Si el último movimiento del mes está vinculado a un extracto con `saldo_original_cifrado`, el snapshot usa ese saldo y `modo='extracto'`.
- Si el último movimiento del mes no está vinculado a extracto, el snapshot toma el último extracto conciliado anterior o `saldo_inicial_cifrado`, y suma los movimientos posteriores hasta el último movimiento del mes.
- Si existe extracto de referencia, `id_extracto_referencia` apunta a ese extracto.
- Toda discrepancia entre cálculo acumulado y `extractos.saldo_original_cifrado` genera `estado_conciliacion='DESCUADRE'`.
- Los meses sin movimientos no generan snapshot.


- Modificación de saldo inicial:
    Cuando se actualiza cuentas_bancarias.saldo_inicial_cifrado:
      Se determina el primer periodo con snapshot existente.
      Se recalculan todos los snapshots desde ese periodo hasta el último.
      El recálculo se ejecuta en movimientos-builder.js dentro de la misma transacción.

## **9.7 Cabeceras CSV deterministas**
La detección de banco se realiza exclusivamente por normalización de la primera línea del CSV.

Formatos autorizados:

Sabadell:
```csv
"Fecha","Concepto","Movimiento","Importe","Saldo"
```

Santander:
```csv
"Fecha operación","Concepto","Importe","Saldo"
```

Reglas:
- La cabecera debe compararse tras recorte de BOM, normalización Unicode y eliminación de espacios extremos.
- Si la cabecera no coincide exactamente con uno de los formatos autorizados, el fichero se rechaza con error determinista.
- No se permite inferencia por contenido parcial.

## **9.7-bis  Reglas de parseo CSV

Encoding:
  UTF-8.
  Se acepta BOM y se elimina.

Delimitadores autorizados:
  coma
  punto y coma

El delimitador se detecta únicamente en la primera línea.
La cabecera normalizada debe coincidir exactamente.

Quoting:
  Comillas dobles RFC 4180.
  Campos entre comillas pueden contener delimitador.

Formato de fecha autorizado:
  DD/MM/YYYY
  YYYY-MM-DD

Formato de importe autorizado:
  Entero con decimal: 1234,56 o 1234.56
  Miles con decimal: 1.234,56
  Negativo: -1.234,56

Regla decimal:
  Si existe coma y punto, la coma es decimal.
  Si solo existe coma, la coma es decimal.
  Si solo existe punto, el punto es decimal.
  Si no hay separador decimal, el importe es entero.

Cualquier fila con fecha, importe o estructura inválida:
  Se marca como error.
  No se inserta.
  Se incluye en el resumen de importación.

La importación completa se ejecuta en transacción.
Si el número de errores supera el umbral definido, se hace rollback total.

## ** 9.7-ter Regla determinista de importes

Formatos válidos:

1.234,56
1234,56
1234.56
1234
-1.234,56
-1234,56

Reglas:

Si existen coma y punto:
  La coma es decimal.
  El punto es separador de miles.

Si solo existe coma:
  La coma es decimal.

Si solo existe punto:
  Si el valor cumple ^\d{1,3}(\.\d{3})+$:
    El punto es separador de miles.
    El importe no tiene decimales.
  En caso contrario:
    El punto es decimal.

Si no existe separador:
  El importe es entero.

El importe se convierte a céntimos enteros.
Ejemplos:

"1.234"    → 123400
"1.234,56" → 123456
"1234.56"  → 123456
"1234"     → 123400
"-1.234,56"→ -123456

## **9.8 Reglas deterministas autorizadas**

**Sabadell** (cabecera: `"Fecha","Concepto","Movimiento","Importe","Saldo"`)
- La columna `Movimiento` indica el tipo:
  - `"ingreso"` → `ingreso`
  - `"gasto"` → `gasto`
  - `"transferencia"` → `transferencia`
- Si la columna no existe o el valor no coincide, se infiere del signo de `Importe`: positivo → `ingreso`, negativo → `gasto`; `transferencia` no detectable automáticamente.

**Santander** (cabecera: `"Fecha operación","Concepto","Importe","Saldo"`)
- No existe columna de tipo; se infiere del signo de `Importe`:
  - `Importe > 0` → `ingreso`
  - `Importe < 0` → `gasto`
  - `transferencia` no detectable automáticamente; requerirá clasificación manual posterior.

**Norma 43**
- El tipo se infiere del código de operación y del signo del importe según la especificación Norma 43; si no es determinable, se asigna `transferencia` por defecto y queda pendiente de revisión manual.

## **9.8-bis Deduplicación determinista

hash_fila se calcula como:

HMAC-SHA256(
  clave_hmac_usuario,
  id_cuenta | fecha | tipo_o_codigo | importe | rango_importe | concepto_normalizado
)

Durante importación:
  Si hash_fila ya existe para el mismo usuario, la fila se omite.
  La omisión se registra en el resumen de importación.
  No se genera error fatal por duplicado individual.


## 9.8.1 Resumen de importación

Al finalizar una importación, el sistema muestra un resumen con:
- Total de filas leídas.
- Filas válidas insertadas.
- Filas duplicadas omitidas (por hash_fila).
- Filas erróneas.

Para filas erróneas, se muestra una tabla con columnas:
| Columna       | Descripción                                          |
|---------------|------------------------------------------------------|
| num_fila      | Número de fila en el fichero (empezando en 2).      |
| motivo        | Código de error (EXT-001/EXT-002/EXT-003/EXT-004).   |
| dato_original | Texto bruto limitado a 200 caracteres.              |

El usuario puede exportar la tabla de errores a CSV.
La tabla de errores no se persiste en la base de datos.

## 9.9 Condición operativa de Norma 43

Norma 43 queda fuera del alcance implementable de v1.2 hasta que se añada un anexo técnico que defina:
- Codificación del fichero.
- Estructura de registros (cabecera, detalle, fin).
- Validación de cuenta, fecha e importe.
- Mapeo de codigo_operacion a ingreso/gasto/transferencia.
- Reglas de deduplicación.

Mientras el anexo no exista:
- El menú no muestra Norma 43.
- norma43-loader.js devuelve error EXT-006.
- No se generan movimientos desde Norma 43.
- La tabla norma43 existe por compatibilidad futura, pero queda inoperativa.

---


# # **10. MENÚ LATERAL (BOUNDARY-MENU)**

---

## **10.1 Características**
- colapsable  
- resize del ancho  
- iconos cuando está colapsado  
- preferencias guardadas por usuario  
- definido en JSON  
- profundidad máxima: **5 niveles**


## **10.1-bis Schema de menu.json

Cada nodo de menú debe tener:

{
  "id": "string",
  "i18n": "string",
  "icon": "string",
  "route": "string",
  "visible": "admin|user|all",
  "children": []
}

Reglas:

id es único.
i18n debe existir en es.json, cat.json y en.json.
icon debe existir en assets/icons/.
route debe corresponder a un panel autorizado.
Profundidad máxima: 5 niveles.
No se permiten nodos dinámicos fuera de JSON.

## 1-bis-ter Regla de FKs compuestos en tablas particionadas

Toda FK entre tablas particionadas por id_usuario debe ser compuesta, 
incluyendo id_usuario como primera columna.

Regla SQL:
  CREATE UNIQUE INDEX IF NOT EXISTS idx_<padre>_usuario_id 
      ON <padre>(id_usuario, <pk>);
  
  FOREIGN KEY(id_usuario, <fk>) REFERENCES <padre>(id_usuario, <pk>)

Tablas afectadas (lista cerrada):
  cuentas_bancarias  → bancos(id_usuario, id_banco)
  extractos          → cuentas_bancarias(id_usuario, id_cuenta)
  norma43            → cuentas_bancarias(id_usuario, id_cuenta)
  grupos             → usuarios(id_usuario, id_usuario) [trivial]
  subgrupos          → grupos(id_usuario, id_grupo)
  clasificacion      → grupos(id_usuario, id_grupo)
  clasificacion      → subgrupos(id_usuario, id_subgrupo)
  movimientos        → cuentas_bancarias(id_usuario, id_cuenta)
  movimientos        → grupos(id_usuario, id_grupo) [nullable]
  movimientos        → subgrupos(id_usuario, id_subgrupo) [nullable]
  movimientos        → clasificacion(id_usuario, id_clasificacion) [nullable]
  movimientos        → extractos(id_usuario, id_extracto) [nullable]
  movimientos        → norma43(id_usuario, id_norma43) [nullable]
  saldos_cuenta      → cuentas_bancarias(id_usuario, id_cuenta)
  saldos_cuenta      → extractos(id_usuario, id_extracto) [nullable]
  tarjetas_dashboard → dashboards_usuario(id_dashboard)   [FK simple; id_usuario puede ser NULL en plantilla estándar — ver 2.15]
  tarjetas_dashboard → catalogo_tarjetas(id_tarjeta)      [FK simple; id_usuario puede ser NULL en plantilla estándar — ver 2.15]

Nota: los índices únicos compuestos en tablas padre se añaden a los 
existentes, no los sustituyen.

## **10.1-ter Rutas autorizadas de menú

route solo puede tomar valores asociados a módulos autorizados.

**Rutas mínimas:**

panel-usuarios
panel-extractos
panel-norma43         → inoperativa hasta anexo técnico (9.9)
panel-movimientos
panel-preferencias
panel-maestros
dashboard-standard
dashboard-custom

**Reglas:**

Los nodos padre pueden tener route nulo si tienen children.
Los nodos hoja deben tener route válido.
Toda route debe tener un módulo UI responsable.


**Regla para Norma 43 en menu.json:**
- El nodo de menú que referencia panel-norma43 debe incluir:
  "visible": "none"
- hasta que exista el anexo técnico de Norma 43.
- Cuando el anexo se apruebe, se cambia a "visible": "all" o "visible": "user".
- No se elimina el nodo del JSON; solo se oculta.

---

## **10.2 Opciones autorizadas**

### Administrador
- CRUD de usuarios  

### Usuario
- CRUD de sus tablas  
- CRUD visual de extractos, norma43, movimientos  
- carga de extractos  
- dashboards estándar  
- dashboards customizados  

---

## **10.3 Prohibiciones cognitivas**
El SCD no puede:

- añadir opciones  
- añadir niveles  
- modificar estructura  
- alterar semántica  

---


# # **11. ESTRUCTURA DEL PROYECTO (BOUNDARY-FS)**

---

## **11.1 Estructura autorizada**

La estructura de ficheros y directorios válida es la definida en la **sección 3.5 — Estructura de proyecto autorizada**, la cual es la única versión normativa y completa.

A efectos de resumen, la raíz del proyecto contiene los siguientes subdirectorios autorizados:

```
/index.html
/app.js
/app.css
/README.md
/db/
/crypto/
/vendor/
/config/
/i18n/
/ui/
/workers/
/utils/
/assets/
```

El SCD debe consultar la sección 3.5 para el desglose completo de ficheros dentro de cada subdirectorio.

---

## **11.2 Prohibiciones cognitivas**

El SCD no puede:

- añadir carpetas no listadas en 3.5
- eliminar carpetas listadas en 3.5
- renombrar carpetas listadas en 3.5
- modificar rutas definidas en 3.5
- proponer estructuras alternativas
---


# # **12. SINCRONIZACIÓN CON HOST (EXTENSIÓN PROSPECTIVA)**

> **AVISO NORMATIVO:** Este capítulo es **prospectivo**. Define el marco para una funcionalidad de sincronización diferida con un Host central, pero **no está implementado** en la versión actual del sistema. Su inclusión en el PR‑SCD tiene como único objetivo documentar los requisitos de diseño y preparar la arquitectura para una futura ampliación, sin que ello implique desarrollo inmediato.  
>  
> **Estado:** *Pendiente de anexo técnico.*  
> **Código de error asociado (cuando se invoque sin implementación):** `SYNC-000` — *Funcionalidad de sincronización no disponible.*  
> **Equivalente a EXT‑006 para Norma 43.**

---

## **12.1 Objetivo**

Permitir que los datos locales (movimientos, extractos, clasificaciones, etc.) se sincronicen con un **Host remoto** (servidor) de forma **diferida**, en **segundo plano** (background), y a **voluntad del usuario** (manual o automática). La sincronización debe ser:

- **Bidireccional** (local ↔ Host).
- **Asíncrona** (no bloquea la UI).
- **Segura** (los datos sensibles viajan cifrados; las claves de cifrado nunca salen del dispositivo).
- **Resiliente** (cola de cambios pendientes, reintentos ante fallos de red).
- **Configurable** por el usuario (frecuencia, modo manual/automático, etc.).

---

## **12.2 Precondiciones para la implementación**

Para que el módulo de sincronización pueda activarse, deben cumplirse los siguientes requisitos previos (no incluidos en este alcance):

1. **Existencia de un Host** que implemente:
   - Una API REST (o similar) con autenticación.
   - Un modelo de datos compatible con el esquema local (versión ≥ 1.2).
   - Un mecanismo de resolución de conflictos.
2. **Anexo técnico** que defina en detalle:
   - Protocolo de comunicación (HTTP/HTTPS, WebSockets, gRPC).
   - Especificación de endpoints (ej. `POST /sync/upload`, `GET /sync/download`).
   - Formato de intercambio de datos (JSON o binario, con hashes de integridad).
   - Estrategia de autenticación (Bearer token, OAuth2, etc.).
   - Política de versionado de esquema (compatibilidad entre versiones).
   - Mecanismo de detección y resolución de conflictos (ej. *Last Write Wins*, *CRDT*, o manual).
3. **Nuevas tablas y columnas** (definidas en 12.6) para gestionar la cola de sincronización, metadatos y estados.
4. **Actualización de la estructura de proyecto** (sección 3.5) para incluir el subdirectorio `/sync/` y sus módulos.

---

## **12.3 Principios de diseño**

La sincronización debe respetar los siguientes principios deterministas:

### 12.3.1 Inyección de dependencias
- El módulo de sincronización **no** conoce el entorno (navegador/Tauri). Utiliza los adaptadores definidos en `db/adapters.js` (sección 3.10) para toda operación de persistencia y red.
- `sync-manager.js` recibe los adaptadores de persistencia, red y logger mediante inyección desde `app.js`.

### 12.3.2 Cifrado de extremo a extremo
- Los datos se sincronizan **siempre cifrados** con AES‑GCM, utilizando la misma clave derivada (`DATA`) del usuario local.
- El Host **nunca** recibe la clave de cifrado; solo almacena los BLOBs cifrados y los metadatos no sensibles (fechas, hashes, `rango_importe`, etc.).
- La autenticación contra el Host usa un **token independiente** (generado por el Host), no la contraseña local.

### 12.3.3 Cola de cambios persistente
- Toda operación de escritura local (`INSERT`, `UPDATE`, `DELETE`) que deba sincronizarse se registra en una **cola de cambios** (`sync_queue`) dentro de la misma transacción SQLite.
- La cola almacena:
  - `id_registro`, `tabla`, `operacion`, `payload_cifrado` (los datos afectados), `timestamp_local`, `estado` (`PENDIENTE`, `ENVIADO`, `CONFIRMADO`, `ERROR`).
  - Un `id_sync` único para detectar duplicados y resolver conflictos.
- La cola es persistente en disco (tabla SQLite), no en memoria, para resistir reinicios.

### 12.3.4 Procesamiento en background
- La sincronización se ejecuta en un **hilo separado**: en navegador mediante un `Worker` (tipo `module`) y en Tauri mediante un hilo asíncrono con `tauri::async`.
- No bloquea la UI; el usuario recibe notificaciones de progreso (mediante `ui/components/progress.js` o badges).
- El procesamiento se realiza en **lotes** (configurable, ej. 100 registros por ciclo) para evitar saturar la red/CPU.

### 12.3.5 Estrategia de sincronización
- **Diferida por defecto**: los cambios se acumulan en la cola y se envían cuando el Host esté accesible y el usuario lo autorice (o en intervalos programados).
- **Modo manual**: el usuario inicia la sincronización desde el panel de preferencias.
- **Modo automático**: la sincronización se dispara periódicamente (ej. cada 15 minutos) y al detectar conexión a Internet.
- **Backoff exponencial**: en caso de error de red, los reintentos se espacian (1 min, 2 min, 4 min, etc., hasta un máximo de 60 min).

### 12.3.6 Resolución de conflictos
- Se deben detectar conflictos cuando un registro ha sido modificado en el Host y localmente desde la última sincronización.
- **Estrategia base (por definir en anexo)**: se propone *Last Write Wins* usando `timestamp_utc` (el más reciente prevalece), pero se deja abierta a configuración.
- Los conflictos se notifican al usuario para resolución manual (mediante una vista de conflictos en el panel de preferencias).

### 12.3.7 Semántica de borrado
- Un borrado local de un registro se refleja en el Host como un evento `DELETE` en la cola.
- Un borrado en el Host se aplica localmente solo si el registro no ha sido modificado localmente desde la última sincronización; en caso de conflicto, se resuelve según la estrategia definida.

---

## **12.4 Módulos autorizados (cuando se active)**

Se añadirá el subdirectorio `/sync/` con los siguientes ficheros:

```
/sync/
├── sync-manager.js          → Orquestador principal: inicia/detiene sincronización, coordina subida y bajada.
├── sync-queue.js            → Gestión de la cola de cambios: añadir, leer, actualizar estado, limpiar confirmados.
├── sync-conflict.js         → Lógica de detección y resolución de conflictos (según estrategia definida).
├── sync-host-adapter.js     → Adaptador de comunicación con el Host (usa fetch/WebSocket, inyectado desde adapters).
└── sync-scheduler.js        → Control de temporizadores para modo automático (setInterval o similar).
```

**Regla:** todos estos módulos deben implementar la interfaz definida por los adaptadores de plataforma (sección 3.10). No pueden usar APIs de red directamente; usan `hostAdapter` inyectado.

---

## **12.5 Nuevas tablas y columnas**

### 12.5.1 Tabla `sync_queue`

```sql
CREATE TABLE IF NOT EXISTS sync_queue (
    id_sync          INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    tabla            TEXT NOT NULL,          -- 'movimientos', 'extractos', 'clasificacion', ...
    operacion        TEXT NOT NULL CHECK(operacion IN ('INSERT','UPDATE','DELETE')),
    id_registro      INTEGER NOT NULL,       -- id de la fila afectada (ej. id_movimiento)
    payload_cifrado  BLOB NOT NULL,          -- datos completos del registro cifrados con clave DATA
    iv_payload       BLOB NOT NULL,
    timestamp_local  TEXT NOT NULL,           -- ISO-8601 UTC
    estado           TEXT NOT NULL CHECK(estado IN ('PENDIENTE','ENVIADO','CONFIRMADO','ERROR')),
    intentos         INTEGER NOT NULL DEFAULT 0,
    ultimo_error     TEXT,                   -- código de error (SYNC-xxx)
    updated_at       TEXT,

    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_estado ON sync_queue(id_usuario, estado);
CREATE INDEX IF NOT EXISTS idx_sync_queue_timestamp ON sync_queue(id_usuario, timestamp_local);
```

### 12.5.2 Tabla `sync_metadata`

```sql
CREATE TABLE IF NOT EXISTS sync_metadata (
    id_metadata      INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    clave            TEXT NOT NULL,           -- 'ultima_sincronizacion', 'version_host', 'token_host'
    valor_cifrado    BLOB,                    -- opcional (si es sensible)
    iv_valor         BLOB,
    valor_claro      TEXT,                    -- para valores no sensibles (ej. timestamps)
    updated_at       TEXT,

    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_metadata_usuario_clave
    ON sync_metadata(id_usuario, clave);
```

### 12.5.3 Columna adicional en tablas existentes (para detección de conflictos)

Se añadirá **opcionalmente** (cuando se implemente la sincronización) una columna `sync_version` (TEXT, con timestamp UTC o UUID) en las tablas que se sincronicen (ej. `movimientos`, `extractos`, `clasificacion`, `grupos`, etc.).  
Esta columna se actualiza en cada modificación local y se utiliza para comparar con la versión del Host.

> **Nota:** La adición de estas tablas y columnas solo se ejecutará mediante una migración específica (`migrations.sql`) cuando el anexo técnico esté aprobado y se active la funcionalidad.

---

## **12.6 Interacción con el usuario**

### 12.6.1 Panel de preferencias
En `panel-preferencias.js` se añadirá una sección **"Sincronización"** con:

- Estado actual (conectado/desconectado, última sincronización).
- Botón **"Sincronizar ahora"** (modo manual).
- Interruptor **"Sincronización automática"** (ON/OFF).
- Selector de frecuencia (15 min, 30 min, 1 hora, etc.).
- Botón **"Resolver conflictos"** (si existen conflictos pendientes).

### 12.6.2 Notificaciones
- `ui/components/notification.js` (nuevo) mostrará mensajes de progreso y errores de sincronización.
- Un badge en el menú indicará el número de cambios pendientes de enviar.

### 12.6.3 Códigos de error
Nuevo dominio `SYNC-`:

| Código | Descripción |
|--------|-------------|
| `SYNC-000` | Funcionalidad no implementada (anexo técnico pendiente). |
| `SYNC-001` | Host no alcanzable (sin conexión). |
| `SYNC-002` | Autenticación con Host fallida. |
| `SYNC-003` | Conflicto detectado (requiere intervención manual). |
| `SYNC-004` | Payload corrupto o cifrado inválido. |
| `SYNC-005` | Versión de esquema incompatible con Host. |
| `SYNC-006` | Límite de cola de sincronización excedido. |
| `SYNC-007` | Timeout en comunicación con Host. |
| `SYNC-008` | Error en resolución de conflicto (strategy fallida). |

---

## **12.7 Prohibiciones y obligaciones**

- **Prohibido** enviar datos en claro al Host.
- **Prohibido** que el Host tenga acceso a las claves de cifrado del usuario.
- **Prohibido** bloquear la UI durante la sincronización.
- **Prohibido** sincronizar datos de un usuario lógico diferente al autenticado localmente.
- **Obligatorio** que el usuario pueda desactivar la sincronización en cualquier momento.
- **Obligatorio** que la cola de cambios preserve el orden de operaciones por usuario para evitar inconsistencias.

---

## **12.8 Relación con el resto del sistema**

- El módulo de sincronización **es independiente** de los paneles de visualización y de los dashboards. No modifica la lógica de renderizado.
- `movimientos-builder.js` (sección 9.3) debe registrar en `sync_queue` las operaciones que genera (INSERT, UPDATE, DELETE) para que sean sincronizadas.
- `extractos-loader.js` y `norma43-loader.js` también deben encolar los cambios.
- El recálculo de `saldos_cuenta` (9.6) se sincroniza a través de las operaciones de `movimientos` que lo disparan; no se encola directamente.

---

## **12.9 Estado actual y hoja de ruta**

- **Estado actual (v1.5):** Solo existe este capítulo como declaración de intenciones. No hay código implementado.
- **Próximo paso:** Redactar un anexo técnico detallado (similar al que se requiere para Norma 43) que especifique protocolo, endpoints, formato de datos y política de conflictos.
- **Una vez aprobado el anexo:** Se procederá a la implementación del módulo `/sync/`, las nuevas tablas y la integración con los puntos de escritura del sistema.

---
