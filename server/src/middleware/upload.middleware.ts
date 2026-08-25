import multer from "multer";
import { AppError } from "../utils/app-error.js";

// Generic single-image upload — reused for avatars, court images, and Open
// Play activity images, each route just binds it to its own field name via
// imageUpload.single("...").
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new AppError("Only image files are allowed", 422));
      return;
    }
    cb(null, true);
  },
});
