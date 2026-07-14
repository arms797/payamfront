import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    // ============================================================
    // دریافت منوهای خام و مجوزها از AuthContext
    // ============================================================
    const { menus: rawMenus, permissions } = useAuth();

    // ============================================================
    // فیلتر کردن منوها بر اساس مجوزهای کاربر
    // ============================================================
    const filteredMenus = useMemo(() => {
        if (!rawMenus) return [];

        // اگر کاربر هیچ مجوزی ندارد، فقط منوهای عمومی را نمایش بده
        if (permissions.length === 0) {
            return rawMenus.filter(menu => !menu.permissionName);
        }

        // فیلتر منوها: اگر منو permissionName ندارد (عمومی است) یا کاربر به آن دسترسی دارد
        return rawMenus.filter(menu => {
            if (!menu.permissionName) return true; // منوی عمومی
            return permissions.includes(menu.permissionName);
        });
    }, [rawMenus, permissions]);

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
        loading: false, // دیگر نیازی به loading جداگانه نیست
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