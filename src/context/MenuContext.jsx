import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserData } from '../utils/storage';

const MenuContext = createContext();

export const MenuProvider = ({ children }) => {
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const userData = getUserData();
            if (userData?.menus) {
                setMenus(userData.menus);
            } else {
                setMenus([
                    {
                        id: 1,
                        parentId: null,
                        title: 'داشبورد',
                        icon: 'bi-grid-1x2-fill',
                        path: '/dashboard',
                        permissionName: null,
                        order: 1,
                        children: []
                    },
                    {
                        id: 2,
                        parentId: null,
                        title: 'مدیریت',
                        icon: 'bi-gear-fill',
                        path: null,
                        permissionName: null,
                        order: 2,
                        children: [
                            {
                                id: 3,
                                parentId: 2,
                                title: 'کاربران',
                                icon: 'bi-people-fill',
                                path: '/users',
                                permissionName: null,
                                order: 1,
                                children: []
                            }
                        ]
                    }
                ]);
            }
        } catch (error) {
            console.error('Error loading menus:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    return (
        <MenuContext.Provider value={{ menus, loading }}>
            {children}
        </MenuContext.Provider>
    );
};

export const useMenu = () => {
    const context = useContext(MenuContext);
    if (!context) throw new Error('useMenu must be used within a MenuProvider');
    return context;
};