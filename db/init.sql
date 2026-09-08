
-- ============================================================
-- PR-SCD v1.5 — Esquema completo para Fase 1
-- ============================================================
-- Motor: SQLite >= 3.38.0
-- Versionado: PRAGMA user_version = 2 (v1.5)
-- ============================================================

-- 1. TABLAS (18 tablas)

-- 1.1 Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario            INTEGER PRIMARY KEY,
    nombre                TEXT NOT NULL,
    email                 TEXT NOT NULL COLLATE NOCASE,
    frase_cifrada         BLOB NOT NULL,         -- CIFRADO
    iv_frase              BLOB NOT NULL,         -- IV
    fecha_creacion        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),         -- ISO-8601: YYYY-MM-DD HH:MM:SS
    fecha_ultimo_acceso   TEXT,                  -- ISO-8601: YYYY-MM-DD HH:MM:SS
    password_hash         TEXT NOT NULL,         -- PBKDF2 (ver 5.1/5.2)
    password_salt         BLOB NOT NULL,
    intentos_fallidos     INTEGER NOT NULL DEFAULT 0 CHECK(intentos_fallidos >= 0),
    estado                CHAR(1) NOT NULL CHECK(estado IN ('A','B')),   -- A=Activo, B=Bloqueado
    perfil                CHAR(1) NOT NULL CHECK(perfil IN ('A','U')),   -- A=Admin, U=Usuario
    idioma                CHAR(3) NOT NULL CHECK(idioma IN ('ES','CAT','EN')),
    look                  CHAR(1) NOT NULfL CHECK(look IN ('C','O')),     -- C=Claro, O=Oscuro
    fecha_baja            TEXT,
    fecha_bloqueo         TEXT,
    data_salt             BLOB NOT NULL,
    updated_at            TEXT,

    CHECK(email = lower(email))
);

-- 1.2 Preferencias
CREATE TABLE IF NOT EXISTS preferencias (
    id_preferencia   INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    clave            TEXT NOT NULL,
    valor_cifrado    BLOB NOT NULL,   -- CIFRADO
    iv_valor         BLOB NOT NULL,   -- IV
    updated_at       TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

-- 1.3 Bancos
CREATE TABLE IF NOT EXISTS bancos (
    id_banco         INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    nombre           TEXT NOT NULL,
    codigo_entidad   TEXT CHECK(
        codigo_entidad IS NULL 
        OR codigo_entidad GLOB '[0-9][0-9][0-9][0-9]' 
        OR codigo_entidad GLOB '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
    ),
    iban_prefijo     TEXT,
    estado           CHAR(1) NOT NULL CHECK(estado IN ('A','I')), -- I: Inactivo
    fecha_baja       DATE,
    updated_at       TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

-- 1.4 Cuentas bancarias
CREATE TABLE IF NOT EXISTS cuentas_bancarias (
    id_cuenta                INTEGER PRIMARY KEY,
    id_usuario               INTEGER NOT NULL,
    id_banco                 INTEGER NOT NULL,
    iban                     TEXT NOT NULL COLLATE NOCASE,
    descripcion              TEXT,
    saldo_inicial_cifrado    BLOB,              -- CIFRADO; NULL equivale a saldo inicial 0
    iv_saldo_inicial         BLOB,              -- IV
    estado                   CHAR(1) NOT NULL CHECK(estado IN ('A','I')), -- I: Inactivo
    fecha_baja               DATE,
    updated_at               TEXT,
    CHECK(
        (saldo_inicial_cifrado IS NULL AND iv_saldo_inicial IS NULL)
        OR
        (saldo_inicial_cifrado IS NOT NULL AND iv_saldo_inicial IS NOT NULL)
    ),
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_banco) REFERENCES bancos(id_usuario, id_banco)
);

-- 1.5 Activos
CREATE TABLE IF NOT EXISTS activos (
    id_activo                     INTEGER PRIMARY KEY,
    id_usuario                    INTEGER NOT NULL,
    tipo                          TEXT NOT NULL CHECK(tipo IN ('inmueble','vehiculo','terreno','parking')),
    descripcion                   TEXT,
    indicador_alquiler_habitaciones INTEGER CHECK(indicador_alquiler_habitaciones IN (0,1)),
    indicador_amortizacion        INTEGER CHECK(indicador_amortizacion IN (0,1)),
    fecha_compra                  TEXT CHECK(fecha_compra IS NULL OR fecha_compra GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    valor_residual                REAL CHECK(valor_residual IS NULL OR valor_residual >= 0),
    anos_amortizacion             INTEGER CHECK(anos_amortizacion IS NULL OR anos_amortizacion > 0),
    estado                        CHAR(1) NOT NULL CHECK(estado IN ('A','I')), -- I: Inactivo
    fecha_baja                    DATE,
    updated_at                    TEXT,
 
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario)
);

-- 1.6 Catalogo semantico
CREATE TABLE IF NOT EXISTS catalogo_semantico (
    id_semantico  INTEGER PRIMARY KEY,
    clave         TEXT NOT NULL UNIQUE,   -- Ej: 'ALIMENTACION'
    nombre_es     TEXT NOT NULL,          -- Ej: 'Alimentación'
    nombre_cat    TEXT,                   -- Ej: 'Alimentació'
    nombre_en     TEXT,                   -- Ej: 'Food & Groceries'
    icono         TEXT DEFAULT 'default', -- Nombre del icono SVG en assets/icons/
    orden         INTEGER NOT NULL DEFAULT 0,
    estado        CHAR(1) NOT NULL CHECK(estado IN ('A','I'))
);

-- 1.7 Catalogo tipos grafico
CREATE TABLE IF NOT EXISTS catalogo_tipos_grafico (
    clave         TEXT PRIMARY KEY,      -- Ej: 'linea'
    nombre_es     TEXT NOT NULL,
    nombre_cat    TEXT,
    nombre_en     TEXT,
    icono         TEXT,
    orden         INTEGER NOT NULL DEFAULT 0,
    estado        CHAR(1) NOT NULL CHECK(estado IN ('A','I')),
    seleccionable INTEGER NOT NULL DEFAULT 1 CHECK(seleccionable IN (0,1))
);

-- 1.8 Grupos
CREATE TABLE IF NOT EXISTS grupos (
    id_grupo         INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    nombre           TEXT NOT NULL,
    id_semantico     INTEGER,              -- NULL = grupo libre del usuario
    estado           CHAR(1) NOT NULL CHECK(estado IN ('A','I')),
    fecha_baja       TEXT,
    updated_at       TEXT,
    FOREIGN KEY(id_usuario)   REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_semantico) REFERENCES catalogo_semantico(id_semantico)
);

-- 1.9 Subgrupos
CREATE TABLE IF NOT EXISTS subgrupos (
    id_subgrupo      INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    id_grupo         INTEGER NOT NULL,
    nombre           TEXT NOT NULL,
    estado           CHAR(1) NOT NULL CHECK(estado IN ('A','I')),
    fecha_baja       TEXT,
    updated_at       TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_grupo) REFERENCES grupos(id_usuario, id_grupo)
);

-- 1.10 Clasificacion
CREATE TABLE IF NOT EXISTS clasificacion (
    id_clasificacion  INTEGER PRIMARY KEY,
    id_usuario        INTEGER NOT NULL,
    id_grupo          INTEGER NOT NULL,
    id_subgrupo       INTEGER NOT NULL,
    concepto_cifrado  BLOB NOT NULL,
    concepto_hash     TEXT NOT NULL,
    iv_concepto       BLOB NOT NULL,
    estado            CHAR(1) NOT NULL CHECK(estado IN ('A','I')), -- I: Inactivo
    fecha_baja        DATE,
    updated_at        TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_grupo)    REFERENCES grupos(id_usuario, id_grupo),
    FOREIGN KEY(id_usuario, id_subgrupo) REFERENCES subgrupos(id_usuario, id_subgrupo)
);

-- 1.11 Extractos
CREATE TABLE IF NOT EXISTS extractos (
    id_extracto                INTEGER PRIMARY KEY,
    id_usuario                 INTEGER NOT NULL,
    id_cuenta                  INTEGER NOT NULL,
    fecha                      TEXT NOT NULL CHECK(fecha GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    concepto_original_cifrado  BLOB NOT NULL,
    concepto_original_hash     TEXT NOT NULL,
    importe_original_cifrado   BLOB NOT NULL,

    -- HASH determinista de bucket
    rango_importe              TEXT NOT NULL CHECK(rango_importe IN (
        'POS_0-10','POS_10-50','POS_50-100','POS_100-250','POS_250-500',
        'POS_500-1000','POS_1000-2500','POS_2500-5000','POS_5000+',
        'NEG_0-10','NEG_10-50','NEG_50-100','NEG_100-250','NEG_250-500',
        'NEG_500-1000','NEG_1000-2500','NEG_2500-5000','NEG_5000+'
    )),

    saldo_original_cifrado     BLOB NOT NULL,   -- CIFRADO

    iv_concepto                BLOB NOT NULL,
    iv_importe                 BLOB NOT NULL,
    iv_saldo                   BLOB NOT NULL,
    estado_procesado           TEXT NOT NULL CHECK(estado_procesado IN ('PENDIENTE','PROCESADO','ERROR')),
    hash_fila                  TEXT NOT NULL,
    updated_at                 TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_cuenta) REFERENCES cuentas_bancarias(id_usuario, id_cuenta)
);

-- 1.12 Norma43
CREATE TABLE IF NOT EXISTS norma43 (
    id_norma43        INTEGER PRIMARY KEY,
    id_usuario        INTEGER NOT NULL,
    id_cuenta         INTEGER NOT NULL,
    fecha             TEXT NOT NULL CHECK(fecha GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    codigo_operacion  TEXT NOT NULL,
    importe_cifrado   BLOB NOT NULL,
    rango_importe     TEXT NOT NULL CHECK(rango_importe IN (
        'POS_0-10','POS_10-50','POS_50-100','POS_100-250','POS_250-500',
        'POS_500-1000','POS_1000-2500','POS_2500-5000','POS_5000+',
        'NEG_0-10','NEG_10-50','NEG_50-100','NEG_100-250','NEG_250-500',
        'NEG_500-1000','NEG_1000-2500','NEG_2500-5000','NEG_5000+'
    )),

    concepto_cifrado  BLOB NOT NULL,   -- CIFRADO
    concepto_hash     TEXT NOT NULL,   -- HASH

    iv_concepto       BLOB NOT NULL,
    iv_importe        BLOB NOT NULL,
    estado_procesado  TEXT NOT NULL CHECK(estado_procesado IN ('PENDIENTE','PROCESADO','ERROR')),
    hash_fila         TEXT NOT NULL,
    updated_at        TEXT,
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_cuenta) REFERENCES cuentas_bancarias(id_usuario, id_cuenta)
);

-- 1.13 Movimientos
CREATE TABLE IF NOT EXISTS movimientos (
    id_movimiento       INTEGER PRIMARY KEY,
    id_usuario          INTEGER NOT NULL,
    id_cuenta           INTEGER NOT NULL,
    fecha               TEXT NOT NULL CHECK(fecha GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
    tipo                TEXT NOT NULL CHECK(tipo IN ('ingreso','gasto','transferencia')),
    id_grupo            INTEGER,
    id_subgrupo         INTEGER,
    id_clasificacion    INTEGER,
    importe_cifrado     BLOB NOT NULL,
    rango_importe       TEXT NOT NULL CHECK(rango_importe IN (
        'POS_0-10','POS_10-50','POS_50-100','POS_100-250','POS_250-500',
        'POS_500-1000','POS_1000-2500','POS_2500-5000','POS_5000+',
        'NEG_0-10','NEG_10-50','NEG_50-100','NEG_100-250','NEG_250-500',
        'NEG_500-1000','NEG_1000-2500','NEG_2500-5000','NEG_5000+'
    )),

    concepto_cifrado    BLOB NOT NULL,   -- CIFRADO
    concepto_hash       TEXT NOT NULL,   -- HASH
    descripcion_cifrada BLOB,            -- CIFRADO

    iv_importe          BLOB NOT NULL,
    iv_concepto         BLOB NOT NULL,
    iv_descripcion      BLOB,
    id_extracto         INTEGER,
    id_norma43          INTEGER,
    origen              TEXT NOT NULL CHECK(origen IN ('extracto','norma43','manual')),
    estado              TEXT NOT NULL CHECK(estado IN ('ACTIVO','ANULADO')),
    updated_at          TEXT,
    CHECK(origen <> 'extracto' OR id_extracto IS NOT NULL),
    CHECK(origen <> 'norma43' OR id_norma43 IS NOT NULL),
    CHECK(origen <> 'manual' OR (id_extracto IS NULL AND id_norma43 IS NULL)),
    CHECK(
        (descripcion_cifrada IS NULL AND iv_descripcion IS NULL)
        OR
        (descripcion_cifrada IS NOT NULL AND iv_descripcion IS NOT NULL)
    ),
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_cuenta) REFERENCES cuentas_bancarias(id_usuario, id_cuenta),
    FOREIGN KEY(id_usuario, id_grupo) REFERENCES grupos(id_usuario, id_grupo),
    FOREIGN KEY(id_usuario, id_subgrupo) REFERENCES subgrupos(id_usuario, id_subgrupo),
    FOREIGN KEY(id_usuario, id_clasificacion) REFERENCES clasificacion(id_usuario, id_clasificacion),
    FOREIGN KEY(id_usuario, id_extracto) REFERENCES extractos(id_usuario, id_extracto),
    FOREIGN KEY(id_usuario, id_norma43) REFERENCES norma43(id_usuario, id_norma43)
);

-- 1.14 Dashboards usuario
CREATE TABLE IF NOT EXISTS dashboards_usuario (
    id_dashboard         INTEGER PRIMARY KEY,
    id_usuario       INTEGER,   -- NULL = dashboard estándar global
    id_dashboard_origen  INTEGER,
    nombre           TEXT NOT NULL,  -- Si tipo='estandar': clave i18n; si tipo='usuario': texto libre
    nombre_override      TEXT,
    tipo                 TEXT NOT NULL CHECK(tipo IN ('estandar','usuario')),
    bloqueado            INTEGER NOT NULL DEFAULT 0 CHECK(bloqueado IN (0,1)),
    orden                INTEGER NOT NULL,
    estado           CHAR(1) NOT NULL CHECK(estado IN ('A','I')), -- I: Inactivo
    fecha_baja           DATE,
    updated_at           TEXT,
    CHECK(
        (tipo = 'estandar' AND id_usuario IS NULL AND id_dashboard_origen IS NULL)
        OR
        (tipo = 'estandar' AND id_usuario IS NOT NULL AND id_dashboard_origen IS NOT NULL)
        OR
        (tipo = 'usuario' AND id_usuario IS NOT NULL AND id_dashboard_origen IS NULL)
    ),
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_dashboard_origen) REFERENCES dashboards_usuario(id_dashboard)
);

-- 1.15 Catalogo tarjetas
CREATE TABLE IF NOT EXISTS catalogo_tarjetas (
    id_tarjeta          INTEGER PRIMARY KEY,
    id_usuario          INTEGER,              -- NULL = tarjeta estándar del sistema
    origen              TEXT NOT NULL CHECK(origen IN ('estandar','usuario')),
    modo_visualizacion  TEXT NOT NULL CHECK(modo_visualizacion IN ('grafico','tabla')),
    tipo_grafico        TEXT,
    nombre              TEXT NOT NULL,

    configuracion       TEXT NOT NULL,        -- JSON: filtros, agregación, columnas.
                                            -- Si origen='estandar': prohibido literal id_grupo/id_subgrupo.
                                            -- Debe usar clave "tipo_semantico": "<valor>", resuelta en
                                            -- tiempo de render contra grupos/subgrupos del usuario actual
                                            -- que tengan ese tipo_semantico. Si el usuario no tiene ningún
                                            -- grupo con ese tipo_semantico, la tarjeta muestra estado vacío,
                                            -- nunca error, y ofrece enlace para vincular un grupo existente.
                                            -- Si origen='usuario': permite id_grupo/id_subgrupo literal.

    id_tarjeta_origen   INTEGER,
    estado              CHAR(1) NOT NULL CHECK(estado IN ('A','I')), -- I: Inactivo
    fecha_baja          DATE,
    updated_at          TEXT,
    CHECK(
         (origen = 'estandar' AND id_usuario IS NULL)
         OR
         (origen = 'usuario' AND id_usuario IS NOT NULL)
     ),
     CHECK(
         (modo_visualizacion = 'grafico' AND tipo_grafico IS NOT NULL)
         OR
         (modo_visualizacion = 'tabla' AND tipo_grafico IS NULL)
     ),
     CHECK(json_valid(configuracion)),
     CHECK(json_extract(configuracion, '$.v') IS NOT NULL),
     CHECK(json_type(json_extract(configuracion, '$.v')) = 'integer'),
     CHECK(json_extract(configuracion, '$.v') >= 1),
    FOREIGN KEY(tipo_grafico) REFERENCES catalogo_tipos_grafico(clave),
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_tarjeta_origen) REFERENCES catalogo_tarjetas(id_tarjeta)
);

-- 1.16 Tarjetas dashboard
CREATE TABLE IF NOT EXISTS tarjetas_dashboard (
    id_instancia   INTEGER PRIMARY KEY,
    id_dashboard   INTEGER NOT NULL,
    id_tarjeta     INTEGER NOT NULL,
    tamano         TEXT NOT NULL CHECK(tamano IN ('1x1','2x1','1x2','2x2')),
    color_fondo    TEXT NOT NULL CHECK(color_fondo GLOB '#[0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F][0-9a-fA-F]'),
    orden          INTEGER NOT NULL,
    updated_at     TEXT,
    FOREIGN KEY(id_dashboard) REFERENCES dashboards_usuario(id_dashboard),
    FOREIGN KEY(id_tarjeta)   REFERENCES catalogo_tarjetas(id_tarjeta)
);

-- 1.17 Saldos cuenta
CREATE TABLE IF NOT EXISTS saldos_cuenta (
    id_saldo                  INTEGER PRIMARY KEY,
    id_usuario                INTEGER NOT NULL,
    id_cuenta                 INTEGER NOT NULL,
    periodo                   TEXT NOT NULL CHECK(periodo GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
    fecha_ultimo_movimiento   TEXT NOT NULL CHECK(fecha_ultimo_movimiento GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),

    saldo_cifrado             BLOB NOT NULL,   -- CIFRADO
    iv_saldo                  BLOB NOT NULL,   -- IV
    
    modo                      TEXT NOT NULL CHECK(modo IN ('extracto','calculado')),
    id_extracto_referencia    INTEGER,
    estado_conciliacion       TEXT NOT NULL DEFAULT 'OK' CHECK(estado_conciliacion IN ('OK','DESCUADRE')),
    updated_at                TEXT,
    CHECK(modo = 'calculado' OR id_extracto_referencia IS NOT NULL),
    FOREIGN KEY(id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY(id_usuario, id_cuenta) REFERENCES cuentas_bancarias(id_usuario, id_cuenta),
    FOREIGN KEY(id_usuario, id_extracto_referencia) REFERENCES extractos(id_usuario, id_extracto)
);

-- 1.18 Catalogo tokens
CREATE TABLE IF NOT EXISTS catalogo_tokens (
    id_token         INTEGER PRIMARY KEY,
    id_usuario       INTEGER NOT NULL,
    id_clasificacion INTEGER NOT NULL,
    token_hash       TEXT NOT NULL,
    FOREIGN KEY(id_usuario, id_clasificacion) 
        REFERENCES clasificacion(id_usuario, id_clasificacion)
);


-- ============================================================
-- 2. ÍNDICES (Claves únicas y de rendimiento)
-- ============================================================

-- Usuarios
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Preferencias
CREATE UNIQUE INDEX IF NOT EXISTS idx_preferencias_usuario_clave ON preferencias(id_usuario, clave);

-- Bancos
CREATE INDEX IF NOT EXISTS idx_bancos_usuario_estado ON bancos(id_usuario, estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bancos_usuario_id ON bancos(id_usuario, id_banco);

-- Cuentas
CREATE INDEX IF NOT EXISTS idx_cuentas_usuario_estado ON cuentas_bancarias(id_usuario, estado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cuentas_usuario_iban ON cuentas_bancarias(id_usuario, iban) WHERE estado = 'A';
CREATE UNIQUE INDEX IF NOT EXISTS idx_cuentas_usuario_id ON cuentas_bancarias(id_usuario, id_cuenta);

-- Activos
CREATE INDEX IF NOT EXISTS idx_activos_usuario_tipo ON activos(id_usuario, tipo);

-- Grupos
CREATE INDEX IF NOT EXISTS idx_grupos_usuario_semantico ON grupos(id_usuario, id_semantico);
CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_usuario_semantico_activo ON grupos(id_usuario, id_semantico) WHERE id_semantico IS NOT NULL AND estado = 'A';
CREATE UNIQUE INDEX IF NOT EXISTS idx_grupos_usuario_id ON grupos(id_usuario, id_grupo);

-- Subgrupos
CREATE INDEX IF NOT EXISTS idx_subgrupos_usuario_grupo ON subgrupos(id_usuario, id_grupo);
CREATE UNIQUE INDEX IF NOT EXISTS idx_subgrupos_usuario_id ON subgrupos(id_usuario, id_subgrupo);

-- Clasificacion
CREATE INDEX IF NOT EXISTS idx_clasificacion_usuario_hash ON clasificacion(id_usuario, concepto_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clasificacion_usuario_hash_activo ON clasificacion(id_usuario, concepto_hash) WHERE estado = 'A';
CREATE UNIQUE INDEX IF NOT EXISTS idx_clasificacion_usuario_id ON clasificacion(id_usuario, id_clasificacion);

-- Extractos
CREATE INDEX IF NOT EXISTS idx_extractos_usuario_fecha ON extractos(id_usuario, fecha);
CREATE INDEX IF NOT EXISTS idx_extractos_usuario_procesado ON extractos(id_usuario, estado_procesado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_extractos_usuario_hash_fila ON extractos(id_usuario, hash_fila);
CREATE UNIQUE INDEX IF NOT EXISTS idx_extractos_usuario_id ON extractos(id_usuario, id_extracto);

-- Norma43
CREATE INDEX IF NOT EXISTS idx_norma43_usuario_fecha ON norma43(id_usuario, fecha);
CREATE INDEX IF NOT EXISTS idx_norma43_usuario_procesado ON norma43(id_usuario, estado_procesado);
CREATE UNIQUE INDEX IF NOT EXISTS idx_norma43_usuario_hash_fila ON norma43(id_usuario, hash_fila);
CREATE UNIQUE INDEX IF NOT EXISTS idx_norma43_usuario_id ON norma43(id_usuario, id_norma43);

-- Movimientos
CREATE UNIQUE INDEX IF NOT EXISTS uq_movimientos_usuario_extracto ON movimientos(id_usuario, id_extracto) WHERE id_extracto IS NOT NULL AND estado = 'ACTIVO';
CREATE UNIQUE INDEX IF NOT EXISTS uq_movimientos_usuario_norma43 ON movimientos(id_usuario, id_norma43) WHERE id_norma43 IS NOT NULL AND estado = 'ACTIVO';
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_tipo ON movimientos(id_usuario, tipo);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_extracto ON movimientos(id_usuario, id_extracto);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_norma43 ON movimientos(id_usuario, id_norma43);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_fecha ON movimientos(id_usuario, fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_rango ON movimientos(id_usuario, rango_importe);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_grupo ON movimientos(id_usuario, id_grupo);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_subgrupo ON movimientos(id_usuario, id_subgrupo);
CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_clasificacion ON movimientos(id_usuario, id_clasificacion);

-- Dashboards
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboards_usuario_instancia_unica ON dashboards_usuario(id_usuario, id_dashboard_origen) WHERE id_dashboard_origen IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboards_estandar_nombre ON dashboards_usuario(nombre) WHERE tipo = 'estandar' AND id_usuario IS NULL;
CREATE INDEX IF NOT EXISTS idx_dashboards_usuario_orden ON dashboards_usuario(id_usuario, orden);

-- Catalogo tarjetas
CREATE INDEX IF NOT EXISTS idx_catalogo_tarjetas_origen ON catalogo_tarjetas(origen, id_usuario);
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogo_tarjetas_estandar_nombre ON catalogo_tarjetas(nombre) WHERE origen = 'estandar' AND id_usuario IS NULL;

-- Tarjetas dashboard
CREATE UNIQUE INDEX IF NOT EXISTS idx_tarjetas_dashboard_dashboard_orden ON tarjetas_dashboard(id_dashboard, orden);

-- Saldos
CREATE UNIQUE INDEX IF NOT EXISTS idx_saldos_cuenta_usuario_cuenta_periodo ON saldos_cuenta(id_usuario, id_cuenta, periodo);

-- Tokens
CREATE INDEX IF NOT EXISTS idx_tokens_usuario_hash ON catalogo_tokens(id_usuario, token_hash);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_usuario_clasif_token ON catalogo_tokens(id_usuario, id_clasificacion, token_hash);


-- ============================================================
-- 3. VISTAS AUXILIARES (10 vistas)
-- ============================================================

CREATE VIEW IF NOT EXISTS v_usuarios_activos AS SELECT * FROM usuarios WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_bancos_activos AS SELECT * FROM bancos WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_cuentas_activas AS SELECT * FROM cuentas_bancarias WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_activos_activos AS SELECT * FROM activos WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_grupos_activos AS SELECT * FROM grupos WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_subgrupos_activos AS SELECT * FROM subgrupos WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_clasificacion_activa AS SELECT * FROM clasificacion WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_movimientos_activos AS SELECT * FROM movimientos WHERE estado = 'ACTIVO';
CREATE VIEW IF NOT EXISTS v_dashboards_usuario_activos AS SELECT * FROM dashboards_usuario WHERE estado = 'A' AND fecha_baja IS NULL;
CREATE VIEW IF NOT EXISTS v_catalogo_tarjetas_activas AS SELECT * FROM catalogo_tarjetas WHERE estado = 'A' AND fecha_baja IS NULL;


-- ============================================================
-- 4. SEEDS (Datos iniciales del sistema)
-- ============================================================

-- 4.1 Catalogo semantico (12 filas)
INSERT OR IGNORE INTO catalogo_semantico (id_semantico, clave, nombre_es, nombre_cat, nombre_en, icono, orden, estado) VALUES
(1,  'ALIMENTACION',  'Alimentación',       'Alimentació',        'Food & Groceries',   'cart',      1,  'A'),
(2,  'VIVIENDA',      'Vivienda',           'Habitatge',          'Housing',            'home',      2,  'A'),
(3,  'TRANSPORTE',    'Transporte',         'Transport',          'Transport',          'car',       3,  'A'),
(4,  'SALUD',         'Salud',              'Salut',              'Health',             'heart',     4,  'A'),
(5,  'OCIO',          'Ocio',               'Oci',                'Leisure',            'game',      5,  'A'),
(6,  'NOMINA',        'Nómina',             'Nòmina',             'Payroll',            'wallet',    6,  'A'),
(7,  'FACTURA',       'Factura',            'Factura',            'Invoice',            'file',      7,  'A'),
(8,  'IMPUESTO',      'Impuestos',          'Impostos',           'Taxes',              'bank',      8,  'A'),
(9,  'TRANSFERENCIA', 'Transferencia',      'Transferència',      'Transfer',           'exchange',  9,  'A'),
(10, 'EDUCACION',     'Educación',          'Educació',           'Education',          'book',      10, 'A'),
(11, 'AHORRO',        'Ahorro e Inversión', 'Estalvi i Inversió', 'Savings & Invest.',  'chart',     11, 'A'),
(12, 'SEGURO',        'Seguros',            'Assegurances',       'Insurance',          'shield',    12, 'A');

-- 4.2 Catalogo tipos grafico (5 filas)
INSERT OR IGNORE INTO catalogo_tipos_grafico (clave, nombre_es, nombre_cat, nombre_en, orden, estado, seleccionable) VALUES
('linea',      'Línea',      'Línia',      'Line',      1, 'A', 1),
('barra',      'Barra',      'Barra',      'Bar',       2, 'A', 1),
('circular',   'Circular',   'Circular',   'Pie',       3, 'A', 1),
('area',       'Área',       'Àrea',       'Area',      4, 'A', 1),
('financiero', 'Financiero', 'Financer',   'Financial', 5, 'A', 0);

-- 4.3 Catalogo tarjetas (8 tarjetas estándar)
INSERT OR IGNORE INTO catalogo_tarjetas (id_usuario, origen, modo_visualizacion, tipo_grafico, nombre, configuracion, id_tarjeta_origen, estado) VALUES
(NULL, 'estandar', 'grafico', 'linea',    'card_evolution_income',
 '{"v":1,"agregacion":"mensual","series":[{"tipo_movimiento":"ingreso","operacion":"suma"}]}', NULL, 'A'),
(NULL, 'estandar', 'grafico', 'linea',    'card_evolution_expenses',
 '{"v":1,"agregacion":"mensual","series":[{"tipo_movimiento":"gasto","operacion":"suma"}]}', NULL, 'A'),
(NULL, 'estandar', 'grafico', 'barra',    'card_income_expenses',
 '{"v":1,"agregacion":"mensual","series":[{"tipo_movimiento":"ingreso","operacion":"suma"},{"tipo_movimiento":"gasto","operacion":"suma"}]}', NULL, 'A'),
(NULL, 'estandar', 'grafico', 'area',     'card_balance_evolution',
 '{"v":1,"agregacion":"mensual","series":[{"tipo_movimiento":"saldo_acumulado","operacion":"acumulado"}]}', NULL, 'A'),
(NULL, 'estandar', 'tabla',   NULL,       'card_movement_search',
 '{"v":1,"campos_busqueda":["fecha_desde","fecha_hasta","importe_min","importe_max","tipo","id_grupo","id_subgrupo","id_clasificacion","origen","estado","concepto_exacto"],"columnas":["fecha","tipo","concepto","importe","id_grupo","id_subgrupo","id_clasificacion","origen","estado"]}', NULL, 'A'),
(NULL, 'estandar', 'grafico', 'circular', 'card_expenses_by_category',
 '{"v":1,"agregacion":"tipo_semantico","periodo":"mes_actual","series":[{"tipo_movimiento":"gasto","operacion":"suma"}]}', NULL, 'A'),
(NULL, 'estandar', 'tabla',   NULL,       'card_top10_movements',
 '{"v":1,"columnas":["fecha","tipo","concepto","importe","id_grupo","id_subgrupo","origen"],"filtro_implicito":{"periodo":"mes_actual","orden":"importe_desc","limite":10}}', NULL, 'A'),
(NULL, 'estandar', 'tabla',   NULL,       'card_current_balance',
 '{"v":1,"columnas":["cuenta","saldo_actual"],"filtro_implicito":{"solo_activas":true}}', NULL, 'A');

-- 4.4 Dashboard estándar global
INSERT OR IGNORE INTO dashboards_usuario (id_usuario, nombre, tipo, bloqueado, orden, estado) VALUES
(NULL, 'dashboard_general', 'estandar', 1, 1, 'A');

-- 4.5 Asociación de tarjetas al dashboard General (8 filas, resolviendo por nombre)
INSERT OR IGNORE INTO tarjetas_dashboard (id_dashboard, id_tarjeta, tamano, color_fondo, orden)
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

-- ============================================================
-- 5. VERSIONADO DEL ESQUEMA
-- ============================================================
PRAGMA user_version = 2;

