import { Router } from "express";
import { getExamById, getFileInvalid, getPastExamToReview, uploadAllPastExam } from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from '../middlewares/multer.js';

const router = Router();
router.post('/upload', uploadMiddleware,uploadAllPastExam);
router.get('/toReview',getPastExamToReview);
router.get('/adminFile/:id',getFileInvalid)
router.get('/:id',getExamById)

export default router;