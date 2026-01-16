import { Schema } from "mongoose";
import mongoose from "mongoose";

export interface IMajor {
  name: string;
}

const userSchema = new Schema<IMajor>({
  name: {
    type: String,
    required: [true, 'Le nom de filière est obligatoire'],
    trim: true
  }
})

export default mongoose.model<IMajor>("Major", userSchema);