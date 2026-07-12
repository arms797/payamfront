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

// ============================================================
// ایجاد Context
// ============================================================
const AuthContext = createContext();

// ============================================================
// Provider
// ============================================================
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);           // اطلاعات کامل کاربر
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [roles, setRoles] = useState([]);           // لیست نقش‌ها
    const [menus, setMenus] = useState([]);           // منوهای کاربر
    const [currentRoleId, setCurrentRoleId] = useState(null);  // نقش فعال
    const navigate = useNavigate();

    // ============================================================
    // بارگذاری اطلاعات کاربر از localStorage هنگام mount
    // ============================================================
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
                    setCurrentRoleId(userData.currentRoleId || null);
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('خطا در بارگذاری کاربر:', error);
            } finally {
                setLoading(false);
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
        setCurrentRoleId(data.currentRoleId || null);
        setIsAuthenticated(true);
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
            setCurrentRoleId(null);
            setIsAuthenticated(false);
            navigate('/');
        }
    };

    // ============================================================
    // تابع بروزرسانی اطلاعات کاربر (مثلاً بعد از تغییر نقش)
    // ============================================================
    const updateUser = (newData) => {
        setUserData(newData);
        setUser(newData);
        setAccessToken(newData.accessToken);
        setRefreshToken(newData.refreshToken);
        setRoles(newData.roles || []);
        setMenus(newData.menus || []);
        setCurrentRoleId(newData.currentRoleId || null);
    };

    // ============================================================
    // تابع تغییر نقش فعال
    // ============================================================
    const changeRole = (roleId) => {
        setCurrentRoleId(roleId);
        // نقش فعال را در user نیز به‌روز می‌کنیم
        if (user) {
            const updatedUser = { ...user, currentRoleId: roleId };
            setUser(updatedUser);
            setUserData(updatedUser);
        }
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
        currentRoleId,
        login,
        logout,
        updateUser,
        changeRole
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// ============================================================
// Hook سفارشی برای استفاده آسان
// ============================================================
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};