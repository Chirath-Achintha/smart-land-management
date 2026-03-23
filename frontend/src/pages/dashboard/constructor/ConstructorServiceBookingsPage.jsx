import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';
import toast from 'react-hot-toast';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Pending: { color: '#92400e', background: '#FEF3C7' },
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
    const [animatedRows, setAnimatedRows] = useState({});

    const fetchBookings = () => {
        fetch(`${API}/service-bookings/assigned`, { headers: authH })
            .then(r => r.json().then((body) => ({ ok: r.ok, body })))
            .then(({ ok, body }) => {
                if (!ok) throw new Error(toErrorMessage(body, 'Failed to load service requests'));
                const normalized = (Array.isArray(body) ? body : []).map(normalizeBooking);
                // ONLY keep 'Pending' requests for the Inbox
                const pendingOnly = normalized.filter(b => b.status === "Pending");
                setBookings(pendingOnly);
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
                                <span style={S.dateBadge}>{b.preferred_date}</span>
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
                            </div>
                            
                            <div style={S.cardActions}>
                                <button style={S.viewBtn} onClick={() => setActive(b)}>View Details</button>
                                <div style={{display: 'flex', gap: '8px', flex: 1}}>
                                    <button style={S.acceptBtn} disabled={updating === b.id}
                                        onClick={() => updateStatus(b.id, 'Accepted')}>
                                        {updating === b.id ? '...' : 'Accept'}
                                    </button>
                                    <button style={S.rejectBtn} disabled={updating === b.id}
                                        onClick={() => updateStatus(b.id, 'Cancelled')}>
                                        {updating === b.id ? '...' : 'Reject'}
                                    </button>
                                </div>
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
                            <button style={S.mAcceptBtn} disabled={updating === active.id}
                                onClick={() => updateStatus(active.id, 'Accepted')}>
                                {updating === active.id ? '...' : 'Accept Project'}
                            </button>
                            <button style={S.mRejectBtn} disabled={updating === active.id}
                                onClick={() => updateStatus(active.id, 'Cancelled')}>
                                {updating === active.id ? '...' : 'Reject / Cancel'}
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
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    countBadge: { background: '#d32f2f', color: '#fff', borderRadius: '20px', padding: '6px 16px', fontWeight: '800', fontSize: '0.9rem' },
    
    empty: { textAlign: 'center', color: '#aaa', padding: '60px', background: '#fff', borderRadius: '16px' },
    emptyBox: { textAlign: 'center', color: '#6B7280', padding: '60px', background: '#fff', borderRadius: '16px', border: '1px dashed #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    
    gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    card: { background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '16px' },
    cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    idBadge: { background: '#F3F4F6', color: '#374151', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '800' },
    dateBadge: { color: '#6B7280', fontSize: '0.8rem', fontWeight: '600' },
    cardTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111827' },
    cardInfo: { display: 'flex', flexDirection: 'column', gap: '10px', background: '#F9FAFB', padding: '16px', borderRadius: '12px' },
    infoGroup: { display: 'flex', flexDirection: 'column', gap: '2px' },
    infoLabel: { fontSize: '0.7rem', fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
    infoValue: { fontSize: '0.95rem', fontWeight: '600', color: '#111827' },
    
    cardActions: { display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' },
    viewBtn: { padding: '10px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' },
    acceptBtn: { flex: 1, padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' },
    rejectBtn: { flex: 1, padding: '10px', background: '#fff', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' },

    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: '#fff', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    closeX: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--color-muted)' },
    modalBody: { marginBottom: '24px' },
    mGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    mLabel: { fontSize: '0.72rem', color: '#AAA', fontWeight: '700', textTransform: 'uppercase' },
    mVal: { fontWeight: '700', color: '#1A1A1A', margin: '4px 0 0', fontSize: '0.95rem' },
    notesBox: { background: '#F9FAFB', borderRadius: '10px', padding: '16px', fontSize: '0.9rem', color: '#374151', fontStyle: 'italic', border: '1px solid #E5E7EB' },
    modalFoot: { display: 'flex', gap: '12px' },
    mAcceptBtn: { flex: 1, padding: '14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
    mRejectBtn: { flex: 1, padding: '14px', background: '#FEF2F2', color: '#EF4444', border: '1px dashed #FECACA', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
};

export default ConstructorServiceBookingsPage;
