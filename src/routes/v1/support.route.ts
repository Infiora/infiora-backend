import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { supportController, supportValidation } from '../../modules/support';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(supportValidation.createSupport), supportController.createSupport)
  .get(auth('getSupports'), validate(supportValidation.getSupports), supportController.getSupports);

router
  .route('/:supportId')
  .get(auth(), validate(supportValidation.getSupport), supportController.getSupport)
  .patch(auth('manageSupports'), validate(supportValidation.updateSupportById), supportController.updateSupportById)
  .delete(auth('manageSupports'), validate(supportValidation.deleteSupport), supportController.deleteSupport);

export default router;
