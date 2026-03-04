import { Router, Request, Response } from 'express';
import { signupUser, loginUser, logoutUser, verifyUser, getUsers, deleteUser, updateUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyPerms } from '../middlewares/verifyPerms.js';
import { AppPermission } from '../generated/prisma/enums.js';
import { verifyOnboardingCompleted } from '../middlewares/verifyOnboarding.js';
import { loginLimiter } from '../lib/rateLimiter.js';
import { reinitMfa } from '../controllers/mfa.controller.js';

const router = Router();

router.get('/', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), getUsers);
router.delete('/:userId', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), deleteUser);

router.put('/:userId', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), updateUser);

router.put('/:userId/reinit-mfa', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), reinitMfa)

router.post('/signup', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), signupUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifyUser);

export default router;
