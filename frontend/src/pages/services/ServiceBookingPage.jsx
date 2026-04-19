import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';
import toast from 'react-hot-toast';

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
            if (!res.ok) { const e = await res.json(); toast.error(e.detail || 'Failed to save changes'); setSubmitting(false); return; }
            const updated = await res.json();
            setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
            setEditTarget(null);
            toast.success('Service request updated');
        } catch { toast.error('Server error'); }
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
            toast.success('Quote approved! Construction starting.');
        } catch (e) {
            console.error('Approve failed:', e);
            toast.error(`Approve failed: ${e.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    /* ── delete (cancel) booking ── */
    const confirmDelete = async () => {
        try {
            const res = await fetch(`${API}/service-bookings/${deleteId}`, { method: 'DELETE', headers: authH });
            if (!res.ok) throw new Error('Delete failed');
            setBookings(prev => prev.filter(b => b.id !== deleteId));
            toast.success('Request cancelled successfully');
        } catch { toast.error('Failed to cancel request'); }
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
        bookingList: { display: 'flex', flexDirection: 'column', gap: '32px' },
    bookingCard: { background: '#fff', borderRadius: '32px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease' },
    bCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '1px solid #F1F5F9', paddingBottom: '24px' },
    bService: { fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0, letterSpacing: '-0.02em' },
    bId: { fontSize: '0.7rem', color: '#94A3B8', margin: '6px 0 0', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' },
    badge: { padding: '8px 16px', borderRadius: '10px', fontWeight: '900', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
    
    bGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
    bCell: { background: '#F8FAFC', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid #F1F5F9' },
    bLabel: { fontSize: '0.65rem', color: '#94A3B8', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' },
    bVal: { fontSize: '1rem', fontWeight: '700', color: 'var(--color-dark)' },
    
    teamInfo: { backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '20px', padding: '24px', color: '#0369A1', marginBottom: '24px', fontSize: '0.92rem', fontWeight: '500' },
    bNotes: { fontStyle: 'normal', color: '#64748B', fontSize: '0.95rem', backgroundColor: '#F8FAFC', padding: '24px', borderRadius: '24px', marginBottom: '24px', borderLeft: '4px solid var(--color-primary)', lineHeight: '1.6' },
    bDate: { fontSize: '0.8rem', color: '#94A3B8', fontWeight: '600' },
    
    bActions: { display: 'flex', gap: '12px' },
    editBtn: { padding: '10px 20px', background: 'var(--color-dark)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
    deleteBtn: { padding: '10px 20px', background: 'transparent', color: '#EF4444', border: '1.5px solid #FEE2E2', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },

    empty: { textAlign: 'center', padding: '120px 40px', background: '#fff', borderRadius: '40px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' },
    modal: { background: '#fff', borderRadius: '40px', padding: '48px', width: '100%', maxWidth: '540px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative', display: 'flex', flexDirection: 'column', gap: '32px' },
    closeX: { position: 'absolute', top: '32px', right: '32px', background: '#F1F5F9', border: 'none', fontSize: '1rem', cursor: 'pointer', color: '#64748B', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
    modalTitle: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0, letterSpacing: '-0.02em' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '10px' },
    lbl: { fontSize: '0.72rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em' },
    inp: { padding: '18px', borderRadius: '20px', border: '1.5px solid #E2E8F0', background: '#F8FAFC', fontSize: '1rem', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'all 0.2s' },
    modalBtns: { display: 'flex', gap: '16px', marginTop: '12px' },
    backBtn: { flex: 1, padding: '18px', background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s' },
    nextBtn: { flex: 2, padding: '18px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 15px -3px rgba(76, 175, 80, 0.3)' },
    
    quoteBox: { marginTop: '32px', padding: '32px', borderRadius: '28px', background: '#fff', border: '1px solid var(--color-border)', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
    quoteTitle: { fontSize: '0.7rem', fontWeight: '900', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' },
    quoteAmount: { fontSize: '2.4rem', fontWeight: '900', color: 'var(--color-dark)', marginBottom: '16px', letterSpacing: '-0.02em' },
    quoteNotes: { fontSize: '1rem', color: '#64748B', fontStyle: 'italic', marginBottom: '28px', padding: '20px', background: '#F8FAFC', borderRadius: '20px', border: '1px dashed #E2E8F0', lineHeight: '1.5' },
    approveBtn: { width: '100%', padding: '20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '20px', fontWeight: '800', cursor: 'pointer', fontSize: '1.05rem', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 10px 15px -3px rgba(76, 175, 80, 0.4)' },
    
    progressSection: { marginTop: '32px', padding: '32px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '28px' },
    progressTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'baseline' },
    progressLabel: { fontSize: '1rem', fontWeight: '800', color: 'var(--color-dark)' },
    progressPct: { fontSize: '1.1rem', fontWeight: '900', color: 'var(--color-primary)' },
    progressBarBg: { height: '12px', background: '#E2E8F0', borderRadius: '10px', overflow: 'hidden', marginBottom: '32px' },
    progressBarFill: { height: '100%', background: 'var(--color-primary)', borderRadius: '10px', transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' },
    milestoneList: { display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '4px' },
    milestoneItem: { display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 },
};

export default ServiceBookingPage;
