import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const BuyerBidsPage = () => {
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedBid, setSelectedBid] = useState(null);
    const [contactMessage, setContactMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(null); // bid object to cancel
    const [cancelling, setCancelling] = useState(false);

    const tok = localStorage.getItem('access_token');
    const authHeaders = { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
        if (!tok) { setLoading(false); return; }
        try {
            const bidsRes = await fetch(`${API}/bids/my-bids`, { headers: authHeaders });
            const bids = await bidsRes.json();
            setMyBids(Array.isArray(bids) ? bids : []);
        } catch (e) {
            console.error('Fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleContactSeller = async () => {
        if (!contactMessage.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`${API}/bids/contact-seller`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({ land_id: selectedBid.land_id, message: contactMessage })
            });
            if (res.ok) {
                alert('Message sent to seller successfully!');
                setShowContactModal(false);
                setContactMessage('');
            }
        } catch {
            alert('Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const handleCancelBid = async () => {
        if (!cancelConfirm) return;
        const bidId = cancelConfirm.id || cancelConfirm._id;
        setCancelling(true);
        try {
            const res = await fetch(`${API}/bids/${bidId}`, {
                method: 'DELETE',
                headers: authHeaders
            });
            if (res.ok || res.status === 204) {
                alert('✅ Your bid has been cancelled successfully.');
                setCancelConfirm(null);
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.detail || 'Could not cancel bid.'}`);
            }
        } catch {
            alert('Failed to connect to server.');
        } finally {
            setCancelling(false);
        }
    };

    // Helper: is this bid's auction still live?
    const isBidCancellable = (bid) => {
        // If bid is a winner, don't allow cancel
        if (bid.is_winner) return false;
        // If no status data from backend on bid_end — allow anyway, server will validate
        return true;
    };

    return (
        <>
            <div style={S.root}>
                <div style={S.header}>
                    <div>
                        <h1 style={S.title}>My Biddings</h1>
                        <p style={S.subtitle}>Overview of all bids you have placed on various listings.</p>
                    </div>
                    <div style={S.countBadge}>{myBids.length} total</div>
                </div>

                {loading ? (
                    <div style={S.empty}>Loading bids...</div>
                ) : myBids.length === 0 ? (
                    <div style={S.empty}>
                        You haven't placed any bids yet. <a href="/lands" style={S.browseLink}>Browse listings →</a>
                    </div>
                ) : (
                    <div style={S.grid}>
                        {myBids.map(bid => (
                            <div key={bid.id} style={{ ...S.card, border: bid.is_winner ? '2px solid #FFD700' : '1px solid #F0EBE4' }}>
                                {bid.is_winner && <div style={S.winnerMedal}>🏆 WINNER</div>}
                                <div style={S.cardHeader}>
                                    <h3 style={S.landName}>{bid.land_name || `Land #${bid.land_id}`}</h3>
                                    <span style={S.bidId}>BID ID: {String(bid.id).slice(-8).toUpperCase()}</span>
                                </div>
                                <div style={S.details}>
                                    <div style={S.detailRow}>
                                        <span style={S.detailLabel}>Amount</span>
                                        <span style={S.amount}>Rs. {Number(bid.amount).toLocaleString()}</span>
                                    </div>
                                    <div style={S.detailRow}>
                                        <span style={S.detailLabel}>Date</span>
                                        <span style={S.date}>{bid.created_at ? new Date(bid.created_at).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                                <div style={S.statusRow}>
                                    {bid.is_winner ? (
                                        <span style={{ ...S.activeBadge, background: '#FFF9C4', color: '#FBC02D' }}>WIN CONFIRMED</span>
                                    ) : (
                                        <span style={S.activeBadge}>Active Bid</span>
                                    )}
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {bid.is_winner && (
                                            <button
                                                style={{ ...S.viewBtn, background: '#1A1A1A', color: '#FFF' }}
                                                onClick={() => { setSelectedBid(bid); setShowContactModal(true); }}
                                            >
                                                Contact Seller
                                            </button>
                                        )}
                                        <button style={S.viewBtn} onClick={() => window.location.href = `/lands/${bid.land_id}`}>
                                            View Listing
                                        </button>
                                        {!bid.is_winner && (
                                            <button
                                                style={S.cancelBidBtn}
                                                onClick={() => setCancelConfirm(bid)}
                                            >
                                                ✕ Cancel Bid
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Contact Seller Modal ── */}
                {showContactModal && (
                    <div style={S.modalOverlay}>
                        <div style={S.modal}>
                            <h3>Contact Seller regarding {selectedBid?.land_name}</h3>
                            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>
                                Congratulations on your win! Send a message to the seller to finalize the purchase.
                            </p>
                            <textarea
                                style={S.textArea}
                                placeholder="Type your message here..."
                                value={contactMessage}
                                onChange={(e) => setContactMessage(e.target.value)}
                            />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                                <button style={{ ...S.viewBtn, flex: 1 }} onClick={() => setShowContactModal(false)}>Cancel</button>
                                <button
                                    style={{ ...S.viewBtn, flex: 1, background: '#1A1A1A', color: '#FFF' }}
                                    disabled={sending}
                                    onClick={handleContactSeller}
                                >
                                    {sending ? 'Sending...' : 'Send Message'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Cancel Bid Confirmation ── */}
            {cancelConfirm && (
                <div style={S.modalOverlay}>
                    <div style={{ ...S.modal, textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 12px', fontSize: '1.2rem', fontWeight: '800' }}>Cancel Your Bid?</h3>
                        <p style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6', marginBottom: '24px' }}>
                            Are you sure you want to cancel your bid of <strong>Rs. {Number(cancelConfirm.amount).toLocaleString()}</strong> on <strong>{cancelConfirm.land_name}</strong>?
                            This can only be done while the auction is still active.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                style={{ padding: '12px 24px', background: '#fff', border: '1.5px solid #ddd', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', color: '#555' }}
                                onClick={() => setCancelConfirm(null)}
                                disabled={cancelling}
                            >
                                Keep Bid
                            </button>
                            <button
                                style={{ padding: '12px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 12px rgba(231,76,60,0.3)' }}
                                onClick={handleCancelBid}
                                disabled={cancelling}
                            >
                                {cancelling ? 'Cancelling…' : 'Yes, Cancel Bid'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },

    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', letterSpacing: '-0.02em' },
    subtitle: { color: '#777', fontSize: '1rem', fontWeight: '500' },
    countBadge: { background: '#1A1A1A', color: '#fff', borderRadius: '30px', padding: '8px 18px', fontWeight: '700', fontSize: '0.85rem' },
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    browseLink: { color: '#1A1A1A', fontWeight: '800', textDecoration: 'none', marginLeft: '8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(26, 26, 26, 0.04)', border: '1px solid #F0EBE4', position: 'relative' },
    winnerMedal: { position: 'absolute', top: '-12px', left: '20px', background: '#FFD700', color: '#1A1A1A', padding: '4px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem', border: '2px solid #FFF' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F0EBE4', paddingBottom: '16px' },
    landName: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    bidId: { fontSize: '0.7rem', fontWeight: '700', color: '#CCC', textTransform: 'uppercase' },

    details: { display: 'flex', flexDirection: 'column', gap: '16px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: '0.85rem', color: '#888', fontWeight: '500' },
    amount: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A' },
    date: { fontSize: '0.95rem', fontWeight: '600', color: '#555' },

    statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', flexWrap: 'wrap', gap: '8px' },
    activeBadge: { background: '#E8F5E9', color: '#4CAF50', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' },
    viewBtn: { background: 'none', border: '1px solid #1A1A1A', color: '#1A1A1A', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },
    cancelBidBtn: { background: '#FFF0EE', color: '#e74c3c', border: '1.5px solid #e74c3c', padding: '8px 14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', transition: 'all 0.2s' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#FFF', padding: '32px', borderRadius: '24px', maxWidth: '450px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
    textArea: { width: '100%', height: '120px', borderRadius: '16px', border: '1px solid #EEE', padding: '16px', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', marginTop: '12px', boxSizing: 'border-box' },
};

export default BuyerBidsPage;
