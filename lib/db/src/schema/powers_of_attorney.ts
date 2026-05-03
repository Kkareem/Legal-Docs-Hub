import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const powersOfAttorneyTable = pgTable("powers_of_attorney", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  caseId: integer("case_id"),
  receivedBy: integer("received_by").notNull(),
  handedBy: text("handed_by"),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  returnBy: timestamp("return_by", { withTimezone: true }),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  status: text("status").notNull().default("in_office"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPowerOfAttorneySchema = createInsertSchema(powersOfAttorneyTable).omit({ id: true, createdAt: true });
export type InsertPowerOfAttorney = z.infer<typeof insertPowerOfAttorneySchema>;
export type PowerOfAttorney = typeof powersOfAttorneyTable.$inferSelect;
