import nodemailer from 'nodemailer';
import config from '../../config/config';
import logger from '../logger/logger';
import { Message } from './email.interfaces';

export const transport = nodemailer.createTransport(config.email.smtp);
/* istanbul ignore next */
if (config.env !== 'test') {
  transport
    .verify()
    .then(() => logger.info('Connected to email server'))
    .catch(() => logger.warn('Unable to connect to email server. Make sure you have configured the SMTP options in .env'));
}

/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @param {string} html
 * @returns {Promise<void>}
 */
export const sendEmail = async (to: string, subject: string, text: string, html: string): Promise<void> => {
  const msg: Message = {
    from: config.email.from,
    to,
    subject,
    text,
    html,
  };
  await transport.sendMail(msg);
};

/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
export const sendResetPasswordEmail = async (to: string, token: string): Promise<void> => {
  const subject = 'Reset password';
  // replace this url with the link to the reset password page of your front-end app
  const resetPasswordUrl = `${config.clientUrl}/reset-password?token=${token}`;
  const text = `Hi,
  To reset your password, click on this link: ${resetPasswordUrl}
  If you did not request any password resets, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Dear user,</strong></h4>
  <p>To reset your password, click on this link: ${resetPasswordUrl}</p>
  <p>If you did not request any password resets, please ignore this email.</p>
  <p>Thanks,</p>
  <p><strong>Team ${config.appName}</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendVerificationEmail = async (to: string, token: string, name: string): Promise<void> => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const text = `Hi ${name},
  To verify your email, click on this link: ${verificationEmailUrl}
  If you did not create an account, then ignore this email.`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>To verify your email, click on this link: ${verificationEmailUrl}</p>
  <p>If you did not create an account, then ignore this email.</p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send email verification after registration
 * @param {string} to
 * @param {string} token
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendSuccessfulRegistration = async (to: string, token: string, name: string): Promise<void> => {
  const subject = 'Email Verification';
  // replace this url with the link to the email verification page of your front-end app
  const verificationEmailUrl = `${config.clientUrl}/verify-email?token=${token}`;
  const text = `Hi ${name},
  Congratulations! Your account has been created.
  You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team ${config.appName}`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created.</p>
  <p>You are almost there. Complete the final step by verifying your email at: ${verificationEmailUrl}</p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team ${config.appName}</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send email verification after registration
 * @param {string} to
 * @param {string} name
 * @returns {Promise<void>}
 */
export const sendAccountCreated = async (to: string, name: string): Promise<void> => {
  const subject = 'Account Created Successfully';
  // replace this url with the link to the email verification page of your front-end app
  const loginUrl = `${config.clientUrl}/auth/login`;
  const text = `Hi ${name},
  Congratulations! Your account has been created successfully.
  You can now login at: ${loginUrl}
  Don't hesitate to contact us if you face any problems
  Regards,
  Team ${config.appName}`;
  const html = `<div style="margin:30px; padding:30px; border:1px solid black; border-radius: 20px 10px;"><h4><strong>Hi ${name},</strong></h4>
  <p>Congratulations! Your account has been created successfully.</p>
  <p>You can now login at: ${loginUrl}</p>
  <p>Don't hesitate to contact us if you face any problems</p>
  <p>Regards,</p>
  <p><strong>Team ${config.appName}</strong></p></div>`;
  await sendEmail(to, subject, text, html);
};

/**
 * Send team invite email
 * @param {string} to
 * @param {string} token
 * @returns {Promise<void>}
 */
export const sendTeamInviteEmail = async (to: string, token: string): Promise<void> => {
  const subject = 'Linqon Teams Invite';
  const teamInviteUrl = `${config.hostUrl}/v1/teams/join-team?token=${token}`;
  const text = `Hi,
  Your Team Admin has sent you an invitation to join Linqon Teams.
  To accept the team invitation, click on this link: ${teamInviteUrl}
  If you did not request this invitation, please ignore this email.`;
  const html = `
    <div style="margin: 30px; padding: 30px; border: 1px solid black; border-radius: 20px 10px;">
      <h4><strong>Dear User,</strong></h4>
      <p>Your Team Admin has sent you an invitation to join Linqon Teams</p>
      <p>To accept the team invitation, click on this link: <a href="${teamInviteUrl}">Join Now</a></p>
      <p>If you did not request this invitation, please ignore this email.</p>
      <p>Thanks,</p>
      <p><strong>Team ${config.appName}</strong></p>
    </div>
  `;
  await sendEmail(to, subject, text, html);
};

/**
 * Send a support email with the details provided.
 * @param {SupportDetails} support - The support ticket details.
 * @returns {Promise<void>}
 */
export const sendSupportEmail = async (support: any): Promise<void> => {
  const to = 'support@infiora.hr'; // Define the recipient email
  const subject = 'New Message Received'; // Define the email subject

  // Define the plain text and HTML content
  const text = `New Message Received\n\nFrom: ${support.user.email}\nSubject: ${support.subject}\nMessage: ${support.message}`;
  const html = `
    <div>
      <h4><strong>New Message Received</strong></h4>
      <p><strong>From:</strong> ${support.user.email}</p>
      <p><strong>Subject:</strong> ${support.subject}</p>
      <p><strong>Message:</strong> ${support.message}</p>
    </div>
  `;

  await sendEmail(to, subject, text, html);
};
