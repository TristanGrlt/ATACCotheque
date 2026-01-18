import { Router, Request, Response } from 'express';
import { signupUser, loginUser, logoutUser, verifyUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.post('/signup', verifyToken, signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifyUser);

export default router;
