import { Request, Response } from 'express'
import prisma from '../lib/prisma.js';

export const getExamType = async (req: Request, res: Response) => {
    const reqCourseTypeId = req.query.courseTypeId
    if (!reqCourseTypeId) {
        return res.status(400).json({ error: "L'ID est manquant ou invalide" });
    }
    if (typeof reqCourseTypeId !== 'string') {
        return res.status(400).json({ message: "L'ID doit être une chaîne de caractères valide" });
    }

    const courseTypeId = parseInt(reqCourseTypeId, 10);
    if(isNaN(courseTypeId)){
        return res.status(400).json({ error: "L'ID n'est pas un nombre" });


    }
    const examTypeList = await prisma.course.findUnique({
        where: {
             id: courseTypeId 
        },
        include: {
            examType: true
            }
        });

  res.json(examTypeList?.examType)
}


