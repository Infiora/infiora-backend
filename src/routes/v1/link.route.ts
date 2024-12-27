import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { linkController, linkValidation } from '../../modules/link';
import { isLinkOwner, isRoomOrGroupOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(linkValidation.createLink), linkController.createLink)
  .get(auth(), validate(linkValidation.getLinks), linkController.getLinks);

router
  .route('/reorder/:id')
  .patch(auth(), validate(linkValidation.reorderLinks), isRoomOrGroupOwner, linkController.reorderLinks);

router
  .route('/:linkId')
  .get(auth(), validate(linkValidation.getLink), linkController.getLink)
  .patch(auth(), isLinkOwner, validate(linkValidation.updateLink), linkController.updateLink)
  .delete(auth(), isLinkOwner, validate(linkValidation.deleteLink), linkController.deleteLink);

export default router;
