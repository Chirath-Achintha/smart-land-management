import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BuyerDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // State for Profile Details
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: user?.email || 'buyer@example.com',
        phone: '+94 77 123 4567',
        nic: '951234567V',
        address: 'No 45, Flower Road, Colombo 07',
    });

    // State for UI controls
    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({ ...profile });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteVerification, setDeleteVerification] = useState('');

    // Mock Bidding Details
    const myBids = [
        { id: 'BD-101', property: 'Beachfront Land in Galle', amount: '$45,000', status: 'Highest Bid', date: '2024-02-18' },
        { id: 'BD-105', property: 'Cinnamon Hill, Kandy', amount: '$32,500', status: 'Outbid', date: '2024-02-10' },
        { id: 'BD-112', property: 'Mount Breeze, Matara', amount: '$28,000', status: 'Winner', date: '2024-01-25' }
    ];

    // Mock Site Visit Schedules
    const myVisits = [
        { id: 'VST-201', property: 'Highland Park, Nuwara Eliya', date: '2024-03-05', time: '10:30 AM', status: 'Confirmed', agent: 'Sarath Perera' },
        { id: 'VST-198', property: 'Green Valley, Gampaha', date: '2024-02-22', time: '02:00 PM', status: 'Completed', agent: 'Sunil Silva' }
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
        <div style={S.container}>
            <header style={S.header}>
                <h1 style={S.title}>Buyer Profile</h1>
                <p style={S.subtitle}>Overview of your property activities and profile</p>
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

                {/* Bidding Summary */}
                <div style={S.card}>
                    <div style={S.cardTitle}>My Biddings</div>
                    <div style={S.list}>
                        {myBids.map(bid => (
                            <div key={bid.id} style={S.listItem}>
                                <div style={S.listMain}>
                                    <h4 style={S.itemTitle}>{bid.property}</h4>
                                    <span style={S.itemSub}>{bid.id} • {bid.date}</span>
                                </div>
                                <div style={S.listAction}>
                                    <span style={S.amount}>{bid.amount}</span>
                                    <span style={{
                                        ...S.badge,
                                        backgroundColor: bid.status === 'Winner' ? '#E8F5E9' : bid.status === 'Outbid' ? '#FFEBEE' : '#E3F2FD',
                                        color: bid.status === 'Winner' ? '#4CAF50' : bid.status === 'Outbid' ? '#F44336' : '#2196F3'
                                    }}>
                                        {bid.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Visits Summary */}
                <div style={S.card}>
                    <div style={S.cardTitle}>Site Visits</div>
                    <div style={S.list}>
                        {myVisits.map(visit => (
                            <div key={visit.id} style={S.listItem}>
                                <div style={S.listMain}>
                                    <h4 style={S.itemTitle}>{visit.property}</h4>
                                    <span style={S.itemSub}>{visit.date} at {visit.time}</span>
                                </div>
                                <div style={S.listAction}>
                                    <span style={S.itemAgent}>with {visit.agent}</span>
                                    <span style={{
                                        ...S.badge,
                                        backgroundColor: visit.status === 'Completed' ? '#F5F5F5' : '#E8F5E9',
                                        color: visit.status === 'Completed' ? '#999' : '#4CAF50'
                                    }}>
                                        {visit.status}
                                    </span>
                                </div>
                            </div>
                        ))}
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
