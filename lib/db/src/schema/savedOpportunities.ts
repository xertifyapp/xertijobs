import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { opportunitiesTable } from "./opportunities";
import { professionalsTable } from "./professionals";

export const savedOpportunitiesTable = pgTable(
  "saved_opportunities",
  {
    id: serial("id").primaryKey(),
    professionalId: integer("professional_id")
      .notNull()
      .references(() => professionalsTable.id, { onDelete: "cascade" }),
    opportunityId: integer("opportunity_id")
      .notNull()
      .references(() => opportunitiesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("saved_professional_opportunity_unique").on(t.professionalId, t.opportunityId)],
);

export const insertSavedOpportunitySchema = createInsertSchema(savedOpportunitiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSavedOpportunity = z.infer<typeof insertSavedOpportunitySchema>;
export type SavedOpportunity = typeof savedOpportunitiesTable.$inferSelect;
