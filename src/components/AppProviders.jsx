// در src/components/AppProviders.jsx
import React from 'react';
import { AuthProvider } from '../context/AuthContext';
import { MenuProvider } from '../context/MenuContext';
import { MarkazProvider } from '../context/MarkazContext';
import { TermProvider } from '../context/TermContext';
import { GrooheAmoozeshiProvider } from '../context/GrooheAmoozeshiContext';
import { ReshtehProvider } from '../context/ReshtehContext';
//import { FaaliatProvider } from '../context/FaaliatContext';
import { LookupProvider } from '../context/LookupContext';

const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <MarkazProvider>
                <TermProvider>
                    <GrooheAmoozeshiProvider>
                        <ReshtehProvider>
                            <LookupProvider>
                                <MenuProvider>
                                    {children}
                                </MenuProvider>
                            </LookupProvider>
                        </ReshtehProvider>
                    </GrooheAmoozeshiProvider>
                </TermProvider>
            </MarkazProvider>
        </AuthProvider>
    );
};

export default AppProviders;