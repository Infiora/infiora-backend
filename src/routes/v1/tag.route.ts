import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { tagController, tagValidation } from '../../modules/tag';
import { isOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(auth('manageTags'), validate(tagValidation.createTag), tagController.createTag)
  .get(auth(), isOwner, validate(tagValidation.getTags), tagController.getTags);

router.route('/export').get(auth('getTags'), validate(tagValidation.exportTags), tagController.exportTags);
router.route('/link/:tagId').post(auth(), validate(tagValidation.linkTag), tagController.linkTag);
router.route('/unlink/:tagId').post(auth(), validate(tagValidation.unlinkTag), tagController.unlinkTag);

router
  .route('/:tagId')
  .get(validate(tagValidation.getTag), tagController.getTag)
  .patch(auth(), validate(tagValidation.updateTag), tagController.updateTag)
  .delete(auth('manageTags'), validate(tagValidation.deleteTag), tagController.deleteTag);

export default router;
