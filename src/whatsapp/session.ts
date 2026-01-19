import { mkdir, readFile, writeFile, readdir, unlink, stat } from 'fs/promises';
import { join } from 'path';
import { config } from '../config.js';

export interface AuthState {
  creds: any;
  keys: any;
}

const AUTH_DIR = config.paths.authInfo;

async function ensureAuthDir(): Promise<void> {
  try {
    await mkdir(AUTH_DIR, { recursive: true });
  } catch (err) {
    // Directory exists
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function useFileAuthState(): Promise<{
  state: AuthState;
  saveCreds: () => Promise<void>;
}> {
  await ensureAuthDir();

  const credsPath = join(AUTH_DIR, 'creds.json');
  const keysDir = join(AUTH_DIR, 'keys');

  await mkdir(keysDir, { recursive: true });

  let creds: any = {};
  if (await fileExists(credsPath)) {
    try {
      const data = await readFile(credsPath, 'utf-8');
      creds = JSON.parse(data);
    } catch {
      creds = {};
    }
  }

  const keys: any = {
    get: async (type: string, ids: string[]) => {
      const result: Record<string, any> = {};
      for (const id of ids) {
        const keyPath = join(keysDir, `${type}-${id}.json`);
        if (await fileExists(keyPath)) {
          try {
            const data = await readFile(keyPath, 'utf-8');
            result[id] = JSON.parse(data);
          } catch {
            // Key doesn't exist or is corrupted
          }
        }
      }
      return result;
    },
    set: async (data: Record<string, Record<string, any>>) => {
      for (const [type, typeData] of Object.entries(data)) {
        for (const [id, value] of Object.entries(typeData)) {
          const keyPath = join(keysDir, `${type}-${id}.json`);
          if (value) {
            await writeFile(keyPath, JSON.stringify(value));
          } else {
            try {
              await unlink(keyPath);
            } catch {
              // File doesn't exist
            }
          }
        }
      }
    },
  };

  const saveCreds = async () => {
    await writeFile(credsPath, JSON.stringify(creds, null, 2));
  };

  return {
    state: { creds, keys },
    saveCreds,
  };
}

export async function clearSession(): Promise<void> {
  try {
    const files = await readdir(AUTH_DIR);
    for (const file of files) {
      const filePath = join(AUTH_DIR, file);
      const fileStat = await stat(filePath);
      if (fileStat.isFile()) {
        await unlink(filePath);
      }
    }
    console.log('Session cleared successfully');
  } catch (err) {
    console.error('Error clearing session:', err);
  }
}
