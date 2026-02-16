import { Router } from 'express';
import { getRole, deleteRole, createRole, updateRole } from '../controllers/role.controller.js';
import { verify } from 'node:crypto';
import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyPerms } from '../middlewares/verifyPerms.js';
import { AppPermission } from '../generated/prisma/enums.js';
import { verifyOnboardingCompleted } from '../middlewares/verifyOnboarding.js';

const router = Router();

router.get('/', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_ROLES), getRole);
router.post('/', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), createRole);
router.put('/:roleId', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), updateRole);
router.delete('/:roleId', verifyToken, verifyOnboardingCompleted, verifyPerms(AppPermission.MANAGE_USERS), deleteRole);



export default router;