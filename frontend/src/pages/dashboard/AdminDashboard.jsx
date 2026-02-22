import React from 'react';

const AdminDashboard = () => {
    return (
        <div>
            <h1 style={styles.title}>Admin Dashboard</h1>
            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    <h3>Total Users</h3>
                    <p>150 total registered users across platform.</p>
                </div>
                <div style={styles.card}>
                    <h3>System Analytics</h3>
                    <p>Revenue and engagement metrics looks steady.</p>
                </div>
            </div>
        </div>
    );
};

const styles = {
    title: { color: '#333', marginBottom: '20px' },
    cardContainer: { display: 'flex', gap: '20px' },
    card: { flex: 1, padding: '20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }
};

export default AdminDashboard;
