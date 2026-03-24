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
    const [cancelConfirm, setCancelConfirm] = useState(null); // land object to cancel
    const [cancelling, setCancelling] = useState(false);

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const fetchData = async () => {
        try {
            const [bidsRes, landsRes, msgRes] = await Promise.all([
                fetch(`${API}/bids/my-listings`, { headers: authHeaders }),
                fetch(`${API}/lands/my`, { headers: authHeaders }),
                fetch(`${API}/inquiries/received`, { headers: authHeaders })
            ]);
            const bidsData = await bidsRes.json();
            const landsData = await landsRes.json();
            const msgData = await msgRes.json();
            setBids(Array.isArray(bidsData) ? bidsData : []);
            setLands(Array.isArray(landsData) ? landsData : []);
            setReceivedMessages(Array.isArray(msgData) ? msgData : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Lands open for bidding
    const activeLands = lands.filter(l => l.open_for_bidding);

    // Helper: is auction currently live (open and not yet ended)?
    const isAuctionLive = (land) => {
        if (!land || !land.open_for_bidding) return false;
        if (!land.bidding_end) return true; // no end time = open indefinitely
        return new Date(land.bidding_end) > new Date();
    };

    // Helper: has auction ended?
    const isAuctionEnded = (land) => {
        if (!land) return false;
        if (!land.bidding_end) return false;
        return new Date(land.bidding_end) <= new Date();
    };

    // Filter bids by selected land
    const filtered = bids.filter(b => {
        const bidLandId = b.land_id ? String(b.land_id) : null;
        return selectedLand === 'all' || bidLandId === String(selectedLand);
    });

    const filteredMessages = receivedMessages.filter(m => {
        const msgLandId = m.land_id ? String(m.land_id) : null;
        return selectedLand === 'all' || msgLandId === String(selectedLand);
    });

    // Highest bid per land
    const highestByLand = {};
    bids.forEach(b => {
        const bId = b.land_id ? String(b.land_id) : 'unknown';
        if (!highestByLand[bId] || b.amount > highestByLand[bId]) {
            highestByLand[bId] = b.amount;
        }
    });

    const getLandName = (land_id) => {
        const l = lands.find(l => String(l._id || l.id) === String(land_id));
        return l ? `${l.name} (${l.village}, ${l.district})` : `Land #${land_id}`;
    };

    const getLandObj = (land_id) => lands.find(l => String(l._id || l.id) === String(land_id));

    const sorted = [...filtered].sort((a, b) => b.amount - a.amount);

    // Track which land_ids already have a cancel button shown (show once per land)
    const cancelShownForLand = new Set();

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
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server.');
        }
    };

    const handleCancelAuction = async () => {
        if (!cancelConfirm) return;
        const landId = cancelConfirm._id || cancelConfirm.id;
        setCancelling(true);
        try {
            const r = await fetch(`${API}/bids/cancel-auction/${landId}`, {
                method: 'POST',
                headers: authHeaders
            });
            if (r.ok) {
                alert(`✅ Auction for "${cancelConfirm.name}" has been cancelled. All bidders have been notified.`);
                setCancelConfirm(null);
                fetchData();
            } else {
                const err = await r.json();
                alert(`Error: ${err.detail || 'Could not cancel auction'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Failed to connect to server.');
        } finally {
            setCancelling(false);
        }
    };

    return (
        <>
            <div style={S.root}>
                {/* Header */}
                <div style={S.header}>
                    <div>
                        <h1 style={S.title}>Bids Overview</h1>
                        <p style={S.subtitle}>Manage and track all bid activities across your properties.</p>
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
                        const live = isAuctionLive(l);
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
                                    {live && (
                                        <div style={{ marginTop: '6px' }}>
                                            <button
                                                style={S.cancelAuctionBtn}
                                                onClick={(e) => { e.stopPropagation(); setCancelConfirm(l); }}
                                            >
                                                ✕ Cancel Bidding
                                            </button>
                                        </div>
                                    )}
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
                                const landObj = getLandObj(bid.land_id);
                                const ended = isAuctionEnded(landObj);
                                const live = isAuctionLive(landObj);

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
                                                >
                                                    {bid.buyer_email || ''}
                                                </a>
                                                {isHighest && ended && (
                                                    <div style={{ fontSize: '0.7rem', color: '#B25C00', fontWeight: '900', background: '#FFF3E0', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>🏆 WINNER</div>
                                                )}
                                                {isHighest && live && (
                                                    <div style={{ fontSize: '0.7rem', color: '#27ae60', fontWeight: '700', marginTop: '4px' }}>🔥 Current Highest</div>
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

                                        {/* Action */}
                                        <div style={{ ...S.cell, flex: 1.5, justifyContent: 'center', gap: '8px' }}>
                                            {isHighest && ended ? (
                                                notifiedIds.includes(String(bId)) ? (
                                                    <span style={{ color: '#27ae60', fontWeight: '800', fontSize: '0.8rem' }}>Notified ✅</span>
                                                ) : (
                                                    <button style={S.notifyBtn} onClick={() => handleNotify(bId)}>
                                                        🔔 Notify Winner
                                                    </button>
                                                )
                                            ) : live ? (
                                                <span style={{ fontSize: '0.72rem', color: '#27ae60', fontWeight: '700' }}>🟢 Live</span>
                                            ) : (
                                                <span style={{ fontSize: '0.72rem', color: '#aaa' }}>—</span>
                                            )}
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

            {/* ── Cancel Auction Confirmation Dialog ── */}
            {cancelConfirm && (
                <div style={S.overlay}>
                    <div style={S.dialog}>
                        <div style={S.dialogIcon}>⚠️</div>
                        <h3 style={S.dialogTitle}>Cancel Auction?</h3>
                        <p style={S.dialogBody}>
                            Are you sure you want to cancel the active bidding for <strong>"{cancelConfirm.name}"</strong>?
                            This will immediately close the auction and <strong>notify all bidders</strong>. This cannot be undone.
                        </p>
                        <div style={S.dialogBtns}>
                            <button style={S.dialogKeepBtn} onClick={() => setCancelConfirm(null)} disabled={cancelling}>
                                Keep Auction
                            </button>
                            <button style={S.dialogConfirmBtn} onClick={handleCancelAuction} disabled={cancelling}>
                                {cancelling ? 'Cancelling…' : 'Yes, Cancel Auction'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '6px' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '0.95rem' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', overflow: 'auto' },
    empty: { textAlign: 'center', padding: '80px 20px', color: '#bbb', fontSize: '1rem' },
    emptyState: { textAlign: 'center', padding: '80px 20px' },
    colHeader: { display: 'flex', padding: '14px 24px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', borderBottom: '2px solid var(--color-border)', gap: '12px' },
    bidRow: { display: 'flex', alignItems: 'center', padding: '18px 24px', gap: '12px', borderBottom: '1px solid var(--color-border)', transition: 'background 0.15s' },
    cell: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: 'var(--color-dark)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 },

    msgPanel: { background: '#FFFDF5', border: '1px solid #FFEBB0', borderRadius: '16px', padding: '24px', marginBottom: '28px' },
    msgTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
    msgGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
    msgCard: { background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid var(--color-border)' },
    msgHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    msgBadge: { fontSize: '0.75rem', fontWeight: '800', background: '#FFF9C4', padding: '3px 8px', borderRadius: '6px' },
    msgDate: { fontSize: '0.75rem', color: '#aaa' },
    msgText: { fontSize: '0.88rem', color: '#444', fontStyle: 'italic', margin: 0, lineHeight: '1.4' },

    landGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' },
    landCard: { display: 'flex', alignItems: 'flex-start', gap: '14px', background: '#fff', padding: '14px', borderRadius: '14px', border: '1px solid var(--color-border)', cursor: 'pointer', transition: 'all 0.15s ease-in-out', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' },
    landCardActive: { borderColor: 'var(--color-dark)', background: 'var(--color-bg)', boxShadow: 'var(--shadow-soft)' },
    landCardIcon: { fontSize: '1.8rem', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', borderRadius: '10px', flexShrink: 0 },
    landCardImg: { width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 },
    landCardContent: { overflow: 'hidden', flex: 1 },
    landCardName: { fontWeight: '700', fontSize: '0.9rem', color: 'var(--color-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    landCardStats: { fontSize: '0.75rem', color: '#888', marginTop: '2px' },

    cancelAuctionBtn: { padding: '5px 10px', background: '#FFF0EE', color: '#e74c3c', border: '1.5px solid #e74c3c', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
    notifyBtn: { padding: '8px 12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800', cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },

    // Confirmation dialog
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' },
    dialog: { background: '#fff', borderRadius: '20px', padding: '36px', maxWidth: '440px', width: '90%', textAlign: 'center', boxShadow: 'var(--shadow-elevated)', border: '1px solid var(--color-border)' },
    dialogIcon: { fontSize: '2.5rem', marginBottom: '12px' },
    dialogTitle: { fontSize: '1.25rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '12px', marginTop: 0 },
    dialogBody: { fontSize: '0.9rem', color: 'var(--color-text-soft)', lineHeight: '1.6', marginBottom: '28px' },
    dialogBtns: { display: 'flex', gap: '12px', justifyContent: 'center' },
    dialogKeepBtn: { padding: '12px 24px', background: '#fff', border: '1.5px solid var(--color-border)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', color: '#555' },
    dialogConfirmBtn: { padding: '12px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(231,76,60,0.3)' },
};

export default SellerBidsPage;
