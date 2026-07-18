import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from './AuthContext';

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    const { menus: rawMenus, permissions } = useAuth();

    console.log('🔍 rawMenus received:', JSON.stringify(rawMenus, null, 2));

    // ============================================================
    // 1️⃣ فیلتر کردن منوها بر اساس مجوزها
    // ============================================================
    const filteredMenus = useMemo(() => {
        if (!rawMenus) return [];

        if (permissions.length === 0) {
            return rawMenus.filter(menu => !menu.permissionName);
        }

        return rawMenus.filter(menu => {
            if (!menu.permissionName) return true;
            return permissions.includes(menu.permissionName);
        });
    }, [rawMenus, permissions]);

    console.log('🔍 filteredMenus:', JSON.stringify(filteredMenus, null, 2));

    // ============================================================
    // 2️⃣ تبدیل منوهای مسطح (flat) به ساختار درختی
    // ============================================================
    const buildTree = (items, parentId = null) => {
        return items
            .filter(item => item.parentId === parentId)
            .map(item => ({
                ...item,
                children: buildTree(items, item.id)
            }));
    };

    // ============================================================
    // 3️⃣ اگر داده‌ها از قبل درخت هستند، از آنها استفاده کن
    //    در غیر این صورت، buildTree را اجرا کن
    // ============================================================
    const menuTree = useMemo(() => {
        // بررسی کنید که آیا داده‌ها از قبل درخت هستند یا مسطح
        const hasNestedChildren = filteredMenus.some(m => m.children && m.children.length > 0);

        if (hasNestedChildren) {
            // اگر از قبل درخت است، فقط فیلتر شده را برگردان
            return filteredMenus;
        } else {
            // اگر مسطح است، به درخت تبدیل کن
            return buildTree(filteredMenus);
        }
    }, [filteredMenus]);

    console.log('🔍 menuTree:', JSON.stringify(menuTree, null, 2));

    const value = {
        menus: menuTree,
        rawMenus: filteredMenus,
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