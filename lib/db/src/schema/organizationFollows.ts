import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { professionalsTable } from "./professionals";

export const organizationFollowsTable = pgTable(
  "organization_follows",
  {
    id: serial("id").primaryKey(),
    professionalId: integer("professional_id")
      .notNull()
      .references(() => professionalsTable.id, { onDelete: "cascade" }),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("follow_professional_organization_unique").on(t.professionalId, t.organizationId)],
);

export const insertOrganizationFollowSchema = createInsertSchema(organizationFollowsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertOrganizationFollow = z.infer<typeof insertOrganizationFollowSchema>;
export type OrganizationFollow = typeof organizationFollowsTable.$inferSelect;
