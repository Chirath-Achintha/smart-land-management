import React, { useState, useEffect } from 'react';

const ConstructorServiceBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [filter, setFilter] = useState('All');
    const [activeBooking, setActiveBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem('all_service_bookings');
        if (raw) {
            setBookings(JSON.parse(raw));
        } else {
            // Seed Data for Demonstration
            const seed = [
                { id: 'B-8801', service: 'Construction', buyerName: 'Anura Kumara', buyerEmail: 'anura@example.lk', date: '2026-03-10', startTime: '09:00 AM', status: 'Scheduled', price: '$25,000+', notes: 'Building a 3-bedroom villa in Kandy.' },
                { id: 'B-8802', service: 'Land Development', buyerName: 'Nimal Siriwardena', buyerEmail: 'nimal@example.lk', date: '2026-03-12', startTime: '11:30 AM', status: 'In Progress', price: '$5,000+', notes: 'Clearing 20 perches of land in Negombo.' }
            ];
            setBookings(seed);
            localStorage.setItem('all_service_bookings', JSON.stringify(seed));
        }
    }, []);

    const handleUpdateStatus = (id, newStatus) => {
        const updated = bookings.map(b => b.id === id ? { ...b, status: newStatus } : b);
        setBookings(updated);
        localStorage.setItem('all_service_bookings', JSON.stringify(updated));
        if (activeBooking?.id === id) setActiveBooking({ ...activeBooking, status: newStatus });
    };

    const filtered = bookings.filter(b => filter === 'All' || b.status === filter);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Service Requests</h1>
                <p style={S.subtitle}>Review and manage service bookings from buyers.</p>
            </div>

            <div style={S.toolbar}>
                <div style={S.filterBar}>
                    {['All', 'Scheduled', 'In Progress', 'Completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{ ...S.filterBtn, ...(filter === f ? S.activeFilter : {}) }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={S.tableCard}>
                <table style={S.table}>
                    <thead>
                        <tr style={S.tableHeaderTr}>
                            <th style={S.th}>Booking ID</th>
                            <th style={S.th}>Service</th>
                            <th style={S.th}>Buyer</th>
                            <th style={S.th}>Schedule</th>
                            <th style={S.th}>Status</th>
                            <th style={S.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={S.emptyTd}>No service requests found.</td>
                            </tr>
                        ) : (
                            filtered.map((b, i) => (
                                <tr key={i} style={S.tr}>
                                    <td style={S.td}><span style={S.idSpan}>{b.id}</span></td>
                                    <td style={S.td}><strong>{b.service}</strong></td>
                                    <td style={S.td}>
                                        <div style={S.buyerInfo}>
                                            <span style={S.buyerName}>{b.buyerName}</span>
                                            <span style={S.buyerEmail}>{b.buyerEmail}</span>
                                        </div>
                                    </td>
                                    <td style={S.td}>{b.date} at {b.startTime}</td>
                                    <td style={S.td}>
                                        <span style={{ ...S.statusBadge, ...getStatusStyle(b.status) }}>
                                            {b.status}
                                        </span>
                                    </td>
                                    <td style={S.td}>
                                        <div style={S.actionRow}>
                                            <button style={S.viewBtn} onClick={() => { setActiveBooking(b); setShowModal(true); }}>View</button>
                                            {b.status === 'Scheduled' && (
                                                <button style={S.actionBtn} onClick={() => handleUpdateStatus(b.id, 'In Progress')}>Accept</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && activeBooking && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <div style={S.modalHeader}>
                            <h2 style={S.modalTitle}>Request Details</h2>
                            <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div style={S.modalBody}>
                            <div style={S.modalSection}>
                                <span style={S.label}>Service</span>
                                <p style={S.valueLarge}>{activeBooking.service}</p>
                            </div>
                            <div style={S.modalGrid}>
                                <div>
                                    <span style={S.label}>Buyer Name</span>
                                    <p style={S.valueLarge}>{activeBooking.buyerName}</p>
                                </div>
                                <div>
                                    <span style={S.label}>Buyer Email</span>
                                    <p style={S.valueLarge}>{activeBooking.buyerEmail}</p>
                                </div>
                                <div>
                                    <span style={S.label}>Date</span>
                                    <p style={S.valueLarge}>{activeBooking.date}</p>
                                </div>
                                <div>
                                    <span style={S.label}>Time</span>
                                    <p style={S.valueLarge}>{activeBooking.startTime}</p>
                                </div>
                            </div>
                            <div style={S.modalSection}>
                                <span style={S.label}>Notes</span>
                                <p style={S.value}>{activeBooking.notes || 'No extra notes provided.'}</p>
                            </div>

                            <div style={S.modalActionsRow}>
                                {activeBooking.status === 'Scheduled' && (
                                    <button style={S.modalAcceptBtn} onClick={() => handleUpdateStatus(activeBooking.id, 'In Progress')}>Accept Request</button>
                                )}
                                {activeBooking.status === 'In Progress' && (
                                    <button style={S.modalCompleteBtn} onClick={() => handleUpdateStatus(activeBooking.id, 'Completed')}>Mark as Completed</button>
                                )}
                                <button style={S.modalCloseBtn} onClick={() => setShowModal(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'In Progress': return { color: '#f39c12', background: '#fef5e7' };
        case 'Scheduled': return { color: '#3498db', background: '#ebf5fb' };
        case 'Completed': return { color: '#27ae60', background: '#eafaf1' };
        default: return { color: '#777', background: '#f4f4f4' };
    }
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    toolbar: { marginBottom: '24px' },
    filterBar: { display: 'flex', gap: '8px' },
    filterBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #DDD', background: '#fff', color: '#666', fontWeight: '700', cursor: 'pointer' },
    activeFilter: { background: '#1A1A1A', color: '#fff', border: '1px solid #1A1A1A' },

    tableCard: { background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderTr: { background: '#F9F9F9' },
    th: { textAlign: 'left', padding: '16px 24px', fontSize: '0.8rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #F9F9F9' },
    td: { padding: '20px 24px', fontSize: '0.9rem', color: '#1A1A1A' },
    emptyTd: { padding: '40px', textAlign: 'center', color: '#AAA', fontStyle: 'italic' },

    idSpan: { color: '#3498db', fontWeight: '800', fontSize: '0.8rem' },
    buyerInfo: { display: 'flex', flexDirection: 'column' },
    buyerName: { fontWeight: '700' },
    buyerEmail: { fontSize: '0.8rem', color: '#777' },

    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' },
    actionRow: { display: 'flex', gap: '8px' },
    viewBtn: { padding: '6px 14px', background: '#F5F5F5', color: '#1A1A1A', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' },
    actionBtn: { padding: '6px 14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' },
    completeBtn: { padding: '6px 14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '800' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },
    modalBody: { display: 'flex', flexDirection: 'column', gap: '20px' },
    modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    modalSection: { display: 'flex', flexDirection: 'column', gap: '4px' },
    valueLarge: { fontSize: '1rem', fontWeight: '700', color: '#1A1A1A', margin: '4px 0' },
    modalActionsRow: { display: 'flex', gap: '12px', marginTop: '12px' },
    modalAcceptBtn: { flex: 2, padding: '14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    modalCompleteBtn: { flex: 2, padding: '14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    modalCloseBtn: { flex: 1, padding: '14px', background: '#F5F5F5', color: '#1A1A1A', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }
};

export default ConstructorServiceBookingsPage;
