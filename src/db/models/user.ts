import { query } from '../client.js';
import bcrypt from 'bcrypt';

export type UserStatus = 'pending' | 'qr_ready' | 'connected' | 'disconnected';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  email_verified: boolean;
  phone_number: string | null;
  whatsapp_jid: string | null;
  status: UserStatus;
  last_qr_at: Date | null;
  last_connected_at: Date | null;
  reconnect_attempts: number;
  daily_chars_used: number;
  daily_chars_limit: number;
  daily_reset_date: Date;
  is_disabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
}

export interface UserPublic {
  id: string;
  email: string;
  email_verified: boolean;
  phone_number: string | null;
  whatsapp_jid: string | null;
  status: UserStatus;
  last_connected_at: Date | null;
  daily_chars_used: number;
  daily_chars_limit: number;
  created_at: Date;
}

const SALT_ROUNDS = 12;

export async function createUser(input: CreateUserInput): Promise<User> {
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const result = await query<User>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING *`,
    [input.email.toLowerCase(), passwordHash]
  );

  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [id]
  );

  return result.rows[0] || null;
}

export async function verifyPassword(
  user: User,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.password_hash);
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus
): Promise<void> {
  const updates: Record<string, any> = { status };

  if (status === 'qr_ready') {
    updates.last_qr_at = new Date();
  } else if (status === 'connected') {
    updates.last_connected_at = new Date();
    updates.reconnect_attempts = 0;
  }

  const setClause = Object.keys(updates)
    .map((key, i) => `${key} = $${i + 2}`)
    .join(', ');

  await query(
    `UPDATE users SET ${setClause} WHERE id = $1`,
    [userId, ...Object.values(updates)]
  );
}

export async function updateUserWhatsApp(
  userId: string,
  phoneNumber: string,
  whatsappJid: string
): Promise<void> {
  await query(
    `UPDATE users SET phone_number = $2, whatsapp_jid = $3 WHERE id = $1`,
    [userId, phoneNumber, whatsappJid]
  );
}

export async function incrementReconnectAttempts(userId: string): Promise<number> {
  const result = await query<{ reconnect_attempts: number }>(
    `UPDATE users SET reconnect_attempts = reconnect_attempts + 1
     WHERE id = $1
     RETURNING reconnect_attempts`,
    [userId]
  );

  return result.rows[0].reconnect_attempts;
}

export async function addCharacterUsage(
  userId: string,
  characters: number,
  messageText: string,
  styleName: string
): Promise<{ allowed: boolean; remaining: number }> {
  // First check if we need to reset daily usage
  await query(
    `UPDATE users
     SET daily_chars_used = 0, daily_reset_date = CURRENT_DATE
     WHERE id = $1 AND daily_reset_date < CURRENT_DATE`,
    [userId]
  );

  // Get current usage
  const userResult = await query<User>(
    'SELECT daily_chars_used, daily_chars_limit FROM users WHERE id = $1',
    [userId]
  );

  const user = userResult.rows[0];
  const newUsage = user.daily_chars_used + characters;

  if (newUsage > user.daily_chars_limit) {
    return {
      allowed: false,
      remaining: Math.max(0, user.daily_chars_limit - user.daily_chars_used),
    };
  }

  // Update usage and log
  await query(
    `UPDATE users SET daily_chars_used = $2 WHERE id = $1`,
    [userId, newUsage]
  );

  await query(
    `INSERT INTO usage_logs (user_id, message_text, characters_used, style_name)
     VALUES ($1, $2, $3, $4)`,
    [userId, messageText, characters, styleName]
  );

  return {
    allowed: true,
    remaining: user.daily_chars_limit - newUsage,
  };
}

export async function getConnectedUsers(): Promise<User[]> {
  const result = await query<User>(
    `SELECT * FROM users WHERE status = 'connected' AND is_disabled = FALSE`
  );

  return result.rows;
}

export async function getAllActiveUsers(): Promise<User[]> {
  const result = await query<User>(
    `SELECT * FROM users
     WHERE status IN ('connected', 'disconnected')
     AND is_disabled = FALSE`
  );

  return result.rows;
}

export function toPublicUser(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    email_verified: user.email_verified,
    phone_number: user.phone_number,
    whatsapp_jid: user.whatsapp_jid,
    status: user.status,
    last_connected_at: user.last_connected_at,
    daily_chars_used: user.daily_chars_used,
    daily_chars_limit: user.daily_chars_limit,
    created_at: user.created_at,
  };
}
