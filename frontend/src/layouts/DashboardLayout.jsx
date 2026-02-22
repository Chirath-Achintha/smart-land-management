import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ role }) => {
    return (
        <div style={styles.layout}>
            <Sidebar role={role} />
            <main style={styles.main}>
                <Outlet />
            </main>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', width: '100%' },
    main: { flex: 1, backgroundColor: '#FAF6F1', overflowY: 'auto' },
};

export default DashboardLayout;
