import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { tagController, tagValidation } from '../../modules/tag';
import { isTagOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(auth('manageTags'), validate(tagValidation.createTag), tagController.createTag)
  .get(auth('getTags'), validate(tagValidation.getTags), tagController.getTags);

router.route('/export-csv').get(auth('getTags'), validate(tagValidation.exportTags), tagController.exportTags);
router.route('/my-tags').get(auth(), validate(tagValidation.getTags), tagController.getMyTags);
router.route('/link/:tagId').get(auth(), validate(tagValidation.linkTag), tagController.linkTag);
router.route('/unlink/:tagId').get(auth(), validate(tagValidation.unlinkTag), isTagOwner, tagController.unlinkTag);

router
  .route('/:tagId')
  .get(validate(tagValidation.getTag), tagController.getTag)
  .patch(auth(), validate(tagValidation.updateTag), isTagOwner, tagController.updateTag)
  .delete(auth('manageTags'), validate(tagValidation.deleteTag), tagController.deleteTag);

export default router;
