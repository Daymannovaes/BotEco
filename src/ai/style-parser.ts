import { VoiceStyle, getStyleByName, VOICE_STYLES } from '../voice/styles.js';

export interface ParsedInstruction {
  style: VoiceStyle;
  rawStyle: string;
  transformText?: boolean; // Whether to transform the text content (e.g., "summarize like a pirate")
  transformation?: 'summarize' | 'translate' | 'rewrite';
}

// Patterns to detect style instructions
const STYLE_PATTERNS = [
  // "say it like a villain"
  /^(?:say|speak|read)\s+(?:it|this|that)\s+(?:like|as)\s+(?:a\s+|an\s+)?(.+)$/i,

  // "read it dramatically"
  /^(?:say|speak|read)\s+(?:it|this|that)\s+(.+ly)$/i,

  // "say this like you're a villain"
  /^(?:say|speak|read)\s+(?:it|this|that)\s+(?:like\s+)?(?:you(?:'re|'re| are)\s+)?(?:a\s+|an\s+)?(.+)$/i,

  // "voice: villain"
  /^voice[:\s]+(.+)$/i,

  // "villain voice"
  /^(.+)\s+voice$/i,

  // "in a villain voice"
  /^in\s+(?:a\s+|an\s+)?(.+)\s+voice$/i,

  // "sound like a villain"
  /^sound\s+(?:like\s+)?(?:a\s+|an\s+)?(.+)$/i,

  // "be dramatic"
  /^be\s+(?:a\s+|an\s+)?(.+)$/i,

  // "dramatically"
  /^(.+ly)$/i,

  // "as a villain"
  /^as\s+(?:a\s+|an\s+)?(.+)$/i,

  // "whisper this"
  /^(whisper|shout|yell|scream)\s+(?:it|this|that)?$/i,

  // "do it villain style"
  /^(?:do\s+(?:it|this)\s+)?(.+)\s+style$/i,
];

// Patterns that indicate text transformation
const TRANSFORM_PATTERNS = [
  // "summarize like a pirate"
  /^summar(?:y|ize)\s+(?:it\s+)?(?:like|as)\s+(?:a\s+|an\s+)?(.+)$/i,

  // "rewrite as a villain"
  /^rewrite\s+(?:it\s+)?(?:like|as)\s+(?:a\s+|an\s+)?(.+)$/i,
];

// Adverb to style mapping
const ADVERB_MAP: Record<string, string> = {
  dramatically: 'trailer',
  menacingly: 'villain',
  excitedly: 'excited',
  angrily: 'angry',
  sarcastically: 'sarcastic',
  robotically: 'robot',
  softly: 'whisper',
  quietly: 'whisper',
  loudly: 'drill_sergeant',
  boredly: 'bored',
  sleepily: 'bored',
  professionally: 'news',
  theatrically: 'shakespearean',
  calmly: 'nature_documentary',
};

export function parseStyleInstruction(text: string): ParsedInstruction | null {
  const trimmed = text.trim();

  // Check for transform patterns first
  for (const pattern of TRANSFORM_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const rawStyle = match[1].trim();
      const style = findBestStyleMatch(rawStyle);
      if (style) {
        return {
          style,
          rawStyle,
          transformText: true,
          transformation: trimmed.toLowerCase().startsWith('summar') ? 'summarize' : 'rewrite',
        };
      }
    }
  }

  // Check for standard style patterns
  for (const pattern of STYLE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const rawStyle = match[1].trim();
      const style = findBestStyleMatch(rawStyle);
      if (style) {
        return { style, rawStyle };
      }
    }
  }

  // Check if the entire message is just a style name
  const directStyle = findBestStyleMatch(trimmed);
  if (directStyle) {
    return { style: directStyle, rawStyle: trimmed };
  }

  return null;
}

function findBestStyleMatch(input: string): VoiceStyle | null {
  const normalized = input.toLowerCase().trim();

  // Check adverb mapping
  if (ADVERB_MAP[normalized]) {
    return VOICE_STYLES[ADVERB_MAP[normalized]];
  }

  // Direct style lookup
  const style = getStyleByName(normalized);
  if (style) {
    return style;
  }

  // Try fuzzy matching - check if input contains any style keyword
  for (const [key, styleObj] of Object.entries(VOICE_STYLES)) {
    // Check if the style key is in the input
    if (normalized.includes(key)) {
      return styleObj;
    }

    // Check aliases
    for (const alias of styleObj.aliases) {
      if (normalized.includes(alias) || alias.includes(normalized)) {
        return styleObj;
      }
    }
  }

  // Check for partial matches in common descriptors
  const descriptorMap: Record<string, string> = {
    'movie': 'trailer',
    'epic': 'trailer',
    'evil': 'villain',
    'dark': 'villain',
    'gentle': 'whisper',
    'soft': 'whisper',
    'happy': 'excited',
    'energetic': 'excited',
    'monotone': 'robot',
    'flat': 'robot',
    'military': 'drill_sergeant',
    'yelling': 'drill_sergeant',
    'nature': 'nature_documentary',
    'documentary': 'nature_documentary',
    'sport': 'sports',
    'commentary': 'sports',
    'old': 'grandma',
    'sweet': 'grandma',
    'ironic': 'sarcastic',
    'dry': 'sarcastic',
    'mad': 'angry',
    'frustrated': 'angry',
    'tired': 'bored',
    'disinterested': 'bored',
    'anchor': 'news',
    'reporter': 'news',
    'theater': 'shakespearean',
    'classical': 'shakespearean',
  };

  for (const [keyword, styleKey] of Object.entries(descriptorMap)) {
    if (normalized.includes(keyword)) {
      return VOICE_STYLES[styleKey];
    }
  }

  return null;
}

export function isStyleInstruction(text: string): boolean {
  return parseStyleInstruction(text) !== null;
}

export function extractStyleFromText(text: string): { style: VoiceStyle | null; cleanText: string } {
  const parsed = parseStyleInstruction(text);

  if (!parsed) {
    return { style: null, cleanText: text };
  }

  // Remove the style instruction from the text
  let cleanText = text;
  for (const pattern of [...STYLE_PATTERNS, ...TRANSFORM_PATTERNS]) {
    cleanText = cleanText.replace(pattern, '').trim();
  }

  return { style: parsed.style, cleanText };
}
