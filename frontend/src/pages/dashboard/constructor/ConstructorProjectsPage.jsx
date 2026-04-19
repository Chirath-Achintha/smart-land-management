import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../../apiConfig';
import toast from 'react-hot-toast';

const API = API_BASE_URL;

const DISPLAY_FILTERS = ['All', 'Accepted', 'Completed', 'Cancelled'];

const STATUS_STYLE = {
    Accepted: { color: '#095028', background: '#dcfce7' },
    Completed: { color: '#1A1A1A', background: '#e5e7eb' },
    Cancelled: { color: '#b91c1c', background: '#fee2e2' },
};

const deriveDisplayStatus = (status) => {
    if (status === 'Accepted') return 'Accepted';
    if (status === 'Completed') return 'Completed';
    if (status === 'Cancelled') return 'Cancelled';
    return 'Accepted'; // fallback
};

const deriveProgress = (p) => {
    if (p.status === 'Completed') return 100;
    if (p.status === 'Cancelled') return 0;
    if (!p.milestones || p.milestones.length === 0) return 0;
    const done = p.milestones.filter(m => m.is_completed).length;
    return Math.round((done / p.milestones.length) * 100);
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
    const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
    const [milestoneIdx, setMilestoneIdx] = useState(null);

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
            
            // Only show projects that are NOT Pending (i.e. Accepted, Completed, Cancelled)
            const filtered = (Array.isArray(data) ? data : []).filter((b) => b.status !== 'Pending');
            setBookings(filtered);
        } catch (e) {
            setBookings([]);
            setError(e.message || 'Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProjects(); }, []);

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

    const addMilestone = async (bookingId) => {
        if (!newMilestoneTitle.trim()) return;
        setUpdatingId(bookingId);
        try {
            const res = await fetch(`${API}/service-bookings/${bookingId}/milestones`, {
                method: 'POST',
                headers: authH,
                body: JSON.stringify({ title: newMilestoneTitle }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to add milestone');
            
            setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
            setActiveProject(data);
            setNewMilestoneTitle('');
            toast.success('Milestone added!');
        } catch (e) {
            toast.error(e.message);
        } finally {
            setUpdatingId('');
        }
    };

    const toggleMilestone = async (bookingId, mId) => {
        setMilestoneIdx(mId);
        try {
            const res = await fetch(`${API}/service-bookings/${bookingId}/milestones/${mId}`, {
                method: 'PATCH',
                headers: authH,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to update milestone');
            
            setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
            setActiveProject(data);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setMilestoneIdx(null);
        }
    };

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

			toast.success(`Project marked as ${nextStatus}!`);
            setBookings((prev) => prev.map((b) => (b.id === bookingId ? data : b)));
            setActiveProject((prev) => (prev && prev.id === bookingId ? data : prev));
        } catch (e) {
            toast.error(e.message || 'Failed to update status');
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
                <h1 style={S.title}>My Workshop</h1>
                <p style={S.subtitle}>Manage active and completed projects that you have accepted.</p>
            </div>

            <div style={S.toolbar}>
                <div style={S.filterBar}>
                    {DISPLAY_FILTERS.map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ ...S.filterBtn, ...(filter === f ? S.activeFilter : {}) }}>
                            {f}
                        </button>
                    ))}
                </div>
                <button style={S.refreshBtn} onClick={fetchProjects} type="button">Refresh Data</button>
            </div>

            {loading ? (
                <div style={S.empty}>Loading active projects...</div>
            ) : error ? (
                <div style={S.error}>{error}</div>
            ) : filtered.length === 0 ? (
                <div style={S.emptyBox}>
                    <h3 style={{marginTop: 0, color: '#111827'}}>No projects in "{filter}"</h3>
                    <p style={{margin: 0}}>You don't have any matching projects in your workshop right now.</p>
                </div>
            ) : (
            <div style={S.projectGrid}>
                {filtered.map((p) => {
                    const displayStatus = deriveDisplayStatus(p.status);
                    const progress = deriveProgress(p);

                    return (
                    <div key={p.id} style={S.projectCard}>
                        <div style={S.cardHeader}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={S.projectId}>{toProjectCode(p.id)}</span>
                                <span style={S.serviceTypeLabel}>{p.service_type}</span>
                            </div>
                            <span style={{ ...S.statusBadge, ...getStatusStyle(displayStatus) }}>{displayStatus}</span>
                        </div>
                        <h3 style={S.projectName}>{p.land_name || 'Project Site'}</h3>
                        <div style={S.infoSummary}>
                            <div style={S.infoItem}>
                                <span style={S.label}>👤 Client</span>
                                <span style={S.value}>{p.buyer_name || `Buyer #${p.buyer_id}`}</span>
                            </div>
                            <div style={S.infoItem}>
                                <span style={S.label}>💰 Budget</span>
                                <span style={S.value}>{formatBudget(p.land_price)}</span>
                            </div>
                        </div>

                        <div style={S.progressWrapper}>
                            <div style={S.progressHeader}>
                                <span style={S.label}>Construction Progress</span>
                                <span style={S.progressVal}>{progress}%</span>
                            </div>
                            <div style={S.progressBg}>
                                <div style={{ 
                                    ...S.progressFill, 
                                    width: `${progress}%`,
                                    background: progress === 100 ? '#10B981' : 'var(--color-primary)'
                                }}></div>
                            </div>
                        </div>

                        <button style={S.viewDetailsBtn} onClick={() => { setActiveProject(p); setShowModal(true); }}>
                            Manage Project →
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
                                    <span style={S.label}>Status</span>
                                    <div style={{ ...S.statusBadge, ...getStatusStyle(deriveDisplayStatus(activeProject.status)), alignSelf: 'flex-start' }}>
                                        {deriveDisplayStatus(activeProject.status)}
                                    </div>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Preferred Date</span>
                                    <span style={S.valueLarge}>{activeProject.preferred_date || 'N/A'}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>District</span>
                                    <span style={S.valueLarge}>{activeProject.land_district || 'N/A'}</span>
                                </div>
                            </div>

                            <div style={S.updateSection}>
                                <h4 style={S.sectionLabel}>Milestones & Progress</h4>
                                <div style={S.milestoneContainer}>
                                    <div style={S.mList}>
                                        {activeProject.milestones?.map(m => (
                                            <div key={m.id} style={S.mItem}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={m.is_completed} 
                                                    disabled={milestoneIdx === m.id}
                                                    onChange={() => toggleMilestone(activeProject.id, m.id)}
                                                />
                                                <span style={{ 
                                                    fontSize: '0.9rem', 
                                                    textDecoration: m.is_completed ? 'line-through' : 'none',
                                                    color: m.is_completed ? '#999' : '#333'
                                                }}>
                                                    {m.title}
                                                </span>
                                            </div>
                                        ))}
                                        {(!activeProject.milestones || activeProject.milestones.length === 0) && (
                                            <div style={{ color: '#999', fontSize: '0.85rem', fontStyle: 'italic' }}>No milestones added yet.</div>
                                        )}
                                    </div>
                                    <div style={S.addMBox}>
                                        <input 
                                            style={S.mInput} 
                                            placeholder="Add new milestone..." 
                                            value={newMilestoneTitle}
                                            onChange={e => setNewMilestoneTitle(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && addMilestone(activeProject.id)}
                                        />
                                        <button style={S.mAddBtn} onClick={() => addMilestone(activeProject.id)}>+</button>
                                    </div>
                                </div>
                            </div>

                            <div style={S.updateSection}>
                                <h4 style={S.sectionLabel}>Project Actions</h4>
                                <div style={S.actionRow}>
                                    {activeProject.status === 'Accepted' && (
                                        <button style={S.actionBtnSuccess} disabled={updatingId === activeProject.id}
                                            onClick={() => updateStatus(activeProject.id, 'Completed')}>
                                            {updatingId === activeProject.id ? 'Updating...' : 'Mark as Completed'}
                                        </button>
                                    )}
                                    {activeProject.status === 'Completed' && (
                                        <div style={S.doneText}>🎉 This project is successfully completed.</div>
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
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem', fontWeight: '500' },

    toolbar: { marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' },
    filterBar: { display: 'flex', gap: '8px', flexWrap: 'wrap', background: '#fff', padding: '8px', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' },
    filterBtn: { padding: '10px 20px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#6B7280', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.02em' },
    activeFilter: { background: 'var(--color-dark)', color: '#fff' },
    refreshBtn: { padding: '12px 24px', borderRadius: '14px', border: '1.5px solid var(--color-border)', background: '#fff', color: 'var(--color-dark)', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s' },

    projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '32px' },
    projectCard: { background: '#fff', borderRadius: '32px', padding: '32px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', overflow: 'hidden', transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '20px' },
    projectId: { fontSize: '0.65rem', fontWeight: '800', color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase' },
    serviceTypeLabel: { fontSize: '0.9rem', fontWeight: '800', color: 'var(--color-dark)', marginTop: '4px' },
    statusBadge: { padding: '8px 16px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' },
    projectName: { margin: 0, fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-dark)', letterSpacing: '-0.02em' },

    infoSummary: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#F8FAFC', padding: '24px', borderRadius: '24px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.65rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' },
    value: { fontSize: '1rem', fontWeight: '700', color: 'var(--color-dark)' },

    progressWrapper: { display: 'flex', flexDirection: 'column', gap: '12px' },
    progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    progressVal: { fontSize: '0.9rem', fontWeight: '900', color: 'var(--color-primary)' },
    progressBg: { width: '100%', height: '12px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '10px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' },

    viewDetailsBtn: { padding: '16px', borderRadius: '18px', background: 'var(--color-dark)', color: '#fff', border: 'none', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    emptyBox: { textAlign: 'center', color: 'var(--color-text-soft)', padding: '100px 40px', background: '#fff', borderRadius: '32px', border: '1px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    empty: { textAlign: 'center', color: '#BBB', padding: '100px 40px', background: '#fff', borderRadius: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)' },
    error: { textAlign: 'center', color: '#e74c3c', padding: '40px', borderRadius: '24px', background: '#FEF2F2', border: '1px solid #ffccbc', fontWeight: '700' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '560px', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', gap: '32px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },

    modalBody: { display: 'flex', flexDirection: 'column', gap: '32px' },
    modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    modalField: { display: 'flex', flexDirection: 'column', gap: '6px' },
    valueLarge: { fontSize: '1rem', fontWeight: '700', color: 'var(--color-dark)' },

    updateSection: { padding: '24px', background: 'var(--color-bg)', borderRadius: '20px', border: '1px solid var(--color-border)' },
    sectionLabel: { margin: '0 0 16px 0', fontSize: '0.72rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.08em' },
    actionRow: { display: 'flex', gap: '12px' },
    actionBtnSuccess: { flex: 1, padding: '16px', borderRadius: '16px', border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' },
    doneText: { color: '#047857', fontWeight: '800', fontSize: '0.95rem', padding: '8px 16px', background: '#ECFDF5', borderRadius: '12px', width: '100%', textAlign: 'center' },
    
    milestoneContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
    mList: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '8px' },
    mItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '12px', background: '#fff', border: '1px solid var(--color-border)' },
    addMBox: { display: 'flex', gap: '10px', marginTop: '8px' },
    mInput: { flex: 1, padding: '14px 16px', borderRadius: '14px', border: '1.5px solid var(--color-border)', outline: 'none', fontSize: '0.92rem', background: '#fff' },
    mAddBtn: { background: 'var(--color-dark)', color: '#fff', border: 'none', borderRadius: '14px', width: '48px', height: '48px', fontWeight: '800', fontSize: '1.2rem', cursor: 'pointer' }
};

export default ConstructorProjectsPage;
