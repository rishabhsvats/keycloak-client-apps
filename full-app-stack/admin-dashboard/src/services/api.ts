import { getToken, updateToken } from '../auth/keycloak';
import type { User, Stats, Activity, CurrentUser } from '../types';

const API_URL = import.meta.env.VITE_API_URL;

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    updateToken(() => {
      const token = getToken();

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      fetch(url, { ...options, headers })
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new ApiError(
              errorData.message || `HTTP error ${response.status}`,
              response.status,
              errorData
            );
          }
          resolve(response);
        })
        .catch(reject);
    });
  });
};

export const adminApi = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetchWithAuth(`${API_URL}/admin/users`);
    return response.json();
  },

  getStats: async (): Promise<Stats> => {
    const response = await fetchWithAuth(`${API_URL}/admin/stats`);
    return response.json();
  },

  getActivity: async (): Promise<Activity[]> => {
    const response = await fetchWithAuth(`${API_URL}/admin/activity`);
    return response.json();
  },
};

export const userApi = {
  getMe: async (): Promise<CurrentUser> => {
    const response = await fetchWithAuth(`${API_URL}/users/me`);
    return response.json();
  },
};

export { ApiError };
