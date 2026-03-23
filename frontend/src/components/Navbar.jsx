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
  navbar: { display: 'flex', justifyContent: 'space-between', padding: '15px 20px', backgroundColor: '#333', color: '#fff', alignItems: 'center', height: '60px', boxSizing: 'border-box' },
  logo: { fontSize: '20px', fontWeight: 'bold' },
  link: { color: '#fff', textDecoration: 'none' },
  roleText: { marginRight: '15px', textTransform: 'capitalize' },
  logoutBtn: { padding: '8px 15px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Navbar;
