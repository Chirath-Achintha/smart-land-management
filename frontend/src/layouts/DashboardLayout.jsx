import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const DashboardLayout = ({ role }) => {
    return (
        <div style={styles.layout}>
            <Navbar role={role} />
            <div style={styles.contentWrapper}>
                <Sidebar role={role} />
                <main style={styles.main}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const styles = {
    layout: { display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%', margin: 0 },
    contentWrapper: { display: 'flex', flex: 1 },
    main: { flex: 1, padding: '30px', backgroundColor: '#f9f9f9', overflowY: 'auto' }
};

export default DashboardLayout;
