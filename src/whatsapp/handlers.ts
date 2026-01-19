import { WASocket, proto, getContentType } from '@whiskeysockets/baileys';
import { sendAudioMessage, sendTextMessage, sendReaction } from './client.js';
import { parseStyleInstruction } from '../ai/style-parser.js';
import { generateVoice } from '../voice/tts.js';
import { getCachedAudio, cacheAudio } from '../voice/cache.js';
import { getStylesHelp } from '../voice/styles.js';

export async function handleMessage(
  sock: WASocket,
  message: proto.IWebMessageInfo
): Promise<void> {
  const chatId = message.key.remoteJid;
  if (!chatId) return;

  // Get the message content
  const messageContent = message.message;
  if (!messageContent) return;

  // Get text from the message
  const text = extractMessageText(messageContent);
  if (!text) return;

  console.log(`[DEBUG] Received message: "${text.slice(0, 50)}..."`);

  // Check for help command
  if (text.toLowerCase() === 'voice help' || text.toLowerCase() === '/voice help') {
    await sendTextMessage(chatId, getStylesHelp(), message);
    return;
  }

  // Check if this is a reply to another message
  const quotedMessage = extractQuotedMessage(messageContent);
  if (!quotedMessage) {
    console.log('[DEBUG] Not a reply, ignoring');
    return;
  }

  // Get the text from the quoted message
  const quotedText = extractMessageText(quotedMessage);
  if (!quotedText) {
    console.log('[DEBUG] Quoted message has no text');
    return;
  }

  console.log(`[DEBUG] Quoted text: "${quotedText.slice(0, 50)}..."`);

  // Parse the style instruction from the user's message
  const parsedStyle = parseStyleInstruction(text);
  if (!parsedStyle) {
    console.log('[DEBUG] Not a style instruction, ignoring');
    return;
  }

  console.log(`[DEBUG] Parsed style: ${parsedStyle.style.name}`);

  console.log(`🎤 Processing voice request: "${quotedText.slice(0, 50)}..." as ${parsedStyle.style.name}`);

  // React to show we're processing
  await sendReaction(chatId, message.key, '🎤');

  try {
    // Check cache first
    let audioBuffer = await getCachedAudio(quotedText, parsedStyle.style.name);

    if (audioBuffer) {
      console.log('  → Using cached audio');
    } else {
      console.log('  → Generating new audio...');

      // Generate the voice
      audioBuffer = await generateVoice(quotedText, parsedStyle.style);

      // Cache the result
      await cacheAudio(quotedText, parsedStyle.style.name, audioBuffer);
    }

    // Send the audio message
    await sendAudioMessage(chatId, audioBuffer, message);

    // React with success
    await sendReaction(chatId, message.key, '✅');

    console.log('  → Audio sent successfully');
  } catch (error) {
    console.error('Error generating voice:', error);

    // React with error
    await sendReaction(chatId, message.key, '❌');

    // Send error message
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await sendTextMessage(
      chatId,
      `Sorry, I couldn't generate that voice. Error: ${errorMsg}`,
      message
    );
  }
}

function extractMessageText(content: proto.IMessage): string | null {
  // Handle different message types
  if (content.conversation) {
    return content.conversation;
  }

  if (content.extendedTextMessage?.text) {
    return content.extendedTextMessage.text;
  }

  if (content.imageMessage?.caption) {
    return content.imageMessage.caption;
  }

  if (content.videoMessage?.caption) {
    return content.videoMessage.caption;
  }

  if (content.documentMessage?.caption) {
    return content.documentMessage.caption;
  }

  return null;
}

function extractQuotedMessage(content: proto.IMessage): proto.IMessage | null {
  // Check extendedTextMessage for quoted message
  if (content.extendedTextMessage?.contextInfo?.quotedMessage) {
    return content.extendedTextMessage.contextInfo.quotedMessage;
  }

  return null;
}

export function isGroupMessage(message: proto.IWebMessageInfo): boolean {
  const jid = message.key.remoteJid;
  return jid?.endsWith('@g.us') ?? false;
}

export function isPrivateMessage(message: proto.IWebMessageInfo): boolean {
  const jid = message.key.remoteJid;
  return jid?.endsWith('@s.whatsapp.net') ?? false;
}

export function getSenderJid(message: proto.IWebMessageInfo): string | null {
  if (isGroupMessage(message)) {
    return message.key.participant || null;
  }
  return message.key.remoteJid || null;
}
