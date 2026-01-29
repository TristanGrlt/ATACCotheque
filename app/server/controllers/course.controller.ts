import Course, { ICourse } from '../models/course.model.js'
import Level from '../models/level.model.js'
import Major from '../models/major.model.js'
import mongoose from 'mongoose'
import { Request, Response } from 'express'

export const getCourse = async (req: Request, res: Response) => {

    const cycle = req.query.cycle ? String(req.query.cycle) : ''
    const major = req.query.major ? String(req.query.major) : ''

    const findMajor = await Major.findById(major);
    if(findMajor == null){
      return res.json({ courses: [] })
    }

    const idMajor =  findMajor._id;

    const findLevel = await Level.findOne({ name: cycle, major: idMajor });

    if (findLevel == null) {
      return res.json({ courses: [] })
    }

    const idLevel = findLevel._id;

    const findCourse = await Course.find({ level: idLevel }, { name: 1 });

    res.json({ courses: findCourse });
  }




    
  





 



   
