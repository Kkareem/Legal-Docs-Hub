import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  caseId: integer("case_id"),
  consultationId: integer("consultation_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull().default("case_fee"),
  status: text("status").notNull().default("pending"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
