import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandListingPage.css';
import API_BASE_URL from '../../apiConfig';
import { PinIcon } from '../landing/LandingIcons';

const API = API_BASE_URL;

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80';

function getImageUrls(imageUrlValue) {
    if (!imageUrlValue) return [];
    return imageUrlValue
        .split(',')
        .map(url => url.trim())
        .filter(Boolean);
}

const LandListingPage = () => {
    const navigate = useNavigate();
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('All Types');

    useEffect(() => {
        fetch(`${API}/lands/`)
            .then(r => r.json())
            .then(data => setLands(Array.isArray(data) ? data : []))
            .catch(() => setLands([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = lands.filter(land => {
        const matchesSearch =
            land.name.toLowerCase().includes(search.toLowerCase()) ||
            land.village.toLowerCase().includes(search.toLowerCase()) ||
            land.district.toLowerCase().includes(search.toLowerCase());
        const matchesType = type === 'All Types' || land.land_type === type;
        return matchesSearch && matchesType;
    });

    return (
        <div className="lands-root">
            <header className="lands-header">
                <h1 className="lands-title">Available Land Listings</h1>
                <p className="lands-subtitle">Discover the perfect plot for your next project or dream home</p>
            </header>

            <div className="filters-bar">
                <input
                    type="text"
                    placeholder="Search location or name..."
                    className="filter-input"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className="filter-input" value={type} onChange={e => setType(e.target.value)}>
                    <option>All Types</option>
                    <option>Residential</option>
                    <option>Agricultural</option>
                    <option>Commercial</option>
                    <option>Mixed</option>
                </select>
            </div>

            <div className="ai-banner">
                <div className="ai-banner-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <path d="M12 8v4"></path>
                        <path d="M12 16h.01"></path>
                    </svg>
                </div>
                <div className="ai-banner-content">
                    <div className="ai-banner-title">
                        AI-Driven Market Verification
                        <span className="ai-status-pill">Active</span>
                    </div>
                    <div className="ai-banner-text">
                        Every listing on this platform is automatically analyzed against real-time regional market data. Our proprietary engine verifies price alignment to ensure you make informed investment decisions based on verified data, not just listings.
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading listings…</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
                    {lands.length === 0 ? 'No land listings available yet.' : 'No listings match your search.'}
                </div>
            ) : (
                <div className="lands-grid">
                    {filtered.map(land => {
                        const imageUrls = getImageUrls(land.image_url);
                        const primaryImage = imageUrls[0] || FALLBACK_IMAGE;

                        return (
                        <div key={land._id || land.id} className="land-card">
                            {/* Image */}
                            <div className="land-img-wrap" style={{ position: 'relative' }}>
                                <img
                                    src={primaryImage}
                                    alt={land.name}
                                    className="land-img"
                                />
                                {imageUrls.length > 1 && (
                                    <span style={{
                                        position: 'absolute', bottom: '10px', left: '10px',
                                        background: 'rgba(26,26,26,0.85)', color: '#fff',
                                        fontSize: '0.68rem', fontWeight: '800',
                                        padding: '5px 10px', borderRadius: '20px',
                                        zIndex: 2
                                    }}>
                                        {imageUrls.length} Photos
                                    </span>
                                )}
                                {land.open_for_bidding && (
                                    <span style={{
                                        position: 'absolute', top: '10px', left: '10px',
                                        background: '#1A1A1A', color: '#fff',
                                        fontSize: '0.68rem', fontWeight: '800',
                                        padding: '4px 10px', borderRadius: '20px',
                                        zIndex: 2
                                    }}>
                                        🔨 Open for Bidding
                                    </span>
                                )}
                                
                                {/* AI Validation Badge */}
                                {land.is_anomaly ? (
                                    <span 
                                        className="market-badge"
                                        title={`Our AI detected that this land's price is significantly ${land.price_status} compared to the average in ${land.district}.`}
                                        style={{
                                            position: 'absolute', top: '10px', right: '10px',
                                            background: '#FFF1F0', color: '#C53030',
                                            fontSize: '0.6rem', fontWeight: '800',
                                            padding: '4px 10px', borderRadius: '20px',
                                            zIndex: 2, border: '1px solid #F1B0AA',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        ⚠️ {land.price_status === 'high' ? 'High Price Anomaly' : 'Low Price Anomaly'}
                                    </span>
                                ) : (
                                    <span 
                                        className="market-badge"
                                        title={`Good valuation! This price matches the typical market trends for ${land.district}.`}
                                        style={{
                                            position: 'absolute', top: '10px', right: '10px',
                                            background: '#E6FFFA', color: '#2F855A',
                                            fontSize: '0.6rem', fontWeight: '800',
                                            padding: '4px 10px', borderRadius: '20px',
                                            zIndex: 2, border: '1px solid #B2F5EA',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}
                                    >
                                        ✅ Price is Market Aligned
                                    </span>
                                )}
                            </div>

                            {/* Body */}
                            <div className="land-body">
                                <span className="land-tag">{land.land_type}</span>
                                <h3 className="land-name">{land.name}</h3>
                                <div className="land-loc">
                                    <PinIcon /> {land.village}, {land.district}
                                </div>
                                <div className="land-specs">
                                    <span className="land-spec-item">📏 {land.perches} Perches</span>
                                    <span className="land-spec-item">💰 Rs. {Number(land.price_per_perch).toLocaleString()}/perch</span>
                                </div>

                                {/* Price + View Details */}
                                <div className="land-footer">
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#777', fontWeight: '600' }}>TOTAL PRICE</span>
                                        <span className="land-price">Rs. {(land.total_price / 1000000).toFixed(2)}M</span>
                                    </div>
                                    <button
                                        className="btn-dark"
                                        style={{ padding: '8px 18px' }}
                                        onClick={() => navigate(`/lands/${land._id || land.id}`)}
                                    >
                                        View Details
                                    </button>
                                </div>

                                {/* Bidding hint */}
                                {land.open_for_bidding && land.starting_bid && (
                                    <p style={{
                                        fontSize: '0.78rem', color: '#888',
                                        marginTop: '8px', borderTop: '1px solid #f0ebe4',
                                        paddingTop: '8px',
                                    }}>
                                        Starting bid: <strong>Rs. {Number(land.starting_bid).toLocaleString()}</strong>
                                        {land.bidding_end && <> · Closes {land.bidding_end}</>}
                                    </p>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default LandListingPage;
