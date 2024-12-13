import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { templateController, templateValidation } from '../../modules/template';
import { isTemplateOwner } from '../../modules/middleware';
import { multerUpload } from '../../modules/utils';

const router: Router = express.Router();

router
  .route('/')
  .post(
    auth(),
    validate(templateValidation.createTemplate),
    multerUpload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
    ]),
    templateController.createTemplate
  )
  .get(auth(), validate(templateValidation.getTemplates), templateController.getTemplates);

router
  .route('/duplicate/:templateId')
  .post(auth(), validate(templateValidation.getTemplate), templateController.duplicateTemplate);

router
  .route('/:templateId')
  .get(auth(), validate(templateValidation.getTemplate), templateController.getTemplate)
  .patch(
    auth(),
    validate(templateValidation.updateTemplate),
    isTemplateOwner,
    multerUpload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
      { name: 'qrLogo', maxCount: 1 },
    ]),
    templateController.updateTemplate
  )
  .delete(auth(), validate(templateValidation.deleteTemplate), isTemplateOwner, templateController.deleteTemplate);

export default router;
