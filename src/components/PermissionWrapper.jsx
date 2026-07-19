import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useAccessLevel } from '../hooks/useAccessLevel';

export const PermissionWrapper = ({
    permission,      // یک مجوز خاص
    permissions,     // یا لیست مجوزها (برای hasAnyPermission)
    mode = 'single', // 'single' | 'any' | 'all'
    targetMarkazId,  // برای بررسی سطح دسترسی
    fallback = null,
    children
}) => {
    const { hasPermission: hasAuthPermission } = useAuth();
    const { canEdit, canView } = useAccessLevel();

    // ============================================================
    // 1️⃣ بررسی مجوز
    // ============================================================
    let hasAccess = false;

    if (mode === 'single' && permission) {
        hasAccess = hasAuthPermission(permission);
    } else if (mode === 'any' && permissions) {
        hasAccess = permissions.some(p => hasAuthPermission(p));
    } else if (mode === 'all' && permissions) {
        hasAccess = permissions.every(p => hasAuthPermission(p));
    } else {
        hasAccess = true;
    }

    // ============================================================
    // 2️⃣ اگر مجوز داشت، سطح دسترسی را بررسی کن
    // ============================================================
    let canEditAccess = true;
    if (hasAccess && targetMarkazId !== undefined) {
        canEditAccess = canEdit(targetMarkazId);
    }

    // ============================================================
    // 3️⃣ برگرداندن نتیجه
    // ============================================================
    return (hasAccess && canEditAccess) ? children : fallback;
};