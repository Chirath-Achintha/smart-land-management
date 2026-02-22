import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = ({ role }) => {
    const getLinks = () => {
        switch (role) {
            case 'buyer':
                return [
                    { to: '/dashboard', label: 'Buyer Dashboard' },
                    { to: '/dashboard/properties', label: 'Saved Properties' }
                ];
            case 'seller':
                return [
                    { to: '/dashboard', label: 'Seller Dashboard' },
                    { to: '/dashboard/listings', label: 'My Listings' }
                ];
            case 'agent':
                return [
                    { to: '/dashboard', label: 'Agent Dashboard' },
                    { to: '/dashboard/clients', label: 'My Clients' }
                ];
            case 'admin':
                return [
                    { to: '/dashboard', label: 'Admin Dashboard' },
                    { to: '/dashboard/users', label: 'Manage Users' }
                ];
            default:
                return [
                    { to: '/dashboard', label: 'Dashboard' }
                ];
        }
    };

    return (
        <aside style={styles.sidebar}>
            <h3 style={styles.title}>Menu</h3>
            <ul style={styles.list}>
                {getLinks().map((link, idx) => (
                    <li key={idx} style={styles.listItem}>
                        <Link to={link.to} style={styles.link}>{link.label}</Link>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

const styles = {
    sidebar: { width: '250px', backgroundColor: '#f4f4f4', padding: '20px', minHeight: 'calc(100vh - 60px)', borderRight: '1px solid #ddd', boxSizing: 'border-box' },
    title: { marginTop: 0, marginBottom: '20px', color: '#444' },
    list: { listStyle: 'none', padding: 0 },
    listItem: { marginBottom: '10px' },
    link: { textDecoration: 'none', color: '#333', display: 'block', padding: '10px', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid #ddd' }
};

export default Sidebar;
