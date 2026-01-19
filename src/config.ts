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
    modelId: 'eleven_monolingual_v1',
  },

  // Bot settings
  bot: {
    prefix: process.env.BOT_PREFIX || 'voice:',
    dailyLimit: parseInt(process.env.DAILY_LIMIT || '50', 10),
  },

  // Paths
  paths: {
    root: join(__dirname, '..'),
    authInfo: join(__dirname, '..', 'auth_info'),
    cache: join(__dirname, '..', 'cache'),
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;

export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.elevenlabs.apiKey) {
    errors.push('ELEVENLABS_API_KEY is required');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:');
    errors.forEach((err) => console.error(`  - ${err}`));
    console.error('\nPlease set the required environment variables in .env file');
    process.exit(1);
  }
}
