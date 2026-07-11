import { serializeDates } from "../lib/serialize";
import { Router, type IRouter } from "express";
import { and, asc, desc, eq, type SQL } from "drizzle-orm";
import {
  db,
  applicationsTable,
  applicationEventsTable,
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
  ListApplicationEventsParams,
  ListApplicationEventsResponse,
  RespondApplicationParams,
  RespondApplicationBody,
  RespondApplicationResponse,
  WithdrawApplicationParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/auth";
import { t } from "../lib/i18n";
import { sendApplicationStatusEmail } from "../lib/mailer";

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
  score: applicationsTable.score,
  createdAt: applicationsTable.createdAt,
};

router.get("/applications", requireAuth, async (req, res): Promise<void> => {
  const query = ListApplicationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
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
      res.status(403).json({ error: t(req.locale, "applications.noProfessionalProfile") });
      return;
    }
    conditions.push(eq(applicationsTable.professionalId, sessionUser.professionalId));
  } else if (sessionUser?.role === "empresa") {
    if (sessionUser.organizationId === null) {
      res.status(403).json({ error: t(req.locale, "applications.noOrganization") });
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
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const sessionUser = req.session.user;
  if (
    sessionUser?.role === "postulante" &&
    sessionUser.professionalId !== parsed.data.professionalId
  ) {
    res.status(403).json({ error: t(req.locale, "applications.onlyOwnProfile") });
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

  const [professional] = await db
    .select({ id: professionalsTable.id })
    .from(professionalsTable)
    .where(eq(professionalsTable.id, parsed.data.professionalId));
  if (!professional) {
    res.status(400).json({ error: t(req.locale, "common.professionalNotExist") });
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
    res.status(409).json({ error: t(req.locale, "applications.alreadyApplied") });
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
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const parsed = UpdateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const sessionUser = req.session.user;

  const [existing] = await db
    .select({
      organizationId: opportunitiesTable.organizationId,
      status: applicationsTable.status,
    })
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .where(eq(applicationsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: t(req.locale, "applications.notFound") });
    return;
  }

  if (sessionUser?.role === "empresa" && existing.organizationId !== sessionUser.organizationId) {
    res.status(403).json({ error: t(req.locale, "applications.onlyOwnOrgApplications") });
    return;
  }

  // `note` is stored on the event history, not on the application row.
  const { note, ...updateData } = parsed.data;
  const statusChanged =
    updateData.status !== undefined && updateData.status !== existing.status;

  if (Object.keys(updateData).length > 0) {
    await db
      .update(applicationsTable)
      .set(updateData)
      .where(eq(applicationsTable.id, params.data.id));
  }

  if (statusChanged) {
    await db.insert(applicationEventsTable).values({
      applicationId: params.data.id,
      status: updateData.status as string,
      note: note ?? null,
      authorRole: sessionUser?.role ?? null,
    });
  }

  const [row] = await db
    .select(applicationWithJoins)
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .innerJoin(organizationsTable, eq(opportunitiesTable.organizationId, organizationsTable.id))
    .innerJoin(professionalsTable, eq(applicationsTable.professionalId, professionalsTable.id))
    .where(eq(applicationsTable.id, params.data.id));

  if (statusChanged && row?.professionalEmail) {
    // Notify the professional; never let a mail failure break the status change.
    try {
      await sendApplicationStatusEmail(
        row.professionalEmail,
        row.professionalName ?? "",
        row.opportunityTitle ?? "",
        row.organizationName ?? "",
        row.status,
        note,
        req.locale,
      );
    } catch (err) {
      req.log.error({ err, applicationId: params.data.id }, "Failed to send application status email");
    }
  }

  res.json(UpdateApplicationResponse.parse(serializeDates(row)));
});

router.get("/applications/:id/events", requireAuth, async (req, res): Promise<void> => {
  const params = ListApplicationEventsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const [existing] = await db
    .select({
      organizationId: opportunitiesTable.organizationId,
      professionalId: applicationsTable.professionalId,
    })
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .where(eq(applicationsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: t(req.locale, "applications.notFound") });
    return;
  }

  const sessionUser = req.session.user;
  if (sessionUser?.role === "empresa" && existing.organizationId !== sessionUser.organizationId) {
    res.status(403).json({ error: t(req.locale, "applications.onlyOwnOrgApplications") });
    return;
  }
  if (sessionUser?.role === "postulante" && existing.professionalId !== sessionUser.professionalId) {
    res.status(403).json({ error: t(req.locale, "applications.onlyOwnProfile") });
    return;
  }

  const rows = await db
    .select({
      id: applicationEventsTable.id,
      applicationId: applicationEventsTable.applicationId,
      status: applicationEventsTable.status,
      note: applicationEventsTable.note,
      authorRole: applicationEventsTable.authorRole,
      createdAt: applicationEventsTable.createdAt,
    })
    .from(applicationEventsTable)
    .where(eq(applicationEventsTable.applicationId, params.data.id))
    .orderBy(asc(applicationEventsTable.createdAt));

  res.json(ListApplicationEventsResponse.parse(serializeDates(rows)));
});

router.post("/applications/:id/events", requireAuth, async (req, res): Promise<void> => {
  const params = RespondApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const parsed = RespondApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [existing] = await db
    .select({
      organizationId: opportunitiesTable.organizationId,
      professionalId: applicationsTable.professionalId,
      status: applicationsTable.status,
    })
    .from(applicationsTable)
    .innerJoin(opportunitiesTable, eq(applicationsTable.opportunityId, opportunitiesTable.id))
    .where(eq(applicationsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: t(req.locale, "applications.notFound") });
    return;
  }

  const sessionUser = req.session.user;
  if (sessionUser?.role === "empresa" && existing.organizationId !== sessionUser.organizationId) {
    res.status(403).json({ error: t(req.locale, "applications.onlyOwnOrgApplications") });
    return;
  }
  if (sessionUser?.role === "postulante" && existing.professionalId !== sessionUser.professionalId) {
    res.status(403).json({ error: t(req.locale, "applications.onlyOwnProfile") });
    return;
  }

  const [event] = await db
    .insert(applicationEventsTable)
    .values({
      applicationId: params.data.id,
      status: existing.status,
      note: parsed.data.note,
      authorRole: sessionUser?.role ?? null,
    })
    .returning();

  res.status(201).json(RespondApplicationResponse.parse(serializeDates(event)));
});

router.delete(
  "/applications/:id",
  requireRole("postulante", "admin"),
  async (req, res): Promise<void> => {
    const params = WithdrawApplicationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: t(req.locale, "common.invalidParams") });
      return;
    }

    const [existing] = await db
      .select({ professionalId: applicationsTable.professionalId })
      .from(applicationsTable)
      .where(eq(applicationsTable.id, params.data.id));

    if (!existing) {
      res.status(404).json({ error: t(req.locale, "applications.notFound") });
      return;
    }

    const sessionUser = req.session.user;
    if (
      sessionUser?.role === "postulante" &&
      existing.professionalId !== sessionUser.professionalId
    ) {
      res.status(403).json({ error: t(req.locale, "applications.onlyOwnProfile") });
      return;
    }

    // Hard delete; application_events cascade. Lets the professional re-apply later.
    await db.delete(applicationsTable).where(eq(applicationsTable.id, params.data.id));

    res.status(204).end();
  },
);

export default router;
