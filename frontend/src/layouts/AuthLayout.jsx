import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
    return (
        <div style={styles.container}>
            <div style={styles.content}>
                <div style={styles.card}>
                    <Outlet />
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
        backgroundColor: '#FAF6F1',
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
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '450px'
    }
};

export default AuthLayout;
