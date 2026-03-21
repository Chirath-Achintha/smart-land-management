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

const deriveProgress = (status) => {
    const display = deriveDisplayStatus(status);
    if (display === 'Planning') return 15;
    if (display === 'In Progress') return 65;
    if (display === 'Completed') return 100;
    return 0;
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

    return (
        <div style={S.root}>
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
                    const progress = deriveProgress(p.status);

                    return (
                    <div key={p.id} style={S.projectCard}>
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

                        <div style={S.progressWrapper}>
                            <div style={S.progressHeader}>
                                <span style={S.label}>Completion Progress</span>
                                <span style={S.progressVal}>{progress}%</span>
                            </div>
                            <div style={S.progressBg}>
                                <div style={{ ...S.progressFill, width: `${progress}%` }}></div>
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
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
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
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    toolbar: { marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
    filterBar: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #DDD', background: '#fff', color: '#666', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    activeFilter: { background: '#1A1A1A', color: '#fff', border: '1px solid #1A1A1A' },
    refreshBtn: { padding: '8px 14px', borderRadius: '8px', border: '1px solid #DDD', background: '#fff', color: '#333', fontWeight: '700', cursor: 'pointer' },

    projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
    projectCard: { background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '20px' },

    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    projectId: { fontSize: '0.75rem', fontWeight: '800', color: '#3498db', letterSpacing: '0.05em' },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' },

    projectName: { margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A' },

    infoSummary: { display: 'flex', gap: '24px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
    label: { fontSize: '0.7rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase' },
    value: { fontSize: '0.9rem', fontWeight: '700', color: '#333' },

    progressWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
    progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    progressVal: { fontSize: '0.9rem', fontWeight: '800', color: '#1A1A1A' },
    progressBg: { width: '100%', height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', background: '#1A1A1A', borderRadius: '4px', transition: 'width 0.4s ease' },

    viewDetailsBtn: { marginTop: '10px', padding: '12px', borderRadius: '12px', background: '#F5F5F5', color: '#1A1A1A', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },
    empty: { textAlign: 'center', color: '#777', padding: '40px', borderRadius: '16px', background: '#fff' },
    error: { textAlign: 'center', color: '#b91c1c', padding: '40px', borderRadius: '16px', background: '#fee2e2' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '800' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },

    modalBody: { display: 'flex', flexDirection: 'column', gap: '24px' },
    modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    modalField: { display: 'flex', flexDirection: 'column', gap: '4px' },
    valueLarge: { fontSize: '1rem', fontWeight: '700', color: '#1A1A1A' },

    updateSection: { padding: '20px', background: '#F9F9F9', borderRadius: '16px' },
    sectionLabel: { margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: '800', color: '#777', textTransform: 'uppercase' },
    actionRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
    actionBtnPrimary: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#1A1A1A', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
    actionBtnSuccess: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#166534', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
    doneText: { color: '#555', fontWeight: '700', fontSize: '0.9rem' }
};

export default ConstructorProjectsPage;
