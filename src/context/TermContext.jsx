// src/context/TermContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../api/axiosConfig';

const TermContext = createContext();

export const TermProvider = ({ children }) => {
    const { isAuthenticated } = useAuth();
    const [termList, setTermList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ============================================================
    // 🔥 تعریف fetchTerms با useCallback
    // ============================================================
    const fetchTerms = useCallback(async () => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.get('/Term/list');
            if (response.data?.data) {
                setTermList(response.data.data);
            }
        } catch (error) {
            console.error('خطا در دریافت لیست ترم‌ها:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    // ============================================================
    // 🔥 فراخوانی fetchTerms در useEffect
    // ============================================================
    useEffect(() => {
        fetchTerms();
    }, [fetchTerms]);

    // ============================================================
    // ترم جاری (همان ترم فعال)
    // ============================================================
    const currentTerm = useMemo(() => {
        return termList.find(t => t.vazeeyat === true) || null;
    }, [termList]);

    // ============================================================
    // ترم‌های گذشته (همه ترم‌ها به جز ترم جاری)
    // ============================================================
    const pastTerms = useMemo(() => {
        return termList.filter(t => t.vazeeyat !== true);
    }, [termList]);

    // ============================================================
    // دریافت یک ترم بر اساس کد
    // ============================================================
    const getTermByCode = (codeTerm) => {
        return termList.find(t => t.codeTerm === codeTerm) || null;
    };

    // ============================================================
    // دریافت عنوان ترم بر اساس کد
    // ============================================================
    const getTermTitle = (codeTerm) => {
        const term = getTermByCode(codeTerm);
        return term?.onvanTerm || codeTerm || '-';
    };

    // ============================================================
    // کد ترم جاری
    // ============================================================
    const currentTermCode = useMemo(() => {
        return currentTerm?.codeTerm || null;
    }, [currentTerm]);

    // ============================================================
    // عنوان ترم جاری
    // ============================================================
    const currentTermTitle = useMemo(() => {
        return currentTerm?.onvanTerm || 'ترم جاری';
    }, [currentTerm]);

    const value = {
        termList,
        currentTerm,
        pastTerms,
        currentTermCode,
        currentTermTitle,
        loading,
        error,
        getTermByCode,
        getTermTitle,
        refreshTerms: fetchTerms  // ← تابع برای بروزرسانی مجدد
    };

    return (
        <TermContext.Provider value={value}>
            {children}
        </TermContext.Provider>
    );
};

export const useTerm = () => {
    const context = useContext(TermContext);
    if (!context) {
        throw new Error('useTerm must be used within a TermProvider');
    }
    return context;
};