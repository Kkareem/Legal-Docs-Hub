import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import {
  ListNotificationsResponse,
  ListNotificationsQueryParams,
  MarkNotificationReadParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const query = ListNotificationsQueryParams.safeParse(req.query);
  const params = query.success ? query.data : {};
  const userId = (req.session as any)?.userId ?? 1;

  let notifs = await db.select().from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(notificationsTable.createdAt);

  if (params.unreadOnly) notifs = notifs.filter(n => !n.read);

  res.json(ListNotificationsResponse.parse(notifs));
});

router.patch("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [notif] = await db.update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();
  if (!notif) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json(notif);
});

router.patch("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId ?? 1;
  await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.userId, userId));
  res.json({ ok: true });
});

export default router;
