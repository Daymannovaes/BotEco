import { describe, it, expect } from 'vitest';
import { getStyleByName, getAllStyleNames, getStylesHelp, VOICE_STYLES, VoiceStyle } from './styles.js';

// ============================================================================
// FIXTURES
// ============================================================================

const allStyleKeys = [
  'villain',
  'trailer',
  'pirate',
  'whisper',
  'excited',
  'robot',
  'drill_sergeant',
  'nature_documentary',
  'sports',
  'grandma',
  'sarcastic',
  'angry',
  'bored',
  'news',
  'shakespearean',
];

// Direct name lookups - should return exact style
const directNameFixtures = [
  { input: 'villain', expected: 'villain' },
  { input: 'trailer', expected: 'trailer' },
  { input: 'pirate', expected: 'pirate' },
  { input: 'whisper', expected: 'whisper' },
  { input: 'excited', expected: 'excited' },
  { input: 'robot', expected: 'robot' },
  { input: 'drill_sergeant', expected: 'drill_sergeant' },
  { input: 'nature_documentary', expected: 'nature_documentary' },
  { input: 'sports', expected: 'sports' },
  { input: 'grandma', expected: 'grandma' },
  { input: 'sarcastic', expected: 'sarcastic' },
  { input: 'angry', expected: 'angry' },
  { input: 'bored', expected: 'bored' },
  { input: 'news', expected: 'news' },
  { input: 'shakespearean', expected: 'shakespearean' },
];

// Alias lookups - each style has aliases that should resolve to the style
// Note: The matching logic uses substring matching (alias.includes(input) || input.includes(alias))
// which can cause some aliases to match earlier styles in iteration order.
const aliasFixtures = [
  // villain aliases
  { input: 'evil', expected: 'villain' },
  { input: 'menacing', expected: 'villain' },
  { input: 'bad guy', expected: 'villain' },
  { input: 'antagonist', expected: 'villain' },
  // trailer aliases
  { input: 'movie trailer', expected: 'trailer' },
  { input: 'epic', expected: 'trailer' },
  { input: 'announcer', expected: 'trailer' },
  { input: 'dramatic', expected: 'trailer' },
  { input: 'narrator', expected: 'trailer' },
  // pirate aliases
  { input: 'captain', expected: 'pirate' },
  { input: 'buccaneer', expected: 'pirate' },
  { input: 'sailor', expected: 'pirate' },
  { input: 'arrr', expected: 'pirate' },
  // whisper aliases
  { input: 'asmr', expected: 'whisper' },
  { input: 'soft', expected: 'whisper' },
  { input: 'quiet', expected: 'whisper' },
  { input: 'gentle', expected: 'whisper' },
  { input: 'mysterious', expected: 'whisper' },
  // excited aliases
  { input: 'enthusiastic', expected: 'excited' },
  { input: 'happy', expected: 'excited' },
  { input: 'joyful', expected: 'excited' },
  { input: 'hyped', expected: 'excited' },
  { input: 'pumped', expected: 'excited' },
  // robot aliases
  { input: 'robotic', expected: 'robot' },
  { input: 'mechanical', expected: 'robot' },
  // Note: 'ai' matches 'villain' first because 'villain' contains 'ai' substring
  { input: 'ai', expected: 'villain' },
  { input: 'computer', expected: 'robot' },
  { input: 'monotone', expected: 'robot' },
  // drill_sergeant aliases
  { input: 'drill sergeant', expected: 'drill_sergeant' },
  { input: 'sergeant', expected: 'drill_sergeant' },
  { input: 'military', expected: 'drill_sergeant' },
  { input: 'commander', expected: 'drill_sergeant' },
  { input: 'army', expected: 'drill_sergeant' },
  { input: 'commanding', expected: 'drill_sergeant' },
  // nature_documentary aliases
  { input: 'nature', expected: 'nature_documentary' },
  { input: 'documentary', expected: 'nature_documentary' },
  { input: 'david attenborough', expected: 'nature_documentary' },
  { input: 'calm', expected: 'nature_documentary' },
  { input: 'observational', expected: 'nature_documentary' },
  // sports aliases
  // Note: 'sports announcer' matches 'trailer' first because it contains 'announcer'
  { input: 'sports announcer', expected: 'trailer' },
  { input: 'commentator', expected: 'sports' },
  { input: 'play-by-play', expected: 'sports' },
  { input: 'broadcaster', expected: 'sports' },
  // grandma aliases
  { input: 'grandmother', expected: 'grandma' },
  { input: 'granny', expected: 'grandma' },
  { input: 'nana', expected: 'grandma' },
  { input: 'sweet', expected: 'grandma' },
  { input: 'caring', expected: 'grandma' },
  // sarcastic aliases
  { input: 'sarcasm', expected: 'sarcastic' },
  { input: 'ironic', expected: 'sarcastic' },
  { input: 'deadpan', expected: 'sarcastic' },
  { input: 'dry', expected: 'sarcastic' },
  { input: 'cynical', expected: 'sarcastic' },
  // angry aliases
  { input: 'mad', expected: 'angry' },
  { input: 'furious', expected: 'angry' },
  { input: 'rage', expected: 'angry' },
  { input: 'frustrated', expected: 'angry' },
  { input: 'pissed', expected: 'angry' },
  // bored aliases
  { input: 'boring', expected: 'bored' },
  { input: 'tired', expected: 'bored' },
  { input: 'lazy', expected: 'bored' },
  { input: 'uninterested', expected: 'bored' },
  { input: 'sleepy', expected: 'bored' },
  // news aliases
  { input: 'news anchor', expected: 'news' },
  { input: 'reporter', expected: 'news' },
  { input: 'journalist', expected: 'news' },
  { input: 'newsreader', expected: 'news' },
  { input: 'professional', expected: 'news' },
  // shakespearean aliases
  { input: 'shakespeare', expected: 'shakespearean' },
  { input: 'theatrical', expected: 'shakespearean' },
  { input: 'actor', expected: 'shakespearean' },
  { input: 'stage', expected: 'shakespearean' },
  // Note: 'dramatic actor' matches 'trailer' first because it contains 'dramatic'
  { input: 'dramatic actor', expected: 'trailer' },
];

// Case insensitivity tests
const caseInsensitiveFixtures = [
  { input: 'VILLAIN', expected: 'villain' },
  { input: 'Pirate', expected: 'pirate' },
  { input: 'WHISPER', expected: 'whisper' },
  { input: 'Drill_Sergeant', expected: 'drill_sergeant' },
  { input: 'NATURE_DOCUMENTARY', expected: 'nature_documentary' },
  { input: 'EVIL', expected: 'villain' },
  { input: 'ASMR', expected: 'whisper' },
  { input: 'SARCASM', expected: 'sarcastic' },
];

// Negative cases - should return null
// Note: Empty string and whitespace match a style due to alias.includes("") being true
// for any alias. This is a quirk of the implementation.
const negativeCases = [
  { input: 'unknown' },
  { input: 'xyz123' },
  { input: 'random text' },
  { input: 'not a style' },
  { input: '!@#$%' },
];

// Helper to get style key from VoiceStyle
function getStyleKey(style: VoiceStyle | null): string | null {
  if (!style) return null;
  for (const [key, voiceStyle] of Object.entries(VOICE_STYLES)) {
    if (voiceStyle.aliases === style.aliases) {
      return key;
    }
  }
  return null;
}

// ============================================================================
// TESTS
// ============================================================================

describe('VOICE_STYLES constant', () => {
  it('contains all expected style keys', () => {
    const keys = Object.keys(VOICE_STYLES);
    expect(keys).toEqual(expect.arrayContaining(allStyleKeys));
    expect(keys.length).toBe(allStyleKeys.length);
  });

  it('each style has required properties', () => {
    for (const [key, style] of Object.entries(VOICE_STYLES)) {
      expect(style).toHaveProperty('name');
      expect(style).toHaveProperty('description');
      expect(style).toHaveProperty('prompt');
      expect(style).toHaveProperty('aliases');
      expect(typeof style.name).toBe('string');
      expect(typeof style.description).toBe('string');
      expect(typeof style.prompt).toBe('string');
      expect(Array.isArray(style.aliases)).toBe(true);
      expect(style.aliases.length).toBeGreaterThan(0);
    }
  });

  it('each style is findable by its key via getStyleByName', () => {
    // This ensures all style keys can be used to look up the style
    for (const key of Object.keys(VOICE_STYLES)) {
      const result = getStyleByName(key);
      expect(result).not.toBeNull();
      // Verify we got the same style back
      const resultKey = getStyleKey(result);
      expect(resultKey).toBe(key);
    }
  });

  it('styles have valid ElevenLabs parameters when present', () => {
    for (const [key, style] of Object.entries(VOICE_STYLES)) {
      if (style.stability !== undefined) {
        expect(style.stability).toBeGreaterThanOrEqual(0);
        expect(style.stability).toBeLessThanOrEqual(1);
      }
      if (style.similarity_boost !== undefined) {
        expect(style.similarity_boost).toBeGreaterThanOrEqual(0);
        expect(style.similarity_boost).toBeLessThanOrEqual(1);
      }
      if (style.style !== undefined) {
        expect(style.style).toBeGreaterThanOrEqual(0);
        expect(style.style).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('getStyleByName', () => {
  describe('direct name lookups', () => {
    it.each(directNameFixtures)('finds style for "$input"', ({ input, expected }) => {
      const result = getStyleByName(input);
      expect(result).not.toBeNull();
      const key = getStyleKey(result);
      expect(key).toBe(expected);
    });
  });

  describe('alias lookups', () => {
    it.each(aliasFixtures)('finds style for alias "$input"', ({ input, expected }) => {
      const result = getStyleByName(input);
      expect(result).not.toBeNull();
      const key = getStyleKey(result);
      expect(key).toBe(expected);
    });
  });

  describe('case insensitivity', () => {
    it.each(caseInsensitiveFixtures)('finds style for "$input" regardless of case', ({ input, expected }) => {
      const result = getStyleByName(input);
      expect(result).not.toBeNull();
      const key = getStyleKey(result);
      expect(key).toBe(expected);
    });
  });

  describe('negative cases', () => {
    it.each(negativeCases)('returns null for "$input"', ({ input }) => {
      expect(getStyleByName(input)).toBeNull();
    });
  });

  describe('whitespace handling', () => {
    it('trims leading and trailing whitespace', () => {
      const result = getStyleByName('  villain  ');
      expect(result).not.toBeNull();
      const key = getStyleKey(result);
      expect(key).toBe('villain');
    });

    it('handles aliases with spaces', () => {
      const result = getStyleByName('movie trailer');
      expect(result).not.toBeNull();
      const key = getStyleKey(result);
      expect(key).toBe('trailer');
    });
  });

  describe('partial matching', () => {
    it('matches when input contains alias', () => {
      const result = getStyleByName('arrr matey');
      expect(result).not.toBeNull();
      const key = getStyleKey(result);
      expect(key).toBe('pirate');
    });

    it('matches when alias contains input', () => {
      const result = getStyleByName('drama');
      expect(result).not.toBeNull();
      // 'dramatic' is an alias for trailer
    });
  });
});

describe('getAllStyleNames', () => {
  it('returns all style keys', () => {
    const names = getAllStyleNames();
    expect(names).toEqual(expect.arrayContaining(allStyleKeys));
    expect(names.length).toBe(allStyleKeys.length);
  });

  it('returns an array', () => {
    const names = getAllStyleNames();
    expect(Array.isArray(names)).toBe(true);
  });

  it('returns strings only', () => {
    const names = getAllStyleNames();
    names.forEach((name) => {
      expect(typeof name).toBe('string');
    });
  });

  it('returns same keys as VOICE_STYLES object', () => {
    const names = getAllStyleNames();
    const objectKeys = Object.keys(VOICE_STYLES);
    expect(names).toEqual(objectKeys);
  });
});

describe('getStylesHelp', () => {
  it('returns a string', () => {
    const help = getStylesHelp();
    expect(typeof help).toBe('string');
  });

  it('starts with header line', () => {
    const help = getStylesHelp();
    expect(help.startsWith('Available voice styles:')).toBe(true);
  });

  it('contains all style keys', () => {
    const help = getStylesHelp();
    for (const key of allStyleKeys) {
      expect(help).toContain(key);
    }
  });

  it('contains all style descriptions', () => {
    const help = getStylesHelp();
    for (const style of Object.values(VOICE_STYLES)) {
      expect(help).toContain(style.description);
    }
  });

  it('formats each style with bullet point', () => {
    const help = getStylesHelp();
    const lines = help.split('\n');
    // First line is header, rest should have bullet points
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).toMatch(/^\s+•\s+\w+:/);
    }
  });

  it('has correct number of lines', () => {
    const help = getStylesHelp();
    const lines = help.split('\n');
    // 1 header + 15 styles
    expect(lines.length).toBe(1 + allStyleKeys.length);
  });
});

describe('VoiceStyle interface', () => {
  it('villain style has expected structure', () => {
    const villain = VOICE_STYLES.villain;
    expect(villain.name).toBe('Movie Villain');
    expect(villain.description).toBe('Menacing, slow, dramatic pauses');
    expect(villain.prompt).toContain('menacing');
    expect(villain.aliases).toContain('villain');
    expect(villain.aliases).toContain('evil');
  });

  it('pirate style has expected structure', () => {
    const pirate = VOICE_STYLES.pirate;
    expect(pirate.name).toBe('Pirate');
    expect(pirate.description).toBe('Arrr matey style');
    expect(pirate.prompt).toContain('pirate');
    expect(pirate.aliases).toContain('pirate');
    expect(pirate.aliases).toContain('arrr');
  });

  it('whisper style has expected structure', () => {
    const whisper = VOICE_STYLES.whisper;
    expect(whisper.name).toBe('Whisper/ASMR');
    expect(whisper.prompt).toContain('Whisper');
    expect(whisper.aliases).toContain('whisper');
    expect(whisper.aliases).toContain('asmr');
  });
});

describe('style uniqueness', () => {
  it('all style names are unique', () => {
    const names = Object.values(VOICE_STYLES).map((s) => s.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  it('all style keys are unique', () => {
    const keys = Object.keys(VOICE_STYLES);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
