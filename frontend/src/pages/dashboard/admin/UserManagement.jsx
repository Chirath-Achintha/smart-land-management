import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

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

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch users from DB
    const fetchUsers = () => {
        const token = localStorage.getItem('access_token');
        setLoading(true);
        fetch(`${API}/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const formattedUsers = data.map(u => ({
                    id: u.id,
                    name: u.full_name,
                    email: u.email,
                    role: u.role.charAt(0).toUpperCase() + u.role.slice(1).replace('_', ' '),
                    status: 'Active', // Status field not in model yet, default to Active
                    joined: u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'
                }));
                setUsers(formattedUsers);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Filtering
    const filteredUsers = users.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (user) => {
        setCurrentUser({ ...user });
        setIsEditing(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            const token = localStorage.getItem('access_token');
            fetch(`${API}/admin/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(r => {
                    if (r.ok) {
                        setUsers(users.filter(u => u.id !== id));
                    } else {
                        alert('Failed to delete user');
                    }
                })
                .catch(console.error);
        }
    };


    const handleSave = (e) => {
        e.preventDefault();
        setUsers(users.map(u => u.id === currentUser.id ? currentUser : u));
        setIsEditing(false);
        setCurrentUser(null);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.titleArea}>
                    <h2 style={styles.title}>User Management</h2>
                    <p style={styles.subtitle}>View, edit, and manage all registered users and their system roles.</p>
                </div>
                <div style={styles.searchBar}>
                    <input
                        type="text"
                        placeholder="Search users..."
                        style={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thRow}>
                            <th style={styles.th}>User</th>
                            <th style={styles.th}>Role</th>
                            <th style={styles.th}>Joined Date</th>
                            <th style={styles.th}>Status</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ ...styles.avatar, backgroundColor: user.status === 'Suspended' ? '#9CA3AF' : '#1A1A1A' }}>
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={styles.userName}>{user.name}</div>
                                            <div style={styles.userEmail}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.roleTag,
                                        backgroundColor: user.role === 'Admin' ? '#EEF2FF' : '#F9FAFB',
                                        color: user.role === 'Admin' ? '#4F46E5' : '#4B5563'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={styles.td}>{user.joined}</td>
                                <td style={styles.td}>
                                    <span style={{
                                        ...styles.statusTag,
                                        backgroundColor: user.status === 'Active' ? '#D1FAE5' : '#FEE2E2',
                                        color: user.status === 'Active' ? '#059669' : '#DC2626'
                                    }}>
                                        {user.status}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => handleEdit(user)} style={styles.iconBtn} title="Edit User"><EditIcon /></button>
                                        <button onClick={() => handleDelete(user.id)} style={styles.iconBtn} title="Delete User"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div style={styles.noResults}>
                        No users found matching "{searchTerm}"
                    </div>
                )}
            </div>

            {/* Edit Modal Overlay */}
            {isEditing && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>Edit User Profile</h3>
                        <form onSubmit={handleSave} style={styles.form}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    style={styles.input}
                                    value={currentUser.name}
                                    onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Email Address</label>
                                <input
                                    type="email"
                                    style={styles.input}
                                    value={currentUser.email}
                                    onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Role</label>
                                    <select
                                        style={styles.input}
                                        value={currentUser.role}
                                        onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
                                    >
                                        <option value="Buyer">Buyer</option>
                                        <option value="Seller">Seller</option>
                                        <option value="Agent">Agent</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Status</label>
                                    <select
                                        style={styles.input}
                                        value={currentUser.status}
                                        onChange={(e) => setCurrentUser({ ...currentUser, status: e.target.value })}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>
                            <div style={styles.modalActions}>
                                <button type="button" onClick={() => setIsEditing(false)} style={styles.cancelBtn}>Cancel</button>
                                <button type="submit" style={styles.saveBtn}>Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' },
    titleArea: { flex: 1 },
    title: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '0.95rem' },
    searchBar: { width: '300px' },
    searchInput: { width: '100%', padding: '12px 20px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.08)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', backgroundColor: '#fff', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' },
    tableCard: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    thRow: { backgroundColor: '#ffffff', borderBottom: '1px solid rgba(0,0,0,0.05)' },
    th: { padding: '20px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em' },
    tr: { borderBottom: '1px solid rgba(0,0,0,0.02)', transition: 'background 0.2s' },
    td: { padding: '20px 24px', fontSize: '0.9rem' },

    avatar: { width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '1.1rem' },
    userName: { fontWeight: '700', color: '#1A1A1A' },
    userEmail: { fontSize: '0.8rem', color: '#666' },
    roleTag: { padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' },
    statusTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    statusTag: { padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    actionGroup: { display: 'flex', gap: '8px' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: '#666', transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '6px' },
    noResults: { padding: '40px', textAlign: 'center', color: '#666', borderTop: '1px solid #f9fafb' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.15)' },
    modalTitle: { fontSize: '1.25rem', fontWeight: '800', marginBottom: '24px', color: '#1A1A1A' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formRow: { display: 'flex', gap: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
    label: { fontSize: '0.85rem', fontWeight: '700', color: '#444' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.9rem', outline: 'none' },
    modalActions: { display: 'flex', gap: '12px', marginTop: '12px' },
    cancelBtn: { flex: 1, padding: '14px', backgroundColor: '#F3F4F6', color: '#4B5563', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    saveBtn: { flex: 1, padding: '14px', backgroundColor: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default UserManagement;
