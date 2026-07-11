import { serializeDates } from "../lib/serialize";
import { Router, type IRouter } from "express";
import { count, countDistinct, desc, eq, sql, sum } from "drizzle-orm";
import {
  db,
  organizationsTable,
  opportunitiesTable,
  professionalsTable,
  applicationsTable,
} from "@workspace/db";
import {
  GetGlobalStatsResponse,
  GetOrganizationStatsParams,
  GetOrganizationStatsResponse,
  GetRecentActivityResponse,
} from "@workspace/api-zod";
import { requireRole } from "../middlewares/auth";
import { t } from "../lib/i18n";

const router: IRouter = Router();

router.get("/stats/global", requireRole("admin"), async (_req, res): Promise<void> => {
  const [orgTotals] = await db
    .select({
      total: count(),
      pending: sql<number>`count(*) filter (where ${organizationsTable.status} = 'pendiente')::int`,
    })
    .from(organizationsTable);

  const [oppTotals] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${opportunitiesTable.status} = 'activa')::int`,
      countries: countDistinct(opportunitiesTable.country),
      views: sum(opportunitiesTable.views),
    })
    .from(opportunitiesTable);

  const [appTotals] = await db.select({ total: count() }).from(applicationsTable);
  const [proTotals] = await db.select({ total: count() }).from(professionalsTable);

  const opportunitiesByType = await db
    .select({ key: opportunitiesTable.type, count: count() })
    .from(opportunitiesTable)
    .groupBy(opportunitiesTable.type)
    .orderBy(desc(count()));

  const opportunitiesByCountry = await db
    .select({ key: opportunitiesTable.country, count: count() })
    .from(opportunitiesTable)
    .groupBy(opportunitiesTable.country)
    .orderBy(desc(count()));

  const applicationsByStatus = await db
    .select({ key: applicationsTable.status, count: count() })
    .from(applicationsTable)
    .groupBy(applicationsTable.status)
    .orderBy(desc(count()));

  const organizationsByType = await db
    .select({ key: organizationsTable.type, count: count() })
    .from(organizationsTable)
    .groupBy(organizationsTable.type)
    .orderBy(desc(count()));

  res.json(
    GetGlobalStatsResponse.parse({
      totalOrganizations: orgTotals?.total ?? 0,
      pendingOrganizations: orgTotals?.pending ?? 0,
      totalOpportunities: oppTotals?.total ?? 0,
      activeOpportunities: oppTotals?.active ?? 0,
      totalApplications: appTotals?.total ?? 0,
      totalProfessionals: proTotals?.total ?? 0,
      totalCountries: oppTotals?.countries ?? 0,
      totalViews: Number(oppTotals?.views ?? 0),
      opportunitiesByType,
      opportunitiesByCountry,
      applicationsByStatus,
      organizationsByType,
    }),
  );
});

router.get("/stats/organizations/:id", requireRole("empresa", "admin"), async (req, res): Promise<void> => {
  const params = GetOrganizationStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const sessionUser = req.session.user;
  if (sessionUser?.role === "empresa" && sessionUser.organizationId !== params.data.id) {
    res.status(403).json({ error: t(req.locale, "stats.onlyOwnOrgStats") });
    return;
  }

  const orgId = params.data.id;

  const [oppTotals] = await db
    .select({
      total: count(),
      active: sql<number>`count(*) filter (where ${opportunitiesTable.status} = 'activa')::int`,
      views: sum(opportunitiesTable.views),
    })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.organizationId, orgId));

  const [appTotals] = await db
    .select({ total: count() })
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .where(eq(opportunitiesTable.organizationId, orgId));

  const applicationsByStatus = await db
    .select({ key: applicationsTable.status, count: count() })
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .where(eq(opportunitiesTable.organizationId, orgId))
    .groupBy(applicationsTable.status)
    .orderBy(desc(count()));

  const applicationsByOpportunity = await db
    .select({ key: opportunitiesTable.title, count: count(applicationsTable.id) })
    .from(opportunitiesTable)
    .leftJoin(applicationsTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .where(eq(opportunitiesTable.organizationId, orgId))
    .groupBy(opportunitiesTable.id, opportunitiesTable.title)
    .orderBy(desc(count(applicationsTable.id)));

  res.json(
    GetOrganizationStatsResponse.parse({
      publishedOpportunities: oppTotals?.total ?? 0,
      activeOpportunities: oppTotals?.active ?? 0,
      totalApplications: appTotals?.total ?? 0,
      totalViews: Number(oppTotals?.views ?? 0),
      applicationsByStatus,
      applicationsByOpportunity,
    }),
  );
});

router.get("/activity/recent", requireRole("admin"), async (req, res): Promise<void> => {
  const recentOpportunities = await db
    .select({
      id: opportunitiesTable.id,
      title: opportunitiesTable.title,
      orgName: organizationsTable.name,
      createdAt: opportunitiesTable.createdAt,
    })
    .from(opportunitiesTable)
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .orderBy(desc(opportunitiesTable.createdAt))
    .limit(10);

  const recentApplications = await db
    .select({
      id: applicationsTable.id,
      proName: professionalsTable.name,
      oppTitle: opportunitiesTable.title,
      createdAt: applicationsTable.createdAt,
    })
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .innerJoin(professionalsTable, eq(applicationsTable.professionalId, professionalsTable.id))
    .orderBy(desc(applicationsTable.createdAt))
    .limit(10);

  const recentOrganizations = await db
    .select({
      id: organizationsTable.id,
      name: organizationsTable.name,
      status: organizationsTable.status,
      createdAt: organizationsTable.createdAt,
    })
    .from(organizationsTable)
    .orderBy(desc(organizationsTable.createdAt))
    .limit(10);

  const items = [
    ...recentOpportunities.map((o) => ({
      id: o.id * 10 + 1,
      kind: "opportunity_published",
      title: t(req.locale, "activity.newOpportunity", { title: o.title }),
      subtitle: o.orgName,
      createdAt: o.createdAt,
      _sort: o.createdAt.getTime(),
    })),
    ...recentApplications.map((a) => ({
      id: a.id * 10 + 2,
      kind: "application_received",
      title: t(req.locale, "activity.applicationReceived", { name: a.proName }),
      subtitle: a.oppTitle,
      createdAt: a.createdAt,
      _sort: a.createdAt.getTime(),
    })),
    ...recentOrganizations.map((o) => ({
      id: o.id * 10 + 3,
      kind: o.status === "aprobada" ? "organization_approved" : "organization_registered",
      title:
        o.status === "aprobada"
          ? t(req.locale, "activity.orgApproved", { name: o.name })
          : t(req.locale, "activity.orgRegistered", { name: o.name }),
      subtitle: null,
      createdAt: o.createdAt,
      _sort: o.createdAt.getTime(),
    })),
  ]
    .sort((a, b) => b._sort - a._sort)
    .slice(0, 15)
    .map(({ _sort, ...item }) => item);

  res.json(GetRecentActivityResponse.parse(serializeDates(items)));
});

export default router;
