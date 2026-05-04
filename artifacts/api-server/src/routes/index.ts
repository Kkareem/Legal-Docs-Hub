import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import clientsRouter from "./clients";
import casesRouter from "./cases";
import documentsRouter from "./documents";
import tasksRouter from "./tasks";
import hearingsRouter from "./hearings";
import consultationsRouter from "./consultations";
import paymentsRouter from "./payments";
import powersOfAttorneyRouter from "./powers_of_attorney";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(casesRouter);
router.use(documentsRouter);
router.use(tasksRouter);
router.use(hearingsRouter);
router.use(consultationsRouter);
router.use(paymentsRouter);
router.use(powersOfAttorneyRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);
router.use(searchRouter);

export default router;
