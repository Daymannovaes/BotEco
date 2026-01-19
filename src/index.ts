import { config, validateConfig } from './config.js';
import { startWhatsAppClient } from './whatsapp/client.js';
import { clearOldCache, getCacheStats, enforceCacheSizeLimit } from './voice/cache.js';
import { checkApiKeyValid, getUserSubscription } from './voice/tts.js';

async function main(): Promise<void> {
  console.log('🎤 VoiceReply Bot - WhatsApp Voice Transformer');
  console.log('━'.repeat(50));

  // Validate configuration
  validateConfig();

  // Check ElevenLabs API key
  console.log('\n📡 Checking ElevenLabs API...');
  const apiValid = await checkApiKeyValid();
  if (!apiValid) {
    console.error('❌ Invalid ElevenLabs API key. Please check your .env file.');
    process.exit(1);
  }

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

  // Start WhatsApp client
  console.log('\n📱 Connecting to WhatsApp...');
  await startWhatsAppClient();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down...');
  process.exit(0);
});

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
