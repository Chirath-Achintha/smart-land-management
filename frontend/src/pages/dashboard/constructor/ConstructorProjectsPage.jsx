import React, { useState } from 'react';

const ConstructorProjectsPage = () => {
    const [projects, setProjects] = useState([
        { id: 'PRJ001', name: 'Luxury Villa - Kandy', status: 'In Progress', progress: 65, client: 'John Doe', team: 'Squad A', startDate: '2024-01-10', budget: '15M' },
        { id: 'PRJ002', name: 'Apartment Complex - Colombo', status: 'Planning', progress: 15, client: 'Sarah Smith', team: 'Squad B', startDate: '2024-02-15', budget: '45M' },
        { id: 'PRJ003', name: 'Commercial Hub - Galle', status: 'Completed', progress: 100, client: 'Tech Corp', team: 'Squad C', startDate: '2023-09-01', budget: '80M' },
        { id: 'PRJ004', name: 'Residential Suite - Negombo', status: 'In Progress', progress: 40, client: 'Kumar Sangha', team: 'Squad A', startDate: '2024-02-01', budget: '12M' },
    ]);

    const [activeProject, setActiveProject] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [filter, setFilter] = useState('All');

    const handleUpdateProgress = (id, newProgress) => {
        setProjects(projects.map(p => p.id === id ? { ...p, progress: Math.min(100, Math.max(0, newProgress)) } : p));
    };

    const filtered = projects.filter(p => filter === 'All' || p.status === filter);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>My Projects</h1>
                <p style={S.subtitle}>Manage and track your active construction projects.</p>
            </div>

            <div style={S.toolbar}>
                <div style={S.filterBar}>
                    {['All', 'Planning', 'In Progress', 'Completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            style={{ ...S.filterBtn, ...(filter === f ? S.activeFilter : {}) }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            <div style={S.projectGrid}>
                {filtered.map(p => (
                    <div key={p.id} style={S.projectCard}>
                        <div style={S.cardHeader}>
                            <span style={S.projectId}>{p.id}</span>
                            <span style={{ ...S.statusBadge, ...getStatusStyle(p.status) }}>{p.status}</span>
                        </div>
                        <h3 style={S.projectName}>{p.name}</h3>
                        <div style={S.infoSummary}>
                            <div style={S.infoItem}>
                                <span style={S.label}>Client</span>
                                <span style={S.value}>{p.client}</span>
                            </div>
                            <div style={S.infoItem}>
                                <span style={S.label}>Budget</span>
                                <span style={S.value}>{p.budget}</span>
                            </div>
                        </div>

                        <div style={S.progressWrapper}>
                            <div style={S.progressHeader}>
                                <span style={S.label}>Completion Progress</span>
                                <span style={S.progressVal}>{p.progress}%</span>
                            </div>
                            <div style={S.progressBg}>
                                <div style={{ ...S.progressFill, width: `${p.progress}%` }}></div>
                            </div>
                        </div>

                        <button
                            style={S.viewDetailsBtn}
                            onClick={() => { setActiveProject(p); setShowModal(true); }}
                        >
                            View Details & Manage
                        </button>
                    </div>
                ))}
            </div>

            {showModal && activeProject && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <div style={S.modalHeader}>
                            <h2 style={S.modalTitle}>{activeProject.name}</h2>
                            <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div style={S.modalBody}>
                            <div style={S.modalGrid}>
                                <div style={S.modalField}>
                                    <span style={S.label}>Project ID</span>
                                    <span style={S.valueLarge}>{activeProject.id}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Team Assigned</span>
                                    <span style={S.valueLarge}>{activeProject.team}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Start Date</span>
                                    <span style={S.valueLarge}>{activeProject.startDate}</span>
                                </div>
                                <div style={S.modalField}>
                                    <span style={S.label}>Status</span>
                                    <div style={{ ...S.statusBadge, ...getStatusStyle(activeProject.status), alignSelf: 'flex-start' }}>{activeProject.status}</div>
                                </div>
                            </div>

                            <div style={S.updateSection}>
                                <h4 style={S.sectionLabel}>Quick Actions</h4>
                                <div style={S.actionRow}>
                                    <button style={S.actionBtn} onClick={() => handleUpdateProgress(activeProject.id, activeProject.progress + 5)}>+5% Progress</button>
                                    <button style={S.actionBtn} onClick={() => handleUpdateProgress(activeProject.id, activeProject.progress - 5)}>-5% Progress</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    toolbar: { marginBottom: '32px' },
    filterBar: { display: 'flex', gap: '8px' },
    filterBtn: { padding: '8px 16px', borderRadius: '8px', border: '1px solid #DDD', background: '#fff', color: '#666', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    activeFilter: { background: '#1A1A1A', color: '#fff', border: '1px solid #1A1A1A' },

    projectGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' },
    projectCard: { background: '#fff', borderRadius: '24px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '20px' },

    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    projectId: { fontSize: '0.75rem', fontWeight: '800', color: '#3498db', letterSpacing: '0.05em' },
    statusBadge: { padding: '6px 12px', borderRadius: '8px', fontSize: '0.7rem', fontWeight: '800' },

    projectName: { margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A' },

    infoSummary: { display: 'flex', gap: '24px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
    label: { fontSize: '0.7rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase' },
    value: { fontSize: '0.9rem', fontWeight: '700', color: '#333' },

    progressWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
    progressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' },
    progressVal: { fontSize: '0.9rem', fontWeight: '800', color: '#1A1A1A' },
    progressBg: { width: '100%', height: '8px', background: '#F0F0F0', borderRadius: '4px', overflow: 'hidden' },
    progressFill: { height: '100%', background: '#1A1A1A', borderRadius: '4px', transition: 'width 0.4s ease' },

    viewDetailsBtn: { marginTop: '10px', padding: '12px', borderRadius: '12px', background: '#F5F5F5', color: '#1A1A1A', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'background 0.2s' },

    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '32px', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { margin: 0, fontSize: '1.5rem', fontWeight: '800' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#AAA' },

    modalBody: { display: 'flex', flexDirection: 'column', gap: '24px' },
    modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
    modalField: { display: 'flex', flexDirection: 'column', gap: '4px' },
    valueLarge: { fontSize: '1rem', fontWeight: '700', color: '#1A1A1A' },

    updateSection: { padding: '20px', background: '#F9F9F9', borderRadius: '16px' },
    sectionLabel: { margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: '800', color: '#777', textTransform: 'uppercase' },
    actionRow: { display: 'flex', gap: '12px' },
    actionBtn: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #DDD', background: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }
};

export default ConstructorProjectsPage;
