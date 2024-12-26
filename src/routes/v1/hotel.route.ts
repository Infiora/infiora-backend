import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { hotelController, hotelValidation } from '../../modules/hotel';
import { isHotelOwner, isOwner } from '../../modules/middleware';

const router: Router = express.Router();

router
  .route('/')
  .post(auth('manageHotels'), validate(hotelValidation.createHotel), hotelController.createHotel)
  .get(auth(), isOwner, validate(hotelValidation.getHotels), hotelController.getHotels);

router
  .route('/:hotelId')
  .get(auth(), isHotelOwner, validate(hotelValidation.getHotel), hotelController.getHotel)
  .patch(auth(), isHotelOwner, validate(hotelValidation.updateHotel), hotelController.updateHotel)
  .delete(auth('manageHotels'), validate(hotelValidation.deleteHotel), hotelController.deleteHotel);

export default router;
