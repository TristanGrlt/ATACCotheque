import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import { AppPermission } from "@prisma/client";
import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyOnboardingCompleted } from "../middlewares/verifyOnboarding.js";
import { verifyPerms } from "../middlewares/verifyPerms.js";
import {
  importExport,
  importStatus,
  downloadExport,
  listExports,
  triggerExport,
  uploadExport,
} from "../controllers/export.controller.js";
import { EXPORT_ROOT } from "../lib/exportService.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(EXPORT_ROOT, { recursive: true });
    } catch (err) {
      return cb(err as Error, EXPORT_ROOT);
    }
    cb(null, EXPORT_ROOT);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^A-Za-z0-9._-]/g, "_");
    cb(null, safe.endsWith(".tar.gz") ? safe : `${safe}.tar.gz`);
  },
});

const upload = multer({ storage });

router.get(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_IMPORT_EXPORT),
  listExports,
);

router.post(
  "/",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_IMPORT_EXPORT),
  triggerExport,
);

router.post(
  "/upload",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_IMPORT_EXPORT),
  upload.single("archive"),
  uploadExport,
);

router.get(
  "/import-status",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_IMPORT_EXPORT),
  importStatus,
);

router.post(
  "/:id/import",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_IMPORT_EXPORT),
  importExport,
);

router.get(
  "/:id/download",
  verifyToken,
  verifyOnboardingCompleted,
  verifyPerms(AppPermission.MANAGE_IMPORT_EXPORT),
  downloadExport,
);

export default router;
