import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../apiConfig';

const NAV = {
    buyer: [
        { to: '/dashboard', label: 'My Profile' },
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
        { to: '/dashboard', label: 'Overview' },
        { to: '/dashboard/clients', label: 'My Clients' },
    ],
    admin: [
        { to: '/dashboard', label: 'Dashboard Overview' },
        { to: '/dashboard/users', label: 'Manage Users' },
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
    const links = NAV[role] || [{ to: '/dashboard', label: 'Dashboard' }];
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);

    const token = localStorage.getItem('access_token');

    const fetchNotifications = async () => {
        if (role !== 'seller') return;
        if (!token) return;
        try {
            const res = await fetch(`${API}/notifications/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
            setNotifications([]);
        }
    };

    useEffect(() => {
        if (role !== 'seller') return;
        fetchNotifications();
        const t = setInterval(fetchNotifications, 30000);
        return () => clearInterval(t);
    }, [role]);

    const markAllRead = async () => {
        if (role !== 'seller') return;
        if (!token) return;
        try {
            await fetch(`${API}/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch {
            // Ignore errors for mark all read.
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside style={styles.sidebar}>
            <div style={styles.brand}>Smart Land Management</div>
            <div style={styles.roleTag}>{(role || 'User').toUpperCase()}</div>
            {role === 'seller' && (
                <div style={styles.notifWrap}>
                    <button style={styles.notifBtn} onClick={() => setShowNotif(s => !s)}>
                        Notification Center {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
                    </button>
                    {showNotif && (
                        <div style={styles.notifPanel}>
                            <div style={styles.notifHead}>
                                <strong>Notifications</strong>
                                <button style={styles.markBtn} onClick={markAllRead}>Mark all read</button>
                            </div>
                            {notifications.length === 0 ? (
                                <div style={styles.emptyText}>No notifications yet.</div>
                            ) : (
                                <div style={styles.notifList}>
                                    {notifications.slice(0, 8).map(n => (
                                        <div key={n.id || n._id} style={{ ...styles.notifItem, opacity: n.is_read ? 0.7 : 1 }}>
                                            <div style={styles.dot}></div>
                                            <div>
                                                <div style={styles.ntTitle}>{n.title}</div>
                                                <div style={styles.ntMsg}>{n.message}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
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
    sidebar: { width: '240px', backgroundColor: 'var(--sage-bg)', padding: '28px 16px', minHeight: '100vh', borderRight: '1px solid rgba(85, 107, 47, 0.1)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' },
    brand: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--sage-primary)', marginBottom: '6px', paddingLeft: '4px', letterSpacing: '-0.02em' },
    roleTag: { fontSize: '0.65rem', fontWeight: '700', letterSpacing: '0.1em', color: 'var(--sage-text-light)', marginBottom: '28px', paddingLeft: '4px', textTransform: 'uppercase' },
    notifWrap: { position: 'relative', marginBottom: '14px' },
    notifBtn: {
        width: '100%',
        border: '1px solid rgba(85, 107, 47, 0.2)',
        background: '#fff',
        color: '#2f3e1a',
        borderRadius: '9px',
        padding: '10px 12px',
        fontWeight: '700',
        fontSize: '0.82rem',
        textAlign: 'left',
        cursor: 'pointer'
    },
    badge: {
        marginLeft: '8px',
        background: '#d23f2e',
        color: '#fff',
        borderRadius: '999px',
        padding: '1px 7px',
        fontSize: '0.7rem'
    },
    notifPanel: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: '44px',
        background: '#fff',
        border: '1px solid rgba(85, 107, 47, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 18px 30px rgba(0,0,0,0.12)',
        zIndex: 50,
        maxHeight: '320px',
        overflow: 'hidden'
    },
    notifHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 10px 8px', borderBottom: '1px solid #eef2e7', fontSize: '0.8rem' },
    markBtn: { border: 'none', background: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem', color: '#4d5f2e' },
    notifList: { maxHeight: '260px', overflowY: 'auto', padding: '8px' },
    notifItem: { display: 'flex', gap: '8px', padding: '8px', borderRadius: '8px', border: '1px solid #f0f1ed', marginBottom: '8px' },
    dot: { width: '8px', height: '8px', borderRadius: '50%', background: '#de5a4b', marginTop: '6px' },
    ntTitle: { fontSize: '0.78rem', fontWeight: '700', color: '#2f3e1a' },
    ntMsg: { fontSize: '0.74rem', color: '#5f6a53', lineHeight: 1.35 },
    emptyText: { padding: '14px 10px', fontSize: '0.78rem', color: '#758169' },
    list: { listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 },
    listItem: {},
    link: { textDecoration: 'none', display: 'block', padding: '10px 14px', borderRadius: '8px', border: '1px solid transparent', fontSize: '0.875rem', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.18s' },
    bottomSection: { borderTop: '1px solid rgba(85, 107, 47, 0.1)', paddingTop: '20px', marginTop: '16px' },
    logoutBtn: { width: '100%', padding: '11px 14px', background: 'var(--sage-card)', color: '#e74c3c', border: '1px solid rgba(85, 107, 47, 0.1)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'left', transition: 'background 0.15s' },
};

export default Sidebar;

