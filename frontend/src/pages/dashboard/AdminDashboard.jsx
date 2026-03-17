import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Stats
    const [stats, setStats] = useState([]);

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({});

    // Land verification state
    const [sellerLandGroups, setSellerLandGroups] = useState([]);
    const [landsLoading, setLandsLoading] = useState(true);
    const [landsError, setLandsError] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [rejectLand, setRejectLand] = useState(null);
    const [rejectMessage, setRejectMessage] = useState('');
    const [rejectError, setRejectError] = useState('');

    const getToken = () => localStorage.getItem('access_token');

    const fetchSellerLandGroups = async () => {
        const token = getToken();
        if (!token) {
            setLandsLoading(false);
            return;
        }

        setLandsLoading(true);
        setLandsError('');

        try {
            const res = await fetch(`${API}/lands/admin/by-seller`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to load land verification queue');
            }

            const data = await res.json();
            setSellerLandGroups(Array.isArray(data) ? data : []);
        } catch (e) {
            if (e.message === 'Failed to fetch') {
                setLandsError('Cannot connect to backend. Please make sure FastAPI server is running on http://localhost:8000.');
            } else {
                setLandsError(e.message || 'Failed to load land verification queue');
            }
            setSellerLandGroups([]);
        } finally {
            setLandsLoading(false);
        }
    };

    const handleVerifyLand = async (land, shouldVerify, note = null) => {
        const token = getToken();
        if (!token) return false;

        setActionLoadingId(land.id || land._id);
        try {
            const res = await fetch(`${API}/lands/${land.id || land._id}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    is_verified: shouldVerify,
                    verification_note: note || null
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (!shouldVerify && res.status === 404) {
                    // If already removed by a previous request, treat as success and refresh.
                    await fetchSellerLandGroups();
                    return true;
                }
                throw new Error(err.detail || 'Failed to update verification status');
            }

            await fetchSellerLandGroups();
            return true;
        } catch (e) {
            alert(e.message || 'Failed to update verification status');
            return false;
        } finally {
            setActionLoadingId('');
        }
    };

    const openRejectModal = (land) => {
        setRejectLand(land);
        setRejectMessage('');
        setRejectError('');
    };

    const closeRejectModal = () => {
        setRejectLand(null);
        setRejectMessage('');
        setRejectError('');
    };

    const submitReject = async () => {
        if (!rejectLand) return;
        if (!rejectMessage.trim()) {
            setRejectError('Rejection message is required.');
            return;
        }

        const ok = await handleVerifyLand(rejectLand, false, rejectMessage.trim());
        if (ok) {
            closeRejectModal();
        }
    };

    // Fetch user from DB using JWT
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setProfileLoading(false); return; }

        // Fetch Profile
        fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const profileData = {
                    name: data.full_name || '',
                    email: data.email || '',
                    nic: data.nic_number || '',
                    address: data.address || '',
                    role: (data.role || '').replace('_', ' '),
                };
                setProfile(profileData);
                setTempProfile(profileData);
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));

        // Fetch Stats
        fetch(`${API}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error);

        fetchSellerLandGroups();
    }, []);

    const handleEditToggle = () => {
        setTempProfile({ ...profile });
        setIsEditing(true);
    };

    const handleSave = () => {
        setProfile({ ...tempProfile });
        setIsEditing(false);
        alert('Profile updated successfully!');
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Admin Dashboard</h1>
                <p style={S.subtitle}>
                    {profileLoading ? 'Loading...' : <>Welcome back, <strong>{profile?.name}</strong>! System overview and management center.</>}
                </p>
            </div>

            {/* Summary Cards */}
            <div style={S.cardGrid}>
                {stats.map((c, i) => (
                    <div
                        key={i}
                        style={{ ...S.card, borderTop: `4px solid ${c.color}` }}
                        onClick={() => navigate(c.route)}
                    >
                        <div style={{ ...S.statVal, color: c.color }}>{c.count}</div>
                        <div style={S.statLabel}>{c.label}</div>
                    </div>
                ))}
            </div>

            <div style={S.dashboardContent}>
                <div style={S.mainColumn}>
                    {/* Profile Card */}
                    <div style={S.sectionCard}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>Admin Profile</h2>
                            {!isEditing ? (
                                <button style={S.editBtn} onClick={handleEditToggle}>Edit Profile</button>
                            ) : (
                                <div style={S.editActions}>
                                    <button style={S.saveBtn} onClick={handleSave}>Save</button>
                                    <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            )}
                        </div>

                        <div style={S.profileGrid}>
                            {profile && Object.keys(profile).map(key => (
                                <div key={key} style={S.profileItem}>
                                    <span style={S.label}>{key.replace('nic', 'NIC').toUpperCase()}</span>
                                    {isEditing ? (
                                        <input
                                            style={S.input}
                                            value={tempProfile[key]}
                                            onChange={(e) => setTempProfile({ ...tempProfile, [key]: e.target.value })}
                                        />
                                    ) : (
                                        <span style={S.value}>{profile[key]}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Management</h2>
                        <div style={S.btnRow}>
                            <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/users')}>
                                User Directory
                            </button>
                        </div>
                    </div>

                    {/* Land Verification */}
                    <div style={S.sectionCard}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>Land Verification Queue</h2>
                            <button style={S.editBtn} onClick={fetchSellerLandGroups}>Refresh</button>
                        </div>

                        {landsLoading ? (
                            <div style={S.emptyState}>Loading lands...</div>
                        ) : landsError ? (
                            <div style={S.errorBox}>{landsError}</div>
                        ) : sellerLandGroups.length === 0 ? (
                            <div style={S.emptyState}>No seller listings found.</div>
                        ) : (
                            <div style={S.verifyWrap}>
                                {sellerLandGroups.map((group) => (
                                    <div key={group.seller_id} style={S.sellerBlock}>
                                        <div style={S.sellerHeader}>
                                            <div>
                                                <h3 style={S.sellerName}>{group.seller_name}</h3>
                                                <div style={S.sellerMeta}>{group.seller_email}</div>
                                            </div>
                                            <div style={S.countRow}>
                                                <span style={S.countBadge}>Total: {group.total_lands}</span>
                                                <span style={{ ...S.countBadge, ...S.verifiedBadge }}>Verified: {group.verified_lands}</span>
                                                <span style={{ ...S.countBadge, ...S.pendingBadge }}>Pending: {group.pending_lands}</span>
                                            </div>
                                        </div>

                                        {group.lands.length === 0 ? (
                                            <div style={S.emptyStateSmall}>No lands from this seller yet.</div>
                                        ) : (
                                            <div style={S.landList}>
                                                {group.lands.map((land) => {
                                                    const landId = land.id || land._id;
                                                    const isWorking = actionLoadingId === landId;
                                                    return (
                                                        <div key={landId} style={S.landRow}>
                                                            <div style={S.landMain}>
                                                                {land.image_url ? (
                                                                    <img src={land.image_url.split(',')[0]} alt={land.name} style={S.landImage} />
                                                                ) : (
                                                                    <div style={S.landImagePlaceholder}>No Image</div>
                                                                )}
                                                                <div>
                                                                    <div style={S.landTitle}>{land.name}</div>
                                                                    <div style={S.landMeta}>
                                                                        {land.village}, {land.district} | {land.perches} perches | Rs. {Number(land.total_price || 0).toLocaleString()}
                                                                    </div>
                                                                    <div style={S.landMeta}>
                                                                        Status: {land.status} | Verification: {land.is_verified ? 'Verified' : 'Pending'}
                                                                    </div>
                                                                    {land.verification_note && (
                                                                        <div style={S.noteText}>Note: {land.verification_note}</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div style={S.verifyActions}>
                                                                <button
                                                                    style={S.approveBtn}
                                                                    disabled={isWorking || land.is_verified}
                                                                    onClick={() => handleVerifyLand(land, true, null)}
                                                                >
                                                                    {isWorking ? 'Saving...' : 'Approve'}
                                                                </button>
                                                                <button
                                                                    style={S.rejectBtn}
                                                                    disabled={isWorking}
                                                                    onClick={() => openRejectModal(land)}
                                                                >
                                                                    {isWorking ? 'Saving...' : 'Reject'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div style={S.sideColumn}>
                    {/* System Status Activity */}
                    <div style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Logs</h2>
                        <div style={S.activityList}>
                            {[
                                { text: 'All systems operational', time: 'Active', color: '#27ae60' },
                                { text: 'Database backup completed', time: '2 hrs ago', color: '#3498db' },
                                { text: '3 agent applications pending', time: 'Action Reqd', color: '#e67e22' },
                            ].map((a, i) => (
                                <div key={i} style={S.activityItem}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color }} />
                                    <span style={S.actText}>{a.text}</span>
                                    <span style={S.actTime}>{a.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {rejectLand && (
                <div style={S.modalOverlay}>
                    <div style={S.modalCard}>
                        <h3 style={S.modalTitle}>Reject Land Listing</h3>
                        <p style={S.modalText}>
                            Send a rejection message to seller for <strong>{rejectLand.name}</strong>.
                        </p>
                        <textarea
                            style={S.modalTextArea}
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                            placeholder="Type rejection reason here..."
                            rows={4}
                        />
                        {rejectError && <div style={S.modalError}>{rejectError}</div>}
                        <div style={S.modalActions}>
                            <button style={S.modalCancelBtn} onClick={closeRejectModal}>Cancel</button>
                            <button
                                style={S.modalRejectBtn}
                                onClick={submitReject}
                                disabled={Boolean(rejectLand && actionLoadingId === (rejectLand.id || rejectLand._id))}
                            >
                                {Boolean(rejectLand && actionLoadingId === (rejectLand.id || rejectLand._id)) ? 'Sending...' : 'Send & Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: 'var(--sage-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--sage-text-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--sage-text-med)', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: 'var(--sage-card)', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s', cursor: 'pointer' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: 'var(--sage-text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: 'var(--sage-card)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(85, 107, 47, 0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(85, 107, 47, 0.05)', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--sage-text-dark)', margin: 0 },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: 'rgba(85, 107, 47, 0.05)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-primary)' },
    saveBtn: { padding: '8px 16px', background: 'var(--sage-primary)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-text-med)' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--sage-text-light)', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: 'var(--sage-text-dark)' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(85, 107, 47, 0.1)', background: 'var(--sage-bg)', fontSize: '0.9rem', outline: 'none', color: 'var(--sage-text-dark)' },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: 'var(--sage-card)', color: 'var(--sage-primary)', border: '2px solid var(--sage-primary)' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid rgba(85, 107, 47, 0.05)' },
    actText: { flex: 1, fontSize: '0.9rem', color: 'var(--sage-text-dark)', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: 'var(--sage-text-light)', whiteSpace: 'nowrap' },

    verifyWrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
    sellerBlock: { border: '1px solid rgba(85, 107, 47, 0.12)', borderRadius: '14px', overflow: 'hidden' },
    sellerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: '#f8fbf3',
        borderBottom: '1px solid rgba(85, 107, 47, 0.08)'
    },
    sellerName: { margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--sage-text-dark)' },
    sellerMeta: { fontSize: '0.8rem', color: 'var(--sage-text-light)', marginTop: '2px' },
    countRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    countBadge: {
        fontSize: '0.73rem',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '999px',
        background: '#eef1e7',
        color: '#4d5f2e'
    },
    verifiedBadge: { background: '#e8f8ef', color: '#1f8f4e' },
    pendingBadge: { background: '#fff3e8', color: '#b7641e' },
    landList: { display: 'flex', flexDirection: 'column' },
    landRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(85, 107, 47, 0.06)'
    },
    landMain: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
    landImage: { width: '74px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e6e6e6' },
    landImagePlaceholder: {
        width: '74px',
        height: '56px',
        borderRadius: '10px',
        border: '1px dashed #d4d9c8',
        background: '#fafcf7',
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.72rem',
        color: '#97a184'
    },
    landTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#233018', marginBottom: '2px' },
    landMeta: { fontSize: '0.78rem', color: '#667258', lineHeight: 1.4 },
    noteText: { marginTop: '4px', fontSize: '0.76rem', color: '#4d5f2e', fontStyle: 'italic' },
    verifyActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
    approveBtn: {
        border: 'none',
        borderRadius: '8px',
        background: '#2f8f58',
        color: '#fff',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    rejectBtn: {
        border: '1px solid #d5a493',
        borderRadius: '8px',
        background: '#fff7f4',
        color: '#9a4a33',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    emptyState: {
        border: '1px dashed rgba(85, 107, 47, 0.2)',
        borderRadius: '10px',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--sage-text-light)',
        background: '#fbfdf8'
    },
    emptyStateSmall: {
        padding: '12px 16px',
        color: 'var(--sage-text-light)',
        fontSize: '0.85rem'
    },
    errorBox: {
        borderRadius: '10px',
        background: '#fff1f0',
        border: '1px solid #f2c8c3',
        color: '#9c3a30',
        padding: '12px 14px',
        fontSize: '0.88rem'
    },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.38)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
    },
    modalCard: {
        width: '100%',
        maxWidth: '520px',
        background: '#fff',
        borderRadius: '16px',
        padding: '22px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.18)'
    },
    modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#263319' },
    modalText: { marginTop: '8px', marginBottom: '12px', fontSize: '0.9rem', color: '#5a6650' },
    modalTextArea: {
        width: '100%',
        border: '1px solid #ced9c1',
        borderRadius: '10px',
        padding: '10px 12px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.9rem',
        outline: 'none',
        resize: 'vertical'
    },
    modalError: {
        marginTop: '10px',
        borderRadius: '8px',
        background: '#fff1f0',
        border: '1px solid #f2c8c3',
        color: '#9c3a30',
        padding: '8px 10px',
        fontSize: '0.84rem'
    },
    modalActions: {
        marginTop: '14px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    modalCancelBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: '1px solid #d3d3d3',
        background: '#fff',
        color: '#5c5c5c',
        cursor: 'pointer',
        fontWeight: '700'
    },
    modalRejectBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: 'none',
        background: '#9a4a33',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '700'
    },
};

export default AdminDashboard;


