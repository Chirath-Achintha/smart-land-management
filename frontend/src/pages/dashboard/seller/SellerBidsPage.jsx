import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const SellerBidsPage = () => {
    const [bids, setBids] = useState([]);
    const [lands, setLands] = useState([]);
    const [receivedMessages, setReceivedMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLand, setSelectedLand] = useState('all');
    const [notifiedIds, setNotifiedIds] = useState([]);

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

    // Filter only lands that are actually open for bidding
    const activeLands = lands.filter(l => l.open_for_bidding);

    // Filter bids by land
    const filtered = bids.filter(b => {
        const bidLandId = b.land_id ? String(b.land_id) : null;
        return selectedLand === 'all' || bidLandId === String(selectedLand);
    });

    // Filter messages by land
    const filteredMessages = receivedMessages.filter(m => {
        const msgLandId = m.land_id ? String(m.land_id) : null;
        return selectedLand === 'all' || msgLandId === String(selectedLand);
    });

    // Highest bid per land (for badge)
    const highestByLand = {};
    bids.forEach(b => {
        const bId = b.land_id ? String(b.land_id) : 'unknown';
        if (!highestByLand[bId] || b.amount > highestByLand[bId]) {
            highestByLand[bId] = b.amount;
        }
    });

    // Land name helper
    const getLandName = (land_id) => {
        const l = lands.find(l => String(l._id || l.id) === String(land_id));
        return l ? `${l.name} (${l.village}, ${l.district})` : `Land #${land_id}`;
    };

    // Sort by highest bid amount first
    const sorted = [...filtered].sort((a, b) => b.amount - a.amount);

    const handleNotify = async (bidId) => {
        if (!bidId) return;
        try {
            const r = await fetch(`${API}/bids/notify-winner/${bidId}`, { 
                method: 'POST', 
                headers: authHeaders 
            });
            if (r.ok) {
                alert('Success! The buyer has been notified of their win with your contact information.');
                setNotifiedIds(prev => [...prev, String(bidId)]);
            } else {
                const err = await r.json();
                alert(`Error: ${err.detail || 'Could not notify winner'}`);
            }
        } catch(err) { 
            console.error(err);
            alert('Failed to connect to server.');
        }
    };

    return (
        <div style={S.root}>
            {/* Header */}
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Bids Overview</h1>
                    <p style={S.subtitle}>
                        Manage and track all bid activities across your properties.
                    </p>
                </div>
            </div>

            {/* Land Selector Cards */}
            <div style={S.landGrid}>
                <div 
                    style={{ ...S.landCard, ...(selectedLand === 'all' ? S.landCardActive : {}) }}
                    onClick={() => setSelectedLand('all')}
                >
                    <div style={S.landCardIcon}>🏘️</div>
                    <div style={S.landCardContent}>
                        <div style={S.landCardName}>All Active Auctions</div>
                        <div style={S.landCardStats}>{bids.length} total bids</div>
                    </div>
                </div>
                {activeLands.map(l => {
                    const lId = l._id || l.id;
                    const landBids = bids.filter(b => String(b.land_id) === String(lId));
                    const highest = landBids.length > 0 ? Math.max(...landBids.map(b => b.amount)) : 0;
                    return (
                        <div 
                            key={lId} 
                            style={{ ...S.landCard, ...(String(selectedLand) === String(lId) ? S.landCardActive : {}) }}
                            onClick={() => setSelectedLand(lId)}
                        >
                            <img 
                                src={l.image_url ? l.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80'} 
                                alt={l.name} 
                                style={S.landCardImg} 
                            />
                            <div style={S.landCardContent}>
                                <div style={S.landCardName}>{l.name}</div>
                                <div style={S.landCardStats}>
                                    {landBids.length} bids · {highest > 0 ? `Highest: Rs. ${highest.toLocaleString()}` : 'No bids'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Winner Messages */}
            {filteredMessages.length > 0 && (
                <div style={S.msgPanel}>
                    <h2 style={S.msgTitle}>📬 Winner Messages {selectedLand !== 'all' && `for ${getLandName(selectedLand)}`}</h2>
                    <div style={S.msgGrid}>
                        {filteredMessages.map(m => (
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
                            <span style={{ flex: 1.5, textAlign: 'center' }}>Action</span>
                            <span style={{ flex: 1, textAlign: 'center' }}>Date & Time</span>
                        </div>

                        {sorted.map((bid, i) => {
                            const bId = bid._id || bid.id;
                            const isHighest = highestByLand[String(bid.land_id)] === bid.amount;
                            return (
                                <div key={bId} style={{
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
                                            <a 
                                                href={`mailto:${bid.buyer_email || ''}`}
                                                style={{ fontSize: '0.75rem', color: '#1A52e8', textDecoration: 'none' }}
                                                title="Send direct email"
                                            >
                                                {bid.buyer_email || ''}
                                            </a>
                                            {(() => {
                                                const landObj = lands.find(l => String(l._id || l.id) === String(bid.land_id));
                                                const hasEnded = landObj && landObj.bidding_end && new Date(landObj.bidding_end) <= new Date();
                                                const isHighest = highestByLand[String(bid.land_id)] === bid.amount;
                                                
                                                if (isHighest && hasEnded) {
                                                    return <div style={{ fontSize: '0.7rem', color: '#B25C00', fontWeight: '900', background: '#FFF3E0', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>🏆 WINNER</div>;
                                                } else if (isHighest) {
                                                    return <div style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: '700', marginTop: '4px' }}>🔥 Current Highest</div>;
                                                }
                                                return null;
                                            })()}
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
                                                        {/* Quick Actions (only for potential winners) */}
                                    <div style={{ ...S.cell, flex: 1.5, justifyContent: 'center', gap: '8px' }}>
                                        {(() => {
                                            const bId = bid._id || bid.id;
                                            const landObj = lands.find(l => String(l._id || l.id) === String(bid.land_id));
                                            const hasEnded = landObj && landObj.bidding_end && new Date(landObj.bidding_end) <= new Date();
                                            const isHighest = highestByLand[String(bid.land_id)] === bid.amount;

                                            if (isHighest && hasEnded) {
                                                if (notifiedIds.includes(String(bId))) {
                                                    return <span style={{ color: '#27ae60', fontWeight: '800', fontSize: '0.8rem' }}>Notified ✅</span>;
                                                }
                                                return (
                                                    <button 
                                                        style={S.notifyBtn}
                                                        onClick={() => handleNotify(bId)}
                                                    >
                                                        🔔 Notify Winner
                                                    </button>
                                                );
                                            } else if (isHighest) {
                                                return <span style={{ fontSize: '0.7rem', color: '#999' }}>Live Auction</span>;
                                            }
                                            return null;
                                        })()}
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

    landGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
    landCard: { display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', padding: '14px', borderRadius: '14px', border: '1px solid #e5e0da', cursor: 'pointer', transition: 'all 0.15s ease-in-out', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
    landCardActive: { borderColor: '#1A1A1A', background: '#FAF6F1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' },
    landCardIcon: { fontSize: '1.8rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f0ea', borderRadius: '10px' },
    landCardImg: { width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' },
    landCardContent: { overflow: 'hidden' },
    landCardName: { fontWeight: '700', fontSize: '0.9rem', color: '#1A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    landCardStats: { fontSize: '0.75rem', color: '#888', marginTop: '2px' },
    notifyBtn: { padding: '8px 12px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
};

export default SellerBidsPage;
