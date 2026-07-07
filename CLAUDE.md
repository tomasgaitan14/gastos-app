# gastos-app

## Descripción
App de seguimiento de gastos personales y compartidos. Multi-tenant via URL (`/t/:tenantId/...`). Sin login.

## Contexto
Personal

## Cuentas
- **GitHub:** `tomasgaitan14` (tomasgaitan14@gmail.com) — repo `gastos-app`
- **Vercel:** `tomasagustingaitan@gmail.com` (team `tomasg-projects`) — proyecto `gastos-compartidos-tempus-app`
- URL producción: https://gastos-compartidos-tempus-app.vercel.app

## Stack
- **Frontend:** Vite + React + TypeScript + Tailwind CSS v4
- **Backend:** Google Sheets como base de datos (reemplazó Supabase)
- **API:** Vercel serverless functions en `/api/` (Node.js, TypeScript)
- **Deploy:** Vercel (free tier)

## Arquitectura API → Google Sheets
- Credenciales via variables de entorno: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`
- Sheet ID original (tenant "tomas"): `1V1W-Fih0yy6Rva1RYhVue-yykqV-VkBQtx3jGmU1rnU`
- Helpers en `api/_lib/` (sheets.ts, mappers.ts, calculations.ts, tenants.ts)

## Multi-tenancy
- Cada tenant tiene su propio Google Sheet
- Registry sheet (env var `REGISTRY_SHEET_ID`): mapea `tenantId → sheetId`
  - Sheet ID del registry: `1CyyQBDgE7hqgkblKQDT7JYNatDDUW2ZM22diloZiZOs`
  - Tab `tenants`, columnas: A = tenantId, B = sheetId (fila 1 = headers)
- Tenant `tomas` ya cargado en el registry
- Onboarding manual: crear Sheet en Drive del usuario, compartirlo con service account, agregar fila al registry
- URL estructura: `/t/:tenantId/dashboard`, `/t/:tenantId/expenses`, etc.
- Helper `tp(tenantId, path)` en `src/lib/tenant.ts` para construir rutas con prefijo
- Hook `useTenantId()` en `src/hooks/useTenantId.ts` para leer `:tenantId` de la URL

## ⚠️ Vercel — dominios del proyecto
El proyecto tiene registrados estos dominios (todos se actualizan en cada deploy):
- `gastos-compartidos-tempus-app.vercel.app` ← URL principal que usan los usuarios
- `gastos-compartidos-tempus-app-tomasg-projects.vercel.app`
- `gastos-compartidos-app.vercel.app`

## ⚠️ Regla crítica de Vercel — directorio `_lib`
**Los helpers de la API van en `api/_lib/`, NO en `api/lib/`.**
Vercel trata cada archivo `.ts` dentro de `api/` como una serverless function.
Los directorios que empiezan con `_` son ignorados por Vercel y no se convierten en endpoints.
Si se nombra `api/lib/`, Vercel intenta desplegar `lib/sheets.ts` como función y falla.

## ⚠️ Módulos ESM en Vercel
El `package.json` raíz tiene `"type": "module"`. Por eso:
- `api/tsconfig.json` usa `"module": "NodeNext"` y `"moduleResolution": "NodeNext"`
- Todos los imports locales en archivos de `api/` deben tener extensión `.js` explícita
  (ej: `import { readRows } from '../_lib/sheets.js'`)

## Tabs en Google Sheets
- `members` — id, name, salary, salary_currency, created_at
- `expenses` — id, description, amount, currency, paid_by, category, date, is_recurring, recurrence_type, notes, created_at, updated_at
- `expense_splits` — id, expense_id, user_id, percentage, amount, is_excluded
- `settlements` — id, from_user_id, to_user_id, amount, currency, date, notes, created_at
- `personal_expenses` — id, member_id, description, amount, currency, category, date, is_recurring, recurrence_type, notes, created_at
- `exchange_rates` — rate, source, updated_at (solo fila 2, sin header de datos)
- `categories` — id, label, created_at
