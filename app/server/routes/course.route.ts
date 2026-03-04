import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";
import { AppPermission } from "../generated/prisma/enums.js";

const router = Router();

router.get("/", getCourse);
router.post(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  createCourse,
);
router.put(
  "/:courseId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  updateCourse,
);
router.delete(
  "/:courseId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  deleteCourse,
);

export default router;
