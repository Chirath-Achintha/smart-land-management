import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Approved: { color: '#1D4ED8', background: '#DBEAFE' },
    Scheduled: { color: '#1565c0', background: '#E3F2FD' },
    'In Progress': { color: '#2f6a1f', background: 'rgba(139, 195, 74, 0.24)' },
    Completed: { color: '#1f7a3a', background: 'rgba(76, 175, 80, 0.2)' },
    Cancelled: { color: '#8d4f3e', background: 'rgba(161, 136, 127, 0.26)' },
};

const isAcceptedWork = (status) => status === 'In Progress' || status === 'Completed' || status === 'Cancelled';

const ConstructorManagerDashboard = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('access_token');
    const authH = { Authorization: `Bearer ${token}` };

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchAssignedBookings = async () => {
        if (!token) {
            setLoading(false);
            setError('Please log in to view constructor dashboard data.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/service-bookings/assigned`, { headers: authH });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load assigned work');
            const filtered = (Array.isArray(data) ? data : []).filter((b) => isAcceptedWork(b.status));
            setBookings(filtered);
        } catch (e) {
            setBookings([]);
            setError(e.message || 'Failed to load assigned work');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssignedBookings();
    }, []);

    useEffect(() => {
        if (!token) return undefined;

        const intervalId = setInterval(fetchAssignedBookings, 15000);
        const onFocus = () => fetchAssignedBookings();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', onFocus);
        };
    }, [token]);

    const stats = useMemo(() => {
        const active = bookings.filter((b) => b.status === 'In Progress').length;
        const completed = bookings.filter((b) => b.status === 'Completed').length;
        const cancelled = bookings.filter((b) => b.status === 'Cancelled').length;
        return [
            { label: 'Active Work', value: active, color: 'var(--color-dark)' },
            { label: 'Completed Jobs', value: completed, color: 'var(--color-primary)' },
            { label: 'Rejected Jobs', value: cancelled, color: 'var(--color-accent)' },
        ];
    }, [bookings]);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Constructor Manager Dashboard</h1>
                <p style={S.subtitle}>Track assigned construction service requests and update progress.</p>
            </div>

            <div style={S.statsGrid}>
                {stats.map((s) => (
                    <div key={s.label} className="ui-card ui-lift" style={S.statCard}>
                        <span style={S.statLabel}>{s.label}</span>
                        <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            <div style={S.actionRow}>
                <button className="btn-primary" style={S.primaryBtn} onClick={() => navigate('/dashboard/service-requests')}>Open Service Requests</button>
                <button className="btn-secondary" style={S.secondaryBtn} onClick={fetchAssignedBookings}>Refresh</button>
            </div>

            <div style={S.section}>
                <h2 style={S.sectionTitle}>Assigned Work</h2>
                {loading ? (
                    <div style={S.empty}>Loading assigned work...</div>
                ) : error ? (
                    <div style={S.error}>{error}</div>
                ) : bookings.length === 0 ? (
                    <div style={S.empty}>No assigned construction requests yet.</div>
                ) : (
                    <div className="ui-card" style={S.tableCard}>
                        <table style={S.table}>
                            <thead>
                                <tr style={S.tableHeaderTr}>
                                    <th style={S.th}>Request</th>
                                    <th style={S.th}>Buyer</th>
                                    <th style={S.th}>Land</th>
                                    <th style={S.th}>Schedule</th>
                                    <th style={S.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((b) => {
                                    const palette = STATUS_STYLE[b.status] || STATUS_STYLE.Scheduled;
                                    return (
                                        <tr key={b.id} style={S.tr}>
                                            <td style={S.td}>#{b.id}</td>
                                            <td style={S.td}>{b.buyer_name || `Buyer #${b.buyer_id}`}</td>
                                            <td style={S.td}>{b.land_name || 'N/A'}</td>
                                            <td style={S.td}>{b.preferred_date} at {b.preferred_time}</td>
                                            <td style={S.td}>
                                                <span style={{ ...S.statusBadge, ...palette }}>{b.status}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '26px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-muted)', fontSize: '1rem' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' },
    statCard: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.08)' },
    statLabel: { display: 'block', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '8px' },
    statValue: { fontSize: '2rem', fontWeight: '800' },

    actionRow: { display: 'flex', gap: '10px', marginBottom: '24px' },
    primaryBtn: { border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' },
    secondaryBtn: { border: 'none', borderRadius: '10px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' },

    section: { marginTop: '10px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '14px' },
    tableCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.08)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderTr: { background: 'rgba(139, 195, 74, 0.12)' },
    th: { textAlign: 'left', padding: '14px 18px', fontSize: '0.76rem', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid rgba(38, 50, 56, 0.08)' },
    td: { padding: '14px 18px', fontSize: '0.9rem', color: 'var(--color-dark)' },
    statusBadge: { padding: '5px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' },

    empty: { textAlign: 'center', color: 'var(--color-muted)', padding: '30px', background: '#fff', borderRadius: '12px', border: '1px solid rgba(38, 50, 56, 0.08)' },
    error: { border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '12px 14px', borderRadius: '10px' },
};

export default ConstructorManagerDashboard;
