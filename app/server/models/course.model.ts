import { Schema, Types } from "mongoose";
import mongoose from "mongoose";

import Level from '../models/level.model.js';
import ExamType from '../models/examType.model.js';


export interface ICourse {
  name: string;
  semestre: string;
  level: Types.ObjectId;
  examList: Types.ObjectId[];
}

const userSchema = new Schema<ICourse>({
  name: {
    type: String,
    required: [true, 'Le nom du cour est obligatoire'],
    trim: true
  },
  semestre: {
    type: String,
    required: [true, 'Le nom du semestre est obligatoire'],
  },
  level: {
    type: Schema.Types.ObjectId,
    ref: Level,
    required: [true, 'Le nom de cycle est obligatoire'],
  },
  examList: [{
    type: Schema.Types.ObjectId,
    ref: ExamType,
    default: []
  }]
})

export default mongoose.model<ICourse>("Course", userSchema);