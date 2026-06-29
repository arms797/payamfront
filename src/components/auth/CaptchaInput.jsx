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
                if (onCaptchaKey) {
                    onCaptchaKey(data.captchaKey);
                }
                if (onCaptchaChange) {
                    onCaptchaChange('');
                }
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

    useImperativeHandle(ref, () => ({
        loadCaptcha
    }));

    useEffect(() => {
        loadCaptcha();
    }, []);

    const handleChange = (e) => {
        const value = e.target.value;
        setUserAnswer(value);
        if (onCaptchaChange) {
            onCaptchaChange(value);
        }
    };

    return (
        <div className="mb-3">
            <label className="form-label">کد امنیتی</label>

            <div className="d-flex align-items-center">
                {captchaImage ? (
                    <img
                        src={`data:image/png;base64,${captchaImage}`}
                        alt="کد امنیتی"
                        className="captcha-image"
                        style={{
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px',
                            background: 'white',
                            width: '180px',
                            height: 'auto',
                            maxHeight: '60px'
                        }}
                    />
                ) : (
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                            width: '180px',
                            height: '50px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            background: '#f8f9fa',
                            color: '#6c757d',
                            fontSize: '14px'
                        }}
                    >
                        {loading ? 'در حال بارگذاری...' : 'خطا در بارگذاری'}
                    </div>
                )}

                <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm ms-2"
                    onClick={loadCaptcha}
                    disabled={loading}
                    title="تغییر کد امنیتی"
                >
                    <i className={`bi ${loading ? 'bi-arrow-repeat spin' : 'bi-arrow-clockwise'}`}></i>
                </button>
            </div>

            {error && (
                <div className="text-danger mt-1" style={{ fontSize: '12px' }}>
                    <i className="bi bi-exclamation-circle me-1"></i>
                    {error}
                </div>
            )}

            <input
                type="text"
                className="form-control mt-2"
                placeholder="کد امنیتی را وارد کنید"
                value={userAnswer}
                onChange={handleChange}
                maxLength={5}
                autoComplete="off"
                disabled={loading}
                style={{ maxWidth: '200px' }}
            />

            <small className="text-muted" style={{ fontSize: '12px' }}>
                <i className="bi bi-info-circle me-1"></i>
                کد امنیتی را از روی تصویر وارد کنید
            </small>
        </div>
    );
});

CaptchaInput.displayName = 'CaptchaInput';

export default CaptchaInput;