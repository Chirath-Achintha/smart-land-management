import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LANDS } from './landsData';
import { PinIcon } from '../landing/LandingIcons';
import './LandListingPage.css'; // Reusing some base styles

const LandDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const land = LANDS.find(l => l.id === parseInt(id));

    // Scroll to top on load
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    if (!land) {
        return (
            <div className="lands-root" style={{ textAlign: 'center', padding: '100px 20px' }}>
                <h2>Land not found</h2>
                <button className="btn-dark" onClick={() => navigate('/lands')}>Back to Listings</button>
            </div>
        );
    }

    return (
        <div className="lands-root" style={{ background: '#FAF6F1', paddingBottom: '80px' }}>
            <div style={S.container}>
                {/* Back Button */}
                <button
                    onClick={() => navigate('/lands')}
                    style={S.backBtn}
                >
                    ← Back to Listings
                </button>

                <div style={S.layout}>
                    {/* Image Section */}
                    <div style={S.imageSection}>
                        <img src={land.img} alt={land.name} style={S.heroImg} />
                        <div style={S.priceBadge}>
                            Rs. {land.totalPrice.toLocaleString()}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div style={S.contentSection}>
                        <div style={S.header}>
                            <span style={S.tag}>{land.type} Land</span>
                            <h1 style={S.title}>{land.name}</h1>
                            <div style={S.location}>
                                <PinIcon /> {land.village}, {land.district} District
                            </div>
                        </div>

                        <div style={S.grid}>
                            <div style={S.infoCard}>
                                <span style={S.label}>Price Per Perch</span>
                                <span style={S.value}>Rs. {land.pricePerPerch.toLocaleString()}</span>
                            </div>
                            <div style={S.infoCard}>
                                <span style={S.label}>Land Size</span>
                                <span style={S.value}>{land.perches} Perches</span>
                            </div>
                            <div style={S.infoCard}>
                                <span style={S.label}>Published Date</span>
                                <span style={S.value}>{land.publishedDate}</span>
                            </div>
                            <div style={S.infoCard}>
                                <span style={S.label}>Distance to Town</span>
                                <span style={S.value}>{land.distanceToTown} km</span>
                            </div>
                        </div>

                        <div style={S.amenities}>
                            <h3 style={S.subTitle}>Infrastructure & Amenities</h3>
                            <div style={S.amenityRow}>
                                <div style={S.amenityItem}>
                                    <span style={S.aLabel}>🛣️ Road Access</span>
                                    <span style={S.aValue}>{land.roadAccess}</span>
                                </div>
                                <div style={S.amenityItem}>
                                    <span style={S.aLabel}>🔌 Electricity</span>
                                    <span style={S.aValue}>{land.electricity}</span>
                                </div>
                                <div style={S.amenityItem}>
                                    <span style={S.aLabel}>💧 Water Facility</span>
                                    <span style={S.aValue}>{land.water}</span>
                                </div>
                            </div>
                        </div>

                        <div style={S.actionBox}>
                            <h3 style={S.subTitle}>Interested in this Land?</h3>
                            <p style={S.actionDesc}>Contact our dedicated agent for a site visit or more information regarding the property title and registration process.</p>
                            <div style={S.btnGroup}>
                                <button
                                    className="btn-dark"
                                    style={S.mainBtn}
                                    onClick={() => navigate(`/bidding/${land.id}`)}
                                >
                                    Place a Bid
                                </button>
                                <button style={S.secBtn}>Schedule a Visit</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    container: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 24px',
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: '#555',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        padding: 0
    },
    layout: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)',
        gap: '48px',
        background: '#fff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.04)'
    },
    imageSection: {
        position: 'relative',
        height: '100%',
        minHeight: '500px'
    },
    heroImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    },
    priceBadge: {
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        background: '#1A1A1A',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '12px',
        fontSize: '1.25rem',
        fontWeight: '800',
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
    },
    contentSection: {
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        marginBottom: '32px'
    },
    tag: {
        display: 'inline-block',
        background: '#FAF6F1',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#1A1A1A',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '12px'
    },
    title: {
        fontSize: '2.4rem',
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: '12px',
        lineHeight: 1.1
    },
    location: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#555',
        fontWeight: '500'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginBottom: '40px'
    },
    infoCard: {
        background: '#F9F9F9',
        padding: '20px',
        borderRadius: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    label: {
        fontSize: '0.75rem',
        color: '#777',
        fontWeight: '600',
        textTransform: 'uppercase'
    },
    value: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1A1A1A'
    },
    amenities: {
        marginBottom: '40px'
    },
    subTitle: {
        fontSize: '1.1rem',
        fontWeight: '800',
        marginBottom: '20px',
        color: '#1A1A1A'
    },
    amenityRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    amenityItem: {
        display: 'flex',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: '1px solid #EEE'
    },
    aLabel: {
        color: '#555',
        fontSize: '0.9rem',
        fontWeight: '500'
    },
    aValue: {
        fontWeight: '600',
        color: '#1A1A1A',
        fontSize: '0.9rem'
    },
    actionBox: {
        marginTop: 'auto',
        background: '#FAF6F1',
        padding: '32px',
        borderRadius: '20px'
    },
    actionDesc: {
        fontSize: '0.85rem',
        lineHeight: 1.6,
        color: '#555',
        marginBottom: '24px'
    },
    btnGroup: {
        display: 'flex',
        gap: '12px'
    },
    mainBtn: {
        flex: 1,
        padding: '14px'
    },
    secBtn: {
        flex: 1,
        background: 'transparent',
        border: '1.5px solid #1A1A1A',
        borderRadius: '8px',
        fontWeight: '700',
        cursor: 'pointer',
        fontSize: '0.9rem'
    }
};

export default LandDetailPage;
