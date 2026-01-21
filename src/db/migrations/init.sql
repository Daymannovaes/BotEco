-- WPP-Bot Multi-Tenant SaaS Database Schema
-- PostgreSQL 16

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (tenants)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,

  -- WhatsApp connection
  phone_number VARCHAR(20),
  whatsapp_jid VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, qr_ready, connected, disconnected
  last_qr_at TIMESTAMP,
  last_connected_at TIMESTAMP,
  reconnect_attempts INT DEFAULT 0,

  -- Rate limiting
  daily_chars_used INT DEFAULT 0,
  daily_chars_limit INT DEFAULT 10000,
  daily_reset_date DATE DEFAULT CURRENT_DATE,

  -- Admin
  is_disabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs for tracking ElevenLabs API usage
CREATE TABLE usage_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT,
  characters_used INT,
  style_name VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Session tokens for refresh token rotation
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  revoked_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_daily_reset ON users(daily_reset_date);
CREATE INDEX idx_usage_logs_user ON usage_logs(user_id, created_at);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to reset daily character usage
CREATE OR REPLACE FUNCTION reset_daily_usage()
RETURNS void AS $$
BEGIN
    UPDATE users
    SET daily_chars_used = 0, daily_reset_date = CURRENT_DATE
    WHERE daily_reset_date < CURRENT_DATE;
END;
$$ language 'plpgsql';
