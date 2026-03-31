const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const apiCall = async <T = any>(
  endpoint: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'API call failed');
  }
  
  return data;
};

// Helper để lấy data trực tiếp (skip wrapper)
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  const response = await apiCall<{ data: T }>(endpoint);
  return response.data as T;
};

export const apiPost = async <T = any>(endpoint: string, body: any): Promise<T> => {
  const response = await apiCall<{ data: T }>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return response.data as T;
};

export const apiPut = async <T = any>(endpoint: string, body: any): Promise<T> => {
  const response = await apiCall<{ data: T }>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return response.data as T;
};

export const apiDelete = async (endpoint: string): Promise<void> => {
  await apiCall(endpoint, { method: 'DELETE' });
};