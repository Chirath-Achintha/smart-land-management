import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Stats
    const [stats, setStats] = useState([]);

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [tempProfile, setTempProfile] = useState({});

    // Fetch user from DB using JWT
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setProfileLoading(false); return; }

        // Fetch Profile
        fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const profileData = {
                    name: data.full_name || '',
                    email: data.email || '',
                    nic: data.nic_number || '',
                    address: data.address || '',
                    role: (data.role || '').replace('_', ' '),
                };
                setProfile(profileData);
                setTempProfile(profileData);
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));

        // Fetch Stats
        fetch(`${API}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error);
    }, []);

    const handleEditToggle = () => {
        setTempProfile({ ...profile });
        setIsEditing(true);
    };

    const handleSave = () => {
        setProfile({ ...tempProfile });
        setIsEditing(false);
        alert('Profile updated successfully!');
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Admin Dashboard</h1>
                <p style={S.subtitle}>
                    {profileLoading ? 'Loading...' : <>Welcome back, <strong>{profile?.name}</strong>! System overview and management center.</>}
                </p>
            </div>

            {/* Summary Cards */}
            <div style={S.cardGrid}>
                {stats.map((c, i) => (
                    <div
                        key={i}
                        style={{ ...S.card, borderTop: `4px solid ${c.color}` }}
                        onClick={() => navigate(c.route)}
                    >
                        <div style={{ ...S.statVal, color: c.color }}>{c.count}</div>
                        <div style={S.statLabel}>{c.label}</div>
                    </div>
                ))}
            </div>

            <div style={S.dashboardContent}>
                <div style={S.mainColumn}>
                    {/* Profile Card */}
                    <div style={S.sectionCard}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>Admin Profile</h2>
                            {!isEditing ? (
                                <button style={S.editBtn} onClick={handleEditToggle}>Edit Profile</button>
                            ) : (
                                <div style={S.editActions}>
                                    <button style={S.saveBtn} onClick={handleSave}>Save</button>
                                    <button style={S.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                                </div>
                            )}
                        </div>

                        <div style={S.profileGrid}>
                            {profile && Object.keys(profile).map(key => (
                                <div key={key} style={S.profileItem}>
                                    <span style={S.label}>{key.replace('nic', 'NIC').toUpperCase()}</span>
                                    {isEditing ? (
                                        <input
                                            style={S.input}
                                            value={tempProfile[key]}
                                            onChange={(e) => setTempProfile({ ...tempProfile, [key]: e.target.value })}
                                        />
                                    ) : (
                                        <span style={S.value}>{profile[key]}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Management</h2>
                        <div style={S.btnRow}>
                            <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/users')}>
                                User Directory
                            </button>
                        </div>
                    </div>
                </div>

                <div style={S.sideColumn}>
                    {/* System Status Activity */}
                    <div style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Logs</h2>
                        <div style={S.activityList}>
                            {[
                                { text: 'All systems operational', time: 'Active', color: '#27ae60' },
                                { text: 'Database backup completed', time: '2 hrs ago', color: '#3498db' },
                                { text: '3 agent applications pending', time: 'Action Reqd', color: '#e67e22' },
                            ].map((a, i) => (
                                <div key={i} style={S.activityItem}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color }} />
                                    <span style={S.actText}>{a.text}</span>
                                    <span style={S.actTime}>{a.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    root: { background: 'var(--sage-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--sage-text-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--sage-text-med)', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: 'var(--sage-card)', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s', cursor: 'pointer' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: 'var(--sage-text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: 'var(--sage-card)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(85, 107, 47, 0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(85, 107, 47, 0.05)', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--sage-text-dark)', margin: 0 },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: 'rgba(85, 107, 47, 0.05)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-primary)' },
    saveBtn: { padding: '8px 16px', background: 'var(--sage-primary)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-text-med)' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--sage-text-light)', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: 'var(--sage-text-dark)' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(85, 107, 47, 0.1)', background: 'var(--sage-bg)', fontSize: '0.9rem', outline: 'none', color: 'var(--sage-text-dark)' },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: 'var(--sage-card)', color: 'var(--sage-primary)', border: '2px solid var(--sage-primary)' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid rgba(85, 107, 47, 0.05)' },
    actText: { flex: 1, fontSize: '0.9rem', color: 'var(--sage-text-dark)', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: 'var(--sage-text-light)', whiteSpace: 'nowrap' },
};

export default AdminDashboard;


