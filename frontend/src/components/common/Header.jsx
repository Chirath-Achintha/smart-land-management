import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserIcon, DwelloLogo } from '../../pages/landing/LandingIcons';
import { NAV } from '../../pages/landing/landingData.jsx';
import '../../pages/landing/LandingPage.css';

const Header = () => {
    const [activeNav, setActiveNav] = useState("Home");
    const navigate = useNavigate();
    const location = useLocation();

    const handleAuthClick = (path) => {
        navigate(path);
    };

    const handleNavClick = (n) => {
        setActiveNav(n);
        if (n === 'Inquiry') {
            navigate('/inquiry');
        } else if (n === 'Service') {
            navigate('/services');
        } else if (location.pathname !== '/') {
            navigate('/#' + n.toLowerCase());
        }
    };

    return (
        <nav className="landing-nav">
            <div className="nav-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                <DwelloLogo />
                <span className="nav-logo-text">Dwello</span>
            </div>
            <ul className="landing-nav-links">
                {NAV.map((n) => {
                    const isHashLink = n !== 'Inquiry' && n !== 'Service';
                    const linkProps = isHashLink ? {
                        href: location.pathname === '/' ? `#${n.toLowerCase()}` : `/#${n.toLowerCase()}`
                    } : {
                        style: { cursor: 'pointer' }
                    };

                    return (
                        <li key={n}>
                            <a
                                {...linkProps}
                                className={`landing-nav-link ${activeNav === n ? 'active' : ''}`}
                                onClick={(e) => {
                                    if (!isHashLink) e.preventDefault();
                                    handleNavClick(n);
                                }}
                            >{n}</a>
                        </li>
                    );
                })}
            </ul>
            <div className="nav-actions">
                <button className="nav-icon"><SearchIcon /></button>
                <button className="nav-icon" onClick={() => handleAuthClick('/login')}><UserIcon /></button>
                <button className="btn-dark" onClick={() => handleAuthClick('/register')}>Sign up</button>
            </div>
        </nav>
    );
};

export default Header;
