import Joi from 'joi';
import 'dotenv/config';

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('prod', 'dev', 'test').required(),
    APP_NAME: Joi.string().required().description('App name'),
    PORT: Joi.number().default(3000),
    ALLOWED_ORIGINS: Joi.any(),
    MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    JWT_SECRET: Joi.string().required().description('JWT secret key'),
    JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which reset password token expires'),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
      .default(10)
      .description('minutes after which verify email token expires'),
    JWT_TEAM_INVITE_EXPIRATION_HOURS: Joi.number().default(48).description('hours after which team invite token expires'),
    SMTP_HOST: Joi.string().description('server that will send the emails'),
    SMTP_PORT: Joi.number().description('port to connect to the email server'),
    SMTP_USERNAME: Joi.string().description('username for email server'),
    SMTP_PASSWORD: Joi.string().description('password for email server'),
    EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    COOKIE_SECRET: Joi.string().required().description('Cookie secret'),
    HOST_URL: Joi.string().required().description('Host url'),
    CLIENT_URL: Joi.string().required().description('Client url'),
    DASH_URL: Joi.string().required().description('Dash url'),
    AWS_REGION: Joi.string().required().description('AWS region'),
    AWS_ACCESS_KEY: Joi.string().required().description('AWS access key'),
    AWS_SECRET_KEY: Joi.string().required().description('AWS secret key'),
    AWS_BUCKET_NAME: Joi.string().required().description('AWS bucket name'),
    REVENUE_CAT_API_KEY: Joi.string().description('RevenueCat api key'),
    GEMINI_API_KEY: Joi.string().description('Gemini api key'),
    STRIPE_SECRET_KEY: Joi.string().description('Stripe secret key'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  appName: envVars.APP_NAME,
  port: envVars.PORT,
  allowedOrigins: envVars.ALLOWED_ORIGINS,
  mongoose: {
    url: envVars.MONGODB_URL + (envVars.NODE_ENV !== 'prod' ? `-${envVars.NODE_ENV}` : ''),
    options: {
      useCreateIndex: true,
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
    teamInviteExpirationHours: envVars.JWT_TEAM_INVITE_EXPIRATION_HOURS,
    cookieOptions: {
      httpOnly: true,
      secure: envVars.ENV === 'prod',
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
  hostUrl: envVars.HOST_URL,
  clientUrl: envVars.CLIENT_URL,
  dashUrl: envVars.DASH_URL,
  aws: {
    region: envVars.AWS_REGION,
    accessKey: envVars.AWS_ACCESS_KEY,
    secretKey: envVars.AWS_SECRET_KEY,
    bucketName: envVars.AWS_BUCKET_NAME,
  },
  revenueCatApiKey: envVars.REVENUE_CAT_API_KEY,
  geminiApiKey: envVars.GEMINI_API_KEY,
  stripe: { secretKey: envVars.STRIPE_SECRET_KEY },
};

export default config;
