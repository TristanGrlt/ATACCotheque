import { Router } from 'express';
import { getExamFile, getExam, getExams, updateExam, deleteExam } from '../controllers/exam.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyPerms } from '../middlewares/verifyPerms.js';
import { AppPermission } from '../generated/prisma/enums.js';

const router = Router();

/**
 * Get all exams with pagination (admin only)
 * GET /exam
 */
router.get('/', verifyToken, verifyPerms(AppPermission.MANAGE_ANNALES), getExams);

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

/**
 * Update exam (admin only)
 * PUT /exam/:examId
 */
router.put('/:examId', verifyToken, verifyPerms(AppPermission.MANAGE_ANNALES), updateExam);

/**
 * Delete exam (admin only)
 * DELETE /exam/:examId
 */
router.delete('/:examId', verifyToken, verifyPerms(AppPermission.MANAGE_ANNALES), deleteExam);

export default router;
