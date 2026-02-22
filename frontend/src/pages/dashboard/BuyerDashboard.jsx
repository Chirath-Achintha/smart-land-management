import React from 'react';

const BuyerDashboard = () => {
    return (
        <div>
            <h1 style={styles.title}>Buyer Dashboard</h1>
            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    <h3>Saved Properties</h3>
                    <p>You have 5 saved properties.</p>
                </div>
                <div style={styles.card}>
                    <h3>Recent Inquiries</h3>
                    <p>No recent inquiries yet.</p>
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

export default BuyerDashboard;
