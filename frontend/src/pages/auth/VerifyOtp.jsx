import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const VerifyOtp = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || '';

    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email) {
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Invalid or expired OTP.');
                setLoading(false);
                return;
            }

            setMsg(data.message);

            // Navigate to reset password page after short delay
            setTimeout(() => {
                navigate('/reset-password', { state: { email, otp } });
            }, 1000);

        } catch (err) {
            setError('Server error. Make sure the backend is running.');
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={styles.title}>Verify OTP</h2>
            <p style={styles.subtitle}>Enter the 6-digit OTP sent to {email}</p>

            {error && <p style={styles.error}>{error}</p>}
            {msg && <p style={styles.success}>{msg}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Enter OTP</label>
                    <input
                        type="text"
                        placeholder="123456"
                        maxLength="6"
                        style={{ ...styles.input, textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" style={styles.button} disabled={loading || otp.length !== 6}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
            </form>

            <p style={styles.footerText}>
                Didn't receive the email? <span onClick={() => navigate('/forgot-password')} style={styles.footerLink}>Try again</span>
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
    label: { fontSize: '0.875rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '8px', textAlign: 'center' },
    input: { padding: '12px 16px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
    button: { padding: '12px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: '600', transition: 'background 0.2s' },
    footerText: { textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#555' },
    footerLink: { color: '#1A1A1A', fontWeight: '700', textDecoration: 'none', cursor: 'pointer' }
};

export default VerifyOtp;
