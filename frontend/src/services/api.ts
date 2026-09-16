import { supabase } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  try {
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 1000)
    );
    const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]);
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch (err) {
    // Non-fatal, fallback to local storage
  }

  // Check stored mock session for local demo/development
  try {
    const mockUser = localStorage.getItem("healthlens_mock_user");
    if (mockUser) {
      return { Authorization: "Bearer mock-jwt-token" };
    }
  } catch (e) {
    // Ignore storage issues
  }

  return {};
}

export const api = {
  async get<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const authHeader = await getAuthHeader();
    const headers = new Headers(authHeader);
    
    if (options.headers) {
      const extraHeaders = new Headers(options.headers);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `GET request failed with status ${response.status}`);
    }

    return response.json();
  },

  async post<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    const authHeader = await getAuthHeader();
    const headers = new Headers(authHeader);
    const isFormData = body instanceof FormData;
    
    if (options.headers) {
      const extraHeaders = new Headers(options.headers);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (!isFormData) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      ...options,
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `POST request failed with status ${response.status}`);
    }

    return response.json();
  },

  async put<T>(endpoint: string, body: any, options: RequestOptions = {}): Promise<T> {
    const authHeader = await getAuthHeader();
    const headers = new Headers(authHeader);
    const isFormData = body instanceof FormData;
    
    if (options.headers) {
      const extraHeaders = new Headers(options.headers);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (!isFormData) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      ...options,
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `PUT request failed with status ${response.status}`);
    }

    return response.json();
  },

  async delete<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const authHeader = await getAuthHeader();
    const headers = new Headers(authHeader);
    
    if (options.headers) {
      const extraHeaders = new Headers(options.headers);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `DELETE request failed with status ${response.status}`);
    }

    if (response.status === 204) {
      return null as any;
    }
    return response.json();
  },
};
