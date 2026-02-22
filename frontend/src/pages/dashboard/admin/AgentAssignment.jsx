import React, { useState } from 'react';

const AgentAssignment = () => {
    const [requests, setRequests] = useState([
        { id: 'REQ001', buyer: 'John Doe', property: 'Green Valley Lot 4', status: 'Pending', assignedAgent: null },
        { id: 'REQ002', buyer: 'Jane Smith', property: 'Ocean View Villa', status: 'Assigned', assignedAgent: 'Agent Mike' },
        { id: 'REQ003', buyer: 'Robert Brown', property: 'Mountain Retreet', status: 'Pending', assignedAgent: null },
    ]);

    const agents = ['Agent Mike', 'Agent Sarah', 'Agent David', 'Agent Elena'];

    const handleAssign = (requestId, agentName) => {
        setRequests(requests.map(req =>
            req.id === requestId
                ? { ...req, assignedAgent: agentName, status: 'Assigned' }
                : req
        ));
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Agent Assignment</h2>
                <p style={styles.subtitle}>Assign property requests to field agents for site visits and inquiries.</p>
            </header>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thRow}>
                            <th style={styles.th}>Request ID</th>
                            <th style={styles.th}>Buyer</th>
                            <th style={styles.th}>Property</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Assigned Agent</th>
                            <th style={styles.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req.id} style={styles.tr}>
                                <td style={styles.td}>{req.id}</td>
                                <td style={styles.td}>{req.buyer}</td>
                                <td style={styles.td}>{req.property}</td>
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.status,
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
                                        <option value="" disabled>Select Agent</option>
                                        {agents.map(agent => (
                                            <option key={agent} value={agent}>{agent}</option>
                                        ))}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { marginBottom: '32px' },
    title: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '0.95rem' },
    tableCard: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ede8e1', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    thRow: { backgroundColor: '#F9FAFB', borderBottom: '1px solid #ede8e1' },
    th: { padding: '16px 24px', fontSize: '0.85rem', fontWeight: '700', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em' },
    tr: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '20px 24px', fontSize: '0.9rem', color: '#333' },
    status: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', color: '#333', cursor: 'pointer', outline: 'none' },
};

export default AgentAssignment;
