// components/PermissionWrapper.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const PermissionWrapper = ({
    permission,      // یک مجوز خاص
    permissions,     // یا لیست مجوزها (برای hasAnyPermission)
    mode = 'single', // 'single' | 'any' | 'all'
    fallback = null, // در صورت عدم دسترسی چه چیزی نمایش داده شود
    children
}) => {
    const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

    // ============================================================
    // بررسی دسترسی بر اساس حالت
    // ============================================================
    let hasAccess = false;

    if (mode === 'single' && permission) {
        hasAccess = hasPermission(permission);
    } else if (mode === 'any' && permissions) {
        hasAccess = hasAnyPermission(permissions);
    } else if (mode === 'all' && permissions) {
        hasAccess = hasAllPermissions(permissions);
    } else {
        // اگر هیچ مجوزی نیاز نباشد، همیشه نمایش بده
        hasAccess = true;
    }

    // ============================================================
    // برگرداندن نتیجه
    // ============================================================
    return hasAccess ? children : fallback;
};