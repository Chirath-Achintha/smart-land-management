import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SearchIcon, UserIcon, BrandLogo, LockIcon, BellIcon } from '../../pages/landing/LandingIcons';
import { NAV } from '../../pages/landing/landingData.jsx';
import { useAuth } from '../../context/AuthContext';
import '../../pages/landing/LandingPage.css';

const Header = () => {
    const { user, logout } = useAuth();
    const [activeNav, setActiveNav] = useState("Home");
    const navigate = useNavigate();
    const location = useLocation();

    const handleAuthClick = (path) => {
        navigate(path);
    };

    // Sync active nav with hash
    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash) {
            const label = hash.charAt(0).toUpperCase() + hash.slice(1);
            if (NAV.includes(label)) {
                setActiveNav(label);
            }
        } else if (location.pathname === '/') {
            setActiveNav('Home');
        }
    }, [location.hash, location.pathname]);

    const handleLogoClick = () => {
        setActiveNav('Home');
        navigate('/');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="landing-nav">
            <div className="nav-logo" style={{ cursor: 'pointer' }} onClick={handleLogoClick}>
                <BrandLogo color="#556B2F" />
                <span className="nav-logo-text">Smart Land Management System</span>
            </div>
            <ul className="landing-nav-links">
                {NAV.map((n) => {
                    const isProtected = n === 'Service' || n === 'Inquiry';
                    const linkProps = isProtected ? {
                        style: { cursor: 'pointer' }
                    } : {
                        href: location.pathname === '/' ? `#${n.toLowerCase()}` : `/#${n.toLowerCase()}`,
                        style: { cursor: 'pointer' }
                    };

                    const handleClick = (e) => {
                        if (isProtected) {
                            e.preventDefault();
                            if (!user) {
                                navigate('/login', { state: { from: n === 'Service' ? '/services' : '/inquiry' } });
                            } else {
                                navigate(n === 'Service' ? '/services' : '/inquiry');
                            }
                        } else if (location.pathname !== '/') {
                            // For non-protected links, if not on landing page, navigate to landing and then section
                            navigate('/#' + n.toLowerCase());
                        }
                        setActiveNav(n);
                    };

                    return (
                        <li key={n}>
                            <a
                                {...linkProps}
                                className={`landing-nav-link ${activeNav === n ? 'active' : ''}`}
                                onClick={handleClick}
                            >
                                {isProtected && !user && <LockIcon />}
                                {n}
                            </a>
                        </li>
                    );
                })}
            </ul>
            <div className="nav-actions">
                <button className="nav-icon" style={{ color: '#556B2F' }}><SearchIcon /></button>
                <button className="nav-icon" style={{ color: '#556B2F', position: 'relative' }} title="Notifications">
                    <BellIcon />
                    <span style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px', 
                        width: '8px', 
                        height: '8px', 
                        background: '#e74c3c', 
                        borderRadius: '50%', 
                        border: '2px solid #fff' 
                    }}></span>
                </button>

                {user ? (
                    <>
                        <button className="nav-icon" onClick={() => navigate('/dashboard')} title="Dashboard" style={{ color: '#556B2F' }}>
                            <UserIcon />
                        </button>
                        <button className="btn-outline" onClick={handleLogout}>Logout</button>
                    </>
                ) : (
                    <>
                        <button className="nav-icon" onClick={() => handleAuthClick('/login')} style={{ color: '#556B2F' }}><UserIcon /></button>
                        <button className="btn-dark" onClick={() => handleAuthClick('/login')}>Sign in</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Header;
