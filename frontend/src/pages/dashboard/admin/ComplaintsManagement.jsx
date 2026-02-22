import React, { useState } from 'react';

const ComplaintsManagement = () => {
    const [complaints, setComplaints] = useState([
        { id: 'CMP001', user: 'Mark Thorne', subject: 'Late Site Visit', status: 'Open', date: '2026-02-20', content: 'The agent didn\'t show up on time for the scheduled visit.' },
        { id: 'CMP002', user: 'Sarah Jenkins', subject: 'Payment Issue', status: 'In Progress', date: '2026-02-21', content: 'My bidding deposit is not reflecting in the dashboard.' },
        { id: 'CMP003', user: 'Unknown', subject: 'SPAM: Win a Prize', status: 'Open', date: '2026-02-22', content: 'Click here to win a free lot in Mars!' },
    ]);

    const handleStatusChange = (id, newStatus) => {
        setComplaints(complaints.map(c => c.id === id ? { ...c, status: newStatus } : c));
    };

    const handleRemove = (id) => {
        if (window.confirm('Are you sure you want to remove this entry?')) {
            setComplaints(complaints.filter(c => c.id !== id));
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Complaints & Inquiry Management</h2>
                <p style={styles.subtitle}>Review and resolve issues submitted by buyers, sellers, and agents.</p>
            </header>

            <div style={styles.list}>
                {complaints.map(item => (
                    <div key={item.id} style={styles.card}>
                        <div style={styles.cardHeader}>
                            <div>
                                <span style={styles.id}>{item.id}</span>
                                <h4 style={styles.subject}>{item.subject}</h4>
                                <p style={styles.user}>From: {item.user} • {item.date}</p>
                            </div>
                            <div style={styles.actions}>
                                <select
                                    style={{
                                        ...styles.statusSelect,
                                        color: item.status === 'Resolved' ? '#059669' : item.status === 'In Progress' ? '#d97706' : '#dc2626'
                                    }}
                                    value={item.status}
                                    onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                </select>
                                <button style={styles.deleteBtn} onClick={() => handleRemove(item.id)}>Remove</button>
                            </div>
                        </div>
                        <div style={styles.cardBody}>
                            <p style={styles.content}>{item.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { marginBottom: '32px' },
    title: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '0.95rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ede8e1', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    id: { fontSize: '0.7rem', fontWeight: '800', color: '#bbb', textTransform: 'uppercase' },
    subject: { fontSize: '1.1rem', fontWeight: '700', color: '#1A1A1A', margin: '4px 0' },
    user: { fontSize: '0.85rem', color: '#666' },
    actions: { display: 'flex', gap: '12px' },
    statusSelect: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #eee', fontSize: '0.85rem', fontWeight: '700', outline: 'none', cursor: 'pointer' },
    deleteBtn: { padding: '8px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
    cardBody: { padding: '16px', backgroundColor: '#F9FAFB', borderRadius: '8px' },
    content: { fontSize: '0.95rem', color: '#444', lineHeight: '1.6' }
};

export default ComplaintsManagement;
