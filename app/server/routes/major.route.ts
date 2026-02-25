import { Router } from "express";
import { createMajor, deleteMajor, getMajor, updateMajor } from "../controllers/major.controller.js";

const router = Router();

router.get('/', getMajor);
router.post('/', createMajor);
router.put('/:majorId', updateMajor);
router.delete('/:majorId', deleteMajor);


export default router;