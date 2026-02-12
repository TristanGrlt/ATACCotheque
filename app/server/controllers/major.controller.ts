import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

interface IMajor {
  name: string;
}
export const getMajor = async (req: Request<{}, {}, IMajor>, res: Response) => {
  
    const majorsList = await prisma.
  
  res.json(majorsList)
}

