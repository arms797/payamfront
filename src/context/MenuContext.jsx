import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    const { menus: rawMenus } = useAuth();
    const [menus, setMenus] = useState([]);

    useEffect(() => {
        console.log('📦 rawMenus received:', JSON.stringify(rawMenus, null, 2));

        if (!rawMenus || rawMenus.length === 0) {
            setMenus([]);
            return;
        }

        // ============================================================
        // 🔥 داده‌ها خودشان به صورت درختی هستند، مستقیماً استفاده می‌شوند
        // ============================================================
        setMenus(rawMenus);
    }, [rawMenus]);

    const value = {
        menus, // ← ساختار درختی آماده
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