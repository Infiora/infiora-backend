import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { groupController, groupValidation } from '../../modules/group';
import { isGroupOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(groupValidation.createGroup), groupController.createGroup)
  .get(auth(), validate(groupValidation.getGroups), groupController.getGroups);

router
  .route('/:groupId')
  .get(auth(), isGroupOwner, validate(groupValidation.getGroup), groupController.getGroup)
  .patch(auth(), isGroupOwner, validate(groupValidation.updateGroup), groupController.updateGroup)
  .delete(auth(), isGroupOwner, validate(groupValidation.deleteGroup), groupController.deleteGroup);

export default router;
