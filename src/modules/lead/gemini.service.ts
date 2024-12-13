import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/config';
import { logger } from '../logger';

const { geminiApiKey } = config;
const googleAI = new GoogleGenerativeAI(geminiApiKey);

const geminiModel = googleAI.getGenerativeModel({
  model: 'gemini-pro',
});

// eslint-disable-next-line import/prefer-default-export
export const generate = async (promptText: string): Promise<any> => {
  try {
    const result = await geminiModel.generateContent(promptText);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    logger.error(`Gemini: ${error.message}`);
    throw error;
  }
};
