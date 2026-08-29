// src/api/axiosConfig.js

import axios from 'axios';
import { getAccessToken, getRefreshToken, setUserData, clearUserData } from '../utils/storage';

const API_BASE_URL = 'http://localhost:5023/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ============================================================
// 🔥 مدیریت درخواست‌های همزمان با صف
// ============================================================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ============================================================
// اینترسپتور درخواست
// ============================================================
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================================
// اینترسپتور پاسخ
// ============================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // اگر خطا 401 نبود یا قبلاً تلاش شده بود، reject کن
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // اگر در حال تمدید توکن هستیم، درخواست را در صف قرار بده
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/Auth/refresh`, {
        accessToken: getAccessToken(),
        refreshToken: refreshToken,
      });

      if (response.data?.data) {
        const newToken = response.data.data.accessToken;
        setUserData(response.data.data);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // پردازش صف
        processQueue(null, newToken);

        // تکرار درخواست اصلی
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }

      throw new Error('Refresh failed');
    } catch (refreshError) {
      // پردازش صف با خطا
      processQueue(refreshError, null);

      // پاک کردن اطلاعات کاربر و پخش رویداد
      clearUserData();
      window.dispatchEvent(new CustomEvent('token-expired'));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;