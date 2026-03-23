import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../apiConfig';
import { getDefaultDashboardPath } from '../../routePaths';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [loading, setLoading] = useState(false);

    // Get the redirect path from state, or default based on role
    const from = location.state?.from;

    const [showPassword, setShowPassword] = useState(false);

    const validate = (name, value) => {
        if (name === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(value) ? '' : 'Invalid email format';
        }
        if (name === 'password') {
            return value.length > 0 ? '' : 'Password is required';
        }
        return '';
    };

    const handleEmailChange = (val) => {
        setEmail(val);
        setErrors(prev => ({ ...prev, email: validate('email', val) }));
    };

    const handlePasswordChange = (val) => {
        setPassword(val);
        setErrors(prev => ({ ...prev, password: validate('password', val) }));
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const emailErr = validate('email', email);
        const passErr = validate('password', password);

        if (emailErr || passErr) {
            setErrors({ email: emailErr, password: passErr });
            setTouched({ email: true, password: true });
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setErrors({ submit: data.detail || 'Invalid email or password' });
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
                navigate(getDefaultDashboardPath(data.user?.role));
            }
        } catch (err) {
            setErrors({ submit: 'Server error. Make sure the backend is running.' });
        } finally {
            setLoading(false);
        }
    };

    const getInputStyle = (name) => ({
        ...styles.input,
        borderColor: touched[name] && errors[name] ? '#d32f2f' : touched[name] && !errors[name] ? '#2e7d32' : 'rgba(0,0,0,0.1)',
        backgroundColor: touched[name] && errors[name] ? '#fff8f7' : '#fff',
        paddingRight: name === 'password' ? '45px' : '15px'
    });

    const EyeIcon = ({ show, onToggle }) => (
        <div style={styles.eyeBtn} onClick={onToggle} title={show ? "Hide" : "Show"}>
            {show ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={styles.title}>Welcome Back</h2>
            <p style={styles.subtitle}>Login to access your dashboard</p>

            {from && (
                <div style={styles.infoBox}>
                    If you want to access these features, you must login first.
                </div>
            )}

            {errors.submit && <p style={styles.error}>{errors.submit}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        style={getInputStyle('email')}
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        onBlur={() => handleBlur('email')}
                        required
                    />
                    {touched.email && errors.email && <span style={styles.fieldErrorBelow}>{errors.email}</span>}
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            style={getInputStyle('password')}
                            value={password}
                            onChange={(e) => handlePasswordChange(e.target.value)}
                            onBlur={() => handleBlur('password')}
                            required
                        />
                        <EyeIcon show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    </div>
                    {touched.password && errors.password && <span style={styles.fieldErrorBelow}>{errors.password}</span>}
                </div>

                <div style={styles.forgotPassWrapper}>
                    <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
                </div>

                <button 
                    type="submit" 
                    style={{
                        ...styles.button,
                        opacity: (errors.email || errors.password) ? 0.7 : 1,
                        cursor: (errors.email || errors.password) ? 'not-allowed' : 'pointer'
                    }} 
                    disabled={loading}
                >
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
    subtitle: { textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '0.95rem' },
    infoBox: { backgroundColor: '#E8F5E9', color: '#2E7D32', border: '1px solid #A5D6A7', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.9rem', textAlign: 'center', fontWeight: '600' },
    error: { color: '#d32f2f', backgroundColor: '#fff8f7', border: '1px solid #f2c2bc', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.875rem', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    label: { fontSize: '0.85rem', fontWeight: '700', color: '#1A1A1A' },
    fieldErrorBelow: { fontSize: '0.72rem', color: '#d32f2f', fontWeight: '600', marginTop: '6px' },
    input: { padding: '12px 16px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s ease', width: '100%', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', padding: '4px' },
    forgotPassWrapper: { textAlign: 'right', marginBottom: '24px' },
    forgotLink: { fontSize: '0.85rem', color: '#666', textDecoration: 'none', fontWeight: '600' },
    button: { padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: '700', transition: 'all 0.2s' },
    footerText: { textAlign: 'center', marginTop: '24px', fontSize: '0.92rem', color: '#666' },
    footerLink: { color: '#1A1A1A', fontWeight: '800', textDecoration: 'none' }
};

export default Login;
