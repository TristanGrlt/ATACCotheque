import { Router, Request, Response } from 'express';
import { checkHealth } from '../controllers/health.controller.js';

const router = Router();

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

router.get('/', checkHealth);

export default router;
