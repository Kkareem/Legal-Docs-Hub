import { Router, type IRouter } from "express";
import { eq, gte } from "drizzle-orm";
import { db, hearingsTable, casesTable, usersTable } from "@workspace/db";
import {
  ListHearingsResponse,
  CreateHearingBody,
  GetHearingParams,
  GetHearingResponse,
  UpdateHearingParams,
  UpdateHearingBody,
  UpdateHearingResponse,
  DeleteHearingParams,
  ListHearingsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichHearings(hearings: any[]) {
  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const cases = await db.select().from(casesTable);
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c.caseNumber]));
  return hearings.map(h => ({
    ...h,
    assignedLawyerName: h.assignedLawyer ? (userMap[h.assignedLawyer] ?? null) : null,
    caseNumber: caseMap[h.caseId] ?? null,
  }));
}

router.get("/hearings", async (req, res): Promise<void> => {
  const query = ListHearingsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  let hearings = await db.select().from(hearingsTable).orderBy(hearingsTable.datetime);
  if (params.caseId) hearings = hearings.filter(h => h.caseId === params.caseId);
  if (params.assignedLawyer) hearings = hearings.filter(h => h.assignedLawyer === params.assignedLawyer);
  if (params.status) hearings = hearings.filter(h => h.status === params.status);
  if (params.upcoming) hearings = hearings.filter(h => new Date(h.datetime) >= new Date());

  res.json(ListHearingsResponse.parse(await enrichHearings(hearings)));
});

router.post("/hearings", async (req, res): Promise<void> => {
  const parsed = CreateHearingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [h] = await db.insert(hearingsTable).values({ ...parsed.data, status: parsed.data.status ?? "scheduled" }).returning();
  const [enriched] = await enrichHearings([h]);
  res.status(201).json(GetHearingResponse.parse(enriched));
});

router.get("/hearings/:id", async (req, res): Promise<void> => {
  const params = GetHearingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [h] = await db.select().from(hearingsTable).where(eq(hearingsTable.id, params.data.id));
  if (!h) { res.status(404).json({ error: "Hearing not found" }); return; }
  const [enriched] = await enrichHearings([h]);
  res.json(GetHearingResponse.parse(enriched));
});

router.patch("/hearings/:id", async (req, res): Promise<void> => {
  const params = UpdateHearingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateHearingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [h] = await db.update(hearingsTable).set(parsed.data).where(eq(hearingsTable.id, params.data.id)).returning();
  if (!h) { res.status(404).json({ error: "Hearing not found" }); return; }
  const [enriched] = await enrichHearings([h]);
  res.json(UpdateHearingResponse.parse(enriched));
});

router.delete("/hearings/:id", async (req, res): Promise<void> => {
  const params = DeleteHearingParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [h] = await db.delete(hearingsTable).where(eq(hearingsTable.id, params.data.id)).returning();
  if (!h) { res.status(404).json({ error: "Hearing not found" }); return; }
  res.sendStatus(204);
});

export default router;
