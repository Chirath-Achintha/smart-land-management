import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://127.0.0.1:8000/auth/login', {
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

            // Login via AuthContext using role from backend
            login(data.user.role);

            if (data.user.role === 'buyer') {
                navigate('/');
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
    title: { textAlign: 'center', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A' },
    subtitle: { textAlign: 'center', color: '#555', marginBottom: '32px', fontSize: '0.9rem' },
    error: { color: '#d32f2f', backgroundColor: '#fdecea', border: '1px solid #d32f2f', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
    input: { padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
    forgotPassWrapper: { textAlign: 'right', marginBottom: '24px' },
    forgotLink: { fontSize: '0.85rem', color: '#555', textDecoration: 'none', fontWeight: '500' },
    button: { padding: '12px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: '600', transition: 'background 0.2s' },
    footerText: { textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#555' },
    footerLink: { color: '#1A1A1A', fontWeight: '700', textDecoration: 'none' }
};

export default Login;
