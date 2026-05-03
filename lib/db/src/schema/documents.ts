import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id"),
  clientId: integer("client_id"),
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  docType: text("doc_type").notNull().default("other"),
  isOriginal: boolean("is_original").notNull().default(false),
  uploadedBy: integer("uploaded_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
