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

const router = Router();

router.get("/", getParcours);
router.post("/", createParcours);
router.put("/:parcoursId", updateParcours);
router.delete("/:parcoursId", deleteParcours);

router.get("/:parcoursId/levels", getParcoursLevels);
router.post("/:parcoursId/levels/:levelId", addLevelToParcours);
router.delete("/:parcoursId/levels/:levelId", removeLevelFromParcours);

router.get("/:parcoursId/levels/:levelId/courses", getParcoursLevelsCourses);
router.post(
  "/:parcoursId/levels/:levelId/courses/:courseId",
  connectCourseToParcoursLevels,
);
router.delete(
  "/:parcoursId/levels/:levelId/courses/:courseId",
  disconnectCourseFromParcoursLevels,
);

export default router;
