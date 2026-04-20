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
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false });
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!email || !otp) {
            navigate('/forgot-password');
        }
    }, [email, otp, navigate]);

    const validateField = (name, value) => {
        let errorMsg = '';
        if (name === 'newPassword') {
            if (value.length < 8) errorMsg = 'Password must be at least 8 characters';
        } else if (name === 'confirmPassword') {
            if (value !== newPassword) errorMsg = 'Passwords do not match';
        }
        return errorMsg;
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        setErrors(prev => ({ 
            ...prev, 
            newPassword: validateField('newPassword', value),
            confirmPassword: confirmPassword !== value ? 'Passwords do not match' : ''
        }));
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        setErrors(prev => ({ 
            ...prev, 
            confirmPassword: validateField('confirmPassword', value) 
        }));
    };

    const handleBlur = (e) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMsg('');

        const newPassError = validateField('newPassword', newPassword);
        const confirmPassError = validateField('confirmPassword', confirmPassword);

        if (newPassError || confirmPassError) {
            setErrors({ newPassword: newPassError, confirmPassword: confirmPassError });
            setTouched({ newPassword: true, confirmPassword: true });
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

    const getInputStyle = (name) => ({
        ...styles.input,
        borderColor: touched[name] && errors[name] ? '#d32f2f' : touched[name] && !errors[name] ? '#2e7d32' : 'rgba(0,0,0,0.08)',
        backgroundColor: touched[name] && errors[name] ? '#fff8f7' : '#fcfcfc',
        boxShadow: touched[name] && errors[name] ? '0 0 0 1px #f2c2bc' : 'none',
        paddingRight: '45px'
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
        <div>
            <h2 style={styles.title}>Reset Password</h2>
            <p style={styles.subtitle}>Enter your new password below</p>

            {error && <p style={styles.error}>{error}</p>}
            {msg && <p style={styles.success}>{msg}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>New Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="newPassword"
                            placeholder="Enter new password"
                            style={getInputStyle('newPassword')}
                            value={newPassword}
                            onChange={handlePasswordChange}
                            onBlur={handleBlur}
                            required
                        />
                        <EyeIcon show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    </div>
                    {touched.newPassword && errors.newPassword && <span style={styles.fieldErrorBelow}>{errors.newPassword}</span>}
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            style={getInputStyle('confirmPassword')}
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            onBlur={handleBlur}
                            required
                        />
                        <EyeIcon show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                    </div>
                    {touched.confirmPassword && errors.confirmPassword && <span style={styles.fieldErrorBelow}>{errors.confirmPassword}</span>}
                </div>

                <button 
                    type="submit" 
                    style={{
                        ...styles.button,
                        opacity: (errors.newPassword || errors.confirmPassword) ? 0.6 : 1,
                        cursor: (errors.newPassword || errors.confirmPassword) ? 'not-allowed' : 'pointer'
                    }} 
                    disabled={loading}
                >
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
    fieldErrorBelow: { fontSize: '0.72rem', color: '#d32f2f', fontWeight: '600', marginTop: '6px' },
    input: { padding: '14px 18px', border: '1.5px solid rgba(0,0,0,0.08)', borderRadius: '12px', fontSize: '1rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', backgroundColor: '#fcfcfc', width: '100%', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', padding: '4px' },
    button: { padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: '600', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};

export default ResetPassword;
