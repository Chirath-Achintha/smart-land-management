import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Always start logged out; require explicit login on each app start.
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Clear any persisted session from previous runs.
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
    }, []);

    const login = (userOrRole) => {
        const userData = typeof userOrRole === 'string'
            ? { role: userOrRole, loggedIn: true }
            : { ...(userOrRole || {}), loggedIn: true };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
