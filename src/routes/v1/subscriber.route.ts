import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { subscriberController, subscriberValidation } from '../../modules/subscriber';
import { isOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(validate(subscriberValidation.createSubscriber), subscriberController.createSubscriber)
  .get(auth(), validate(subscriberValidation.getSubscribers), isOwner, subscriberController.getSubscribers);

router
  .route('/export')
  .get(auth(), validate(subscriberValidation.exportSubscribers), isOwner, subscriberController.exportSubscribers);

router
  .route('/:subscriberId')
  .get(auth(), validate(subscriberValidation.getSubscriber), isOwner, subscriberController.getSubscriber)
  .patch(auth(), validate(subscriberValidation.updateSubscriber), isOwner, subscriberController.updateSubscriber)
  .delete(auth(), validate(subscriberValidation.deleteSubscriber), isOwner, subscriberController.deleteSubscriber);

export default router;
