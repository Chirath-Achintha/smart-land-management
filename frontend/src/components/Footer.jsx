import React from 'react';

const Footer = () => {
    return (
        <footer style={styles.footer}>
            <p>&copy; {new Date().getFullYear()} Smart Land Management System. All rights reserved.</p>
        </footer>
    );
};

const styles = {
    footer: { textAlign: 'center', padding: '15px', backgroundColor: '#222', color: '#fff', fontSize: '14px', marginTop: 'auto' }
};

export default Footer;
