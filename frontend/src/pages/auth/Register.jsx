import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        nic_number: '',
        phone: '',
        role: 'buyer',
        address: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validateField = (name, value) => {
        let error = '';
        switch (name) {
            case 'full_name':
                if (value.trim().length < 3) error = 'Name must be at least 3 characters';
                break;
            case 'nic_number':
                const nicRegex = /^([0-9]{9}[vVxX]|[0-9]{12})$/;
                if (!nicRegex.test(value)) error = 'Invalid NIC format';
                break;
            case 'phone':
                const phoneRegex = /^0[0-9]{9}$/;
                if (!phoneRegex.test(value)) error = 'Must be 10 digits starting with 0';
                break;
            case 'email':
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) error = 'Invalid email address';
                break;
            case 'password':
                if (value.length < 8) {
                    error = 'Password must be at least 8 characters';
                }
                break;
            case 'confirm_password':
                if (value !== formData.password) error = 'Passwords do not match';
                break;
            case 'address':
                if (value.trim().length < 5) error = 'Address is too short';
                break;
            default:
                break;
        }
        return error;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Live validation logic
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));

        // Re-validate confirm password if primary password changes
        if (name === 'password') {
            const confirmError = validateField('confirm_password', formData.confirm_password);
            setErrors(prev => ({ ...prev, confirm_password: confirmError }));
        }
    };

    const handleBlur = (e) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final validation check before submit
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            const error = validateField(key, formData[key]);
            if (error) newErrors[key] = error;
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTouched(Object.keys(formData).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (!res.ok) {
                setErrors({ submit: data.detail || 'Registration failed' });
                return;
            }
            navigate('/login');
        } catch (err) {
            setErrors({ submit: 'Server connection error.' });
        } finally {
            setLoading(false);
        }
    };

    const getInputStyle = (name) => ({
        ...styles.input,
        borderColor: touched[name] && errors[name] ? '#d32f2f' : touched[name] && !errors[name] ? '#2e7d32' : 'rgba(0,0,0,0.1)',
        backgroundColor: touched[name] && errors[name] ? '#fff8f7' : '#fff',
        boxShadow: touched[name] && errors[name] ? '0 0 0 1px #f2c2bc' : 'none',
        paddingRight: name === 'password' || name === 'confirm_password' ? '45px' : '15px'
    });

    const EyeIcon = ({ show, onToggle }) => (
        <div style={styles.eyeBtn} onClick={onToggle} title={show ? "Hide" : "Show"}>
            {show ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            )}
        </div>
    );

    return (
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>
            <h2 style={styles.title}>Create an Account</h2>
            <p style={styles.subtitle}>Sign up to join our community</p>

            {errors.submit && <p style={styles.error}>{errors.submit}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        placeholder="Enter your full name"
                        style={getInputStyle('full_name')}
                        value={formData.full_name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                    />
                    {touched.full_name && errors.full_name && <span style={styles.fieldErrorBelow}>{errors.full_name}</span>}
                </div>

                <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1, marginRight: '10px' }}>
                        <label style={styles.label}>NIC Number</label>
                        <input
                            type="text"
                            name="nic_number"
                            placeholder="Enter your NIC"
                            style={getInputStyle('nic_number')}
                            value={formData.nic_number}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                        />
                        {touched.nic_number && errors.nic_number && <span style={styles.fieldErrorBelow}>{errors.nic_number}</span>}
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Phone Number</label>
                        <input
                            type="text"
                            name="phone"
                            placeholder="07X XXX XXXX"
                            style={getInputStyle('phone')}
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                        />
                        {touched.phone && errors.phone && <span style={styles.fieldErrorBelow}>{errors.phone}</span>}
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Register As</label>
                    <select
                        name="role"
                        style={styles.input}
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Address</label>
                    <input
                        type="text"
                        name="address"
                        placeholder="Enter your address"
                        style={getInputStyle('address')}
                        value={formData.address}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                    />
                    {touched.address && errors.address && <span style={styles.fieldErrorBelow}>{errors.address}</span>}
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        style={getInputStyle('email')}
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                    />
                    {touched.email && errors.email && <span style={styles.fieldErrorBelow}>{errors.email}</span>}
                </div>

                <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1, marginRight: '10px' }}>
                        <label style={styles.label}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Password"
                                style={getInputStyle('password')}
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                            />
                            <EyeIcon show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                        </div>
                        {touched.password && errors.password && <span style={styles.fieldErrorBelow}>{errors.password}</span>}
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Confirm Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirm_password"
                                placeholder="Confirm"
                                style={getInputStyle('confirm_password')}
                                value={formData.confirm_password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                required
                            />
                            <EyeIcon show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                        </div>
                        {touched.confirm_password && errors.confirm_password && <span style={styles.fieldErrorBelow}>{errors.confirm_password}</span>}
                    </div>
                </div>

                <button
                    type="submit"
                    style={{
                        ...styles.button,
                        opacity: Object.keys(errors).some(k => errors[k]) ? 0.6 : 1,
                        cursor: Object.keys(errors).some(k => errors[k]) ? 'not-allowed' : 'pointer'
                    }}
                    disabled={loading}
                >
                    {loading ? 'Registering...' : 'Register'}
                </button>
            </form>
            <p style={styles.footerText}>
                Already have an account? <Link to="/login" style={styles.footerLink}>Login here</Link>
            </p>
        </div>
    );
};

const styles = {
    title: { textAlign: 'center', marginBottom: '10px', fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A' },
    subtitle: { textAlign: 'center', color: '#666', marginBottom: '32px', fontSize: '0.95rem' },
    error: { color: '#d32f2f', backgroundColor: '#fdecea', border: '1px solid #f2c2bc', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem', fontWeight: '500' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column' },
    formRow: { display: 'flex', justifyContent: 'space-between' },
    labelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    label: { fontSize: '0.85rem', fontWeight: '700', color: '#1A1A1A' },
    fieldError: { fontSize: '0.75rem', color: '#d32f2f', fontWeight: '600' },
    fieldErrorBelow: { fontSize: '0.72rem', color: '#d32f2f', fontWeight: '600', marginTop: '6px' },
    input: { padding: '12px 15px', border: '1.5px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s ease', width: '100%', boxSizing: 'border-box' },
    eyeBtn: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s', padding: '4px' },
    button: { padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', cursor: 'pointer', width: '100%', fontSize: '1rem', fontWeight: '700', marginTop: '10px', transition: 'all 0.2s' },
    footerText: { textAlign: 'center', marginTop: '24px', fontSize: '0.92rem', color: '#666' },
    footerLink: { color: '#1A1A1A', fontWeight: '800', textDecoration: 'none' }
};

export default Register;
