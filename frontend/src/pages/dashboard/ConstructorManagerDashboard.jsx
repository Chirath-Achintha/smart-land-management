import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ConstructorManagerDashboard = () => {
    const { user } = useAuth();

    const stats = [
        { label: 'Active Projects', value: '8', color: '#1A1A1A' },
        { label: 'Pending Approvals', value: '3', color: '#3498db' },
        { label: 'Team Members', value: '14', color: '#27ae60' }
    ];

    const [projects] = useState([
        { id: 'PRJ001', name: 'Luxury Villa - Kandy', status: 'In Progress', progress: 65, client: 'John Doe' },
        { id: 'PRJ002', name: 'Apartment Complex - Colombo', status: 'Planning', progress: 15, client: 'Sarah Smith' },
        { id: 'PRJ003', name: 'Commercial Hub - Galle', status: 'Completed', progress: 100, client: 'Tech Corp' }
    ]);

    const teamMembers = [
        { id: 'TM001', name: 'Aruna Perera', role: 'Architect', status: 'Active', assignment: 'Luxury Villa - Kandy' },
        { id: 'TM002', name: 'Sunil Silva', role: 'Civil Engineer', status: 'Active', assignment: 'Commercial Hub - Galle' },
        { id: 'TM003', name: 'Kamal Fernando', role: 'Site Manager', status: 'On Leave', assignment: 'N/A' },
        { id: 'TM004', name: 'Dinesh Gamage', role: 'Quantity Surveyor', status: 'Active', assignment: 'Apartment Complex - Colombo' },
        { id: 'TM005', name: 'Priya Rathnayake', role: 'Interior Designer', status: 'Active', assignment: 'Luxury Villa - Kandy' }
    ];

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Constructor Manager Dashboard</h1>
                <p style={S.subtitle}>Oversee your construction projects and team performance.</p>
            </div>

            <div style={S.statsGrid}>
                {stats.map((s, i) => (
                    <div key={i} style={S.statCard}>
                        <span style={S.statLabel}>{s.label}</span>
                        <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            <div style={S.section}>
                <h2 style={S.sectionTitle}>Current Projects</h2>
                <div style={S.tableCard}>
                    <table style={S.table}>
                        <thead>
                            <tr style={S.tableHeaderTr}>
                                <th style={S.th}>Project ID</th>
                                <th style={S.th}>Project Name</th>
                                <th style={S.th}>Client</th>
                                <th style={S.th}>Status</th>
                                <th style={S.th}>Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((p, i) => (
                                <tr key={i} style={S.tr}>
                                    <td style={S.td}>{p.id}</td>
                                    <td style={S.td}><strong>{p.name}</strong></td>
                                    <td style={S.td}>{p.client}</td>
                                    <td style={S.td}>
                                        <span style={{ ...S.statusBadge, ...getStatusStyle(p.status) }}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td style={S.td}>
                                        <div style={S.actionRow}>
                                            <div style={S.progressContainer}>
                                                <div style={{ ...S.progressBar, width: `${p.progress}%` }}></div>
                                                <span style={S.progressText}>{p.progress}%</span>
                                            </div>
                                            {p.status === 'Planning' && (
                                                <button style={S.smallAcceptBtn} onClick={() => alert('Project Accepted!')}>Accept</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style={S.section}>
                <h2 style={S.sectionTitle}>Team Personnel</h2>
                <div style={S.tableCard}>
                    <table style={S.table}>
                        <thead>
                            <tr style={S.tableHeaderTr}>
                                <th style={S.th}>Name</th>
                                <th style={S.th}>Role</th>
                                <th style={S.th}>Status</th>
                                <th style={S.th}>Assignment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.map((m, i) => (
                                <tr key={i} style={S.tr}>
                                    <td style={S.td}>
                                        <div style={S.memberInfo}>
                                            <div style={S.smallAvatar}>{m.name.charAt(0)}</div>
                                            <strong>{m.name}</strong>
                                        </div>
                                    </td>
                                    <td style={S.td}>{m.role}</td>
                                    <td style={S.td}>
                                        <span style={{
                                            ...S.statusBadge,
                                            background: m.status === 'Active' ? '#eafaf1' : '#fef5e7',
                                            color: m.status === 'Active' ? '#27ae60' : '#f39c12'
                                        }}>
                                            {m.status}
                                        </span>
                                    </td>
                                    <td style={S.td}>{m.assignment}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'In Progress': return { color: '#f39c12', background: '#fef5e7' };
        case 'Planning': return { color: '#3498db', background: '#ebf5fb' };
        case 'Completed': return { color: '#27ae60', background: '#eafaf1' };
        default: return { color: '#777', background: '#f4f4f4' };
    }
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' },
    statCard: { background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    statLabel: { display: 'block', fontSize: '0.75rem', fontWeight: '800', color: '#BBB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' },
    statValue: { fontSize: '2rem', fontWeight: '800' },

    section: { marginTop: '40px' },
    sectionTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px' },
    tableCard: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeaderTr: { background: '#F9F9F9' },
    th: { textAlign: 'left', padding: '16px 24px', fontSize: '0.8rem', fontWeight: '800', color: '#777', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #F9F9F9' },
    td: { padding: '20px 24px', fontSize: '0.9rem', color: '#1A1A1A' },

    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '800' },

    progressContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
    progressContainerBg: { flex: 1, height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' },
    progressBar: { height: '8px', background: '#1A1A1A', borderRadius: '4px' },
    progressText: { fontSize: '0.75rem', fontWeight: '700', color: '#777' },

    memberInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    smallAvatar: { width: '32px', height: '32px', background: '#F5F5F5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '800', color: '#1A1A1A' },

    actionRow: { display: 'flex', alignItems: 'center', gap: '16px' },
    smallAcceptBtn: { padding: '4px 10px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }
};

export default ConstructorManagerDashboard;
