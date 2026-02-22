import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import GlobalFooter from '../components/common/Footer';

const MainLayout = () => {
    return (
        <div style={styles.container}>
            <Header />
            <div style={styles.mainContent}>
                <Outlet />
            </div>
            <GlobalFooter />
        </div>
    );
};

const styles = {
    container: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', margin: 0, padding: 0 },
    mainContent: { flex: 1, display: 'flex', flexDirection: 'column' }
};

export default MainLayout;
