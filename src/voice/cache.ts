import { mkdir, readFile, writeFile, stat, readdir, unlink } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';
import { config } from '../config.js';

const CACHE_DIR = config.paths.cache;
const MAX_CACHE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE_MB = 100;

async function ensureCacheDir(): Promise<void> {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

function generateCacheKey(text: string, styleName: string): string {
  const hash = createHash('sha256')
    .update(`${text}:${styleName}`)
    .digest('hex')
    .slice(0, 16);
  return `${hash}.mp3`;
}

export async function getCachedAudio(text: string, styleName: string): Promise<Buffer | null> {
  await ensureCacheDir();

  const cacheKey = generateCacheKey(text, styleName);
  const cachePath = join(CACHE_DIR, cacheKey);

  try {
    const fileStat = await stat(cachePath);
    const age = Date.now() - fileStat.mtimeMs;

    // Check if cache is too old
    if (age > MAX_CACHE_AGE_MS) {
      await unlink(cachePath);
      return null;
    }

    return await readFile(cachePath);
  } catch {
    return null;
  }
}

export async function cacheAudio(
  text: string,
  styleName: string,
  audioBuffer: Buffer
): Promise<void> {
  await ensureCacheDir();

  const cacheKey = generateCacheKey(text, styleName);
  const cachePath = join(CACHE_DIR, cacheKey);

  await writeFile(cachePath, audioBuffer);
}

export async function clearOldCache(): Promise<number> {
  await ensureCacheDir();

  let clearedCount = 0;
  const now = Date.now();

  try {
    const files = await readdir(CACHE_DIR);

    for (const file of files) {
      if (!file.endsWith('.mp3')) continue;

      const filePath = join(CACHE_DIR, file);

      try {
        const fileStat = await stat(filePath);
        const age = now - fileStat.mtimeMs;

        if (age > MAX_CACHE_AGE_MS) {
          await unlink(filePath);
          clearedCount++;
        }
      } catch {
        // File doesn't exist or can't be read
      }
    }
  } catch {
    // Cache dir doesn't exist
  }

  return clearedCount;
}

export async function getCacheStats(): Promise<{
  fileCount: number;
  totalSizeMB: number;
}> {
  await ensureCacheDir();

  let fileCount = 0;
  let totalSize = 0;

  try {
    const files = await readdir(CACHE_DIR);

    for (const file of files) {
      if (!file.endsWith('.mp3')) continue;

      const filePath = join(CACHE_DIR, file);

      try {
        const fileStat = await stat(filePath);
        fileCount++;
        totalSize += fileStat.size;
      } catch {
        // File doesn't exist
      }
    }
  } catch {
    // Cache dir doesn't exist
  }

  return {
    fileCount,
    totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
  };
}

export async function enforceCacheSizeLimit(): Promise<number> {
  await ensureCacheDir();

  let clearedCount = 0;

  try {
    const files = await readdir(CACHE_DIR);
    const fileStats: Array<{ path: string; mtime: number; size: number }> = [];

    // Get stats for all files
    for (const file of files) {
      if (!file.endsWith('.mp3')) continue;

      const filePath = join(CACHE_DIR, file);

      try {
        const fileStat = await stat(filePath);
        fileStats.push({
          path: filePath,
          mtime: fileStat.mtimeMs,
          size: fileStat.size,
        });
      } catch {
        // Skip files that can't be read
      }
    }

    // Sort by modification time (oldest first)
    fileStats.sort((a, b) => a.mtime - b.mtime);

    // Calculate total size
    let totalSize = fileStats.reduce((sum, f) => sum + f.size, 0);
    const maxSize = MAX_CACHE_SIZE_MB * 1024 * 1024;

    // Remove oldest files until under limit
    for (const file of fileStats) {
      if (totalSize <= maxSize) break;

      try {
        await unlink(file.path);
        totalSize -= file.size;
        clearedCount++;
      } catch {
        // File already deleted
      }
    }
  } catch {
    // Cache dir doesn't exist
  }

  return clearedCount;
}
