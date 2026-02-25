import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { WHY_CARDS, NAV } from './landingData.jsx';
import API_BASE_URL from '../../apiConfig';
import {
    PinIcon,
    SearchIcon,
    UserIcon,
    BrandLogo
} from './LandingIcons';

const API = API_BASE_URL;

const LandingPage = () => {
    const navigate = useNavigate();
    const [lands, setLands] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/lands/`)
            .then(r => r.json())
            .then(data => {
                // Take up to 3 lands for the featured section
                setLands(Array.isArray(data) ? data.slice(0, 3) : []);
                setLoading(false);
            })
            .catch(() => {
                setLands([]);
                setLoading(false);
            });
    }, []);

    return (
        <div className="landing-root">

            {/* ══ HERO ══ */}
            <section className="landing-hero" id="home">
                <div className="hero-left">
                    <h1 className="hero-title">
                        Find Your Perfect<br />Piece of Land
                    </h1>
                    <p className="hero-sub">
                        Discover premium land listings across Sri Lanka.<br />
                        Whether for residential, agricultural, or commercial use,<br />
                        we help you secure your future, one perch at a time.
                    </p>
                    <button className="btn-dark" onClick={() => navigate('/lands')}>Find Lands</button>
                </div>
                <div className="hero-right">
                    <img
                        src="/images/constructor service.png"
                        alt="Beautiful Land"
                        className="hero-img"
                    />
                </div>
            </section>

            {/* ══ FEATURED LANDS ══ */}
            <section className="props-section" id="inquiry">
                <h2 className="props-title">Featured Land Listings</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading featured lands...</div>
                ) : lands.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>No featured lands available right now.</div>
                ) : (
                    <div className="props-grid">
                        {lands.map((p) => (
                            <div key={p.id} className="prop-card">
                                <div className="prop-img-wrap">
                                    <img
                                        src={p.image_url ? p.image_url.split(',')[0] : "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80"}
                                        alt={p.name}
                                        className="prop-img"
                                    />
                                </div>
                                <div className="prop-body">
                                    <div className="prop-location">
                                        <span className="prop-pin"><PinIcon /></span>
                                        {p.village}, {p.district}
                                    </div>
                                    <div className="prop-meta">
                                        <span className="prop-meta-item">
                                            📏 {p.perches} Perches
                                        </span>
                                        <span className="prop-meta-item">
                                            🌿 {p.land_type}
                                        </span>
                                    </div>
                                    <div className="prop-footer">
                                        <button className="btn-dark" onClick={() => navigate(`/lands/${p.id}`)}>View Land</button>
                                        <span className="prop-price">Rs. {(p.total_price / 1000000).toFixed(2)}M</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                    <button className="btn-outline" onClick={() => navigate('/lands')}>Explore All Listings →</button>
                </div>
            </section>

            {/* ══ SERVICES SECTION ══ */}
            <section className="help-section" id="service">
                <div className="help-left">
                    <img
                        src="/images/Beautiful Land.png"
                        alt="Construction Site"
                        className="help-img-main"
                    />
                </div>
                <div className="help-right">
                    <h2 className="help-title">
                        Expert Support for Your<br />Land Development
                    </h2>
                    <p className="help-desc">
                        From legal verification to site development and full construction,<br />
                        our dedicated team provides end-to-end services to transform<br />
                        your plot into a dream project.
                    </p>
                    <div className="stats-row">
                        {[
                            { val: "500+", label: "Lands Available" },
                            { val: "120+", label: "Projects Completed" },
                            { val: "50+", label: "Expert Partners" },
                        ].map((s) => (
                            <div key={s.label} className="stat">
                                <span className="stat-val">{s.val}</span>
                                <span className="stat-label">{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ WHY CHOOSE US ══ */}
            <section className="why-section">
                <h2 className="why-title">Why Choose Smart Land Management</h2>
                <p className="why-subtitle">
                    Elevating your land buying experience with technology, integrity,<br />
                    and matched construction expertise.
                </p>
                <div className="why-grid">
                    {WHY_CARDS.map((c) => (
                        <div key={c.title} className="why-card">
                            <div className="why-icon">{c.icon}</div>
                            <h3 className="why-card-title">{c.title}</h3>
                            <p className="why-card-desc">{c.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ CONTACT SECTION ══ */}
            <section className="contact-section" id="contact" style={{ padding: '80px 48px', textAlign: 'center' }}>
                <h2 className="why-title">Get In Touch</h2>
                <p className="why-desc" style={{ maxWidth: '600px', margin: '0 auto 30px', color: '#666' }}>
                    Have questions about a listing or our construction services? Our team is here to help you every step of the way.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: '700', color: '#556B2F' }}>Email Us</div>
                        <div style={{ color: '#555' }}>SmartLand99@gmail.com</div>
                    </div>
                    <div>
                        <div style={{ fontWeight: '700', color: '#556B2F' }}>Call Us</div>
                        <div style={{ color: '#555' }}>011 100 1001</div>
                    </div>
                </div>
            </section>


        </div>
    );
};

export default LandingPage;
