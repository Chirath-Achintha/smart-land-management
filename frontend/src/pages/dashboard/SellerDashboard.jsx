import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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

    // Profile State
    const [profile, setProfile] = useState({
        name: 'Sunil Perera',
        email: user?.email || 'sunil@example.com',
        phone: '+94 71 987 6543',
        nic: '821234567V',
        address: 'No 12, Lake View, Kandy',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({ ...profile });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteVerification, setDeleteVerification] = useState('');

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
                            {Object.keys(profile).map(key => (
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
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: '#fff', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'transform 0.2s', cursor: 'default' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: '#888', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: '#F5F5F5', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#1A1A1A' },
    saveBtn: { padding: '8px 16px', background: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#666' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: '#AAA', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '0.9rem', outline: 'none' },

    dangerZone: { marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #EEE' },
    deleteLink: { background: 'none', border: 'none', color: '#F44336', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', opacity: 0.7 },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: '#fff', color: '#1A1A1A', border: '2px solid #1A1A1A' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid #f5f0ea' },
    actText: { flex: 1, fontSize: '0.9rem', color: '#333', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: '#aaa', whiteSpace: 'nowrap' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '440px', textAlign: 'center' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '12px' },
    modalText: { color: '#666', marginBottom: '24px', lineHeight: '1.5' },
    verifyGroup: { marginBottom: '32px', textAlign: 'left' },
    verifyLabel: { fontSize: '0.85rem', display: 'block', marginBottom: '8px', color: '#333' },
    verifyInput: { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #F0F0F0', fontSize: '1.1rem', fontWeight: '800', textAlign: 'center', letterSpacing: '2px', outline: 'none' },
    modalActions: { display: 'flex', flexDirection: 'column', gap: '12px' },
    confirmDeleteBtn: { padding: '16px', background: '#F44336', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    cancelDeleteBtn: { padding: '14px', background: 'transparent', color: '#666', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer' }
};

export default SellerDashboard;
