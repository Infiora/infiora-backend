import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { userController, userValidation } from '../../modules/user';
import { isOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(auth('manageUsers'), validate(userValidation.createUser), userController.createUser)
  .get(auth('getUsers'), validate(userValidation.getUsers), userController.getUsers)
  .patch(auth(), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth(), userController.deleteUser);

router.route('/me').get(auth(), userController.getMe);
router
  .route('/payment-method')
  .get(auth(), userController.getPaymentMethod)
  .post(auth(), validate(userValidation.createPaymentMethod), userController.createPaymentMethod)
  .patch(auth(), validate(userValidation.updatePaymentMethod), userController.updatePaymentMethod);
router.route('/invoices').get(auth(), userController.getInvoices);
router.route('/insights').get(auth(), userController.getInsights);
router.route('/export-csv').get(auth('getUsers'), userController.exportUsers);
router
  .route('/export-leads-csv/:userId')
  .get(auth(), validate(userValidation.exportLeads), isOwner, userController.exportLeads);
router.route('/prices').get(auth(), userController.getPrices);
router.route('/subscribe').post(auth(), validate(userValidation.subscribe), userController.subscribe);
router.route('/integration/add').post(auth(), validate(userValidation.addIntegration), userController.addIntegration);
router
  .route('/integration/remove')
  .post(auth(), validate(userValidation.removeIntegration), userController.removeIntegration);

router
  .route('/:userId')
  .get(auth(), validate(userValidation.getUser), userController.getUser)
  .patch(auth(), validate(userValidation.updateUserById), userController.updateUserById)
  .delete(auth('manageUsers'), validate(userValidation.deleteUser), userController.deleteUserById);

export default router;
