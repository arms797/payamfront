// src/context/GrooheAmoozeshiContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosConfig';

const GrooheAmoozeshiContext = createContext();

export const GrooheAmoozeshiProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [grooheList, setGrooheList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGrooheList = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/GrooheAmoozeshi/list');
            if (response.data?.success) {
                setGrooheList(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت گروه‌های آموزشی:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchGrooheList();
    }, [fetchGrooheList]);

    // دریافت گروه‌های یک دانشکده
    const getByDaneshkade = useCallback((codeDaneshkade) => {
        if (!codeDaneshkade) return [];
        return grooheList.filter(g => g.codeDaneshkade === codeDaneshkade);
    }, [grooheList]);

    // دریافت نام گروه بر اساس شناسه
    const getGrooheName = useCallback((id) => {
        const item = grooheList.find(g => g.id === id);
        return item?.onvanGrooheAmoozeshi || id || '-';
    }, [grooheList]);

    // لیست دانشکده‌های یکتا
    const daneshkadeList = useMemo(() => {
        const map = new Map();
        grooheList.forEach(g => {
            if (g.codeDaneshkade && g.naamDaneshkadeh) {
                map.set(g.codeDaneshkade, g.naamDaneshkadeh);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }));
    }, [grooheList]);

    const value = {
        grooheList,
        loading,
        error,
        daneshkadeList,
        getByDaneshkade,
        getGrooheName,
        refreshGroohe: fetchGrooheList,
    };

    return (
        <GrooheAmoozeshiContext.Provider value={value}>
            {children}
        </GrooheAmoozeshiContext.Provider>
    );
};

export const useGrooheAmoozeshi = () => {
    const context = useContext(GrooheAmoozeshiContext);
    if (!context) {
        throw new Error('useGrooheAmoozeshi must be used within a GrooheAmoozeshiProvider');
    }
    return context;
};