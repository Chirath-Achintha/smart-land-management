import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Approved: { color: '#1D4ED8', background: '#DBEAFE' },
    Scheduled: { color: '#1565c0', background: '#E3F2FD' },
    'In Progress': { color: '#9a3412', background: '#FFEDD5' },
    Completed: { color: '#166534', background: '#DCFCE7' },
    Cancelled: { color: '#991B1B', background: '#FEE2E2' },
};

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
            setBookings(Array.isArray(data) ? data : []);
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

    const stats = useMemo(() => {
        const active = bookings.filter((b) => b.status === 'In Progress').length;
        const pending = bookings.filter((b) => b.status === 'Approved' || b.status === 'Scheduled').length;
        const completed = bookings.filter((b) => b.status === 'Completed').length;
        return [
            { label: 'Active Work', value: active, color: '#1A1A1A' },
            { label: 'Pending Approvals', value: pending, color: '#1D4ED8' },
            { label: 'Completed Jobs', value: completed, color: '#166534' },
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
                    <div key={s.label} style={S.statCard}>
                        <span style={S.statLabel}>{s.label}</span>
                        <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            <div style={S.actionRow}>
                <button style={S.primaryBtn} onClick={() => navigate('/dashboard/service-requests')}>Open Service Requests</button>
                <button style={S.secondaryBtn} onClick={fetchAssignedBookings}>Refresh</button>
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
                    <div style={S.tableCard}>
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
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '26px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' },
    statCard: { background: '#fff', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    statLabel: { display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', marginBottom: '8px' },
    statValue: { fontSize: '2rem', fontWeight: '800' },

    actionRow: { display: 'flex', gap: '10px', marginBottom: '24px' },
    primaryBtn: { border: 'none', background: '#111827', color: '#fff', borderRadius: '10px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' },
    secondaryBtn: { border: '1px solid #d1d5db', background: '#fff', color: '#111827', borderRadius: '10px', padding: '10px 14px', fontWeight: 700, cursor: 'pointer' },

    section: { marginTop: '10px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '14px' },
    tableCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderTr: { background: '#F9F9F9' },
    th: { textAlign: 'left', padding: '14px 18px', fontSize: '0.76rem', fontWeight: '800', color: '#777', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #F3F4F6' },
    td: { padding: '14px 18px', fontSize: '0.9rem', color: '#1A1A1A' },
    statusBadge: { padding: '5px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' },

    empty: { textAlign: 'center', color: '#8a8a8a', padding: '30px', background: '#fff', borderRadius: '12px', border: '1px solid #f1f1f1' },
    error: { border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '12px 14px', borderRadius: '10px' },
};

export default ConstructorManagerDashboard;
