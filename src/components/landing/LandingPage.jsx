import React from 'react';
import Login from '../auth/Login';

export default function LandingPage() {
    return (
        <div className="landing-page">
            {/* پس‌زمینه گرادیانت */}
            <div className="login-background"></div>

            {/* کارت لاگین */}
            <div className="login-card">
                <Login />
            </div>
        </div>
    );
}