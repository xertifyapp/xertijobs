---
name: Express 5 routing quirks
description: path-to-regexp v8 gotchas when defining routes in the api-server (Express 5)
---

# Express 5 / path-to-regexp v8 routing

Express 5 uses path-to-regexp v8. Two things bite you:

- **Optional params `:x?` are NOT supported.** A route like `/compartir/:id/:slug?`
  throws `PathError: Unexpected ? at index N` at startup (the build succeeds; it
  fails only at runtime when the router is constructed). Use an **array of explicit
  paths** instead: `router.get(["/compartir/:id", "/compartir/:id/:slug"], ...)`.

**Why:** the failure is a runtime crash, not a typecheck/build error — `pnpm build`
passes and the workflow only fails on `node dist/index.mjs`, so check the workflow
logs, not the build output.

**How to apply:** when adding routes with optional trailing segments in api-server,
register multiple concrete paths. When a route is defined with an array of paths,
`req.params.<name>` is typed `string | string[]` — coerce before use
(`Array.isArray(x) ? x[0] : x`).
