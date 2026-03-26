import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  getCourse,
  getFullCourse,
  updateCourse,
} from "../controllers/course.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";
import { AppPermission } from "@prisma/client";

const router = Router();

router.get("/", getCourse);
router.get("/full", getFullCourse);
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
