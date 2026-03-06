import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const SellerBidsPage = () => {
    const [bids, setBids] = useState([]);
    const [lands, setLands] = useState([]);
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLand, setSelectedLand] = useState('all');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Fetch all bids on seller's lands from DB
    const fetchData = async () => {
        try {
            const [bidsRes, landsRes, msgRes] = await Promise.all([
                fetch(`${API}/bids/my-listings`, { headers: authHeaders }),
                fetch(`${API}/lands/my`, { headers: authHeaders }),
                fetch(`${API}/inquiries/received`, { headers: authHeaders })
            ]);

            setBids(await bidsRes.json());
            setLands(await landsRes.json());
            setReceivedMessages(await msgRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Filter bids by land
    const filtered = bids.filter(b =>
        selectedLand === 'all' || String(b.land_id) === String(selectedLand)
    );

    // Highest bid per land (for badge)
    const highestByLand = {};
    bids.forEach(b => {
        if (!highestByLand[b.land_id] || b.amount > highestByLand[b.land_id]) {
            highestByLand[b.land_id] = b.amount;
        }
    });

    // Land name helper
    const getLandName = (land_id) => {
        const l = lands.find(l => l.id === land_id);
        return l ? `${l.name} (${l.village}, ${l.district})` : `Land #${land_id}`;
    };

    // Sort by highest bid amount first
    const sorted = [...filtered].sort((a, b) => b.amount - a.amount);

    return (
        <div style={S.root}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Bids Overview</h1>
                    <p style={S.subtitle}>View all bid activities on your listings.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={S.totalBadge}>{filtered.length} bid{filtered.length !== 1 ? 's' : ''}</span>
                    <select style={S.select} value={selectedLand} onChange={e => setSelectedLand(e.target.value)}>
                        <option value="all">All Listings</option>
                        {lands.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Winner Messages */}
            {receivedMessages.length > 0 && (
                <div style={S.msgPanel}>
                    <h2 style={S.msgTitle}>📬 Winner Messages</h2>
                    <div style={S.msgGrid}>
                        {receivedMessages.map(m => (
                            <div key={m.id} style={S.msgCard}>
                                <div style={S.msgHeader}>
                                    <span style={S.msgBadge}>From: {m.buyer_name}</span>
                                    <span style={S.msgDate}>{new Date(m.created_at).toLocaleDateString()}</span>
                                </div>
                                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#666', marginBottom: '8px' }}>
                                    Property: {m.title.split(': ')[1] || 'Unknown'}
                                </div>
                                <p style={S.msgText}>"{m.message}"</p>
                                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: '#1A1A1A' }}>
                                    Reply to: <strong>{m.buyer_email}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bids Table */}
            <div style={S.tableWrap}>
                {loading ? (
                    <div style={S.empty}>Loading bids…</div>
                ) : sorted.length === 0 ? (
                    <div style={S.emptyState}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏷️</div>
                        <div style={{ fontWeight: '700', color: '#555', marginBottom: '6px' }}>No bids yet</div>
                        <div style={{ color: '#aaa', fontSize: '0.875rem' }}>
                            Once buyers place bids on your listings, they will appear here.
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Column headers */}
                        <div style={S.colHeader}>
                            <span style={{ flex: 2 }}>Bidder</span>
                            <span style={{ flex: 2 }}>Property</span>
                            <span style={{ flex: 2 }}>Message</span>
                            <span style={{ flex: 1, textAlign: 'right' }}>Bid Amount</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>Date & Time</span>
                        </div>

                        {sorted.map((bid, i) => {
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
                                                    🏆 Highest Bid
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
                                    <div style={{ ...S.cell, flex: 2 }}>
                                        <span style={{ fontSize: '0.8rem', color: '#777', fontStyle: bid.message ? 'italic' : 'normal' }}>
                                            {bid.message
                                                ? `"${bid.message.substring(0, 60)}${bid.message.length > 60 ? '…' : ''}"`
                                                : <span style={{ color: '#ccc' }}>—</span>}
                                        </span>
                                    </div>

                                    {/* Amount */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'flex-end' }}>
                                        <span style={{ fontWeight: '800', fontSize: '1rem', color: isHighest ? '#27ae60' : '#1A1A1A' }}>
                                            Rs. {Number(bid.amount).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Date */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#aaa', textAlign: 'center' }}>
                                            {bid.created_at
                                                ? new Date(bid.created_at).toLocaleString('en-LK', { dateStyle: 'short', timeStyle: 'short' })
                                                : '—'}
                                        </span>
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
    totalBadge: { background: '#1A1A1A', color: '#fff', borderRadius: '20px', padding: '6px 16px', fontWeight: '700', fontSize: '0.85rem' },
    select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e0da', background: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', cursor: 'pointer', outline: 'none' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'auto' },
    empty: { textAlign: 'center', padding: '80px 20px', color: '#bbb', fontSize: '1rem' },
    emptyState: { textAlign: 'center', padding: '80px 20px' },
    colHeader: { display: 'flex', padding: '14px 24px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', borderBottom: '2px solid #f5f0ea', gap: '12px' },
    bidRow: { display: 'flex', alignItems: 'center', padding: '18px 24px', gap: '12px', borderBottom: '1px solid #f5f0ea', transition: 'background 0.15s' },
    cell: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 },

    msgPanel: { background: '#FFFDF5', border: '1px solid #FFEBB0', borderRadius: '16px', padding: '24px', marginBottom: '28px' },
    msgTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    msgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
    msgCard: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' },
    msgHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    msgBadge: { fontSize: '0.75rem', fontWeight: '800', background: '#FFF9C4', padding: '3px 8px', borderRadius: '6px' },
    msgDate: { fontSize: '0.75rem', color: '#aaa' },
    msgText: { fontSize: '0.88rem', color: '#444', fontStyle: 'italic', margin: 0, lineHeight: '1.4' },
};

export default SellerBidsPage;
