import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;
const SELLER_ID = 'sunil_perera';

function getSeedListings() {
    return [
        { id: 101, name: 'Golden Valley Acres', district: 'Kandy', village: 'Digana', perches: 40, pricePerPerch: 150000, totalPrice: 6000000, type: 'Agricultural', status: 'Available', roadAccess: '15ft Carpet Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' },
        { id: 102, name: 'Ocean View Ridge', district: 'Galle', village: 'Unawatuna', perches: 20, pricePerPerch: 850000, totalPrice: 17000000, type: 'Residential', status: 'Reserved', roadAccess: '20ft Concrete Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80' },
        { id: 103, name: 'Pine Forest Retreat', district: 'Nuwara Eliya', village: 'Nanu Oya', perches: 160, pricePerPerch: 300000, totalPrice: 48000000, type: 'Mixed', status: 'Sold', roadAccess: '12ft Gravel Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
    ];
}

const SellerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ active: 0, sold: 0, pendingBids: 0 });

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // Fetch user from DB using JWT
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setProfileLoading(false); return; }

        fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                setProfile({
                    name: data.full_name || '',
                    email: data.email || '',
                    nic: data.nic_number || '',
                    address: data.address || '',
                    role: (data.role || '').replace('_', ' '),
                });
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));
    }, []);

    // Load listing stats
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
        { label: 'Total Active Listings', value: stats.active, accent: 'var(--color-dark)' },
        { label: 'Total Sold Properties', value: stats.sold, accent: 'var(--color-primary)' },
        { label: 'Pending Bids', value: stats.pendingBids, accent: 'var(--color-accent)' },
    ];

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Seller Dashboard</h1>
                <p style={S.subtitle}>
                    {profileLoading ? 'Loading...' : <>Welcome back, <strong>{profile?.name}</strong>! Here's an overview of your land portfolio.</>}
                </p>
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

            <div style={S.dashboardContent}>
                <div style={S.mainColumn}>
                    {/* Quick Actions */}
                    <div style={S.sectionCard}>
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
                            <button style={{ ...S.actionBtn, ...S.outlineBtn }} onClick={() => navigate('/dashboard/seller/visits')}>
                                View Visit Requests
                            </button>
                        </div>
                    </div>
                </div>

                <div style={S.sideColumn}>
                    {/* Recent Activity */}
                    <div style={S.sectionCard}>
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
            </div>
        </div>
    );
};

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: 'var(--color-surface)', borderRadius: '16px', padding: '32px 28px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'transform 0.3s ease, box-shadow 0.3s ease', cursor: 'default' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: 'var(--color-text-soft)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: 'var(--color-surface)', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(85, 107, 47, 0.05)', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: 'rgba(85, 107, 47, 0.05)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-primary)' },
    saveBtn: { padding: '8px 16px', background: 'var(--color-primary)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--color-text-soft)' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-soft)', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: 'var(--color-dark)' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(85, 107, 47, 0.1)', background: 'var(--color-bg)', fontSize: '0.9rem', outline: 'none', color: 'var(--color-dark)' },

    dangerZone: { marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(244, 67, 54, 0.2)' },
    deleteLink: { background: 'none', border: 'none', color: '#F44336', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', opacity: 0.7 },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: 'var(--color-surface)', color: 'var(--color-primary)', border: '2px solid var(--color-border)' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid rgba(85, 107, 47, 0.05)' },
    actText: { flex: 1, fontSize: '0.9rem', color: 'var(--color-dark)', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: 'var(--color-text-soft)', whiteSpace: 'nowrap' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45, 58, 45, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: 'var(--color-surface)', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '12px' },
    modalText: { color: 'var(--color-text-soft)', marginBottom: '24px', lineHeight: '1.5' },
    verifyGroup: { marginBottom: '32px', textAlign: 'left' },
    verifyLabel: { fontSize: '0.85rem', display: 'block', marginBottom: '8px', color: 'var(--color-dark)' },
    verifyInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid rgba(85, 107, 47, 0.1)', fontSize: '1.1rem', fontWeight: '800', textAlign: 'center', letterSpacing: '2px', outline: 'none', color: 'var(--color-dark)', background: 'var(--color-bg)' },
    modalActions: { display: 'flex', flexDirection: 'column', gap: '12px' },
    confirmDeleteBtn: { padding: '16px', background: '#F44336', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    cancelDeleteBtn: { padding: '14px', background: 'transparent', color: 'var(--color-text-soft)', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }
};

export default SellerDashboard;
