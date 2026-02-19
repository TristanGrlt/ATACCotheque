import { Router } from 'express';
import { getMfaChallenge, verifyMfaLogin } from '../controllers/mfa.controller.js';
import { mfaLimiter } from '../lib/rateLimiter.js';

const router = Router();

router.get('/challenge/:method', getMfaChallenge);
router.post('/verify', mfaLimiter, verifyMfaLogin);

export default router;
