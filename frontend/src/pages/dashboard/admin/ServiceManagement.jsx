import React, { useState } from 'react';

const ServiceManagement = () => {
    const [bookings, setBookings] = useState([
        { id: 'BK001', customer: 'Alice Wong', service: 'Land Survey', date: '2026-03-10', team: 'Team Alpha', status: 'Scheduled' },
        { id: 'BK002', customer: 'Bob Miller', service: 'Soil Testing', date: '2026-03-12', team: 'Team Beta', status: 'In Progress' },
        { id: 'BK003', customer: 'Charlie Davis', service: 'Legal Consultation', date: '2026-03-15', team: 'Legal Team 1', status: 'Pending' },
    ]);

    const teams = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Legal Team 1', 'Legal Team 2'];
    const serviceTypes = ['Land Survey', 'Soil Testing', 'Legal Consultation', 'Valuation'];

    const handleUpdate = (id, field, value) => {
        setBookings(bookings.map(book =>
            book.id === id ? { ...book, [field]: value } : book
        ));
    };

    const handleCancel = (id) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            setBookings(bookings.map(book =>
                book.id === id ? { ...book, status: 'Cancelled' } : book
            ));
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Service Management</h2>
                <p style={styles.subtitle}>Oversee team schedules, modify bookings, and manage service logistics.</p>
            </header>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Team Availability</h3>
                    <div style={styles.teamList}>
                        {teams.map(team => (
                            <div key={team} style={styles.teamItem}>
                                <span style={styles.teamName}>{team}</span>
                                <span style={styles.teamStatus}>Available</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Recent Bookings</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Booking</th>
                                    <th style={styles.th}>Service & Team</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((book) => (
                                    <tr key={book.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '700' }}>{book.id}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{book.customer}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <select
                                                style={styles.inlineSelect}
                                                value={book.service}
                                                onChange={(e) => handleUpdate(book.id, 'service', e.target.value)}
                                            >
                                                {serviceTypes.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <select
                                                style={styles.inlineSelect}
                                                value={book.team}
                                                onChange={(e) => handleUpdate(book.id, 'team', e.target.value)}
                                            >
                                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                        </td>
                                        <td style={styles.td}>
                                            <input
                                                type="date"
                                                style={styles.dateInput}
                                                value={book.date}
                                                onChange={(e) => handleUpdate(book.id, 'date', e.target.value)}
                                            />
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.status,
                                                backgroundColor: book.status === 'Cancelled' ? '#fde8e8' : '#e1effe',
                                                color: book.status === 'Cancelled' ? '#9b1c1c' : '#1e429f'
                                            }}>
                                                {book.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {book.status !== 'Cancelled' && (
                                                <button style={styles.cancelBtn} onClick={() => handleCancel(book.id)}>Cancel</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { marginBottom: '32px' },
    title: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '0.95rem' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ede8e1', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: '#1A1A1A' },
    teamList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    teamItem: { display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' },
    teamName: { fontSize: '0.9rem', fontWeight: '600' },
    teamStatus: { fontSize: '0.75rem', color: '#059669', fontWeight: '700' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '2px solid #f0f0f0' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '0.8rem', color: '#777', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '16px', fontSize: '0.9rem' },
    inlineSelect: { display: 'block', width: '100%', padding: '6px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '4px', fontSize: '0.8rem' },
    dateInput: { border: '1px solid #eee', borderRadius: '4px', padding: '6px', fontSize: '0.8rem' },
    status: { padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' },
    cancelBtn: { padding: '6px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }
};

export default ServiceManagement;
