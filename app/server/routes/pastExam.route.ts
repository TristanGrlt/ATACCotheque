import { Router } from "express";
import { getAnnexeById, getAnnexeFile, getExamById, getFileInvalid, getPastExamToReview, updateAnnale, uploadAllPastExam } from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from '../middlewares/multer.js';

const router = Router();
router.post('/upload', uploadMiddleware,uploadAllPastExam);
router.get('/toReview',getPastExamToReview);
router.get('/adminFile/:id',getFileInvalid)
router.get('/:id',getExamById)
router.get('/annexeById/:id', getAnnexeById)
router.get('/adminAnnexe/:id',getAnnexeFile)
router.put('/updateAnnale',uploadMiddleware,updateAnnale)


export default router;