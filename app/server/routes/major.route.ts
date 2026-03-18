import { Router } from "express";
import { getMajorStat } from "../controllers/major.controller.js";

const router = Router();

router.get("/stats", getMajorStat);

export default router;
