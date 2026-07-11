import { serializeDates } from "../lib/serialize";
import { Router, type IRouter } from "express";
import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db, organizationsTable } from "@workspace/db";
import {
  ListOrganizationsQueryParams,
  ListOrganizationsResponse,
  CreateOrganizationBody,
  CreateOrganizationResponse,
  GetOrganizationParams,
  GetOrganizationResponse,
  UpdateOrganizationParams,
  UpdateOrganizationBody,
  UpdateOrganizationResponse,
  DeleteOrganizationParams,
} from "@workspace/api-zod";
import { requireRole } from "../middlewares/auth";
import { t } from "../lib/i18n";

const router: IRouter = Router();

router.get("/organizations", async (req, res): Promise<void> => {
  const query = ListOrganizationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const conditions: SQL[] = [];
  if (query.data.status) conditions.push(eq(organizationsTable.status, query.data.status));
  if (query.data.type) conditions.push(eq(organizationsTable.type, query.data.type));
  if (query.data.search) {
    const term = `%${query.data.search}%`;
    const searchCond = or(
      ilike(organizationsTable.name, term),
      ilike(organizationsTable.country, term),
      ilike(organizationsTable.city, term),
    );
    if (searchCond) conditions.push(searchCond);
  }

  const rows = await db
    .select()
    .from(organizationsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(organizationsTable.createdAt));

  res.json(ListOrganizationsResponse.parse(serializeDates(rows)));
});

router.post("/organizations", async (req, res): Promise<void> => {
  const parsed = CreateOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [org] = await db
    .insert(organizationsTable)
    .values({ ...parsed.data, status: "pendiente" })
    .returning();

  res.status(201).json(CreateOrganizationResponse.parse(serializeDates(org)));
});

router.get("/organizations/:id", async (req, res): Promise<void> => {
  const params = GetOrganizationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.id, params.data.id));

  if (!org) {
    res.status(404).json({ error: t(req.locale, "organizations.notFound") });
    return;
  }

  res.json(GetOrganizationResponse.parse(serializeDates(org)));
});

router.patch("/organizations/:id", requireRole("empresa", "admin"), async (req, res): Promise<void> => {
  const sessionUser = req.session.user;
  if (sessionUser?.role === "empresa") {
    if (sessionUser.organizationId !== Number(req.params["id"])) {
      res.status(403).json({ error: t(req.locale, "organizations.onlyModifyOwn") });
      return;
    }
    if (req.body && typeof req.body === "object" && "status" in req.body) {
      res.status(403).json({ error: t(req.locale, "organizations.cannotChangeStatus") });
      return;
    }
  }

  const params = UpdateOrganizationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const parsed = UpdateOrganizationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidData") });
    return;
  }

  const [org] = await db
    .update(organizationsTable)
    .set(parsed.data)
    .where(eq(organizationsTable.id, params.data.id))
    .returning();

  if (!org) {
    res.status(404).json({ error: t(req.locale, "organizations.notFound") });
    return;
  }

  res.json(UpdateOrganizationResponse.parse(serializeDates(org)));
});

router.delete("/organizations/:id", requireRole("admin"), async (req, res): Promise<void> => {
  const params = DeleteOrganizationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: t(req.locale, "common.invalidParams") });
    return;
  }

  const [org] = await db
    .delete(organizationsTable)
    .where(eq(organizationsTable.id, params.data.id))
    .returning();

  if (!org) {
    res.status(404).json({ error: t(req.locale, "organizations.notFound") });
    return;
  }

  res.sendStatus(204);
});

export default router;
