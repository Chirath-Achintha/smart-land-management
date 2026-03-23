import React from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    const location = useLocation();

    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.card}>
                    <div key={location.pathname} className="page-fade">
                        <Outlet />
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: 'var(--color-bg)',
        width: '100%',
        margin: 0,
        fontFamily: "'DM Sans', sans-serif",
    },
    content: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px'
    },
    card: {
        backgroundColor: 'var(--color-surface)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-soft)',
        width: '100%',
        maxWidth: '450px'
    }
};

export default AuthLayout;
