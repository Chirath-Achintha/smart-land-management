import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const API = API_BASE_URL;

const STATUS_STYLE = {
    Pending: { color: '#8A5A25', background: '#FFF3E4', border: '1px solid #F5D9B2' },
    Accepted: { color: '#136F8A', background: '#E5F5FD', border: '1px solid #B6E3FA' },
    Completed: { color: '#2F7D32', background: '#E8F5E9', border: '1px solid #C8E6C9' },
    Cancelled: { color: '#A84343', background: '#FDECEC', border: '1px solid #F5C2C2' },
};

const CHART_COLORS = {
    Pending: '#A1887F',
    Accepted: '#2196F3',
    Completed: '#4CAF50',
    Cancelled: '#D66A6A'
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
        const pending = bookings.filter((b) => b.status === 'Pending').length;
        const accepted = bookings.filter((b) => b.status === 'Accepted').length;
        const completed = bookings.filter((b) => b.status === 'Completed').length;
        return [
            { label: 'Action Needed (Pending)', value: pending, color: '#b45309' },
            { label: 'Active Projects (Accepted)', value: accepted, color: '#0d9488' },
            { label: 'Completed Deliveries', value: completed, color: '#15803d' },
        ];
    }, [bookings]);

    const chartData = useMemo(() => {
        const counts = { Pending: 0, Accepted: 0, Completed: 0, Cancelled: 0 };
        bookings.forEach(b => {
             if (counts[b.status] !== undefined) counts[b.status]++;
        });
        return [
            { name: 'Pending', value: counts['Pending'], color: CHART_COLORS['Pending'] },
            { name: 'Accepted', value: counts['Accepted'], color: CHART_COLORS['Accepted'] },
            { name: 'Completed', value: counts['Completed'], color: CHART_COLORS['Completed'] },
            { name: 'Cancelled', value: counts['Cancelled'], color: CHART_COLORS['Cancelled'] },
        ].filter(d => d.value > 0);
    }, [bookings]);

    // Top 5 Latest Activity
    const recentActivity = bookings.slice(0, 5);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Overview Dashboard</h1>
                <p style={S.subtitle}>High-level business performance and urgent alerts.</p>
            </div>

            <div style={S.topSection}>
                <div style={S.statsGrid}>
                    {stats.map((s) => (
                        <div key={s.label} style={S.statCard}>
                            <span style={S.statLabel}>{s.label}</span>
                            <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                        </div>
                    ))}
                    
                    <div style={{ ...S.statCard, gridColumn: 'span 2', display: 'flex', flexDirection: 'row', alignItems: 'center', background: '#fff' }}>
                         <div style={{ flex: 1 }}>
                             <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 10px 0', color: '#1A1A1A' }}>Lifetime Request Analytics</h3>
                             <p style={{ fontSize: '0.8rem', color: '#777', margin: 0 }}>A quick snapshot of your entire assignment footprint.</p>
                         </div>
                         <div style={{ width: '180px', height: '140px' }}>
                             {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                             ) : (
                                 <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '0.8rem' }}>No Data</div>
                             )}
                         </div>
                    </div>
                </div>
            </div>

            <div style={S.section}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h2 style={S.sectionTitle}>Recent Inbox Activity</h2>
                    <div style={{display:'flex', gap:'10px'}}>
                        <button style={S.actionBtnOutline} onClick={() => navigate('/dashboard/service-requests')}>Go to Inbox</button>
                    </div>
                </div>
                
                {loading ? (
                    <div style={S.empty}>Loading recent activity...</div>
                ) : error ? (
                    <div style={S.error}>{error}</div>
                ) : recentActivity.length === 0 ? (
                    <div style={S.empty}>No recent activity found.</div>
                ) : (
                    <div style={S.tableCard}>
                        <table style={S.table}>
                            <thead>
                                <tr style={S.tableHeaderTr}>
                                    <th style={S.th}>Request ID</th>
                                    <th style={S.th}>Service Requested</th>
                                    <th style={S.th}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentActivity.map((b) => {
                                    const palette = STATUS_STYLE[b.status] || STATUS_STYLE.Pending;
                                    return (
                                        <tr key={b.id} style={S.tr}>
                                            <td style={S.td}>
                                                <div style={{ fontWeight: '600' }}>#{String(b.id || "000").substring(String(b.id || "000").length - 6).toUpperCase()}</div>
                                            </td>
                                            <td style={S.td}>
                                                <div style={{ fontWeight: '600' }}>{b.service_type}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>for {b.buyer_name || 'Buyer'}</div>
                                            </td>
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

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#fff0f0', borderRadius: '8px', margin: '40px' }}>
          <h2 style={{ color: '#d32f2f' }}>Dashboard Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#d32f2f', fontSize: '0.85rem' }}>
             {this.state.error.toString()}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const SafeConstructorManagerDashboard = (props) => (
  <ErrorBoundary>
    <ConstructorManagerDashboard {...props} />
  </ErrorBoundary>
);

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '26px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem' },

    topSection: { marginBottom: '32px' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' },
    statCard: { background: '#fff', padding: '24px', borderRadius: '20px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    statLabel: { fontSize: '0.7rem', fontWeight: '800', color: '#7C8B91', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' },
    statValue: { fontSize: '2.4rem', fontWeight: '800' },

    actionBtnOutline: { border: '1px solid var(--color-secondary)', background: '#fff', color: 'var(--color-primary)', borderRadius: '10px', padding: '8px 16px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' },

    section: { marginTop: '10px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    tableCard: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderTr: { background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' },
    th: { textAlign: 'left', padding: '16px 20px', fontSize: '0.75rem', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tr: { borderBottom: '1px solid #F3F4F6', transition: 'background-color 0.15s', ':hover': { backgroundColor: '#F9FAFB' } },
    td: { padding: '16px 20px', fontSize: '0.9rem', color: '#111827' },
    statusBadge: { padding: '6px 14px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '800' },

    empty: { textAlign: 'center', color: '#6B7280', padding: '40px', background: '#fff', borderRadius: '20px', border: '1px dashed #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    error: { border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '16px', borderRadius: '12px' },
};

export default SafeConstructorManagerDashboard;
