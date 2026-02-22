import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandListingPage.css';
import { PinIcon } from '../landing/LandingIcons';
import { LANDS } from './landsData';

const LandListingPage = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [type, setType] = useState('All Types');

    const filteredLands = LANDS.filter(land => {
        const matchesSearch = land.village.toLowerCase().includes(search.toLowerCase()) ||
            land.district.toLowerCase().includes(search.toLowerCase()) ||
            land.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = type === 'All Types' || land.type === type;
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
                    onChange={(e) => setSearch(e.target.value)}
                />
                <select
                    className="filter-input"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                >
                    <option>All Types</option>
                    <option>Residential</option>
                    <option>Agricultural</option>
                    <option>Commercial</option>
                    <option>Mixed</option>
                </select>
                <select className="filter-input">
                    <option>Price Range</option>
                    <option>Rs. 0-5M</option>
                    <option>Rs. 5M-15M</option>
                    <option>Rs. 15M+</option>
                </select>
            </div>

            <div className="lands-grid">
                {filteredLands.map((land) => (
                    <div key={land.id} className="land-card">
                        <div className="land-img-wrap">
                            <img src={land.img} alt={land.name} className="land-img" />
                        </div>
                        <div className="land-body">
                            <span className="land-tag">{land.type}</span>
                            <h3 className="land-name">{land.name}</h3>
                            <div className="land-loc">
                                <PinIcon /> {land.village}, {land.district}
                            </div>
                            <div className="land-specs">
                                <span className="land-spec-item">📏 {land.perches} Perches</span>
                                <span className="land-spec-item">🗓️ {land.publishedDate}</span>
                            </div>
                            <div className="land-footer">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.7rem', color: '#777', fontWeight: '600' }}>TOTAL PRICE</span>
                                    <span className="land-price">Rs. {(land.totalPrice / 1000000).toFixed(1)}M</span>
                                </div>
                                <button
                                    className="btn-dark"
                                    style={{ padding: '8px 16px' }}
                                    onClick={() => navigate(`/lands/${land.id}`)}
                                >
                                    View Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LandListingPage;
