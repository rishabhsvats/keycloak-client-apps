import { getToken, updateToken } from '../auth/keycloak';
import type {
  Project,
  Task,
  User,
  CreateProjectDto,
  CreateTaskDto,
  UpdateTaskStatusDto,
  AssignTaskDto,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL;
const REQUEST_TIMEOUT = 10000; // 10 seconds

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

const fetchWithTimeout = (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
    )
  ]);
};

const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  return new Promise((resolve, reject) => {
    updateToken(() => {
      const token = getToken();

      if (!token) {
        console.error('No token available');
        reject(new ApiError('No authentication token available', 401));
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };

      console.log(`Making request to: ${url}`);

      fetchWithTimeout(url, { ...options, headers }, REQUEST_TIMEOUT)
        .then(async (response) => {
          console.log(`Response from ${url}:`, response.status, response.statusText);
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
        .catch((error) => {
          console.error(`Fetch error for ${url}:`, error);
          reject(error);
        });
    });
  });
};

export const projectApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await fetchWithAuth(`${API_URL}/projects`);
    return response.json();
  },

  getById: async (id: number): Promise<Project> => {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}`);
    return response.json();
  },

  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await fetchWithAuth(`${API_URL}/projects`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: number, data: Partial<Project>): Promise<Project> => {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
    });
  },

  getTasks: async (id: number): Promise<Task[]> => {
    const response = await fetchWithAuth(`${API_URL}/projects/${id}/tasks`);
    return response.json();
  },
};

export const taskApi = {
  getAll: async (): Promise<Task[]> => {
    const response = await fetchWithAuth(`${API_URL}/tasks`);
    return response.json();
  },

  getById: async (id: number): Promise<Task> => {
    const response = await fetchWithAuth(`${API_URL}/tasks/${id}`);
    return response.json();
  },

  create: async (projectId: number, data: CreateTaskDto): Promise<Task> => {
    const response = await fetchWithAuth(`${API_URL}/tasks?projectId=${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  update: async (id: number, data: Partial<Task>): Promise<Task> => {
    const response = await fetchWithAuth(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateStatus: async (id: number, data: UpdateTaskStatusDto): Promise<Task> => {
    const response = await fetchWithAuth(`${API_URL}/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  assign: async (id: number, data: AssignTaskDto): Promise<Task> => {
    const response = await fetchWithAuth(`${API_URL}/tasks/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    await fetchWithAuth(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
  },
};

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await fetchWithAuth(`${API_URL}/users/me`);
    return response.json();
  },
};

export { ApiError };
