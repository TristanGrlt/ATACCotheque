import { Schema } from "mongoose";
import mongoose from "mongoose";

export interface IUser {
  username: string;
  password: string;
}

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est obligatoire'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est obligatoire'],
    trim: true
  }
})

export default mongoose.model<IUser>("User", userSchema);