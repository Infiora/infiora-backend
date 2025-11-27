import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { hotelController, hotelValidation } from '../../modules/hotel';
import { isHotelOwner, isOwner } from '../../modules/middleware';
import multerUpload from '../../modules/utils/multerUpload';

const router: Router = express.Router();

router
  .route('/')
  .post(
    auth('manageHotels'),
    validate(hotelValidation.createHotel),
    multerUpload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
    hotelController.createHotel
  )
  .get(auth(), isOwner, validate(hotelValidation.getHotels), hotelController.getHotels);

router.route('/:hotelId/insights').get(auth(), isHotelOwner, hotelController.getInsights);

router
  .route('/:hotelId/dupicate-group')
  .post(auth(), validate(hotelValidation.duplicateGroup), hotelController.duplicateGroup);

router
  .route('/:hotelId')
  .get(auth(), isHotelOwner, validate(hotelValidation.getHotel), hotelController.getHotel)
  .post(hotelController.socialLinkTap)
  .patch(
    auth(),
    isHotelOwner,
    validate(hotelValidation.updateHotel),
    multerUpload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'cover', maxCount: 1 },
    ]),
    hotelController.updateHotel
  )
  .delete(auth('manageHotels'), validate(hotelValidation.deleteHotel), hotelController.deleteHotel);

export default router;
