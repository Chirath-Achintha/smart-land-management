import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import GlobalFooter from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Hide header/footer if role is admin and we are in a dashboard route
    const isAdminDashboard = user?.role === 'admin' && location.pathname.startsWith('/dashboard');

    return (
        <div style={styles.container}>
            {!isAdminDashboard && <Header />}
            <div style={styles.mainContent}>
                <Outlet />
            </div>
            {!isAdminDashboard && <GlobalFooter />}
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', margin: 0, padding: 0 },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column' }
};

export default MainLayout;
