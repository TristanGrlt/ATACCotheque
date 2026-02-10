import { Router, Request, Response } from 'express';
import { signupUser, loginUser, logoutUser, verifyUser, getUsers, deleteUser, updateUser } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyPerms } from '../middlewares/verifyPerms.js';
import { AppPermission } from '../generated/prisma/enums.js';

const router = Router();

router.get('/', verifyToken, verifyToken, verifyPerms(AppPermission.MANAGE_USERS), getUsers);
router.delete('/:userId', verifyToken, verifyToken, verifyPerms(AppPermission.MANAGE_USERS), deleteUser);

router.put('/:userId', verifyToken, verifyToken, verifyPerms(AppPermission.MANAGE_USERS), updateUser);

router.post('/signup', verifyToken, verifyPerms(AppPermission.MANAGE_USERS), verifyToken, signupUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/verify', verifyUser);

export default router;
