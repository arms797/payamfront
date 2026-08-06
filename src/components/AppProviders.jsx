// در src/components/AppProviders.jsx
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';
import { MarkazProvider } from '../context/MarkazContext';
import { TermProvider } from '../context/TermContext';

const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <MarkazProvider>
                <TermProvider>
                        <MenuProvider>
                            {children}
                        </MenuProvider>
                </TermProvider>
            </MarkazProvider>
        </AuthProvider>
    );
};

export default AppProviders;