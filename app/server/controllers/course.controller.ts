import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';

export const getCourse = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' }
    });
    res.json(courses);
  } catch (err) {
    console.error('Course retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve courses' });
  }
}
