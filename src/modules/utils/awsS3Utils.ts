import fs from 'fs';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { PromiseResult } from 'aws-sdk/lib/request';
import config from '../../config/config';
import { logger } from '../logger';

AWS.config.update({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey,
  region: config.aws.region,
});

const s3 = new AWS.S3();

// Uploads a file to S3
export const uploadToS3 = async (file: Express.Multer.File, type: string): Promise<string> => {
  try {
    const fileStream = fs.createReadStream(file.path);
    const Key = `uploads${config.env === 'prod' ? '' : '/dev'}/${type}/${uuidv4()}${path.extname(file.originalname)}`;

    const uploadParams: AWS.S3.PutObjectRequest = {
      Bucket: config.aws.bucketName,
      Body: fileStream,
      Key,
      ContentType: file.mimetype,
    };

    const { Location } = await s3.upload(uploadParams).promise();

    fs.unlink(file.path, (err) => {
      if (err) {
        logger.error(`Error deleting temporary file: ${file.path}`, err);
      }
    });

    return Location;
  } catch (error) {
    logger.error('Error uploading file to S3:', error);
    throw new Error('File upload failed');
  }
};

// Downloads a file from S3
export const getFromS3 = async (key: string): Promise<PromiseResult<S3.GetObjectOutput, AWS.AWSError>> => {
  try {
    const downloadParams = {
      Key: key,
      Bucket: config.aws.bucketName,
    };
    return await s3.getObject(downloadParams).promise();
  } catch (error) {
    logger.error('Error downloading file from S3:', error);
    throw new Error('File download failed');
  }
};
