// src/pages/Schedule/Hamjavar/HamjavarHelpers.jsx
import React from 'react';

/**
 * نمایش وضعیت درخواست با رنگ مناسب
 * وضعیت‌ها: PishNevis, Taeed, Rad, Eslah
 */
export const getStatusBadge = (status) => {
    const statusMap = {
        'PishNevis': { label: 'پیش‌نویس', className: 'bg-secondary' },
        'Taeed': { label: 'تایید', className: 'bg-success' },
        'Rad': { label: 'رد ❌', className: 'bg-danger' },
        'Eslah': { label: 'اصلاح ✏️', className: 'bg-warning text-dark' }
    };

    const info = statusMap[status] || { label: status || 'نامشخص', className: 'bg-secondary' };
    return <span className={`badge ${info.className}`}>{info.label}</span>;
};

/**
 * دریافت نمایش فارسی وضعیت
 */
export const getStatusDisplay = (status) => {
    const map = {
        'PishNevis': 'پیش‌نویس',
        'Taeed': 'تایید',
        'Rad': 'رد',
        'Eslah': 'اصلاح'
    };
    return map[status] || status;
};

/**
 * دریافت کلاس رنگ برای وضعیت
 */
export const getStatusColor = (status) => {
    const colorMap = {
        'PishNevis': 'secondary',
        'Taeed': 'success',
        'Rad': 'danger',
        'Eslah': 'warning'
    };
    return colorMap[status] || 'secondary';
};