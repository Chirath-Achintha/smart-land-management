import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Pending: { bg: '#FEF3C7', color: '#92400E' },
    'Quote Submitted': { bg: '#DBEAFE', color: '#1E40AF' },
    Accepted: { bg: '#E0F2FE', color: '#0369A1' },
    'In Progress': { bg: '#FFF3E0', color: '#e65100' },
    Completed: { bg: '#E8F5E9', color: '#2e7d32' },
    Cancelled: { bg: '#FFEBEE', color: '#c62828' },
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
                                const canEdit = b.status === 'Requested' || b.status === 'Scheduled';
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
    root: { background: '#FAF6F1', minHeight: '100vh', padding: '100px 20px 60px', fontFamily: "'DM Sans', sans-serif" },
    container: { maxWidth: '900px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: '48px' },
    pageTitle: { fontSize: '2.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '10px' },
    subtitle: { fontSize: '1rem', color: '#666', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' },

    bookingList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    bookingCard: { background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
    bCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    bService: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    bId: { fontSize: '0.78rem', color: '#AAA', margin: '4px 0 0', fontWeight: '600' },
    badge: { padding: '5px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.78rem' },
    bGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '16px' },
    bCell: { background: '#FAF6F1', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px' },
    bLabel: { fontSize: '0.72rem', color: '#999', fontWeight: '700' },
    bVal: { fontSize: '0.95rem', fontWeight: '700', color: '#1A1A1A' },
    teamInfo: { backgroundColor: '#eff6ff', border: '1px solid #dbeafe', borderRadius: '10px', padding: '10px 14px', color: '#1e3a8a', marginBottom: '12px', fontSize: '0.86rem' },
    bNotes: { fontStyle: 'italic', color: '#666', fontSize: '0.88rem', backgroundColor: '#FAF6F1', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' },
    bDate: { fontSize: '0.75rem', color: '#CCC', marginBottom: '16px' },
    bActions: { display: 'flex', gap: '12px' },
    editBtn: { padding: '9px 20px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
    deleteBtn: { padding: '9px 20px', background: 'transparent', color: '#c62828', border: '1.5px solid #ef9a9a', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },

    empty: { textAlign: 'center', padding: '80px 40px', color: '#AAA', background: '#fff', borderRadius: '20px', lineHeight: '1.6' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: '28px', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)', position: 'relative' },
    closeX: { position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#AAA' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    lbl: { fontSize: '0.88rem', fontWeight: '700', color: '#333' },
    inp: { padding: '13px', borderRadius: '10px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
    modalBtns: { display: 'flex', gap: '12px', marginTop: '8px' },
    backBtn: { flex: 1, padding: '13px', background: '#F5F5F5', color: '#333', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    nextBtn: { flex: 2, padding: '13px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    
    quoteBox: { marginTop: '16px', padding: '20px', borderRadius: '14px', background: '#F8FAFC' },
    quoteTitle: { fontSize: '0.75rem', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
    quoteAmount: { fontSize: '1.5rem', fontWeight: '800', color: '#1E293B', marginBottom: '8px' },
    quoteNotes: { fontSize: '0.9rem', color: '#475569', fontStyle: 'italic', marginBottom: '16px' },
    approveBtn: { width: '100%', padding: '12px', background: '#2563EB', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem' },
    
    progressSection: { marginTop: '20px', padding: '20px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '16px' },
    progressTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    progressLabel: { fontSize: '0.85rem', fontWeight: '700', color: '#374151' },
    progressPct: { fontSize: '0.85rem', fontWeight: '800', color: '#2563EB' },
    progressBarBg: { height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' },
    progressBarFill: { height: '100%', background: 'linear-gradient(90deg, #3B82F6 0%, #2563EB 100%)', borderRadius: '4px', transition: 'width 0.4s ease' },
    milestoneList: { display: 'flex', flexDirection: 'column', gap: '8px' },
    milestoneItem: { display: 'flex', alignItems: 'center', gap: '8px' },
};

export default ServiceBookingPage;
