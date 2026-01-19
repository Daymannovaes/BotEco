# VoiceReply Bot

A WhatsApp bot that transforms any message into a voice message with a fun character/style.

## How It Works

1. Reply to any message in a chat
2. Type a style instruction like "say it like a villain" or "read this dramatically"
3. Bot sends back an audio message with the text spoken in that style

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file and add your API key
cp .env.example .env

# Edit .env and add your ElevenLabs API key
# ELEVENLABS_API_KEY=your_key_here

# Start the bot
npm run dev
```

On first run, scan the QR code with WhatsApp to authenticate.

## Usage Examples

Reply to any message with:

- `say it like a villain` - Menacing, dramatic delivery
- `read this dramatically` - Epic movie trailer voice
- `voice: pirate` - Arrr matey style
- `whisper this` - Soft ASMR whisper
- `say it excitedly` - High energy, enthusiastic
- `robot voice` - Monotone, mechanical
- `read it like a sports announcer` - Excited commentary

Type `voice help` in any chat to see all available styles.

## Available Voice Styles

| Style | Description |
|-------|-------------|
| villain | Menacing, slow, dramatic pauses |
| trailer | Epic movie announcer voice |
| pirate | Arrr matey style |
| whisper | Soft, intimate ASMR |
| excited | High energy, enthusiastic |
| robot | Monotone, mechanical |
| drill_sergeant | Loud, commanding |
| nature_documentary | Calm, observational |
| sports | Excited commentary |
| grandma | Sweet, caring |
| sarcastic | Deadpan, ironic |
| angry | Furious, aggressive |
| bored | Disinterested, lazy |
| news | Professional anchor |
| shakespearean | Theatrical, dramatic |

## Configuration

Environment variables (`.env`):

```
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
LOG_LEVEL=info
```

## Project Structure

```
wpp-bot/
├── src/
│   ├── index.ts              # Entry point
│   ├── config.ts             # Environment config
│   ├── whatsapp/
│   │   ├── client.ts         # Baileys connection
│   │   ├── handlers.ts       # Message handlers
│   │   └── session.ts        # Session persistence
│   ├── voice/
│   │   ├── tts.ts            # ElevenLabs integration
│   │   ├── styles.ts         # Voice style presets
│   │   └── cache.ts          # Audio caching
│   └── ai/
│       └── style-parser.ts   # Parse style instructions
├── auth_info/                # WhatsApp session (gitignored)
├── cache/                    # Audio cache (gitignored)
└── package.json
```

## Scripts

- `npm run dev` - Run in development mode with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run built JavaScript

## Notes

- The bot caches generated audio for 24 hours to save API costs
- ElevenLabs free tier includes ~10,000 characters/month
- WhatsApp session is persisted in `auth_info/` directory
