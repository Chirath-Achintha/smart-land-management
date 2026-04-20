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
        { to: '/dashboard/services', label: 'Service Requests' },
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
        { to: '/dashboard', label: 'Dashboard Overview' },
        { to: '/dashboard/admin/complaints', label: 'Complaints & Inquiry Management' },
        { to: '/dashboard/users', label: 'Manage Users' },
        { to: '/dashboard/admin/agents', label: 'Agent Assignment' },
        { to: '/dashboard/admin/agent-visits', label: 'Agent Site Requests' },
        { to: '/dashboard/admin/constructor-teams', label: 'Constructor Teams' },
        { to: '/dashboard/admin/services', label: 'Constructor Service Requests' },
    ],
    constructor_manager: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/calendar', label: 'Constructor Schedule' },
        { to: '/dashboard/projects', label: 'Project Workshop' },
        { to: '/dashboard/service-requests', label: 'Incoming Enquiries' },
    ],
};

const Sidebar = ({ role }) => {
    const API = API_BASE_URL;
    const location = useLocation();
    const navigate = useNavigate();
    const [hoveredPath, setHoveredPath] = useState('');
    const { logout } = useAuth();
    const links = NAV[role?.toLowerCase()] || [{ to: '/dashboard', label: 'Dashboard' }];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside style={styles.sidebar}>
            <div style={styles.brand}>Smart Land Management</div>
            <div style={styles.roleTag}>{(role || 'User').toUpperCase()}</div>
            <ul style={styles.list}>
                {links.map((link, idx) => {
                    const isActive = location.pathname === link.to;
                    const isHovered = hoveredPath === link.to;
                    return (
                        <li key={idx} style={styles.listItem}>
                            <Link
                                to={link.to}
                                onMouseEnter={() => setHoveredPath(link.to)}
                                onMouseLeave={() => setHoveredPath('')}
                                style={{
                                    ...styles.link,
                                    background: isActive ? 'var(--color-primary)' : isHovered ? 'rgba(255,255,255,0.12)' : 'transparent',
                                    color: '#fff',
                                    borderColor: isActive ? 'var(--color-primary)' : isHovered ? 'rgba(255,255,255,0.24)' : 'transparent',
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
    sidebar: { width: '252px', backgroundColor: 'var(--color-dark)', padding: '24px 16px', minHeight: '100vh', borderRight: '1px solid rgba(255, 255, 255, 0.12)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    brand: { fontSize: '1.1rem', fontWeight: '800', color: '#fff', marginBottom: '6px', paddingLeft: '4px', letterSpacing: '-0.02em' },
    roleTag: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', marginBottom: '28px', paddingLeft: '4px', textTransform: 'uppercase' },
    list: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    listItem: {},
    link: { textDecoration: 'none', display: 'block', padding: '10px 14px', borderRadius: '8px', border: '1px solid transparent', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.3s ease' },
    bottomSection: { borderTop: '1px solid rgba(255, 255, 255, 0.18)', paddingTop: '20px', marginTop: '16px' },
    logoutBtn: { width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', transition: 'all 0.3s ease' },
};

export default Sidebar;

