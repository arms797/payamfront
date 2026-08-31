import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosConfig';

const LookupContext = createContext();

export const LookupProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [lookupData, setLookupData] = useState({
        days: [],
        hours: [],
        faaliats: [],
        faaliatGroups: [],
        haftegiExceptions: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLookups = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/Lookup/metadata');

            if (response.data?.success) {
                setLookupData({
                    days: response.data.data.days || [],
                    hours: response.data.data.hours || [],
                    faaliats: response.data.data.faaliats || [],
                    faaliatGroups: response.data.data.faaliatGroups || [],
                    haftegiExceptions: response.data.data.haftegiExceptions || []
                });
            }
        } catch (error) {
            console.error('خطا در دریافت داده‌های مرجع:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchLookups();
    }, [fetchLookups]);

    // ============================================================
    // توابع کمکی
    // ============================================================
    const getDayTitle = (code) => {
        const day = lookupData.days.find(d => d.code === parseInt(code));
        return day?.title || code;
    };

    const getDayByCode = (code) => {
        return lookupData.days.find(d => d.code === parseInt(code)) || null;
    };

    const getHourByCode = (code) => {
        return lookupData.hours.find(h => h.codeSaat === code) || null;
    };

    const getFaaliatName = (id) => {
        const faaliat = lookupData.faaliats.find(f => f.id === id);
        return faaliat?.onvan || id;
    };

    // src/context/LookupContext.jsx

    const getFaaliatColor = (id) => {
        if (!id) return '#4d6bfe';
        // تبدیل به عدد برای مقایسه دقیق
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        const faaliat = lookupData.faaliats.find(f => f.id === numericId);
        return faaliat?.color || '#4d6bfe';
    };

    const getHaftegiExceptionsByOstan = (code) => {
        if (!ostanCode) return [];
        return lookupData.haftegiExceptions.filter(e =>
            e.ostanCode === ostanCode || e.ostanCode === null
        );
    }
    // برای دسترسی مستقیم به لیست‌ها
    const daysList = lookupData.days;
    const hoursList = lookupData.hours;
    const faaliatList = lookupData.faaliats;
    const faaliatGroupList = lookupData.faaliatGroups;
    const haftegiExceptionsList = lookupData.haftegiExceptions;

    const value = {
        ...lookupData,
        daysList,
        hoursList,
        faaliatList,
        faaliatGroupList,
        haftegiExceptionsList,
        loading,
        error,
        getDayTitle,
        getDayByCode,
        getHourByCode,
        getFaaliatName,
        getFaaliatColor,
        getHaftegiExceptionsByOstan,
        refreshLookups: fetchLookups,
    };

    return (
        <LookupContext.Provider value={value}>
            {children}
        </LookupContext.Provider>
    );
};

export const useLookup = () => {
    const context = useContext(LookupContext);
    if (!context) {
        throw new Error('useLookup must be used within a LookupProvider');
    }
    return context;
};