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

    const handleResendOtp = async () => {
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
                setError(data.detail || 'Failed to resend OTP.');
            } else {
                setMsg(data.message);
            }
        } catch (err) {
            setError('Server error.');
        } finally {
            setLoading(false);
        }
    };

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
                Didn't receive the email? <span onClick={handleResendOtp} style={styles.footerLink} disabled={loading}>Resend OTP</span>
                <br /><br />
                <span onClick={() => navigate('/forgot-password')} style={{...styles.footerLink, fontSize: '0.8rem', color: '#888'}}>Change Email</span>
            </p>
        </div>
    );
};

const styles = {
    title: { textAlign: 'center', marginBottom: '8px', fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', letterSpacing: '-0.02em' },
    subtitle: { textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '1rem', lineHeight: '1.5' },
    error: { color: '#d32f2f', backgroundColor: '#fdecea', border: '1px solid rgba(211, 47, 47, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.875rem', fontWeight: '500' },
    success: { color: '#2e7d32', backgroundColor: '#e8f5e9', border: '1px solid rgba(46, 125, 50, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '24px', fontSize: '0.875rem', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '24px', display: 'flex', flexDirection: 'column' },
    label: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '10px', textAlign: 'center' },
    input: { padding: '16px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: '#fcfcfc', textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: '700' },
    button: { padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    footerText: { textAlign: 'center', marginTop: '32px', fontSize: '0.95rem', color: '#666' },
    footerLink: { color: '#1A1A1A', fontWeight: '700', textDecoration: 'none', cursor: 'pointer', borderBottom: '2px solid #1A1A1A', paddingBottom: '2px' }
};

export default VerifyOtp;
