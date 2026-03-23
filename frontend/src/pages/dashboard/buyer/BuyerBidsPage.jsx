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

    const tok = localStorage.getItem('access_token');

    const fetchData = async () => {
        if (!tok) { setLoading(false); return; }
        try {
            const bidsRes = await fetch(`${API}/bids/my-bids`, { headers: { 'Authorization': `Bearer ${tok}` } });
            const bids = await bidsRes.json();
            setMyBids(Array.isArray(bids) ? bids : []);
        } catch (e) {
            console.error("Fetch error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000); // refresh every 30s
        return () => clearInterval(interval);
    }, []);


    const handleContactSeller = async () => {
        if (!contactMessage.trim()) return;
        setSending(true);
        try {
            const res = await fetch(`${API}/bids/contact-seller`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tok}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    land_id: selectedBid.land_id,
                    message: contactMessage
                })
            });
            if (res.ok) {
                alert("Message sent to seller successfully!");
                setShowContactModal(false);
                setContactMessage('');
            }
        } catch (e) {
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };


    return (
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
                        <div key={bid.id} className="ui-card ui-lift" style={{ ...S.card, border: bid.is_winner ? '2px solid var(--color-secondary)' : '1px solid rgba(38, 50, 56, 0.1)' }}>
                            {bid.is_winner && <div style={S.winnerMedal}>🏆 WINNER</div>}
                            <div style={S.cardHeader}>
                                <h3 style={S.landName}>{bid.land_name || `Land #${bid.land_id}`}</h3>
                                <span style={S.bidId}>Bid ID: {bid.id}</span>
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
                                    <span style={{ ...S.activeBadge, background: 'rgba(139, 195, 74, 0.22)', color: '#3f6e10' }}>WIN CONFIRMED</span>
                                ) : (
                                    <span style={S.activeBadge}>Active Bid</span>
                                )}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {bid.is_winner && (
                                        <button
                                            className="btn-primary"
                                            style={{ ...S.viewBtn, background: 'var(--color-primary)', color: '#FFF', border: 'none' }}
                                            onClick={() => { setSelectedBid(bid); setShowContactModal(true); }}
                                        >
                                            Contact Seller
                                        </button>
                                    )}
                                    <button style={S.viewBtn} onClick={() => window.location.href = `/lands/${bid.land_id}`}>View Listing</button>
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
                        <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '16px' }}>Congratulations on your win! Send a message to the seller to finalize the purchase.</p>
                        <textarea
                            style={S.textArea}
                            placeholder="Type your message here..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button style={{ ...S.viewBtn, flex: 1 }} onClick={() => setShowContactModal(false)}>Cancel</button>
                            <button
                                className="btn-primary"
                                style={{ ...S.viewBtn, flex: 1, background: 'var(--color-primary)', color: '#FFF', border: 'none' }}
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
    );
};

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },


    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '6px', letterSpacing: '-0.02em' },
    subtitle: { color: 'var(--color-muted)', fontSize: '1rem', fontWeight: '500' },
    countBadge: { background: 'var(--color-dark)', color: '#fff', borderRadius: '30px', padding: '8px 18px', fontWeight: '700', fontSize: '0.85rem' },
    empty: { textAlign: 'center', color: 'var(--color-muted)', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    browseLink: { color: 'var(--color-primary)', fontWeight: '800', textDecoration: 'none', marginLeft: '8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)', position: 'relative' },
    winnerMedal: { position: 'absolute', top: '-12px', left: '20px', background: 'var(--color-secondary)', color: 'var(--color-dark)', padding: '4px 12px', borderRadius: '10px', fontWeight: '900', fontSize: '0.7rem', border: '2px solid #FFF' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(38, 50, 56, 0.1)', paddingBottom: '16px' },
    landName: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)' },
    bidId: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-muted)', textTransform: 'uppercase' },

    details: { display: 'flex', flexDirection: 'column', gap: '16px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '500' },
    amount: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--color-dark)' },
    date: { fontSize: '0.95rem', fontWeight: '600', color: 'var(--color-muted)' },

    statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' },
    activeBadge: { background: 'rgba(76, 175, 80, 0.16)', color: 'var(--color-primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' },
    viewBtn: { background: 'none', border: '1px solid var(--color-dark)', color: 'var(--color-dark)', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(38, 50, 56, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { background: '#FFF', padding: '32px', borderRadius: '24px', maxWidth: '450px', width: '90%', border: '1px solid rgba(38, 50, 56, 0.12)' },
    textArea: { width: '100%', height: '120px', borderRadius: '16px', border: '1px solid rgba(38, 50, 56, 0.14)', padding: '16px', fontFamily: 'inherit', fontSize: '0.9rem', resize: 'none', marginTop: '12px' }
};

export default BuyerBidsPage;
