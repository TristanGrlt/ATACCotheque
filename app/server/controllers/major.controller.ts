import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';


export const getMajor = async (req: Request, res: Response) => {
  
    const majorsList = await prisma.major.findMany({})
  
  res.json(majorsList)
}

