import { Router } from "express";
import {
  createLevel,
  deleteLevel,
  getLevel,
  updateLevel,
} from "../controllers/level.controller.js";
import { AppPermission } from "../generated/prisma/enums.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = Router();

router.get("/", getLevel);
router.post(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  createLevel,
);
router.put(
  "/:levelId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  updateLevel,
);
router.delete(
  "/:levelId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  deleteLevel,
);

export default router;
