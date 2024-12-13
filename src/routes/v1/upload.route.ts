import express, { Router, Request, Response } from 'express';
import { auth } from '../../modules/auth';
import { catchAsync, getFile, multerUpload, uploadFile } from '../../modules/utils';

const router: Router = express.Router();

router.route('/').post(
  auth(),
  multerUpload.single('file'),
  catchAsync(async (req: Request, res: Response) => {
    if (req.file) {
      const file = await uploadFile(req.file, 'others');
      res.send(file);
    }
  })
);

router.route('/:env/:type/:name').get(
  auth(),
  catchAsync(async (req: Request, res: Response) => {
    const { env, type, name } = req.params;
    const result = await getFile(`uploads/${env}/${type}/${name}`);
    // Set headers if necessary (e.g., content type)
    res.setHeader('Content-Type', result.ContentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${name}"`);

    res.send(result.Body);
  })
);

export default router;
