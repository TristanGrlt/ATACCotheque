import { Schema, Types } from "mongoose";
import mongoose from "mongoose";

import Major from '../models/major.model.js';

export interface ILevel {
  name: string;
  major: Types.ObjectId
}

const userSchema = new Schema<ILevel>({
  name: {
    type: String,
    required: [true, 'Le nom de filière est obligatoire'],
    trim: true
  },
  major: {
    type: Schema.Types.ObjectId,
    ref: Major,
    required: [true, 'Le nom de cycle est obligatoire'],
  }
})

export default mongoose.model<ILevel>("Level", userSchema);