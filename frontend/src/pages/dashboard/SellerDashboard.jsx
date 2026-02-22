import React from 'react';

const SellerDashboard = () => {
    return (
        <div>
            <h1 style={styles.title}>Seller Dashboard</h1>
            <div style={styles.cardContainer}>
                <div style={styles.card}>
                    <h3>My Listings</h3>
                    <p>You have 2 active listings.</p>
                </div>
                <div style={styles.card}>
                    <h3>Messages</h3>
                    <p>3 new messages from buyers.</p>
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

export default SellerDashboard;
