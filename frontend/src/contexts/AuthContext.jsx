import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { api, resetCsrfToken, setOnUnauthorized } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessionExpired, setSessionExpired] = useState(false);
    const userRef = useRef(null);

    // Keep ref in sync so the callback always sees current value
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Register 401 handler
    useEffect(() => {
        setOnUnauthorized(() => {
            // Only trigger if user was authenticated (not during initial /auth/me check)
            if (userRef.current) {
                setSessionExpired(true);
            }
        });
        return () => setOnUnauthorized(null);
    }, []);

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
        setSessionExpired(false);
        resetCsrfToken();
    }, []);

    const clearSessionExpired = useCallback(() => {
        setSessionExpired(false);
        setUser(null);
        resetCsrfToken();
    }, []);

    const isAuthenticated = user !== null;

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, loading, sessionExpired, clearSessionExpired }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
