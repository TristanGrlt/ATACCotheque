import { Router } from 'express';
import { getRole, deleteRole } from '../controllers/role.controller.js';
import { verify } from 'node:crypto';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.get('/', verifyToken, getRole);
router.delete('/:roleId', verifyToken, deleteRole);

export default router;