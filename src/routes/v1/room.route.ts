import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { roomController, roomValidation } from '../../modules/room';
import { isRoomOwner } from '../../modules/middleware';
import multerUpload from '../../modules/utils/multerUpload';

const router: Router = express.Router();

router
  .route('/')
  .post(auth(), validate(roomValidation.createRoom), multerUpload.array('images', 5), roomController.createRoom)
  .get(auth(), validate(roomValidation.getRooms), roomController.getRooms);

router
  .route('/:roomId')
  .get(auth(), validate(roomValidation.getRoom), roomController.getRoom)
  .patch(
    auth(),
    isRoomOwner,
    validate(roomValidation.updateRoom),
    multerUpload.array('images', 5),
    roomController.updateRoom
  )
  .delete(auth(), isRoomOwner, validate(roomValidation.deleteRoom), roomController.deleteRoom);

export default router;
