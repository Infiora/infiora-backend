import express, { Router } from 'express';
import { auth } from '../../modules/auth';
import { integrationController } from '../../modules/integration';

const router: Router = express.Router();

router.route('/monday/boards').get(auth(), integrationController.getBoards);

export default router;
