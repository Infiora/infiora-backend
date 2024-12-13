import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { isLeadOwner, isOwner } from '../../modules/middleware';
import { leadController, leadValidation } from '../../modules/lead';
import { multerUpload } from '../../modules/utils';

const router: Router = express.Router();

// Upload middleware configuration
const uploadFields = multerUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
]);

// Lead routes
router
  .route('/')
  .post(validate(leadValidation.createLead), uploadFields, leadController.createLead)
  .get(auth(), validate(leadValidation.getLeads), isOwner, leadController.getLeads);

router.route('/scan-card').post(multerUpload.single('image'), leadController.scanCard);

router.route('/contact-card/:leadId').get(validate(leadValidation.getContactCard), leadController.getContactCard);

router.route('/export/:leadId').get(auth(), validate(leadValidation.exportLead), isLeadOwner, leadController.exportLead);

router.route('/export').get(auth(), validate(leadValidation.exportLeads), isOwner, leadController.exportLeads);

router
  .route('/:leadId')
  .get(auth(), validate(leadValidation.getLead), isLeadOwner, leadController.getLead)
  .patch(auth(), validate(leadValidation.updateLead), isLeadOwner, uploadFields, leadController.updateLead)
  .delete(auth(), validate(leadValidation.deleteLead), isLeadOwner, leadController.deleteLead);

export default router;
