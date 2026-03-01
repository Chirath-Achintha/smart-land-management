import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const BuyerBidsPage = () => {
    const [myBids, setMyBids] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tok = localStorage.getItem('access_token');
        if (!tok) { setLoading(false); return; }
        fetch(`${API}/bids/my-bids`, {
            headers: { 'Authorization': `Bearer ${tok}` }
        })
            .then(r => r.json())
            .then(data => setMyBids(Array.isArray(data) ? data : []))
            .catch(() => setMyBids([]))
            .finally(() => setLoading(false));
    }, []);

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
                        <div key={bid.id} style={S.card}>
                            <div style={S.cardHeader}>
                                <h3 style={S.landName}>Land #{bid.land_id}</h3>
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
                                {bid.message && (
                                    <div style={S.messageBox}>
                                        <span style={S.messageLabel}>Your Message</span>
                                        <p style={S.messageText}>"{bid.message}"</p>
                                    </div>
                                )}
                            </div>
                            <div style={S.statusRow}>
                                <span style={S.activeBadge}>Active Bid</span>
                                <button style={S.viewBtn} onClick={() => window.location.href = `/lands/${bid.land_id}`}>View Listing</button>
                            </div>
                        </div>
                    ))}
                </div>
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
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    browseLink: { color: '#1A1A1A', fontWeight: '800', textDecoration: 'none', marginLeft: '8px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(26, 26, 26, 0.04)', border: '1px solid #F0EBE4' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F0EBE4', paddingBottom: '16px' },
    landName: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A' },
    bidId: { fontSize: '0.75rem', fontWeight: '700', color: '#AAA', textTransform: 'uppercase' },

    details: { display: 'flex', flexDirection: 'column', gap: '16px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: '0.85rem', color: '#888', fontWeight: '500' },
    amount: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A' },
    date: { fontSize: '0.95rem', fontWeight: '600', color: '#555' },

    messageBox: { background: '#F9F7F5', borderRadius: '16px', padding: '16px', marginTop: '8px' },
    messageLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
    messageText: { fontSize: '0.88rem', color: '#444', lineHeight: '1.5', fontStyle: 'italic', margin: 0 },

    statusRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' },
    activeBadge: { background: '#E8F5E9', color: '#4CAF50', padding: '6px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' },
    viewBtn: { background: 'none', border: '1px solid #1A1A1A', color: '#1A1A1A', padding: '8px 16px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }
};

export default BuyerBidsPage;
