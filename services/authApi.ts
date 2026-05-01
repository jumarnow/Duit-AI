export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  authProvider?: 'google' | 'email';
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
const API_BASE_URL = viteEnv?.VITE_API_BASE_URL || 'http://localhost:4000/api';

const TOKEN_KEYS = {
  ACCESS: 'duitai_access_token',
  REFRESH: 'duitai_refresh_token'
};

export const authStorage = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEYS.ACCESS),
  getRefreshToken: () => localStorage.getItem(TOKEN_KEYS.REFRESH),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(TOKEN_KEYS.ACCESS, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS);
    localStorage.removeItem(TOKEN_KEYS.REFRESH);
  }
};

const readError = async (response: Response) => {
  try {
    const payload = await response.json();
    return payload?.error?.message || 'Request gagal';
  } catch {
    return 'Request gagal';
  }
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json();
  return payload.data as T;
};

export const authApi = {
  register: async (payload: { name: string; email: string; password: string }) => {
    const data = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  login: async (payload: { email: string; password: string }) => {
    const data = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    authStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  me: async () => {
    const token = authStorage.getAccessToken();
    if (!token) return null;

    try {
      const data = await request<{ user: AuthUser }>('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return data.user;
    } catch {
      const refreshed = await authApi.refresh();
      if (!refreshed) return null;

      const data = await request<{ user: AuthUser }>('/auth/me', {
        headers: {
          Authorization: `Bearer ${authStorage.getAccessToken()}`
        }
      });
      return data.user;
    }
  },

  refresh: async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const data = await request<AuthResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken })
      });
      authStorage.setTokens(data.accessToken, data.refreshToken);
      return data.user;
    } catch {
      authStorage.clear();
      return null;
    }
  },

  logout: async () => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) {
      try {
        await request<void>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken })
        });
      } catch {
        // Local logout should still continue even if the token was already invalid.
      }
    }
    authStorage.clear();
  },

  setPassword: async (password: string) => {
    const token = authStorage.getAccessToken();
    if (!token) throw new Error('Sesi tidak valid');
    
    await request<void>('/auth/set-password', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password })
    });
  }
};
