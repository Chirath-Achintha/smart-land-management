import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import GlobalFooter from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
    const { user } = useAuth();
    const location = useLocation();

    const isDashboard = location.pathname.startsWith('/dashboard');
    const hideHeaderFooter = isDashboard;

    return (
        <div style={styles.container}>
            {!hideHeaderFooter && <Header />}
            <div style={styles.mainContent}>
                <div key={location.pathname} className="page-fade">
                    <Outlet />
                </div>
            </div>
            {!hideHeaderFooter && <GlobalFooter />}
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', margin: 0, padding: 0, background: 'var(--color-bg)' },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column' }
};

export default MainLayout;
