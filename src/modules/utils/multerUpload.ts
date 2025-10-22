import fs from 'fs';
import multer from 'multer';

const storage = multer.diskStorage({
  destination(_req: any, _file: any, cb: any) {
    fs.mkdirSync('uploads/', { recursive: true });
    cb(null, 'uploads/');
  },
  filename(_req: any, file: any, cb: any) {
    cb(null, file.originalname);
  },
});

// ✅ Allow all files
const multerUpload = multer({
  storage,
  fileFilter: (_req: any, _file: any, cb: any) => {
    cb(null, true); // accept everything
  },
});

export default multerUpload;
