import { serializeDates } from "../lib/serialize";
import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import {
  db,
  professionalsTable,
  savedOpportunitiesTable,
  opportunitiesTable,
  organizationsTable,
  applicationsTable,
} from "@workspace/db";
import {
  ListProfessionalsQueryParams,
  ListProfessionalsResponse,
  CreateProfessionalBody,
  CreateProfessionalResponse,
  GetProfessionalParams,
  GetProfessionalResponse,
  UpdateProfessionalParams,
  UpdateProfessionalBody,
  UpdateProfessionalResponse,
  ListSavedOpportunitiesParams,
  ListSavedOpportunitiesResponse,
  SaveOpportunityParams,
  SaveOpportunityBody,
  SaveOpportunityResponse,
  UnsaveOpportunityParams,
} from "@workspace/api-zod";
import { requireRole } from "../middlewares/auth";
import { t } from "../lib/i18n";
import type { Request, Response } from "express";

const router: IRouter = Router();

function canManageProfessional(req: Request, res: Response, professionalId: number): boolean {
  const sessionUser = req.session.user;
  if (sessionUser?.role === "postulante" && sessionUser.professionalId !== professionalId) {
    res.status(403).json({ error: t(req.locale, "professionals.onlyOwnProfile") });
    return false;
  }
  return true;
}

router.get("/professionals", async (req, res): Promise<void> => {
  const query = ListProfessionalsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.country) conditions.push(ilike(professionalsTable.country, query.data.country));
  if (query.data.search) {
    const term = `%${query.data.search}%`;
    const searchCond = or(
      ilike(professionalsTable.name, term),
      ilike(professionalsTable.email, term),
      ilike(professionalsTable.headline, term),
    );
    if (searchCond) conditions.push(searchCond);
  }

  const rows = await db
    .select()
    .from(professionalsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(professionalsTable.createdAt));

  res.json(ListProfessionalsResponse.parse(serializeDates(rows)));
});

router.post("/professionals", async (req, res): Promise<void> => {
  const parsed = CreateProfessionalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [pro] = await db.insert(professionalsTable).values(parsed.data).returning();

  res.status(201).json(CreateProfessionalResponse.parse(serializeDates(pro)));
});

router.get("/professionals/:id", async (req, res): Promise<void> => {
  const params = GetProfessionalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const [pro] = await db
    .select()
    .from(professionalsTable)
    .where(eq(professionalsTable.id, params.data.id));

  if (!pro) {
    res.status(404).json({ error: t(req.locale, "professionals.notFound") });
    return;
  }

  res.json(GetProfessionalResponse.parse(serializeDates(pro)));
});

router.patch("/professionals/:id", requireRole("postulante", "admin"), async (req, res): Promise<void> => {
  const params = UpdateProfessionalParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }
  if (!canManageProfessional(req, res, params.data.id)) return;

  const parsed = UpdateProfessionalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [pro] = await db
    .update(professionalsTable)
    .set(parsed.data)
    .where(eq(professionalsTable.id, params.data.id))
    .returning();

  if (!pro) {
    res.status(404).json({ error: t(req.locale, "professionals.notFound") });
    return;
  }

  res.json(UpdateProfessionalResponse.parse(serializeDates(pro)));
});

router.get("/professionals/:id/saved", requireRole("postulante", "admin"), async (req, res): Promise<void> => {
  const params = ListSavedOpportunitiesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }
  if (!canManageProfessional(req, res, params.data.id)) return;

  const rows = await db
    .select({
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
    })
    .from(savedOpportunitiesTable)
    .innerJoin(opportunitiesTable, eq(savedOpportunitiesTable.opportunityId, opportunitiesTable.id))
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .where(eq(savedOpportunitiesTable.professionalId, params.data.id))
    .orderBy(desc(savedOpportunitiesTable.createdAt));

  res.json(ListSavedOpportunitiesResponse.parse(serializeDates(rows)));
});

router.post("/professionals/:id/saved", requireRole("postulante", "admin"), async (req, res): Promise<void> => {
  const params = SaveOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }
  if (!canManageProfessional(req, res, params.data.id)) return;

  const parsed = SaveOpportunityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [professional] = await db
    .select({ id: professionalsTable.id })
    .from(professionalsTable)
    .where(eq(professionalsTable.id, params.data.id));
  if (!professional) {
    res.status(400).json({ error: t(req.locale, "common.professionalNotExist") });
    return;
  }

  const [opportunity] = await db
    .select({ id: opportunitiesTable.id })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.id, parsed.data.opportunityId));
  if (!opportunity) {
    res.status(400).json({ error: t(req.locale, "common.opportunityNotExist") });
    return;
  }

  const [inserted] = await db
    .insert(savedOpportunitiesTable)
    .values({ professionalId: params.data.id, opportunityId: parsed.data.opportunityId })
    .onConflictDoNothing({
      target: [savedOpportunitiesTable.professionalId, savedOpportunitiesTable.opportunityId],
    })
    .returning();

  if (inserted) {
    res.status(201).json(SaveOpportunityResponse.parse(serializeDates(inserted)));
    return;
  }

  const [existing] = await db
    .select()
    .from(savedOpportunitiesTable)
    .where(
      and(
        eq(savedOpportunitiesTable.professionalId, params.data.id),
        eq(savedOpportunitiesTable.opportunityId, parsed.data.opportunityId),
      ),
    );

  res.status(201).json(SaveOpportunityResponse.parse(serializeDates(existing)));
});

router.delete("/professionals/:id/saved/:opportunityId", requireRole("postulante", "admin"), async (req, res): Promise<void> => {
  const params = UnsaveOpportunityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }
  if (!canManageProfessional(req, res, params.data.id)) return;

  await db
    .delete(savedOpportunitiesTable)
    .where(
      and(
        eq(savedOpportunitiesTable.professionalId, params.data.id),
        eq(savedOpportunitiesTable.opportunityId, params.data.opportunityId),
      ),
    );

  res.sendStatus(204);
});

export default router;
