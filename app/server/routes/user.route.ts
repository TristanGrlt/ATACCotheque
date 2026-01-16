import { Router, Request, Response } from 'express';
import { addUser } from '../controllers/user.controller.js';

const router = Router();

router.post('/', addUser);

export default router;
