import { Router } from "express";
import { addLevelToParcours, createParcours, deleteParcours, getParcours, getParcoursLevels, removeLevelFromParcours, updateParcours } from "../controllers/parcours.controller.js";

const router = Router();

router.get('/', getParcours);
router.post('/', createParcours);
router.put('/:parcoursId', updateParcours);
router.delete('/:parcoursId', deleteParcours);

router.get('/:parcoursId/levels', getParcoursLevels);
router.post('/:parcoursId/levels/:levelId', addLevelToParcours);
router.delete('/:parcoursId/levels/:levelId', removeLevelFromParcours);

export default router;