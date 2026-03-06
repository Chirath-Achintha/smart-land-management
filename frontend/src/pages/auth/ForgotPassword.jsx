import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'An error occurred.');
                setLoading(false);
                return;
            }

            setMsg(data.message);
            
            // Navigate to verify OTP page after short delay
            setTimeout(() => {
                navigate('/verify-otp', { state: { email } });
            }, 1000);
            
        } catch (err) {
            setError('Server error. Make sure the backend is running.');
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={styles.title}>Forgot Password</h2>
            <p style={styles.subtitle}>Enter your email to receive an OTP</p>

            {error && <p style={styles.error}>{error}</p>}
            {msg && <p style={styles.success}>{msg}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                        type="email"
                        placeholder="Enter your registered email"
                        style={styles.input}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                
                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
            </form>
            
            <p style={styles.footerText}>
                Remembered your password? <span onClick={() => navigate('/login')} style={styles.footerLink}>Login here</span>
            </p>
        </div>
    );
};

const styles = {
    title: { textAlign: 'center', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A' },
    subtitle: { textAlign: 'center', color: '#555', marginBottom: '32px', fontSize: '0.9rem' },
    error: { color: '#d32f2f', backgroundColor: '#fdecea', border: '1px solid #d32f2f', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem' },
    success: { color: '#2e7d32', backgroundColor: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px' },
    input: { padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
    button: { padding: '12px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: '600', transition: 'background 0.2s' },
    footerText: { textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#555' },
    footerLink: { color: '#1A1A1A', fontWeight: '700', textDecoration: 'none', cursor: 'pointer' }
};

export default ForgotPassword;
