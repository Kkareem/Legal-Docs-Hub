import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const casesTable = pgTable("cases", {
  id: serial("id").primaryKey(),
  caseNumber: text("case_number").notNull(),
  courtCaseNumber: text("court_case_number"),
  type: text("type").notNull().default("civil"),
  court: text("court"),
  division: text("division"),
  clientId: integer("client_id").notNull(),
  leadLawyerId: integer("lead_lawyer_id"),
  status: text("status").notNull().default("new"),
  opposingParty: text("opposing_party"),
  description: text("description"),
  officeId: integer("office_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCaseSchema = createInsertSchema(casesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof casesTable.$inferSelect;
