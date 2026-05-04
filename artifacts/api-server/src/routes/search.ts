import { Router, type IRouter } from "express";
import { db, clientsTable, casesTable, tasksTable, hearingsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const q = (req.query.q as string ?? "").trim().toLowerCase();
  if (!q || q.length < 2) { res.json({ clients: [], cases: [], tasks: [], hearings: [] }); return; }

  const [clients, cases, tasks, hearings] = await Promise.all([
    db.select().from(clientsTable).limit(200),
    db.select().from(casesTable).limit(200),
    db.select().from(tasksTable).limit(200),
    db.select().from(hearingsTable).limit(200),
  ]);

  const matchClients = clients
    .filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.phone ?? "").includes(q) ||
      (c.email ?? "").toLowerCase().includes(q) ||
      (c.nationalId ?? "").includes(q)
    )
    .slice(0, 5)
    .map(c => ({ id: c.id, name: c.name, phone: c.phone, email: c.email }));

  const matchCases = cases
    .filter(c =>
      c.caseNumber.toLowerCase().includes(q) ||
      (c.courtCaseNumber ?? "").toLowerCase().includes(q) ||
      (c.court ?? "").toLowerCase().includes(q) ||
      (c.opposingParty ?? "").toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map(c => ({ id: c.id, caseNumber: c.caseNumber, status: c.status, court: c.court, type: c.type }));

  const matchTasks = tasks
    .filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.description ?? "").toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority, dueDate: t.dueDate }));

  const matchHearings = hearings
    .filter(h =>
      (h.court ?? "").toLowerCase().includes(q) ||
      (h.notes ?? "").toLowerCase().includes(q)
    )
    .slice(0, 5)
    .map(h => ({ id: h.id, court: h.court, datetime: h.datetime, status: h.status, caseId: h.caseId }));

  res.json({ clients: matchClients, cases: matchCases, tasks: matchTasks, hearings: matchHearings });
});

export default router;
