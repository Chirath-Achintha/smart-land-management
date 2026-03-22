import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const ALL_DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle',
    'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
    'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
    'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
    'Trincomalee', 'Vavuniya',
];

const AdminConstructorTeamsPage = () => {
    const token = localStorage.getItem('access_token');
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Create Form
    const [creatingTeam, setCreatingTeam] = useState(false);
    const [teamForm, setTeamForm] = useState({
        team_name: '', manager_name: '', district: '', specialization: 'Both',
        phone: '', email: '', password: '',
    });

    // Edit Modal
    const [editingTeam, setEditingTeam] = useState(null);
    const [updating, setUpdating] = useState(false);

    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/admin/constructor-teams/`, { headers: authH });
            const data = await res.json();
            if (res.ok) setTeams(Array.isArray(data) ? data : []);
        } catch {
            toast.error('Failed to load constructor teams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTeams(); }, []);

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setCreatingTeam(true);
        try {
            const payload = { ...teamForm, state: 'N/A', address: teamForm.district };
            const res = await fetch(`${API}/admin/constructor-teams/`, {
                method: 'POST',
                headers: authH,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to create team');

            toast.success('Team registered successfully!');
            setTeamForm({ team_name: '', manager_name: '', district: '', specialization: 'Both', phone: '', email: '', password: '' });
            fetchTeams();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setCreatingTeam(false);
        }
    };

    const handleUpdateTeam = async (e) => {
        e.preventDefault();
        if (!editingTeam) return;
        setUpdating(true);
        try {
            const payload = {
                team_name: editingTeam.team_name,
                manager_name: editingTeam.manager_name,
                district: editingTeam.district,
                specialization: editingTeam.specialization,
                phone: editingTeam.phone,
            };
            const res = await fetch(`${API}/admin/constructor-teams/${editingTeam.id}`, {
                method: 'PUT',
                headers: authH,
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to update team');

            toast.success('Team details updated!');
            setTeams(prev => prev.map(t => t.id === editingTeam.id ? data : t));
            setEditingTeam(null);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdating(false);
        }
    };

    const toggleStatus = async (team) => {
        if (!window.confirm(`Are you sure you want to ${team.is_active ? 'SUSPEND' : 'ACTIVATE'} ${team.team_name}?`)) return;
        
        try {
            const res = await fetch(`${API}/admin/constructor-teams/${team.id}`, {
                method: 'PUT',
                headers: authH,
                body: JSON.stringify({ is_active: !team.is_active }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to toggle status');

            toast.success(`Team ${team.is_active ? 'suspended' : 'activated'}!`);
            setTeams(prev => prev.map(t => t.id === team.id ? data : t));
        } catch (err) {
            toast.error(err.message);
        }
    };

    return (
        <div style={S.root}>
            <header style={S.header}>
                <h2 style={S.title}>Constructor Teams</h2>
                <p style={S.subtitle}>Register and manage constructor agencies in the platform.</p>
            </header>

            <div style={S.card}>
                <h3 style={S.sectionTitle}>Register New Constructor Team</h3>
                <form style={S.formGrid} onSubmit={handleCreateTeam}>
                    <input style={S.input} placeholder="Agency / Team Name" value={teamForm.team_name} onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })} required />
                    <input style={S.input} placeholder="Manager Name" value={teamForm.manager_name} onChange={(e) => setTeamForm({ ...teamForm, manager_name: e.target.value })} required />
                    <select style={S.input} value={teamForm.district} onChange={(e) => setTeamForm({ ...teamForm, district: e.target.value })} required>
                        <option value="">Select Region/District</option>
                        {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <select style={S.input} value={teamForm.specialization} onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })} required>
                        <option value="Both">Both</option>
                        <option value="Full Construction">Full Construction</option>
                        <option value="Land Development">Land Development</option>
                    </select>
                    <input style={S.input} placeholder="Contact Phone" value={teamForm.phone} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} />
                    <input style={S.input} type="email" placeholder="Login Email" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} required />
                    <input style={S.input} type="password" placeholder="Login Password" value={teamForm.password} onChange={(e) => setTeamForm({ ...teamForm, password: e.target.value })} required />
                    <button style={S.primaryBtn} disabled={creatingTeam} type="submit">
                        {creatingTeam ? 'Creating...' : '+ Register Team & Create Login'}
                    </button>
                </form>
            </div>

            <div style={S.card}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
                    <h3 style={S.sectionTitle}>Registered Teams Directory</h3>
                    <button style={S.refreshBtn} onClick={fetchTeams}>Refresh</button>
                </div>

                {loading ? (
                    <div style={S.empty}>Loading directory...</div>
                ) : teams.length === 0 ? (
                    <div style={S.empty}>No constructor teams found.</div>
                ) : (
                    <div style={{overflowX: 'auto'}}>
                        <table style={S.table}>
                            <thead>
                                <tr style={S.thRow}>
                                    <th style={S.th}>Agency Name</th>
                                    <th style={S.th}>Manager</th>
                                    <th style={S.th}>Region & Service</th>
                                    <th style={S.th}>Contact</th>
                                    <th style={S.th}>Status</th>
                                    <th style={S.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teams.map(t => (
                                    <tr key={t.id} style={S.tr}>
                                        <td style={S.td}><div style={{fontWeight: 700}}>{t.team_name}</div></td>
                                        <td style={S.td}>{t.manager_name}</td>
                                        <td style={S.td}>
                                            <div>{t.district}</div>
                                            <div style={{fontSize: '0.8rem', color: '#6B7280'}}>{t.specialization}</div>
                                        </td>
                                        <td style={S.td}>
                                            <div>{t.phone || 'No phone'}</div>
                                            <div style={{fontSize: '0.8rem', color: '#6B7280'}}>{t.email}</div>
                                        </td>
                                        <td style={S.td}>
                                            {t.is_active ? 
                                                <span style={S.badgeActive}>Active</span> : 
                                                <span style={S.badgeSuspended}>Suspended</span>
                                            }
                                        </td>
                                        <td style={S.td}>
                                            <div style={{display: 'flex', gap: '8px'}}>
                                                <button style={S.editBtn} onClick={() => setEditingTeam(t)}>Edit Details</button>
                                                <button style={t.is_active ? S.suspendBtn : S.activateBtn} onClick={() => toggleStatus(t)}>
                                                    {t.is_active ? 'Suspend' : 'Reactivate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingTeam && (
                <div style={S.overlay}>
                    <div style={S.modal}>
                        <div style={S.modalHead}>
                            <h3 style={S.modalTitle}>Edit Constructor Details</h3>
                            <button style={S.closeBtn} onClick={() => setEditingTeam(null)}>✕</button>
                        </div>
                        <form onSubmit={handleUpdateTeam} style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
                            <div>
                                <label style={S.label}>Agency Name</label>
                                <input style={S.inputFull} value={editingTeam.team_name} onChange={e => setEditingTeam({...editingTeam, team_name: e.target.value})} required/>
                            </div>
                            <div>
                                <label style={S.label}>Manager Name</label>
                                <input style={S.inputFull} value={editingTeam.manager_name} onChange={e => setEditingTeam({...editingTeam, manager_name: e.target.value})} required/>
                            </div>
                            <div style={{display: 'flex', gap: '16px'}}>
                                <div style={{flex: 1}}>
                                    <label style={S.label}>District</label>
                                    <select style={S.inputFull} value={editingTeam.district} onChange={e => setEditingTeam({...editingTeam, district: e.target.value})} required>
                                        {ALL_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div style={{flex: 1}}>
                                    <label style={S.label}>Specialization</label>
                                    <select style={S.inputFull} value={editingTeam.specialization} onChange={e => setEditingTeam({...editingTeam, specialization: e.target.value})} required>
                                        <option value="Both">Both</option>
                                        <option value="Full Construction">Full Construction</option>
                                        <option value="Land Development">Land Development</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={S.label}>Phone</label>
                                <input style={S.inputFull} value={editingTeam.phone || ''} onChange={e => setEditingTeam({...editingTeam, phone: e.target.value})}/>
                            </div>
                            <div style={{display: 'flex', gap: '12px', marginTop: '10px'}}>
                                <button type="button" style={{...S.primaryBtn, background: '#F3F4F6', color: '#111827', flex: 1}} onClick={() => setEditingTeam(null)}>Cancel</button>
                                <button type="submit" style={{...S.primaryBtn, flex: 2}} disabled={updating}>{updating ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { padding: '32px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '24px' },
    title: { margin: 0, fontSize: '1.8rem', color: '#1A1A1A', fontWeight: 800 },
    subtitle: { marginTop: '6px', color: '#6B7280', fontSize: '0.95rem' },
    card: { background: '#fff', borderRadius: '16px', border: '1px solid #E5E7EB', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
    sectionTitle: { margin: '0 0 16px', fontSize: '1.1rem', color: '#111827', fontWeight: 800 },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
    input: { border: '1px solid #D1D5DB', borderRadius: '10px', padding: '10px 14px', fontSize: '0.9rem', outline: 'none' },
    inputFull: { width: '100%', border: '1px solid #D1D5DB', borderRadius: '10px', padding: '10px 14px', fontSize: '0.9rem', outline: 'none', marginTop: '4px', boxSizing: 'border-box' },
    label: { fontSize: '0.8rem', fontWeight: 700, color: '#374151' },
    primaryBtn: { border: 'none', background: '#111827', color: '#fff', borderRadius: '10px', padding: '12px 16px', cursor: 'pointer', fontWeight: 700, transition: 'opacity 0.2s' },
    refreshBtn: { border: '1px solid #D1D5DB', background: '#fff', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' },
    th: { textAlign: 'left', color: '#6B7280', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', padding: '14px 16px' },
    tr: { borderBottom: '1px solid #F3F4F6' },
    td: { padding: '16px', fontSize: '0.9rem', color: '#111827', verticalAlign: 'middle' },
    badgeActive: { background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 },
    badgeSuspended: { background: '#FEE2E2', color: '#991B1B', padding: '4px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700 },
    editBtn: { background: '#F3F4F6', color: '#374151', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' },
    suspendBtn: { background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' },
    activateBtn: { background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '6px 12px', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' },
    empty: { textAlign: 'center', color: '#9CA3AF', padding: '40px', background: '#F9FAFB', borderRadius: '12px', border: '1px dashed #E5E7EB' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { width: '100%', maxWidth: '500px', background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
    modalTitle: { margin: 0, fontSize: '1.3rem', color: '#111827', fontWeight: 800 },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#9CA3AF' }
};

export default AdminConstructorTeamsPage;
