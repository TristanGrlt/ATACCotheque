import { Router } from "express";
import {
  deletePastExam,
  getAnnexeById,
  getAnnexeFile,
  getExamById,
  getFileInvalid,
  getPastExamToReview,
  updateAnnale,
  uploadAllPastExam,
} from "../controllers/pastExam.controller.js";
import { uploadMiddleware } from "../middlewares/multer.js";
import { AppPermission } from "@prisma/client";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();
router.post("/upload", uploadMiddleware, uploadAllPastExam);
router.get(
  "/toReview",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_EXAMS),
  getPastExamToReview,
);
router.get(
  "/adminFile/:id",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_EXAMS),
  getFileInvalid,
);
router.get("/:id", getExamById);
router.get("/annexeById/:id", getAnnexeById);
router.get(
  "/adminAnnexe/:id",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_EXAMS),
  getAnnexeFile,
);
router.put(
  "/updateAnnale",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_EXAMS),
  uploadMiddleware,
  updateAnnale,
);
router.delete(
  "/:id",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_EXAMS),
  deletePastExam,
);

export default router;
