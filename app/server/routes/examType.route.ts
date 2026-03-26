import { Router } from "express";
import {
  createExamType,
  deleteExamType,
  getExamType,
  getExamTypeFromCourse,
  updateExamType,
} from "../controllers/examType.controller.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { AppPermission } from "@prisma/client";
import { verifyPerms } from "../middlewares/verifyPerms.js";

const router = Router();

router.get("/", getExamType);
router.get("/course/:id", getExamTypeFromCourse);
router.post(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  createExamType,
);
router.put(
  "/:examTypeId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  updateExamType,
);
router.delete(
  "/:examTypeId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  deleteExamType,
);

export default router;
