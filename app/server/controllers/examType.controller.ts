import { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getExamTypes = async (req: Request, res: Response) => {
  try {
    const examTypes = await prisma.examType.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    res.json(examTypes);
  } catch (error) {
    console.error('Error fetching exam types:', error);
    res.status(500).json({ error: 'Failed to fetch exam types' });
  }
};
