import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

const MarkazContext = createContext();

export const MarkazProvider = ({ children }) => {
    const [markazList, setMarkazList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMarkaz = async () => {
            try {
                const response = await api.get('/Markaz/list');
                if (response.data?.data) {
                    setMarkazList(response.data.data);
                }
            } catch (error) {
                console.error('خطا در دریافت مراکز:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMarkaz();
    }, []);

    return (
        <MarkazContext.Provider value={{ markazList, loading }}>
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