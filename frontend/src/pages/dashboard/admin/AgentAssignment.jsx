import React, { useState } from 'react';

const AgentAssignment = () => {
    // Requests Data
    const [requests, setRequests] = useState([
        { id: 'REQ001', buyer: 'John Doe', property: 'Green Valley Lot 4', status: 'Pending', assignedAgent: null },
        { id: 'REQ002', buyer: 'Jane Smith', property: 'Ocean View Villa', status: 'Assigned', assignedAgent: 'Agent Mike' },
        { id: 'REQ003', buyer: 'Robert Brown', property: 'Mountain Retreet', status: 'Pending', assignedAgent: null },
    ]);

    // Agents Data
    const [agentsList, setAgentsList] = useState([
        { id: 1, name: 'Agent Mike', email: 'mike@smartland.com', status: 'Active', livingArea: 'Colombo', nic: '958473625V' },
        { id: 2, name: 'Agent Sarah', email: 'sarah@smartland.com', status: 'Active', livingArea: 'Kandy', nic: '928473625V' },
    ]);

    // Form states
    const [isEditingAgent, setIsEditingAgent] = useState(false);
    const [currentAgent, setCurrentAgent] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        livingArea: '',
        nic: '',
        status: 'Active'
    });

    const handleAssign = (requestId, agentName) => {
        setRequests(requests.map(req =>
            req.id === requestId
                ? { ...req, assignedAgent: agentName, status: 'Assigned' }
                : req
        ));
    };

    // Agent CRUD
    const handleSaveAgent = (e) => {
        e.preventDefault();
        if (isEditingAgent) {
            setAgentsList(agentsList.map(a => a.id === currentAgent.id ? currentAgent : a));
            setIsEditingAgent(false);
        } else {
            setAgentsList([...agentsList, { ...currentAgent, id: Date.now() }]);
        }
        setCurrentAgent({ id: '', name: '', email: '', password: '', livingArea: '', nic: '', status: 'Active' });
    };

    const handleEditAgent = (agent) => {
        setIsEditingAgent(true);
        setCurrentAgent({ ...agent, password: '' }); // Don't show old password for security
    };

    const handleDeleteAgent = (id) => {
        if (window.confirm('Delete this agent?')) {
            setAgentsList(agentsList.filter(a => a.id !== id));
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Agent & Request Management</h2>
                <p style={styles.subtitle}>Register new agents with login credentials and assign them to buyer requests.</p>
            </header>

            <div style={styles.grid}>
                {/* Left Side: Agent Management */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>{isEditingAgent ? 'Edit Agent' : 'Add New Agent'}</h3>
                    <form onSubmit={handleSaveAgent} style={styles.formArea}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Full Name</label>
                            <input
                                style={styles.input}
                                value={currentAgent.name}
                                onChange={(e) => setCurrentAgent({ ...currentAgent, name: e.target.value })}
                                required
                            />
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email (Login)</label>
                                <input
                                    type="email"
                                    style={styles.input}
                                    value={currentAgent.email}
                                    autoComplete="off"
                                    onChange={(e) => setCurrentAgent({ ...currentAgent, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Password</label>
                                <input
                                    type="password"
                                    style={styles.input}
                                    placeholder={isEditingAgent ? "Leave blank to keep" : "Enter password"}
                                    value={currentAgent.password}
                                    autoComplete="new-password"
                                    onChange={(e) => setCurrentAgent({ ...currentAgent, password: e.target.value })}
                                    required={!isEditingAgent}
                                />
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>NIC Number</label>
                                <input
                                    style={styles.input}
                                    value={currentAgent.nic}
                                    onChange={(e) => setCurrentAgent({ ...currentAgent, nic: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Living Area</label>
                                <input
                                    style={styles.input}
                                    value={currentAgent.livingArea}
                                    onChange={(e) => setCurrentAgent({ ...currentAgent, livingArea: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" style={styles.submitBtn}>
                            {isEditingAgent ? 'Update Agent' : 'Register Agent'}
                        </button>
                        {isEditingAgent && (
                            <button
                                type="button"
                                style={styles.cancelBtnSmall}
                                onClick={() => { setIsEditingAgent(false); setCurrentAgent({ id: '', name: '', email: '', password: '', livingArea: '', nic: '', status: 'Active' }); }}
                            >
                                Cancel
                            </button>
                        )}
                    </form>

                    <h3 style={{ ...styles.cardTitle, marginTop: '32px' }}>System Agents</h3>
                    <div style={styles.agentList}>
                        {agentsList.map(agent => (
                            <div key={agent.id} style={styles.agentItem}>
                                <div style={{ flex: 1 }}>
                                    <span style={styles.agentName}>{agent.name}</span>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                        <div>✉ {agent.email}</div>
                                        <div>📍 {agent.livingArea} • ID: {agent.nic}</div>
                                    </div>
                                </div>
                                <div style={styles.itemActions}>
                                    <button onClick={() => handleEditAgent(agent)} style={styles.iconBtn}>✏️</button>
                                    <button onClick={() => handleDeleteAgent(agent.id)} style={styles.iconBtn}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Requests Assignment */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Assignment Console</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Request</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Assigned Agent</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req) => (
                                    <tr key={req.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.7rem', color: '#bbb' }}>{req.id}</div>
                                            <div style={{ fontWeight: '700' }}>{req.buyer}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{req.property}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusTag,
                                                backgroundColor: req.status === 'Pending' ? '#fff3cd' : '#d4edda',
                                                color: req.status === 'Pending' ? '#856404' : '#155724'
                                            }}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>{req.assignedAgent || 'Unassigned'}</td>
                                        <td style={styles.td}>
                                            <select
                                                style={styles.select}
                                                value={req.assignedAgent || ''}
                                                onChange={(e) => handleAssign(req.id, e.target.value)}
                                            >
                                                <option value="" disabled>Assign To...</option>
                                                {agentsList.map(a => (
                                                    <option key={a.id} value={a.name}>{a.name}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { marginBottom: '32px' },
    title: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '0.95rem' },
    grid: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ede8e1', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: '#1A1A1A' },
    formArea: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formRow: { display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 },
    label: { fontSize: '0.8rem', fontWeight: '700', color: '#444' },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        fontFamily: 'inherit'
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#1A1A1A',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        marginTop: '8px',
        transition: 'background 0.2s',
        boxSizing: 'border-box'
    },
    agentList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    agentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#F9FAFB', borderRadius: '8px' },
    agentName: { fontSize: '0.9rem', fontWeight: '700', display: 'block' },
    itemActions: { display: 'flex', gap: '8px' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    thRow: { borderBottom: '2px solid #f0f0f0' },
    th: { padding: '12px 16px', fontSize: '0.8rem', color: '#777', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '16px', fontSize: '0.9rem', color: '#333' },
    statusTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', color: '#333', cursor: 'pointer', outline: 'none' },
    cancelBtnSmall: { padding: '10px', backgroundColor: '#eee', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
};

export default AgentAssignment;
