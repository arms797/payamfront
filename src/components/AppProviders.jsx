// در src/components/AppProviders.jsx
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';
import { MarkazProvider } from '../context/MarkazContext';  // ← اضافه کن

const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <MarkazProvider>  {/* ← اینجا اضافه کن */}
                <MenuProvider>
                    {children}
                </MenuProvider>
            </MarkazProvider>
        </AuthProvider>
    );
};

export default AppProviders;