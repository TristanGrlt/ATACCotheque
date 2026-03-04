import { Request, Response } from 'express';
import path from 'path';
import { readFile } from 'fs/promises';
import prisma from '../lib/prisma.js';

const EXAMS_ROOT = '/app/data/exams/content';

/**
 * Get a specific exam file
 * @route GET /exam/:examId/file
 * @param {string} examId - The exam ID
 * @returns {file} The PDF file
 * @throws {404} Exam not found
 * @throws {403} Unauthorized file access (path traversal attempt)
 * @throws {500} Server error
 */
export const getExamFile = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    // Set CORS and cache headers for PDF
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    // Fetch exam from database to get the file path
    const exam = await prisma.pastExam.findUnique({
      where: { id: parseInt(examId as string) }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    // Construct file path and prevent directory traversal
    const filePath = path.join(EXAMS_ROOT, exam.path);
    const realPath = path.resolve(filePath);

    // Security: ensure resolved path is within EXAMS_ROOT
    if (!realPath.startsWith(path.resolve(EXAMS_ROOT))) {
      return res.status(403).json({ error: 'Unauthorized file access' });
    }

    // Read and send the file
    const fileContent = await readFile(realPath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(exam.path)}"`);
    res.send(fileContent);
  } catch (err) {
    console.error('File serving error:', err);
    res.status(500).json({ error: 'Failed to retrieve file' });
  }
};

/**
 * Get exam details
 * @route GET /exam/:examId
 * @param {string} examId - The exam ID
 * @returns {object} Exam details
 * @throws {404} Exam not found
 * @throws {500} Server error
 */
export const getExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.pastExam.findUnique({
      where: { id: parseInt(examId as string) },
      include: {
        course: {
          include: {
            level: {
              include: {
                major: true
              }
            }
          }
        },
        examtype: true
      }
    });

    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }

    res.json(exam);
  } catch (err) {
    console.error('Exam retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve exam' });
  }
};
