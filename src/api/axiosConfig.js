import axios from 'axios';
import { getAccessToken, getRefreshToken, setUserData, clearUserData } from '../utils/storage';

// آدرس پایه API
const API_BASE_URL = 'http://localhost:5023/api';

// ایجاد نمونه Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ============================================================
// اینترسپتور برای افزودن توکن به هدر درخواست‌ها
// ============================================================

api.interceptors.request.use(
    (config) => {
        // ============================================================
        // 🔥 همیشه از localStorage جدیدترین توکن را بخوان
        // ============================================================
        const token = getAccessToken();        
        if (token) {
            // ============================================================
            // 🔥 این خط باعث می‌شود که `api.headers` نیز به‌روز شود
            // ============================================================
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// اینترسپتور برای مدیریت خطاها و تمدید خودکار توکن
// ============================================================
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // اگر خطا 401 بود و قبلاً برای تمدید توکن تلاش نشده بود
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          clearUserData();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // درخواست تمدید توکن
        const response = await axios.post(`${API_BASE_URL}/Auth/refresh`, {
          accessToken: getAccessToken(),
          refreshToken: refreshToken,
        });

        if (response.data.data) {
          // ذخیره توکن‌های جدید
          setUserData(response.data.data);

          // درخواست قبلی را با توکن جدید تکرار کن
          originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // اگر تمدید توکن ناموفق بود، کاربر را به لاگین بفرست
        clearUserData();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;