import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const professionalsTable = pgTable("professionals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  headline: text("headline"),
  country: text("country"),
  city: text("city"),
  bio: text("bio"),
  languages: text("languages").array().notNull().default([]),
  skills: text("skills").array().notNull().default([]),
  education: text("education"),
  experience: text("experience"),
  certifications: text("certifications").array().notNull().default([]),
  internationalAvailability: boolean("international_availability"),
  countriesOfInterest: text("countries_of_interest").array().notNull().default([]),
  preferredModality: text("preferred_modality"),
  avatarUrl: text("avatar_url"),
  instagram: text("instagram"),
  linkedin: text("linkedin"),
  x: text("x"),
  tiktok: text("tiktok"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProfessionalSchema = createInsertSchema(professionalsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertProfessional = z.infer<typeof insertProfessionalSchema>;
export type Professional = typeof professionalsTable.$inferSelect;
