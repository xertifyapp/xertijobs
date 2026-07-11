import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";

export const opportunitiesTable = pgTable("opportunities", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id")
    .notNull()
    .references(() => organizationsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type").notNull(),
  area: text("area"),
  country: text("country").notNull(),
  city: text("city"),
  modality: text("modality").notNull(),
  paid: boolean("paid"),
  deadline: text("deadline"),
  description: text("description"),
  requirements: text("requirements"),
  competencies: text("competencies").array().notNull().default([]),
  benefits: text("benefits"),
  requiredDocuments: text("required_documents").array().notNull().default([]),
  externalLink: text("external_link"),
  language: text("language"),
  status: text("status").notNull().default("activa"),
  featured: boolean("featured").notNull().default(false),
  views: integer("views").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOpportunitySchema = createInsertSchema(opportunitiesTable).omit({
  id: true,
  createdAt: true,
  views: true,
});
export type InsertOpportunity = z.infer<typeof insertOpportunitySchema>;
export type Opportunity = typeof opportunitiesTable.$inferSelect;
