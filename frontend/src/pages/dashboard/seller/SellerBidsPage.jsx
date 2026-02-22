import React, { useState, useEffect } from 'react';

const SELLER_ID = 'sunil_perera';



function getSeedListings() {
    return [
        { id: 101, name: 'Golden Valley Acres' },
        { id: 102, name: 'Ocean View Ridge' },
        { id: 103, name: 'Pine Forest Retreat' },
    ];
}

function getSeedBids(listingId) {
    const sets = {
        101: [
            { id: 'BID-001', bidder: 'Amal Perera', amount: 5800000, note: 'Willing to close by end of month', date: '2024-01-15', status: 'Pending' },
            { id: 'BID-002', bidder: 'Nimal Silva', amount: 5500000, note: 'Cash payment available', date: '2024-01-14', status: 'Pending' },
            { id: 'BID-003', bidder: 'Saman Ratnayake', amount: 6100000, note: 'Flexible on closing date', date: '2024-01-16', status: 'Pending' },
        ],
        102: [
            { id: 'BID-004', bidder: 'Kamal Fernando', amount: 16000000, note: 'Financing approved', date: '2024-01-13', status: 'Pending' },
            { id: 'BID-005', bidder: 'Priya Mendis', amount: 15500000, note: 'Ready to sign within the week', date: '2024-01-10', status: 'Pending' },
        ],
        103: [],
    };
    return sets[listingId] || [];
}

const SellerBidsPage = () => {
    const [listings, setListings] = useState([]);
    const [bids, setBids] = useState({});
    const [expandedListing, setExpandedListing] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem(`seller_listings_${SELLER_ID}`);
        const loadedListings = raw
            ? JSON.parse(raw).map(l => ({ id: l.id, name: l.name }))
            : getSeedListings();
        setListings(loadedListings);

        const allBids = {};
        loadedListings.forEach(l => {
            const bRaw = localStorage.getItem(`bids_land_${l.id}`);
            allBids[l.id] = bRaw ? JSON.parse(bRaw) : getSeedBids(l.id);
            if (!bRaw) localStorage.setItem(`bids_land_${l.id}`, JSON.stringify(allBids[l.id]));
        });
        setBids(allBids);
        // Expand the first listing by default
        if (loadedListings.length > 0) setExpandedListing(loadedListings[0].id);
    }, []);

    const allBids = listings.flatMap(l => (bids[l.id] || []).map(b => ({ ...b, listingName: l.name, listingId: l.id })));

    const getHighestBid = (listingBids) => {
        if (!listingBids || listingBids.length === 0) return null;
        return listingBids.reduce((a, b) => b.amount > a.amount ? b : a, listingBids[0]);
    };

    const getLatestBid = (listingBids) => {
        if (!listingBids || listingBids.length === 0) return null;
        return listingBids.reduce((a, b) => new Date(b.date) > new Date(a.date) ? b : a, listingBids[0]);
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Bids Overview</h1>
                    <p style={S.subtitle}>View all bids on your listings. Bid approval is managed by the platform.</p>
                </div>
            </div>

            {/* Info Banner */}
            <div style={S.infoBanner}>
                Sellers can view bids in read-only mode. Bid approval is handled by the platform administrator.
            </div>

            {/* Summary Cards per listing */}
            <div style={S.summaryGrid}>
                {listings.map(l => {
                    const lb = bids[l.id] || [];
                    const highest = getHighestBid(lb);
                    const latest = getLatestBid(lb);
                    return (
                        <div
                            key={l.id}
                            style={{ ...S.summaryCard, ...(expandedListing === l.id ? S.summaryCardActive : {}) }}
                            onClick={() => setExpandedListing(expandedListing === l.id ? null : l.id)}
                        >
                            <div style={S.summaryName}>{l.name}</div>
                            <div style={S.summaryRow}>
                                <span style={S.summaryMeta}>{lb.length} bid{lb.length !== 1 ? 's' : ''}</span>
                            </div>
                            {highest && (
                                <div style={S.summaryHighest}>
                                    <span style={S.highestLabel}>Highest</span>
                                    <span style={S.highestAmount}>Rs. {Number(highest.amount).toLocaleString()}</span>
                                </div>
                            )}
                            {latest && (
                                <div style={S.summaryLatest}>
                                    <span style={S.latestLabel}>Latest</span>
                                    <span style={S.latestAmount}>{latest.bidder} · {latest.date}</span>
                                </div>
                            )}
                            {lb.length === 0 && <div style={S.noBidsYet}>No bids yet</div>}
                        </div>
                    );
                })}
            </div>

            {/* Bid List for expanded listing */}
            {expandedListing !== null && (() => {
                const lb = bids[expandedListing] || [];
                const listing = listings.find(l => l.id === expandedListing);
                const highest = getHighestBid(lb);
                const latest = getLatestBid(lb);
                const sorted = [...lb].sort((a, b) => b.amount - a.amount); // sort by amount desc
                return (
                    <div style={S.detailSection}>
                        <h2 style={S.detailTitle}>Bids for — {listing?.name}</h2>



                        {sorted.length === 0 ? (
                            <div style={S.empty}>No bids yet for this property.</div>
                        ) : (
                            <div style={S.bidList}>
                                {sorted
                                    .map((bid, idx) => {
                                        const isHighest = highest && bid.id === highest.id;
                                        const isLatest = latest && bid.id === latest.id;
                                        return (
                                            <div key={bid.id} style={{ ...S.bidCard, ...(isHighest ? S.bidCardHighest : {}) }}>
                                                {/* Badges row */}
                                                <div style={S.badgesRow}>
                                                    <span style={S.bidNumber}>{bid.id}</span>
                                                    {isHighest && <span style={S.highestBadge}>Highest Bid</span>}
                                                    {isLatest && <span style={S.latestBadge}>Latest</span>}
                                                    <span style={{ marginLeft: 'auto', ...S.rankBadge }}>#{idx + 1}</span>
                                                </div>

                                                <div style={S.bidTop}>
                                                    <div>
                                                        <div style={S.bidBidder}>{bid.bidder}</div>
                                                        <div style={S.bidDate}>{bid.date}</div>
                                                    </div>
                                                    <div style={S.bidAmountWrap}>
                                                        <div style={{ ...S.bidAmount, ...(isHighest ? { color: '#2ecc71' } : {}) }}>
                                                            Rs. {Number(bid.amount).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {bid.note && <p style={S.bidNote}>"{bid.note}"</p>}
                                                <div style={S.bidFooterRow}>
                                                    <span style={S.viewOnly}>View only</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '20px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    infoBanner: { background: '#f5f0ea', border: '1px solid #e5ddd4', borderRadius: '10px', padding: '14px 20px', fontSize: '0.85rem', color: '#666', fontWeight: '500', marginBottom: '28px' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginBottom: '36px' },
    summaryCard: { background: '#fff', borderRadius: '14px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.18s' },
    summaryCardActive: { borderColor: '#1A1A1A', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
    summaryName: { fontWeight: '800', color: '#1A1A1A', fontSize: '0.95rem', marginBottom: '8px' },
    summaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    summaryMeta: { fontSize: '0.8rem', color: '#aaa', fontWeight: '600' },
    summaryHighest: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eafaf1', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px' },
    highestLabel: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2ecc71' },
    highestAmount: { fontWeight: '800', fontSize: '0.9rem', color: '#1A1A1A' },
    summaryLatest: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f5f0ea', borderRadius: '8px', padding: '8px 12px' },
    latestLabel: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#e67e22' },
    latestAmount: { fontSize: '0.78rem', color: '#555', fontWeight: '600', maxWidth: '160px', textAlign: 'right' },
    noBidsYet: { fontSize: '0.82rem', color: '#ccc', fontStyle: 'italic', marginTop: '8px' },
    detailSection: { background: '#fff', borderRadius: '20px', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' },
    detailTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px' },
    tabs: { display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' },
    tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '10px', border: '1.5px solid #e5e0da', background: '#fff', color: '#666', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" },
    tabActive: { background: '#1A1A1A', color: '#fff', borderColor: '#1A1A1A' },
    tabCount: { padding: '2px 8px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' },
    empty: { textAlign: 'center', color: '#aaa', padding: '40px 0', fontSize: '0.95rem' },
    bidList: { display: 'flex', flexDirection: 'column', gap: '14px' },
    bidCard: { background: '#fdfaf7', borderRadius: '12px', padding: '20px', border: '1px solid #f0ebe4' },
    bidCardHighest: { background: '#f0fdf5', border: '1px solid #a3e6c3' },
    badgesRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' },
    bidNumber: { fontSize: '0.72rem', fontWeight: '800', color: '#aaa', background: '#f0ebe4', padding: '3px 10px', borderRadius: '20px', letterSpacing: '0.05em' },
    highestBadge: { fontSize: '0.72rem', fontWeight: '800', color: '#fff', background: '#2ecc71', padding: '3px 10px', borderRadius: '20px' },
    latestBadge: { fontSize: '0.72rem', fontWeight: '800', color: '#fff', background: '#e67e22', padding: '3px 10px', borderRadius: '20px' },
    rankBadge: { fontSize: '0.72rem', fontWeight: '800', color: '#bbb', padding: '3px 8px', borderRadius: '20px', background: '#f5f0ea' },
    bidTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '6px' },
    bidBidder: { fontSize: '1rem', fontWeight: '700', color: '#1A1A1A' },
    bidDate: { fontSize: '0.75rem', color: '#bbb', marginTop: '2px' },
    bidAmountWrap: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' },
    bidAmount: { fontSize: '1.15rem', fontWeight: '800', color: '#1A1A1A' },
    statusBadge: { padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap' },
    bidNote: { fontSize: '0.85rem', color: '#666', fontStyle: 'italic', margin: '8px 0 0', paddingLeft: '12px', borderLeft: '3px solid #e8e3dc' },
    bidFooterRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f0ebe4' },
    viewOnly: { fontSize: '0.72rem', color: '#ccc', fontStyle: 'italic' },
};

export default SellerBidsPage;
