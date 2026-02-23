import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLES = {
    Pending: { bg: '#eaf4fb', color: '#1565c0', border: '#90caf9' },
    Accepted: { bg: '#eafaf1', color: '#27ae60', border: '#a5d6a7' },
    Rejected: { bg: '#fdecea', color: '#d32f2f', border: '#ef9a9a' },
};

const SellerBidsPage = () => {
    const [bids, setBids] = useState([]);
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLand, setSelectedLand] = useState('all');
    const [statusFilter, setStatusFilter] = useState('All');
    const [updating, setUpdating] = useState(null); // bid id being updated

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Fetch all bids on seller's lands from DB
    const fetchBids = () => {
        fetch(`${API}/bids/my-listings`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                setBids(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    // Fetch seller's own land list for filter dropdown
    const fetchLands = () => {
        fetch(`${API}/lands/my`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => setLands(Array.isArray(data) ? data : []))
            .catch(() => { });
    };

    useEffect(() => { fetchBids(); fetchLands(); }, []);

    const updateBidStatus = async (bidId, newStatus) => {
        setUpdating(bidId);
        try {
            const res = await fetch(`${API}/bids/${bidId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) fetchBids();
        } catch { /* ignore */ }
        setUpdating(null);
    };

    // Filter bids
    const filtered = bids.filter(b => {
        const matchLand = selectedLand === 'all' || String(b.land_id) === String(selectedLand);
        const matchStatus = statusFilter === 'All' || b.status === statusFilter;
        return matchLand && matchStatus;
    });

    const counts = {
        All: bids.length,
        Pending: bids.filter(b => b.status === 'Pending').length,
        Accepted: bids.filter(b => b.status === 'Accepted').length,
        Rejected: bids.filter(b => b.status === 'Rejected').length,
    };

    // Find land name from lands array
    const getLandName = (land_id) => {
        const l = lands.find(l => l.id === land_id);
        return l ? `${l.name} (${l.village}, ${l.district})` : `Land #${land_id}`;
    };

    // Group bids by land_id for highest bid calculation
    const highestByLand = {};
    bids.forEach(b => {
        if (!highestByLand[b.land_id] || b.amount > highestByLand[b.land_id]) {
            highestByLand[b.land_id] = b.amount;
        }
    });

    return (
        <div style={S.root}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Bids Overview</h1>
                    <p style={S.subtitle}>Track and manage all bid activities on your listings.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <select style={S.select} value={selectedLand} onChange={e => setSelectedLand(e.target.value)}>
                        <option value="all">All Listings</option>
                        {lands.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Status Filter Tabs */}
            <div style={S.tabBar}>
                {['All', 'Pending', 'Accepted', 'Rejected'].map(tab => (
                    <button key={tab} style={{
                        ...S.tabBtn,
                        background: statusFilter === tab ? '#1A1A1A' : '#fff',
                        color: statusFilter === tab ? '#fff' : '#666',
                        border: statusFilter === tab ? '1px solid #1A1A1A' : '1px solid #e5e0da',
                    }} onClick={() => setStatusFilter(tab)}>
                        {tab}
                        <span style={{
                            ...S.tabCount,
                            background: statusFilter === tab ? 'rgba(255,255,255,0.2)' : '#f5f0ea',
                            color: statusFilter === tab ? '#fff' : '#555',
                        }}>
                            {counts[tab]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Bids Table */}
            <div style={S.tableWrap}>
                {loading ? (
                    <div style={S.empty}>Loading bids…</div>
                ) : filtered.length === 0 ? (
                    <div style={S.empty}>No {statusFilter !== 'All' ? statusFilter.toLowerCase() : ''} bids found.</div>
                ) : (
                    <>
                        {/* Column headers */}
                        <div style={S.colHeader}>
                            <span style={{ flex: 2 }}>Bidder</span>
                            <span style={{ flex: 2 }}>Property</span>
                            <span style={{ flex: 1 }}>Message</span>
                            <span style={{ flex: 1, textAlign: 'right' }}>Bid Amount</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>Date</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>Status</span>
                            <span style={{ flex: 1.5, textAlign: 'center' }}>Actions</span>
                        </div>

                        {filtered.map((bid, i) => {
                            const ss = STATUS_STYLES[bid.status] || STATUS_STYLES.Pending;
                            const isHighest = highestByLand[bid.land_id] === bid.amount;
                            return (
                                <div key={bid.id} style={{
                                    ...S.bidRow,
                                    background: i % 2 === 0 ? '#fff' : '#fdfaf7',
                                    borderLeft: isHighest ? '4px solid #27ae60' : '4px solid transparent',
                                }}>
                                    {/* Bidder */}
                                    <div style={{ ...S.cell, flex: 2 }}>
                                        <div style={S.avatar}>
                                            {(bid.buyer_name || 'B').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#1A1A1A' }}>
                                                {bid.buyer_name || 'Buyer'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                                {bid.buyer_email || ''}
                                            </div>
                                            {isHighest && (
                                                <div style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: '700' }}>
                                                    ★ Highest Bid
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Property */}
                                    <div style={{ ...S.cell, flex: 2 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#333' }}>
                                            {getLandName(bid.land_id)}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div style={{ ...S.cell, flex: 1 }}>
                                        <span style={{ fontSize: '0.8rem', color: '#777', fontStyle: 'italic' }}>
                                            {bid.message ? `"${bid.message.substring(0, 40)}${bid.message.length > 40 ? '…' : ''}"` : '—'}
                                        </span>
                                    </div>

                                    {/* Amount */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'flex-end' }}>
                                        <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1A1A1A' }}>
                                            Rs. {Number(bid.amount).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                            {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : '—'}
                                        </span>
                                    </div>

                                    {/* Status badge */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px', borderRadius: '20px',
                                            fontSize: '0.75rem', fontWeight: '700',
                                            background: ss.bg, color: ss.color,
                                            border: `1px solid ${ss.border}`,
                                        }}>
                                            {bid.status}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ ...S.cell, flex: 1.5, justifyContent: 'center', gap: '8px' }}>
                                        {bid.status === 'Pending' && (
                                            <>
                                                <button
                                                    style={S.acceptBtn}
                                                    disabled={updating === bid.id}
                                                    onClick={() => updateBidStatus(bid.id, 'Accepted')}
                                                >
                                                    {updating === bid.id ? '…' : '✓ Accept'}
                                                </button>
                                                <button
                                                    style={S.rejectBtn}
                                                    disabled={updating === bid.id}
                                                    onClick={() => updateBidStatus(bid.id, 'Rejected')}
                                                >
                                                    ✕ Reject
                                                </button>
                                            </>
                                        )}
                                        {bid.status === 'Accepted' && (
                                            <button
                                                style={S.rejectBtn}
                                                disabled={updating === bid.id}
                                                onClick={() => updateBidStatus(bid.id, 'Rejected')}
                                            >
                                                ✕ Reject
                                            </button>
                                        )}
                                        {bid.status === 'Rejected' && (
                                            <button
                                                style={S.acceptBtn}
                                                disabled={updating === bid.id}
                                                onClick={() => updateBidStatus(bid.id, 'Accepted')}
                                            >
                                                ✓ Accept
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e0da', background: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', cursor: 'pointer', outline: 'none' },
    tabBar: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
    tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" },
    tabCount: { padding: '2px 8px', borderRadius: '12px', fontSize: '0.72rem', fontWeight: '700' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'auto' },
    empty: { textAlign: 'center', padding: '80px 20px', color: '#bbb', fontSize: '1rem' },
    colHeader: { display: 'flex', padding: '14px 24px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', borderBottom: '2px solid #f5f0ea', gap: '12px' },
    bidRow: { display: 'flex', alignItems: 'center', padding: '18px 24px', gap: '12px', borderBottom: '1px solid #f5f0ea', transition: 'background 0.15s', borderLeft: '4px solid transparent' },
    cell: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 },
    acceptBtn: { background: '#eafaf1', color: '#27ae60', border: '1px solid #a5d6a7', borderRadius: '6px', padding: '6px 12px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' },
    rejectBtn: { background: '#fdecea', color: '#d32f2f', border: '1px solid #ef9a9a', borderRadius: '6px', padding: '6px 12px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', whiteSpace: 'nowrap' },
};

export default SellerBidsPage;
