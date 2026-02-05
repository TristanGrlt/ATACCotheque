import { Router } from "express";
import { getMajor } from "../controllers/major.controllers.js";

const router = Router();

router.get('/', getMajor);


export default router;