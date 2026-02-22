import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('buyer');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulation: Just login with the selected role
        login(role);
        navigate('/dashboard');
    };

    return (
        <div>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Login to access your dashboard</p>
            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        style={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Password</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        style={styles.input}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>I am a</label>
                    <select
                        style={styles.input}
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                    >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="agent">Agent</option>
                        <option value="admin">System Admin</option>
                    </select>
                </div>

                <div style={styles.forgotPassWrapper}>
                    <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
                </div>

                <button type="submit" style={styles.button}>Login</button>
            </form>
            <p style={styles.footerText}>
                Don't have an account? <Link to="/register" style={styles.footerLink}>Register here</Link>
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
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    label: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#1A1A1A',
        marginBottom: '8px'
    },
    input: {
        padding: '12px 16px',
        border: '1px solid rgba(0,0,0,0.1)',
        borderRadius: '8px',
        fontSize: '0.9rem',
        fontFamily: 'inherit',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    forgotPassWrapper: {
        textAlign: 'right',
        marginBottom: '24px'
    },
    forgotLink: {
        fontSize: '0.85rem',
        color: '#555',
        textDecoration: 'none',
        fontWeight: '500'
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
        transition: 'background 0.2s'
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

export default Login;
