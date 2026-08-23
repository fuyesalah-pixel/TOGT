export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  valkeyUrl: process.env.VALKEY_URL ?? 'redis://localhost:6379',
  jwt: {
    accessSecret:
      process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET ?? 'dev_access_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '604800', 10),
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ??
      'http://localhost:3001/api/auth/google/callback',
  },
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? '',
    endpoint: process.env.R2_ENDPOINT ?? '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    bucket: process.env.R2_BUCKET_NAME ?? process.env.R2_BUCKET ?? 'togt-uploads',
    publicUrl: process.env.R2_PUBLIC_URL ?? '',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    from: process.env.EMAIL_FROM ?? 'TOGT <noreply@togt.com>',
  },
  sms: {
    token: process.env.SMS_ETHIOPIA_API_KEY ?? process.env.SMS_ETHIOPIA_TOKEN ?? '',
    senderId: process.env.SMS_ETHIOPIA_SENDER_ID ?? 'TOGT',
  },
  hostingerSmtp: {
    host: process.env.HOSTINGER_SMTP_HOST ?? 'smtp.hostinger.com',
    port: parseInt(process.env.HOSTINGER_SMTP_PORT ?? '465', 10),
    user: process.env.HOSTINGER_SMTP_USER ?? '',
    password: process.env.HOSTINGER_SMTP_PASSWORD ?? '',
    from: process.env.HOSTINGER_SMTP_FROM ?? '',
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
});
