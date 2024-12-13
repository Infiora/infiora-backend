import express, { Router } from 'express';
import { validate } from '../../modules/validate';
import { auth } from '../../modules/auth';
import { teamController, teamValidation } from '../../modules/team';
import { isTeamAdmin, isTeamMember, isTeamOwner } from '../../modules/middleware';
import { multerUpload } from '../../modules/utils';

const router: Router = express.Router();

router.route('/').get(auth('getTeams'), validate(teamValidation.getTeams), teamController.getTeams);
router.route('/join-team').get(validate(teamValidation.joinTeam), teamController.joinTeam);
router.route('/leave-team').get(auth(), teamController.leaveTeam);
router
  .route('/:teamId/get-members')
  .get(auth(), validate(teamValidation.getTeamMembers), isTeamMember, teamController.getTeamMembers);
router
  .route('/:teamId/team-leads')
  .get(auth(), validate(teamValidation.getTeamLeads), isTeamAdmin, teamController.getTeamLeads);
router
  .route('/:teamId/add-members')
  .post(auth(), validate(teamValidation.addMembers), isTeamAdmin, teamController.addMembers);
router
  .route('/:teamId/remove-member')
  .post(auth(), isTeamAdmin, validate(teamValidation.removeMember), isTeamAdmin, teamController.removeMember);
router
  .route('/:teamId/delete-member')
  .post(auth(), isTeamAdmin, validate(teamValidation.deleteMember), isTeamAdmin, teamController.deleteMember);
router
  .route('/:teamId/update-member')
  .post(auth(), isTeamAdmin, validate(teamValidation.updateMember), isTeamAdmin, teamController.updateMember);
router
  .route('/:teamId/duplicate-member')
  .post(auth(), isTeamAdmin, validate(teamValidation.duplicateMember), isTeamAdmin, teamController.duplicateMember);
router
  .route('/:teamId/cancel-plan')
  .get(auth(), validate(teamValidation.cancelPlan), isTeamOwner, teamController.cancelPlan);
router
  .route('/:teamId')
  .get(auth(), validate(teamValidation.getTeam), teamController.getTeam)
  .patch(
    auth(),
    validate(teamValidation.updateTeam),
    isTeamAdmin,
    multerUpload.fields([{ name: 'logo', maxCount: 1 }]),
    teamController.updateTeam
  );

export default router;
