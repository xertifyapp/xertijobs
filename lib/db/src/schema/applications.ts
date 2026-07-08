import { pgTable, text, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { opportunitiesTable } from "./opportunities";
import { professionalsTable } from "./professionals";

export const applicationsTable = pgTable(
  "applications",
  {
    id: serial("id").primaryKey(),
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunitiesTable.id, { onDelete: "cascade" }),
    professionalId: integer("professional_id")
      .notNull()
      .references(() => professionalsTable.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("enviada"),
    message: text("message"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("applications_opportunity_professional_unique").on(t.opportunityId, t.professionalId)],
);

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
