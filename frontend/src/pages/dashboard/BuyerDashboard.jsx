import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const BuyerDashboard = () => {
    const navigate = useNavigate();
    const [profileName, setProfileName] = useState('Buyer');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setLoading(false);
            return;
        }

        fetch(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((r) => r.json())
            .then((data) => {
                if (data?.full_name) {
                    setProfileName(data.full_name);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={S.container}>
            <header style={S.header}>
                <h1 style={S.title}>Buyer Dashboard</h1>
                <p style={S.subtitle}>
                    {loading ? 'Loading...' : <>Welcome, <strong>{profileName}</strong>. Manage your bids and site visits here.</>}
                </p>
            </header>

            <div style={S.grid}>
                <div style={S.card}>
                    <h2 style={S.cardTitle}>My Biddings</h2>
                    <p style={S.cardText}>Track current bids, see updates, and follow auction results.</p>
                    <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/bids')}>
                        Open Biddings
                    </button>
                </div>

                <div style={S.card}>
                    <h2 style={S.cardTitle}>My Site Visits</h2>
                    <p style={S.cardText}>Review your scheduled site visits and visit history.</p>
                    <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/visits')}>
                        Open Visits
                    </button>
                </div>

                <div style={S.card}>
                    <h2 style={S.cardTitle}>Saved Properties</h2>
                    <p style={S.cardText}>Keep your shortlisted properties in one place.</p>
                    <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/properties')}>
                        Open Saved
                    </button>
                </div>
            </div>
        </div>
    );
};

const S = {
    container: { padding: '32px' },
    header: { marginBottom: '28px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' },
    card: { background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '800', margin: '0 0 8px' },
    cardText: { fontSize: '0.92rem', color: '#666', marginBottom: '16px', lineHeight: 1.45 },
    actionBtn: { borderRadius: '10px', padding: '10px 16px', fontWeight: '700' }
};

export default BuyerDashboard;
