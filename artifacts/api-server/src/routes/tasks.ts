import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tasksTable, casesTable, usersTable } from "@workspace/db";
import {
  ListTasksResponse,
  CreateTaskBody,
  GetTaskParams,
  GetTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
  DeleteTaskParams,
  ListTasksQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function enrichTask(task: any) {
  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const cases = await db.select().from(casesTable);
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c.caseNumber]));
  return {
    ...task,
    assigneeName: task.assignedTo ? (userMap[task.assignedTo] ?? null) : null,
    caseNumber: task.caseId ? (caseMap[task.caseId] ?? null) : null,
  };
}

router.get("/tasks", async (req, res): Promise<void> => {
  const query = ListTasksQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};

  let tasks = await db.select().from(tasksTable).orderBy(tasksTable.createdAt);
  if (params.status) tasks = tasks.filter(t => t.status === params.status);
  if (params.assignedTo) tasks = tasks.filter(t => t.assignedTo === params.assignedTo);
  if (params.caseId) tasks = tasks.filter(t => t.caseId === params.caseId);
  if (params.priority) tasks = tasks.filter(t => t.priority === params.priority);

  const users = await db.select().from(usersTable);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
  const cases = await db.select().from(casesTable);
  const caseMap = Object.fromEntries(cases.map(c => [c.id, c.caseNumber]));

  const enriched = tasks.map(t => ({
    ...t,
    assigneeName: t.assignedTo ? (userMap[t.assignedTo] ?? null) : null,
    caseNumber: t.caseId ? (caseMap[t.caseId] ?? null) : null,
  }));

  res.json(ListTasksResponse.parse(enriched));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [task] = await db.insert(tasksTable).values(parsed.data).returning();
  res.status(201).json(GetTaskResponse.parse(await enrichTask(task)));
});

router.get("/tasks/:id", async (req, res): Promise<void> => {
  const params = GetTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, params.data.id));
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(GetTaskResponse.parse(await enrichTask(task)));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [task] = await db.update(tasksTable).set(parsed.data).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.json(UpdateTaskResponse.parse(await enrichTask(task)));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [task] = await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id)).returning();
  if (!task) { res.status(404).json({ error: "Task not found" }); return; }
  res.sendStatus(204);
});

export default router;
