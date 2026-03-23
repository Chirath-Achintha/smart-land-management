import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const StatusIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v10" />
        <path d="M18.4 5.6A9 9 0 1 1 5.6 5.6" />
    </svg>
);

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

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
                    roleKey: u.role,
                    role: u.role.charAt(0).toUpperCase() + u.role.slice(1).replace('_', ' '),
                    status: u.is_active === false ? 'Suspended' : 'Active',
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
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.role || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.roleKey === roleFilter;
        return matchesSearch && matchesRole;
    });

    const roleCounts = {
        buyer: users.filter(u => u.roleKey === 'buyer').length,
        seller: users.filter(u => u.roleKey === 'seller').length,
        agent: users.filter(u => u.roleKey === 'agent').length,
        constructor_manager: users.filter(u => u.roleKey === 'constructor_manager').length,
    };

    const handleToggleStatus = (user) => {
        const isCurrentlyActive = user.status === 'Active';
        const actionLabel = isCurrentlyActive ? 'deactivate' : 'activate';
        if (!window.confirm(`Are you sure you want to ${actionLabel} this user account?`)) {
            return;
        }

        const token = localStorage.getItem('access_token');
        fetch(`${API}/admin/users/${user.id}/status`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: !isCurrentlyActive })
        })
            .then(async (r) => {
                if (!r.ok) {
                    const err = await r.json().catch(() => ({}));
                    throw new Error(err.detail || 'Failed to update user status');
                }
                return r.json();
            })
            .then((updated) => {
                setUsers(prev => prev.map(u =>
                    u.id === updated.id
                        ? {
                            ...u,
                            status: updated.is_active === false ? 'Suspended' : 'Active'
                        }
                        : u
                ));

                if (updated.is_active === false) {
                    alert('User has been deactivated successfully.');
                } else {
                    alert('User has been activated successfully.');
                }
            })
            .catch((e) => {
                alert(e.message || 'Failed to update user status');
            });
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

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.titleArea}>
                    <h2 style={styles.title}>User Management</h2>
                    <p style={styles.subtitle}>View, deactivate, and manage all registered users and their system roles.</p>
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

            <div style={styles.filterRow}>
                <button
                    type="button"
                    onClick={() => setRoleFilter('all')}
                    style={{ ...styles.filterBtn, ...(roleFilter === 'all' ? styles.filterBtnActive : {}) }}
                >
                    All Users ({users.length})
                </button>
                <button
                    type="button"
                    onClick={() => setRoleFilter('buyer')}
                    style={{ ...styles.filterBtn, ...(roleFilter === 'buyer' ? styles.filterBtnActive : {}) }}
                >
                    Buyers ({roleCounts.buyer})
                </button>
                <button
                    type="button"
                    onClick={() => setRoleFilter('seller')}
                    style={{ ...styles.filterBtn, ...(roleFilter === 'seller' ? styles.filterBtnActive : {}) }}
                >
                    Sellers ({roleCounts.seller})
                </button>
                <button
                    type="button"
                    onClick={() => setRoleFilter('agent')}
                    style={{ ...styles.filterBtn, ...(roleFilter === 'agent' ? styles.filterBtnActive : {}) }}
                >
                    Agents ({roleCounts.agent})
                </button>
                <button
                    type="button"
                    onClick={() => setRoleFilter('constructor_manager')}
                    style={{ ...styles.filterBtn, ...(roleFilter === 'constructor_manager' ? styles.filterBtnActive : {}) }}
                >
                    Construction Teams ({roleCounts.constructor_manager})
                </button>
            </div>

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
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            style={{
                                                ...styles.iconBtn,
                                                color: user.status === 'Active' ? '#DC2626' : '#059669',
                                                border: `1px solid ${user.status === 'Active' ? '#FECACA' : '#BBF7D0'}`,
                                                backgroundColor: user.status === 'Active' ? '#FEF2F2' : '#F0FDF4',
                                                gap: '6px',
                                                padding: '6px 10px'
                                            }}
                                            title={user.status === 'Active' ? 'Deactivate User' : 'Activate User'}
                                        >
                                            <StatusIcon />
                                            <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                                {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                                            </span>
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} style={styles.iconBtn} title="Delete User"><TrashIcon /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div style={styles.noResults}>No users found for the selected filters.</div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '32px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', gap: '20px', flexWrap: 'wrap' },
    titleArea: { flex: 1 },
    title: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#666', fontSize: '0.95rem' },
    filterRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' },
    filterBtn: {
        border: '1px solid #E5E7EB',
        backgroundColor: '#fff',
        color: '#4B5563',
        padding: '8px 12px',
        borderRadius: '999px',
        fontSize: '0.82rem',
        fontWeight: 700,
        cursor: 'pointer'
    },
    filterBtnActive: {
        backgroundColor: '#1A1A1A',
        color: '#fff',
        borderColor: '#1A1A1A'
    },
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
    noResults: { padding: '40px', textAlign: 'center', color: '#666', borderTop: '1px solid #f9fafb' }
};

export default UserManagement;
