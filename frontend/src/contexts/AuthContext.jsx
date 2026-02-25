import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { api, resetCsrfToken } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // On mount: check server session via /auth/me
    useEffect(() => {
        let cancelled = false;

        async function checkSession() {
            const { data, status } = await api.get('/auth/me');

            if (!cancelled) {
                if (status === 200 && data?.status === 'OK' && data?.user) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        }

        checkSession();

        return () => { cancelled = true; };
    }, []);

    const login = useCallback((userData) => {
        setUser(userData);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        resetCsrfToken();
    }, []);

    const isAuthenticated = user !== null;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
