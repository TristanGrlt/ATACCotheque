import { Router } from "express";
import { getExamTypes } from "../controllers/examType.controller.js";

const router = Router();

router.get('/', getExamTypes);

export default router;
