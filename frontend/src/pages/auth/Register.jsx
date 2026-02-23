import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
    return (
        <div>
            <h2 style={styles.title}>Create an Account</h2>
            <p style={styles.subtitle}>Sign up to join our community</p>
            <form style={styles.form}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input type="text" placeholder="Enter your full name" style={styles.input} />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>NIC Number</label>
                    <input type="text" placeholder="Enter your NIC" style={styles.input} />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Register As</label>
                    <select style={styles.input}>
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="constructor_manager">Constructor Manager</option>
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Address</label>
                    <input type="text" placeholder="Enter your address" style={styles.input} />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input type="email" placeholder="Enter your email" style={styles.input} />
                </div>

                <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1, marginRight: '10px' }}>
                        <label style={styles.label}>Password</label>
                        <input type="password" placeholder="Password" style={styles.input} />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Confirm Password</label>
                        <input type="password" placeholder="Confirm" style={styles.input} />
                    </div>
                </div>

                <Link to="/login" style={styles.linkWrapper}>
                    <button type="button" style={styles.button}>Register</button>
                </Link>
            </form>
            <p style={styles.footerText}>
                Already have an account? <Link to="/login" style={styles.footerLink}>Login here</Link>
            </p>
        </div>
    );
};

const styles = {
    title: {
        textAlign: 'center',
        marginBottom: '10px',
        fontSize: '1.8rem',
        fontWeight: '800',
        color: '#1A1A1A'
    },
    subtitle: {
        textAlign: 'center',
        color: '#555',
        marginBottom: '32px',
        fontSize: '0.9rem'
    },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '18px', display: 'flex', flexDirection: 'column' },
    formRow: { display: 'flex', justifyContent: 'space-between' },
    label: {
        fontSize: '0.85rem',
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: '6px'
    },
    input: {
        padding: '10px 14px',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        outline: 'none',
        backgroundColor: '#fff'
    },
    linkWrapper: { textDecoration: 'none', display: 'block' },
    button: {
        padding: '12px',
        backgroundColor: '#1A1A1A',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        width: '100%',
        fontSize: '0.95rem',
        fontWeight: '600',
        marginTop: '10px'
    },
    footerText: {
        textAlign: 'center',
        marginTop: '24px',
        fontSize: '0.9rem',
        color: '#555'
    },
    footerLink: {
        color: '#1A1A1A',
        fontWeight: '700',
        textDecoration: 'none'
    }
};

export default Register;
