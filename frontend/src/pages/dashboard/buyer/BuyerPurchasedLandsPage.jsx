import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const BuyerPurchasedLandsPage = () => {
    const navigate = useNavigate();
    const [purchasedLands, setPurchasedLands] = useState([]);
    const [loading, setLoading] = useState(true);

    const tok = localStorage.getItem('access_token');
    const authHeaders = { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json' };

    const fetchData = async () => {
        if (!tok) { setLoading(false); return; }
        try {
            const bidsRes = await fetch(`${API}/bids/my-bids`, { headers: authHeaders });
            const bids = await bidsRes.json();
            // Filter only "Won" status (which means buyer accepted the offer)
            const wonLands = Array.isArray(bids) ? bids.filter(b => b.status === "Won") : [];
            setPurchasedLands(wonLands);
        } catch (e) {
            console.error('Fetch error', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div style={S.root}>
            <header style={S.header}>
                <div>
                    <h1 style={S.title}>My Portfolio</h1>
                    <p style={S.subtitle}>Manage lands you have successfully purchased and book services.</p>
                </div>
                <div style={S.countBadge}>{purchasedLands.length} Properties</div>
            </header>

            {loading ? (
                <div style={S.empty}>Loading your portfolio...</div>
            ) : purchasedLands.length === 0 ? (
                <div style={S.empty}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏘️</div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#1A1A1A' }}>Your property portfolio is empty</h3>
                    <p style={{ color: '#666', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
                        Your purchased lands will appear here once you accept a winning offer from a seller.
                    </p>
                    <button style={S.browseBtn} onClick={() => navigate('/lands')}>Explore Available Lands</button>
                </div>
            ) : (
                <div style={S.grid}>
                    {purchasedLands.map(land => {
                        const bidId = land.id || land._id;
                        return (
                            <div key={bidId} style={S.card}>
                                <div style={S.cardHeader}>
                                    <div>
                                        <h3 style={S.landName}>{land.land_name || "Purchased Land"}</h3>
                                        <p style={S.locationLabel}>Verified Ownership</p>
                                    </div>
                                    <div style={S.stamp}>OWNED</div>
                                </div>
                                
                                <div style={S.details}>
                                    <div style={S.detailRow}>
                                        <span style={S.label}>Purchase Price</span>
                                        <span style={S.value}>Rs. {Number(land.amount).toLocaleString()}</span>
                                    </div>
                                    <div style={S.detailRow}>
                                        <span style={S.label}>Acquisition Date</span>
                                        <span style={S.value}>{land.created_at ? new Date(land.created_at).toLocaleDateString() : 'N/A'}</span>
                                    </div>
                                </div>

                                <div style={S.actions}>
                                    <button 
                                        style={S.bookBtn}
                                        onClick={() => navigate(`/lands/${land.land_id}`, { state: { activeTab: 'services' } })}
                                    >
                                        🏗️ Book Construction Services
                                    </button>
                                    <button 
                                        style={S.viewBtn}
                                        onClick={() => navigate(`/lands/${land.land_id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '36px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '6px', letterSpacing: '-0.02em' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem' },
    countBadge: { background: 'var(--color-primary)', color: '#fff', borderRadius: '30px', padding: '8px 20px', fontWeight: '700', fontSize: '0.85rem' },
    
    empty: { textAlign: 'center', padding: '100px 20px', background: '#fff', borderRadius: '30px', border: '1px dashed var(--color-border)', boxShadow: 'var(--shadow-soft)' },
    browseBtn: { marginTop: '24px', padding: '12px 28px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' },
    card: { background: '#fff', borderRadius: '28px', padding: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', overflow: 'hidden', position: 'relative' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    landName: { fontSize: '1.3rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    locationLabel: { fontSize: '0.8rem', color: '#10B981', fontWeight: '700', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    
    stamp: { background: '#ECFDF5', color: '#059669', padding: '6px 14px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '900', border: '1px solid #A7F3D0' },
    
    details: { background: '#F9FAFB', borderRadius: '20px', padding: '20px', marginBottom: '28px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    label: { fontSize: '0.85rem', color: '#6B7280', fontWeight: '500' },
    value: { fontSize: '0.95rem', color: '#1A1A1A', fontWeight: '700' },
    
    actions: { display: 'flex', flexDirection: 'column', gap: '12px' },
    bookBtn: { width: '100%', padding: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', cursor: 'pointer', transition: 'transform 0.2s', fontSize: '0.95rem', boxShadow: '0 4px 12px rgba(22,163,74,0.2)' },
    viewBtn: { width: '100%', padding: '12px', background: '#fff', color: '#4B5563', border: '1px solid #E5E7EB', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }
};

export default BuyerPurchasedLandsPage;
