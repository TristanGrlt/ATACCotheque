import { Router } from "express";
import {
  deletePastExam, getAnnexeById, getAnnexeFile, getExamById,
  getFileInvalid, getPastExamToReview, updateAnnale,
  uploadAllPastExam, getAllPastExams, getPublicExam, getPublicFile, rebuildSearchIndex
} from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from '../middlewares/multer.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyPerms } from '../middlewares/verifyPerms.js';

const router = Router();

// ==========================================
// 1. PUBLIC ROUTES (No token required)
// ==========================================
router.get('/public/:id', getPublicExam);
router.get('/public/:id/file', getPublicFile);
router.post('/upload', uploadAllPastExam);

// ==========================================
// 2. APPLY AUTHENTICATION MIDDLEWARE
// All routes below this line require a valid token
// ==========================================
router.use(verifyToken);

// ==========================================
// 3. STATIC PROTECTED ROUTES
// Must come BEFORE dynamic /:id routes
// ==========================================
router.get('/toReview', verifyPerms('MANAGE_ANNALES'), getPastExamToReview);
router.get('/list', verifyPerms('MANAGE_ANNALES'), getAllPastExams);
router.put('/updateAnnale', verifyPerms('MANAGE_ANNALES'), uploadMiddleware, updateAnnale);
router.post('/search/rebuild', verifyPerms('MANAGE_ANNALES'), rebuildSearchIndex);

// ==========================================
// 4. SPECIFIC DYNAMIC ROUTES
// ==========================================
router.get('/adminFile/:id', verifyPerms('MANAGE_ANNALES'), getFileInvalid);
router.get('/adminAnnexe/:id', verifyPerms('MANAGE_ANNALES'), getAnnexeFile);
router.get('/annexeById/:id', getAnnexeById);

// ==========================================
// 5. GENERIC DYNAMIC ROUTES (Catch-alls)
// MUST be at the very bottom
// ==========================================
router.get('/:id', getExamById);
router.delete('/:id', verifyPerms('MANAGE_ANNALES'), deletePastExam);

export default router;
