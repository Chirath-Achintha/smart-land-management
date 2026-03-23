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
                                <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-dark)' }}>
                                    Reply to: <strong>{m.buyer_email}</strong>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Bids Table */}
            <div className="ui-card" style={S.tableWrap}>
                {loading ? (
                    <div style={S.empty}>Loading bids…</div>
                ) : sorted.length === 0 ? (
                    <div style={S.emptyState}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏷️</div>
                        <div style={{ fontWeight: '700', color: 'var(--color-dark)', marginBottom: '6px' }}>No bids yet</div>
                        <div style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
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
                                    background: i % 2 === 0 ? '#fff' : 'rgba(139, 195, 74, 0.08)',
                                    borderLeft: isHighest ? '4px solid var(--color-primary)' : '4px solid transparent',
                                }}>
                                    {/* Bidder */}
                                    <div style={{ ...S.cell, flex: 2 }}>
                                        <div style={S.avatar}>
                                            {(bid.buyer_name || 'B').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-dark)' }}>
                                                {bid.buyer_name || 'Buyer'}
                                            </div>
                                            <a 
                                                href={`mailto:${bid.buyer_email || ''}`}
                                                style={{ fontSize: '0.75rem', color: 'var(--color-blue)', textDecoration: 'none' }}
                                                title="Send direct email"
                                            >
                                                {bid.buyer_email || ''}
                                            </a>
                                            {(() => {
                                                const landObj = lands.find(l => String(l._id || l.id) === String(bid.land_id));
                                                const hasEnded = landObj && landObj.bidding_end && new Date(landObj.bidding_end) <= new Date();
                                                const isHighest = highestByLand[String(bid.land_id)] === bid.amount;
                                                
                                                if (isHighest && hasEnded) {
                                                    return <div style={{ fontSize: '0.7rem', color: '#7a4f41', fontWeight: '900', background: 'rgba(161, 136, 127, 0.2)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>🏆 WINNER</div>;
                                                } else if (isHighest) {
                                                    return <div style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: '700', marginTop: '4px' }}>🔥 Current Highest</div>;
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* Property */}
                                    <div style={{ ...S.cell, flex: 2 }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--color-dark)' }}>
                                            {getLandName(bid.land_id)}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div style={{ ...S.cell, flex: 2 }}>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: bid.message ? 'italic' : 'normal' }}>
                                            {bid.message
                                                ? `"${bid.message.substring(0, 60)}${bid.message.length > 60 ? '…' : ''}"`
                                                : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                                        </span>
                                    </div>

                                    {/* Amount */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'flex-end' }}>
                                        <span style={{ fontWeight: '800', fontSize: '1rem', color: isHighest ? 'var(--color-primary)' : 'var(--color-dark)' }}>
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
                                                    return <span style={{ color: 'var(--color-primary)', fontWeight: '800', fontSize: '0.8rem' }}>Notified ✅</span>;
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
                                                return <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)' }}>Live Auction</span>;
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    {/* Date */}
                                    <div style={{ ...S.cell, flex: 1, justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', textAlign: 'center' }}>
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
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '6px' },
    subtitle: { color: 'var(--color-muted)', fontSize: '0.95rem' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)', overflow: 'auto' },
    empty: { textAlign: 'center', padding: '80px 20px', color: 'var(--color-muted)', fontSize: '1rem' },
    emptyState: { textAlign: 'center', padding: '80px 20px' },
    colHeader: { display: 'flex', padding: '14px 24px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-muted)', borderBottom: '2px solid rgba(38, 50, 56, 0.1)', background: 'rgba(139, 195, 74, 0.12)', gap: '12px' },
    bidRow: { display: 'flex', alignItems: 'center', padding: '18px 24px', gap: '12px', borderBottom: '1px solid rgba(38, 50, 56, 0.08)', transition: 'background 0.15s' },
    cell: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'var(--color-dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 },

    msgPanel: { background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.22)', borderRadius: '16px', padding: '24px', marginBottom: '28px' },
    msgTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-dark)' },
    msgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
    msgCard: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)' },
    msgHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    msgBadge: { fontSize: '0.75rem', fontWeight: '800', background: 'rgba(139, 195, 74, 0.22)', color: '#3f6e10', padding: '3px 8px', borderRadius: '6px' },
    msgDate: { fontSize: '0.75rem', color: 'var(--color-muted)' },
    msgText: { fontSize: '0.88rem', color: 'var(--color-dark)', fontStyle: 'italic', margin: 0, lineHeight: '1.4' },

    landGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
    landCard: { display: 'flex', alignItems: 'center', gap: '14px', background: '#fff', padding: '14px', borderRadius: '14px', border: '1px solid rgba(38, 50, 56, 0.12)', cursor: 'pointer', transition: 'all 0.15s ease-in-out', boxShadow: 'none' },
    landCardActive: { borderColor: 'var(--color-primary)', background: 'rgba(76, 175, 80, 0.1)', boxShadow: '0 4px 12px rgba(76, 175, 80, 0.18)' },
    landCardIcon: { fontSize: '1.8rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(139, 195, 74, 0.16)', borderRadius: '10px' },
    landCardImg: { width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(38, 50, 56, 0.14)' },
    landCardContent: { overflow: 'hidden' },
    landCardName: { fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    landCardStats: { fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' },
    notifyBtn: { padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s', boxShadow: 'none' },
};

export default SellerBidsPage;
