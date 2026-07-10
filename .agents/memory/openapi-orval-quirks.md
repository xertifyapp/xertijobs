---
name: OpenAPI/Orval codegen quirks
description: Constraints when editing lib/api-spec/openapi.yaml in this repo (Orval + zod v3 target)
---

- `format: email` on a string property breaks Orval's Zod generation in this repo (generates an invalid chain). Use `minLength: 5` (or similar) instead and validate email format server-side.
- `format: uri` on a string property breaks it the same way — use a plain string (no format) for URL/website/uploadURL fields and validate server-side if needed.
- **Why:** hit during the auth/registration endpoints work (July 2026), and again for `format: uri` during the profile-media/object-storage work (July 2026); codegen failed until the format was removed.
- **How to apply:** when adding string fields to `lib/api-spec/openapi.yaml`, avoid `format: email` and `format: uri`; run `pnpm --filter @workspace/api-spec run codegen` to confirm.
