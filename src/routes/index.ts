import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import tutorRouter from "./tutor.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(tutorRouter);

export default router;
