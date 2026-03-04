import { Router } from "express";
import {
  addLevelToParcours,
  connectCourseToParcoursLevels,
  createParcours,
  deleteParcours,
  disconnectCourseFromParcoursLevels,
  getParcours,
  getParcoursLevels,
  getParcoursLevelsCourses,
  removeLevelFromParcours,
  updateParcours,
} from "../controllers/parcours.controller.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { AppPermission } from "../generated/prisma/enums.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";

const router = Router();

router.get("/", getParcours);
router.post(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  createParcours,
);
router.put(
  "/:parcoursId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  updateParcours,
);
router.delete(
  "/:parcoursId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  deleteParcours,
);

router.get(
  "/:parcoursId/levels",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  getParcoursLevels,
);
router.post(
  "/:parcoursId/levels/:levelId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  addLevelToParcours,
);
router.delete(
  "/:parcoursId/levels/:levelId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  removeLevelFromParcours,
);

router.get(
  "/:parcoursId/levels/:levelId/courses",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  getParcoursLevelsCourses,
);
router.post(
  "/:parcoursId/levels/:levelId/courses/:courseId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  connectCourseToParcoursLevels,
);
router.delete(
  "/:parcoursId/levels/:levelId/courses/:courseId",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_PEDAGO),
  disconnectCourseFromParcoursLevels,
);

export default router;
