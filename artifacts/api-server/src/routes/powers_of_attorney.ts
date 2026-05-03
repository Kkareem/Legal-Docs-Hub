import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, powersOfAttorneyTable, clientsTable, casesTable, usersTable } from "@workspace/db";
import {
  ListPowersOfAttorneyResponse,
  CreatePowerOfAttorneyBody,
  GetPowerOfAttorneyParams,
  GetPowerOfAttorneyResponse,
  UpdatePowerOfAttorneyParams,
  UpdatePowerOfAttorneyBody,
  UpdatePowerOfAttorneyResponse,
  ListPowersOfAttorneyQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichPoAs(poas: any[]) {
  const clients = await db.select().from(clientsTable);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));
  const cases = await db.select().from(casesTable);
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c.caseNumber]));
  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  return poas.map(p => ({
    ...p,
    clientName: clientMap[p.clientId] ?? null,
    caseNumber: p.caseId ? (caseMap[p.caseId] ?? null) : null,
    receivedByName: userMap[p.receivedBy] ?? null,
  }));
}

router.get("/powers-of-attorney", async (req, res): Promise<void> => {
  const query = ListPowersOfAttorneyQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  let poas = await db.select().from(powersOfAttorneyTable).orderBy(powersOfAttorneyTable.createdAt);
  if (params.status) poas = poas.filter(p => p.status === params.status);
  if (params.receivedBy) poas = poas.filter(p => p.receivedBy === params.receivedBy);

  res.json(ListPowersOfAttorneyResponse.parse(await enrichPoAs(poas)));
});

router.post("/powers-of-attorney", async (req, res): Promise<void> => {
  const parsed = CreatePowerOfAttorneyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [poa] = await db.insert(powersOfAttorneyTable).values(parsed.data).returning();
  const [enriched] = await enrichPoAs([poa]);
  res.status(201).json(GetPowerOfAttorneyResponse.parse(enriched));
});

router.get("/powers-of-attorney/:id", async (req, res): Promise<void> => {
  const params = GetPowerOfAttorneyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [poa] = await db.select().from(powersOfAttorneyTable).where(eq(powersOfAttorneyTable.id, params.data.id));
  if (!poa) { res.status(404).json({ error: "Power of attorney not found" }); return; }
  const [enriched] = await enrichPoAs([poa]);
  res.json(GetPowerOfAttorneyResponse.parse(enriched));
});

router.patch("/powers-of-attorney/:id", async (req, res): Promise<void> => {
  const params = UpdatePowerOfAttorneyParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePowerOfAttorneyBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [poa] = await db.update(powersOfAttorneyTable).set(parsed.data).where(eq(powersOfAttorneyTable.id, params.data.id)).returning();
  if (!poa) { res.status(404).json({ error: "Power of attorney not found" }); return; }
  const [enriched] = await enrichPoAs([poa]);
  res.json(UpdatePowerOfAttorneyResponse.parse(enriched));
});

export default router;
