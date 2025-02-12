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
  .route('/duplicate/:groupId')
  .post(auth(), validate(groupValidation.duplicateGroup), isGroupOwner, groupController.duplicateGroup);

router
  .route('/:groupId')
  .get(auth(), validate(groupValidation.getGroup), isGroupOwner, groupController.getGroup)
  .patch(auth(), validate(groupValidation.updateGroup), isGroupOwner, groupController.updateGroup)
  .delete(auth(), validate(groupValidation.deleteGroup), isGroupOwner, groupController.deleteGroup);

export default router;
