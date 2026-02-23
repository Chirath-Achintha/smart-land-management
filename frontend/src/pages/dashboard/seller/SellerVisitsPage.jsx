import React, { useState, useEffect } from 'react';

const API = 'http://127.0.0.1:8000';

const STATUS_COLORS = {
    Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
    Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SellerVisitsPage = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [updating, setUpdating] = useState(null); // visit id being updated
    const [error, setError] = useState('');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const fetchVisits = () => {
        setLoading(true);
        fetch(`${API}/visits/my-lands`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => { setVisits(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => { setVisits([]); setLoading(false); });
    };

    useEffect(() => { fetchVisits(); }, []);

    const updateStatus = async (visitId, newStatus) => {
        setUpdating(visitId); setError('');
        try {
            const res = await fetch(`${API}/visits/${visitId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to update.');
            } else {
                setVisits(prev => prev.map(v =>
                    v.id === visitId ? { ...v, status: newStatus } : v
                ));
            }
        } catch { setError('Server error. Try again.'); }
        setUpdating(null);
    };

    const filtered = filter === 'All' ? visits : visits.filter(v => v.status === filter);

    // Group by land
    const byLand = filtered.reduce((acc, v) => {
        const key = v.land_id;
        if (!acc[key]) acc[key] = { land_name: v.land_name || `Land #${v.land_id}`, items: [] };
        acc[key].items.push(v);
        return acc;
    }, {});

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Site Visit Requests</h1>
                    <p style={S.subtitle}>Review and respond to buyer visit requests for your listings.</p>
                </div>
                <div style={S.countBadge}>{visits.length} total</div>
            </div>

            {error && <div style={S.errBox}>{error}</div>}

            {/* Filter tabs */}
            <div style={S.filterRow}>
                {['All', 'Pending', 'Accepted', 'Rejected'].map(f => (
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
                                {visits.filter(v => v.status === f).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={S.empty}>Loading visit requests…</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}visit requests yet.</div>
            ) : (
                Object.values(byLand).map(group => (
                    <div key={group.land_name} style={S.landGroup}>
                        <div style={S.landGroupTitle}>{group.land_name}</div>
                        <div style={S.cards}>
                            {group.items.map(visit => {
                                const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.Pending;
                                return (
                                    <div key={visit.id} style={S.card}>
                                        {/* Status badge */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div>
                                                <div style={S.buyerName}>{visit.buyer_name || 'Buyer'}</div>
                                                <div style={S.visitType}>{visit.visit_type} Visit</div>
                                            </div>
                                            <span style={{ ...S.badge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                {visit.status}
                                            </span>
                                        </div>

                                        {/* Date & Time */}
                                        <div style={S.infoGrid}>
                                            <div style={S.infoItem}>
                                                <span style={S.infoLabel}>📅 Date</span>
                                                <span style={S.infoVal}>{visit.visit_date}</span>
                                            </div>
                                            <div style={S.infoItem}>
                                                <span style={S.infoLabel}>🕐 Time</span>
                                                <span style={S.infoVal}>{visit.visit_time}</span>
                                            </div>
                                        </div>

                                        {visit.message && (
                                            <div style={S.msgBox}>"{visit.message}"</div>
                                        )}

                                        <div style={S.submitted}>
                                            Submitted: {new Date(visit.created_at).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </div>

                                        {/* Accept / Reject buttons — only for Pending */}
                                        {visit.status === 'Pending' && (
                                            <div style={S.btnRow}>
                                                <button
                                                    style={S.acceptBtn}
                                                    disabled={updating === visit.id}
                                                    onClick={() => updateStatus(visit.id, 'Accepted')}>
                                                    {updating === visit.id ? '…' : '✓ Accept'}
                                                </button>
                                                <button
                                                    style={S.rejectBtn}
                                                    disabled={updating === visit.id}
                                                    onClick={() => updateStatus(visit.id, 'Rejected')}>
                                                    {updating === visit.id ? '…' : '✕ Reject'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
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
    errBox: { background: '#fdecea', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.88rem' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '32px', flexWrap: 'wrap' },
    filterBtn: { padding: '9px 20px', borderRadius: '20px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s' },
    filterCount: { background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 8px', fontSize: '0.75rem' },
    empty: { textAlign: 'center', color: '#aaa', padding: '80px 20px', fontSize: '1rem' },
    landGroup: { marginBottom: '36px' },
    landGroupTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '16px', paddingBottom: '10px', borderBottom: '2px solid #f0ebe4' },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    card: { background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
    buyerName: { fontWeight: '800', fontSize: '1.05rem', color: '#1A1A1A' },
    visitType: { fontSize: '0.78rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '3px' },
    badge: { padding: '5px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '0.78rem' },
    infoGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' },
    infoItem: { background: '#FAF6F1', borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
    infoLabel: { fontSize: '0.72rem', color: '#888', fontWeight: '700' },
    infoVal: { fontSize: '0.95rem', fontWeight: '700', color: '#1A1A1A' },
    msgBox: { background: '#f5f0ea', borderRadius: '8px', padding: '10px 12px', fontSize: '0.85rem', color: '#555', fontStyle: 'italic', marginBottom: '12px' },
    submitted: { fontSize: '0.75rem', color: '#bbb', marginBottom: '16px' },
    btnRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    acceptBtn: { padding: '10px', background: '#e8f5e9', color: '#2e7d32', border: '1.5px solid #a5d6a7', borderRadius: '10px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    rejectBtn: { padding: '10px', background: '#fdecea', color: '#c62828', border: '1.5px solid #ef9a9a', borderRadius: '10px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
};

export default SellerVisitsPage;
