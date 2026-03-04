import { Router } from "express";
import {
  createExamType,
  deleteExamType,
  getExamType,
  updateExamType,
} from "../controllers/examType.controller.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { AppPermission } from "../generated/prisma/enums.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";

const router = Router();

router.get("/", getExamType);
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
