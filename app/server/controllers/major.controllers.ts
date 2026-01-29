import Major, { IMajor } from '../models/major.model.js'
import mongoose from 'mongoose'
import { Request, Response } from 'express'


export const getMajor = async (req: Request, res: Response) => {
  
  const major = await Major.find({})
  res.json({ major })
}

