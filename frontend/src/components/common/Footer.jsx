import React from 'react';
import { BrandLogo } from '../../pages/landing/LandingIcons';
import '../../pages/landing/LandingPage.css';

const GlobalFooter = () => {
    return (
        <footer className="landing-footer" id="contact">
            <div className="footer-inner">
                <div className="nav-logo" style={{ color: 'white' }}>
                    <BrandLogo />
                    <span className="nav-logo-text">Smart Land Management</span>
                </div>
                <p className="footer-text">© 2026 Smart Land Management. All rights reserved.</p>
                <div className="footer-links">
                    {["Privacy", "Terms", "Contact"].map((l) => (
                        <a key={l} href="#" className="footer-link">{l}</a>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default GlobalFooter;
