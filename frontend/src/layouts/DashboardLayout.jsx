import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import API_BASE_URL from '../apiConfig';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = ({ role }) => {
    const navigate = useNavigate();
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
                        <div style={styles.welcomeWrap}>
                            {showWelcome && <span style={styles.welcomeText}>{welcomeTitle}</span>}
                            <span style={styles.userName}>{displayName}</span>
                        </div>
                        <span style={styles.rolePill}>{(role || 'user')}</span>
                        <button type="button" style={styles.avatarBtn} onClick={openProfile} title="Profile">
                            {initials}
                        </button>
                    </div>
                </div>
                <Outlet />
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
                            <div style={styles.loadingText}>Loading profile...</div>
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
    main: { flex: 1, backgroundColor: 'var(--sage-bg)', overflowY: 'auto' },
    topbar: { position: 'sticky', top: 0, zIndex: 20, height: '68px', background: 'rgba(250, 246, 241, 0.92)', borderBottom: '1px solid rgba(85, 107, 47, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', backdropFilter: 'blur(8px)' },
    topbarTitle: { fontSize: '1rem', fontWeight: '800', color: 'var(--sage-text-dark)' },
    topbarActions: { display: 'flex', alignItems: 'center', gap: '12px' },
    welcomeWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.05, maxWidth: '220px' },
    welcomeText: { fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6f7e62', fontWeight: '700' },
    userName: { fontSize: '0.9rem', color: '#2f3e1a', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    rolePill: { fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 10px', borderRadius: '999px', background: '#f2f5ec', color: '#526038', fontWeight: '700' },
    avatarBtn: { width: '40px', height: '40px', borderRadius: '50%', border: '1px solid rgba(85, 107, 47, 0.2)', background: '#fff', color: '#2f3e1a', fontWeight: '800', cursor: 'pointer' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { width: 'min(760px, 94vw)', background: '#fff', borderRadius: '20px', border: '1px solid #eceee8', boxShadow: '0 26px 60px rgba(0,0,0,0.18)', padding: '24px' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' },
    modalTitle: { margin: 0, fontSize: '1.25rem', color: '#1d2a12' },
    modalActions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    editBtn: { padding: '9px 14px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#1d2a12', color: '#fff' },
    saveBtn: { padding: '9px 14px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#2f6b2f', color: '#fff' },
    cancelBtn: { padding: '9px 14px', border: '1px solid #d9ded2', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#fff', color: '#4a5740' },
    closeBtn: { padding: '9px 14px', border: '1px solid #d9ded2', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#f6f7f4', color: '#4a5740' },
    errorBox: { marginBottom: '12px', background: '#fff0ee', border: '1px solid #f2c2bc', color: '#b7382a', padding: '10px 12px', borderRadius: '8px', fontSize: '0.9rem' },
    loadingText: { color: '#66735d', padding: '16px 0' },
    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    fieldItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#7a8570', fontWeight: '700' },
    value: { padding: '11px 12px', background: '#f8faf5', borderRadius: '8px', border: '1px solid #e7ebdf', color: '#243117', minHeight: '42px' },
    input: { padding: '11px 12px', background: '#fff', borderRadius: '8px', border: '1px solid #d8ddcf', color: '#243117', outline: 'none' },
    deleteSection: { marginTop: '18px', borderTop: '1px dashed #efc6c1', paddingTop: '14px' },
    deleteRow: { display: 'flex', justifyContent: 'flex-end' },
    deleteBtn: { padding: '11px 14px', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', background: '#b3382b', color: '#fff' }
};

export default DashboardLayout;
