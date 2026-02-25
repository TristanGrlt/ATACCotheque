import { Router } from "express";
import { createLevel, deleteLevel, getLevel, updateLevel } from "../controllers/level.controller.js";

const router = Router();

router.get('/', getLevel);
router.post('/', createLevel);
router.put('/:levelId', updateLevel);
router.delete('/:levelId', deleteLevel);


export default router;