import { sessionManager } from './manager.js';
import { getConnectedUsers, getAllActiveUsers } from '../db/models/user.js';
import { access } from 'fs/promises';
import { getAuthInfoPath } from '../config.js';

export async function restoreAllSessions(): Promise<{
  total: number;
  restored: number;
  failed: number;
}> {
  console.log('[SessionRestore] Starting session restoration...');

  const users = await getAllActiveUsers();
  const results = { total: users.length, restored: 0, failed: 0 };

  for (const user of users) {
    const authPath = getAuthInfoPath(user.id);

    // Check if auth files exist
    try {
      await access(`${authPath}/creds.json`);
    } catch {
      console.log(`[SessionRestore] No auth files for user ${user.id}, skipping`);
      continue;
    }

    try {
      const restored = await sessionManager.restoreSession(user.id);
      if (restored) {
        results.restored++;
        console.log(`[SessionRestore] Restored session for user ${user.id}`);
      } else {
        results.failed++;
      }
    } catch (err) {
      results.failed++;
      console.error(`[SessionRestore] Failed to restore session for ${user.id}:`, err);
    }
  }

  console.log(`[SessionRestore] Restoration complete: ${results.restored}/${results.total} restored, ${results.failed} failed`);

  return results;
}
