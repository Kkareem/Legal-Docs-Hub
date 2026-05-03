import { Router, type IRouter } from "express";
import { gte, eq } from "drizzle-orm";
import { db, casesTable, clientsTable, tasksTable, hearingsTable, consultationsTable, paymentsTable, powersOfAttorneyTable, auditLogsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetRecentActivityResponse,
  GetUpcomingHearingsResponse,
  GetOverdueTasksResponse,
  GetPaymentSummaryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [cases, clients, tasks, hearings, consultations, payments, poas] = await Promise.all([
    db.select().from(casesTable),
    db.select().from(clientsTable),
    db.select().from(tasksTable),
    db.select().from(hearingsTable),
    db.select().from(consultationsTable),
    db.select().from(paymentsTable),
    db.select().from(powersOfAttorneyTable),
  ]);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeCases = cases.filter(c => c.status === "active" || c.status === "upcoming_hearing").length;
  const pendingTasks = tasks.filter(t => t.status === "new" || t.status === "in_progress").length;
  const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "done" && t.status !== "cancelled").length;
  const todayHearings = hearings.filter(h => {
    const d = new Date(h.datetime);
    return d >= today && d < new Date(today.getTime() + 86400000);
  }).length;
  const upcomingHearings = hearings.filter(h => {
    const d = new Date(h.datetime);
    return d >= now && d <= in7Days;
  }).length;
  const pendingConsultations = consultations.filter(c => c.status === "pending" || c.status === "under_review").length;

  const pendingPayments = payments.filter(p => p.status === "pending" || p.status === "overdue");
  const totalPendingPayments = pendingPayments.reduce((s, p) => s + parseFloat(p.amount as string), 0);

  const powersOfAttorneyOut = poas.filter(p => p.status === "with_lawyer").length;
  const overduePoAs = poas.filter(p => p.status === "overdue" || (p.returnBy && new Date(p.returnBy) < now && p.status !== "returned")).length;

  const caseStatusCounts: Record<string, number> = {};
  cases.forEach(c => { caseStatusCounts[c.status] = (caseStatusCounts[c.status] ?? 0) + 1; });
  const casesByStatus = Object.entries(caseStatusCounts).map(([label, count]) => ({ label, count }));

  const caseTypeCounts: Record<string, number> = {};
  cases.forEach(c => { caseTypeCounts[c.type] = (caseTypeCounts[c.type] ?? 0) + 1; });
  const casesByType = Object.entries(caseTypeCounts).map(([label, count]) => ({ label, count }));

  const tasksByLawyerMap: Record<number, number> = {};
  tasks.filter(t => t.assignedTo).forEach(t => {
    tasksByLawyerMap[t.assignedTo!] = (tasksByLawyerMap[t.assignedTo!] ?? 0) + 1;
  });
  const tasksByLawyer = Object.entries(tasksByLawyerMap).map(([id, count]) => ({ label: `Lawyer #${id}`, count }));

  res.json(GetDashboardSummaryResponse.parse({
    activeCases,
    totalClients: clients.length,
    pendingTasks,
    overdueTasks,
    todayHearings,
    upcomingHearings,
    pendingConsultations,
    totalPendingPayments,
    powersOfAttorneyOut,
    overduePoAs,
    casesByStatus,
    casesByType,
    tasksByLawyer,
  }));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const logs = await db.select().from(auditLogsTable).orderBy(auditLogsTable.createdAt).limit(20);
  const activity = logs.map(l => ({
    id: l.id,
    type: l.action,
    title: `${l.action} ${l.entity}`,
    description: null,
    actor: null,
    entityType: l.entity,
    entityId: l.entityId,
    createdAt: l.createdAt,
  }));
  res.json(GetRecentActivityResponse.parse(activity));
});

router.get("/dashboard/upcoming-hearings", async (_req, res): Promise<void> => {
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const hearings = await db.select().from(hearingsTable).orderBy(hearingsTable.datetime);
  const upcoming = hearings.filter(h => new Date(h.datetime) >= now && new Date(h.datetime) <= in7Days);
  const enriched = upcoming.map(h => ({ ...h, assignedLawyerName: null, caseNumber: null }));
  res.json(GetUpcomingHearingsResponse.parse(enriched));
});

router.get("/dashboard/overdue-tasks", async (_req, res): Promise<void> => {
  const now = new Date();
  const tasks = await db.select().from(tasksTable).orderBy(tasksTable.dueDate);
  const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== "done" && t.status !== "cancelled");
  const enriched = overdue.map(t => ({ ...t, assigneeName: null, caseNumber: null }));
  res.json(GetOverdueTasksResponse.parse(enriched));
});

router.get("/dashboard/payment-summary", async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable).orderBy(paymentsTable.createdAt);
  const clients = await db.select().from(clientsTable);
  const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

  const totalCollected = payments.filter(p => p.status === "paid").reduce((s, p) => s + parseFloat(p.amount as string), 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((s, p) => s + parseFloat(p.amount as string), 0);
  const totalOverdue = payments.filter(p => p.status === "overdue").reduce((s, p) => s + parseFloat(p.amount as string), 0);

  const recentPayments = payments.slice(-5).reverse().map(p => ({
    ...p,
    amount: parseFloat(p.amount as string),
    clientName: clientMap[p.clientId] ?? null,
    caseNumber: null,
  }));

  const debtorMap: Record<number, number> = {};
  payments.filter(p => p.status === "pending" || p.status === "overdue").forEach(p => {
    debtorMap[p.clientId] = (debtorMap[p.clientId] ?? 0) + parseFloat(p.amount as string);
  });
  const topDebtors = Object.entries(debtorMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([clientId, amountDue]) => ({
      clientId: parseInt(clientId),
      clientName: clientMap[parseInt(clientId)] ?? `Client #${clientId}`,
      amountDue,
    }));

  res.json(GetPaymentSummaryResponse.parse({ totalCollected, totalPending, totalOverdue, recentPayments, topDebtors }));
});

export default router;
