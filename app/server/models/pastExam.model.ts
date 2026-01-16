import { Schema, Types } from "mongoose";
import mongoose from "mongoose";

import Course from '../models/course.model.js';
import ExamType from '../models/examType.model.js';


export interface IPastExam {
  path: string;
  year: Number;
  course: Types.ObjectId;
  examType: Types.ObjectId;
}

const userSchema = new Schema<IPastExam>({
  path: {
    type: String,
    required: [true, 'Le chemin d\'acces est obligatoire'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'L\'année est obligatoire'],
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: Course,
    required: [true, 'Le nom du cour est obligatoire'],
  },
  examType: {
    type: Schema.Types.ObjectId,
    ref: ExamType,
    required: [true, 'Le type d\'examen est obligatoire'],
  }
}, {
  timestamps: true
})

export default mongoose.model<IPastExam>("PastExam", userSchema);