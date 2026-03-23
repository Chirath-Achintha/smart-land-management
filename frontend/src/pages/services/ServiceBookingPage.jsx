import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Requested: { bg: 'rgba(33, 150, 243, 0.12)', color: '#145b97' },
    Approved: { bg: 'rgba(76, 175, 80, 0.14)', color: '#2e7d32' },
    Scheduled: { bg: 'rgba(33, 150, 243, 0.18)', color: '#0d47a1' },
    'In Progress': { bg: 'rgba(139, 195, 74, 0.22)', color: '#3f6e10' },
    Completed: { bg: 'rgba(76, 175, 80, 0.2)', color: '#1b5e20' },
    Cancelled: { bg: 'rgba(161, 136, 127, 0.24)', color: '#7a4f41' },
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
            .then(d => setBookings(Array.isArray(d) ? d : []))
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
                    <div>
                        <h1 style={S.pageTitle}>My Service Requests</h1>
                        <p style={S.subtitle}>
                            Track and manage your construction &amp; development service bookings.
                            To book a new service, browse a land listing and click the <strong>Construction Services</strong> tab.
                        </p>
                    </div>
                    <div style={S.countBadge}>{bookings.length} total</div>
                </header>

                {/* ── My Bookings list ── */}
                <section>
                    {!token ? (
                        <div style={S.empty}>
                            Please <a href="/login" style={{ color: 'var(--color-primary)', fontWeight: '700' }}>log in</a> to view your bookings.
                        </div>
                    ) : loading ? (
                        <div style={S.empty}>Loading…</div>
                    ) : bookings.length === 0 ? (
                        <div style={S.empty}>
                            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📋</div>
                            <div style={{ fontWeight: '700', color: 'var(--color-dark)', fontSize: '1.1rem', marginBottom: '8px' }}>No service requests yet</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)', maxWidth: '380px', margin: '0 auto' }}>
                                Browse a land listing and click "Book Now" on the <strong>Construction Services</strong> tab to get started.
                            </div>
                            <a href="/lands" style={{ display: 'inline-block', marginTop: '24px', padding: '12px 28px', background: 'var(--color-primary)', color: '#fff', borderRadius: '12px', fontWeight: '700', textDecoration: 'none', fontSize: '0.9rem' }}>
                                Browse Lands →
                            </a>
                        </div>
                    ) : (
                        <div style={S.bookingList}>
                            {bookings.map(b => {
                                const sc = STATUS_STYLE[b.status] || STATUS_STYLE.Scheduled;
                                const canEdit = b.status === 'Requested' || b.status === 'Scheduled';
                                return (
                                    <div key={b.id} className="ui-card ui-lift" style={S.bookingCard}>
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
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '20px' }}>{editTarget.service_type}</p>
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
                            <button style={{ ...S.nextBtn, background: 'var(--color-accent)' }} onClick={confirmDelete}>
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
    root: { background: 'var(--color-bg)', minHeight: '100vh', padding: '100px 20px 60px', fontFamily: "'DM Sans', sans-serif" },
    container: { maxWidth: '900px', margin: '0 auto' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '34px' },
    pageTitle: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '10px' },
    subtitle: { fontSize: '1rem', color: 'var(--color-muted)', lineHeight: '1.6', maxWidth: '640px', margin: 0 },
    countBadge: { background: 'var(--color-dark)', color: '#fff', borderRadius: '20px', padding: '8px 16px', fontWeight: '700', fontSize: '0.9rem' },

    bookingList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    bookingCard: { background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)' },
    bCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
    bService: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    bId: { fontSize: '0.78rem', color: 'var(--color-muted)', margin: '4px 0 0', fontWeight: '600' },
    badge: { padding: '5px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.78rem' },
    bGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px', marginBottom: '16px' },
    bCell: { background: 'rgba(33, 150, 243, 0.08)', borderRadius: '10px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '4px' },
    bLabel: { fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: '700' },
    bVal: { fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-dark)' },
    teamInfo: { backgroundColor: 'rgba(76, 175, 80, 0.12)', border: '1px solid rgba(76, 175, 80, 0.28)', borderRadius: '10px', padding: '10px 14px', color: '#215a2d', marginBottom: '12px', fontSize: '0.86rem' },
    bNotes: { fontStyle: 'italic', color: 'var(--color-muted)', fontSize: '0.88rem', backgroundColor: 'rgba(161, 136, 127, 0.12)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px' },
    bDate: { fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '16px' },
    bActions: { display: 'flex', gap: '12px' },
    editBtn: { padding: '9px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
    deleteBtn: { padding: '9px 20px', background: 'transparent', color: '#7a4f41', border: '1.5px solid rgba(161, 136, 127, 0.45)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },

    empty: { textAlign: 'center', padding: '80px 40px', color: 'var(--color-muted)', background: '#fff', borderRadius: '20px', lineHeight: '1.6', border: '1px solid rgba(38, 50, 56, 0.1)' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(38, 50, 56, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: '28px', padding: '40px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 60px rgba(38, 50, 56, 0.2)', position: 'relative', border: '1px solid rgba(38, 50, 56, 0.12)' },
    closeX: { position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--color-muted)' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' },
    lbl: { fontSize: '0.88rem', fontWeight: '700', color: 'var(--color-dark)' },
    inp: { padding: '13px', borderRadius: '10px', border: '1px solid rgba(38, 50, 56, 0.16)', background: '#fff', fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
    modalBtns: { display: 'flex', gap: '12px', marginTop: '8px' },
    backBtn: { flex: 1, padding: '13px', background: 'rgba(38, 50, 56, 0.08)', color: 'var(--color-dark)', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    nextBtn: { flex: 2, padding: '13px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
};

export default ServiceBookingPage;
