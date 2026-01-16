import { Request, Response } from 'express';


interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export const checkHealth = (req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
  res.json(response);
}