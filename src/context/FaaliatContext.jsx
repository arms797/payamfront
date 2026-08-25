// src/context/FaaliatContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosConfig';

const FaaliatContext = createContext();

export const FaaliatProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [faaliatList, setFaaliatList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchFaaliatList = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/Faaliat/list');
            if (response.data?.success) {
                setFaaliatList(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت فعالیت‌ها:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchFaaliatList();
    }, [fetchFaaliatList]);

    // دریافت فعالیت‌های فعال
    const activeFaaliat = useMemo(() => {
        return faaliatList.filter(f => f.vazeeat === true);
    }, [faaliatList]);

    // دریافت فعالیت‌ها بر اساس نوع انجام
    const getByNoeAnjam = useCallback((noeAnjam) => {
        if (!noeAnjam) return activeFaaliat;
        // 1=حضوری، 2=مجازی، 3=ترکیبی
        return activeFaaliat.filter(f => f.noeAnjam === noeAnjam || f.noeAnjam === 3);
    }, [activeFaaliat]);

    // دریافت نام فعالیت بر اساس شناسه
    const getFaaliatName = useCallback((id) => {
        const item = faaliatList.find(f => f.id === id);
        return item?.onvan || id || '-';
    }, [faaliatList]);

    // دریافت رنگ فعالیت
    const getFaaliatColor = useCallback((id) => {
        const item = faaliatList.find(f => f.id === id);
        return item?.color || '#4d6bfe';
    }, [faaliatList]);

    // گروه‌بندی فعالیت‌ها بر اساس نوع انجام
    const groupedByNoeAnjam = useMemo(() => {
        return {
            hozori: activeFaaliat.filter(f => f.noeAnjam === 1 || f.noeAnjam === 3),
            majazi: activeFaaliat.filter(f => f.noeAnjam === 2 || f.noeAnjam === 3),
            all: activeFaaliat,
        };
    }, [activeFaaliat]);

    const value = {
        faaliatList,
        loading,
        error,
        activeFaaliat,
        groupedByNoeAnjam,
        getByNoeAnjam,
        getFaaliatName,
        getFaaliatColor,
        refreshFaaliat: fetchFaaliatList,
    };

    return (
        <FaaliatContext.Provider value={value}>
            {children}
        </FaaliatContext.Provider>
    );
};

export const useFaaliat = () => {
    const context = useContext(FaaliatContext);
    if (!context) {
        throw new Error('useFaaliat must be used within a FaaliatProvider');
    }
    return context;
};