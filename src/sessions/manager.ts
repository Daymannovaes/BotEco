import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import QRCode from 'qrcode';
import { mkdir, access, rm } from 'fs/promises';
import { config, getAuthInfoPath } from '../config.js';
import { updateUserStatus, updateUserWhatsApp, incrementReconnectAttempts } from '../db/models/user.js';
import { UserSession, SessionStatus, SessionEvent, SessionEventCallback, QRCodeData } from './types.js';
import { handleMultiTenantMessage } from '../whatsapp/handlers.js';

const logger = pino({ level: 'silent' });

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY_MS = 5000;
const QR_CODE_EXPIRY_MS = 60000; // 60 seconds

class SessionManager {
  private sessions: Map<string, UserSession> = new Map();
  private eventListeners: Set<SessionEventCallback> = new Set();

  async createSession(userId: string): Promise<QRCodeData | null> {
    // Check if session already exists
    const existing = this.sessions.get(userId);
    if (existing?.socket && existing.status === 'connected') {
      return null; // Already connected
    }

    // Clean up any existing session
    if (existing?.socket) {
      await this.disconnectSession(userId);
    }

    const authPath = getAuthInfoPath(userId);
    await mkdir(authPath, { recursive: true });

    const session: UserSession = {
      userId,
      socket: null,
      status: 'initializing',
      qrCode: null,
      phoneNumber: null,
      whatsappJid: null,
      lastActivity: new Date(),
      reconnectAttempts: 0,
      saveCreds: null,
    };

    this.sessions.set(userId, session);

    return new Promise(async (resolve, reject) => {
      try {
        const { state, saveCreds } = await useMultiFileAuthState(authPath);
        const { version } = await fetchLatestBaileysVersion();

        session.saveCreds = saveCreds;

        const sock = makeWASocket({
          version,
          auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
          },
          printQRInTerminal: false,
          logger,
          generateHighQualityLinkPreview: true,
        });

        session.socket = sock;

        sock.ev.on('creds.update', saveCreds);

        let qrResolved = false;

        sock.ev.on('connection.update', async (update) => {
          const { connection, lastDisconnect, qr } = update;

          if (qr && !qrResolved) {
            // Generate QR code as base64 PNG
            const qrCodeBase64 = await QRCode.toDataURL(qr, {
              width: 256,
              margin: 2,
            });

            session.qrCode = qrCodeBase64;
            session.status = 'qr_ready';

            await updateUserStatus(userId, 'qr_ready');
            this.emitEvent({ type: 'qr', userId, data: { qrCode: qrCodeBase64 } });

            qrResolved = true;
            resolve({
              userId,
              qrCode: qrCodeBase64,
              expiresAt: new Date(Date.now() + QR_CODE_EXPIRY_MS),
            });
          }

          if (connection === 'close') {
            const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

            if (reason === DisconnectReason.loggedOut) {
              session.status = 'logged_out';
              await updateUserStatus(userId, 'disconnected');
              this.emitEvent({ type: 'logged_out', userId });

              // Clean up auth files on logout
              await this.cleanupAuthFiles(userId);

              if (!qrResolved) {
                resolve(null);
              }
            } else {
              session.status = 'disconnected';
              await updateUserStatus(userId, 'disconnected');
              this.emitEvent({ type: 'disconnected', userId });

              // Attempt reconnection
              const attempts = await incrementReconnectAttempts(userId);
              if (attempts < MAX_RECONNECT_ATTEMPTS) {
                session.reconnectAttempts = attempts;
                setTimeout(() => {
                  this.reconnectSession(userId);
                }, RECONNECT_DELAY_MS);
              }
            }
          }

          if (connection === 'open') {
            const phoneNumber = sock.user?.id?.split(':')[0] || null;
            const whatsappJid = sock.user?.id || null;

            session.status = 'connected';
            session.phoneNumber = phoneNumber;
            session.whatsappJid = whatsappJid;
            session.qrCode = null;
            session.reconnectAttempts = 0;
            session.lastActivity = new Date();

            await updateUserStatus(userId, 'connected');
            if (phoneNumber && whatsappJid) {
              await updateUserWhatsApp(userId, phoneNumber, whatsappJid);
            }

            this.emitEvent({ type: 'connected', userId, data: { phoneNumber, whatsappJid } });

            console.log(`[SessionManager] User ${userId} connected (${phoneNumber})`);

            if (!qrResolved) {
              // Connected without QR (restored session)
              resolve(null);
            }
          }
        });

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
          if (type !== 'notify') return;

          for (const message of messages) {
            const fromMe = message.key.fromMe ?? false;
            if (!fromMe) continue;

            session.lastActivity = new Date();

            try {
              await handleMultiTenantMessage(userId, sock, message);
            } catch (err) {
              console.error(`[SessionManager] Error handling message for ${userId}:`, err);
            }
          }
        });
      } catch (err) {
        session.status = 'disconnected';
        reject(err);
      }
    });
  }

  async reconnectSession(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (!session) return;

    console.log(`[SessionManager] Reconnecting user ${userId} (attempt ${session.reconnectAttempts + 1})`);

    try {
      await this.createSession(userId);
    } catch (err) {
      console.error(`[SessionManager] Reconnection failed for ${userId}:`, err);
    }
  }

  async restoreSession(userId: string): Promise<boolean> {
    const authPath = getAuthInfoPath(userId);

    try {
      await access(`${authPath}/creds.json`);
    } catch {
      return false; // No saved credentials
    }

    console.log(`[SessionManager] Restoring session for user ${userId}`);

    try {
      await this.createSession(userId);
      return true;
    } catch (err) {
      console.error(`[SessionManager] Failed to restore session for ${userId}:`, err);
      return false;
    }
  }

  async disconnectSession(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (!session) return;

    if (session.socket) {
      session.socket.end(undefined);
      session.socket = null;
    }

    session.status = 'disconnected';
    await updateUserStatus(userId, 'disconnected');
  }

  async logoutSession(userId: string): Promise<void> {
    const session = this.sessions.get(userId);
    if (!session) return;

    if (session.socket) {
      await session.socket.logout();
      session.socket = null;
    }

    await this.cleanupAuthFiles(userId);
    session.status = 'logged_out';
    session.qrCode = null;
    session.phoneNumber = null;
    session.whatsappJid = null;

    this.sessions.delete(userId);
    await updateUserStatus(userId, 'pending');
  }

  private async cleanupAuthFiles(userId: string): Promise<void> {
    const authPath = getAuthInfoPath(userId);
    try {
      await rm(authPath, { recursive: true, force: true });
    } catch (err) {
      console.error(`[SessionManager] Failed to clean up auth files for ${userId}:`, err);
    }
  }

  getSession(userId: string): UserSession | undefined {
    return this.sessions.get(userId);
  }

  getSessionStatus(userId: string): SessionStatus | null {
    const session = this.sessions.get(userId);
    return session?.status || null;
  }

  getSocket(userId: string): WASocket | null {
    const session = this.sessions.get(userId);
    return session?.socket || null;
  }

  getQRCode(userId: string): string | null {
    const session = this.sessions.get(userId);
    return session?.qrCode || null;
  }

  isConnected(userId: string): boolean {
    const session = this.sessions.get(userId);
    return session?.status === 'connected';
  }

  getAllSessions(): Map<string, UserSession> {
    return this.sessions;
  }

  getConnectedCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status === 'connected') count++;
    }
    return count;
  }

  addEventListener(callback: SessionEventCallback): void {
    this.eventListeners.add(callback);
  }

  removeEventListener(callback: SessionEventCallback): void {
    this.eventListeners.delete(callback);
  }

  private emitEvent(event: SessionEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('[SessionManager] Event listener error:', err);
      }
    }
  }

  async shutdown(): Promise<void> {
    console.log('[SessionManager] Shutting down all sessions...');

    for (const [userId, session] of this.sessions) {
      if (session.socket) {
        session.socket.end(undefined);
      }
    }

    this.sessions.clear();
    this.eventListeners.clear();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
