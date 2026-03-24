import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';
import toast from 'react-hot-toast';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Pending: { bg: '#FFF8E1', color: '#B45309' },
    'Quote Submitted': { bg: '#E0F2FE', color: '#0369A1' },
};

const toErrorMessage = (payload, fallback) => {
    const detail = payload?.detail ?? payload?.message ?? payload;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
        const msg = detail
            .map((item) => (typeof item === 'string' ? item : item?.msg || ''))
            .filter(Boolean)
            .join(', ');
        return msg || fallback;
    }
    return fallback;
};

const normalizeBooking = (booking) => ({
    ...booking,
    id: booking?.id || booking?._id || '',
});

const ConstructorServiceBookingsPage = () => {
    const token = localStorage.getItem('access_token');
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(null);
    const [updating, setUpdating] = useState(null);
    const [quoteModal, setQuoteModal] = useState(null);
    const [quoteData, setQuoteData] = useState({ amount: '', notes: '' });

    const fetchBookings = () => {
        fetch(`${API}/service-bookings/assigned`, { headers: authH })
            .then(r => r.json().then((body) => ({ ok: r.ok, body })))
            .then(({ ok, body }) => {
                if (!ok) throw new Error(toErrorMessage(body, 'Failed to load service requests'));
                const normalized = (Array.isArray(body) ? body : []).map(normalizeBooking);
                // Keep 'Pending' and 'Quote Submitted' requests for the Inbox
                const inboxBookings = normalized.filter(b => b.status === "Pending" || b.status === "Quote Submitted");
                setBookings(inboxBookings);
            })
            .catch(() => setBookings([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchBookings(); }, []);

    useEffect(() => {
        if (!token) return undefined;
        const intervalId = setInterval(fetchBookings, 15000);
        const onFocus = () => fetchBookings();
        window.addEventListener('focus', onFocus);
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
        };
    }, [token]);

    const submitQuote = async (id) => {
        if (!quoteData.amount || isNaN(quoteData.amount) || parseFloat(quoteData.amount) <= 0) {
            toast.error('Please enter a valid positive amount');
            return;
        }
        setUpdating(id);
        try {
            const res = await fetch(`${API}/service-bookings/${id}/quote`, {
                method: 'POST',
                headers: authH,
                body: JSON.stringify({
                    quote_amount: parseFloat(quoteData.amount),
                    quote_notes: quoteData.notes
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(toErrorMessage(data, 'Failed to submit quote'));
                setUpdating(null);
                return;
            }

            toast.success('Quote submitted! Awaiting buyer approval.');
            fetchBookings(); // Refresh list
            setQuoteModal(null);
            setQuoteData({ amount: '', notes: '' });
        } catch {
            toast.error('Server error while submitting quote');
        }
        setUpdating(null);
    };

    const updateStatus = async (id, newStatus) => {
        setUpdating(id);
        try {
            const res = await fetch(`${API}/service-bookings/${id}/status`, {
                method: 'PUT',
                headers: authH,
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(toErrorMessage(data, 'Failed to update request status'));
                setUpdating(null);
                return;
            }

            toast.success(`Request ${newStatus}!`);
            // Remove it from the list because it's no longer Pending
            setBookings(prev => prev.filter(b => b.id !== id));
            if (active?.id === id) setActive(null); // close modal
        } catch {
            toast.error('Server error while updating request status');
        }
        setUpdating(null);
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Incoming Requests</h1>
                    <p style={S.subtitle}>Review new construction project requests. Accept them to move them to your Projects page.</p>
                </div>
                <span style={S.countBadge}>{bookings.length} New</span>
            </div>

            {loading ? (
                <div style={S.empty}>Loading pending requests…</div>
            ) : bookings.length === 0 ? (
                <div style={S.emptyBox}>
                    <h3 style={{marginTop: 0, color: '#111827'}}>You're all caught up!</h3>
                    <p style={{margin: 0}}>There are no new pending requests assigned to your team.</p>
                </div>
            ) : (
                <div style={S.gridContainer}>
                    {bookings.map(b => (
                        <div key={b.id} style={S.card}>
                            <div style={S.cardTop}>
                                <span style={S.idBadge}>#{b.id.substring(b.id.length - 6).toUpperCase()}</span>
                                <span style={{ ...S.statusPill, ...STATUS_STYLE[b.status] }}>{b.status}</span>
                            </div>
                            <h3 style={S.cardTitle}>{b.service_type}</h3>
                            <div style={S.cardInfo}>
                                <div style={S.infoGroup}>
                                    <span style={S.infoLabel}>Buyer</span>
                                    <span style={S.infoValue}>{b.buyer_name || `Buyer #${b.buyer_id}`}</span>
                                </div>
                                <div style={S.infoGroup}>
                                    <span style={S.infoLabel}>Land Details</span>
                                    <span style={S.infoValue}>{b.land_name || 'N/A'} {b.land_district ? `(${b.land_district})` : ''}</span>
                                </div>
                                {b.status === 'Quote Submitted' && (
                                    <div style={S.quoteBadge}>
                                        💰 Quote: Rs. {b.quote_amount.toLocaleString()}
                                    </div>
                                )}
                            </div>
                            
                            <div style={S.cardActions}>
                                <button style={S.viewBtn} onClick={() => setActive(b)}>View Details</button>
                                {b.status === 'Pending' ? (
                                    <div style={{display: 'flex', gap: '8px', flex: 1}}>
                                        <button style={S.acceptBtn} disabled={updating === b.id}
                                            onClick={() => setQuoteModal(b)}>
                                            {updating === b.id ? '...' : 'Send Quote'}
                                        </button>
                                        <button style={S.rejectBtn} disabled={updating === b.id}
                                            onClick={() => updateStatus(b.id, 'Cancelled')}>
                                            {updating === b.id ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                ) : (
                                    <button style={S.waitingBtn} disabled>Awaiting Buyer Approval</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Detail Modal */}
            {active && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <div style={S.modalHead}>
                            <h2 style={S.modalTitle}>Request #{String(active.id).substring(String(active.id).length - 6).toUpperCase()}</h2>
                            <button style={S.closeX} onClick={() => setActive(null)}>✕</button>
                        </div>
                        <div style={S.modalBody}>
                            <div style={S.mGrid}>
                                <div><span style={S.mLabel}>Service</span><p style={S.mVal}>{active.service_type}</p></div>
                                <div><span style={S.mLabel}>Status</span><p style={S.mVal}>{active.status}</p></div>
                                <div><span style={S.mLabel}>Buyer</span><p style={S.mVal}>{active.buyer_name || `#${active.buyer_id}`}</p></div>
                                <div><span style={S.mLabel}>Land</span><p style={S.mVal}>{active.land_name || 'N/A'}</p></div>
                                <div><span style={S.mLabel}>Date</span><p style={S.mVal}>{active.preferred_date}</p></div>
                                <div><span style={S.mLabel}>Time</span><p style={S.mVal}>{active.preferred_time}</p></div>
                            </div>
                            {active.notes && <div style={S.notesBox}>📝 {active.notes}</div>}
                        </div>
                        <div style={S.modalFoot}>
                            {active.status === 'Pending' ? (
                                <>
                                    <button style={S.mAcceptBtn} disabled={updating === active.id}
                                        onClick={() => { setQuoteModal(active); setActive(null); }}>
                                        {updating === active.id ? '...' : 'Send Quote'}
                                    </button>
                                    <button style={S.mRejectBtn} disabled={updating === active.id}
                                        onClick={() => updateStatus(active.id, 'Cancelled')}>
                                        {updating === active.id ? '...' : 'Reject Project'}
                                    </button>
                                </>
                            ) : (
                                <button style={{ ...S.mAcceptBtn, background: '#9CA3AF' }} disabled>
                                    Waiting for Buyer...
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Quote Modal */}
            {quoteModal && (
                <div style={S.overlay}>
                    <div style={{ ...S.modal, maxWidth: '440px' }}>
                        <div style={S.modalHead}>
                            <h2 style={S.modalTitle}>Submit Quote</h2>
                            <button style={S.closeX} onClick={() => setQuoteModal(null)}>✕</button>
                        </div>
                        <div style={S.modalBody}>
                            <p style={{ margin: '0 0 20px', fontSize: '0.9rem', color: '#666' }}>
                                Proposal for <strong>{quoteModal.service_type}</strong>
                            </p>
                            <div style={S.formGroup}>
                                <label style={S.label}>Quote Amount (Rs.)</label>
                                <input 
                                    style={S.input}
                                    type="number"
                                    min="1"
                                    placeholder="e.g. 500000"
                                    value={quoteData.amount}
                                    onChange={e => setQuoteData({ ...quoteData, amount: e.target.value })}
                                />
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Note to Buyer (optional)</label>
                                <textarea 
                                    style={S.textarea}
                                    placeholder="Explain your quote or estimated timeline..."
                                    value={quoteData.notes}
                                    onChange={e => setQuoteData({ ...quoteData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                        <div style={S.modalFoot}>
                            <button style={S.mAcceptBtn} disabled={updating === quoteModal.id}
                                onClick={() => submitQuote(quoteModal.id)}>
                                {updating === quoteModal.id ? 'Submitting...' : 'Submit Quote to Buyer'}
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
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0, letterSpacing: '-0.02em' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem', fontWeight: '500', marginTop: '6px' },
    countBadge: { background: 'var(--color-primary)', color: '#fff', borderRadius: '30px', padding: '8px 20px', fontWeight: '800', fontSize: '0.85rem' },
    
    empty: { textAlign: 'center', color: '#BBB', padding: '100px 40px', background: '#fff', borderRadius: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)' },
    emptyBox: { textAlign: 'center', color: 'var(--color-text-soft)', padding: '100px 40px', background: '#fff', borderRadius: '32px', border: '1px dashed var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' },
    
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },
    card: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '20px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' },
    idBadge: { background: 'var(--color-bg)', color: '#AAA', padding: '4px 10px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statusPill: { fontSize: '0.68rem', fontWeight: '900', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    
    cardTitle: { margin: 0, fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-dark)' },
    cardInfo: { display: 'flex', flexDirection: 'column', gap: '14px', background: 'var(--color-bg)', padding: '20px', borderRadius: '16px' },
    infoGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    infoLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.08em' },
    infoValue: { fontSize: '0.92rem', fontWeight: '700', color: 'var(--color-dark)' },
    
    cardActions: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '20px' },
    viewBtn: { padding: '12px', background: 'var(--color-bg)', color: '#666', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
    acceptBtn: { flex: 1, padding: '12px', background: 'var(--color-dark)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
    rejectBtn: { flex: 1, padding: '12px', background: 'transparent', color: '#e74c3c', border: '1.5px solid #ffccbc', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '560px', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', gap: '24px' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    closeX: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },
    modalBody: { display: 'flex', flexDirection: 'column', gap: '20px' },
    mGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    mLabel: { fontSize: '0.72rem', color: '#AAA', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em' },
    mVal: { fontWeight: '700', color: 'var(--color-dark)', margin: '4px 0 0', fontSize: '0.95rem' },
    notesBox: { background: 'var(--color-bg)', borderRadius: '16px', padding: '20px', fontSize: '0.92rem', color: '#444', lineHeight: '1.6', border: '1px solid var(--color-border)', borderLeft: '4px solid var(--color-primary)' },
    modalFoot: { display: 'flex', gap: '14px' },
    mAcceptBtn: { flex: 1, padding: '16px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' },
    mRejectBtn: { flex: 1, padding: '16px', background: 'var(--color-bg)', color: '#e74c3c', border: '1px solid #ffccbc', borderRadius: '16px', fontWeight: '800', cursor: 'pointer', fontSize: '1rem' },
    
    quoteBadge: { background: '#ECFDF5', color: '#047857', padding: '12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', marginTop: '4px', border: '1px solid #A7F3D0' },
    waitingBtn: { width: '100%', padding: '12px', background: 'var(--color-bg)', color: '#BBB', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'not-allowed', fontSize: '0.85rem' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.72rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.08em' },
    input: { width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxSizing: 'border-box', fontSize: '1rem', outline: 'none' },
    textarea: { width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxSizing: 'border-box', height: '120px', resize: 'none', fontSize: '1rem', outline: 'none' },
};

export default ConstructorServiceBookingsPage;
