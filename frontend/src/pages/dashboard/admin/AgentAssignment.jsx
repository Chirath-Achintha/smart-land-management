import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const MailIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', opacity: 0.7 }}>
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
);

const MapPinIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', opacity: 0.7 }}>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
);

const PhoneIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', verticalAlign: 'middle', opacity: 0.7 }}>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

const EditIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const AgentAssignment = () => {
    // Sri Lanka District & Village Data
    const DISTRICT_MAP = {
        'Colombo': ['Colombo 01-15', 'Dehiwala', 'Mount Lavinia', 'Moratuwa', 'Kotte', 'Kaduwela', 'Maharagama', 'Kesbewa', 'Piliyandala', 'Homagama', 'Hanwella', 'Avissawella'],
        'Gampaha': ['Negombo', 'Gampaha', 'Veyangoda', 'Kirillawala', 'Kadawatha', 'Kiribathgoda', 'Ragama', 'Wattala', 'Ja-Ela', 'Kandana', 'Kelaniya', 'Minuwangoda'],
        'Kalutara': ['Kalutara', 'Beruwala', 'Panadura', 'Horana', 'Matugama', 'Bandaragama', 'Aluthgama'],
        'Kandy': ['Kandy', 'Gampola', 'Nawalapitiya', 'Wattegama', 'Harispattuwa', 'Kadugannawa', 'Peradeniya', 'Digana', 'Kundasale'],
        'Matale': ['Matale', 'Dambulla', 'Sigiriya', 'Galewela', 'Ukuwela'],
        'Nuwara Eliya': ['Nuwara Eliya', 'Hatton', 'Talawakele', 'Walapane', 'Hanguranketha'],
        'Galle': ['Galle', 'Hikkaduwa', 'Ambalangoda', 'Baddegama', 'Karapitiya', 'Bentota', 'Unawatuna'],
        'Matara': ['Matara', 'Weligama', 'Hakmana', 'Dikwella', 'Deniyaya', 'Kamburupitiya'],
        'Hambantota': ['Hambantota', 'Tangalle', 'Beliatta', 'Ambalantota', 'Tissamaharama'],
        'Jaffna': ['Jaffna', 'Chavakachcheri', 'Point Pedro', 'Kopay', 'Tellippalai'],
        'Kurunegala': ['Kurunegala', 'Kuliyapitiya', 'Narammala', 'Wariyapola', 'Pannala', 'Maho'],
        'Anuradhapura': ['Anuradhapura', 'Eppawala', 'Kekirawa', 'Medawachchiya', 'Thambuttegama'],
        'Badulla': ['Badulla', 'Bandarawela', 'Haputale', 'Diyatalawa', 'Welimada', 'Mahiyanganaya'],
        'Ratnapura': ['Ratnapura', 'Balangoda', 'Eheliyagoda', 'Kuruwita', 'Pelmadulla'],
        'Kegalle': ['Kegalle', 'Mawanella', 'Warakapola', 'Ruwanwella', 'Deraniyagala']
    };

    // Requests Data
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('access_token');
    const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Agents Data
    const [agentsList, setAgentsList] = useState([]);
    const [animatedAgents, setAnimatedAgents] = useState({});

    const fetchAgents = () => {
        setLoading(true);
        fetch(`${API}/admin/agents`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                const formattedAgents = data.map(a => ({
                    id: a.id || a._id,
                    name: a.name || a.full_name || 'N/A',
                    email: a.email,
                    phone: a.phone || 'N/A',
                    status: 'Active',
                    livingArea: a.Address || a.address || 'Not Specified',
                    nic: a.nic || a.nic_number || 'N/A'
                }));
                setAgentsList(formattedAgents);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAgents();
        // Keep requests as mock for now or fetch if needed
        const storedReqs = localStorage.getItem('all_agent_requests');
        if (storedReqs) setRequests(JSON.parse(storedReqs));
    }, []);

    useEffect(() => {
        const timers = agentsList.map((agent, idx) =>
            setTimeout(() => {
                setAnimatedAgents((prev) => ({ ...prev, [agent.id]: true }));
            }, idx * 55)
        );

        return () => timers.forEach(clearTimeout);
    }, [agentsList]);

    // Form states
    const [isEditingAgent, setIsEditingAgent] = useState(false);
    const [currentAgent, setCurrentAgent] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        district: '',
        village: '',
        nic: '',
        status: 'Active'
    });
    const [formErrors, setFormErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(?:\+94|0)[1-9][0-9]{8}$/;
        const nicRegex = /^(?:[0-9]{9}[vVxX]|[0-9]{12})$/;

        if (!currentAgent.name.trim()) errors.name = 'Full name is required';
        if (!emailRegex.test(currentAgent.email)) errors.email = 'Invalid email address';
        if (!isEditingAgent && (!currentAgent.password || currentAgent.password.length < 6)) {
            errors.password = 'Password must be at least 6 characters';
        }
        if (!currentAgent.district) errors.district = 'District is required';
        if (!currentAgent.village) errors.village = 'Village/Area is required';
        if (!nicRegex.test(currentAgent.nic)) errors.nic = 'Invalid NIC (e.g., 123456789V or 12-digit)';
        if (!phoneRegex.test(currentAgent.phone)) errors.phone = 'Invalid SL phone number (e.g., 0771234567)';

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAssign = (requestId, agentId) => {
        const assignedAgentObj = agentsList.find(a => a.id === agentId);

        const updated = requests.map(req => {
            if (req.id === requestId) {
                const updatedReq = { ...req, assignedAgent: assignedAgentObj.name, assignedAgentId: agentId, status: 'Assigned' };

                // Update specific agent's dashboard queue
                const agentQueueRaw = localStorage.getItem(`agent_bookings_${agentId}`);
                const agentQueue = agentQueueRaw ? JSON.parse(agentQueueRaw) : [];

                // convert req format to agent booking format
                const agentBooking = {
                    id: updatedReq.id,
                    landId: updatedReq.landId || 'N/A',
                    buyer: updatedReq.buyer,
                    land: updatedReq.property,
                    location: updatedReq.location || 'N/A',
                    seller: updatedReq.seller || 'N/A',
                    date: updatedReq.date || 'TBD',
                    time: updatedReq.time || 'TBD',
                    status: 'Assigned'
                };

                // add to agent's queue if not already there
                if (!agentQueue.find(b => b.id === agentBooking.id)) {
                    localStorage.setItem(`agent_bookings_${agentId}`, JSON.stringify([agentBooking, ...agentQueue]));
                }

                return updatedReq;
            }
            return req;
        });

        setRequests(updated);
        localStorage.setItem('all_agent_requests', JSON.stringify(updated));
    };

    // Agent CRUD
    const handleSaveAgent = (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const address = `${currentAgent.village}, ${currentAgent.district}`;

        if (isEditingAgent) {
            fetch(`${API}/admin/agents/${currentAgent.id}`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    name: currentAgent.name,
                    email: currentAgent.email,
                    password: currentAgent.password, // Optional
                    nic: currentAgent.nic,
                    phone: currentAgent.phone,
                    address: address
                })
            })
                .then(r => {
                    if (r.ok) {
                        alert('Agent updated successfully!');
                        fetchAgents();
                        setIsEditingAgent(false);
                        setCurrentAgent({ id: '', name: '', email: '', password: '', phone: '', district: '', village: '', nic: '', status: 'Active' });
                    } else {
                        return r.json().then(err => {
                            const msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                            throw new Error(msg || 'Update failed');
                        });
                    }
                })
                .catch(err => {
                    console.error('Update Error:', err);
                    alert(`Failed to update agent: ${err.message}`);
                });
        } else {
            fetch(`${API}/admin/agents`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    name: currentAgent.name,
                    email: currentAgent.email,
                    password: currentAgent.password,
                    nic: currentAgent.nic,
                    phone: currentAgent.phone,
                    address: address
                })
            })
                .then(r => {
                    if (r.ok) {
                        alert('Agent registered successfully!');
                        fetchAgents();
                        setCurrentAgent({ id: '', name: '', email: '', password: '', phone: '', district: '', village: '', nic: '', status: 'Active' });
                    } else {
                        return r.json().then(err => { throw new Error(err.detail || 'Registration failed'); });
                    }
                })
                .catch(err => alert(err.message));
        }
    };

    const handleEditAgent = (agent) => {
        setIsEditingAgent(true);
        setFormErrors({});
        const [village, district] = (agent.livingArea || '').split(', ');
        setCurrentAgent({ ...agent, village: village || '', district: district || '', password: '' });
    };

    const handleDeleteAgent = (id) => {
        if (window.confirm('Delete this agent permanently from the system?')) {
            fetch(`${API}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => {
                    if (r.ok) {
                        setAgentsList(agentsList.filter(a => a.id !== id));
                        alert('Agent deleted.');
                    } else {
                        alert('Failed to delete agent');
                    }
                })
                .catch(console.error);
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
                                style={{ ...styles.input, borderColor: formErrors.name ? '#e74c3c' : '#e5e7eb' }}
                                value={currentAgent.name}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCurrentAgent({ ...currentAgent, name: val });
                                    setFormErrors(prev => ({ ...prev, name: val.trim() ? null : 'Full name is required' }));
                                }}
                                required
                            />
                            {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email (Login)</label>
                                <input
                                    type="email"
                                    style={{ ...styles.input, borderColor: formErrors.email ? '#e74c3c' : '#e5e7eb' }}
                                    value={currentAgent.email}
                                    autoComplete="off"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                        setCurrentAgent({ ...currentAgent, email: val });
                                        setFormErrors(prev => ({ ...prev, email: emailRegex.test(val) ? null : 'Invalid email address' }));
                                    }}
                                    required
                                />
                                {formErrors.email && <span style={styles.errorText}>{formErrors.email}</span>}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Password</label>
                                <input
                                    type="password"
                                    style={{ ...styles.input, borderColor: formErrors.password ? '#e74c3c' : '#e5e7eb' }}
                                    placeholder={isEditingAgent ? "Leave blank to keep" : "Enter password"}
                                    value={currentAgent.password}
                                    autoComplete="new-password"
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setCurrentAgent({ ...currentAgent, password: val });
                                        if (!isEditingAgent) {
                                            setFormErrors(prev => ({ ...prev, password: val.length >= 6 ? null : 'Password must be at least 6 characters' }));
                                        } else {
                                            setFormErrors(prev => ({ ...prev, password: null }));
                                        }
                                    }}
                                    required={!isEditingAgent}
                                />
                                {formErrors.password && <span style={styles.errorText}>{formErrors.password}</span>}
                            </div>
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>District</label>
                                <input
                                    list="district-list"
                                    style={{ ...styles.input, borderColor: formErrors.district ? '#e74c3c' : '#e5e7eb' }}
                                    value={currentAgent.district}
                                    placeholder="Select or type district"
                                    onChange={(e) => {
                                        setCurrentAgent({ ...currentAgent, district: e.target.value, village: '' });
                                        if (formErrors.district) setFormErrors({ ...formErrors, district: null });
                                    }}
                                    required
                                />
                                <datalist id="district-list">
                                    {Object.keys(DISTRICT_MAP).map(dist => (
                                        <option key={dist} value={dist} />
                                    ))}
                                </datalist>
                                {formErrors.district && <span style={styles.errorText}>{formErrors.district}</span>}
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Village / Area</label>
                                <input
                                    list="village-list"
                                    style={{ ...styles.input, borderColor: formErrors.village ? '#e74c3c' : '#e5e7eb' }}
                                    value={currentAgent.village}
                                    placeholder="Select or type area"
                                    onChange={(e) => {
                                        setCurrentAgent({ ...currentAgent, village: e.target.value });
                                        if (formErrors.village) setFormErrors({ ...formErrors, village: null });
                                    }}
                                    required
                                />
                                <datalist id="village-list">
                                    {currentAgent.district && DISTRICT_MAP[currentAgent.district]?.map(vill => (
                                        <option key={vill} value={vill} />
                                    ))}
                                </datalist>
                                {formErrors.village && <span style={styles.errorText}>{formErrors.village}</span>}
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>NIC Number</label>
                            <input
                                style={{ ...styles.input, borderColor: formErrors.nic ? '#e74c3c' : '#e5e7eb' }}
                                value={currentAgent.nic}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const nicRegex = /^(?:[0-9]{9}[vVxX]|[0-9]{12})$/;
                                    setCurrentAgent({ ...currentAgent, nic: val });
                                    setFormErrors(prev => ({ ...prev, nic: nicRegex.test(val) ? null : 'Invalid NIC (e.g., 123456789V or 12-digit)' }));
                                }}
                                required
                            />
                            {formErrors.nic && <span style={styles.errorText}>{formErrors.nic}</span>}
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Phone Number</label>
                            <input
                                style={{ ...styles.input, borderColor: formErrors.phone ? '#e74c3c' : '#e5e7eb' }}
                                value={currentAgent.phone}
                                placeholder="Enter phone number"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const phoneRegex = /^(?:\+94|0)[1-9][0-9]{8}$/;
                                    setCurrentAgent({ ...currentAgent, phone: val });
                                    setFormErrors(prev => ({ ...prev, phone: phoneRegex.test(val) ? null : 'Invalid phone number (e.g., 0771234567)' }));
                                }}
                                required
                            />
                            {formErrors.phone && <span style={styles.errorText}>{formErrors.phone}</span>}
                        </div>
                        <button type="submit" style={styles.submitBtn}>
                            {isEditingAgent ? 'Update Agent' : 'Register Agent'}
                        </button>
                        {isEditingAgent && (
                            <button
                                type="button"
                                style={styles.cancelBtnSmall}
                                onClick={() => {
                                    setIsEditingAgent(false);
                                    setFormErrors({});
                                    setCurrentAgent({ id: '', name: '', email: '', password: '', phone: '', district: '', village: '', nic: '', status: 'Active' });
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </form>
                </div>

                {/* Right Side: Agents List */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>System Agents</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Agent Name</th>
                                    <th style={styles.th}>Contact Info</th>
                                    <th style={styles.th}>Location & ID</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentsList.map((agent) => (
                                    <tr
                                        key={agent.id}
                                        style={{
                                            ...styles.tr,
                                            opacity: animatedAgents[agent.id] ? 1 : 0,
                                            transform: animatedAgents[agent.id] ? 'translateY(0)' : 'translateY(10px)',
                                            transition: 'opacity 0.3s ease, transform 0.3s ease'
                                        }}
                                    >
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '700', fontSize: '1rem' }}>{agent.name}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}><MailIcon />{agent.email}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '4px' }}><PhoneIcon />{agent.phone}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.85rem', color: '#444' }}>
                                                <div><MapPinIcon />{agent.livingArea}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888', marginLeft: '20px' }}>NIC: {agent.nic}</div>
                                            </div>
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.statusTag,
                                                backgroundColor: agent.status === 'Active' ? 'rgba(59, 130, 86, 0.14)' : '#fdecea',
                                                color: agent.status === 'Active' ? '#166534' : '#b91c1c'
                                            }}>
                                                {agent.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={styles.itemActions}>
                                                <button onClick={() => handleEditAgent(agent)} style={styles.iconBtn} title="Edit Agent"><EditIcon /></button>
                                                <button onClick={() => handleDeleteAgent(agent.id)} style={styles.iconBtn} title="Delete Agent"><TrashIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {agentsList.length === 0 && (
                                    <tr>
                                        <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#999', padding: '40px' }}>
                                            No agents registered in the system.
                                        </td>
                                    </tr>
                                )}
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
    title: { fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-muted)', fontSize: '0.95rem' },
    grid: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '14px', border: '1px solid var(--color-accent)', padding: '24px', boxShadow: '0 14px 28px rgba(26,26,26,0.06)', animation: 'slideInUp 0.45s ease' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: 'var(--color-dark)' },
    formArea: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formRow: { display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 },
    label: { fontSize: '0.8rem', fontWeight: '700', color: '#444' },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid var(--color-accent)',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        backgroundColor: '#fff',
        boxSizing: 'border-box',
        fontFamily: 'inherit'
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontWeight: '700',
        marginTop: '8px',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
    },
    agentList: { display: 'flex', flexDirection: 'column', gap: '12px' },
    agentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#F9FAFB', borderRadius: '8px' },
    agentName: { fontSize: '0.9rem', fontWeight: '700', display: 'block' },
    itemActions: { display: 'flex', gap: '8px' },
    iconBtn: { background: '#ECFDF5', border: '1px solid #86EFAC', cursor: 'pointer', fontSize: '1rem', color: '#166534', borderRadius: '8px', padding: '8px', transition: 'all 0.2s ease' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    thRow: { borderBottom: '1px solid var(--color-accent)' },
    th: { padding: '12px 16px', fontSize: '0.8rem', color: '#777', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1eee8' },
    td: { padding: '16px', fontSize: '0.9rem', color: '#333' },
    statusTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '0.85rem', color: '#333', cursor: 'pointer', outline: 'none' },
    cancelBtnSmall: { padding: '10px', backgroundColor: '#ECFDF5', color: '#166534', border: '1px solid #86EFAC', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' },
    errorText: { color: '#e74c3c', fontSize: '0.75rem', fontWeight: '700', marginTop: '4px' }
};

export default AgentAssignment;
