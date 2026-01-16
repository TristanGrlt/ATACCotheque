import { Schema } from "mongoose";
import mongoose from "mongoose";

export interface IExamType {
  name: string;
}

const userSchema = new Schema<IExamType>({
  name: {
    type: String,
    required: [true, 'Le nom de type d\'examen est obligatoire'],
    trim: true
  }
})

export default mongoose.model<IExamType>("ExamType", userSchema);