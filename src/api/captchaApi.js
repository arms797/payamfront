import api from './axiosConfig';

// ============================================================
// دریافت CAPTCHA جدید از بک‌اند
// ============================================================
export const getCaptcha = async () => {
  const response = await api.get('/Captcha/generate');
  return response.data.data;
};

// ============================================================
// اعتبارسنجی CAPTCHA (اختیاری - در بک‌اند انجام می‌شود)
// ============================================================
export const validateCaptcha = async (captchaKey, userAnswer) => {
  const response = await api.post('/Captcha/validate', {
    captchaKey,
    userAnswer
  });
  return response.data.data;
};