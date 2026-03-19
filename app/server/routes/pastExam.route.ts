import { Router } from "express";
import { getFileInvalid, getPastExamToReview, uploadAllPastExam } from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from '../middlewares/multer.js';

const router = Router();
router.post('/upload', uploadMiddleware,uploadAllPastExam);
router.get('/toReview',getPastExamToReview);
router.get('/invalidFile/:id',getFileInvalid)

export default router;