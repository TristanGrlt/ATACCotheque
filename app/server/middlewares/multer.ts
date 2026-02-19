import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { PDFDocument } from 'pdf-lib';

const storage = multer.memoryStorage();
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: MAX_SIZE 
  }
});

export const uploadMiddleware = upload.fields([
  { name: 'file', maxCount: 1 }, 
  { name: 'optionalFile', maxCount: 5 }
]);

