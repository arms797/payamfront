// src/pages/Profile/ChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';

export default function ChangePassword() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false,
    });
    const [errors, setErrors] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // ============================================================
    // 🔥 اعتبارسنجی رمز عبور
    // ============================================================
    const validatePassword = (password) => {
        const issues = [];
        if (password.length < 8) {
            issues.push('حداقل ۸ کاراکتر');
        }
        if (!/[a-z]/.test(password)) {
            issues.push('حداقل یک حرف کوچک (a-z)');
        }
        if (!/[A-Z]/.test(password)) {
            issues.push('حداقل یک حرف بزرگ (A-Z)');
        }
        if (!/\d/.test(password)) {
            issues.push('حداقل یک عدد (0-9)');
        }
        return issues;
    };

    // ============================================================
    // 🔥 تغییر فیلدها
    // ============================================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: '' }));
    };

    // ============================================================
    // 🔥 نمایش/مخفی کردن رمز (با onMouseDown)
    // ============================================================
    const toggleShowPassword = (field, e) => {
        e.preventDefault(); // جلوگیری از از دست رفتن فوکوس
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    // ============================================================
    // 🔥 ارسال فرم
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();

        const passwordIssues = validatePassword(formData.newPassword);
        if (passwordIssues.length > 0) {
            setErrors((prev) => ({
                ...prev,
                newPassword: `رمز عبور باید شامل: ${passwordIssues.join('، ')}`,
            }));
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setErrors((prev) => ({
                ...prev,
                confirmPassword: 'رمز عبور جدید با تایید آن مطابقت ندارد',
            }));
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/User/change-password', {
                userId: user?.id,
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });

            if (response.data?.success) {
                toast.success('رمز عبور با موفقیت تغییر یافت. لطفاً با رمز جدید وارد شوید.');
                setTimeout(async () => {
                    await logout();
                    navigate('/');
                }, 1500);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'خطا در تغییر رمز عبور';
            if (message.includes('رمز عبور فعلی') || message.includes('Current password')) {
                setErrors((prev) => ({ ...prev, currentPassword: 'رمز عبور فعلی اشتباه است' }));
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // 🔥 رندر شرایط رمز عبور
    // ============================================================
    const renderPasswordRequirements = () => {
        const password = formData.newPassword;
        const requirements = [
            { label: 'حداقل ۸ کاراکتر', check: password.length >= 8 },
            { label: 'یک حرف کوچک (a-z)', check: /[a-z]/.test(password) },
            { label: 'یک حرف بزرگ (A-Z)', check: /[A-Z]/.test(password) },
            { label: 'یک عدد (0-9)', check: /\d/.test(password) },
        ];

        const allPassed = requirements.every((r) => r.check);

        return (
            <div className="mt-2 p-2 bg-light rounded" style={{ fontSize: '12px' }}>
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-muted">شرایط رمز:</span>
                    {formData.newPassword.length > 0 && (
                        <span className={`badge ${allPassed ? 'bg-success' : 'bg-warning text-dark'}`}>
                            {allPassed ? '✅ کامل' : '⚠️ ناقص'}
                        </span>
                    )}
                </div>
                {requirements.map((req, index) => (
                    <div key={index} className="d-flex align-items-center gap-2">
                        <span
                            className={`badge ${req.check ? 'bg-success' : 'bg-secondary'}`}
                            style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '9px',
                                padding: 0,
                            }}
                        >
                            {req.check ? '✓' : '✗'}
                        </span>
                        <span className={req.check ? 'text-success' : 'text-muted'} style={{ fontSize: '11px' }}>
                            {req.label}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="container py-3">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white py-2">
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0">
                                    <i className="bi bi-key me-2"></i>
                                    تغییر رمز عبور
                                </h6>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-light"
                                    onClick={() => navigate('/dashboard')}
                                    style={{ padding: '0 6px', fontSize: '14px' }}
                                >
                                    <i className="bi bi-x-lg"></i>
                                </button>
                            </div>
                        </div>

                        <div className="card-body" style={{ padding: '16px 20px' }}>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-info-circle me-1"></i>
                                رمز جدید باید حداقل ۸ کاراکتر و شامل حرف بزرگ، حرف کوچک و عدد باشد.
                            </p>

                            <form onSubmit={handleSubmit}>
                                {/* رمز فعلی */}
                                <div className="mb-2">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>
                                        رمز عبور فعلی
                                    </label>
                                    <div className="position-relative">
                                        <input
                                            type={showPasswords.current ? 'text' : 'password'}
                                            className={`form-control form-control-sm ${errors.currentPassword ? 'is-invalid' : ''}`}
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleChange}
                                            placeholder="رمز فعلی را وارد کنید"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-link position-absolute top-50 start-0 translate-middle-y"
                                            onMouseDown={(e) => toggleShowPassword('current', e)}
                                            style={{
                                                textDecoration: 'none',
                                                color: '#6c757d',
                                                padding: '0 8px',
                                                border: 'none',
                                                background: 'transparent',
                                                zIndex: 5,
                                            }}
                                            disabled={loading}
                                        >
                                            <i className={`bi ${showPasswords.current ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                                        </button>
                                    </div>
                                    {errors.currentPassword && <div className="text-danger small mt-1">{errors.currentPassword}</div>}
                                </div>

                                <hr className="my-2" />

                                {/* رمز جدید */}
                                <div className="mb-2">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>
                                        رمز عبور جدید
                                    </label>
                                    <div className="position-relative">
                                        <input
                                            type={showPasswords.new ? 'text' : 'password'}
                                            className={`form-control form-control-sm ${errors.newPassword ? 'is-invalid' : ''}`}
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            placeholder="رمز جدید را وارد کنید"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-link position-absolute top-50 start-0 translate-middle-y"
                                            onMouseDown={(e) => toggleShowPassword('new', e)}
                                            style={{
                                                textDecoration: 'none',
                                                color: '#6c757d',
                                                padding: '0 8px',
                                                border: 'none',
                                                background: 'transparent',
                                                zIndex: 5,
                                            }}
                                            disabled={loading}
                                        >
                                            <i className={`bi ${showPasswords.new ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                                        </button>
                                    </div>
                                    {errors.newPassword && <div className="text-danger small mt-1">{errors.newPassword}</div>}
                                </div>

                                {renderPasswordRequirements()}

                                {/* تایید رمز جدید */}
                                <div className="mb-2">
                                    <label className="form-label" style={{ fontSize: '13px', fontWeight: '500' }}>
                                        تایید رمز عبور جدید
                                    </label>
                                    <div className="position-relative">
                                        <input
                                            type={showPasswords.confirm ? 'text' : 'password'}
                                            className={`form-control form-control-sm ${errors.confirmPassword ? 'is-invalid' : ''}`}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            placeholder="رمز جدید را مجدداً وارد کنید"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-link position-absolute top-50 start-0 translate-middle-y"
                                            onMouseDown={(e) => toggleShowPassword('confirm', e)}
                                            style={{
                                                textDecoration: 'none',
                                                color: '#6c757d',
                                                padding: '0 8px',
                                                border: 'none',
                                                background: 'transparent',
                                                zIndex: 5,
                                            }}
                                            disabled={loading}
                                        >
                                            <i className={`bi ${showPasswords.confirm ? 'bi-eye-slash' : 'bi-eye'}`} style={{ fontSize: '16px' }}></i>
                                        </button>
                                    </div>
                                    {errors.confirmPassword && <div className="text-danger small mt-1">{errors.confirmPassword}</div>}
                                </div>

                                <div className="d-flex gap-2 mt-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-sm"
                                        disabled={loading}
                                        style={{ flex: 1 }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                در حال تغییر...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check2 me-1"></i>
                                                تغییر رمز
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                            setFormData({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: '',
                                            });
                                            setErrors({
                                                currentPassword: '',
                                                newPassword: '',
                                                confirmPassword: '',
                                            });
                                        }}
                                        disabled={loading}
                                    >
                                        <i className="bi bi-arrow-counterclockwise"></i>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}