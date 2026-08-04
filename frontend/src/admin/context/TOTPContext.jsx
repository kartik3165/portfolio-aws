import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import {
    loginUser as loginUserAPI,
    verifyTOTP as verifyTOTPAPI,
    logoutUser as logoutUserAPI,
    getCurrentAdmin,
} from '../../api/auth';

const TOTPContext = createContext();

export const useTOTP = () => {
    return useContext(TOTPContext);
};

export const TOTPProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState(null);
    const [preauthToken, setPreauthToken] = useState(null);
    const [booting, setBooting] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Restore session from HttpOnly cookies on app load
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const result = await getCurrentAdmin();
                if (!cancelled && result.email) {
                    setIsAuthenticated(true);
                    setUserEmail(result.email);
                }
            } catch (e) {
                // No valid session - stay logged out
            } finally {
                if (!cancelled) setBooting(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const result = await loginUserAPI(email, password);
            setPreauthToken(result.preauth_token);
            return result;
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const verifyTOTP = async (totpCode) => {
        setLoading(true);
        setError(null);
        try {
            const result = await verifyTOTPAPI(preauthToken, totpCode);
            setIsAuthenticated(true);
            setUserEmail(result.email);
            setPreauthToken(null);
            return true;
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid TOTP code');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const logout = useCallback(async () => {
        setLoading(true);
        try {
            await logoutUserAPI();
        } catch (err) {
            console.error("Logout failed", err);
        } finally {
            setIsAuthenticated(false);
            setUserEmail(null);
            setPreauthToken(null);
            setLoading(false);
        }
    }, []);

    const value = {
        isAuthenticated,
        userEmail,
        preauthToken,
        booting,
        login,
        verifyTOTP,
        logout,
        loading,
        error,
    };

    return (
        <TOTPContext.Provider value={value}>
            {children}
        </TOTPContext.Provider>
    );
};

export default TOTPContext;
