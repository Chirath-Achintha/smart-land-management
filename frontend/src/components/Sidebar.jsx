import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = {
    buyer: [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/dashboard/properties', label: 'Saved Properties' },
    ],
    seller: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/seller/listings', label: 'My Listings' },
        { to: '/dashboard/seller/bids', label: 'Bids Overview' },
        { to: '/dashboard/seller/bidding', label: 'Bidding Setup' },
        { to: '/dashboard/seller/availability', label: 'Site Visits' },
    ],
    agent: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/clients', label: 'My Clients' },
        { to: '/dashboard/service-requests', label: 'Service Requests' },
    ],
    admin: [
        { to: '/dashboard', label: 'Dashboard Overview' },
        { to: '/dashboard/admin/agents', label: 'Agent Assignment' },
        { to: '/dashboard/admin/services', label: 'Service Management' },
        { to: '/dashboard/admin/complaints', label: 'Complaints & Inquiries' },
        { to: '/dashboard/users', label: 'Manage Users' },
    ],
    constructor_manager: [
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/projects', label: 'My Projects' },
        { to: '/dashboard/service-requests', label: 'Service Requests' },
    ],
};

const Sidebar = ({ role }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();
    const links = NAV[role] || [{ to: '/dashboard', label: 'Dashboard' }];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside style={styles.sidebar}>
            <div style={styles.brand}>Smart Land</div>
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
    sidebar: { width: '240px', backgroundColor: '#FAF6F1', padding: '28px 16px', minHeight: '100vh', borderRight: '1px solid #ede8e1', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    brand: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', paddingLeft: '4px', letterSpacing: '-0.02em' },
    roleTag: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: '#bbb', marginBottom: '28px', paddingLeft: '4px', textTransform: 'uppercase' },
    list: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    listItem: {},
    link: { textDecoration: 'none', display: 'block', padding: '10px 14px', borderRadius: '8px', border: '1px solid transparent', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' },
    bottomSection: { borderTop: '1px solid #ede8e1', paddingTop: '20px', marginTop: '16px' },
    logoutBtn: { width: '100%', padding: '11px 14px', background: '#fff', color: '#e74c3c', border: '1px solid #e5ddd8', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', transition: 'background 0.15s' },
};

export default Sidebar;

