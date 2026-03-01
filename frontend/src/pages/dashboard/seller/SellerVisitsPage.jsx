import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

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
            .then(data => {
                // Sellers only see Self Visits
                const selfVisits = Array.isArray(data) ? data.filter(v => v.visit_type === 'self_visit') : [];
                setVisits(selfVisits);
                setLoading(false);
            })
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
                setVisits(prev => prev.map(v => {
                    const vId = v._id || v.id;
                    return vId === visitId ? { ...v, status: newStatus } : v;
                }));
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
                                const vId = visit._id || visit.id;
                                return (
                                    <div key={vId} style={S.card}>
                                        {/* Header: Buyer Name + Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                            <div>
                                                <div style={S.buyerName}>{visit.buyer_name || 'Buyer'}</div>
                                                <div style={{ ...S.typeLabel, color: visit.visit_type === 'self_visit' ? '#1565c0' : '#7b1fa2' }}>
                                                    {visit.visit_type === 'self_visit' ? 'Personal Visit' : 'Agent Scheduled'}
                                                </div>
                                            </div>
                                            <span style={{ ...S.statusLabel, background: sc.bg, color: sc.color }}>
                                                {visit.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Visit Details: Minimalist Rows */}
                                        <div style={S.detailsArea}>
                                            <div style={S.detailRow}>
                                                <span style={S.detailKey}>SCHEDULED DATE</span>
                                                <span style={S.detailVal}>{new Date(visit.visit_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div style={S.detailRow}>
                                                <span style={S.detailKey}>TIME SLOT</span>
                                                <span style={S.detailVal}>{visit.visit_time}</span>
                                            </div>
                                        </div>

                                        {visit.message && (
                                            <div style={S.messageWrapper}>
                                                <div style={S.messageKey}>Message from Buyer</div>
                                                <div style={S.messageContent}>{visit.message}</div>
                                            </div>
                                        )}

                                        <div style={S.timestamp}>
                                            Request received {new Date(visit.created_at).toLocaleDateString()}
                                        </div>

                                        {/* Actions */}
                                        {visit.status === 'Pending' && (
                                            <div style={S.actionGrid}>
                                                <button
                                                    style={S.primaryBtn}
                                                    disabled={updating === vId}
                                                    onClick={() => updateStatus(vId, 'Accepted')}>
                                                    {updating === vId ? 'Processing...' : 'Accept Request'}
                                                </button>
                                                <button
                                                    style={S.secondaryBtn}
                                                    disabled={updating === vId}
                                                    onClick={() => updateStatus(vId, 'Rejected')}>
                                                    {updating === vId ? '...' : 'Decline'}
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
    title: { fontSize: '2.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', letterSpacing: '-0.02em' },
    subtitle: { color: '#777', fontSize: '1rem', fontWeight: '500' },
    countBadge: { background: '#1A1A1A', color: '#fff', borderRadius: '30px', padding: '8px 18px', fontWeight: '700', fontSize: '0.85rem' },
    errBox: { background: '#fdecea', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.88rem', border: '1px solid #ef9a9a' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' },
    filterBtn: { padding: '10px 24px', borderRadius: '30px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
    filterCount: { background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 8px', fontSize: '0.7rem' },
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    landGroup: { marginBottom: '48px' },
    landGroupTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px', paddingLeft: '4px' },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    // Bespoke Card Styles
    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(26, 26, 26, 0.04)', border: '1px solid #F0EBE4', transition: 'transform 0.2s', position: 'relative' },
    buyerName: { fontWeight: '800', fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '2px' },
    typeLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statusLabel: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.08em' },

    detailsArea: { marginTop: '24px', borderTop: '1px solid #F0EBE4', paddingTop: '20px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    detailKey: { fontSize: '0.68rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.08em' },
    detailVal: { fontSize: '0.92rem', fontWeight: '700', color: '#1A1A1A' },

    messageWrapper: { marginTop: '16px', background: '#F9F7F5', borderRadius: '16px', padding: '16px 20px' },
    messageKey: { fontSize: '0.65rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
    messageContent: { fontSize: '0.88rem', color: '#444', lineHeight: '1.5', fontWeight: '500' },

    timestamp: { fontSize: '0.72rem', color: '#BBB', marginTop: '24px', fontWeight: '600' },

    actionGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginTop: '24px' },
    primaryBtn: { padding: '14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
    secondaryBtn: { padding: '14px', background: '#fff', color: '#C62828', border: '1.5px solid #FDECEA', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
};

export default SellerVisitsPage;
