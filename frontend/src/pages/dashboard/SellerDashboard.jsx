import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SELLER_ID = 'sunil_perera';
const SELLER_ID = 'sunil_perera'; // demo seller id

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ active: 0, sold: 0, pendingBids: 0 });

    useEffect(() => {
        const raw = localStorage.getItem(`seller_listings_${SELLER_ID}`);
        const listings = raw ? JSON.parse(raw) : getSeedListings();
        if (!raw) localStorage.setItem(`seller_listings_${SELLER_ID}`, JSON.stringify(listings));

        const active = listings.filter(l => l.status === 'Available').length;
        const sold = listings.filter(l => l.status === 'Sold').length;

        let pendingBids = 0;
        listings.forEach(l => {
            const bidsRaw = localStorage.getItem(`bids_land_${l.id}`);
            if (bidsRaw) {
                const bids = JSON.parse(bidsRaw);
                pendingBids += bids.filter(b => b.status === 'Pending' || !b.status).length;
            }
        });
        setStats({ active, sold, pendingBids });
    }, []);

    const cards = [
        { label: 'Total Active Listings', value: stats.active, accent: '#1A1A1A' },
        { label: 'Total Sold Properties', value: stats.sold, accent: '#2ecc71' },
        { label: 'Pending Bids', value: stats.pendingBids, accent: '#e67e22' },
    ];

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Seller Dashboard</h1>
                <p style={S.subtitle}>Welcome back! Here's an overview of your land portfolio.</p>
            </div>

            {/* Summary Cards */}
            <div style={S.cardGrid}>
                {cards.map((c, i) => (
                    <div key={i} style={{ ...S.card, borderTop: `4px solid ${c.accent}` }}>
                        <div style={{ ...S.statVal, color: c.accent }}>{c.value}</div>
                        <div style={S.statLabel}>{c.label}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div style={S.section}>
                <h2 style={S.sectionTitle}>Quick Actions</h2>
                <div style={S.btnRow}>
                    <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/seller/listings')}>
                        Manage My Listings
                    </button>
                    <button style={{ ...S.actionBtn, ...S.outlineBtn }} onClick={() => navigate('/dashboard/seller/bids')}>
                        View Bids
                    </button>
                    <button style={{ ...S.actionBtn, ...S.outlineBtn }} onClick={() => navigate('/dashboard/seller/availability')}>
                        Set Availability
                    </button>
                    <button
                        className="btn-dark"
                        style={S.actionBtn}
                        onClick={() => navigate('/dashboard/seller/listings')}
                    >
                        Manage My Listings
                    </button>
                    <button
                        style={{ ...S.actionBtn, ...S.outlineBtn }}
                        onClick={() => navigate('/dashboard/seller/bids')}
                    >
                        View Bids
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div style={S.section}>
                <h2 style={S.sectionTitle}>Recent Activity</h2>
                <div style={S.activityList}>
                    {[
                        { text: 'Golden Valley Acres — new bid received', time: '2 hrs ago' },
                        { text: 'Ocean View Ridge — price updated', time: '1 day ago' },
                        { text: 'Pine Forest Retreat — marked as Sold', time: '3 days ago' },
                    ].map((a, i) => (
                        <div key={i} style={S.activityItem}>
                            <span style={S.actText}>{a.text}</span>
                            <span style={S.actTime}>{a.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

function getSeedListings() {
    return [
        { id: 101, name: 'Golden Valley Acres', district: 'Kandy', village: 'Digana', perches: 40, pricePerPerch: 150000, totalPrice: 6000000, type: 'Agricultural', status: 'Available', roadAccess: '15ft Carpet Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' },
        { id: 102, name: 'Ocean View Ridge', district: 'Galle', village: 'Unawatuna', perches: 20, pricePerPerch: 850000, totalPrice: 17000000, type: 'Residential', status: 'Reserved', roadAccess: '20ft Concrete Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80' },
        { id: 103, name: 'Pine Forest Retreat', district: 'Nuwara Eliya', village: 'Nanu Oya', perches: 160, pricePerPerch: 300000, totalPrice: 48000000, type: 'Mixed', status: 'Sold', roadAccess: '12ft Gravel Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
    ];
}

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '48px' },
    card: { background: '#fff', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px' },
    card: { background: '#fff', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'transform 0.2s', cursor: 'default' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },
    section: { marginBottom: '40px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px' },
    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: '#fff', color: '#1A1A1A', border: '2px solid #1A1A1A' },
    activityList: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 24px', borderBottom: '1px solid #f5f0ea' },
    actText: { flex: 1, fontSize: '0.9rem', color: '#333', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: '#aaa', whiteSpace: 'nowrap' },
};

export default SellerDashboard;
