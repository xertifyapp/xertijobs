import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import organizationsRouter from "./organizations";
import opportunitiesRouter from "./opportunities";
import professionalsRouter from "./professionals";
import applicationsRouter from "./applications";
import statsRouter from "./stats";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(organizationsRouter);
router.use(opportunitiesRouter);
router.use(professionalsRouter);
router.use(applicationsRouter);
router.use(statsRouter);
router.use(storageRouter);

export default router;
