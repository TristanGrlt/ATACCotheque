import { Router } from "express";
import { createExamType, deleteExamType, getExamType, updateExamType } from "../controllers/examType.controller.js";

const router = Router();

router.get('/', getExamType);
router.post('/', createExamType);
router.put('/:levelId', updateExamType);
router.delete('/:levelId', deleteExamType);


export default router;