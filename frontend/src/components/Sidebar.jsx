import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../apiConfig';

const NAV = {
    buyer: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/bids', label: 'My Biddings' },
        { to: '/dashboard/visits', label: ' My Site Visits' },
        { to: '/dashboard/properties', label: 'Saved Properties' },
    ],
    seller: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/seller/listings', label: 'My Listings' },
        { to: '/dashboard/seller/bids', label: 'Bids Overview' },
        { to: '/dashboard/seller/bidding', label: 'Bidding Setup' },
        { to: '/dashboard/seller/availability', label: 'Visit Availability' },
        { to: '/dashboard/seller/visits', label: 'Visit Requests' },
    ],
    agent: [
        { to: '/dashboard', label: 'Requests' },
        { to: '/dashboard/clients', label: 'My Clients' },
    ],
    admin: [
        { to: '/dashboard/admin/complaints', label: 'Complaints & Inquiry Management' },
        { to: '/dashboard', label: 'Dashboard Overview' },
        { to: '/dashboard/users', label: 'Manage Users' },
        { to: '/dashboard/admin/agents', label: 'Agent Assignment' },
        { to: '/dashboard/admin/agent-visits', label: 'Agent Site Requests' },
        { to: '/dashboard/admin/services', label: 'Constructor Service Requests' },
    ],
    constructor_manager: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/projects', label: 'My Projects' },
        { to: '/dashboard/service-requests', label: 'Service Requests' },
    ],
};

const Sidebar = ({ role }) => {
    const API = API_BASE_URL;
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const links = NAV[role?.toLowerCase()] || [{ to: '/dashboard', label: 'Dashboard' }];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside style={styles.sidebar}>
            <div style={styles.homeContainer}>
                <Link to="/" style={styles.backLink}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Back to Home
                </Link>
            </div>
            <div style={styles.brand}>Smart Land Management</div>
            <div style={styles.roleTag}>{(role || 'User').toUpperCase()}</div>
            <ul style={styles.list}>
                {links.map((link, idx) => {
                    const isActive = location.pathname === link.to;
                    return (
                        <li key={idx} style={styles.listItem}>
                            <Link
                                to={link.to}
                                style={{
                                    ...styles.link,
                                    background: isActive ? '#1A1A1A' : 'transparent',
                                    color: isActive ? '#fff' : '#444',
                                    borderColor: isActive ? '#1A1A1A' : 'transparent',
                                    fontWeight: isActive ? '700' : '500',
                                }}
                            >
                                {link.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
            <div style={styles.bottomSection}>
                <button style={styles.logoutBtn} onClick={handleLogout}>
                    Log Out
                </button>
            </div>
        </aside>
    );
};

const styles = {
    sidebar: { width: '240px', backgroundColor: 'var(--sage-bg)', padding: '24px 16px', minHeight: '100vh', borderRight: '1px solid rgba(85, 107, 47, 0.1)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    homeContainer: { marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px dashed rgba(85, 107, 47, 0.1)' },
    backLink: { display: 'flex', alignItems: 'center', color: '#6f7e62', textDecoration: 'none', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'color 0.2s', paddingLeft: '4px' },
    brand: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--sage-primary)', marginBottom: '6px', paddingLeft: '4px', letterSpacing: '-0.02em' },
    roleTag: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--sage-text-light)', marginBottom: '28px', paddingLeft: '4px', textTransform: 'uppercase' },
    list: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    listItem: {},
    link: { textDecoration: 'none', display: 'block', padding: '10px 14px', borderRadius: '8px', border: '1px solid transparent', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' },
    bottomSection: { borderTop: '1px solid rgba(85, 107, 47, 0.1)', paddingTop: '20px', marginTop: '16px' },
    logoutBtn: { width: '100%', padding: '11px 14px', background: 'var(--sage-card)', color: '#e74c3c', border: '1px solid rgba(85, 107, 47, 0.1)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', transition: 'background 0.15s' },
};

export default Sidebar;

