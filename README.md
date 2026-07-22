# SEMBER CONNECT

Plataforma SaaS que conecta universidades, empresas, gobiernos y ONGs con profesionales y estudiantes: las organizaciones publican oportunidades (internships, empleos, becas, bootcamps, eventos, movilidad) y los profesionales postulan. SEMBER opera como superadministrador.

## Funcionalidades

- **Público**: home, búsqueda de oportunidades con filtros, detalle de oportunidad (postular + guardar), directorio de organizaciones, registro (postulante / empresa) con verificación de email por código OTP.
- **/perfil** — panel del profesional: edición de perfil, mis postulaciones (con detalle, mensajes y retiro), oportunidades guardadas.
- **/panel** — panel institucional: estadísticas, CRUD de oportunidades, revisión de postulaciones con cambios de estado.
- **/admin** — superadmin SEMBER: estadísticas globales, actividad reciente, aprobación y gestión de organizaciones, moderación de oportunidades.
- Interfaz multilenguaje (es/en/pt, español por defecto); preferencia guardada por usuario.

## Stack

- **Monorepo**: pnpm workspaces, Node.js 24, TypeScript 5.9
- **API**: Express 5 (`artifacts/api-server`), contrato OpenAPI-first (`lib/api-spec/openapi.yaml`) con codegen vía Orval
- **Base de datos**: PostgreSQL + Drizzle ORM (`lib/db`)
- **Frontend**: React + Vite (`artifacts/sember-connect`), wouter, TanStack Query, shadcn/ui, Tailwind
- **Auth**: sesiones (express-session + connect-pg-simple), roles `postulante` / `empresa` / `admin`
- **Validación**: Zod (`zod/v4`), `drizzle-zod`

## Estructura

```text
artifacts/
  api-server/       # API Express (puerto 5000)
  sember-connect/   # Frontend React + Vite
lib/
  api-spec/         # openapi.yaml (fuente de verdad del contrato) + codegen
  db/               # Esquema Drizzle + drizzle-kit (ver lib/db/README.md)
  object-storage-web/ # Cliente de subida de archivos
scripts/            # Seeds de datos demo y usuarios de prueba
```

## Puesta en marcha

Requisitos: Node.js 24, pnpm, PostgreSQL.

Variables de entorno requeridas:

- `DATABASE_URL` — cadena de conexión de Postgres
- `SESSION_SECRET` — clave para firmar sesiones

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear el esquema de base de datos
pnpm --filter @workspace/db run push

# 3. Poblar datos demo + usuarios de prueba
pnpm --filter @workspace/scripts run seed
pnpm --filter @workspace/scripts run seed-extra

# 4. Levantar el servidor API
pnpm --filter @workspace/api-server run dev

# 5. Levantar el frontend
pnpm --filter @workspace/sember-connect run dev
```

📄 **Base de datos**: instrucciones detalladas para crear y poblar la base de datos en [`lib/db/README.md`](lib/db/README.md).

## Cuentas de prueba

| Rol        | Email                  | Contraseña      |
|------------|------------------------|-----------------|
| Admin      | admin@sember.com       | `Admin123!`     |
| Empresa    | empresa@sember.com     | `Empresa123!`   |
| Postulante | postulante@sember.com  | `Postulante123!`|

## Comandos útiles

- `pnpm run typecheck` — typecheck completo de todos los paquetes
- `pnpm run build` — typecheck + build
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks y schemas desde el OpenAPI
