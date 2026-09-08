# Tests Fase 1 - Dashboard Extractos Simple

Este directorio contiene todas las pruebas unitarias e de integración correspondientes a la **Fase 1** del proyecto, según lo especificado en `docs/alcance_fase_1-v1.0.md`.

## Estructura de Archivos

```
fase-01/
├── README.md                    # Este archivo
├── crypto.test.js               # Pruebas de criptografía (PBKDF2, AES-GCM)
├── rango-importe.test.js        # Pruebas de bucketing de importes
├── utils.test.js                # Pruebas de utilidades (errores, IBAN, i18n)
├── run_node.mjs                 # Runner para Node.js
└── harness/
    ├── runner.js                # Core del test runner
    └── run.html                 # Interfaz HTML para tests en navegador
```

## Requisitos Previos

- **Node.js** ≥ 18.x (recomendado 20.x)
- **npm** ≥ 9.x
- Navegador moderno (Chrome ≥ 103, Firefox ≥ 104, Edge ≥ 103) para tests en navegador

## Instalación

Desde la raíz del proyecto (`/workspace`):

```bash
npm install
```

## Ejecución de Tests

### Opción A: Desde Node.js (Recomendado para CI/CD)

```bash
cd /workspace
node tests/fase-01/run_node.mjs
```

Este comando ejecutará todos los tests y mostrará un resumen con:
- Total de tests ejecutados
- Tests aprobados ✅
- Tests fallidos ❌
- Detalles de errores (si los hubiera)

### Opción B: Desde Navegador (Interfaz Gráfica)

1. Inicia un servidor HTTP local desde la raíz del proyecto:

```bash
# Con Python 3
python3 -m http.server 8080

# O con Node.js (requiere serve)
npx serve .
```

2. Abre en tu navegador: `http://localhost:8080/tests/fase-01/harness/run.html`

La interfaz mostrará:
- Dashboard con estado general
- Lista detallada de cada test
- Tiempos de ejecución
- Mensajes de error en caso de fallo

## Categorías de Tests

### 1. Criptografía (`crypto.test.js`)

| ID Test | Descripción |
|---------|-------------|
| U-CRYPTO-001 | Derivación AUTH reproducible |
| U-CRYPTO-002 | Derivación sensible a salt |
| U-CRYPTO-003 | Derivación sensible a dominio (AUTH vs WRAP) |
| U-CRYPTO-004 | AES roundtrip (cifrar/descifrar) |
| U-CRYPTO-005 | IV único por operación |
| U-CRYPTO-006 | Descifrado con clave incorrecta falla |
| U-CRYPTO-007 | Wrap/unwrap de frase_datos |
| U-CRYPTO-008 | Amount cents roundtrip |
| U-CRYPTO-009 | Normalización NFC |
| U-CRYPTO-010 | Cambio de contraseña invariantes |

### 2. Rango de Importe (`rango-importe.test.js`)

| ID Test | Descripción |
|---------|-------------|
| U-RANGO-001 | Cálculo correcto de buckets positivos/negativos |
| U-RANGO-002 | Validación de entrada estricta (TypeError) |

### 3. Utilidades (`utils.test.js`)

| ID Test | Descripción |
|---------|-------------|
| U-ERRORS-001 | Códigos de error únicos y formato correcto |
| U-IBAN-001 | Validación de IBAN válido |
| U-IBAN-002 | Rechazo de IBAN inválido |

## Interpretación de Resultados

### Salida Exitosa

```
========================================
RESULTADOS DE TESTS - FASE 1
========================================
Total tests: 23
Aprobados:   23 ✅
Fallidos:    0 ❌
========================================
✅ TODOS LOS TESTS APROBADOS
========================================
```

### Salida con Fallos

```
========================================
RESULTADOS DE TESTS - FASE 1
========================================
Total tests: 23
Aprobados:   22 ✅
Fallidos:    1 ❌
========================================
❌ TESTS FALLIDOS:
  - U-CRYPTO-004: Expected...
========================================
```

## Reproducibilidad

Para garantizar que los tests sean reproducibles en el futuro:

1. **No modificar** los archivos de test sin actualizar la versión del documento de alcance
2. **Mantener compatibilidad** con Node.js ≥ 18
3. **Documentar cambios** en el changelog del proyecto
4. **Ejecutar todos los tests** antes de hacer commit de cualquier cambio en:
   - `crypto/pbkdf2.js`
   - `crypto/aes-gcm.js`
   - `crypto/rango-importe.js`
   - `utils/errors.js`
   - `utils/i18n.js`

## Solución de Problemas

### Error: "Module not found"

Verifica que estás ejecutando desde la raíz del proyecto y que `npm install` se completó correctamente.

### Error: "Web Crypto API not available"

Los tests de criptografía requieren Web Crypto API. En Node.js ≥ 18 está disponible globalmente. En navegadores antiguos, actualiza a una versión compatible.

### Tests fallan intermitentemente

Los tests están diseñados para ser deterministas. Si fallan intermitentemente, verifica:
- No hay procesos concurrentes modificando archivos
- El sistema de archivos no está lleno
- La memoria RAM es suficiente

## Referencias

- Documento de alcance: `docs/alcance_fase_1-v1.0.md`
- Modelo de datos: `docs/init.sql`
- Código fuente: `crypto/`, `utils/`, `db/`

---

**Versión**: 1.0  
**Última actualización**: 2024  
**Estado**: ✅ Todos los tests aprobados
