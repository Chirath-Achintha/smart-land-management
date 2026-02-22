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
        if (location.pathname !== '/') {
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
                {NAV.map((n) => (
                    <li key={n}>
                        <a
                            href={location.pathname === '/' ? `#${n.toLowerCase()}` : `/#${n.toLowerCase()}`}
                            className={`landing-nav-link ${activeNav === n ? 'active' : ''}`}
                            onClick={() => handleNavClick(n)}
                        >{n}</a>
                    </li>
                ))}
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
