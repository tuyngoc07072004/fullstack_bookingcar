import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('staffToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token hết hạn hoặc không hợp lệ
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffInfo');
      // Prevent double redirect / double flashing alerts across parallel requests
      const w = window as any;
      if (!w.__staff_auth_redirecting) {
        w.__staff_auth_redirecting = true;
        window.location.replace('/staff-login');
        // reset flag after navigation settles (best-effort)
        setTimeout(() => {
          w.__staff_auth_redirecting = false;
        }, 2000);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;