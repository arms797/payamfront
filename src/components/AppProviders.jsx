import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';
import { MarkazProvider } from '../context/MarkazContext';

// ============================================================
// Provider اصلی برنامه
// ============================================================
const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <MenuProvider>
                <MarkazProvider>
                    {children}
                </MarkazProvider>
            </MenuProvider>
        </AuthProvider>
    );
};

export default AppProviders;