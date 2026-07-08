import { serializeDates } from "../lib/serialize";
import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, opportunitiesTable, organizationsTable, applicationsTable } from "@workspace/db";
import {
  ListOpportunitiesQueryParams,
  ListOpportunitiesResponse,
  CreateOpportunityBody,
  CreateOpportunityResponse,
  GetOpportunityParams,
  GetOpportunityResponse,
  UpdateOpportunityParams,
  UpdateOpportunityBody,
  UpdateOpportunityResponse,
  DeleteOpportunityParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const opportunityWithOrg = {
  id: opportunitiesTable.id,
  organizationId: opportunitiesTable.organizationId,
  organizationName: organizationsTable.name,
  title: opportunitiesTable.title,
  type: opportunitiesTable.type,
  area: opportunitiesTable.area,
  country: opportunitiesTable.country,
  city: opportunitiesTable.city,
  modality: opportunitiesTable.modality,
  paid: opportunitiesTable.paid,
  deadline: opportunitiesTable.deadline,
  description: opportunitiesTable.description,
  requirements: opportunitiesTable.requirements,
  competencies: opportunitiesTable.competencies,
  benefits: opportunitiesTable.benefits,
  requiredDocuments: opportunitiesTable.requiredDocuments,
  externalLink: opportunitiesTable.externalLink,
  language: opportunitiesTable.language,
  status: opportunitiesTable.status,
  views: opportunitiesTable.views,
  createdAt: opportunitiesTable.createdAt,
  applicationsCount: sql<number>`(select count(*)::int from ${applicationsTable} where ${applicationsTable.opportunityId} = ${opportunitiesTable.id})`,
};

router.get("/opportunities", async (req, res): Promise<void> => {
  const query = ListOpportunitiesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const q = query.data;
  const conditions: SQL[] = [];
  if (q.type) conditions.push(eq(opportunitiesTable.type, q.type));
  if (q.country) conditions.push(ilike(opportunitiesTable.country, q.country));
  if (q.city) conditions.push(ilike(opportunitiesTable.city, q.city));
  if (q.modality) conditions.push(eq(opportunitiesTable.modality, q.modality));
  if (q.area) conditions.push(ilike(opportunitiesTable.area, `%${q.area}%`));
  if (q.organizationId !== undefined) conditions.push(eq(opportunitiesTable.organizationId, q.organizationId));
  if (q.status) conditions.push(eq(opportunitiesTable.status, q.status));
  if (q.search) {
    const term = `%${q.search}%`;
    const searchCond = or(
      ilike(opportunitiesTable.title, term),
      ilike(opportunitiesTable.description, term),
      ilike(opportunitiesTable.area, term),
      ilike(organizationsTable.name, term),
      ilike(opportunitiesTable.country, term),
      ilike(opportunitiesTable.city, term),
    );
    if (searchCond) conditions.push(searchCond);
  }

  const rows = await db
    .select(opportunityWithOrg)
    .from(opportunitiesTable)
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(opportunitiesTable.createdAt));

  res.json(ListOpportunitiesResponse.parse(serializeDates(rows)));
});

router.post("/opportunities", async (req, res): Promise<void> => {
  const parsed = CreateOpportunityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, parsed.data.organizationId));

  if (!org) {
    res.status(400).json({ error: "Organización no encontrada" });
    return;
  }

  const [opp] = await db
    .insert(opportunitiesTable)
    .values({ ...parsed.data, status: parsed.data.status ?? "activa" })
    .returning();

  if (!opp) {
    res.status(500).json({ error: "No se pudo crear la oportunidad" });
    return;
  }

  res.status(201).json(
    CreateOpportunityResponse.parse(
      serializeDates({
        ...opp,
        organizationName: org.name,
        applicationsCount: 0,
      }),
    ),
  );
});

router.get("/opportunities/:id", async (req, res): Promise<void> => {
  const params = GetOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .update(opportunitiesTable)
    .set({ views: sql`${opportunitiesTable.views} + 1` })
    .where(eq(opportunitiesTable.id, params.data.id));

  const [opp] = await db
    .select(opportunityWithOrg)
    .from(opportunitiesTable)
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .where(eq(opportunitiesTable.id, params.data.id));

  if (!opp) {
    res.status(404).json({ error: "Oportunidad no encontrada" });
    return;
  }

  res.json(GetOpportunityResponse.parse(serializeDates(opp)));
});

router.patch("/opportunities/:id", async (req, res): Promise<void> => {
  const params = UpdateOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOpportunityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(opportunitiesTable)
    .set(parsed.data)
    .where(eq(opportunitiesTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Oportunidad no encontrada" });
    return;
  }

  const [opp] = await db
    .select(opportunityWithOrg)
    .from(opportunitiesTable)
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .where(eq(opportunitiesTable.id, params.data.id));

  res.json(UpdateOpportunityResponse.parse(serializeDates(opp)));
});

router.delete("/opportunities/:id", async (req, res): Promise<void> => {
  const params = DeleteOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [opp] = await db
    .delete(opportunitiesTable)
    .where(eq(opportunitiesTable.id, params.data.id))
    .returning();

  if (!opp) {
    res.status(404).json({ error: "Oportunidad no encontrada" });
    return;
  }

  res.sendStatus(204);
});

export default router;
