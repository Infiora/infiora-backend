import fs from 'fs';
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination(_req: any, _file: any, cb: any) {
    fs.mkdirSync('uploads/', { recursive: true });
    cb(null, 'uploads/');
  },
  filename(_req: any, file: any, cb: any) {
    cb(null, file.originalname);
  },
});

function checkFileType(file: any, cb: any) {
  const filetypes = /jpg|jpeg|png|gif|bmp|svg|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  }
  return cb(new Error('Only .png, .jpg, .jpeg and pdf format allowed!'));
}

const multerUpload = multer({
  storage,
  fileFilter: (_req: any, file: any, cb: any) => {
    checkFileType(file, cb);
  },
});

export default multerUpload;
