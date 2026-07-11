import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, opportunitiesTable, organizationsTable } from "@workspace/db";

const router: IRouter = Router();

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function baseUrl(req: import("express").Request): string {
  const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "https";
  const host = req.get("host") ?? "";
  return `${proto}://${host}`;
}

// Public share endpoint. Renders Open Graph / Twitter Card meta tags so that
// social networks (WhatsApp, LinkedIn, Facebook, X, Telegram...) show a rich
// preview, then redirects human visitors to the SPA opportunity page.
// Only published opportunities (status !== "borrador") are shareable.
router.get(["/compartir/:id", "/compartir/:id/:slug"], async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = Number.parseInt(rawId ?? "", 10);
  const origin = baseUrl(req);

  if (!Number.isInteger(id) || id <= 0) {
    res.redirect(302, `${origin}/oportunidades`);
    return;
  }

  const [opp] = await db
    .select({
      id: opportunitiesTable.id,
      title: opportunitiesTable.title,
      description: opportunitiesTable.description,
      status: opportunitiesTable.status,
      country: opportunitiesTable.country,
      city: opportunitiesTable.city,
      organizationName: organizationsTable.name,
      organizationStatus: organizationsTable.status,
      logoUrl: organizationsTable.logoUrl,
    })
    .from(opportunitiesTable)
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .where(eq(opportunitiesTable.id, id));

  // Public share previews only for published opportunities whose organization
  // is verified — mirrors the visibility rules on GET /opportunities(/:id).
  if (!opp || opp.status === "borrador" || opp.organizationStatus !== "verificada") {
    res.redirect(302, `${origin}/oportunidades`);
    return;
  }

  const slugSource = opp.title;
  const slug =
    slugSource
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "oportunidad";

  const canonical = `${origin}/oportunidades/${opp.id}/${slug}`;
  const shareUrl = `${origin}/compartir/${opp.id}/${slug}`;

  const location = [opp.city, opp.country].filter(Boolean).join(", ");
  const rawDescription =
    opp.description?.trim() ||
    [opp.organizationName, location].filter(Boolean).join(" · ") ||
    "SEMBER CONNECT";
  const description = rawDescription.replace(/\s+/g, " ").slice(0, 200);
  const titleParts = [opp.title, opp.organizationName].filter(Boolean);
  const title = `${titleParts.join(" · ")} | SEMBER CONNECT`;
  const image = opp.logoUrl ? `${origin}${opp.logoUrl}` : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
<meta property="og:site_name" content="SEMBER CONNECT" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(shareUrl)}" />
${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ""}
<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}" />` : ""}
<meta http-equiv="refresh" content="0; url=${escapeHtml(canonical)}" />
<script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body>
<p>Redirigiendo a la oportunidad… Si no eres redirigido, <a href="${escapeHtml(canonical)}">haz clic aquí</a>.</p>
</body>
</html>`;

  res.status(200).type("html").send(html);
});

export default router;
