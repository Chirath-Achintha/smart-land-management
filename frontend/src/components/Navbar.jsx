import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ role }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/" style={styles.link}>Smart Land</Link>
      </div>
      <div>
        <span style={styles.roleText}>Role: {role}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: 'rgba(245, 247, 246, 0.95)', color: 'var(--color-dark)', alignItems: 'center', height: '60px', boxSizing: 'border-box', position: 'sticky', top: 0, boxShadow: '0 8px 18px rgba(38, 50, 56, 0.08)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--color-border)' },
  logo: { fontSize: '20px', fontWeight: 'bold' },
  link: { color: 'var(--color-dark)', textDecoration: 'none' },
  roleText: { marginRight: '15px', textTransform: 'capitalize' },
  logoutBtn: { padding: '8px 15px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.3s ease' }
};

export default Navbar;
