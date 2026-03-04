import { Router } from 'express';
import { getExamFile, getExam } from '../controllers/exam.controller.js';

const router = Router();

/**
 * Get exam details
 * GET /exam/:examId
 */
router.get('/:examId', getExam);

/**
 * Get exam PDF file
 * GET /exam/:examId/file
 */
router.get('/:examId/file', getExamFile);

export default router;
