import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { PDFDocument } from "pdf-lib";

const storage = multer.memoryStorage();
const MAX_SIZE = 200 * 1024 * 1024; // 200 MB

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_SIZE,
    files: 6,
  },
});

export const uploadMiddleware = upload.fields([
  { name: "file", maxCount: 1 },
  { name: "annexe_file_0", maxCount: 1 },
  { name: "annexe_file_1", maxCount: 1 },
  { name: "annexe_file_2", maxCount: 1 },
  { name: "annexe_file_3", maxCount: 1 },
  { name: "annexe_file_4", maxCount: 1 },
]);
