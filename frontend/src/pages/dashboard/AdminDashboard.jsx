import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const navigate = useNavigate();

    const stats = [
        { label: 'Pending Requests', count: '12', color: '#3b82f6', route: '/dashboard/admin/agents' },
        { label: 'Active Services', count: '8', color: '#10b981', route: '/dashboard/admin/services' },
        { label: 'Open Complaints', count: '5', color: '#ef4444', route: '/dashboard/admin/complaints' },
        { label: 'Total Users', count: '150', color: '#6b7280', route: '/dashboard/users' },
    ];

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Admin Overview</h1>
                <p style={styles.subtitle}>Welcome back, Admin. Here is what is happening across the platform today.</p>
            </header>

            <div style={styles.statsGrid}>
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        style={{ ...styles.statCard, borderLeft: `4px solid ${stat.color}` }}
                        onClick={() => navigate(stat.route)}
                    >
                        <h3 style={styles.statLabel}>{stat.label}</h3>
                        <p style={{ ...styles.statCount, color: stat.color }}>{stat.count}</p>
                    </div>
                ))}
            </div>

            <div style={styles.recentActivity}>
                <h2 style={styles.sectionTitle}>System Status</h2>
                <div style={styles.activityCard}>
                    <p style={styles.activityItem}>✓ All systems operational</p>
                    <p style={styles.activityItem}>✓ Database backup completed 2 hours ago</p>
                    <p style={styles.activityItem}>⚠ 3 new agent applications pending review</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '1rem' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' },
    statCard: {
        backgroundColor: '#fff',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'transform 0.2s',
        ':hover': { transform: 'translateY(-4px)' }
    },
    statLabel: { fontSize: '0.85rem', color: '#666', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' },
    statCount: { fontSize: '2.5rem', fontWeight: '800' },
    recentActivity: { maxWidth: '600px' },
    sectionTitle: { fontSize: '1.25rem', fontWeight: '700', marginBottom: '20px' },
    activityCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #ede8e1' },
    activityItem: { padding: '12px 0', borderBottom: '1px solid #f0f0f0', fontSize: '0.95rem', color: '#333' }
};

export default AdminDashboard;

