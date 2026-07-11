---
name: api-server dev reload
description: The api-server dev workflow does not reliably pick up newly added Express routes; restart it after adding routes.
---

After adding a NEW route/endpoint to the api-server (e.g. a new `router.post`/`router.delete`
in `artifacts/api-server/src/routes/*`), restart the `artifacts/api-server: API Server`
workflow before testing. The running dev process kept serving the OLD bundle: new POST
returned an HTML 404 and a newly-added `select` column came back as `null`/undefined until
the workflow was restarted.

**Why:** the dev server's watch/rebuild did not register the new routes or updated query
shape on its own, producing confusing 404s + missing fields that look like code bugs.

**How to apply:** whenever endpoints or route registration change (not just handler
internals), call `restart_workflow "artifacts/api-server: API Server"` before curl/UI checks.
