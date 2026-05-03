import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, consultationsTable, clientsTable, usersTable } from "@workspace/db";
import {
  ListConsultationsResponse,
  CreateConsultationBody,
  GetConsultationParams,
  GetConsultationResponse,
  UpdateConsultationParams,
  UpdateConsultationBody,
  UpdateConsultationResponse,
  ListConsultationsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrich(c: any) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, c.clientId));
  const assignee = c.assignedTo ? (await db.select().from(usersTable).where(eq(usersTable.id, c.assignedTo)))[0] : null;
  return {
    ...c,
    fee: c.fee != null ? parseFloat(c.fee as string) : null,
    clientName: client?.name ?? null,
    assigneeName: assignee?.name ?? null,
  };
}

router.get("/consultations", async (req, res): Promise<void> => {
  const query = ListConsultationsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  let consultations = await db.select().from(consultationsTable).orderBy(consultationsTable.createdAt);
  if (params.status) consultations = consultations.filter(c => c.status === params.status);
  if (params.clientId) consultations = consultations.filter(c => c.clientId === params.clientId);

  const clients = await db.select().from(clientsTable);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const enriched = consultations.map(c => ({
    ...c,
    fee: c.fee != null ? parseFloat(c.fee as string) : null,
    clientName: clientMap[c.clientId] ?? null,
    assigneeName: c.assignedTo ? (userMap[c.assignedTo] ?? null) : null,
  }));

  res.json(ListConsultationsResponse.parse(enriched));
});

router.post("/consultations", async (req, res): Promise<void> => {
  const parsed = CreateConsultationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [c] = await db.insert(consultationsTable).values(parsed.data).returning();
  res.status(201).json(GetConsultationResponse.parse(await enrich(c)));
});

router.get("/consultations/:id", async (req, res): Promise<void> => {
  const params = GetConsultationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.select().from(consultationsTable).where(eq(consultationsTable.id, params.data.id));
  if (!c) { res.status(404).json({ error: "Consultation not found" }); return; }
  res.json(GetConsultationResponse.parse(await enrich(c)));
});

router.patch("/consultations/:id", async (req, res): Promise<void> => {
  const params = UpdateConsultationParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateConsultationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [c] = await db.update(consultationsTable).set(parsed.data).where(eq(consultationsTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Consultation not found" }); return; }
  res.json(UpdateConsultationResponse.parse(await enrich(c)));
});

export default router;
