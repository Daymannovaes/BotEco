import { config } from '../config.js';
import { VoiceStyle } from './styles.js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface TTSRequest {
  text: string;
  model_id: string;
  voice_settings: VoiceSettings;
}

export async function generateVoice(text: string, style: VoiceStyle): Promise<Buffer> {
  const voiceId = config.elevenlabs.voiceId;
  const apiKey = config.elevenlabs.apiKey;

  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Prepare the text with style prompt
  const styledText = prepareTextForStyle(text, style);

  const requestBody: TTSRequest = {
    text: styledText,
    model_id: config.elevenlabs.modelId,
    voice_settings: {
      stability: style.stability ?? 0.5,
      similarity_boost: style.similarity_boost ?? 0.75,
      style: style.style ?? 0.5,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function prepareTextForStyle(text: string, style: VoiceStyle): string {
  // Add style-specific modifications to the text
  // ElevenLabs responds well to parenthetical stage directions

  switch (style.name) {
    case 'Movie Villain':
      // Add dramatic pauses
      return `(speaking menacingly with dramatic pauses) ${text}`;

    case 'Movie Trailer':
      // Epic announcer style
      return `(in an epic movie trailer announcer voice) ${text}`;

    case 'Pirate':
      // Add pirate flair
      return `(in a gruff pirate accent) Arrr! ${text}`;

    case 'Whisper/ASMR':
      // Whisper
      return `(whispering softly) ${text}`;

    case 'Excited':
      // Add exclamation energy
      return `(extremely excited and enthusiastic) ${text}!`;

    case 'Robot':
      // Mechanical delivery
      return `(in a flat, robotic, monotone voice) ${text}`;

    case 'Drill Sergeant':
      // Commanding
      return `(shouting like a drill sergeant) ${text.toUpperCase()}!`;

    case 'Nature Documentary':
      // Calm observation
      return `(calmly, like a nature documentary narrator) ${text}`;

    case 'Sports Announcer':
      // Excited commentary
      return `(excitedly, like a sports commentator) ${text}!`;

    case 'Sweet Grandma':
      // Warm and caring
      return `(warmly, like a loving grandmother) Oh dear, ${text}`;

    case 'Sarcastic':
      // Deadpan irony
      return `(sarcastically, with heavy irony) ${text}`;

    case 'Angry':
      // Furious
      return `(angrily, with frustration) ${text}!`;

    case 'Bored':
      // Disinterested
      return `(boredly, with complete disinterest) ${text}...`;

    case 'News Anchor':
      // Professional
      return `(professionally, like a news anchor) ${text}`;

    case 'Shakespearean':
      // Theatrical
      return `(dramatically, with theatrical flair) ${text}`;

    default:
      return text;
  }
}

export async function checkApiKeyValid(): Promise<boolean> {
  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      headers: {
        'xi-api-key': config.elevenlabs.apiKey,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function getAvailableVoices(): Promise<unknown[]> {
  const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
    headers: {
      'xi-api-key': config.elevenlabs.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch voices');
  }

  const data = (await response.json()) as { voices: unknown[] };
  return data.voices;
}

export async function getUserSubscription(): Promise<{
  character_count: number;
  character_limit: number;
}> {
  const response = await fetch(`${ELEVENLABS_API_URL}/user/subscription`, {
    headers: {
      'xi-api-key': config.elevenlabs.apiKey,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch subscription info');
  }

  return (await response.json()) as { character_count: number; character_limit: number };
}
