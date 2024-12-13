import admin from 'firebase-admin';
import fs from 'fs';
import { logger } from '../logger';

try {
  // Read the service account key file
  const data = fs.readFileSync('./src/keys/firebaseKey.json', 'utf8');

  // Parse the JSON data
  const serviceAccount = JSON.parse(data);

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  logger.info('Firebase Admin initialized successfully');
} catch (error: any) {
  // Log the error message
  logger.error(`Firebase initialization error: ${error.message}`);
}
