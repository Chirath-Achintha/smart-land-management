import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LandingPage.css';
import { PROPERTIES, WHY_CARDS, NAV } from './landingData.jsx';
import {
    PinIcon,
    RoomIcon,
    SqftIcon,
    SearchIcon,
    UserIcon,
    DwelloLogo
} from './LandingIcons';

const LandingPage = () => {
    const [activeNav, setActiveNav] = useState("Home");
    const navigate = useNavigate();

    const handleAuthClick = (path) => {
        navigate(path);
    };

    return (
        <div className="landing-root">

            {/* ══ HERO ══ */}
            <section className="landing-hero" id="home">
                <div className="hero-left">
                    <h1 className="hero-title">
                        Find Your<br />Dream Land
                    </h1>
                    <p className="hero-sub">
                        Explore our curated selection of exquisite<br />
                        Lands meticulously tailored to your<br />
                        unique dream Land vision
                    </p>
                    <button className="btn-dark" onClick={() => navigate('/lands')}>Find Lands</button>
                </div>
                <div className="hero-right">
                    <img
                        src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=700&q=80"
                        alt="Dream Home"
                        className="hero-img"
                    />
                </div>
            </section>

            {/* ══ HELP SECTION ══ */}
            <section className="help-section" id="service">
                <div className="help-left">
                    <img
                        src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=700&q=80"
                        alt="House"
                        className="help-img-main"
                    />
                </div>
                <div className="help-right">
                    <h2 className="help-title">
                        We Help You To Find<br />Your Dream Home
                    </h2>
                    <p className="help-desc">
                        From cozy cottages to luxurious estates, our<br />
                        dedicated team guides you through every step of the<br />
                        journey, ensuring your dream home becomes a reality
                    </p>
                    <div className="stats-row">
                        {[
                            { val: "8K+", label: "Houses Available" },
                            { val: "6K+", label: "Houses Sold" },
                            { val: "2K+", label: "Trusted Agents" },
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
                <h2 className="why-title">Why Choose Us</h2>
                <p className="why-subtitle">
                    <u>Elevating Your Home Buying Experience with Expertise, Integrity,<br />
                        and Unmatched Personalized Service</u>
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

            {/* ══ PROPERTIES ══ */}
            <section className="props-section" id="inquiry">
                <h2 className="props-title">Our Popular Residences</h2>
                <div className="props-grid">
                    {PROPERTIES.map((p) => (
                        <div key={p.id} className="prop-card">
                            <div className="prop-img-wrap">
                                <img src={p.img} alt={p.location} className="prop-img" />
                            </div>
                            <div className="prop-body">
                                <div className="prop-location">
                                    <span className="prop-pin"><PinIcon /></span>
                                    {p.location}
                                </div>
                                <div className="prop-meta">
                                    <span className="prop-meta-item">
                                        <RoomIcon /> {p.rooms} Rooms
                                    </span>
                                    <span className="prop-meta-item">
                                        <SqftIcon /> {p.sqft} sq ft
                                    </span>
                                </div>
                                <div className="prop-footer">
                                    <button className="btn-dark" onClick={() => navigate('/lands')}>Find Lands</button>
                                    <span className="prop-price">{p.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

        </div>
    );
};

export default LandingPage;
