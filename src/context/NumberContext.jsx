// src/context/NumberContext.jsx
import React, { createContext, useContext } from 'react';
import { toPersianNumbers, toPersianNumberWithComma } from '../utils/numberUtils';

const NumberContext = createContext();

export const NumberProvider = ({ children }) => {
    /**
     * تبدیل عدد انگلیسی به فارسی
     */
    const toPersian = (num) => {
        if (num === null || num === undefined || num === '') return '';
        return toPersianNumbers(num);
    };

    /**
     * تبدیل عدد به فارسی با جداکننده هزارگان
     */
    const toPersianWithComma = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '';
        return toPersianNumberWithComma(num);
    };

    /**
     * تبدیل همه اعداد یک شیء یا آرایه به فارسی (برای داده‌های API)
     */
    const convertNumbersInObject = (data) => {
        if (!data) return data;

        if (Array.isArray(data)) {
            return data.map(item => convertNumbersInObject(item));
        }

        if (typeof data === 'object') {
            const result = {};
            for (const key in data) {
                const value = data[key];
                if (typeof value === 'number') {
                    result[key] = toPersian(value);
                } else if (typeof value === 'string' && /^\d+$/.test(value)) {
                    result[key] = toPersian(value);
                } else if (typeof value === 'object' && value !== null) {
                    result[key] = convertNumbersInObject(value);
                } else {
                    result[key] = value;
                }
            }
            return result;
        }

        return data;
    };

    const value = {
        toPersian,
        toPersianWithComma,
        convertNumbersInObject
    };

    return (
        <NumberContext.Provider value={value}>
            {children}
        </NumberContext.Provider>
    );
};

export const useNumber = () => {
    const context = useContext(NumberContext);
    if (!context) {
        throw new Error('useNumber must be used within a NumberProvider');
    }
    return context;
};