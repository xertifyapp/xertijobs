import { serializeDates } from "../lib/serialize";
import { Router, type IRouter } from "express";
import { and, desc, eq, type SQL } from "drizzle-orm";
import {
  db,
  applicationsTable,
  opportunitiesTable,
  organizationsTable,
  professionalsTable,
} from "@workspace/db";
import {
  ListApplicationsQueryParams,
  ListApplicationsResponse,
  CreateApplicationBody,
  CreateApplicationResponse,
  UpdateApplicationParams,
  UpdateApplicationBody,
  UpdateApplicationResponse,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

const applicationWithJoins = {
  id: applicationsTable.id,
  opportunityId: applicationsTable.opportunityId,
  professionalId: applicationsTable.professionalId,
  opportunityTitle: opportunitiesTable.title,
  organizationName: organizationsTable.name,
  professionalName: professionalsTable.name,
  professionalEmail: professionalsTable.email,
  professionalHeadline: professionalsTable.headline,
  status: applicationsTable.status,
  message: applicationsTable.message,
  createdAt: applicationsTable.createdAt,
};

router.get("/applications", requireAuth, async (req, res): Promise<void> => {
  const query = ListApplicationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const q = query.data;
  const conditions: SQL[] = [];
  if (q.opportunityId !== undefined) conditions.push(eq(applicationsTable.opportunityId, q.opportunityId));
  if (q.professionalId !== undefined) conditions.push(eq(applicationsTable.professionalId, q.professionalId));
  if (q.organizationId !== undefined) conditions.push(eq(opportunitiesTable.organizationId, q.organizationId));
  if (q.status) conditions.push(eq(applicationsTable.status, q.status));

  const sessionUser = req.session.user;
  if (sessionUser?.role === "postulante") {
    if (sessionUser.professionalId === null) {
      res.status(403).json({ error: "Tu cuenta no tiene un perfil profesional asociado" });
      return;
    }
    conditions.push(eq(applicationsTable.professionalId, sessionUser.professionalId));
  } else if (sessionUser?.role === "empresa") {
    if (sessionUser.organizationId === null) {
      res.status(403).json({ error: "Tu cuenta no tiene una organización asociada" });
      return;
    }
    conditions.push(eq(opportunitiesTable.organizationId, sessionUser.organizationId));
  }

  const rows = await db
    .select(applicationWithJoins)
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .innerJoin(professionalsTable, eq(applicationsTable.professionalId, professionalsTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(applicationsTable.createdAt));

  res.json(ListApplicationsResponse.parse(serializeDates(rows)));
});

router.post("/applications", requireRole("postulante", "admin"), async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionUser = req.session.user;
  if (
    sessionUser?.role === "postulante" &&
    sessionUser.professionalId !== parsed.data.professionalId
  ) {
    res.status(403).json({ error: "Solo puedes postular con tu propio perfil" });
    return;
  }

  const [opportunity] = await db
    .select({ id: opportunitiesTable.id })
    .from(opportunitiesTable)
    .where(eq(opportunitiesTable.id, parsed.data.opportunityId));
  if (!opportunity) {
    res.status(400).json({ error: "La oportunidad no existe" });
    return;
  }

  const [professional] = await db
    .select({ id: professionalsTable.id })
    .from(professionalsTable)
    .where(eq(professionalsTable.id, parsed.data.professionalId));
  if (!professional) {
    res.status(400).json({ error: "El profesional no existe" });
    return;
  }

  const [created] = await db
    .insert(applicationsTable)
    .values({ ...parsed.data, status: "enviada" })
    .onConflictDoNothing({
      target: [applicationsTable.opportunityId, applicationsTable.professionalId],
    })
    .returning();

  if (!created) {
    res.status(409).json({ error: "Ya has postulado a esta oportunidad" });
    return;
  }

  const [row] = await db
    .select(applicationWithJoins)
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .innerJoin(professionalsTable, eq(applicationsTable.professionalId, professionalsTable.id))
    .where(eq(applicationsTable.id, created.id));

  res.status(201).json(CreateApplicationResponse.parse(serializeDates(row)));
});

router.patch("/applications/:id", requireRole("empresa", "admin"), async (req, res): Promise<void> => {
  const params = UpdateApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const sessionUser = req.session.user;
  if (sessionUser?.role === "empresa") {
    const [existing] = await db
      .select({ organizationId: opportunitiesTable.organizationId })
      .from(applicationsTable)
      .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
      .where(eq(applicationsTable.id, params.data.id));
    if (existing && existing.organizationId !== sessionUser.organizationId) {
      res.status(403).json({ error: "Solo puedes gestionar postulaciones de tu organización" });
      return;
    }
  }

  const [updated] = await db
    .update(applicationsTable)
    .set(parsed.data)
    .where(eq(applicationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Postulación no encontrada" });
    return;
  }

  const [row] = await db
    .select(applicationWithJoins)
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .innerJoin(professionalsTable, eq(applicationsTable.professionalId, professionalsTable.id))
    .where(eq(applicationsTable.id, updated.id));

  res.json(UpdateApplicationResponse.parse(serializeDates(row)));
});

export default router;
