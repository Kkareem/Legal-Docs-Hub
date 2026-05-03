import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, casesTable, clientsTable, usersTable } from "@workspace/db";
import {
  ListCasesResponse,
  CreateCaseBody,
  GetCaseParams,
  GetCaseResponse,
  UpdateCaseParams,
  UpdateCaseBody,
  UpdateCaseResponse,
  DeleteCaseParams,
  ListCasesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cases", async (req, res): Promise<void> => {
  const query = ListCasesQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  const allCases = await db.select().from(casesTable).orderBy(casesTable.createdAt);
  let filtered = allCases;
  if (params.status) filtered = filtered.filter(c => c.status === params.status);
  if (params.type) filtered = filtered.filter(c => c.type === params.type);
  if (params.lawyerId) filtered = filtered.filter(c => c.leadLawyerId === params.lawyerId);
  if (params.clientId) filtered = filtered.filter(c => c.clientId === params.clientId);
  if (params.search) {
    const s = (params.search as string).toLowerCase();
    filtered = filtered.filter(c => c.caseNumber.toLowerCase().includes(s) || (c.court ?? "").toLowerCase().includes(s));
  }

  const clients = await db.select().from(clientsTable);
  const users = await db.select().from(usersTable);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));

  const enriched = filtered.map(c => ({
    ...c,
    clientName: clientMap[c.clientId] ?? null,
    leadLawyerName: c.leadLawyerId ? (userMap[c.leadLawyerId] ?? null) : null,
  }));

  res.json(ListCasesResponse.parse(enriched));
});

router.post("/cases", async (req, res): Promise<void> => {
  const parsed = CreateCaseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [c] = await db.insert(casesTable).values(parsed.data).returning();

  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, c.clientId));
  const lawyer = c.leadLawyerId ? (await db.select().from(usersTable).where(eq(usersTable.id, c.leadLawyerId)))[0] : null;
  res.status(201).json(GetCaseResponse.parse({ ...c, clientName: client?.name ?? null, leadLawyerName: lawyer?.name ?? null }));
});

router.get("/cases/:id", async (req, res): Promise<void> => {
  const params = GetCaseParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.select().from(casesTable).where(eq(casesTable.id, params.data.id));
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, c.clientId));
  const lawyer = c.leadLawyerId ? (await db.select().from(usersTable).where(eq(usersTable.id, c.leadLawyerId)))[0] : null;
  res.json(GetCaseResponse.parse({ ...c, clientName: client?.name ?? null, leadLawyerName: lawyer?.name ?? null }));
});

router.patch("/cases/:id", async (req, res): Promise<void> => {
  const params = UpdateCaseParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateCaseBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [c] = await db.update(casesTable).set(parsed.data).where(eq(casesTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, c.clientId));
  const lawyer = c.leadLawyerId ? (await db.select().from(usersTable).where(eq(usersTable.id, c.leadLawyerId)))[0] : null;
  res.json(UpdateCaseResponse.parse({ ...c, clientName: client?.name ?? null, leadLawyerName: lawyer?.name ?? null }));
});

router.delete("/cases/:id", async (req, res): Promise<void> => {
  const params = DeleteCaseParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [c] = await db.delete(casesTable).where(eq(casesTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Case not found" }); return; }
  res.sendStatus(204);
});

export default router;
