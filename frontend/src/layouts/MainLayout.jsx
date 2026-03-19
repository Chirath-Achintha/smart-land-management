import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import GlobalFooter from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';

const MainLayout = () => {
    const { user } = useAuth();
    const location = useLocation();

    // Hide header/footer if role is a professional/admin role and we are in a dashboard route
    const isDashboard = location.pathname.startsWith('/dashboard');
    const professionalRoles = ['admin', 'seller', 'agent', 'constructor_manager'];
    const hideHeaderFooter = professionalRoles.includes(user?.role) && isDashboard;

    return (
        <div style={styles.container}>
            {!hideHeaderFooter && <Header />}
            <div style={styles.mainContent}>
                <Outlet />
            </div>
            {!hideHeaderFooter && <GlobalFooter />}
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', margin: 0, padding: 0 },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column' }
};

export default MainLayout;
