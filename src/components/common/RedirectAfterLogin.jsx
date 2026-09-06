// src/components/auth/RedirectAfterLogin.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RedirectAfterLogin = () => {
    const navigate = useNavigate();
    const { user, isElmiOstad, userType, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            navigate('/');
            return;
        }

        // ۱️⃣ اگر استاد هیات علمی پیام نور است → صفحه وضعیت علمی
        if (userType === 'ostad' && isElmiOstad) {
            // بررسی اینکه آیا قبلاً وضعیت علمی خود را تکمیل کرده است؟
            // می‌توانید با یک API بررسی کنید
            navigate('/dashboard/elmi-term');
            return;
        }

        // ۲️⃣ اگر استاد غیر هیات علمی پیام نور است → داشبورد معمولی
        if (userType === 'ostad' && !isElmiOstad) {
            navigate('/dashboard');
            return;
        }

        // ۳️⃣ سایر کاربران → داشبورد
        navigate('/dashboard');
    }, [user, isElmiOstad, userType, loading, navigate]);

    // نمایش لودینگ در حین هدایت
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال هدایت...</span>
                </div>
                <p className="mt-2 text-muted">در حال آماده‌سازی...</p>
            </div>
        </div>
    );
};

export default RedirectAfterLogin;