import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../apiConfig';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Get the redirect path from state, or default based on role
    const from = location.state?.from;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Invalid email or password');
                return;
            }

            // Store token and user info
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Login via AuthContext using full user payload
            login(data.user);

            // Show one-time dashboard welcome after successful login
            sessionStorage.setItem('showWelcomeAfterLogin', '1');

            // Redirect to 'from' path if it exists, otherwise use default role-based path
            if (from) {
                navigate(from);
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Login to access your dashboard</p>

            {from && (
                <div style={styles.infoBox}>
                    If you want to access these features, you must login first.
                </div>
            )}

            {error && <p style={styles.error}>{error}</p>}

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

                <div style={styles.forgotPassWrapper}>
                    <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={styles.footerText}>
                Don't have an account? <Link to="/register" style={styles.footerLink}>Register here</Link>
            </p>
        </div>
    );
};

const styles = {
    title: { textAlign: 'center', marginBottom: '8px', fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', letterSpacing: '-0.02em' },
    subtitle: { textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '1rem', lineHeight: '1.5' },
    infoBox: { backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid rgba(46, 125, 50, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '600' },
    error: { color: '#d32f2f', backgroundColor: '#fdecea', border: '1px solid rgba(211, 47, 47, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.875rem', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '24px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '10px' },
    input: { padding: '14px 18px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: '#fcfcfc' },
    forgotPassWrapper: { textAlign: 'right', marginBottom: '24px' },
    forgotLink: { fontSize: '0.85rem', color: '#666', textDecoration: 'none', fontWeight: '600', transition: 'color 0.2s' },
    button: { padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    footerText: { textAlign: 'center', marginTop: '32px', fontSize: '0.95rem', color: '#666' },
    footerLink: { color: '#1A1A1A', fontWeight: '700', textDecoration: 'none', borderBottom: '2px solid #1A1A1A', paddingBottom: '2px' }
};

export default Login;
