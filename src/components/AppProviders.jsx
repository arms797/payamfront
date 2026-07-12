import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';
import { MarkazProvider } from '../context/MarkazContext';
import { useAuth } from '../context/AuthContext';

// ============================================================
// کامپوننت Providerهای شرطی (فقط در صورت لاگین)
// ============================================================
const ConditionalProviders = ({ children }) => {
    const { isAuthenticated } = useAuth();

    // اگر لاگین نکرده، فقط children را برگردان
    if (!isAuthenticated) {
        return <>{children}</>;
    }

    // اگر لاگین کرده، Providerهای مورد نیاز را اضافه کن
    return (
        <MenuProvider>
            <MarkazProvider>
                {children}
            </MarkazProvider>
        </MenuProvider>
    );
};

// ============================================================
// Provider اصلی برنامه
// ============================================================
const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <ConditionalProviders>
                {children}
            </ConditionalProviders>
        </AuthProvider>
    );
};

export default AppProviders;