import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../apiConfig';
import { useAuth } from '../context/AuthContext';
import { BellIcon } from '../pages/landing/LandingIcons';

const DashboardLayout = ({ role }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();
    const [profileOpen, setProfileOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [showWelcome, setShowWelcome] = useState(false);
    const [profile, setProfile] = useState(null);
    const [draft, setDraft] = useState({ full_name: '', email: '', nic_number: '', address: '', phone: '', role: '' });
    
    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotif, setShowNotif] = useState(false);

    const fetchNotifications = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            const res = await fetch(`${API_BASE_URL}/notifications/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setNotifications(Array.isArray(data) ? data : []);
        } catch {
            setNotifications([]);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const t = setInterval(fetchNotifications, 30000);
        return () => clearInterval(t);
    }, []);

    const markAllRead = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            await fetch(`${API_BASE_URL}/notifications/read-all`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchNotifications();
        } catch {}
    };

    const handleNotificationClick = async (n) => {
        // Optimistically mark as read in local state
        if (!n.is_read) {
            setNotifications(prev => prev.map(item => 
                (item.id || item._id) === (n.id || n._id) ? { ...item, is_read: true } : item
            ));
            
            // Update on server in background
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    await fetch(`${API_BASE_URL}/notifications/${n.id || n._id}/read`, {
                        method: 'PUT',
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch {}
            }
        }
        
        setShowNotif(false);
        if (n.link) {
            navigate(n.link);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const loadProfile = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load profile');

            setProfile(data);
            setDraft({
                full_name: data.full_name || '',
                email: data.email || '',
                nic_number: data.nic_number || '',
                address: data.address || '',
                phone: data.phone || '',
                role: data.role || ''
            });
        } catch (e) {
            setError(e.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, []);

    useEffect(() => {
        const welcomeFlag = sessionStorage.getItem('showWelcomeAfterLogin');
        if (welcomeFlag !== '1') return;

        setShowWelcome(true);
        sessionStorage.removeItem('showWelcomeAfterLogin');

        const timeoutId = setTimeout(() => {
            setShowWelcome(false);
        }, 4000);

        return () => clearTimeout(timeoutId);
    }, []);

    const openProfile = async () => {
        setProfileOpen(true);
        await loadProfile();
    };

    const handleSave = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        setSaving(true);
        setError('');
        try {
            const payload = {
                full_name: draft.full_name,
                email: draft.email,
                nic_number: draft.nic_number,
                address: draft.address,
                phone: draft.phone || null
            };

            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to save profile');

            setProfile(data);
            setDraft({
                full_name: data.full_name || '',
                email: data.email || '',
                nic_number: data.nic_number || '',
                address: data.address || '',
                phone: data.phone || '',
                role: data.role || ''
            });

            const storedUserRaw = localStorage.getItem('user');
            if (storedUserRaw) {
                const storedUser = JSON.parse(storedUserRaw);
                localStorage.setItem('user', JSON.stringify({ ...storedUser, ...data }));
            }

            setIsEditing(false);
        } catch (e) {
            setError(e.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm('Are you sure you want to permanently delete your account?');
        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;

        setDeleting(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE_URL}/auth/me`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || 'Failed to delete account');
            }

            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            logout();
            navigate('/');
        } catch (e) {
            setError(e.message || 'Failed to delete account');
        } finally {
            setDeleting(false);
        }
    };

    const getStoredUserName = () => {
        try {
            const storedUserRaw = localStorage.getItem('user');
            if (!storedUserRaw) return '';
            const storedUser = JSON.parse(storedUserRaw);
            return (storedUser?.full_name || storedUser?.name || '').trim();
        } catch {
            return '';
        }
    };

    const displayName = (profile?.full_name || draft.full_name || getStoredUserName() || 'User').trim();
    const roleWelcomeText = {
        seller: 'Welcome ',
        buyer: 'Welcome ',
        agent: 'Welcome ',
        admin: 'Welcome ',
        constructor_manager: 'Welcome'
    };
    const welcomeTitle = roleWelcomeText[role?.toLowerCase()] || 'Welcome';
    const initials = (profile?.full_name || role || 'U').trim().charAt(0).toUpperCase();

    return (
        <div style={styles.layout}>
            <Sidebar role={role} />
            <main style={styles.main}>
                <div style={styles.topbar}>
                    <div style={styles.topbarTitle}>Dashboard</div>
                    <div style={styles.topbarActions}>
                        {/* Notification Center */}
                        <div style={styles.notifWrapper}>
                            <button type="button" style={styles.bellBtn} onClick={() => setShowNotif(!showNotif)} title="Notifications">
                                <BellIcon />
                                {unreadCount > 0 && <span style={styles.bellBadge}></span>}
                            </button>
                            {showNotif && (
                                <div style={styles.notifDropdown}>
                                     <div style={styles.notifHead}>
                                        <strong>Notifications</strong>
                                        {unreadCount > 0 && <button style={styles.notifMarkBtn} onClick={markAllRead}>Mark all read</button>}
                                    </div>
                                    <div style={styles.notifBody}>
                                        {notifications.length === 0 ? (
                                            <div style={styles.emptyText}>No notifications yet.</div>
                                        ) : (
                                            notifications.slice(0, 8).map(n => {
                                                const isUrgent = n.title?.toLowerCase().includes('cancelled') || 
                                                               n.message?.toLowerCase().includes('cancelled') ||
                                                               n.title?.toLowerCase().includes('declined') ||
                                                               n.message?.toLowerCase().includes('declined');
                                                return (
                                                    <div 
                                                        key={n.id || n._id} 
                                                        onClick={() => handleNotificationClick(n)}
                                                        style={{ 
                                                            ...styles.notifItem, 
                                                            opacity: n.is_read ? 0.7 : 1,
                                                            background: isUrgent ? '#FFF5F5' : '#fff',
                                                            border: isUrgent ? '1px solid #FEB2B2' : '1px solid rgba(85, 107, 47, 0.05)'
                                                        }}
                                                    >
                                                        <div style={{ ...styles.notifDot, opacity: n.is_read ? 0 : 1, background: isUrgent ? '#E53E3E' : '#e74c3c' }}></div>
                                                        <div>
                                                            <div style={{ ...styles.notifTitle, color: isUrgent ? '#C53030' : '#1d2a12' }}>{n.title}</div>
                                                            <div style={styles.notifMsg}>{n.message}</div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Home Button */}
                        {!['constructor_manager', 'agent'].includes(role?.toLowerCase()) && (
                            <button onClick={() => navigate('/')} style={styles.navbarBtn}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.btnIcon}>
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                                    <polyline points="9 22 9 12 15 12 15 22"/>
                                </svg>
                                <span>Home</span>
                            </button>
                        )}

                        {/* Profile Button */}
                        <button onClick={openProfile} style={styles.navbarBtn}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={styles.btnIcon}>
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <span>Profile</span>
                        </button>

                        <div style={styles.divider}></div>
                        
                        <div style={styles.welcomeWrap}>
                            <span style={styles.userName}>{displayName}</span>
                        </div>
                    </div>
                </div>
                <div key={location.pathname} className="page-fade">
                    <Outlet />
                </div>
            </main>

            {profileOpen && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHead}>
                            <h2 style={styles.modalTitle}>My Profile</h2>
                            <div style={styles.modalActions}>
                                {!isEditing ? (
                                    <button style={styles.editBtn} onClick={() => setIsEditing(true)}>Edit Profile</button>
                                ) : (
                                    <>
                                        <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                                        <button style={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                                    </>
                                )}
                                <button style={styles.closeBtn} onClick={() => { setProfileOpen(false); setIsEditing(false); setError(''); }}>Close</button>
                            </div>
                        </div>

                        {error && <div style={styles.errorBox}>{error}</div>}
                        {loading ? (
                            <div style={styles.loadingText}>
                                <span className="ui-spinner"></span>
                                <span>Loading profile...</span>
                            </div>
                        ) : (
                            <div style={styles.profileGrid}>
                                <div style={styles.fieldItem}>
                                    <label style={styles.label}>Name</label>
                                    {isEditing ? (
                                        <input style={styles.input} value={draft.full_name} onChange={(e) => setDraft(d => ({ ...d, full_name: e.target.value }))} />
                                    ) : (
                                        <div style={styles.value}>{draft.full_name}</div>
                                    )}
                                </div>
                                <div style={styles.fieldItem}>
                                    <label style={styles.label}>Email</label>
                                    {isEditing ? (
                                        <input style={styles.input} value={draft.email} onChange={(e) => setDraft(d => ({ ...d, email: e.target.value }))} />
                                    ) : (
                                        <div style={styles.value}>{draft.email}</div>
                                    )}
                                </div>
                                <div style={styles.fieldItem}>
                                    <label style={styles.label}>NIC</label>
                                    {isEditing ? (
                                        <input style={styles.input} value={draft.nic_number} onChange={(e) => setDraft(d => ({ ...d, nic_number: e.target.value }))} />
                                    ) : (
                                        <div style={styles.value}>{draft.nic_number}</div>
                                    )}
                                </div>
                                <div style={styles.fieldItem}>
                                    <label style={styles.label}>Address</label>
                                    {isEditing ? (
                                        <input style={styles.input} value={draft.address} onChange={(e) => setDraft(d => ({ ...d, address: e.target.value }))} />
                                    ) : (
                                        <div style={styles.value}>{draft.address}</div>
                                    )}
                                </div>
                                <div style={styles.fieldItem}>
                                    <label style={styles.label}>Phone</label>
                                    {isEditing ? (
                                        <input style={styles.input} value={draft.phone} onChange={(e) => setDraft(d => ({ ...d, phone: e.target.value }))} />
                                    ) : (
                                        <div style={styles.value}>{draft.phone || '-'}</div>
                                    )}
                                </div>
                                <div style={styles.fieldItem}>
                                    <label style={styles.label}>Role</label>
                                    <div style={styles.value}>{(draft.role || role || '').replace('_', ' ')}</div>
                                </div>
                            </div>
                        )}

                        <div style={styles.deleteSection}>
                            <div style={styles.deleteRow}>
                                <button style={styles.deleteBtn} onClick={handleDeleteAccount} disabled={deleting}>
                                    {deleting ? 'Deleting...' : 'Delete Account'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    layout: { display: 'flex', minHeight: '100vh', width: '100%' },
    main: { flex: 1, backgroundColor: 'var(--color-bg)', overflowY: 'auto' },
    topbar: { position: 'sticky', top: 0, zIndex: 20, height: '68px', background: 'rgba(255, 255, 255, 0.94)', borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backdropFilter: 'blur(8px)' },
    topbarTitle: { fontSize: '1rem', fontWeight: '800', color: 'var(--color-dark)' },
    topbarActions: { display: 'flex', alignItems: 'center', gap: '12px' },
    navbarBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', backgroundColor: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-dark)', transition: 'all 0.3s ease', fontFamily: 'inherit' },
    navbarLogoutBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 20px', backgroundColor: '#FF3B30', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', color: '#fff', transition: 'all 0.2s ease', fontFamily: 'inherit' },
    btnIcon: { flexShrink: 0 },
    divider: { width: '1px', height: '24px', backgroundColor: 'var(--color-border)', margin: '0 4px' },
    
    // Notifications styles
    notifWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    bellBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', backgroundColor: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative', outline: 'none' },
    bellBadge: { position: 'absolute', top: '10px', right: '10px', width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%', border: '2px solid #fff' },
    notifDropdown: { position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--color-border)', overflow: 'hidden', zIndex: 100 },
    notifHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-dark)', fontSize: '0.9rem' },
    notifMarkBtn: { background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' },
    notifBody: { maxHeight: '320px', overflowY: 'auto', padding: '10px' },
    notifItem: { display: 'flex', gap: '12px', padding: '12px', borderRadius: '10px', marginBottom: '8px', background: '#fff', border: '1px solid var(--color-border)', transition: 'all 0.2s', cursor: 'pointer' },
    notifDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#e74c3c', marginTop: '6px', flexShrink: 0, transition: 'opacity 0.2s' },
    notifTitle: { fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '4px' },
    notifMsg: { fontSize: '0.8rem', color: 'var(--color-text-soft)', lineHeight: '1.4' },
    emptyText: { padding: '24px', textAlign: 'center', color: '#999', fontSize: '0.85rem' },
 
    welcomeWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.05 },
    userName: { fontSize: '0.9rem', color: 'var(--color-dark)', fontWeight: '800' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { width: 'min(760px, 94vw)', background: '#fff', borderRadius: '20px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-elevated)', padding: '24px' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' },
    modalTitle: { margin: 0, fontSize: '1.25rem', color: 'var(--color-dark)' },
    modalActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    editBtn: { padding: '9px 14px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: 'var(--color-dark)', color: '#fff' },
    saveBtn: { padding: '9px 14px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: 'var(--color-primary)', color: '#fff' },
    cancelBtn: { padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#fff', color: 'var(--color-text-soft)' },
    closeBtn: { padding: '9px 14px', border: '1px solid var(--color-border)', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: 'var(--color-bg)', color: 'var(--color-text-soft)' },
    errorBox: { marginBottom: '12px', background: '#fff0ee', border: '1px solid #f2c2bc', color: '#b7382a', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem' },
    loadingText: { color: 'var(--color-text-soft)', padding: '16px 0', display: 'inline-flex', alignItems: 'center', gap: '10px' },
    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fieldItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7a8570', fontWeight: '700' },
    value: { padding: '11px 12px', background: 'var(--color-bg)', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-dark)', minHeight: '42px' },
    input: { padding: '11px 12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--color-border)', color: 'var(--color-dark)', outline: 'none' },
    deleteSection: { marginTop: '18px', borderTop: '1px dashed #efc6c1', paddingTop: '14px' },
    deleteRow: { display: 'flex', justifyContent: 'flex-end' },
    deleteBtn: { padding: '11px 14px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#b3382b', color: '#fff' }
};

export default DashboardLayout;
