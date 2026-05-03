import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const consultationsTable = pgTable("consultations", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  summary: text("summary").notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"),
  fee: numeric("fee", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("pending"),
  assignedTo: integer("assigned_to"),
  response: text("response"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertConsultationSchema = createInsertSchema(consultationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type Consultation = typeof consultationsTable.$inferSelect;
