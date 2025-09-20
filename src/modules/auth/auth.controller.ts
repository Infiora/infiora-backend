import httpStatus from 'http-status';
import { Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import { tokenService } from '../token';
import { userService } from '../user';
import * as authService from './auth.service';
import { emailService } from '../email';
import config from '../../config/config';

export const register = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.cookie('accessToken', tokens.access.token, config.jwt.cookieOptions);
  res.cookie('refreshToken', tokens.refresh.token, config.jwt.cookieOptions);
  res.status(httpStatus.CREATED).send(user);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.cookie('accessToken', tokens.access.token, config.jwt.cookieOptions);
  res.cookie('refreshToken', tokens.refresh.token, config.jwt.cookieOptions);
  res.send(user);
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  await authService.logout((req.signedCookies as any).refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const { tokens } = await authService.refreshAuth((req.signedCookies as any).refreshToken);
  res.cookie('accessToken', tokens.access.token, config.jwt.cookieOptions);
  res.cookie('refreshToken', tokens.refresh.token, config.jwt.cookieOptions);
  res.status(httpStatus.NO_CONTENT).send();
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.query['token'], req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

export const sendVerificationEmail = catchAsync(async (req: Request, res: Response) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken, req.user.name);
  res.status(httpStatus.NO_CONTENT).send();
});

export const verifyEmail = catchAsync(async (req: Request, res: Response) => {
  await authService.verifyEmail(req.query['token']);
  res.status(httpStatus.NO_CONTENT).send();
});
