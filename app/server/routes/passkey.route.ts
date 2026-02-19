import { Router } from 'express';
import { getPasskeyChallenge, verifyPasskeyLogin } from '../controllers/passkey.controller.js';
import { mfaLimiter } from '../lib/rateLimiter.js';

const router = Router();


router.get('/challenge', getPasskeyChallenge);
router.post('/verify', mfaLimiter, verifyPasskeyLogin);

export default router;
