import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getRole = async (req: Request, res: Response) => {
  const roles = await prisma.role.findMany();
  return res.status(200).json(roles);
}