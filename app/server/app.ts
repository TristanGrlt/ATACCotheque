import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.route.js';
import userRouter from './routes/user.route.js';
import cookieParser from 'cookie-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/health', healthRouter);
app.use('/user', userRouter);


// JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not defined. Server stopped.");
}
export const JWT_SECRET = process.env.JWT_SECRET;

app.listen(port, async () => {
  console.log(`App listening on port ${port}`);
});
