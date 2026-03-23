import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const formatPrice = (value) => `Rs. ${Number(value || 0).toLocaleString()}`;

const formatEnumText = (value) => {
    const raw = String(value || '');
    const normalized = raw.includes('.') ? raw.split('.').pop() : raw;
    return normalized.replace(/_/g, ' ').trim();
};

const toTitleCase = (value) => {
    const txt = formatEnumText(value);
    if (!txt) return 'N/A';
    return txt
        .split(' ')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

const AdminDashboard = () => {
    const navigate = useNavigate();

    // Stats
    const [stats, setStats] = useState([]);

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

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
                        className="ui-card ui-lift"
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
                    {/* Quick Actions */}
                    <div className="ui-card ui-lift" style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Management</h2>
                        <div style={S.btnRow}>
                            <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/users')}>
                                User Directory
                            </button>
                            <button className="btn-dark" style={{ ...S.actionBtn, background: 'var(--color-accent)' }} onClick={() => navigate('/dashboard/admin/complaints')}>
                                Inquiry Inbox 📩
                            </button>
                        </div>
                    </div>

                    {/* Land Verification */}
                    <div className="ui-card ui-lift" style={S.sectionCard}>
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
                                                    const landStatus = toTitleCase(land.status);
                                                    const verificationStatus = land.is_verified ? 'Verified' : toTitleCase(land.review_status || 'pending');
                                                    const landType = toTitleCase(land.land_type);
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
                                                                        {land.village}, {land.district}
                                                                    </div>
                                                                    <div style={S.landMeta}>
                                                                        Size: {land.perches} perches | Price/Perch: {formatPrice(land.price_per_perch)} | Total: {formatPrice(land.total_price)}
                                                                    </div>
                                                                    <div style={S.landMeta}>
                                                                        Type: {landType} | Status: {landStatus} | Verification: {verificationStatus}
                                                                    </div>
                                                                    <div style={S.landMeta}>
                                                                        Road Access: {land.road_access || 'Not specified'} | Utilities: {land.electricity ? 'Electricity' : 'No Electricity'}, {land.water ? 'Water' : 'No Water'}
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
                    <div className="ui-card ui-lift" style={S.sectionCard}>
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
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-muted)', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: '#fff', borderRadius: '16px', padding: '32px 28px', boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s', cursor: 'pointer', border: '1px solid rgba(38, 50, 56, 0.1)' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(38, 50, 56, 0.1)', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: 'rgba(33, 150, 243, 0.12)', border: '1px solid rgba(33, 150, 243, 0.28)', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#145b97' },
    saveBtn: { padding: '8px 16px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid rgba(38, 50, 56, 0.2)', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-muted)' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--sage-text-light)', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: 'var(--sage-text-dark)' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(85, 107, 47, 0.1)', background: 'var(--sage-bg)', fontSize: '0.9rem', outline: 'none', color: 'var(--sage-text-dark)' },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif", background: 'var(--color-primary)', color: '#fff' },
    outlineBtn: { background: 'var(--sage-card)', color: 'var(--sage-primary)', border: '2px solid var(--sage-primary)' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid rgba(38, 50, 56, 0.08)' },
    actText: { flex: 1, fontSize: '0.9rem', color: 'var(--color-dark)', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' },

    verifyWrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
    sellerBlock: { border: '1px solid rgba(38, 50, 56, 0.12)', borderRadius: '14px', overflow: 'hidden' },
    sellerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: 'rgba(139, 195, 74, 0.12)',
        borderBottom: '1px solid rgba(38, 50, 56, 0.08)'
    },
    sellerName: { margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--color-dark)' },
    sellerMeta: { fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '2px' },
    countRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    countBadge: {
        fontSize: '0.73rem',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '999px',
        background: 'rgba(38, 50, 56, 0.1)',
        color: 'var(--color-dark)'
    },
    verifiedBadge: { background: 'rgba(76, 175, 80, 0.18)', color: '#2e7d32' },
    pendingBadge: { background: 'rgba(33, 150, 243, 0.14)', color: '#145b97' },
    landList: { display: 'flex', flexDirection: 'column' },
    landRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(38, 50, 56, 0.08)'
    },
    landMain: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
    landImage: { width: '74px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(38, 50, 56, 0.12)' },
    landImagePlaceholder: {
        width: '74px',
        height: '56px',
        borderRadius: '10px',
        border: '1px dashed rgba(38, 50, 56, 0.18)',
        background: 'rgba(139, 195, 74, 0.1)',
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.72rem',
        color: 'var(--color-muted)'
    },
    landTitle: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-dark)', marginBottom: '2px' },
    landMeta: { fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.4 },
    noteText: { marginTop: '4px', fontSize: '0.76rem', color: '#7a4f41', fontStyle: 'italic' },
    verifyActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
    approveBtn: {
        border: 'none',
        borderRadius: '8px',
        background: 'var(--color-primary)',
        color: '#fff',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    rejectBtn: {
        border: '1px solid rgba(161, 136, 127, 0.45)',
        borderRadius: '8px',
        background: 'rgba(161, 136, 127, 0.12)',
        color: '#7a4f41',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    emptyState: {
        border: '1px dashed rgba(38, 50, 56, 0.2)',
        borderRadius: '10px',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--color-muted)',
        background: 'rgba(139, 195, 74, 0.08)'
    },
    emptyStateSmall: {
        padding: '12px 16px',
        color: 'var(--color-muted)',
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
        background: 'rgba(38, 50, 56, 0.42)',
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
        boxShadow: '0 20px 48px rgba(38, 50, 56, 0.2)',
        border: '1px solid rgba(38, 50, 56, 0.12)'
    },
    modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-dark)' },
    modalText: { marginTop: '8px', marginBottom: '12px', fontSize: '0.9rem', color: 'var(--color-muted)' },
    modalTextArea: {
        width: '100%',
        border: '1px solid rgba(38, 50, 56, 0.18)',
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
        border: '1px solid rgba(38, 50, 56, 0.2)',
        background: '#fff',
        color: 'var(--color-dark)',
        cursor: 'pointer',
        fontWeight: '700'
    },
    modalRejectBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: 'none',
        background: 'var(--color-accent)',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '700'
    },
};

export default AdminDashboard;


