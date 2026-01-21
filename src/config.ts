import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenvConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  // ElevenLabs TTS
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM', // Rachel voice
    modelId: 'eleven_multilingual_v2', // Updated model (supports multiple languages)
  },

  // Bot settings
  bot: {
    prefix: process.env.BOT_PREFIX || 'voice:',
    dailyLimit: parseInt(process.env.DAILY_LIMIT || '10000', 10),
  },

  // Database
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'wppbot',
    password: process.env.DB_PASSWORD || 'wppbot_dev_password',
    name: process.env.DB_NAME || 'wppbot',
  },

  // JWT Authentication
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // API Server
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  // Paths
  paths: {
    root: join(__dirname, '..'),
    authInfo: join(__dirname, '..', 'auth_info'),
    cache: join(__dirname, '..', 'cache'),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Environment
  isProduction: process.env.NODE_ENV === 'production',
} as const;

export function getAuthInfoPath(userId: string): string {
  return join(config.paths.authInfo, userId);
}

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.elevenlabs.apiKey) {
    errors.push('ELEVENLABS_API_KEY is required');
  }

  if (config.isProduction) {
    if (config.jwt.secret === 'dev-secret-change-in-production') {
      errors.push('JWT_SECRET must be set in production');
    }
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\nPlease set the required environment variables in .env file');
    process.exit(1);
  }
}
