import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from './AuthContext';

const MarkazContext = createContext();

export const MarkazProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [markazList, setMarkazList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ============================================================
    // 🔥 تابع دریافت مراکز (خارج از useEffect)
    // ============================================================
    const fetchMarkaz = useCallback(async () => {
        try {
            const response = await api.get('/Markaz/list');
            if (response.data?.data) {
                setMarkazList(response.data.data);
            }
        } catch (error) {
            console.error('خطا در دریافت مراکز:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================================
    // 🔥 بارگذاری اولیه
    // ============================================================
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }
        fetchMarkaz();
    }, [isAuthenticated, fetchMarkaz]);

    const value = {
        markazList,
        loading,
        error,
        refreshMarkaz: fetchMarkaz   // ← اضافه شد
    };

    return (
        <MarkazContext.Provider value={value}>
            {children}
        </MarkazContext.Provider>
    );
};

export const useMarkaz = () => {
    const context = useContext(MarkazContext);
    if (!context) {
        throw new Error('useMarkaz must be used within a MarkazProvider');
    }
    return context;
};