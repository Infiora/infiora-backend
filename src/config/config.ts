import Joi from 'joi';
import 'dotenv/config';

// Define validation schema
const envVarsSchema = Joi.object()
  .keys({
    // Environment Configuration
    NODE_ENV: Joi.string().valid('prod', 'dev', 'test'),
    APP_NAME: Joi.string().required().description('Application name'),
    PORT: Joi.number().default(3000).description('Application port number'),
    ALLOWED_ORIGINS: Joi.string().description('Comma-separated list of allowed CORS origins'),

    // Database Configuration
    MONGODB_URL: Joi.string().required().description('MongoDB connection URL'),

    // JWT Configuration
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('Access token expiration in minutes'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('Refresh token expiration in days'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('Password reset token expiration in minutes'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('Email verification token expiration in minutes'),

    // Email Configuration
    SMTP_HOST: Joi.string().required().description('SMTP server for sending emails'),
    SMTP_PORT: Joi.number().default(587).description('SMTP server port'),
    SMTP_USERNAME: Joi.string().required().description('SMTP server username'),
    SMTP_PASSWORD: Joi.string().required().description('SMTP server password'),
    EMAIL_FROM: Joi.string().required().description('Sender email address'),

    // Security & Cookies
    COOKIE_SECRET: Joi.string().required().description('Secret key for signing cookies'),

    // Application URLs
    HOST_URL: Joi.string().required().description('Backend API host URL'),
    APP_URL: Joi.string().required().description('Frontend application URL'),
    DASH_URL: Joi.string().required().description('Dashboard URL'),

    // AWS S3 Configuration
    AWS_REGION: Joi.string().required().description('AWS region'),
    AWS_ACCESS_KEY: Joi.string().required().description('AWS access key'),
    AWS_SECRET_KEY: Joi.string().required().description('AWS secret key'),
    AWS_BUCKET_NAME: Joi.string().required().description('AWS S3 bucket name'),
  })
  .unknown();

// Validate environment variables
const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration object
const config = {
  env: envVars.NODE_ENV || 'dev',
  appName: envVars.APP_NAME,
  port: envVars.PORT,
  allowedOrigins: envVars.ALLOWED_ORIGINS ? envVars.ALLOWED_ORIGINS.split(',') : [],
  mongoose: {
    url: `${envVars.MONGODB_URL}${envVars.NODE_ENV !== 'prod' ? `-${envVars.NODE_ENV}` : ''}`,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.NODE_ENV === 'prod',
      signed: true,
    },
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  cookieSecret: envVars.COOKIE_SECRET,
  urls: {
    host: envVars.HOST_URL,
    app: envVars.APP_URL,
    dash: envVars.DASH_URL,
  },
  aws: {
    region: envVars.AWS_REGION,
    accessKey: envVars.AWS_ACCESS_KEY,
    secretKey: envVars.AWS_SECRET_KEY,
    bucketName: envVars.AWS_BUCKET_NAME,
  },
};

export default config;
