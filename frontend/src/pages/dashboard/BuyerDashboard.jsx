import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const BuyerDashboard = () => {
    const navigate = useNavigate();
    const [profileName, setProfileName] = useState('Buyer');
    const [loading, setLoading] = useState(true);
    const [serviceBookings, setServiceBookings] = useState([]);

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

        fetch(`${API}/service-bookings/my`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((r) => r.json())
            .then((data) => setServiceBookings(Array.isArray(data) ? data : []))
            .catch(() => setServiceBookings([]));
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
                
                <div style={S.card}>
                    <h2 style={S.cardTitle}>Construction Services</h2>
                    <p style={S.cardText}>View request status and assigned constructor team details.</p>
                    <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/services')}>
                        Open Service Requests
                    </button>
                </div>


            </div>

            <section style={S.section}>
                <div style={S.sectionHead}>
                    <h2 style={S.sectionTitle}>Recent Service Booking Updates</h2>
                </div>

                {serviceBookings.length === 0 ? (
                    <div style={S.emptyBox}>No service requests yet.</div>
                ) : (
                    <div style={S.list}>
                        {serviceBookings.slice(0, 3).map((booking) => (
                            <div key={booking.id} style={S.listCard}>
                                <div style={S.listTop}>
                                    <strong>{booking.service_type}</strong>
                                    <span style={S.statusPill}>{booking.status}</span>
                                </div>
                                <div style={S.listText}>Date: {booking.preferred_date} at {booking.preferred_time}</div>
                                <div style={S.listText}>Land: {booking.land_name || 'N/A'}</div>
                                <div style={S.listText}>Assigned Team: {booking.constructor_name || 'Awaiting assignment'}</div>
                                {(booking.constructor_phone || booking.constructor_email) && (
                                    <div style={S.contactText}>
                                        {booking.constructor_phone ? `Phone: ${booking.constructor_phone}` : ''}
                                        {booking.constructor_phone && booking.constructor_email ? ' | ' : ''}
                                        {booking.constructor_email ? `Email: ${booking.constructor_email}` : ''}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const S = {
    container: { padding: '32px', background: 'var(--color-bg)', minHeight: '100%' },
    header: { marginBottom: '28px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' },
    card: { background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', transition: 'transform 0.3s ease, box-shadow 0.3s ease' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '800', margin: '0 0 8px' },
    cardText: { fontSize: '0.92rem', color: 'var(--color-text-soft)', marginBottom: '16px', lineHeight: 1.45 },
    actionBtn: { borderRadius: '10px', padding: '10px 16px', fontWeight: '700' },
    section: { marginTop: '28px' },
    sectionHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' },
    sectionTitle: { fontSize: '1.2rem', margin: 0, color: 'var(--color-dark)' },
    smallBtn: { borderRadius: '10px', padding: '8px 14px', fontWeight: '700', fontSize: '0.85rem' },
    emptyBox: { background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '16px', color: 'var(--color-text-soft)' },
    list: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '14px' },
    listCard: { background: '#fff', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '14px', boxShadow: '0 8px 18px rgba(38, 50, 56, 0.06)' },
    listTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    listText: { color: '#4b5563', fontSize: '0.9rem', marginBottom: '4px' },
    contactText: { color: 'var(--color-blue)', fontSize: '0.82rem', marginTop: '6px' },
    statusPill: { background: 'rgba(76, 175, 80, 0.14)', color: 'var(--color-primary)', padding: '4px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '700' }
};

export default BuyerDashboard;
