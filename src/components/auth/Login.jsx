import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { useAuth } from '../../context/AuthContext';
import CaptchaInput from './CaptchaInput';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();  // ← اضافه شد
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [captchaKey, setCaptchaKey] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const captchaInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);

    try {
      if (!captchaKey || !captchaAnswer) {
        setError('لطفاً کد امنیتی را وارد کنید');
        setLoading(false);
        return;
      }

      const response = await api.post('/Auth/login', {
        username,
        password,
        captchaKey,
        captchaAnswer
      });

      if (response.data?.data) {
        // ============================================================
        // 🔥 ذخیره اطلاعات در AuthContext
        // ============================================================
        login(response.data.data);

        // ============================================================
        // 🔥 هدایت به داشبورد
        // ============================================================
        
        if (response.data.data.isElmiOstad && !response.data.data.hasActiveElmiTerm) {
          navigate('/dashboard/elmi-term');
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'خطا در ارتباط با سرور';
      console.log('errorMessage:', errorMessage);

      if (errorMessage.includes('کد امنیتی') || errorMessage.includes('captcha')) {
        setError('کد امنیتی اشتباه است');
        setCaptchaKey('');
        setCaptchaAnswer('');
        if (captchaInputRef.current) {
          captchaInputRef.current.loadCaptcha();
        }
      } else if (errorMessage.includes('نام کاربری') || errorMessage.includes('رمز عبور') || errorMessage.includes('login_invalid')) {
        setError('نام کاربری یا رمز عبور اشتباه است');
        setPassword('');
        setCaptchaKey('');
        setCaptchaAnswer('');
        if (captchaInputRef.current) {
          captchaInputRef.current.loadCaptcha();
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="text-center mb-3">
        <img src="/logo.png" alt="لوگو" style={{ width: '80px', height: 'auto' }} />
      </div>

      <h5 className="text-center text-muted">
        سامانه خدمات الکترونیکی دانشگاه پیام نور استان فارس
      </h5>

      <hr />
      {error && (
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">نام کاربری</label>
          <input
            type="text"
            className="form-control"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">رمز عبور</label>
          <div className="position-relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              style={{ paddingRight: '40px' }} // جا برای آیکون
            />
            <button
              type="button"
              className="btn btn-link position-absolute top-50 start-0 translate-middle-y"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                textDecoration: 'none',
                color: '#6c757d',
                padding: '0 10px',
                border: 'none',
                background: 'transparent',
                zIndex: 5
              }}
              tabIndex="-1"
              disabled={loading}
            >
              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
            </button>
          </div>
        </div>

        <CaptchaInput
          ref={captchaInputRef}
          onCaptchaKey={(key) => setCaptchaKey(key)}
          onCaptchaChange={(answer) => setCaptchaAnswer(answer)}
        />

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              در حال ورود...
            </>
          ) : (
            'ورود'
          )}
        </button>
      </form>
    </>
  );
}