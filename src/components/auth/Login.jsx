import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { setUserData } from '../../utils/storage';
import CaptchaInput from './CaptchaInput';

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [captchaKey, setCaptchaKey] = useState('');
    const [captchaAnswer, setCaptchaAnswer] = useState('');
    const captchaInputRef = useRef(null);

    async function handleSubmit(e) {
        e.preventDefault();
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

            if (response.data.data) {
                setUserData(response.data.data);
            }

            navigate('/dashboard', { replace: true });
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'خطا در ارتباط با سرور';

            if (errorMessage.includes('کد امنیتی') || errorMessage.includes('captcha')) {
                setError('کد امنیتی اشتباه است');
                setCaptchaKey('');
                setCaptchaAnswer('');
                if (captchaInputRef.current) {
                    captchaInputRef.current.loadCaptcha();
                }
            } else if (errorMessage.includes('نام کاربری') || errorMessage.includes('رمز عبور')) {
                setError('نام کاربری یا رمز عبور اشتباه است');
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
                زمانبندی برنامه هفتگی اساتید دانشگاه پیام نور استان فارس
            </h5>

            <hr />

            <h5 className="text-center mb-4">ورود به سامانه</h5>

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
                    <input
                        type="password"
                        className="form-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
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