import { Router, Request, Response } from 'express';
import { signupUser, loginUser, logoutUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.post('/signup', verifyToken, signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);

export default router;
