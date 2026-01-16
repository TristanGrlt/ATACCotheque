import { Schema } from "mongoose";
import mongoose from "mongoose";

interface IUser {
  username: string;
  password: string;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  }
})

export default mongoose.model<IUser>("User", userSchema);