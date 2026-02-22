import React, { useState, useEffect } from 'react';

const SELLER_ID = 'sunil_perera';

const TABS = ['Active', 'Winning', 'Rejected', 'Closed'];

const TAB_COLORS = {
    Active: { bg: '#eafaf1', color: '#27ae60', dot: '#2ecc71' },
    Winning: { bg: '#eaf4fb', color: '#2980b9', dot: '#3498db' },
    Rejected: { bg: '#fef5e7', color: '#e67e22', dot: '#f39c12' },
    Closed: { bg: '#f0f0f0', color: '#888', dot: '#bbb' },
};

function getSeedListings() {
    return [
        { id: 101, name: 'Golden Valley Acres', district: 'Kandy', village: 'Digana', status: 'Available', baseBid: 5500000, auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
        { id: 102, name: 'Ocean View Ridge', district: 'Galle', village: 'Unawatuna', status: 'Reserved', baseBid: 16000000, auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString() },
        { id: 103, name: 'Pine Forest Retreat', district: 'Nuwara Eliya', village: 'Nanu Oya', status: 'Sold', baseBid: 45000000, auctionEnd: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    ];
}

function getSeedBids(landId, land) {
    return [
        { id: Date.now() - 5000, name: 'Saman Kumara', amount: land.baseBid + 500000, time: '10 mins ago', date: '2024-02-20', bidder: 'Saman Kumara', status: undefined, isUser: false },
        { id: Date.now() - 10000, name: 'Anura Perera', amount: land.baseBid + 200000, time: '1 hour ago', date: '2024-02-20', bidder: 'Anura Perera', status: undefined, isUser: false },
    ];
}

const SellerBidsPage = () => {
    const [activeTab, setActiveTab] = useState('Active');
    const [allBids, setAllBids] = useState([]);
    const [listings, setListings] = useState([]);
    const [selectedLand, setSelectedLand] = useState('all');

    useEffect(() => {
        const raw = localStorage.getItem(`seller_listings_${SELLER_ID}`);
        const myListings = raw ? JSON.parse(raw) : getSeedListings();

        // Ensure seed bids exist in localStorage for each listing
        myListings.forEach(l => {
            const key = `bids_land_${l.id}`;
            if (!localStorage.getItem(key)) {
                localStorage.setItem(key, JSON.stringify(getSeedBids(l.id, l)));
            }
        });

        setListings(myListings);

        // Aggregate all bids with land context
        const aggregated = [];
        myListings.forEach(l => {
            const bidsRaw = localStorage.getItem(`bids_land_${l.id}`);
            const bids = bidsRaw ? JSON.parse(bidsRaw) : [];
            const auctionEnded = new Date(l.auctionEnd).getTime() < Date.now();
            const maxAmount = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : 0;

            bids.forEach(b => {
                let computedStatus;
                if (l.status === 'Sold') {
                    computedStatus = b.amount === maxAmount ? 'Winning' : 'Rejected';
                } else if (auctionEnded) {
                    computedStatus = b.amount === maxAmount ? 'Winning' : 'Closed';
                } else {
                    computedStatus = 'Active';
                }

                aggregated.push({
                    ...b,
                    land: l,
                    computedStatus,
                    isHighest: b.amount === maxAmount,
                });
            });
        });

        // Sort by amount descending
        aggregated.sort((a, b) => b.amount - a.amount);
        setAllBids(aggregated);
    }, []);

    const filtered = allBids.filter(b => {
        const matchTab = b.computedStatus === activeTab;
        const matchLand = selectedLand === 'all' || String(b.land.id) === String(selectedLand);
        return matchTab && matchLand;
    });

    const countFor = (tab) => allBids.filter(b => b.computedStatus === tab).length;

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Bids Overview</h1>
                    <p style={S.subtitle}>Track and manage all bid activities on your listings.</p>
                </div>
                <select
                    style={S.filterSelect}
                    value={selectedLand}
                    onChange={e => setSelectedLand(e.target.value)}
                >
                    <option value="all">All Listings</option>
                    {listings.map(l => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>
            </div>

            {/* Tab Bar */}
            <div style={S.tabBar}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab;
                    const tc = TAB_COLORS[tab];
                    const count = countFor(tab);
                    return (
                        <button
                            key={tab}
                            style={{
                                ...S.tabBtn,
                                background: isActive ? tc.bg : 'transparent',
                                color: isActive ? tc.color : '#888',
                                borderBottom: isActive ? `3px solid ${tc.dot}` : '3px solid transparent',
                                fontWeight: isActive ? '800' : '600',
                            }}
                            onClick={() => setActiveTab(tab)}
                        >
                            <span style={{ ...S.tabDot, background: tc.dot }} />
                            {tab}
                            <span style={{
                                ...S.tabCount,
                                background: isActive ? tc.dot : '#e5e0da',
                                color: isActive ? '#fff' : '#888',
                            }}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Bids List */}
            <div style={S.bidsContainer}>
                {filtered.length === 0 ? (
                    <div style={S.empty}>
                        <p>No {activeTab.toLowerCase()} bids found for this selection.</p>
                    </div>
                ) : (
                    <div style={S.bidsList}>
                        {/* Column Header */}
                        <div style={S.colHeader}>
                            <span style={{ flex: '2' }}>Bidder</span>
                            <span style={{ flex: '2' }}>Property</span>
                            <span style={{ flex: '1', textAlign: 'right' }}>Bid Amount</span>
                            <span style={{ flex: '1', textAlign: 'center' }}>Time</span>
                            <span style={{ flex: '1', textAlign: 'center' }}>Status</span>
                        </div>
                        {filtered.map((b, i) => {
                            const tc = TAB_COLORS[b.computedStatus];
                            return (
                                <div
                                    key={`${b.id}-${i}`}
                                    style={{
                                        ...S.bidRow,
                                        background: i % 2 === 0 ? '#fff' : '#fdfaf7',
                                        borderLeft: b.isHighest ? `4px solid ${tc.dot}` : '4px solid transparent',
                                    }}
                                >
                                    <div style={{ ...S.bidCell, flex: '2' }}>
                                        <div style={S.avatar}>{(b.name || b.bidder || 'U').charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div style={{ fontWeight: '700', color: '#1A1A1A', fontSize: '0.9rem' }}>{b.name || b.bidder}</div>
                                            {b.isHighest && (
                                                <div style={{ fontSize: '0.7rem', color: tc.color, fontWeight: '700' }}>
                                                    ★ Highest Bidder
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ ...S.bidCell, flex: '2' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#333' }}>{b.land.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#999' }}>{b.land.village}, {b.land.district}</div>
                                        </div>
                                    </div>
                                    <div style={{ ...S.bidCell, flex: '1', justifyContent: 'flex-end' }}>
                                        <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1A1A1A' }}>
                                            Rs. {Number(b.amount).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ ...S.bidCell, flex: '1', justifyContent: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{b.time || b.date}</span>
                                    </div>
                                    <div style={{ ...S.bidCell, flex: '1', justifyContent: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            background: tc.bg,
                                            color: tc.color,
                                            border: `1px solid ${tc.dot}`,
                                        }}>
                                            {b.computedStatus}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    filterSelect: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e5e0da', background: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem', cursor: 'pointer', outline: 'none' },
    tabBar: { display: 'flex', gap: '4px', marginBottom: '24px', background: '#fff', borderRadius: '12px', padding: '8px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', flexWrap: 'wrap' },
    tabBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif" },
    tabDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
    tabCount: { padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', transition: 'all 0.2s' },
    bidsContainer: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'hidden' },
    empty: { textAlign: 'center', padding: '80px 20px', color: '#bbb' },
    bidsList: {},
    colHeader: { display: 'flex', padding: '14px 24px', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#aaa', borderBottom: '2px solid #f5f0ea', gap: '12px' },
    bidRow: { display: 'flex', alignItems: 'center', padding: '18px 24px', gap: '12px', borderBottom: '1px solid #f5f0ea', transition: 'background 0.15s' },
    bidCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    avatar: { width: '38px', height: '38px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1rem', flexShrink: 0 },
};

export default SellerBidsPage;
