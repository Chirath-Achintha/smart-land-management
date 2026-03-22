import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Requested: { color: '#92400e', background: '#FEF3C7' },
    Approved: { color: '#1D4ED8', background: '#DBEAFE' },
    Scheduled: { color: '#1565c0', background: '#E3F2FD' },
    'In Progress': { color: '#e65100', background: '#FFF3E0' },
    Completed: { color: '#2e7d32', background: '#E8F5E9' },
    Cancelled: { color: '#c62828', background: '#FFEBEE' },
};

const isPendingRequest = (status) => status === 'Approved' || status === 'Scheduled';

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
    const [filter, setFilter] = useState('All');
    const [active, setActive] = useState(null);
    const [updating, setUpdating] = useState(null);

    const fetchBookings = () => {
        fetch(`${API}/service-bookings/assigned`, { headers: authH })
            .then(r => r.json().then((body) => ({ ok: r.ok, body })))
            .then(({ ok, body }) => {
                if (!ok) throw new Error(toErrorMessage(body, 'Failed to load service requests'));
                const normalized = (Array.isArray(body) ? body : []).map(normalizeBooking);
                setBookings(normalized);
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
                alert(toErrorMessage(data, 'Failed to update request status'));
                setUpdating(null);
                return;
            }

            const updated = normalizeBooking(data);
            setBookings(prev => prev.map(b => b.id === id ? updated : b));
            if (active?.id === id) setActive(updated);
        } catch {
            alert('Server error while updating request status');
        }
        setUpdating(null);
    };

    const filtered = filter === 'All'
        ? bookings
        : filter === 'Pending'
            ? bookings.filter((b) => isPendingRequest(b.status))
            : bookings.filter((b) => b.status === filter);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Service Requests</h1>
                    <p style={S.subtitle}>Review and manage construction booking requests from buyers.</p>
                </div>
                <span style={S.countBadge}>{bookings.length} total</span>
            </div>

            {/* Filter tabs */}
            <div style={S.filterRow}>
                {['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            ...S.filterBtn,
                            background: filter === f ? '#1A1A1A' : '#fff',
                            color: filter === f ? '#fff' : '#555',
                            border: filter === f ? 'none' : '1px solid #e5e0da',
                        }}>
                        {f}
                        {f !== 'All' && (
                            <span style={S.filterCount}>
                                {f === 'Pending'
                                    ? bookings.filter((b) => isPendingRequest(b.status)).length
                                    : bookings.filter((b) => b.status === f).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={S.empty}>Loading service requests…</div>
            ) : (
                <div style={S.tableCard}>
                    <table style={S.table}>
                        <thead>
                            <tr style={S.theadRow}>
                                <th style={S.th}>ID</th>
                                <th style={S.th}>Service</th>
                                <th style={S.th}>Buyer</th>
                                <th style={S.th}>Schedule</th>
                                <th style={S.th}>Status</th>
                                <th style={S.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan="6" style={S.emptyTd}>No {filter !== 'All' ? filter : ''} requests found.</td></tr>
                            ) : filtered.map(b => {
                                const sc = STATUS_STYLE[b.status] || STATUS_STYLE.Scheduled;
                                return (
                                    <tr key={b.id} style={S.tr}>
                                        <td style={S.td}><span style={S.idSpan}>#{b.id}</span></td>
                                        <td style={S.td}><strong>{b.service_type}</strong></td>
                                        <td style={S.td}>
                                            <div><span style={S.buyerName}>{b.buyer_name || `Buyer #${b.buyer_id}`}</span>
                                                {b.land_name && <div style={S.landTag}>🏡 {b.land_name}</div>}</div>
                                        </td>
                                        <td style={S.td}>{b.preferred_date} at {b.preferred_time}</td>
                                        <td style={S.td}><span style={{ ...S.badge, ...sc }}>{b.status}</span></td>
                                        <td style={S.td}>
                                            <div style={S.actRow}>
                                                <button style={S.viewBtn} onClick={() => setActive(b)}>View</button>
                                                {(b.status === 'Approved' || b.status === 'Scheduled') && (
                                                    <button style={S.acceptBtn} disabled={updating === b.id}
                                                        onClick={() => updateStatus(b.id, 'In Progress')}>
                                                        {updating === b.id ? '…' : 'Accept'}
                                                    </button>
                                                )}
                                                {(b.status === 'Approved' || b.status === 'Scheduled') && (
                                                    <button style={S.rejectBtn} disabled={updating === b.id}
                                                        onClick={() => updateStatus(b.id, 'Cancelled')}>
                                                        {updating === b.id ? '…' : 'Reject'}
                                                    </button>
                                                )}
                                                {b.status === 'In Progress' && (
                                                    <button style={S.completeBtn} disabled={updating === b.id}
                                                        onClick={() => updateStatus(b.id, 'Completed')}>
                                                        {updating === b.id ? '…' : 'Complete'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {active && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <div style={S.modalHead}>
                            <h2 style={S.modalTitle}>Request #{active.id}</h2>
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
                            {(active.status === 'Approved' || active.status === 'Scheduled') && (
                                <button style={S.mAcceptBtn} disabled={updating === active.id}
                                    onClick={() => updateStatus(active.id, 'In Progress')}>
                                    {updating === active.id ? '…' : 'Accept Request'}
                                </button>
                            )}
                            {(active.status === 'Approved' || active.status === 'Scheduled') && (
                                <button style={S.mRejectBtn} disabled={updating === active.id}
                                    onClick={() => updateStatus(active.id, 'Cancelled')}>
                                    {updating === active.id ? '…' : 'Reject Request'}
                                </button>
                            )}
                            {active.status === 'In Progress' && (
                                <button style={S.mCompleteBtn} disabled={updating === active.id}
                                    onClick={() => updateStatus(active.id, 'Completed')}>
                                    {updating === active.id ? '…' : 'Mark as Completed'}
                                </button>
                            )}
                            <button style={S.mCloseBtn} onClick={() => setActive(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    countBadge: { background: '#1A1A1A', color: '#fff', borderRadius: '20px', padding: '6px 16px', fontWeight: '700', fontSize: '0.9rem' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 18px', borderRadius: '20px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px' },
    filterCount: { background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 8px', fontSize: '0.72rem' },
    empty: { textAlign: 'center', color: '#aaa', padding: '60px', background: '#fff', borderRadius: '16px' },
    tableCard: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    theadRow: { background: '#FAF6F1' },
    th: { textAlign: 'left', padding: '14px 20px', fontSize: '0.78rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #FAF6F1' },
    td: { padding: '18px 20px', fontSize: '0.9rem', color: '#1A1A1A' },
    emptyTd: { padding: '40px', textAlign: 'center', color: '#AAA', fontStyle: 'italic' },
    idSpan: { fontWeight: '800', color: '#3498db', fontSize: '0.82rem' },
    buyerName: { fontWeight: '700' },
    landTag: { fontSize: '0.75rem', color: '#888', marginTop: '2px' },
    badge: { padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' },
    actRow: { display: 'flex', gap: '8px' },
    viewBtn: { padding: '6px 14px', background: '#F5F5F5', color: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" },
    acceptBtn: { padding: '6px 14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" },
    rejectBtn: { padding: '6px 14px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" },
    completeBtn: { padding: '6px 14px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#fff', borderRadius: '28px', padding: '36px', width: '100%', maxWidth: '520px', boxShadow: '0 24px 60px rgba(0,0,0,0.15)' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    closeX: { background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#AAA' },
    modalBody: { marginBottom: '24px' },
    mGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    mLabel: { fontSize: '0.72rem', color: '#AAA', fontWeight: '700', textTransform: 'uppercase' },
    mVal: { fontWeight: '700', color: '#1A1A1A', margin: '4px 0 0', fontSize: '0.95rem' },
    notesBox: { background: '#FAF6F1', borderRadius: '10px', padding: '12px 16px', fontSize: '0.88rem', color: '#555', fontStyle: 'italic' },
    modalFoot: { display: 'flex', gap: '12px' },
    mAcceptBtn: { flex: 2, padding: '13px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    mRejectBtn: { flex: 2, padding: '13px', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    mCompleteBtn: { flex: 2, padding: '13px', background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    mCloseBtn: { flex: 1, padding: '13px', background: '#F5F5F5', color: '#333', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};

export default ConstructorServiceBookingsPage;
