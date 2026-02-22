import React from 'react';

const AgentDashboard = () => {
    return (
        <div>
            <h1 style={styles.title}>Agent Dashboard</h1>
            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    <h3>Active Clients</h3>
                    <p>8 active clients assigned to you.</p>
                </div>
                <div style={styles.card}>
                    <h3>Appointments</h3>
                    <p>2 scheduled appointments today.</p>
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

export default AgentDashboard;
