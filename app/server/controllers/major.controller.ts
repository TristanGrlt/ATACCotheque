import { Request, Response } from "express";
import prisma from "../lib/prisma.js";

export const getMajor = async (req: Request, res: Response) => {
  const majorsList = await prisma.major.findMany({});

  res.json(majorsList);
};

export const getMajorStat = async (req: Request, res: Response) => {
  const majors = await prisma.major.findMany({
    select: { id: true, name: true },
  });

  const pastExamCounts = await prisma.pastExam.groupBy({
    by: ["courseId"],
    _count: { _all: true },
  });

  const courses = await prisma.course.findMany({
    select: {
      id: true,
      parcours: {
        select: {
          majors: {
            select: { id: true },
          },
        },
      },
    },
  });

  const courseToMajorIds = new Map<number, number[]>();
  for (const course of courses) {
    const majorIds = new Set<number>();
    for (const parcours of course.parcours) {
      for (const major of parcours.majors) {
        majorIds.add(major.id);
      }
    }

    if (majorIds.size > 0) {
      courseToMajorIds.set(course.id, [...majorIds]);
    }
  }

  const majorPastExamCount = new Map<number, number>();

  for (const row of pastExamCounts) {
    const majorIds = courseToMajorIds.get(row.courseId);
    if (!majorIds) continue;

    for (const majorId of majorIds) {
      majorPastExamCount.set(
        majorId,
        (majorPastExamCount.get(majorId) ?? 0) + row._count._all,
      );
    }
  }

  const stats = majors.map((m) => ({
    name: m.name,
    pastExamCount: majorPastExamCount.get(m.id) || 0,
  }));

  const totalCount = await prisma.pastExam.count();

  return res.status(200).json({
    subjects: stats,
    totalPastExams: totalCount,
  });
};
