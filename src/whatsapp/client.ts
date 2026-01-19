import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcodeTerminal from 'qrcode-terminal';
import { config } from '../config.js';
import { handleMessage } from './handlers.js';

let sock: WASocket | null = null;

const logger = pino({ level: 'silent' });

export async function startWhatsAppClient(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(config.paths.authInfo);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`   Using WA v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    printQRInTerminal: false,
    logger,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 Scan this QR code with WhatsApp:\n');
      qrcodeTerminal.generate(qr, { small: true });
      console.log('\n');
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Logged out. Please delete auth_info folder and restart.');
        process.exit(1);
      }

      const shouldReconnect = reason !== DisconnectReason.loggedOut;
      console.log(`Connection closed. Reason: ${reason}. Reconnecting: ${shouldReconnect}`);

      if (shouldReconnect) {
        startWhatsAppClient();
      }
    }

    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp!');
      console.log('🎤 VoiceReply Bot is ready');
      console.log('\nUsage: Reply to any message with:');
      console.log('  • "say it like a villain"');
      console.log('  • "read this dramatically"');
      console.log('  • "voice: pirate"');
      console.log('  • "whisper this"');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    console.log(`[DEBUG] messages.upsert event: type=${type}, count=${messages.length}`);

    if (type !== 'notify') return;

    for (const message of messages) {
      console.log(`[DEBUG] Message from: ${message.key.remoteJid}, fromMe: ${message.key.fromMe}`);

      // Process messages from self (the user triggers the bot by replying)
      // Skip only if it's not from this device/session
      if (!message.key.fromMe) continue;

      try {
        await handleMessage(sock!, message);
      } catch (err) {
        console.error('Error handling message:', err);
      }
    }
  });

  return sock;
}

export function getSocket(): WASocket | null {
  return sock;
}

export async function sendAudioMessage(
  jid: string,
  audioBuffer: Buffer,
  quotedMessage?: proto.IWebMessageInfo
): Promise<void> {
  if (!sock) throw new Error('WhatsApp not connected');

  await sock.sendMessage(
    jid,
    {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      ptt: true, // Send as voice note
    },
    {
      quoted: quotedMessage,
    }
  );
}

export async function sendTextMessage(
  jid: string,
  text: string,
  quotedMessage?: proto.IWebMessageInfo
): Promise<void> {
  if (!sock) throw new Error('WhatsApp not connected');

  await sock.sendMessage(
    jid,
    { text },
    { quoted: quotedMessage }
  );
}

export async function sendReaction(
  jid: string,
  messageKey: proto.IMessageKey,
  emoji: string
): Promise<void> {
  if (!sock) throw new Error('WhatsApp not connected');

  await sock.sendMessage(jid, {
    react: {
      text: emoji,
      key: messageKey,
    },
  });
}
