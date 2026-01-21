import { WASocket } from '@whiskeysockets/baileys';

export type SessionStatus = 'initializing' | 'qr_ready' | 'connected' | 'disconnected' | 'logged_out';

export interface UserSession {
  userId: string;
  socket: WASocket | null;
  status: SessionStatus;
  qrCode: string | null;
  phoneNumber: string | null;
  whatsappJid: string | null;
  lastActivity: Date;
  reconnectAttempts: number;
  saveCreds: (() => Promise<void>) | null;
}

export interface QRCodeData {
  userId: string;
  qrCode: string;
  expiresAt: Date;
}

export interface SessionEvent {
  type: 'qr' | 'connected' | 'disconnected' | 'logged_out' | 'message';
  userId: string;
  data?: any;
}

export type SessionEventCallback = (event: SessionEvent) => void;
