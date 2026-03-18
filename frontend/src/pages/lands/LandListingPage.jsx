import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandListingPage.css';
import API_BASE_URL from '../../apiConfig';
import { PinIcon } from '../landing/LandingIcons';

const API = API_BASE_URL;

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

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>Loading listings…</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px', color: '#999' }}>
                    {lands.length === 0 ? 'No land listings available yet.' : 'No listings match your search.'}
                </div>
            ) : (
                <div className="lands-grid">
                    {filtered.map(land => (
                        <div key={land._id || land.id} className="land-card">
                            {/* Image */}
                            <div className="land-img-wrap" style={{ position: 'relative' }}>
                                <img
                                    src={land.image_url
                                        ? land.image_url.split(',')[0]
                                        : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'}
                                    alt={land.name}
                                    className="land-img"
                                />
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default LandListingPage;
