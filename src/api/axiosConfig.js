import axios from 'axios';

import {
  getAccessToken,
  getRefreshToken,
  getUserData,
  setUserData,
  clearUserData,
} from '../utils/storage';

const API_BASE_URL = '/api';
const REFRESH_URL = '/Auth/refresh';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// نمونه جداگانه برای تمدید توکن؛
// این درخواست وارد اینترسپتور پاسخ api نمی‌شود.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

const setAuthorizationHeader = (config, token) => {
  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
};

const clearAuthorizationHeader = () => {
  delete api.defaults.headers.common.Authorization;
};

const notifyTokenExpired = () => {
  clearUserData();
  clearAuthorizationHeader();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('token-expired'));
  }
};

// ---------------------------------------------
// Request interceptor
// ---------------------------------------------
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    // از توکن فعلی استفاده کن، نه توکنی که قبلاً
    // به‌صورت پیش‌فرض روی Axios باقی مانده است.
    if (token) {
      setAuthorizationHeader(config, token);

      api.defaults.headers.common.Authorization =
        `Bearer ${token}`;
    } else {
      setAuthorizationHeader(config, null);
      clearAuthorizationHeader();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------
// Response interceptor
// ---------------------------------------------
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // فقط خطای 401 نیازمند بررسی تمدید توکن است.
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // بعضی درخواست‌ها، مانند خروج، نباید باعث
    // تلاش خودکار برای تمدید توکن شوند.
    if (originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    // درخواست نباید بیش از یک بار دوباره ارسال شود.
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // اگر تمدید دیگری در جریان است، منتظر نتیجه بمان.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          setAuthorizationHeader(originalRequest, newToken);
          return api(originalRequest);
        })
        .catch((queueError) => Promise.reject(queueError));
    }

    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      const currentAccessToken = getAccessToken();

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await refreshClient.post(REFRESH_URL, {
        accessToken: currentAccessToken,
        refreshToken,
      });

      const responseData = response.data?.data;

      if (!responseData?.accessToken) {
        throw new Error('Refresh response has no access token');
      }

      // اگر سرور بعضی فیلدهای کاربر را در پاسخ تمدید
      // برنگرداند، اطلاعات قبلی را حفظ کن.
      const updatedUserData = {
        ...(getUserData() || {}),
        ...responseData,
        accessToken: responseData.accessToken,
        refreshToken:
          responseData.refreshToken || refreshToken,
      };

      // تمدید فقط زمانی موفق محسوب می‌شود که ذخیره‌سازی
      // اطلاعات جدید هم موفق شده باشد.
      const saved = setUserData(updatedUserData);

      if (!saved) {
        throw new Error('Could not save refreshed user data');
      }

      const newAccessToken = updatedUserData.accessToken;

      api.defaults.headers.common.Authorization =
        `Bearer ${newAccessToken}`;

      // درخواست‌های منتظر را با توکن جدید آزاد کن.
      processQueue(null, newAccessToken);

      // وضعیت AuthContext را نیز به‌روز کن.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('token-refreshed', {
            detail: updatedUserData,
          })
        );
      }

      setAuthorizationHeader(originalRequest, newAccessToken);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      notifyTokenExpired();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;

/*
// src/api/axiosConfig.js

import axios from 'axios';
import { getAccessToken, getRefreshToken, setUserData, clearUserData } from '../utils/storage';

//تنظیمات اتومات
//const API_BASE_URL = import.meta.env.DEV 
//  ? '/api'  // در dev، Vite proxy به http://localhost:5000/api می‌فرستد
//  : '/api'; // در production، همان سرور، پس مسیر نسبی کار می‌کند
const API_BASE_URL='/api';

//تنظیمات قدیمی . ابتدا محتوای دوفایل .env و فایل  .env.production و بعدش هم تنظیمات axios.config
//محتوای فایل .env
//VITE_API_URL=http://localhost:5000/api
//محتوای فایل .env.production
//VITE_API_URL=http://94.74.170.19/api

// تنظیمات دستی ولی درست
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5023/api';
//const API_BASE_URL =  'http://localhost:5023/api';

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

      //const response = await axios.post(`${API_BASE_URL}/Auth/refresh`, {
      const response = await axios.post(`/api/Auth/refresh`, {
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
*/