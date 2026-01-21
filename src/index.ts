import { config, validateConfig } from './config.js';
import { clearOldCache, getCacheStats, enforceCacheSizeLimit } from './voice/cache.js';
import { checkApiKeyValid, getUserSubscription } from './voice/tts.js';
import { checkConnection, closePool } from './db/client.js';
import { startApiServer } from './api/server.js';
import { sessionManager, restoreAllSessions } from './sessions/index.js';

async function main(): Promise<void> {
  console.log('🎤 VoiceReply Bot - Multi-Tenant SaaS Platform');
  console.log('━'.repeat(50));

  // Validate configuration
  validateConfig();

  // Check database connection
  console.log('\n📦 Checking database...');
  const dbConnected = await checkConnection();
  if (!dbConnected) {
    console.error('❌ Cannot connect to database. Please check your configuration.');
    process.exit(1);
  }
  console.log('   ✓ Database connected');

  // Check ElevenLabs API key
  console.log('\n📡 Checking ElevenLabs API...');
  const apiValid = await checkApiKeyValid();
  if (!apiValid) {
    console.error('❌ Invalid ElevenLabs API key. Please check your .env file.');
    process.exit(1);
  }
  console.log('   ✓ API key valid');

  // Show subscription info
  try {
    const subscription = await getUserSubscription();
    const usedPercent = Math.round(
      (subscription.character_count / subscription.character_limit) * 100
    );
    console.log(
      `   Characters: ${subscription.character_count.toLocaleString()} / ${subscription.character_limit.toLocaleString()} (${usedPercent}% used)`
    );
  } catch (err) {
    console.log('   Could not fetch subscription info');
  }

  // Clear old cache
  console.log('\n🗑️  Cleaning cache...');
  const clearedOld = await clearOldCache();
  const clearedSize = await enforceCacheSizeLimit();
  if (clearedOld > 0 || clearedSize > 0) {
    console.log(`   Removed ${clearedOld + clearedSize} old cache files`);
  }

  const cacheStats = await getCacheStats();
  console.log(`   Cache: ${cacheStats.fileCount} files, ${cacheStats.totalSizeMB} MB`);

  // Start HTTP API server
  console.log('\n🌐 Starting API server...');
  await startApiServer();
  console.log(`   ✓ API server running on port ${config.api.port}`);

  // Restore existing WhatsApp sessions
  console.log('\n📱 Restoring WhatsApp sessions...');
  const restoreResults = await restoreAllSessions();
  console.log(`   ✓ Restored ${restoreResults.restored} session(s)`);

  console.log('\n' + '━'.repeat(50));
  console.log('🚀 VoiceReply Bot is ready!');
  console.log('━'.repeat(50));
  console.log('\nAPI Endpoints:');
  console.log(`  POST /auth/register  - Create new account`);
  console.log(`  POST /auth/login     - Login to get JWT token`);
  console.log(`  GET  /users/me       - Get current user info`);
  console.log(`  GET  /users/me/qr    - Get QR code for WhatsApp`);
  console.log(`  GET  /users/me/status- Get connection status`);
  console.log(`  GET  /health         - Health check`);
  console.log('━'.repeat(50) + '\n');
}

// Handle graceful shutdown
async function shutdown(): Promise<void> {
  console.log('\n\n👋 Shutting down...');

  // Shutdown all WhatsApp sessions
  await sessionManager.shutdown();

  // Close database pool
  await closePool();

  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

// Run
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
