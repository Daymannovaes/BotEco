export interface VoiceStyle {
  name: string;
  description: string;
  prompt: string; // Instruction for TTS/AI on how to speak
  aliases: string[];
  stability?: number; // ElevenLabs parameter (0-1)
  similarity_boost?: number; // ElevenLabs parameter (0-1)
  style?: number; // ElevenLabs parameter (0-1)
}

export const VOICE_STYLES: Record<string, VoiceStyle> = {
  villain: {
    name: 'Movie Villain',
    description: 'Menacing, slow, dramatic pauses',
    prompt: 'Speak like a menacing movie villain with dramatic pauses, slow and deliberate delivery, emphasizing key words ominously.',
    aliases: ['villain', 'evil', 'menacing', 'bad guy', 'antagonist'],
    stability: 0.3,
    similarity_boost: 0.8,
    style: 0.7,
  },

  trailer: {
    name: 'Movie Trailer',
    description: 'Epic, dramatic announcer voice',
    prompt: 'Speak like an epic movie trailer announcer with a deep, dramatic voice. Add dramatic emphasis and building intensity.',
    aliases: ['trailer', 'movie trailer', 'epic', 'announcer', 'dramatic', 'narrator'],
    stability: 0.4,
    similarity_boost: 0.75,
    style: 0.8,
  },

  pirate: {
    name: 'Pirate',
    description: 'Arrr matey style',
    prompt: 'Speak like a gruff sea pirate, with "arrr"s and nautical expressions. Roll the R sounds and be boisterous.',
    aliases: ['pirate', 'captain', 'buccaneer', 'sailor', 'arrr'],
    stability: 0.35,
    similarity_boost: 0.7,
    style: 0.75,
  },

  whisper: {
    name: 'Whisper/ASMR',
    description: 'Soft, intimate whisper',
    prompt: 'Whisper softly and intimately, like an ASMR video. Very gentle and soothing.',
    aliases: ['whisper', 'asmr', 'soft', 'quiet', 'gentle', 'mysterious'],
    stability: 0.6,
    similarity_boost: 0.9,
    style: 0.3,
  },

  excited: {
    name: 'Excited',
    description: 'High energy, enthusiastic',
    prompt: 'Speak with extreme enthusiasm and excitement, like you just received amazing news!',
    aliases: ['excited', 'enthusiastic', 'happy', 'joyful', 'hyped', 'pumped'],
    stability: 0.25,
    similarity_boost: 0.65,
    style: 0.9,
  },

  robot: {
    name: 'Robot',
    description: 'Monotone, mechanical',
    prompt: 'Speak in a flat, monotone robotic voice. Very mechanical and precise.',
    aliases: ['robot', 'robotic', 'mechanical', 'ai', 'computer', 'monotone'],
    stability: 0.9,
    similarity_boost: 0.5,
    style: 0.1,
  },

  drill_sergeant: {
    name: 'Drill Sergeant',
    description: 'Loud, commanding',
    prompt: 'Bark commands like a military drill sergeant. Loud, authoritative, and demanding.',
    aliases: ['drill sergeant', 'sergeant', 'military', 'commander', 'army', 'commanding'],
    stability: 0.3,
    similarity_boost: 0.7,
    style: 0.85,
  },

  nature_documentary: {
    name: 'Nature Documentary',
    description: 'Calm, observational narrator',
    prompt: 'Speak in a calm, measured tone like a nature documentary narrator observing wildlife. Thoughtful pauses and wonder.',
    aliases: ['nature', 'documentary', 'david attenborough', 'narrator', 'calm', 'observational'],
    stability: 0.65,
    similarity_boost: 0.85,
    style: 0.4,
  },

  sports: {
    name: 'Sports Announcer',
    description: 'Excited, fast-paced commentary',
    prompt: 'Deliver like an excited sports announcer calling a big play. Fast-paced, energetic, building tension!',
    aliases: ['sports', 'sports announcer', 'commentator', 'play-by-play', 'broadcaster'],
    stability: 0.25,
    similarity_boost: 0.65,
    style: 0.85,
  },

  grandma: {
    name: 'Sweet Grandma',
    description: 'Sweet, slow, caring',
    prompt: 'Speak like a sweet, loving grandmother. Warm, gentle, and caring with a soft tone.',
    aliases: ['grandma', 'grandmother', 'granny', 'nana', 'sweet', 'caring'],
    stability: 0.7,
    similarity_boost: 0.85,
    style: 0.35,
  },

  sarcastic: {
    name: 'Sarcastic',
    description: 'Deadpan, ironic tone',
    prompt: 'Deliver with heavy sarcasm and a deadpan tone. Dripping with irony.',
    aliases: ['sarcastic', 'sarcasm', 'ironic', 'deadpan', 'dry', 'cynical'],
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.6,
  },

  angry: {
    name: 'Angry',
    description: 'Furious, aggressive',
    prompt: 'Speak with intense anger and frustration. Aggressive and heated.',
    aliases: ['angry', 'mad', 'furious', 'rage', 'frustrated', 'pissed'],
    stability: 0.2,
    similarity_boost: 0.6,
    style: 0.9,
  },

  bored: {
    name: 'Bored',
    description: 'Disinterested, lazy delivery',
    prompt: 'Speak with complete boredom and disinterest. Lazy, drawn-out, like you could not care less.',
    aliases: ['bored', 'boring', 'tired', 'lazy', 'uninterested', 'sleepy'],
    stability: 0.75,
    similarity_boost: 0.8,
    style: 0.2,
  },

  news: {
    name: 'News Anchor',
    description: 'Professional, authoritative',
    prompt: 'Deliver like a professional news anchor. Clear, authoritative, and measured.',
    aliases: ['news', 'news anchor', 'reporter', 'journalist', 'newsreader', 'professional'],
    stability: 0.65,
    similarity_boost: 0.8,
    style: 0.45,
  },

  shakespearean: {
    name: 'Shakespearean',
    description: 'Theatrical, dramatic',
    prompt: 'Perform with theatrical Shakespearean flair. Grand, dramatic, with classical actor energy.',
    aliases: ['shakespeare', 'shakespearean', 'theatrical', 'actor', 'stage', 'dramatic actor'],
    stability: 0.35,
    similarity_boost: 0.75,
    style: 0.8,
  },
};

export function getStyleByName(name: string): VoiceStyle | null {
  const normalized = name.toLowerCase().trim();

  // Direct match
  if (VOICE_STYLES[normalized]) {
    return VOICE_STYLES[normalized];
  }

  // Search by alias
  for (const style of Object.values(VOICE_STYLES)) {
    if (style.aliases.some((alias) => normalized.includes(alias) || alias.includes(normalized))) {
      return style;
    }
  }

  return null;
}

export function getAllStyleNames(): string[] {
  return Object.keys(VOICE_STYLES);
}

export function getStylesHelp(): string {
  const lines = ['Available voice styles:'];
  for (const [key, style] of Object.entries(VOICE_STYLES)) {
    lines.push(`  • ${key}: ${style.description}`);
  }
  return lines.join('\n');
}
