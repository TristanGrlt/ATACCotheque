import { Router } from "express";
import { uploadAllPastExam } from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from '../middlewares/multer.js';

const router = Router();
router.post('/upload', uploadMiddleware,uploadAllPastExam);

export default router;