import { Router } from "express";
import { createParcours, deleteParcours, getParcours, updateParcours } from "../controllers/parcours.controller.js";

const router = Router();

router.get('/', getParcours);
router.post('/', createParcours);
router.put('/:parcoursId', updateParcours);
router.delete('/:parcoursId', deleteParcours);


export default router;