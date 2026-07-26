import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosConfig';
import {
    getAccessToken,
    getRefreshToken,
    getUserData,
    clearUserData,
    setUserData
} from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [roles, setRoles] = useState([]);
    const [menus, setMenus] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [currentRoleId, setCurrentRoleId] = useState(null);
    const navigate = useNavigate();

    // ============================================================
    // بارگذاری اطلاعات کاربر از localStorage
    // ============================================================
    /* useEffect(() => {
         const loadUser = async () => {
             try {
                 console.log('🔍 loadUser STARTED');
 
                 const token = getAccessToken();
                 const refresh = getRefreshToken();
                 const userData = getUserData();
 
                 // ============================================================
                 // 🔥 لاگ دقیق
                 // ============================================================
                 console.log('🔍 loadUser - token (first 30):', token?.substring(0, 30) + '...');
                 console.log('🔍 loadUser - userData:', userData);
                 console.log('🔍 loadUser - currentRoleId from userData:', userData?.currentRoleId);
                 console.log('🔍 loadUser - currentRoleName from userData:', userData?.currentRoleName);
 
                 if (token && refresh && userData) {
                     setAccessToken(token);
                     setRefreshToken(refresh);
                     setUser(userData);
                     setRoles(userData.roles || []);
                     setMenus(userData.menus || []);
                     setPermissions(userData.permissions || []);
                     setCurrentRoleId(userData.currentRoleId || null);
                     setIsAuthenticated(true);
 
                     // ============================================================
                     // 🔥 تنظیم هدر Axios هنگام بارگذاری اولیه
                     // ============================================================
                     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                 }
                 else {
                     console.log('❌ loadUser - missing data, not authenticated');
                     setIsAuthenticated(false);
                 }
             } catch (error) {
                 console.error('خطا در بارگذاری کاربر:', error);
             } finally {
                 setLoading(false);
             }
         };
 
         loadUser();
     }, []);*/

    // در AuthContext.jsx - useEffect
    useEffect(() => {
        const loadUser = async () => {
            try {
                const token = getAccessToken();
                const refresh = getRefreshToken();
                const userData = getUserData();


                if (token && refresh && userData) {
                    setAccessToken(token);
                    setRefreshToken(refresh);
                    setUser(userData);
                    setRoles(userData.roles || []);
                    setMenus(userData.menus || []);
                    setPermissions(userData.permissions || []);
                    setCurrentRoleId(userData.currentRoleId || null);
                    setIsAuthenticated(true);
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                } else {

                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error('❌ loadUser error:', error);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
                console.log('🔍 loadUser - loading set to false');
            }
        };

        loadUser();
    }, []);
    // ============================================================
    // تابع ورود
    // ============================================================
    const login = (data) => {
        setUserData(data);
        setUser(data);
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        setRoles(data.roles || []);
        setMenus(data.menus || []);
        setPermissions(data.permissions || []);
        setCurrentRoleId(data.currentRoleId || null);
        setIsAuthenticated(true);

        // ============================================================
        // 🔥 تنظیم هدر Axios بعد از لاگین
        // ============================================================
        api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    };

    // ============================================================
    // تابع خروج
    // ============================================================
    const logout = async () => {
        try {
            await api.post('/Auth/logout');
        } catch (error) {
            console.error('خطا در خروج:', error);
        } finally {
            clearUserData();
            setUser(null);
            setAccessToken(null);
            setRefreshToken(null);
            setRoles([]);
            setMenus([]);
            setPermissions([]);
            setCurrentRoleId(null);
            setIsAuthenticated(false);

            // ============================================================
            // 🔥 حذف هدر Axios بعد از خروج
            // ============================================================
            delete api.defaults.headers.common['Authorization'];

            navigate('/');
        }
    };

    // ============================================================
    // 🔥 تابع بروزرسانی اطلاعات کاربر (اصلاح‌شده)
    // ============================================================
    // ============================================================
    // 🔥 تابع بروزرسانی اطلاعات کاربر (اصلاح‌شده)
    // ============================================================
    const updateUser = (newData) => {
        //console.log('🔄 updateUser called with:', newData);   // برای دیباگ

        // ذخیره در localStorage
        setUserData(newData);

        // بروزرسانی Stateها
        setUser(newData);
        setAccessToken(newData.accessToken);
        setRefreshToken(newData.refreshToken);
        setRoles(newData.roles || []);
        setMenus(newData.menus || []);
        setPermissions(newData.permissions || []);
        setCurrentRoleId(newData.currentRoleId || null);
        setIsAuthenticated(true);

        // 🔥 آپدیت هدر Axios (خیلی مهم)
        if (newData.accessToken) {
            api.defaults.headers.common['Authorization'] = `Bearer ${newData.accessToken}`;
        }
    };

    // ============================================================
    // تابع تغییر نقش فعال
    // ============================================================
    const changeRole = (roleId) => {
        setCurrentRoleId(roleId);
        if (user) {
            const updatedUser = { ...user, currentRoleId: roleId };
            setUser(updatedUser);
            setUserData(updatedUser);
        }
    };

    // ============================================================
    // توابع بررسی مجوز
    // ============================================================
    const hasPermission = (permissionName) => {
        if (!permissionName) return true;
        return permissions.includes(permissionName);
    };

    const hasAnyPermission = (permissionList) => {
        if (!permissionList || permissionList.length === 0) return true;
        return permissionList.some(p => permissions.includes(p));
    };

    const hasAllPermissions = (permissionList) => {
        if (!permissionList || permissionList.length === 0) return true;
        return permissionList.every(p => permissions.includes(p));
    };

    // ============================================================
    // مقدار Context
    // ============================================================
    const value = {
        user,
        accessToken,
        refreshToken,
        loading,
        isAuthenticated,
        roles,
        menus,
        permissions,
        currentRoleId,
        login,
        logout,
        updateUser,
        changeRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};