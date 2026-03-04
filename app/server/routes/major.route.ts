import { Router } from "express";
import {
  createMajor,
  deleteMajor,
  getMajor,
  updateMajor,
} from "../controllers/major.controller.js";
import { AppPermission } from "../generated/prisma/enums.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.get("/", getMajor);
router.post(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  createMajor,
);
router.put(
  "/:majorId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  updateMajor,
);
router.delete(
  "/:majorId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  deleteMajor,
);

export default router;
