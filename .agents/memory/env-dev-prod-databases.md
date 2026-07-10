---
name: Dev vs prod are separate databases
description: In this repo, the development DB and the deployed (published) production DB are distinct; seeded data does not cross over.
---

- Development and deployed production use SEPARATE PostgreSQL databases. Data written/seeded in dev does NOT appear in production, and `executeSql({environment:"production"})` is READ-ONLY (SELECT only) — the agent cannot write to prod directly.
- **Why:** A user reported empresa/admin/postulante logins failing on the live custom domain (semberconnect.com) with `email_no_verificado`, while the same logins returned 200 in dev. Prod query showed all `email_verified_at = NULL`; dev showed them verified. The seed only ran in dev.
- **How to apply:** To fix production DATA when you can't write to prod, ship a self-healing, idempotent bootstrap that runs in the deployed app on startup, then have the user re-publish. (Schema changes go through the Publish flow, not scripts.) For fixed demo/test accounts, an idempotent startup routine that ensures required state (e.g. verifying known seed emails when null) is the reliable path. Diagnose "works in dev, broken in prod" by curling the actual production domain and querying the production DB read-only — don't assume dev and prod share state.
