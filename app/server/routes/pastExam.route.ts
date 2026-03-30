import { Router } from "express";
import {
  deletePastExam, getAnnexeById, getAnnexeFile, getExamById,
  getFileInvalid, getPastExamToReview, updateAnnale,
  uploadAllPastExam, getAllPastExams, getPublicExam, getPublicFile, rebuildSearchIndex, getPublicAnnexeFile
} from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyPerms } from '../middlewares/verifyPerms.js';
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { AppPermission } from "@prisma/client";

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES (No token required)
// ==========================================
router.get('/public/:id', getPublicExam);
router.get('/public/:id/file', getPublicFile);
router.get('/public/annexe/:id', getPublicAnnexeFile);
router.post('/upload', uploadMiddleware, uploadAllPastExam);

// ==========================================
// 2. APPLY AUTHENTICATION MIDDLEWARE
// All routes below this line require a valid token
// ==========================================
router.use(verifyToken, verifyOnboardingCompleted);

// ==========================================
// 3. STATIC PROTECTED ROUTES
// Must come BEFORE dynamic /:id routes
// ==========================================
router.get('/toReview', verifyPerms(AppPermission.MANAGE_EXAMS), getPastExamToReview);
router.get('/list', verifyPerms(AppPermission.MANAGE_EXAMS), getAllPastExams);
router.put('/updateAnnale', verifyPerms(AppPermission.MANAGE_EXAMS), uploadMiddleware, updateAnnale);
router.post('/search/rebuild', verifyPerms(AppPermission.MANAGE_EXAMS), rebuildSearchIndex);

// ==========================================
// 4. SPECIFIC DYNAMIC ROUTES
// ==========================================
router.get('/adminFile/:id', verifyPerms(AppPermission.MANAGE_EXAMS), getFileInvalid);
router.get('/adminAnnexe/:id', verifyPerms(AppPermission.MANAGE_EXAMS), getAnnexeFile);
router.get('/annexeById/:id', getAnnexeById);

// ==========================================
// 5. GENERIC DYNAMIC ROUTES (Catch-alls)
// MUST be at the very bottom
// ==========================================
router.get('/:id', getExamById);
router.delete('/:id', verifyPerms(AppPermission.MANAGE_EXAMS), deletePastExam);

export default router;
