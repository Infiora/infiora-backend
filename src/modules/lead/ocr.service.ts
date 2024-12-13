import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';
import { logger } from '../logger';
import config from '../../config/config';
import * as geminiService from './gemini.service';

// Configure AWS with your access and secret key.
AWS.config.update({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey,
  region: 'us-west-2', // e.g., 'us-west-2'
});

// Create instances of the AWS Textract
const textract = new AWS.Textract();

// Function to extract text from an image using AWS Textract
async function extractTextFromImage(file: any): Promise<string> {
  const supportedFormats = ['.png', '.jpg', '.jpeg', '.pdf'];
  const fileExt = path.extname(file.path).toLowerCase();

  if (!supportedFormats.includes(fileExt)) {
    throw new Error('Unsupported document format. Supported formats are PNG, JPEG, and PDF.');
  }

  const imageBytes = fs.readFileSync(file.path);
  fs.unlink(file.path, () => {});
  const params: AWS.Textract.Types.DetectDocumentTextRequest = {
    Document: {
      Bytes: imageBytes,
    },
  };

  try {
    const data = await textract.detectDocumentText(params).promise();
    const extractedText =
      data.Blocks?.filter((block) => block.BlockType === 'LINE')
        .map((block) => block.Text)
        .join('\n') || '';
    return extractedText;
  } catch (error) {
    logger.error(`Error extracting text from image: ${error}`);
    throw error;
  }
}

/**
 * Scan card
 * @param {any} file
 * @returns {Promise<any>}
 */
// eslint-disable-next-line import/prefer-default-export
export const scanCard = async (file: any): Promise<any> => {
  try {
    const extractedText = await extractTextFromImage(file);
    const input: string = await geminiService.generate(
      `Extract name, jobTitle, company, email, phone, website, and location from the given text. if website is not found and theres and business email with custom domain use domain as website. Return as a JavaScript object: text:${extractedText}`
    );
    // Remove the curly braces and split the string by newlines to get key-value pairs
    const lines = input
      .replace(/[{}]/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line);

    const result: any = {};

    lines.forEach((line) => {
      const [keyPart, valuePart] = line.split(':');
      if (!keyPart || !valuePart) {
        logger.error(`Invalid line: ${line}`);
        return;
      }

      const key = keyPart.trim();
      const rawValue = valuePart.trim();

      const cleanValue = rawValue.replace(/['",]/g, '').replace(/\\n/g, '\n').replace('null', '');
      result[key] = cleanValue;
    });

    return result;
  } catch (error) {
    logger.error(error);
  }
};
