import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: '',
        nic_number: '',
        role: 'buyer',
        address: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('http://127.0.0.1:8000/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || 'Registration failed');
                return;
            }

            // Success – go to login
            navigate('/login');
        } catch (err) {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 style={styles.title}>Create an Account</h2>
            <p style={styles.subtitle}>Sign up to join our community</p>

            {error && <p style={styles.error}>{error}</p>}

            <form style={styles.form} onSubmit={handleSubmit}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                        type="text"
                        name="full_name"
                        placeholder="Enter your full name"
                        style={styles.input}
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>NIC Number</label>
                    <input
                        type="text"
                        name="nic_number"
                        placeholder="Enter your NIC"
                        style={styles.input}
                        value={formData.nic_number}
                        onChange={handleChange}
                        required
                    />
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
                        <option value="constructor_manager">Constructor Manager</option>
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Address</label>
                    <input
                        type="text"
                        name="address"
                        placeholder="Enter your address"
                        style={styles.input}
                        value={formData.address}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        style={styles.input}
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1, marginRight: '10px' }}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            style={styles.input}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            name="confirm_password"
                            placeholder="Confirm"
                            style={styles.input}
                            value={formData.confirm_password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <button type="submit" style={styles.button} disabled={loading}>
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
    subtitle: { textAlign: 'center', color: '#555', marginBottom: '32px', fontSize: '0.9rem' },
    error: { color: '#d32f2f', backgroundColor: '#fdecea', border: '1px solid #d32f2f', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontSize: '0.875rem' },
    form: { display: 'flex', flexDirection: 'column' },
    formGroup: { marginBottom: '18px', display: 'flex', flexDirection: 'column' },
    formRow: { display: 'flex', justifyContent: 'space-between' },
    label: { fontSize: '0.85rem', fontWeight: '600', color: '#1A1A1A', marginBottom: '6px' },
    input: { padding: '10px 14px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', backgroundColor: '#fff' },
    button: { padding: '12px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', width: '100%', fontSize: '0.95rem', fontWeight: '600', marginTop: '10px' },
    footerText: { textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: '#555' },
    footerLink: { color: '#1A1A1A', fontWeight: '700', textDecoration: 'none' }
};

export default Register;
