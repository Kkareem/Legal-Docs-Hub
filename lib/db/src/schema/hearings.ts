import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hearingsTable = pgTable("hearings", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").notNull(),
  datetime: timestamp("datetime", { withTimezone: true }).notNull(),
  court: text("court"),
  type: text("type").notNull().default("session"),
  assignedLawyer: integer("assigned_lawyer"),
  status: text("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHearingSchema = createInsertSchema(hearingsTable).omit({ id: true, createdAt: true });
export type InsertHearing = z.infer<typeof insertHearingSchema>;
export type Hearing = typeof hearingsTable.$inferSelect;
