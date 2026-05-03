import { Router, type IRouter } from "express";
import { eq, ilike, or, and, sql } from "drizzle-orm";
import { db, clientsTable, casesTable, paymentsTable } from "@workspace/db";
import {
  ListClientsResponse,
  CreateClientBody,
  GetClientParams,
  GetClientResponse,
  UpdateClientParams,
  UpdateClientBody,
  UpdateClientResponse,
  DeleteClientParams,
  GetClientSummaryParams,
  GetClientSummaryResponse,
  ListClientsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const query = ListClientsQueryParams.safeParse(req.query);
  const { status, search } = query.success ? query.data : { status: undefined, search: undefined };

  const conditions = [];
  if (status) conditions.push(eq(clientsTable.status, status));
  if (search) conditions.push(or(ilike(clientsTable.name, `%${search}%`), ilike(clientsTable.phone ?? "", `%${search}%`)));

  const clients = conditions.length > 0
    ? await db.select().from(clientsTable).where(and(...conditions)).orderBy(clientsTable.name)
    : await db.select().from(clientsTable).orderBy(clientsTable.name);

  res.json(ListClientsResponse.parse(clients));
});

router.post("/clients", async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [client] = await db.insert(clientsTable).values(parsed.data).returning();
  res.status(201).json(GetClientResponse.parse(client));
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, params.data.id));
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  res.json(GetClientResponse.parse(client));
});

router.patch("/clients/:id", async (req, res): Promise<void> => {
  const params = UpdateClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateClientBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [client] = await db.update(clientsTable).set(parsed.data).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  res.json(UpdateClientResponse.parse(client));
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const params = DeleteClientParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [client] = await db.delete(clientsTable).where(eq(clientsTable.id, params.data.id)).returning();
  if (!client) { res.status(404).json({ error: "Client not found" }); return; }
  res.sendStatus(204);
});

router.get("/clients/:id/summary", async (req, res): Promise<void> => {
  const params = GetClientSummaryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const clientId = params.data.id;

  const cases = await db.select().from(casesTable).where(eq(casesTable.clientId, clientId));
  const activeCases = cases.filter(c => c.status === "active" || c.status === "upcoming_hearing").length;

  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.clientId, clientId));
  const totalPaid = payments.filter(p => p.status === "paid").reduce((s, p) => s + parseFloat(p.amount as string), 0);
  const totalDue = payments.filter(p => p.status === "pending" || p.status === "overdue").reduce((s, p) => s + parseFloat(p.amount as string), 0);

  res.json(GetClientSummaryResponse.parse({
    clientId,
    totalPaid,
    totalDue,
    activeCases,
    totalCases: cases.length,
    pendingTasks: 0,
  }));
});

export default router;
