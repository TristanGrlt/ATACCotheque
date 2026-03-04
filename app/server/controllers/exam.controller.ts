import { Request, Response } from 'express';
import path from 'path';
import { readFile } from 'fs/promises';
import prisma from '../lib/prisma.js';
import { getPaginationParams, createPaginationResponse, getSkip } from '../utils/pagination.js';

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

/**
 * Get all exams with pagination
 * @route GET /exam
 */
export const getExams = async (req: Request, res: Response) => {
  try {
    const params = getPaginationParams(req, { sortBy: 'id' });
    const { search, sortBy, sortOrder, pageSize } = params;
    const skip = getSkip(params.page, params.pageSize);

    const whereClause = search
      ? {
          course: {
            name: { contains: search, mode: 'insensitive' as const }
          }
        }
      : {};

    const totalCount = await prisma.pastExam.count({ where: whereClause });

    const exams = await prisma.pastExam.findMany({
      where: whereClause,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
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

    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      course: exam.course.name,
      type: exam.examtype.name,
      level: exam.course.level.name,
      major: exam.course.level.major.name,
      year: exam.year,
      path: exam.path
    }));

    const response = createPaginationResponse(formattedExams, totalCount, params);
    return res.status(200).json(response);
  } catch (err) {
    console.error('Exams retrieval error:', err);
    res.status(500).json({ error: 'Failed to retrieve exams' });
  }
};

/**
 * Update exam metadata
 * @route PUT /exam/:examId
 */
export const updateExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const { year } = req.body;

    const exam = await prisma.pastExam.update({
      where: { id: parseInt(examId as string) },
      data: {
        year: year ? parseInt(year as string) : undefined
      },
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

    res.json(exam);
  } catch (err) {
    console.error('Exam update error:', err);
    res.status(500).json({ error: 'Failed to update exam' });
  }
};

/**
 * Delete an exam
 * @route DELETE /exam/:examId
 */
export const deleteExam = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.pastExam.delete({
      where: { id: parseInt(examId as string) }
    });

    res.json({ message: 'Exam deleted successfully', id: exam.id });
  } catch (err) {
    console.error('Exam delete error:', err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};
