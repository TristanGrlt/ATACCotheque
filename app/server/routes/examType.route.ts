import { Router, Request, Response } from 'express';
import { getExamType } from '../controllers/examType.controller.js';

const router = Router();

router.get('/',getExamType);

export default router;
