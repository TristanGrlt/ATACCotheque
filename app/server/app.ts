import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './utils/connectDB.js';
import healthRouter from './routes/health.route.js';
import userRouter from './routes/user.route.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/user', userRouter);

app.listen(port, async () => {
  await connectDB();
  console.log(`App listening on port ${port}`);
});
