import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';

const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <MenuProvider>
                {children}
            </MenuProvider>
        </AuthProvider>
    );
};

export default AppProviders;