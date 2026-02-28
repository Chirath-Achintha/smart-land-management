import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ active: 0, sold: 0, pendingBids: 0 });

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteVerification, setDeleteVerification] = useState('');

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
                setTempProfile({
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
        { label: 'Total Active Listings', value: stats.active, accent: '#1A1A1A' },
        { label: 'Total Sold Properties', value: stats.sold, accent: '#2ecc71' },
        { label: 'Pending Bids', value: stats.pendingBids, accent: '#e67e22' },
    ];

    const handleEditToggle = () => {
        setTempProfile({ ...profile });
        setIsEditing(true);
    };

    const handleSave = () => {
        setProfile({ ...tempProfile });
        setIsEditing(false);
        alert('Profile updated successfully!');
    };

    const handleDeleteAccount = () => {
        if (deleteVerification === 'DELETE') {
            alert('Account successfully deleted. Navigating to landing page.');
            logout();
            navigate('/');
        } else {
            alert('Verification failed. Please type "DELETE" exactly.');
        }
    };

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
                    {/* Profile Card */}
                    <div style={S.sectionCard}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>My Profile</h2>
                            {!isEditing ? (
                                <button style={S.editBtn} onClick={handleEditToggle}>Edit Profile</button>
                            ) : (
                                <div style={S.editActions}>
                                    <button style={S.saveBtn} onClick={handleSave}>Save</button>
                                    <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            )}
                        </div>

                        <div style={S.profileGrid}>
                            {profile && Object.keys(profile).map(key => (
                                <div key={key} style={S.profileItem}>
                                    <span style={S.label}>{key.replace('nic', 'NIC').toUpperCase()}</span>
                                    {isEditing ? (
                                        <input
                                            style={S.input}
                                            value={tempProfile[key]}
                                            onChange={(e) => setTempProfile({ ...tempProfile, [key]: e.target.value })}
                                        />
                                    ) : (
                                        <span style={S.value}>{profile[key]}</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div style={S.dangerZone}>
                            <button style={S.deleteLink} onClick={() => setShowDeleteConfirm(true)}>Delete Account</button>
                        </div>
                    </div>

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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <h2 style={S.modalTitle}>Delete Your Account?</h2>
                        <p style={S.modalText}>
                            This action is permanent and cannot be undone. All your listings and history data will be lost.
                        </p>
                        <div style={S.verifyGroup}>
                            <label style={S.verifyLabel}>Type <strong>DELETE</strong> to confirm</label>
                            <input
                                style={S.verifyInput}
                                placeholder="DELETE"
                                value={deleteVerification}
                                onChange={(e) => setDeleteVerification(e.target.value)}
                            />
                        </div>
                        <div style={S.modalActions}>
                            <button style={S.confirmDeleteBtn} onClick={handleDeleteAccount}>Permanently Delete</button>
                            <button style={S.cancelDeleteBtn} onClick={() => { setShowDeleteConfirm(false); setDeleteVerification(''); }}>Go Back</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: 'var(--sage-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--sage-text-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--sage-text-med)', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: 'var(--sage-card)', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'transform 0.2s', cursor: 'default' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: 'var(--sage-text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: 'var(--sage-card)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(85, 107, 47, 0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(85, 107, 47, 0.05)', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--sage-text-dark)', margin: 0 },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: 'rgba(85, 107, 47, 0.05)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-primary)' },
    saveBtn: { padding: '8px 16px', background: 'var(--sage-primary)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-text-med)' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--sage-text-light)', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: 'var(--sage-text-dark)' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(85, 107, 47, 0.1)', background: 'var(--sage-bg)', fontSize: '0.9rem', outline: 'none', color: 'var(--sage-text-dark)' },

    dangerZone: { marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed rgba(244, 67, 54, 0.2)' },
    deleteLink: { background: 'none', border: 'none', color: '#F44336', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', opacity: 0.7 },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: 'var(--sage-card)', color: 'var(--sage-primary)', border: '2px solid var(--sage-primary)' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid rgba(85, 107, 47, 0.05)' },
    actText: { flex: 1, fontSize: '0.9rem', color: 'var(--sage-text-dark)', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: 'var(--sage-text-light)', whiteSpace: 'nowrap' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(45, 58, 45, 0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: 'var(--sage-card)', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--sage-text-dark)', marginBottom: '12px' },
    modalText: { color: 'var(--sage-text-med)', marginBottom: '24px', lineHeight: '1.5' },
    verifyGroup: { marginBottom: '32px', textAlign: 'left' },
    verifyLabel: { fontSize: '0.85rem', display: 'block', marginBottom: '8px', color: 'var(--sage-text-dark)' },
    verifyInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid rgba(85, 107, 47, 0.1)', fontSize: '1.1rem', fontWeight: '800', textAlign: 'center', letterSpacing: '2px', outline: 'none', color: 'var(--sage-text-dark)', background: 'var(--sage-bg)' },
    modalActions: { display: 'flex', flexDirection: 'column', gap: '12px' },
    confirmDeleteBtn: { padding: '16px', background: '#F44336', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    cancelDeleteBtn: { padding: '14px', background: 'transparent', color: 'var(--sage-text-med)', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }
};

export default SellerDashboard;
