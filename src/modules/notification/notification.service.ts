import admin from 'firebase-admin';
import logger from '../logger/logger';

const { messaging } = admin;

/**
 * Send an notification
 * @param {string} tokens
 * @param {string} title
 * @param {string} body
 * @returns {Promise<void>}
 */
// eslint-disable-next-line import/prefer-default-export
export const sendNotification = async (tokens: any, title: any, body: any): Promise<void> => {
  try {
    await Promise.all(
      tokens.map((token: string) => {
        return messaging().send({
          notification: {
            title,
            body,
          },
          token,
        });
      })
    );
  } catch (error: any) {
    logger.error(error.message);
  }
};
