import { Router, Request, Response } from 'express';

const router = Router();

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

router.get('/', (req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.json(response);
});

export default router;
