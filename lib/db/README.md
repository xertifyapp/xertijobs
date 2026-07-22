# Base de datos — SEMBER CONNECT

PostgreSQL con [Drizzle ORM](https://orm.drizzle.team/). El esquema vive en `lib/db/src/schema/` (un archivo por tabla): `organizations`, `opportunities`, `professionals`, `applications` (+ `application_events`), `savedOpportunities`, `users`, `sessions`, `emailOtps`.

## Requisitos

- Node.js 24 y pnpm instalados
- Una base de datos PostgreSQL accesible
- Variables de entorno:
  - `DATABASE_URL` — cadena de conexión de Postgres, ej. `postgresql://usuario:password@host:5432/sember`
  - `SESSION_SECRET` — clave para firmar sesiones (cualquier cadena aleatoria larga)

## 1. Instalar dependencias

Desde la raíz del repositorio:

```bash
pnpm install
```

## 2. Crear el esquema (tablas)

No hay migraciones versionadas: el esquema se sincroniza directamente con `drizzle-kit push`:

```bash
pnpm --filter @workspace/db run push
```

Esto crea/actualiza todas las tablas, incluida la tabla `session` que usa `connect-pg-simple` (el servidor NO la crea solo; debe existir antes de arrancar).

## 3. Poblar la base de datos (seed)

### Datos de demostración + usuarios de prueba

```bash
pnpm --filter @workspace/scripts run seed
```

Crea organizaciones, oportunidades, profesionales, postulaciones y guardados de demostración, e invoca automáticamente el seed de usuarios. Es **idempotente**: si ya hay datos, no hace nada.

### Solo usuarios de prueba (auth)

```bash
pnpm --filter @workspace/scripts run seed-users
```

Cuentas creadas (también visibles en la pantalla `/login`):

| Rol        | Email                  | Contraseña      |
|------------|------------------------|-----------------|
| Admin      | admin@sember.com       | `Admin123!`     |
| Empresa    | empresa@sember.com     | `Empresa123!`   |
| Postulante | postulante@sember.com  | `Postulante123!`|

### Datos extra (candidatos, oportunidades y pipelines de ejemplo)

```bash
pnpm --filter @workspace/scripts run seed-extra
```

Agrega profesionales adicionales, oportunidades de Globant y postulaciones con historial de eventos (incluidas varias para la cuenta `postulante@sember.com`). También es idempotente: puede ejecutarse varias veces sin duplicar datos.

## Orden recomendado

```bash
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/scripts run seed
pnpm --filter @workspace/scripts run seed-extra
```

## Notas

- Los seeds solo deben usarse en entornos de desarrollo/demo; producción usa una base de datos separada.
- Si cambias el esquema en `lib/db/src/schema/`, vuelve a ejecutar `pnpm --filter @workspace/db run push` y luego `pnpm run typecheck:libs`.
- Los valores de dominio (estados, tipos, modalidades) son enums de texto en español; consulta `replit.md` para la lista completa.
