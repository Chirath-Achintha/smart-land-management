import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Pending: { bg: '#FFF8E1', color: '#B45309' },
    'Quote Submitted': { bg: '#E0F2FE', color: '#0369A1' },
    Accepted: { bg: '#ECFDF5', color: '#047857' },
    'In Progress': { bg: '#EFF6FF', color: '#1E40AF' },
    Completed: { bg: '#F3F4F6', color: '#374151' },
    Cancelled: { bg: '#FEF2F2', color: '#DC2626' },
};

const ServiceBookingPage = () => {
    const location = useLocation();
    const token = localStorage.getItem('access_token');
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    const isDashboardView = location.pathname.startsWith('/dashboard');

    /* ── state ── */
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    /* ── fetch buyer's bookings ── */
    const fetchBookings = () => {
        if (!token) { setLoading(false); return; }
        fetch(`${API}/service-bookings/my`, { headers: authH })
            .then(r => r.json())
            .then(d => {
                const arr = Array.isArray(d) ? d : [];
                setBookings(arr.map(b => ({ ...b, id: b.id || b._id })));
            })
            .catch(() => setBookings([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    /* ── edit booking ── */
    const openEdit = (b) => {
        setEditTarget(b);
        setEditForm({ preferred_date: b.preferred_date, preferred_time: b.preferred_time, notes: b.notes || '' });
    };
    const saveEdit = async () => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/service-bookings/${editTarget.id}`, {
                method: 'PUT', headers: authH, body: JSON.stringify(editForm),
            });
            if (!res.ok) { const e = await res.json(); alert(e.detail || 'Failed'); setSubmitting(false); return; }
            const updated = await res.json();
            setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
            setEditTarget(null);
        } catch { alert('Server error'); }
        setSubmitting(false);
    };

    /* ── approve quote ── */
    const approveQuote = async (id) => {
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/service-bookings/${id}/approve-quote`, {
                method: 'PATCH',
                headers: authH,
            });
            if (!res.ok) throw new Error('Failed to approve quote');
            const updated = await res.json();
            const normalized = { ...updated, id: updated.id || updated._id };
            setBookings(prev => prev.map(b => b.id === normalized.id ? normalized : b));
        } catch (e) {
            console.error('Approve failed:', e);
            alert(`Approve failed: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── delete (cancel) booking ── */
    const confirmDelete = async () => {
        try {
            await fetch(`${API}/service-bookings/${deleteId}`, { method: 'DELETE', headers: authH });
            setBookings(prev => prev.filter(b => b.id !== deleteId));
        } catch { alert('Delete failed'); }
        setDeleteId(null);
    };

    return (
        <div style={{ ...S.root, padding: isDashboardView ? '24px 20px 60px' : S.root.padding }}>
            <div style={S.container}>
                <header style={S.header}>
                    <h1 style={S.pageTitle}>My Service Requests</h1>
                    <p style={S.subtitle}>
                        Track and manage your construction &amp; development service bookings.
                        To book a new service, browse a land listing and click the <strong>Construction Services</strong> tab.
                    </p>
                </header>

                {/* ── My Bookings list ── */}
                <section>
                    {!token ? (
                        <div style={S.empty}>
                            Please <a href="/login" style={{ color: '#1A1A1A', fontWeight: '700' }}>log in</a> to view your bookings.
                        </div>
                    ) : loading ? (
                        <div style={S.empty}>Loading…</div>
                    ) : bookings.length === 0 ? (
                        <div style={S.empty}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📋</div>
                            <div style={{ fontWeight: '700', color: '#333', fontSize: '1.1rem', marginBottom: '8px' }}>No service requests yet</div>
                            <div style={{ fontSize: '0.9rem', color: '#999', maxWidth: '380px', margin: '0 auto' }}>
                                Browse a land listing and click "Book Now" on the <strong>Construction Services</strong> tab to get started.
                            </div>
                            <a href="/lands" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 28px', background: '#1A1A1A', color: '#fff', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
                                Browse Lands →
                            </a>
                        </div>
                    ) : (
                        <div style={S.bookingList}>
                            {bookings.map(b => {
                                const sc = STATUS_STYLE[b.status] || STATUS_STYLE.Scheduled;
                                const canEdit = b.status === 'Pending';
                                return (
                                    <div key={b.id} style={S.bookingCard}>
                                        <div style={S.bCardTop}>
                                            <div>
                                                <h3 style={S.bService}>{b.service_type}</h3>
                                                <p style={S.bId}>
                                                    Booking #{b.id}
                                                    {b.land_name ? ` · ${b.land_name}` : ''}
                                                </p>
                                            </div>
                                            <span style={{ ...S.badge, background: sc.bg, color: sc.color }}>{b.status}</span>
                                        </div>
                                        <div style={S.bGrid}>
                                            <div style={S.bCell}><span style={S.bLabel}>📅 Date</span><span style={S.bVal}>{b.preferred_date}</span></div>
                                            <div style={S.bCell}><span style={S.bLabel}>🕐 Time</span><span style={S.bVal}>{b.preferred_time}</span></div>
                                            <div style={S.bCell}><span style={S.bLabel}>📋 Status</span><span style={S.bVal}>{b.status}</span></div>
                                            <div style={S.bCell}><span style={S.bLabel}>👷 Team</span><span style={S.bVal}>{b.constructor_name || 'Awaiting assignment'}</span></div>
                                        </div>
                                        {b.constructor_name && (
                                            <div style={S.teamInfo}>
                                                <div><strong>Assigned Team:</strong> {b.constructor_name}</div>
                                                <div>{b.constructor_phone ? `Phone: ${b.constructor_phone}` : ''}{b.constructor_phone && b.constructor_email ? ' | ' : ''}{b.constructor_email ? `Email: ${b.constructor_email}` : ''}</div>
                                            </div>
                                        )}

                                        {/* ── Quote Section ── */}
                                        {b.quote_amount && (
                                            <div style={{ ...S.quoteBox, border: b.status === 'Quote Submitted' ? '2px solid #3B82F6' : '1px solid #E5E7EB' }}>
                                                <div style={S.quoteTitle}>💰 Professional Quote Received</div>
                                                <div style={S.quoteAmount}>Rs. {b.quote_amount.toLocaleString()}</div>
                                                {b.quote_notes && <div style={S.quoteNotes}>"{b.quote_notes}"</div>}
                                                
                                                {b.status === 'Quote Submitted' && (
                                                    <button 
                                                        style={S.approveBtn} 
                                                        disabled={submitting}
                                                        onClick={() => approveQuote(b.id)}
                                                    >
                                                        {submitting ? 'Processing...' : 'Approve & Start Project'}
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Progress Section ── */}
                                        {b.status === 'Accepted' && (
                                            <div style={S.progressSection}>
                                                <div style={S.progressTop}>
                                                    <span style={S.progressLabel}>Project Progress</span>
                                                    <span style={S.progressPct}>
                                                        {b.milestones?.length > 0 
                                                            ? Math.round((b.milestones.filter(m => m.is_completed).length / b.milestones.length) * 100) 
                                                            : 0}%
                                                    </span>
                                                </div>
                                                <div style={S.progressBarBg}>
                                                    <div style={{ 
                                                        ...S.progressBarFill, 
                                                        width: `${b.milestones?.length > 0 ? (b.milestones.filter(m => m.is_completed).length / b.milestones.length) * 100 : 0}%` 
                                                    }} />
                                                </div>
                                                <div style={S.milestoneList}>
                                                    {b.milestones?.map(m => (
                                                        <div key={m.id} style={S.milestoneItem}>
                                                            <span style={{ color: m.is_completed ? '#059669' : '#9CA3AF' }}>
                                                                {m.is_completed ? '✅' : '⚪️'}
                                                            </span>
                                                            <span style={{ 
                                                                fontSize: '0.85rem', 
                                                                textDecoration: m.is_completed ? 'line-through' : 'none',
                                                                color: m.is_completed ? '#6B7280' : '#1F2937'
                                                            }}>
                                                                {m.title}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {b.notes && <p style={S.bNotes}>"{b.notes}"</p>}
                                        <p style={S.bDate}>Submitted: {new Date(b.created_at).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                                        {canEdit && (
                                            <div style={S.bActions}>
                                                <button style={S.editBtn} onClick={() => openEdit(b)}>Edit Request</button>
                                                <button style={S.deleteBtn} onClick={() => setDeleteId(b.id)}>Cancel Request</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* ═══ Edit Modal ═══ */}
            {editTarget && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <button style={S.closeX} onClick={() => setEditTarget(null)}>✕</button>
                        <h2 style={S.modalTitle}>Edit Booking #{editTarget.id}</h2>
                        <p style={{ fontSize: '0.85rem', color: '#888', marginBottom: '20px' }}>{editTarget.service_type}</p>
                        <div style={S.formGroup}>
                            <label style={S.lbl}>Preferred Date</label>
                            <input type="date" style={S.inp} value={editForm.preferred_date}
                                onChange={e => setEditForm({ ...editForm, preferred_date: e.target.value })} />
                        </div>
                        <div style={S.formGroup}>
                            <label style={S.lbl}>Preferred Time</label>
                            <input type="time" style={S.inp} value={editForm.preferred_time}
                                onChange={e => setEditForm({ ...editForm, preferred_time: e.target.value })} />
                        </div>
                        <div style={S.formGroup}>
                            <label style={S.lbl}>Notes (optional)</label>
                            <textarea style={{ ...S.inp, height: '80px', resize: 'vertical' }} value={editForm.notes}
                                onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                        </div>
                        <div style={S.modalBtns}>
                            <button style={S.backBtn} onClick={() => setEditTarget(null)}>Cancel</button>
                            <button style={S.nextBtn} disabled={submitting} onClick={saveEdit}>
                                {submitting ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Cancel Confirm Modal ═══ */}
            {deleteId && (
                <div style={S.overlay}>
                    <div style={{ ...S.modal, textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
                        <h2 style={S.modalTitle}>Cancel this Booking?</h2>
                        <p style={{ color: '#666', marginBottom: '28px', fontSize: '0.9rem' }}>
                            This will permanently remove your service request and cannot be undone.
                        </p>
                        <div style={S.modalBtns}>
                            <button style={S.backBtn} onClick={() => setDeleteId(null)}>Go Back</button>
                            <button style={{ ...S.nextBtn, background: '#c62828' }} onClick={confirmDelete}>
                                Yes, Cancel Request
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
    container: { maxWidth: '1000px', margin: '0 auto' },
    header: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '40px' },
    pageTitle: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem', fontWeight: '500', maxWidth: '700px', lineHeight: '1.6' },

    bookingList: { display: 'flex', flexDirection: 'column', gap: '24px' },
    bookingCard: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' },
    bCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    bService: { fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    bId: { fontSize: '0.75rem', color: '#BBB', margin: '4px 0 0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    badge: { padding: '6px 14px', borderRadius: '8px', fontWeight: '800', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    
    bGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
    bCell: { background: 'var(--color-bg)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' },
    bLabel: { fontSize: '0.68rem', color: '#AAA', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' },
    bVal: { fontSize: '0.92rem', fontWeight: '700', color: 'var(--color-dark)' },
    
    teamInfo: { backgroundColor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '16px', padding: '20px', color: '#3730A3', marginBottom: '20px', fontSize: '0.9rem' },
    bNotes: { fontStyle: 'italic', color: '#666', fontSize: '0.9rem', backgroundColor: 'var(--color-bg)', padding: '16px', borderRadius: '16px', marginBottom: '20px', borderLeft: '4px solid var(--color-border)' },
    bDate: { fontSize: '0.72rem', color: '#BBB', fontWeight: '600', marginBottom: '24px', display: 'block' },
    
    bActions: { display: 'flex', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '24px', marginTop: 'auto' },
    editBtn: { padding: '10px 24px', background: 'var(--color-dark)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s' },
    deleteBtn: { padding: '10px 24px', background: 'transparent', color: '#e74c3c', border: '1.5px solid #ffccbc', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', transition: 'all 0.2s' },

    empty: { textAlign: 'center', padding: '100px 40px', background: '#fff', borderRadius: '32px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-elevated)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '24px' },
    closeX: { position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },
    modalTitle: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    lbl: { fontSize: '0.72rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.08em' },
    inp: { padding: '16px', borderRadius: '16px', border: '1.5px solid var(--color-border)', background: '#fff', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
    modalBtns: { display: 'flex', gap: '12px', marginTop: '8px' },
    backBtn: { flex: 1, padding: '16px', background: 'var(--color-bg)', color: '#666', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' },
    nextBtn: { flex: 2, padding: '16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer' },
    
    quoteBox: { marginTop: '20px', padding: '24px', borderRadius: '20px', background: '#F8F9FA', border: '1px solid var(--color-border)' },
    quoteTitle: { fontSize: '0.68rem', fontWeight: '800', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' },
    quoteAmount: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '12px' },
    quoteNotes: { fontSize: '0.92rem', color: '#64748B', fontStyle: 'italic', marginBottom: '20px', padding: '12px', background: '#fff', borderRadius: '12px' },
    approveBtn: { width: '100%', padding: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', fontSize: '0.95rem' },
    
    progressSection: { marginTop: '24px', padding: '24px', background: '#fff', border: '1px solid var(--color-border)', borderRadius: '20px' },
    progressTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    progressLabel: { fontSize: '0.85rem', fontWeight: '800', color: 'var(--color-dark)' },
    progressPct: { fontSize: '0.85rem', fontWeight: '900', color: 'var(--color-primary)' },
    progressBarBg: { height: '10px', background: 'var(--color-bg)', borderRadius: '5px', overflow: 'hidden', marginBottom: '20px' },
    progressBarFill: { height: '100%', background: 'var(--color-primary)', borderRadius: '5px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' },
    milestoneList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    milestoneItem: { display: 'flex', alignItems: 'center', gap: '10px' },
};

export default ServiceBookingPage;
