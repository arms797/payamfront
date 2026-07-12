import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    // ============================================================
    // دریافت منوهای خام و نقش فعال از AuthContext
    // ============================================================
    const { menus: rawMenus, roles, currentRoleId } = useAuth();

    // ============================================================
    // پیدا کردن مجوزهای نقش فعال
    // ============================================================
    const activeRolePermissions = useMemo(() => {
        if (!roles || !currentRoleId) return [];

        const activeRole = roles.find(r => r.id === currentRoleId);
        return activeRole?.permissions || [];
    }, [roles, currentRoleId]);

    // ============================================================
    // فیلتر کردن منوها بر اساس مجوزهای نقش فعال
    // ============================================================
    const filteredMenus = useMemo(() => {
        if (!rawMenus) return [];

        // اگر نقش هیچ مجوزی ندارد، فقط منوهای عمومی را نمایش بده
        if (activeRolePermissions.length === 0) {
            return rawMenus.filter(menu => !menu.permissionName);
        }

        // فیلتر منوها: اگر منو permissionName ندارد (عمومی است) یا کاربر به آن دسترسی دارد
        return rawMenus.filter(menu => {
            if (!menu.permissionName) return true; // منوی عمومی
            return activeRolePermissions.includes(menu.permissionName);
        });
    }, [rawMenus, activeRolePermissions]);

    // ============================================================
    // تبدیل منوها به ساختار درختی
    // ============================================================
    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => item.parentId === parentId)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id)
            }));
    };

    const menuTree = useMemo(() => {
        return buildTree(filteredMenus);
    }, [filteredMenus]);

    // ============================================================
    // مقدار Context
    // ============================================================
    const value = {
        menus: menuTree,
        rawMenus: filteredMenus,
        // اگر بعداً نیاز به جستجو داشتید
        // searchMenus: (term) => { ... }
    };

    return (
        <MenuContext.Provider value={value}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
};