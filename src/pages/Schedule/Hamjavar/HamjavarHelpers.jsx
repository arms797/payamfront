// src/pages/Schedule/Hamjavar/HamjavarHelpers.jsx
import React from 'react';

/**
 * نمایش وضعیت درخواست با رنگ مناسب
 */
export const getStatusBadge = (status) => {
    const statusMap = {
        'PishNevis': { label: 'پیش‌نویس', className: 'bg-secondary' },
        'TaeedSabt': { label: 'تایید استاد', className: 'bg-info' },
        'DarEntezarRaeis': { label: 'در انتظار رئیس', className: 'bg-warning text-dark' },
        'TaeedRaeis': { label: 'تایید رئیس', className: 'bg-primary' },
        'RadRaeis': { label: 'رد رئیس', className: 'bg-danger' },
        'DarEntezarKhadamat': { label: 'در انتظار خدمات', className: 'bg-warning text-dark' },
        'TaeedKhadamat': { label: 'تایید خدمات', className: 'bg-success' },
        'RadKhadamat': { label: 'رد خدمات', className: 'bg-danger' },
        'DarEntezarMoaven': { label: 'در انتظار معاون', className: 'bg-warning text-dark' },
        'TaeedNahaei': { label: 'تایید نهایی', className: 'bg-success' },
        'RadNahaei': { label: 'رد نهایی', className: 'bg-danger' }
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
        'TaeedSabt': 'تایید استاد',
        'DarEntezarRaeis': 'در انتظار بررسی رئیس مرکز',
        'TaeedRaeis': 'تایید رئیس مرکز',
        'RadRaeis': 'رد رئیس مرکز',
        'DarEntezarKhadamat': 'در انتظار بررسی خدمات آموزشی استان',
        'TaeedKhadamat': 'تایید خدمات آموزشی استان',
        'RadKhadamat': 'رد خدمات آموزشی استان',
        'DarEntezarMoaven': 'در انتظار بررسی معاونت آموزشی استان',
        'TaeedNahaei': 'تایید نهایی',
        'RadNahaei': 'رد نهایی'
    };
    return map[status] || status;
};

/**
 * دریافت مرحله بعدی برای هر نقش
 */
export const getNextStep = (currentStatus, role) => {
    const steps = {
        ostad: {
            'PishNevis': 'ارسال به رئیس مرکز',
            'TaeedSabt': 'در انتظار بررسی رئیس مرکز'
        },
        raeis: {
            'TaeedSabt': 'بررسی توسط رئیس مرکز',
            'TaeedRaeis': 'ارسال به خدمات آموزشی استان'
        },
        khadamat: {
            'TaeedRaeis': 'بررسی توسط خدمات آموزشی استان',
            'TaeedKhadamat': 'ارسال به معاونت آموزشی استان'
        },
        moaven: {
            'TaeedKhadamat': 'بررسی نهایی توسط معاونت آموزشی استان',
            'TaeedNahaei': 'تایید نهایی'
        }
    };
    return steps[role]?.[currentStatus] || currentStatus;
};