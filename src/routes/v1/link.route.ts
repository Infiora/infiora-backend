import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { linkController, linkValidation } from '../../modules/link';
import { isLinkOwner, isRoomOrGroupOwner } from '../../modules/middleware';
import multerUpload from '../../modules/utils/multerUpload';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(linkValidation.createLink), multerUpload.array('images'), linkController.createLink)
  .get(auth(), validate(linkValidation.getLinks), linkController.getLinks);

router
  .route('/reorder/:id')
  .patch(auth(), validate(linkValidation.reorderLinks), isRoomOrGroupOwner, linkController.reorderLinks);

router
  .route('/:linkId')
  .get(validate(linkValidation.getLink), linkController.getLink)
  .patch(auth(), validate(linkValidation.updateLink), isLinkOwner, multerUpload.array('images'), linkController.updateLink)
  .delete(auth(), validate(linkValidation.deleteLink), isLinkOwner, linkController.deleteLink);

export default router;
