import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { roomController, roomValidation } from '../../modules/room';
import { isRoomOwner } from '../../modules/middleware';
import multerUpload from '../../modules/utils/multerUpload';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(roomValidation.createRoom), roomController.createRoom)
  .get(validate(roomValidation.getRooms), roomController.getRooms);

router.route('/export').get(auth(), validate(roomValidation.exportRooms), roomController.exportRooms);

router
  .route('/feedback')
  .post(validate(roomValidation.createFeedback), roomController.createFeedback)
  .get(auth(), validate(roomValidation.getFeedbacks), roomController.getFeedbacks);

router
  .route('/:roomId')
  .get(validate(roomValidation.getRoom), roomController.getRoom)
  .patch(
    auth(),
    isRoomOwner,
    validate(roomValidation.updateRoom),
    multerUpload.fields([{ name: 'popup[image]', maxCount: 1 }]),
    roomController.updateRoom
  )
  .delete(auth(), isRoomOwner, validate(roomValidation.deleteRoom), roomController.deleteRoom);

export default router;
