---
name: OpenAPI/Orval codegen quirks
description: Constraints when editing lib/api-spec/openapi.yaml in this repo (Orval + zod v3 target)
---

- `format: email` on a string property breaks Orval's Zod generation in this repo (generates an invalid chain). Use `minLength: 5` (or similar) instead and validate email format server-side.
- **Why:** hit during the auth/registration endpoints work (July 2026); codegen failed until the format was removed.
- **How to apply:** when adding string fields to `lib/api-spec/openapi.yaml`, avoid `format: email`; run `pnpm --filter @workspace/api-spec run codegen` to confirm.
