import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAccessLevel = () => {
    const { user, roles, currentRoleId, permissions } = useAuth();

    // ============================================================
    // دریافت MarkazId کاربر
    // ============================================================
    const userMarkazId = useMemo(() => {
        return user?.markazId || null;
    }, [user]);

    // ============================================================
    // دریافت CodeRole نقش فعال
    // ============================================================
    const codeRole = useMemo(() => {
        const activeRole = roles?.find(r => r.id === currentRoleId);
        return activeRole?.codeRole || 4; // پیش‌فرض: مرکز
    }, [roles, currentRoleId]);

    // ============================================================
    // بررسی امکان ویرایش
    // ============================================================
    const canEdit = useMemo(() => {
        return (targetMarkazId) => {
            // ادمین سامانه (1) و سازمان (2) → همیشه مجاز
            if (codeRole <= 2) return true;

            // استان (3) → فقط همان استان (نیاز به OstanId)
            if (codeRole === 3) {
                // نیاز به بررسی OstanId
                return true; // فعلاً ساده
            }

            // مرکز (4) → فقط همان مرکز
            if (codeRole === 4) {
                return userMarkazId === targetMarkazId;
            }

            return false;
        };
    }, [codeRole, userMarkazId]);

    // ============================================================
    // بررسی امکان مشاهده (همیشه true)
    // ============================================================
    const canView = useMemo(() => {
        return true;
    }, []);

    // ============================================================
    // بررسی مجوز خاص
    // ============================================================
    const hasPermission = (permissionName) => {
        return permissions?.includes(permissionName) || false;
    };

    return {
        canEdit,
        canView,
        hasPermission,
        codeRole,
        userMarkazId
    };
};