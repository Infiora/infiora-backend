import axios from 'axios';
import config from '../../config/config';
import { logger } from '../logger';

const revenuecatUrl = 'https://api.revenuecat.com';

export const updateSubscriber = async (user: any) => {
  try {
    const userId = `${user.id}${config.env === 'prod' ? '' : `-${config.env}`}`;
    const conf = {
      headers: { Authorization: `Bearer ${config.revenueCatApiKey}` },
    };

    const res = await axios.get(`${revenuecatUrl}/v1/subscribers/${userId}`, conf);
    await axios.post(
      `${revenuecatUrl}/v1/subscribers/${userId}/attributes`,
      { attributes: { $email: { value: user.email }, $displayName: { value: user.username } } },
      conf
    );

    return res?.data?.subscriber;
  } catch (error: any) {
    logger.error(error.response.data.message);
    return null;
  }
};

export const getSubscriberById = async (user: any) => {
  try {
    const userId = `${user.id}${config.env === 'prod' ? '' : `-${config.env}`}`;
    const conf = {
      headers: { Authorization: `Bearer ${config.revenueCatApiKey}` },
    };
    const res = await axios.get(`${revenuecatUrl}/v1/subscribers/${userId}`, conf);
    return res?.data?.subscriber;
  } catch (error: any) {
    logger.error(error.response.data.message);
    return null;
  }
};
