import { Router } from 'express';
import { getRole, deleteRole, getAccesRight } from '../controllers/role.controller.js';
import { verify } from 'node:crypto';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

router.get('/', verifyToken, getRole);
router.delete('/:roleId', verifyToken, deleteRole);

router.get('/acces', verifyToken, getAccesRight);

export default router;