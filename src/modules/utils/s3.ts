import fs from 'fs';
import AWS, { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { PromiseResult } from 'aws-sdk/lib/request';
import config from '../../config/config';

AWS.config.update({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey,
  region: config.aws.region,
});

const s3 = new AWS.S3();

// uploads a file to s3
export const uploadFile = async (file: Express.Multer.File, type: string): Promise<string> => {
  const fileStream = fs.createReadStream(file.path);
  let Key = `${type}/${uuidv4()}${path.extname(file.originalname)}`;
  Key = `uploads/${config.env}/${Key}`;

  const uploadParams: AWS.S3.PutObjectRequest = {
    Bucket: config.aws.bucketName,
    Body: fileStream,
    Key,
    ContentType: file.mimetype,
  };

  const { Location } = await s3.upload(uploadParams).promise();

  fs.unlink(file.path, () => {});

  return Location;
};

// downloads a file from s3
export const getFile = async (key: string): Promise<PromiseResult<S3.GetObjectOutput, AWS.AWSError>> => {
  const downloadParams = {
    Key: key,
    Bucket: config.aws.bucketName,
  };
  const file = await s3.getObject(downloadParams).promise();

  return file;
};
