import mongoose from "mongoose";
import { MONGO_URI } from "../app.js";


const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Unknown error", error);
    }
    process.exit(1);
  }
}

export default connectDB;