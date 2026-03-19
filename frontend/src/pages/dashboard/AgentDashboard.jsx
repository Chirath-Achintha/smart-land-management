import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../apiConfig';


const AgentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [activeTab, setActiveTab] = useState('Assigned'); // Assigned, Accepted, Completed
    const [loading, setLoading] = useState(false);

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

    // Profile Modal State
    const [showProfileModal, setShowProfileModal] = useState(false);

    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        const fetchAssignments = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/visits/my-assignments`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                const data = await res.json();
                if (res.ok) setBookings(Array.isArray(data) ? data : []);
            } catch (err) { console.error('Fetch error:', err); }
            setLoading(false);
        };
        fetchAssignments();
    }, []);

    const updateStatus = async (visitId, newStatus) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/visits/${visitId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const updated = await res.json();
                setBookings(prev => prev.map(b => (b._id || b.id) === visitId ? updated : b));
            }
        } catch (err) { alert('Update failed.'); }
        setIsUpdating(false);
    };

    const handleConfirm = (id) => updateStatus(id, 'Accepted');
    const handleCancel = (id) => updateStatus(id, 'Rejected');
    const handleReschedule = (id) => alert('Please contact the seller or admin to reschedule the date.');
    const handleSubmitReport = (id) => updateStatus(id, 'Completed');

    const filteredBookings = bookings.filter(b => b.status === activeTab);
    const assignedCount = bookings.filter(b => b.status === 'Assigned').length;


    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Agent Dashboard</h1>
                    {assignedCount > 0 && (
                        <div style={S.notifBadge}>
                            <span style={S.notifPulse}></span>
                            You have {assignedCount} new visits waiting!
                        </div>
                    )}
                </div>

            </div>

            <div style={S.dashboardContent}>
                <div style={S.mainColumn}>
                    {/* Filtering Tabs */}
                    <div style={S.tabBar}>
                        {['Assigned', 'Accepted', 'Completed'].map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                style={{ ...S.tab, ...(activeTab === t ? S.activeTab : {}) }}
                            >
                                {t === 'Assigned' ? 'Pending Action' : t} {t === 'Assigned' && assignedCount > 0 && <span style={S.count}>{assignedCount}</span>}
                            </button>
                        ))}
                    </div>

                    {/* Site Visit List */}
                    <div style={S.sectionCard}>
                        <div style={S.tableWrap}>
                            {filteredBookings.length === 0 ? (
                                <div style={S.emptyState}>
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
                                                        <span style={S.landName}>{b.land_name || b.land_id}</span>
                                                        <span style={S.location}>{b.land_address}</span>
                                                    </div>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={S.partiesCell}>
                                                        <span style={S.partyLabel}>Buyer: <span style={S.partyValue}>{b.buyer_name || 'N/A'}</span></span>
                                                        <span style={S.partyLabel}>Seller: <span style={S.partyValue}>{b.seller_name || 'N/A'}</span></span>
                                                    </div>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={S.dateTime}>
                                                        <span style={S.date}>{b.visit_date}</span>
                                                        <span style={S.time}>{b.visit_time}</span>
                                                    </div>
                                                </td>
                                                <td style={S.td}>
                                                    <div style={S.actionGroup}>
                                                        {b.status === 'Assigned' && (
                                                            <>
                                                                <button style={S.confirmBtn} onClick={() => handleConfirm(b._id || b.id)}>Accept Visit</button>
                                                                <button style={S.cancelBtnSmall} onClick={() => handleCancel(b._id || b.id)}>Decline</button>
                                                            </>
                                                        )}
                                                        {b.status === 'Accepted' && (
                                                            <>
                                                                <button style={S.reportBtn} onClick={() => handleSubmitReport(b._id || b.id)}>Mark as Completed</button>
                                                            </>
                                                        )}
                                                        {b.status === 'Completed' && (
                                                            <span style={S.reportBadge}>Visit Fully Completed ✅</span>
                                                        )}
                                                        {b.status === 'Rejected' && (
                                                            <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>Declined</span>
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
            </div>

            {/* Profile Modal */}
            {showProfileModal && (
                <div style={S.modalOverlay}>
                    <div style={S.modalLarge}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>My Profile</h2>
                            {!isEditing ? (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button style={S.editBtn} onClick={handleEditToggle}>Edit</button>
                                    <button style={S.cancelBtn} onClick={() => setShowProfileModal(false)}>Close</button>
                                </div>
                            ) : (
                                <div style={S.editActions}>
                                    <button style={S.saveBtn} onClick={handleSave}>Save</button>
                                    <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel Editing</button>
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
            )}

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

    profilePicWrapper: { cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    profileInitials: { width: '48px', height: '48px', background: '#3498db', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },

    dashboardContent: { display: 'flex', flexDirection: 'column', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' },

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
