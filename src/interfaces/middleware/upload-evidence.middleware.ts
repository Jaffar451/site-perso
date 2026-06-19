import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

// ✅ FIX : process.cwd() pointe vers la racine du projet
// __dirname pointait vers src/middleware/ → mauvais dossier
const uploadDir = path.join(process.cwd(), "uploads", "evidence");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "video/mp4",
  "audio/mpeg",
  "audio/wav",
];

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const unique = Date.now() + "_" + Math.round(Math.random() * 1e9);
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, unique + "_" + safeName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error("Type de fichier interdit"));
  }
  cb(null, true);
};

export const uploadEvidence = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("file");