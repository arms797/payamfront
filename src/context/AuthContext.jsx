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
        setPermissions(data.permissions || []);
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
            setPermissions([]);
            setCurrentRoleId(null);
            setIsAuthenticated(false);
            navigate('/');
        }
    };

    // ============================================================
    // تابع بروزرسانی اطلاعات کاربر
    // ============================================================
    const updateUser = (newData) => {
        setUserData(newData);
        setUser(newData);
        setAccessToken(newData.accessToken);
        setRefreshToken(newData.refreshToken);
        setRoles(newData.roles || []);
        setMenus(newData.menus || []);
        setPermissions(newData.permissions || []);
        setCurrentRoleId(newData.currentRoleId || null);
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