import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getCaptcha } from '../../api/captchaApi';

const CaptchaInput = forwardRef(({ onCaptchaChange, onCaptchaKey }, ref) => {
    const [captchaKey, setCaptchaKey] = useState('');
    const [captchaImage, setCaptchaImage] = useState('');
    const [userAnswer, setUserAnswer] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const loadCaptcha = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getCaptcha();
            if (data && data.captchaImageBase64) {
                setCaptchaKey(data.captchaKey);
                setCaptchaImage(data.captchaImageBase64);
                setUserAnswer('');
                if (onCaptchaKey) onCaptchaKey(data.captchaKey);
                if (onCaptchaChange) onCaptchaChange('');
            } else {
                setError('خطا در دریافت کد امنیتی');
            }
        } catch (err) {
            console.error('خطا در دریافت CAPTCHA:', err);
            setError('خطا در دریافت کد امنیتی. لطفاً صفحه را رفرش کنید.');
        } finally {
            setLoading(false);
        }
    };

    useImperativeHandle(ref, () => ({ loadCaptcha }));

    useEffect(() => {
        loadCaptcha();
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setUserAnswer(value);
        if (onCaptchaChange) onCaptchaChange(value);
    };

    return (
        <div className="mb-3">
            {/* 🔥 ردیف اول: تصویر کپچا + دکمه رفرش - هم‌تراز با inputهای بالا */}
            <div className="d-flex align-items-center gap-2 mb-2">
                {/* فضای خالی معادل لیبل (۱۰۰px) */}
                <div style={{ minWidth: '100px' }}></div>

                {captchaImage ? (
                    <img
                        src={`data:image/png;base64,${captchaImage}`}
                        alt="کد امنیتی"
                        onClick={loadCaptcha}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.75'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                        title="کلیک برای تغییر کد امنیتی"
                        style={{
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            padding: '2px',
                            background: 'white',
                            height: '52px',
                            width: 'auto',
                            minWidth: '160px',
                            cursor: 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                    />
                ) : (
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                            height: '52px',
                            width: '160px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: '#f8f9fa',
                            color: '#6c757d',
                            fontSize: '12px'
                        }}
                    >
                        {loading ? 'در حال بارگذاری...' : 'خطا'}
                    </div>
                )}

                {/* دکمه رفرش کپچا */}
                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={loadCaptcha}
                    disabled={loading}
                    title="تغییر کد امنیتی"
                    style={{ height: '52px', width: '42px' }}
                >
                    <i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
                </button>
            </div>

            {/* 🔥 ردیف دوم: لیبل + کادر ورود کپچا */}
            <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0" style={{ minWidth: '100px' }}>
                    کد امنیتی
                </label>
                <input
                    type="text"
                    className="form-control flex-grow-1"
                    placeholder="کد امنیتی را وارد کنید"
                    value={userAnswer}
                    onChange={handleChange}
                    maxLength={5}
                    autoComplete="off"
                    disabled={loading}
                    style={{ height: '48px' }}
                />
            </div>

            {/* خطا */}
            {error && (
                <div className="text-danger mt-1" style={{ fontSize: '12px', marginRight: '110px' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {error}
                </div>
            )}
        </div>
    );
});

CaptchaInput.displayName = 'CaptchaInput';

export default CaptchaInput;