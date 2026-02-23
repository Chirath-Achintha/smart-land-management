import React, { useState, useEffect } from 'react';

const ServiceManagement = () => {
    // Bookings Data
    const [bookings, setBookings] = useState([]);

    useEffect(() => {
        const storedBookings = localStorage.getItem('all_service_bookings');
        if (storedBookings) {
            setBookings(JSON.parse(storedBookings));
        } else {
            const defaultBookings = [
                { id: 'BK001', buyerName: 'Alice Wong', service: 'Construction', land: 'Ocean View Ridge', date: '2026-03-10', provider: 'BuildRight Ltd.', status: 'Scheduled' },
                { id: 'BK002', buyerName: 'Bob Miller', service: 'Land Development', land: 'N/A', date: '2026-03-12', provider: 'Terra-Form Co.', status: 'In Progress' },
            ];
            setBookings(defaultBookings);
            localStorage.setItem('all_service_bookings', JSON.stringify(defaultBookings));
        }
    }, []);

    // Service Crews (Teams) Data
    const [crews, setCrews] = useState([
        {
            id: 1,
            companyName: 'BuildRight Ltd.',
            address: '123 Industrial Way, Colombo 03',
            size: 15,
            location: 'Colombo',
            details: 'ISO Certified, Grade A Construction License',
            email: 'admin@buildright.com',
            phone: '0112345678',
            managerName: 'Ruwan Perera',
            status: 'Available'
        },
        {
            id: 2,
            companyName: 'Terra-Form Co.',
            address: '45 Green Park, Gampaha',
            size: 8,
            location: 'Western Province',
            details: 'Specialize in Land leveling and Drainage',
            email: 'info@terraform.com',
            phone: '0334455667',
            managerName: 'Sunil Dharmadasa',
            status: 'Busy'
        },
    ]);

    const serviceTypes = ['Construction', 'Land Development'];

    // Form states
    const [isEditingCrew, setIsEditingCrew] = useState(false);
    const [currentCrew, setCurrentCrew] = useState({
        id: '',
        companyName: '',
        address: '',
        size: '',
        location: '',
        details: '',
        email: '',
        password: '',
        phone: '',
        managerName: '',
        status: 'Available'
    });

    const handleUpdateBooking = (id, field, value) => {
        const updated = bookings.map(book => {
            if (book.id === id) {
                const newBook = { ...book, [field]: value };
                if (field === 'provider' && value !== 'Pending Assignment' && value !== '') {
                    newBook.status = 'Scheduled'; // or In Progress
                }
                return newBook;
            }
            return book;
        });
        setBookings(updated);
        localStorage.setItem('all_service_bookings', JSON.stringify(updated));
    };

    const handleCancelBooking = (id) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            const updated = bookings.map(book =>
                book.id === id ? { ...book, status: 'Cancelled' } : book
            );
            setBookings(updated);
            localStorage.setItem('all_service_bookings', JSON.stringify(updated));
        }
    };

    // Crew CRUD
    const handleSaveCrew = (e) => {
        e.preventDefault();
        if (isEditingCrew) {
            setCrews(crews.map(c => c.id === currentCrew.id ? currentCrew : c));
            setIsEditingCrew(false);
        } else {
            setCrews([...crews, { ...currentCrew, id: Date.now() }]);
        }
        resetForm();
    };

    const resetForm = () => {
        setCurrentCrew({
            id: '', companyName: '', address: '', size: '', location: '',
            details: '', email: '', password: '', phone: '', managerName: '', status: 'Available'
        });
        setIsEditingCrew(false);
    };

    const handleEditCrew = (crew) => {
        setIsEditingCrew(true);
        setCurrentCrew({ ...crew, password: '' });
    };

    const handleDeleteCrew = (id) => {
        if (window.confirm('Delete this constructor team and all its login credentials?')) {
            setCrews(crews.filter(c => c.id !== id));
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Constructor & Service Management</h2>
                <p style={styles.subtitle}>Register construction teams, manage legal profiles, and handle login accounts.</p>
            </header>

            <div style={styles.grid}>
                {/* Left Side: Elaborate Crew Management */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>{isEditingCrew ? 'Edit Team Details' : 'Register New Team'}</h3>
                    <form onSubmit={handleSaveCrew} style={styles.formArea}>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Company Name</label>
                            <input
                                style={styles.input}
                                value={currentCrew.companyName}
                                onChange={(e) => setCurrentCrew({ ...currentCrew, companyName: e.target.value })}
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Registered Address</label>
                            <textarea
                                style={{ ...styles.input, height: '60px' }}
                                value={currentCrew.address}
                                onChange={(e) => setCurrentCrew({ ...currentCrew, address: e.target.value })}
                                required
                            />
                        </div>
                        <div style={styles.formRow}>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Team Size</label>
                                <input
                                    type="number"
                                    style={styles.input}
                                    value={currentCrew.size}
                                    onChange={(e) => setCurrentCrew({ ...currentCrew, size: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Team Location</label>
                                <input
                                    style={styles.input}
                                    value={currentCrew.location}
                                    onChange={(e) => setCurrentCrew({ ...currentCrew, location: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Qualifications & Legal Details</label>
                            <textarea
                                placeholder="Licenses, Certifications, etc."
                                style={{ ...styles.input, height: '60px' }}
                                value={currentCrew.details}
                                onChange={(e) => setCurrentCrew({ ...currentCrew, details: e.target.value })}
                                required
                            />
                        </div>

                        <div style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px', marginTop: '8px' }}>
                            <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6B7280', marginBottom: '12px', textTransform: 'uppercase' }}>Login & Coordination Details</p>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Site Manager/Foreman Name</label>
                                <input
                                    style={styles.input}
                                    value={currentCrew.managerName}
                                    onChange={(e) => setCurrentCrew({ ...currentCrew, managerName: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={styles.formRow}>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Login Email</label>
                                    <input
                                        type="email"
                                        style={styles.input}
                                        value={currentCrew.email}
                                        autoComplete="off"
                                        onChange={(e) => setCurrentCrew({ ...currentCrew, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={styles.formGroup}>
                                    <label style={styles.label}>Password</label>
                                    <input
                                        type="password"
                                        style={styles.input}
                                        placeholder={isEditingCrew ? "Keep blank" : "Password"}
                                        value={currentCrew.password}
                                        autoComplete="new-password"
                                        onChange={(e) => setCurrentCrew({ ...currentCrew, password: e.target.value })}
                                        required={!isEditingCrew}
                                    />
                                </div>
                            </div>
                            <div style={styles.formGroup}>
                                <label style={styles.label}>Phone Number</label>
                                <input
                                    style={styles.input}
                                    value={currentCrew.phone}
                                    onChange={(e) => setCurrentCrew({ ...currentCrew, phone: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" style={styles.submitBtn}>
                            {isEditingCrew ? 'Update Profile' : 'Register Constructor'}
                        </button>
                    </form>

                    <h3 style={{ ...styles.cardTitle, marginTop: '32px' }}>Active Crews</h3>
                    <div style={styles.teamList}>
                        {crews.map(crew => (
                            <div key={crew.id} style={styles.crewCardSmall}>
                                <div style={{ flex: 1 }}>
                                    <span style={styles.teamName}>{crew.companyName}</span>
                                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                        Manager: {crew.managerName} • 📍 {crew.location}
                                    </div>
                                </div>
                                <div style={styles.crewActions}>
                                    <button onClick={() => handleEditCrew(crew)} style={styles.iconBtn}>✏️</button>
                                    <button onClick={() => handleDeleteCrew(crew.id)} style={styles.iconBtn}>🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Service Requests */}
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Service Requests</h3>
                    <div style={styles.tableWrapper}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Request Info</th>
                                    <th style={styles.th}>Assign Team</th>
                                    <th style={styles.th}>Date</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.map((book) => (
                                    <tr key={book.id} style={styles.tr}>
                                        <td style={styles.td}>
                                            <div style={{ fontWeight: '700' }}>{book.id}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{book.buyerName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#999' }}>{book.land || 'N/A'}</div>
                                        </td>
                                        <td style={styles.td}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                                                {book.service}
                                            </div>
                                            <select
                                                style={{ ...styles.inlineSelect, borderColor: (!book.provider || book.provider === 'Pending Assignment') ? '#ef4444' : '#eee', outline: 'none' }}
                                                value={(!book.provider || book.provider === 'Pending Assignment') ? "" : book.provider}
                                                onChange={(e) => handleUpdateBooking(book.id, 'provider', e.target.value)}
                                            >
                                                <option value="" disabled>Select Team To Assign</option>
                                                {crews.map(t => <option key={t.companyName} value={t.companyName}>{t.companyName}</option>)}
                                            </select>
                                        </td>
                                        <td style={styles.td}>
                                            <input
                                                type="date"
                                                style={styles.dateInput}
                                                value={book.date}
                                                onChange={(e) => handleUpdateBooking(book.id, 'date', e.target.value)}
                                            />
                                        </td>
                                        <td style={styles.td}>
                                            <span style={{
                                                ...styles.status,
                                                backgroundColor: book.status === 'Cancelled' ? '#fde8e8' : (!book.provider || book.provider === 'Pending Assignment') ? '#fef3c7' : '#e1effe',
                                                color: book.status === 'Cancelled' ? '#9b1c1c' : (!book.provider || book.provider === 'Pending Assignment') ? '#92400e' : '#1e429f'
                                            }}>
                                                {(!book.provider || book.provider === 'Pending Assignment') && book.status !== 'Cancelled' ? 'Pending Assignment' : book.status}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            {book.status !== 'Cancelled' && (
                                                <button style={styles.cancelBtn} onClick={() => handleCancelBooking(book.id)}>Cancel</button>
                                            )}
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
    grid: { display: 'grid', gridTemplateColumns: '450px 1fr', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #ede8e1', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: 'fit-content' },
    cardTitle: { fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', color: '#1A1A1A' },
    formArea: { display: 'flex', flexDirection: 'column', gap: '20px' },
    formRow: { display: 'flex', gap: '16px', width: '100%', boxSizing: 'border-box' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 },
    label: { fontSize: '0.75rem', fontWeight: '700', color: '#4b5563' },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        fontSize: '0.85rem',
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        backgroundColor: '#fff'
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
        marginTop: '12px',
        boxSizing: 'border-box'
    },
    teamList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    crewCardSmall: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#F9FAFB', borderRadius: '8px' },
    teamName: { fontSize: '0.85rem', fontWeight: '700' },
    crewActions: { display: 'flex', gap: '8px' },
    iconBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '2px solid #f0f0f0' },
    th: { textAlign: 'left', padding: '12px 16px', fontSize: '0.75rem', color: '#777', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f0f0f0' },
    td: { padding: '16px', fontSize: '0.85rem' },
    inlineSelect: { display: 'block', width: '100%', padding: '6px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '4px', fontSize: '0.8rem' },
    dateInput: { border: '1px solid #eee', borderRadius: '4px', padding: '6px', fontSize: '0.8rem' },
    status: { padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '700' },
    cancelBtn: { padding: '6px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' },
};

export default ServiceManagement;
