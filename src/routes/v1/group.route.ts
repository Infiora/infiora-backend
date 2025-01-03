import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { groupController, groupValidation } from '../../modules/group';
import { isGroupOwner } from '../../modules/middleware';
import multerUpload from '../../modules/utils/multerUpload';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(groupValidation.createGroup), multerUpload.array('images', 5), groupController.createGroup)
  .get(auth(), validate(groupValidation.getGroups), groupController.getGroups);

router
  .route('/:groupId')
  .get(auth(), isGroupOwner, validate(groupValidation.getGroup), groupController.getGroup)
  .patch(
    auth(),
    isGroupOwner,
    validate(groupValidation.updateGroup),
    multerUpload.array('images', 5),
    groupController.updateGroup
  )
  .delete(auth(), isGroupOwner, validate(groupValidation.deleteGroup), groupController.deleteGroup);

export default router;
