# SEMBER CONNECT

Plataforma SaaS que conecta universidades, empresas, gobiernos y ONGs con profesionales y estudiantes: las organizaciones publican oportunidades (internships, empleos, becas, bootcamps, eventos, movilidad) y los profesionales postulan. SEMBER opera como superadministrador.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/scripts run seed` — seed demo data + test users (skips if data exists)
- `pnpm --filter @workspace/scripts run seed-users` — seed only the auth test users
- Required env: `DATABASE_URL` — Postgres connection string; `SESSION_SECRET` — session signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite (`artifacts/sember-connect`), wouter, TanStack Query, shadcn/ui, Tailwind
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for the API contract
- `lib/db/src/schema/` — Drizzle tables (one file per table): organizations, opportunities, professionals, applications, savedOpportunities, users, sessions, emailOtps
- `artifacts/api-server/src/lib/objectStorage.ts` + `objectAcl.ts` — Object Storage service (Replit GCS sidecar); `src/routes/storage.ts` — upload URL + object serving routes
- `lib/object-storage-web/` — client upload lib (`useUpload` hook, `ObjectUploader`)
- `artifacts/api-server/src/routes/` — Express routers per domain, re-exported in `routes/index.ts` (incl. `auth.ts`)
- `artifacts/api-server/src/lib/session.ts` — express-session + connect-pg-simple setup; `src/middlewares/auth.ts` — `requireAuth` / `requireRole`
- `artifacts/api-server/src/lib/serialize.ts` — `serializeDates` helper (Date → ISO string) used before Zod response parsing
- `artifacts/sember-connect/src/pages/` — Home, Opportunities, OpportunityDetail, Organizations, Register, Profile, Panel, Admin, Login
- `artifacts/sember-connect/src/hooks/useAuth.ts` — session state hook; `src/components/RequireAuth.tsx` — route guard
- `scripts/src/seed.ts` — demo seed data (also invokes `seedUsers.ts`)

## Architecture decisions

- Session-based auth (express-session + connect-pg-simple, cookie sameSite lax, 7d). Roles: `postulante` (linked professionalId), `empresa` (linked organizationId), `admin`. Endpoints: POST /auth/login, /auth/register, /auth/verify-email, /auth/resend-otp, /auth/logout, GET /auth/me.
- Registration (/registro, tabs postulante/empresa) requires email OTP verification: 6-digit code, bcrypt-hashed in `email_otps` (one row per user, upsert), 10 min expiry, 5 attempts max, 60s resend cooldown. Emails sent via the Replit Gmail connector (`api-server/src/lib/mailer.ts`, @replit/connectors-sdk) from the owner's Gmail. Login returns 403 `email_no_verificado` until verified.
- Empresa registration creates the org with status `pendiente` + a user account; login returns 403 `pendiente_aprobacion` until the org is `aprobada` by admin in /admin. Old /registro-organizacion route redirects to /registro?tipo=empresa.
- Browsing opportunities/organizations stays PUBLIC (no login). Protected: /perfil (postulante), /panel (empresa + admin; empresa locked to its own org, admin gets an org selector), /admin (admin only). Server enforces the same rules via `requireAuth`/`requireRole` + ownership checks.
- Test accounts (shown on /login): admin@sember.com / Admin123!, empresa@sember.com / Empresa123! (org Globant), postulante@sember.com / Postulante123! (professional id 1).
- Organizations register with status `pendiente` and must be approved (`aprobada`) by SEMBER from /admin before appearing publicly.
- Domain values are plain-text Spanish enums: org types (universidad, empresa, gobierno, ong, fundacion, organismo_internacional), opportunity types (internship, empleo, beca, bootcamp, evento, movilidad, convocatoria), modality (presencial, remoto, hibrido), application status (enviada, en_revision, preseleccionado, aceptado, rechazado), opportunity status (activa, cerrada, borrador).
- `GET /opportunities/:id` increments the `views` counter.
- Applications have a DB unique constraint (opportunityId, professionalId); duplicates return 409.
- Recent activity is derived from recent rows across tables, not a separate events table.
- Object Storage (Replit GCS sidecar) stores profile media. `POST /storage/uploads/request-url` requires auth (`requireAuth`) and validates contentType (JPG/PNG/GIF/WebP) + size (≤10MB) before issuing a presigned PUT URL. `GET /storage/objects/*` serves objects publicly on purpose (avatars/logos display on public profiles + org directory). Client uses `useUpload` (basePath `/api/storage`); images are rendered via `objectUrl(path) = /api/storage${objectPath}`.
- Profile media fields: professionals have `avatarUrl` + social links (`instagram`, `linkedin`, `x`, `tiktok`); organizations have `logoUrl` (+ existing `website`). Postulantes edit these in /perfil; empresas edit logo/website/name/description in /panel (Perfil tab). New fields persist automatically through the existing PATCH handlers via `parsed.data`.

## Product

- Public: home, opportunity search with filters, opportunity detail (apply + save), organization directory, organization registration.
- /perfil — professional panel: profile editing, my applications, saved opportunities.
- /panel — institutional panel: stats, opportunity CRUD, application review with status changes.
- /admin — SEMBER superadmin: global stats, recent activity, organization approval, management views.

## User preferences

- ALL user-facing UI text must be in Spanish.

## Gotchas

- OpenAPI response `createdAt` fields are strings; Drizzle returns `Date` — always wrap response payloads in `serializeDates(...)` before `.parse(...)` in api-server routes.
- After changing `lib/db` schema, run `pnpm run typecheck:libs` before typechecking artifacts (stale declarations cause phantom import errors).
- Workflow names: `artifacts/api-server: API Server` and `artifacts/sember-connect: web`.
- connect-pg-simple `createTableIfMissing: true` fails in the esbuild bundle (missing `dist/table.sql`) — the `session` table is defined in the Drizzle schema instead and created via `db push`; keep `createTableIfMissing: false`.
- CORS is an allowlist built from `REPLIT_DOMAINS` + `REPLIT_DEV_DOMAIN` (credentials enabled only for those origins).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
