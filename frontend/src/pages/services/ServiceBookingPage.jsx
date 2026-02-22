import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const ServiceBookingPage = () => {
    const { user } = useAuth();

    // Available Services
    const SERVICES = [
        {
            id: 'S1',
            name: 'Construction',
            desc: 'Professional building and construction services tailored to your budget and design.',
            icon: '🏗️',
            basePrice: '$25,000+'
        },
        {
            id: 'S2',
            name: 'Land Development',
            desc: 'Site clearance, leveling, and utility installation to prepare your land for building.',
            icon: '🚜',
            basePrice: '$5,000+'
        }
    ];

    // Mock My Bookings
    const [bookings, setBookings] = useState([
        { id: 'B-7742', service: 'Land Development', date: '2024-02-28', startTime: '10:30 AM', status: 'In Progress', provider: 'TerraFirm Earthworks', price: '$5,200' }
    ]);

    const [selectedService, setSelectedService] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [showForm, setShowForm] = useState(false);

    const handleBookClick = (service) => {
        setSelectedService(service);
        setShowForm(true);
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const newBooking = {
            id: `B-${Math.floor(Math.random() * 9000) + 1000}`,
            service: selectedService.name,
            date: bookingDate,
            startTime: bookingTime,
            status: 'Scheduled',
            provider: 'Pending Assignment',
            price: selectedService.basePrice,
            buyerName: user?.name || 'Anonymous Buyer',
            buyerEmail: user?.email || 'anonymous@example.com'
        };
        const updatedBookings = [newBooking, ...bookings];
        setBookings(updatedBookings);

        // Persist to all_service_bookings for Constructor Manager
        const allBookings = JSON.parse(localStorage.getItem('all_service_bookings') || '[]');
        localStorage.setItem('all_service_bookings', JSON.stringify([newBooking, ...allBookings]));

        setShowForm(false);
        setBookingDate('');
        setBookingTime('');
        alert(`Successfully booked ${selectedService.name}! We will assign a provider shortly.`);
    };

    const cancelBooking = (id) => {
        if (window.confirm('Are you sure you want to cancel this service booking?')) {
            setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Scheduled': return { color: '#2196F3', bg: '#E3F2FD' };
            case 'In Progress': return { color: '#FF9800', bg: '#FFF3E0' };
            case 'Completed': return { color: '#4CAF50', bg: '#E8F5E9' };
            case 'Cancelled': return { color: '#F44336', bg: '#FFEBEE' };
            default: return { color: '#777', bg: '#EEE' };
        }
    };

    return (
        <div style={S.root}>
            <div style={S.container}>
                <header style={S.header}>
                    <h1 style={S.pageTitle}>Services & Development</h1>
                    <p style={S.subtitle}>Professional solutions for your land and dream home journey</p>
                </header>

                {/* Tabs / Layout */}
                <div style={S.layout}>

                    {/* Browse Services */}
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>Available Services</h2>
                        <div style={S.serviceGrid}>
                            {SERVICES.map(s => (
                                <div key={s.id} style={S.serviceCard}>
                                    <div style={S.serviceIcon}>{s.icon}</div>
                                    <h3 style={S.serviceName}>{s.name}</h3>
                                    <p style={S.serviceDesc}>{s.desc}</p>
                                    <div style={S.serviceFooter}>
                                        <span style={S.priceLabel}>Starting from {s.basePrice}</span>
                                        <button
                                            style={S.bookBtn}
                                            onClick={() => handleBookClick(s)}
                                        >
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* My Bookings */}
                    <section style={S.section}>
                        <h2 style={S.sectionTitle}>My Service Bookings</h2>
                        {!user ? (
                            <div style={S.loginNotice}>
                                <p>Please login to track your bookings.</p>
                                <a href="/login" style={S.loginBtn}>Login</a>
                            </div>
                        ) : (
                            <div style={S.bookingList}>
                                {bookings.length === 0 ? (
                                    <p style={S.empty}>You haven't booked any services yet.</p>
                                ) : (
                                    bookings.map(b => (
                                        <div key={b.id} style={S.bookingItem}>
                                            <div style={S.bookingHeader}>
                                                <div>
                                                    <h3 style={S.bookingService}>{b.service}</h3>
                                                    <p style={S.bookingId}>Booking ID: {b.id}</p>
                                                </div>
                                                <span
                                                    style={{
                                                        ...S.statusBadge,
                                                        color: getStatusStyle(b.status).color,
                                                        backgroundColor: getStatusStyle(b.status).bg
                                                    }}
                                                >
                                                    {b.status}
                                                </span>
                                            </div>
                                            <div style={S.bookingDetails}>
                                                <div style={S.detailBit}>
                                                    <span style={S.detailLabel}>Date & Time</span>
                                                    <span style={S.detailVal}>{b.date} at {b.startTime}</span>
                                                </div>
                                                <div style={S.detailBit}>
                                                    <span style={S.detailLabel}>Service Provider</span>
                                                    <span style={S.detailVal}>{b.provider}</span>
                                                </div>
                                                <div style={S.detailBit}>
                                                    <span style={S.detailLabel}>Estimated Cost</span>
                                                    <span style={S.detailVal}>{b.price}</span>
                                                </div>
                                            </div>
                                            {b.status === 'Scheduled' && (
                                                <button
                                                    style={S.cancelBtn}
                                                    onClick={() => cancelBooking(b.id)}
                                                >
                                                    Cancel Booking
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Booking Modal/Overlay */}
            {showForm && (
                <div style={S.modalOverlay}>
                    <div style={S.modal}>
                        <div style={S.modalHeader}>
                            <h2>Book {selectedService?.name}</h2>
                            <button style={S.closeBtn} onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleFormSubmit} style={S.form}>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Select Date</label>
                                <input
                                    type="date"
                                    style={S.input}
                                    value={bookingDate}
                                    onChange={(e) => setBookingDate(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Preferred Time</label>
                                <input
                                    type="time"
                                    style={S.input}
                                    value={bookingTime}
                                    onChange={(e) => setBookingTime(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={S.noticeBox}>
                                <p>Our team will review your request and assign a qualified provider within 24 hours.</p>
                            </div>
                            <button type="submit" style={S.confirmBtn}>Confirm Booking</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100vh', padding: '120px 20px 60px' },
    container: { maxWidth: '1200px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: '60px' },
    pageTitle: { fontSize: '2.8rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '16px' },
    subtitle: { fontSize: '1.2rem', color: '#666' },
    layout: { display: 'flex', flexDirection: 'column', gap: '80px' },
    section: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sectionTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A' },

    // Services Grid
    serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' },
    serviceCard: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.02)', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s' },
    serviceIcon: { fontSize: '2.5rem' },
    serviceName: { fontSize: '1.4rem', fontWeight: '800', color: '#1A1A1A' },
    serviceDesc: { fontSize: '0.95rem', color: '#666', lineHeight: '1.6', flex: 1 },
    serviceFooter: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' },
    priceLabel: { fontSize: '0.85rem', fontWeight: '700', color: '#888' },
    bookBtn: { padding: '12px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' },

    // Bookings List
    bookingList: { display: 'flex', flexDirection: 'column', gap: '20px' },
    bookingItem: { background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #F0F0F0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' },
    bookingHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
    bookingService: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' },
    bookingId: { fontSize: '0.8rem', color: '#AAA', fontWeight: '600' },
    statusBadge: { padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700' },
    bookingDetails: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' },
    detailBit: { display: 'flex', flexDirection: 'column', gap: '4px' },
    detailLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#AAA', textTransform: 'uppercase' },
    detailVal: { fontSize: '1rem', fontWeight: '700', color: '#333' },
    cancelBtn: { padding: '10px 20px', background: 'transparent', color: '#F44336', border: '1px solid #F44336', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', alignSelf: 'flex-start' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: '#fff', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#AAA' },
    form: { display: 'flex', flexDirection: 'column', gap: '24px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.9rem', fontWeight: '700', color: '#1A1A1A' },
    input: { padding: '14px', borderRadius: '12px', border: '1px solid #EEE', background: '#F9F9F9', fontSize: '1rem', outline: 'none' },
    noticeBox: { padding: '16px', background: '#F5F5F5', borderRadius: '12px', borderLeft: '4px solid #1A1A1A' },
    confirmBtn: { padding: '16px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', marginTop: '8px' },

    empty: { textAlign: 'center', padding: '40px', color: '#AAA', fontStyle: 'italic' },
    loginNotice: { textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '24px' },
    loginBtn: { display: 'inline-block', marginTop: '16px', padding: '10px 30px', background: '#1A1A1A', color: '#fff', textDecoration: 'none', borderRadius: '10px', fontWeight: '700' }
};

export default ServiceBookingPage;
