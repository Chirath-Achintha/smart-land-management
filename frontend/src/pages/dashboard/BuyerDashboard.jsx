import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const API = 'http://127.0.0.1:8000';

const BuyerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // State for UI controls
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({});
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteVerification, setDeleteVerification] = useState('');

    // Fetch user from database using JWT token
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setProfileLoading(false); return; }

        fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const p = {
                    name: data.full_name || '',
                    email: data.email || '',
                    nic: data.nic_number || '',
                    address: data.address || '',
                    role: (data.role || '').replace('_', ' '),
                };
                setProfile(p);
                setTempProfile(p);
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));
    }, []);

    // Fetch available lands from DB
    const [availableLands, setAvailableLands] = useState([]);
    useEffect(() => {
        fetch('http://127.0.0.1:8000/lands/')
            .then(r => r.json())
            .then(data => setAvailableLands(Array.isArray(data) ? data : []))
            .catch(() => setAvailableLands([]));
    }, []);

    // Fetch the buyer's bids from DB
    const [myBids, setMyBids] = useState([]);
    useEffect(() => {
        const tok = localStorage.getItem('access_token');
        if (!tok) return;
        fetch('http://127.0.0.1:8000/bids/my-bids', {
            headers: { 'Authorization': `Bearer ${tok}` }
        })
            .then(r => r.json())
            .then(data => setMyBids(Array.isArray(data) ? data : []))
            .catch(() => setMyBids([]));
    }, []);

    // Fetch buyer's site visit requests from DB
    const [myVisits, setMyVisits] = useState([]);
    const [visitsLoading, setVisitsLoading] = useState(true);

    // Fetch buyer's service bookings from DB
    const [myServiceBkgs, setMyServiceBkgs] = useState([]);
    const [serviceBkgsLoading, setServiceBkgsLoading] = useState(true);

    useEffect(() => {
        const tok = localStorage.getItem('access_token');
        if (!tok) { setVisitsLoading(false); setServiceBkgsLoading(false); return; }
        const h = { Authorization: `Bearer ${tok}` };

        // Site visits
        fetch(`${API}/visits/my-requests`, { headers: h })
            .then(r => r.json())
            .then(d => setMyVisits(Array.isArray(d) ? d : []))
            .catch(() => setMyVisits([]))
            .finally(() => setVisitsLoading(false));

        // Service bookings
        fetch(`${API}/service-bookings/my`, { headers: h })
            .then(r => r.json())
            .then(d => setMyServiceBkgs(Array.isArray(d) ? d : []))
            .catch(() => setMyServiceBkgs([]))
            .finally(() => setServiceBkgsLoading(false));
    }, []);

    const VISIT_STATUS_COLOR = {
        Pending: { bg: '#FFF3E0', c: '#e65100' },
        Accepted: { bg: '#E8F5E9', c: '#2e7d32' },
        Rejected: { bg: '#FFEBEE', c: '#c62828' },
    };
    const BKG_STATUS_COLOR = {
        Scheduled: { bg: '#E3F2FD', c: '#1565c0' },
        'In Progress': { bg: '#FFF3E0', c: '#e65100' },
        Completed: { bg: '#E8F5E9', c: '#2e7d32' },
        Cancelled: { bg: '#FFEBEE', c: '#c62828' },
    };

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
        <div style={S.container}>
            <header style={S.header}>
                <h1 style={S.title}>Buyer Profile</h1>
                <p style={S.subtitle}>
                    {profileLoading ? 'Loading...' : <>Welcome, <strong>{profile?.name}</strong>! Overview of your property activities and profile.</>}
                </p>
            </header>

            <div style={S.grid}>
                {/* Profile Card */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <div style={S.cardTitle}>My Profile</div>
                        <div style={S.headerActions}>
                            {!isEditing ? (
                                <button style={S.editBtn} onClick={handleEditToggle}>Edit Profile</button>
                            ) : (
                                <div style={S.editActions}>
                                    <button style={S.saveBtn} onClick={handleSave}>Save Changes</button>
                                    <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={S.profileInfo}>
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

                {/* Available Lands from DB */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <div style={S.cardTitle}>
                            Available Land Listings
                            <span style={{ marginLeft: '10px', background: '#1A1A1A', color: '#fff', fontSize: '0.7rem', fontWeight: '700', borderRadius: '20px', padding: '2px 10px' }}>
                                {availableLands.length} Available
                            </span>
                        </div>
                        <button style={S.editBtn} onClick={() => navigate('/lands')}>Browse All</button>
                    </div>
                    <div style={S.list}>
                        {availableLands.length === 0 ? (
                            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>No listings available yet.</p>
                        ) : availableLands.slice(0, 3).map(land => (
                            <div key={land.id} style={S.listItem}>
                                {land.image_url && (
                                    <img src={land.image_url.split(',')[0]} alt={land.name}
                                        style={{ width: '52px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                                )}
                                <div style={S.listMain}>
                                    <h4 style={S.itemTitle}>{land.name}</h4>
                                    <span style={S.itemSub}>{land.village}, {land.district} • {land.perches} perches</span>
                                </div>
                                <div style={S.listAction}>
                                    <span style={S.amount}>Rs. {(land.total_price / 1000000).toFixed(1)}M</span>
                                    <span style={{ ...S.badge, backgroundColor: '#E8F5E9', color: '#4CAF50' }}>{land.land_type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bidding Summary */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <div style={S.cardTitle}>
                            My Biddings
                            <span style={{ marginLeft: '10px', background: '#1A1A1A', color: '#fff', fontSize: '0.7rem', fontWeight: '700', borderRadius: '20px', padding: '2px 10px' }}>
                                {myBids.length}
                            </span>
                        </div>
                    </div>
                    <div style={S.list}>
                        {myBids.length === 0 ? (
                            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>
                                You haven't placed any bids yet. <a href="/lands" style={{ color: '#1A1A1A', fontWeight: '700' }}>Browse listings →</a>
                            </p>
                        ) : myBids.map(bid => (
                            <div key={bid.id} style={S.listItem}>
                                <div style={S.listMain}>
                                    <h4 style={S.itemTitle}>Land #{bid.land_id}</h4>
                                    <span style={S.itemSub}>
                                        Bid #{bid.id} · {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : ''}
                                    </span>
                                    {bid.message && <span style={{ fontSize: '0.78rem', color: '#888', fontStyle: 'italic' }}>"{bid.message}"</span>}
                                </div>
                                <div style={S.listAction}>
                                    <span style={S.amount}>Rs. {Number(bid.amount).toLocaleString()}</span>
                                    <span style={{
                                        ...S.badge,
                                        backgroundColor: bid.status === 'Accepted' ? '#E8F5E9' : bid.status === 'Rejected' ? '#FFEBEE' : '#E3F2FD',
                                        color: bid.status === 'Accepted' ? '#4CAF50' : bid.status === 'Rejected' ? '#F44336' : '#1565c0'
                                    }}>
                                        {bid.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Site Visits Card */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <div style={S.cardTitle}>
                            My Site Visits
                            <span style={{ marginLeft: '10px', background: '#1A1A1A', color: '#fff', fontSize: '0.7rem', fontWeight: '700', borderRadius: '20px', padding: '2px 10px' }}>
                                {myVisits.length}
                            </span>
                        </div>
                        <button style={S.editBtn} onClick={() => navigate('/lands')}>Browse Lands</button>
                    </div>
                    <div style={S.list}>
                        {visitsLoading ? (
                            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>Loading…</p>
                        ) : myVisits.length === 0 ? (
                            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>
                                No site visits yet. <a href="/lands" style={{ color: '#1A1A1A', fontWeight: '700' }}>Browse lands →</a>
                            </p>
                        ) : myVisits.slice(0, 4).map(visit => {
                            const sc = VISIT_STATUS_COLOR[visit.status] || { bg: '#F5F5F5', c: '#888' };
                            return (
                                <div key={visit.id} style={S.listItem}>
                                    <div style={S.listMain}>
                                        <h4 style={S.itemTitle}>{visit.land_name || `Land #${visit.land_id}`}</h4>
                                        <span style={S.itemSub}>{visit.visit_date} at {visit.visit_time} · {visit.visit_type}</span>
                                    </div>
                                    <span style={{ ...S.badge, backgroundColor: sc.bg, color: sc.c }}>{visit.status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Service Bookings Card */}
                <div style={S.card}>
                    <div style={S.cardHeader}>
                        <div style={S.cardTitle}>
                            My Service Bookings
                            <span style={{ marginLeft: '10px', background: '#1A1A1A', color: '#fff', fontSize: '0.7rem', fontWeight: '700', borderRadius: '20px', padding: '2px 10px' }}>
                                {myServiceBkgs.length}
                            </span>
                        </div>
                        <button style={S.editBtn} onClick={() => navigate('/services')}>View All</button>
                    </div>
                    <div style={S.list}>
                        {serviceBkgsLoading ? (
                            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>Loading…</p>
                        ) : myServiceBkgs.length === 0 ? (
                            <p style={{ color: '#aaa', textAlign: 'center', padding: '20px 0', fontSize: '0.9rem' }}>
                                No service bookings yet. <a href="/services" style={{ color: '#1A1A1A', fontWeight: '700' }}>Book a service →</a>
                            </p>
                        ) : myServiceBkgs.slice(0, 4).map(bkg => {
                            const sc = BKG_STATUS_COLOR[bkg.status] || { bg: '#F5F5F5', c: '#888' };
                            return (
                                <div key={bkg.id} style={S.listItem}>
                                    <div style={S.listMain}>
                                        <h4 style={S.itemTitle}>{bkg.service_type}</h4>
                                        <span style={S.itemSub}>{bkg.preferred_date} at {bkg.preferred_time}</span>
                                    </div>
                                    <span style={{ ...S.badge, backgroundColor: sc.bg, color: sc.c }}>{bkg.status}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <h2 style={S.modalTitle}>Delete Your Account?</h2>
                        <p style={S.modalText}>
                            This action is permanent and cannot be undone. All your bidding history and profile data will be lost.
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
    container: { padding: '32px' },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '32px' },
    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
    cardTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A' },
    headerActions: { display: 'flex', gap: '12px' },
    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: '#F5F5F5', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#1A1A1A' },
    saveBtn: { padding: '8px 16px', background: '#1A1A1A', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#666' },

    profileInfo: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: '#AAA', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: '#1A1A1A' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '0.95rem', color: '#1A1A1A', fontWeight: '500', outline: 'none' },

    dangerZone: { marginTop: '32px', paddingTop: '24px', borderTop: '1px dashed #EEE', display: 'flex', justifyContent: 'flex-start' },
    deleteLink: { background: 'none', border: 'none', color: '#F44336', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', padding: 0, opacity: 0.7, textDecoration: 'underline' },

    list: { display: 'flex', flexDirection: 'column', gap: '16px' },
    listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '16px', backgroundColor: '#F9F9F9' },
    listMain: { display: 'flex', flexDirection: 'column', gap: '4px' },
    itemTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#1A1A1A', margin: 0 },
    itemSub: { fontSize: '0.8rem', color: '#888' },
    listAction: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' },
    amount: { fontSize: '1rem', fontWeight: '800', color: '#1A1A1A' },
    badge: { fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '10px', textTransform: 'uppercase' },
    itemAgent: { fontSize: '0.8rem', color: '#666', fontStyle: 'italic' },

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

export default BuyerDashboard;
