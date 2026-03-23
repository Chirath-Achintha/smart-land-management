import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const DISPLAY_FILTERS = ['All', 'Planning', 'In Progress', 'Completed', 'Cancelled'];

const STATUS_STYLE = {
    'In Progress': { color: '#f39c12', background: '#fef5e7' },
    Planning: { color: '#3498db', background: '#ebf5fb' },
    Completed: { color: '#27ae60', background: '#eafaf1' },
    Cancelled: { color: '#b91c1c', background: '#fee2e2' },
};

const deriveDisplayStatus = (status) => {
    if (['Requested', 'Approved', 'Scheduled'].includes(status)) return 'Planning';
    if (status === 'In Progress') return 'In Progress';
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';
    return 'Planning';
};

const formatBudget = (value) => {
    if (typeof value !== 'number') return 'N/A';
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(value);
};

const toProjectCode = (id) => {
    const cleaned = String(id || '').slice(-6).toUpperCase();
    return `PRJ-${cleaned || 'N/A'}`;
};

const isAcceptedProject = (status) => status === 'In Progress' || status === 'Completed' || status === 'Cancelled';

const ConstructorProjectsPage = () => {
    const token = localStorage.getItem('access_token');
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const [bookings, setBookings] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState('');
    const [animatedCards, setAnimatedCards] = useState({});

    const fetchProjects = async () => {
        if (!token) {
            setError('Please log in as a constructor manager.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/service-bookings/assigned`, { headers: authH });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load projects');
            const filtered = (Array.isArray(data) ? data : []).filter((b) => isAcceptedProject(b.status));
            setBookings(filtered);
        } catch (e) {
            setBookings([]);
            setError(e.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!token) return undefined;

        const intervalId = setInterval(fetchProjects, 15000);
        const onFocus = () => fetchProjects();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
        };
    }, [token]);

    const updateStatus = async (bookingId, nextStatus) => {
        setUpdatingId(bookingId);
        try {
            const res = await fetch(`${API}/service-bookings/${bookingId}/status`, {
                method: 'PUT',
                headers: authH,
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to update status');

            setBookings((prev) => prev.map((b) => (b.id === bookingId ? data : b)));
            setActiveProject((prev) => (prev && prev.id === bookingId ? data : prev));
        } catch (e) {
            alert(e.message || 'Failed to update status');
        } finally {
            setUpdatingId('');
        }
    };

    const filtered = useMemo(
        () => bookings.filter((booking) => filter === 'All' || deriveDisplayStatus(booking.status) === filter),
        [bookings, filter]
    );

    useEffect(() => {
        const timers = filtered.map((booking, idx) =>
            setTimeout(() => {
                setAnimatedCards((prev) => ({ ...prev, [booking.id]: true }));
            }, idx * 70)
        );

        return () => timers.forEach(clearTimeout);
    }, [filtered]);

    return (
        <div style={S.root} className="ui-page">
            <div style={S.header}>
                <h1 style={S.title}>My Projects</h1>
                <p style={S.subtitle}>Manage and track your active construction projects.</p>
            </div>

            <div style={S.toolbar}>
                <div style={S.filterBar}>
                    {DISPLAY_FILTERS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{ ...S.filterBtn, ...(filter === f ? S.activeFilter : {}) }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <button style={S.refreshBtn} onClick={fetchProjects} type="button">Refresh</button>
            </div>

            {loading ? (
                <div style={S.empty}>Loading projects...</div>
            ) : error ? (
                <div style={S.error}>{error}</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>No projects available for this filter.</div>
            ) : (
            <div style={S.projectGrid}>
                {filtered.map((p) => {
                    const displayStatus = deriveDisplayStatus(p.status);

                    return (
                    <div
                        key={p.id}
                        className="ui-card ui-lift"
                        style={{
                            ...S.projectCard,
                            opacity: animatedCards[p.id] ? 1 : 0,
                            transform: animatedCards[p.id] ? 'translateY(0)' : 'translateY(14px)',
                            transition: 'opacity 0.38s ease, transform 0.38s ease'
                        }}
                    >
                        <div style={S.cardHeader}>
                            <span style={S.projectId}>{toProjectCode(p.id)}</span>
                            <span style={{ ...S.statusBadge, ...getStatusStyle(displayStatus) }}>{displayStatus}</span>
                        </div>
                        <h3 style={S.projectName}>{p.land_name || p.service_type || 'Project'}</h3>
                        <div style={S.infoSummary}>
                            <div style={S.infoItem}>
                                <span style={S.label}>Client</span>
                                <span style={S.value}>{p.buyer_name || `Buyer #${p.buyer_id}`}</span>
                            </div>
                            <div style={S.infoItem}>
                                <span style={S.label}>Budget</span>
                                <span style={S.value}>{formatBudget(p.land_price)}</span>
                            </div>
                        </div>

                        <button
                            style={S.viewDetailsBtn}
                            onClick={() => { setActiveProject(p); setShowModal(true); }}
                        >
                            View Details & Manage
                        </button>
                    </div>
                );
                })}
            </div>
            )}

            {showModal && activeProject && (
                <div style={S.modalOverlay} className="profile-overlay">
                    <div style={S.modal} className="profile-modal">
                        <div style={S.modalHeader}>
                            <h2 style={S.modalTitle}>{activeProject.land_name || activeProject.service_type}</h2>
                            <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div style={S.modalBody}>
                            <div style={S.modalGrid}>
                                <div style={S.modalField}>
                                    <span style={S.label}>Project ID</span>
                                    <span style={S.valueLarge}>{toProjectCode(activeProject.id)}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Team Assigned</span>
                                    <span style={S.valueLarge}>{activeProject.constructor_name || 'Current Team'}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Preferred Date</span>
                                    <span style={S.valueLarge}>{activeProject.preferred_date || 'N/A'}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Status</span>
                                    <div style={{ ...S.statusBadge, ...getStatusStyle(deriveDisplayStatus(activeProject.status)), alignSelf: 'flex-start' }}>
                                        {deriveDisplayStatus(activeProject.status)}
                                    </div>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>District</span>
                                    <span style={S.valueLarge}>{activeProject.land_district || 'N/A'}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Budget</span>
                                    <span style={S.valueLarge}>{formatBudget(activeProject.land_price)}</span>
                                </div>
                            </div>

                            <div style={S.updateSection}>
                                <h4 style={S.sectionLabel}>Quick Actions</h4>
                                <div style={S.actionRow}>
                                    {(activeProject.status === 'Approved' || activeProject.status === 'Scheduled' || activeProject.status === 'Requested') && (
                                        <button
                                            style={S.actionBtnPrimary}
                                            onClick={() => updateStatus(activeProject.id, 'In Progress')}
                                            disabled={updatingId === activeProject.id}
                                        >
                                            {updatingId === activeProject.id ? 'Updating...' : 'Mark In Progress'}
                                        </button>
                                    )}
                                    {activeProject.status === 'In Progress' && (
                                        <button
                                            style={S.actionBtnSuccess}
                                            onClick={() => updateStatus(activeProject.id, 'Completed')}
                                            disabled={updatingId === activeProject.id}
                                        >
                                            {updatingId === activeProject.id ? 'Updating...' : 'Mark Completed'}
                                        </button>
                                    )}
                                    {activeProject.status === 'Completed' && (
                                        <div style={S.doneText}>This project is already completed.</div>
                                    )}
                                    {activeProject.status === 'Cancelled' && (
                                        <div style={S.doneText}>This project was cancelled.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusStyle = (status) => {
    return STATUS_STYLE[status] || { color: '#777', background: '#f4f4f4' };
};

const S = {
    root: { background: 'linear-gradient(180deg, #FAF6F1 0%, #F2ECE2 100%)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px', letterSpacing: '-0.01em' },
    subtitle: { color: 'var(--color-muted)', fontSize: '1rem' },

    toolbar: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
    filterBar: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 16px', borderRadius: '999px', border: '1px solid var(--color-accent)', background: '#fff', color: '#4F5E63', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
    activeFilter: { background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)', boxShadow: '0 12px 24px rgba(76,175,80,0.24)' },
    refreshBtn: { padding: '8px 14px', borderRadius: '10px', border: '1px solid #86EFAC', background: '#ECFDF5', color: '#166534', fontWeight: '700', cursor: 'pointer' },

    projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
    projectCard: { borderRadius: '24px', padding: '24px', border: '1px solid var(--color-accent)', display: 'flex', flexDirection: 'column', gap: '20px', background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFCF8 100%)' },

    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    projectId: { fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-blue)', letterSpacing: '0.05em' },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' },

    projectName: { margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-dark)' },

    infoSummary: { display: 'flex', gap: '24px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
    label: { fontSize: '0.7rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase' },
    value: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-dark)' },

    viewDetailsBtn: { marginTop: '10px', padding: '12px', borderRadius: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease' },
    empty: { textAlign: 'center', color: 'var(--color-muted)', padding: '40px', borderRadius: '16px', background: '#fff', border: '1px solid var(--color-accent)' },
    error: { textAlign: 'center', color: '#b91c1c', padding: '40px', borderRadius: '16px', background: '#fee2e2' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17,24,39,0.38)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid var(--color-accent)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-dark)' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },

    modalBody: { display: 'flex', flexDirection: 'column', gap: '24px' },
    modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    modalField: { display: 'flex', flexDirection: 'column', gap: '4px' },
    valueLarge: { fontSize: '1rem', fontWeight: '700', color: 'var(--color-dark)' },

    updateSection: { padding: '20px', background: '#F5FBF5', borderRadius: '16px', border: '1px solid #D9E9D9' },
    sectionLabel: { margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase' },
    actionRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    actionBtnPrimary: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
    actionBtnSuccess: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#166534', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
    doneText: { color: '#2F4F39', fontWeight: '700', fontSize: '0.9rem' }
};

export default ConstructorProjectsPage;
