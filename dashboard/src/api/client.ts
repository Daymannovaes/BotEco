const API_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Request failed' };
    }

    return { data };
  } catch (err) {
    return { error: 'Network error' };
  }
}

export const api = {
  auth: {
    register: (email: string, password: string) =>
      request<{ user: any; accessToken: string; refreshToken: string }>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      ),

    login: (email: string, password: string) =>
      request<{ user: any; accessToken: string; refreshToken: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      ),

    me: () => request<{ user: any }>('/auth/me'),
  },

  users: {
    getStatus: () =>
      request<{
        status: string;
        phoneNumber: string | null;
        whatsappJid: string | null;
        lastConnected: string | null;
        usage: {
          dailyCharsUsed: number;
          dailyCharsLimit: number;
          remaining: number;
        };
      }>('/users/me/status'),

    getQRCode: () =>
      request<{
        qrCode?: string;
        status: string;
        message?: string;
        expiresAt?: string;
      }>('/users/me/qr'),

    disconnect: () =>
      request<{ status: string; message: string }>('/users/me/disconnect', {
        method: 'POST',
      }),

    logout: () =>
      request<{ status: string; message: string }>('/users/me/logout', {
        method: 'POST',
      }),
  },
};
