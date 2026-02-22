import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AGENT_ID = 'agent_001';

function getSeedBookings() {
    return [
        { id: 'BK-001', landId: 'LND-101', buyer: 'Kasun Kalhara', land: 'Golden Valley Acres', location: 'Digana, Kandy', seller: 'S. Perera', date: '2026-02-25', time: '10:30 AM', status: 'Upcoming' },
        { id: 'BK-002', landId: 'LND-102', buyer: 'Dinesh Gamage', land: 'Ocean View Ridge', location: 'Unawatuna, Galle', seller: 'G. Silva', date: '2026-02-26', time: '02:00 PM', status: 'Completed', report: 'Property visits went well. Buyer interested.' },
        { id: 'BK-003', landId: 'LND-103', buyer: 'Mahesh Kumara', land: 'Pine Forest Retreat', location: 'Nanu Oya', seller: 'M. Fernando', date: '2026-02-28', time: '09:15 AM', status: 'Assigned' },
        { id: 'BK-004', landId: 'LND-101', buyer: 'Ruwan Perera', land: 'Golden Valley Acres', location: 'Digana, Kandy', seller: 'S. Perera', date: '2026-03-01', time: '11:45 AM', status: 'Assigned' },
        { id: 'BK-005', landId: 'LND-105', buyer: 'Saman Silva', land: 'Uda Walawe View', location: 'Embilipitiya', seller: 'A. Rathnayake', date: '2026-03-05', time: '03:30 PM', status: 'Assigned' },
    ];
}

const AgentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('Upcoming'); // Assigned, Upcoming, Completed

    // Profile State
    const [profile, setProfile] = useState({
        name: 'Agent Silva',
        email: user?.email || 'silva.agent@example.com',
        phone: '+94 77 123 4567',
        nic: '851234567V',
        address: 'No 45, Main St, Colombo 07',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({ ...profile });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteVerification, setDeleteVerification] = useState('');

    // Report State
    const [showReportModal, setShowReportModal] = useState(false);
    const [activeReport, setActiveReport] = useState(null);
    const [reportNotes, setReportNotes] = useState('');

    useEffect(() => {
        const raw = localStorage.getItem(`agent_bookings_${AGENT_ID}`);
        const loaded = raw ? JSON.parse(raw) : getSeedBookings();
        setBookings(loaded);
        if (!raw) localStorage.setItem(`agent_bookings_${AGENT_ID}`, JSON.stringify(loaded));

    }, []);

    const saveBookings = (newBookings) => {
        setBookings(newBookings);
        localStorage.setItem(`agent_bookings_${AGENT_ID}`, JSON.stringify(newBookings));
    };

    const handleConfirm = (id) => {
        const updated = bookings.map(b => b.id === id ? { ...b, status: 'Upcoming' } : b);
        saveBookings(updated);
        alert('Site visit confirmed!');
    };

    const handleCancel = (id) => {
        if (window.confirm('Are you sure you want to cancel this visit?')) {
            const updated = bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b);
            saveBookings(updated);
        }
    };

    const handleReschedule = (id) => {
        const newDate = window.prompt('Enter new date (YYYY-MM-DD):', '2024-03-10');
        if (newDate) {
            const updated = bookings.map(b => b.id === id ? { ...b, date: newDate, status: 'Assigned' } : b);
            saveBookings(updated);
            alert('Visit rescheduled. Waiting for confirmation.');
        }
    };

    const openReportModal = (booking) => {
        setActiveReport(booking);
        setReportNotes('');
        setShowReportModal(true);
    };

    const handleSubmitReport = () => {
        if (!reportNotes.trim()) return alert('Please enter notes.');
        const updated = bookings.map(b => b.id === activeReport.id ? { ...b, status: 'Completed', report: reportNotes } : b);
        saveBookings(updated);
        setShowReportModal(false);
        alert('Site visit report submitted and marked as Completed!');
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
            alert('Account successfully deleted.');
            logout();
            navigate('/');
        } else {
            alert('Verification failed. Please type "DELETE" exactly.');
        }
    };

    const filteredBookings = bookings.filter(b => b.status === activeTab);
    const assignedCount = bookings.filter(b => b.status === 'Assigned').length;


    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Agent Dashboard</h1>
                </div>
                {assignedCount > 0 && (
                    <div style={S.notifBadge}>
                        <span style={S.notifPulse}></span>
                        You have {assignedCount} new assignments waiting!
                    </div>
                )}
            </div>


            <div style={S.dashboardContent}>
                <div style={S.mainColumn}>
                    {/* Filtering Tabs */}
                    <div style={S.tabBar}>
                        {['Assigned', 'Upcoming', 'Completed'].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                style={{ ...S.tab, ...(activeTab === t ? S.activeTab : {}) }}
                            >
                                {t} {t === 'Assigned' && assignedCount > 0 && <span style={S.count}>{assignedCount}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Site Visit List */}
                    <div style={S.sectionCard}>
                        <div style={S.tableWrap}>
                            {filteredBookings.length === 0 ? (
                                <div style={S.emptyState}>
                                    <div style={S.emptyIcon}>🗓️</div>
                                    <p style={S.emptyMsg}>No {activeTab.toLowerCase()} site visits found.</p>
                                </div>
                            ) : (
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            <th style={S.th}>Land ID & Location</th>
                                            <th style={S.th}>Parties (Buyer/Seller)</th>
                                            <th style={S.th}>Schedule</th>
                                            <th style={S.th}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredBookings.map((b, i) => (
                                            <tr key={b.id} style={{ ...S.tr, background: i % 2 === 0 ? '#fff' : '#fdfaf7' }}>
                                                <td style={S.td}>
                                                    <div style={S.landCell}>
                                                        <span style={S.landId}>{b.landId}</span>
                                                        <span style={S.landName}>{b.land}</span>
                                                        <span style={S.location}>{b.location}</span>
                                                    </div>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={S.partiesCell}>
                                                        <span style={S.partyLabel}>Buyer: <span style={S.partyValue}>{b.buyer}</span></span>
                                                        <span style={S.partyLabel}>Seller: <span style={S.partyValue}>{b.seller}</span></span>
                                                    </div>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={S.dateTime}>
                                                        <span style={S.date}>{b.date}</span>
                                                        <span style={S.time}>{b.time}</span>
                                                    </div>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={S.actionGroup}>
                                                        {b.status === 'Assigned' && (
                                                            <>
                                                                <button style={S.confirmBtn} onClick={() => handleConfirm(b.id)}>Accept</button>
                                                                <button style={S.outlineMiniBtn} onClick={() => handleReschedule(b.id)}>Reschedule</button>
                                                            </>
                                                        )}
                                                        {b.status === 'Upcoming' && (
                                                            <>
                                                                <button style={S.reportBtn} onClick={() => openReportModal(b)}>Submit Report</button>
                                                                <button style={S.cancelBtnSmall} onClick={() => handleCancel(b.id)}>Cancel</button>
                                                            </>
                                                        )}
                                                        {b.status === 'Completed' && (
                                                            <span style={S.reportBadge} title={b.report}>Report Filed ✅</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div style={S.sideColumn}>
                    {/* Profile Card */}
                    <div style={S.sectionCard}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>My Profile</h2>
                            {!isEditing ? (
                                <button style={S.editBtn} onClick={handleEditToggle}>Edit</button>
                            ) : (
                                <div style={S.editActions}>
                                    <button style={S.saveBtn} onClick={handleSave}>Save</button>
                                    <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            )}
                        </div>

                        <div style={S.profileList}>
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
                </div>
            </div>

            {/* Report Submission Modal */}
            {showReportModal && (
                <div style={S.modalOverlay}>
                    <div style={S.modalLarge}>
                        <h2 style={S.modalTitle}>Site Visit Report</h2>
                        <p style={S.modalSubtitle}>{activeReport?.land} | {activeReport?.landId}</p>

                        <div style={S.formGroup}>
                            <label style={S.formLabel}>Visit Notes</label>
                            <textarea
                                style={S.textarea}
                                placeholder="Describe the visit, Buyer feedback, etc."
                                value={reportNotes}
                                onChange={(e) => setReportNotes(e.target.value)}
                            ></textarea>
                        </div>


                        <div style={S.modalActionsRow}>
                            <button style={S.submitBtn} onClick={handleSubmitReport}>Submit & Mark Completed</button>
                            <button style={S.cancelBtn} onClick={() => setShowReportModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <h2 style={S.modalTitle}>Delete Your Account?</h2>
                        <p style={S.modalText}>This action is permanent and cannot be undone.</p>
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
    header: { marginBottom: '36px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    notifBadge: { background: '#1A1A1A', color: '#fff', padding: '12px 20px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    notifPulse: { width: '10px', height: '10px', background: '#3498db', borderRadius: '50%', display: 'inline-block', animation: 'blink 1.5s infinite' },


    tabBar: { display: 'flex', gap: '12px', marginBottom: '24px' },
    tab: { padding: '10px 24px', borderRadius: '10px', background: 'transparent', border: '1px solid #DDD', color: '#666', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
    activeTab: { background: '#1A1A1A', color: '#fff', border: '1px solid #1A1A1A' },
    count: { background: '#3498db', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '20px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #F0F0F0', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },

    tableWrap: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '16px', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#AAA', borderBottom: '2px solid #F9F9F9' },
    td: { padding: '16px', fontSize: '0.9rem', color: '#333', borderBottom: '1px solid #F9F9F9' },

    landCell: { display: 'flex', flexDirection: 'column', gap: '2px' },
    landId: { fontSize: '0.75rem', fontWeight: '800', color: '#3498db' },
    landName: { fontWeight: '700', color: '#1A1A1A' },
    location: { fontSize: '0.8rem', color: '#777' },

    partiesCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
    partyLabel: { fontSize: '0.8rem', color: '#888' },
    partyValue: { fontWeight: '700', color: '#1A1A1A' },

    dateTime: { display: 'flex', flexDirection: 'column', gap: '2px' },
    date: { fontWeight: '700', color: '#1A1A1A' },
    time: { fontSize: '0.75rem', color: '#999' },

    actionGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    confirmBtn: { padding: '6px 14px', background: '#2ecc71', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' },
    reportBtn: { padding: '6px 14px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' },
    outlineMiniBtn: { padding: '6px 12px', background: 'transparent', border: '1px solid #DDD', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', color: '#666' },
    cancelBtnSmall: { padding: '6px 14px', background: '#fdedec', color: '#e74c3c', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' },
    reportBadge: { color: '#2ecc71', fontWeight: '700', fontSize: '0.85rem' },

    emptyState: { textAlign: 'center', padding: '40px 0' },
    emptyIcon: { fontSize: '3rem', marginBottom: '16px' },
    emptyMsg: { color: '#AAA', fontWeight: '600' },

    profileList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '0.7rem', fontWeight: '800', color: '#BBB', textTransform: 'uppercase' },
    value: { fontSize: '0.95rem', fontWeight: '700', color: '#1A1A1A' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '0.9rem', outline: 'none' },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '6px 14px', background: '#F5F5F5', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', color: '#1A1A1A' },
    saveBtn: { padding: '6px 14px', background: '#1A1A1A', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#666' },

    dangerZone: { marginTop: '24px', paddingTop: '16px', borderTop: '1px dashed #EEE' },
    deleteLink: { background: 'none', border: 'none', color: '#F44336', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer', padding: 0, textDecoration: 'underline', opacity: 0.7 },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '400px', textAlign: 'center' },
    modalLarge: { background: '#fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '500px' },
    modalTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    modalSubtitle: { fontSize: '0.9rem', color: '#777', marginBottom: '24px' },
    modalText: { color: '#666', marginBottom: '24px', fontSize: '0.9rem' },

    formGroup: { marginBottom: '20px' },
    formLabel: { display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    textarea: { width: '100%', minHeight: '100px', padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '0.9rem', outline: 'none', resize: 'vertical' },

    modalActionsRow: { display: 'flex', gap: '12px', marginTop: '32px' },
    submitBtn: { flex: 2, padding: '14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' },

    confirmDeleteBtn: { padding: '16px', background: '#F44336', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' },
    cancelDeleteBtn: { padding: '12px', background: 'transparent', color: '#666', border: 'none', fontWeight: '600', cursor: 'pointer' }
};

export default AgentDashboard;
