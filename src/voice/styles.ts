export interface VoiceStyle {
  name: string;
  description: string;
  prompt: string; // Instruction for TTS/AI on how to speak
  aliases: string[];
  stability?: number; // ElevenLabs parameter (0-1)
  similarity_boost?: number; // ElevenLabs parameter (0-1)
  style?: number; // ElevenLabs parameter (0-1)
  voiceId?: string; // Voice ID from ElevenLabs library
}

export const VOICE_STYLES: Record<string, VoiceStyle> = {
  vilao: {
    name: 'Vilão de Filme',
    description: 'Ameaçador, lento, pausas dramáticas',
    prompt: 'Speak like a menacing movie villain with dramatic pauses, slow and deliberate delivery, emphasizing key words ominously.',
    aliases: ['villain', 'evil', 'menacing', 'bad guy', 'antagonist', 'vilão', 'vilao', 'mal', 'malvado'],
    stability: 0.25,
    similarity_boost: 0.7,
    style: 0.85,
    voiceId: '17emZEdpFxzVxRKIMpMN', // Freaky Frenzy Robot
  },

  trailer: {
    name: 'Trailer de Filme',
    description: 'Voz épica e dramática de narrador',
    prompt: 'Speak like an epic movie trailer announcer with a deep, dramatic voice. Add dramatic emphasis and building intensity.',
    aliases: ['trailer', 'movie trailer', 'epic', 'announcer', 'dramatic', 'narrator', 'épico', 'epico', 'narrador'],
    stability: 0.4,
    similarity_boost: 0.75,
    style: 0.8,
    voiceId: '7i7dgyCkKt4c16dLtwT3', // David - Epic Trailer (Brazilian)
  },

  pirata: {
    name: 'Pirata',
    description: 'Estilo "arrr" de marujo',
    prompt: 'Speak like a gruff sea pirate, with "arrr"s and nautical expressions. Roll the R sounds and be boisterous.',
    aliases: ['pirate', 'captain', 'buccaneer', 'sailor', 'arrr', 'pirata', 'capitão', 'capitao', 'marujo'],
    stability: 0.35,
    similarity_boost: 0.7,
    style: 0.75,
    voiceId: 'kUUTqKQ05NMGulF08DDf', // Guadeloupe Merryweather - Pirate
  },

  sussurro: {
    name: 'Sussurro/ASMR',
    description: 'Sussurro suave e íntimo',
    prompt: 'Whisper softly and intimately, like an ASMR video. Very gentle and soothing.',
    aliases: ['whisper', 'asmr', 'soft', 'quiet', 'gentle', 'mysterious', 'sussurro', 'sussurrar', 'suave', 'misterioso'],
    stability: 0.8,
    similarity_boost: 0.9,
    style: 0.2,
    voiceId: 'EeTjZnu1OfgjhGKT6ywY', // Lax Whisper (Brazilian)
  },

  animado: {
    name: 'Animado',
    description: 'Alta energia, entusiasmado',
    prompt: 'Speak with extreme enthusiasm and excitement, like you just received amazing news!',
    aliases: ['excited', 'enthusiastic', 'happy', 'joyful', 'hyped', 'pumped', 'animado', 'entusiasmado', 'feliz', 'empolgado'],
    stability: 0.2,
    similarity_boost: 0.5,
    style: 1.0,
    voiceId: 'YU8EsJtXFMyKMxYtheDk', // Mário - Excited (Brazilian)
  },

  robo: {
    name: 'Robô',
    description: 'Monótono, mecânico',
    prompt: 'Speak in a flat, monotone robotic voice. Very mechanical and precise.',
    aliases: ['robot', 'robotic', 'mechanical', 'ai', 'computer', 'monotone', 'robô', 'robo', 'mecânico', 'mecanico'],
    stability: 0.95,
    similarity_boost: 0.3,
    style: 0.0,
    voiceId: 'ee2pDOfqzj2pBerZvUCH', // Rocco - Mechanical Robotic
  },

  sargento: {
    name: 'Sargento',
    description: 'Alto, comandante',
    prompt: 'Bark commands like a military drill sergeant. Loud, authoritative, and demanding.',
    aliases: ['drill sergeant', 'sergeant', 'military', 'commander', 'army', 'commanding', 'sargento', 'militar', 'comandante', 'exército'],
    stability: 0.15,
    similarity_boost: 0.5,
    style: 1.0,
    voiceId: 'QWzA13xdHsD8GLBwVILU', // Will - Intense Dramatic (Brazilian)
  },

  documentario: {
    name: 'Documentário de Natureza',
    description: 'Calmo, narrador observador',
    prompt: 'Speak in a calm, measured tone like a nature documentary narrator observing wildlife. Thoughtful pauses and wonder.',
    aliases: ['nature', 'documentary', 'david attenborough', 'narrator', 'calm', 'observational', 'natureza', 'documentário', 'documentario', 'calmo'],
    stability: 0.65,
    similarity_boost: 0.85,
    style: 0.4,
    voiceId: 'rVRk0uJAtO8T38Gm03mf', // Danilo Tenfen (Brazilian)
  },

  esportivo: {
    name: 'Narrador Esportivo',
    description: 'Animado, comentário acelerado',
    prompt: 'Deliver like an excited sports announcer calling a big play. Fast-paced, energetic, building tension!',
    aliases: ['sports', 'sports announcer', 'commentator', 'play-by-play', 'broadcaster', 'esporte', 'esportivo', 'narrador', 'futebol', 'gol'],
    stability: 0.25,
    similarity_boost: 0.65,
    style: 0.85,
    voiceId: 'v3a2WxCpk7965Lwrexlc', // Gustavo Sancho - Emotive (Brazilian)
  },

  vovo: {
    name: 'Vovó Querida',
    description: 'Doce, lento, carinhoso',
    prompt: 'Speak like a sweet, loving grandmother. Warm, gentle, and caring with a soft tone.',
    aliases: ['grandma', 'grandmother', 'granny', 'nana', 'sweet', 'caring', 'vovó', 'vovo', 'avó', 'avo', 'velhinha'],
    stability: 0.7,
    similarity_boost: 0.85,
    style: 0.35,
    voiceId: 'RGbeQtiShYRDVCrd9b9w', // Sergio Funny (Brazilian old man)
  },

  sarcastico: {
    name: 'Sarcástico',
    description: 'Tom irônico e debochado',
    prompt: 'Deliver with heavy sarcasm and a deadpan tone. Dripping with irony.',
    aliases: ['sarcastic', 'sarcasm', 'ironic', 'deadpan', 'dry', 'cynical', 'sarcástico', 'sarcastico', 'irônico', 'ironico', 'debochado'],
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.6,
    voiceId: 'IlrWo5tGgTuxNTHyGhWD', // Vagner de Souza (Brazilian)
  },

  bravo: {
    name: 'Bravo',
    description: 'Furioso, agressivo',
    prompt: 'Speak with intense anger and frustration. Aggressive and heated.',
    aliases: ['angry', 'mad', 'furious', 'rage', 'frustrated', 'pissed', 'bravo', 'raiva', 'furioso', 'irritado', 'puto'],
    stability: 0.2,
    similarity_boost: 0.6,
    style: 0.9,
    voiceId: 'PSkrmGGNwoOIKXqzUWs9', // Açougueirão - Evil Cartoon (Brazilian)
  },

  entediado: {
    name: 'Entediado',
    description: 'Desinteressado, preguiçoso',
    prompt: 'Speak with complete boredom and disinterest. Lazy, drawn-out, like you could not care less.',
    aliases: ['bored', 'boring', 'tired', 'lazy', 'uninterested', 'sleepy', 'entediado', 'cansado', 'preguiçoso', 'preguicoso', 'sono'],
    stability: 0.9,
    similarity_boost: 0.8,
    style: 0.1,
    voiceId: 'SVgp5d1fyFQRW1eQbwkq', // Lucas - Calm Steady (Brazilian)
  },

  jornal: {
    name: 'Âncora de Jornal',
    description: 'Profissional, autoritário',
    prompt: 'Deliver like a professional news anchor. Clear, authoritative, and measured.',
    aliases: ['news', 'news anchor', 'reporter', 'journalist', 'newsreader', 'professional', 'jornal', 'notícia', 'noticia', 'repórter', 'reporter', 'jornalista'],
    stability: 0.65,
    similarity_boost: 0.8,
    style: 0.45,
    voiceId: 'eUAnqvLQWNX29twcYLUM', // Dyego - News Presenter (Brazilian)
  },

  teatral: {
    name: 'Teatral',
    description: 'Teatral, dramático',
    prompt: 'Perform with theatrical Shakespearean flair. Grand, dramatic, with classical actor energy.',
    aliases: ['shakespeare', 'shakespearean', 'theatrical', 'actor', 'stage', 'dramatic actor', 'teatro', 'teatral', 'ator', 'dramático', 'dramatico'],
    stability: 0.35,
    similarity_boost: 0.75,
    style: 0.8,
    voiceId: 'TzryZkieeczAsBkDJXcH', // Claudio - Vibrant Magnetic (Brazilian)
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
  const lines = ['Estilos de voz disponíveis:'];
  for (const [key, style] of Object.entries(VOICE_STYLES)) {
    lines.push(`  • ${key}: ${style.description}`);
  }
  lines.push('');
  lines.push('Exemplos de uso:');
  lines.push('  • "fale como um vilão"');
  lines.push('  • "voz de pirata"');
  lines.push('  • "sussurre isso"');
  lines.push('  • "seja um robô"');
  return lines.join('\n');
}
