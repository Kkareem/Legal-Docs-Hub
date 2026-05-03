import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, documentsTable, usersTable } from "@workspace/db";
import {
  ListDocumentsResponse,
  CreateDocumentBody,
  GetDocumentParams,
  GetDocumentResponse,
  DeleteDocumentParams,
  ListDocumentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/documents", async (req, res): Promise<void> => {
  const query = ListDocumentsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  let docs = await db.select().from(documentsTable).orderBy(documentsTable.createdAt);
  if (params.caseId) docs = docs.filter(d => d.caseId === params.caseId);
  if (params.clientId) docs = docs.filter(d => d.clientId === params.clientId);
  if (params.docType) docs = docs.filter(d => d.docType === params.docType);

  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const enriched = docs.map(d => ({ ...d, uploaderName: d.uploadedBy ? (userMap[d.uploadedBy] ?? null) : null }));

  res.json(ListDocumentsResponse.parse(enriched));
});

router.post("/documents", async (req, res): Promise<void> => {
  const parsed = CreateDocumentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [doc] = await db.insert(documentsTable).values({ ...parsed.data, isOriginal: parsed.data.isOriginal ?? false }).returning();
  res.status(201).json(GetDocumentResponse.parse({ ...doc, uploaderName: null }));
});

router.get("/documents/:id", async (req, res): Promise<void> => {
  const params = GetDocumentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, params.data.id));
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  res.json(GetDocumentResponse.parse({ ...doc, uploaderName: null }));
});

router.delete("/documents/:id", async (req, res): Promise<void> => {
  const params = DeleteDocumentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [doc] = await db.delete(documentsTable).where(eq(documentsTable.id, params.data.id)).returning();
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  res.sendStatus(204);
});

export default router;
