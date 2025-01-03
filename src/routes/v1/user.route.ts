import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { userController, userValidation } from '../../modules/user';
import { isOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers)
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .patch(auth(), isOwner, validate(userValidation.updateUser), userController.updateUser);

router.route('/me').get(auth(), userController.getCurrentUser);
router.route('/insights').get(auth(), userController.getInsights);

router
  .route('/:userId')
  .get(auth('getUsers'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('manageUsers'), validate(userValidation.updateUserById), userController.updateUserById)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUser);

export default router;
