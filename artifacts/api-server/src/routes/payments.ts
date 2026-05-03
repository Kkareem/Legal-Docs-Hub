import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, paymentsTable, clientsTable, casesTable } from "@workspace/db";
import {
  ListPaymentsResponse,
  CreatePaymentBody,
  GetPaymentParams,
  GetPaymentResponse,
  UpdatePaymentParams,
  UpdatePaymentBody,
  UpdatePaymentResponse,
  ListPaymentsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function parseAmount(p: any) {
  return { ...p, amount: parseFloat(p.amount as string) };
}

async function enrichPayment(p: any) {
  const [client] = await db.select().from(clientsTable).where(eq(clientsTable.id, p.clientId));
  const caseItem = p.caseId ? (await db.select().from(casesTable).where(eq(casesTable.id, p.caseId)))[0] : null;
  return { ...parseAmount(p), clientName: client?.name ?? null, caseNumber: caseItem?.caseNumber ?? null };
}

router.get("/payments", async (req, res): Promise<void> => {
  const query = ListPaymentsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  let payments = await db.select().from(paymentsTable).orderBy(paymentsTable.createdAt);
  if (params.clientId) payments = payments.filter(p => p.clientId === params.clientId);
  if (params.caseId) payments = payments.filter(p => p.caseId === params.caseId);
  if (params.status) payments = payments.filter(p => p.status === params.status);

  const clients = await db.select().from(clientsTable);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const cases = await db.select().from(casesTable);
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c.caseNumber]));

  const enriched = payments.map(p => ({
    ...parseAmount(p),
    clientName: clientMap[p.clientId] ?? null,
    caseNumber: p.caseId ? (caseMap[p.caseId] ?? null) : null,
  }));

  res.json(ListPaymentsResponse.parse(enriched));
});

router.post("/payments", async (req, res): Promise<void> => {
  const parsed = CreatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [p] = await db.insert(paymentsTable).values({ ...parsed.data, amount: String(parsed.data.amount) }).returning();
  res.status(201).json(GetPaymentResponse.parse(await enrichPayment(p)));
});

router.get("/payments/:id", async (req, res): Promise<void> => {
  const params = GetPaymentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [p] = await db.select().from(paymentsTable).where(eq(paymentsTable.id, params.data.id));
  if (!p) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(GetPaymentResponse.parse(await enrichPayment(p)));
});

router.patch("/payments/:id", async (req, res): Promise<void> => {
  const params = UpdatePaymentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePaymentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData = { ...parsed.data, amount: parsed.data.amount != null ? String(parsed.data.amount) : undefined };
  const [p] = await db.update(paymentsTable).set(updateData).where(eq(paymentsTable.id, params.data.id)).returning();
  if (!p) { res.status(404).json({ error: "Payment not found" }); return; }
  res.json(UpdatePaymentResponse.parse(await enrichPayment(p)));
});

export default router;
