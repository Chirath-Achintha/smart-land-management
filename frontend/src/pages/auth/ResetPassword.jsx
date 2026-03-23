import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const ResetPassword = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const email = location.state?.email || '';
    const otp = location.state?.otp || '';

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!email || !otp) {
            navigate('/forgot-password');
        }
    }, [email, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, new_password: newPassword, confirm_password: confirmPassword })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Failed to reset password.');
                setLoading(false);
                return;
            }

            setMsg(data.message);

            // Navigate to login page
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError('Server error. Make sure the backend is running.');
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={styles.title}>Reset Password</h2>
            <p style={styles.subtitle}>Enter your new password below</p>

            {error && <p style={styles.error}>{error}</p>}
            {msg && <p style={styles.success}>{msg}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <input
                        type="password"
                        placeholder="Enter new password"
                        style={styles.input}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm Password</label>
                    <input
                        type="password"
                        placeholder="Confirm new password"
                        style={styles.input}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset Password'}
                </button>
            </form>
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
    label: { fontSize: '0.9rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '10px' },
    input: { padding: '14px 18px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: '#fcfcfc' },
    button: { padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};

export default ResetPassword;
