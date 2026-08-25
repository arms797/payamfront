// src/context/ReshtehContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosConfig';

const ReshtehContext = createContext();

export const ReshtehProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [reshtehList, setReshtehList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchReshtehList = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/Reshteh/list');
            if (response.data?.success) {
                setReshtehList(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت رشته‌ها:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchReshtehList();
    }, [fetchReshtehList]);

    // دریافت رشته‌های یک گروه آموزشی خاص
    const getByGrooheId = useCallback((grooheId) => {
        if (!grooheId) return [];
        return reshtehList.filter(r => r.grooheAmoozeshiId === grooheId);
    }, [reshtehList]);

    // دریافت نام رشته بر اساس شناسه
    const getReshtehName = useCallback((id) => {
        const item = reshtehList.find(r => r.id === id);
        return item?.onvanReshte || id || '-';
    }, [reshtehList]);

    // دریافت مقطع رشته
    const getMaghta = useCallback((id) => {
        const item = reshtehList.find(r => r.id === id);
        return item?.maghta || null;
    }, [reshtehList]);

    // گروه‌بندی رشته‌ها بر اساس گروه آموزشی (برای نمایش در کومبوهای دوطبقه)
    const groupedByGroohe = useMemo(() => {
        const groups = {};
        reshtehList.forEach(r => {
            const key = r.grooheAmoozeshiId;
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });
        return groups;
    }, [reshtehList]);

    const value = {
        reshtehList,
        loading,
        error,
        groupedByGroohe,
        getByGrooheId,
        getReshtehName,
        getMaghta,
        refreshReshteh: fetchReshtehList,
    };

    return (
        <ReshtehContext.Provider value={value}>
            {children}
        </ReshtehContext.Provider>
    );
};

export const useReshteh = () => {
    const context = useContext(ReshtehContext);
    if (!context) {
        throw new Error('useReshteh must be used within a ReshtehProvider');
    }
    return context;
};