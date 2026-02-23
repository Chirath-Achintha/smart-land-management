import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LANDS } from './landsData';
import { PinIcon } from '../landing/LandingIcons';

const API = 'http://127.0.0.1:8000';

const ScheduleVisitPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [land, setLand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);

    const [visitType, setVisitType] = useState('Self'); // 'Self' or 'Agent'
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [requestAgent, setRequestAgent] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch Land Details
    useEffect(() => {
        fetch(`${API}/lands/${id}`)
            .then(r => r.json())
            .then(data => { setLand(data); setLoading(false); })
            .catch(() => { setLand(null); setLoading(false); });
    }, [id]);

    // Fetch Availability
    useEffect(() => {
        if (!id) return;
        fetch(`${API}/availability/land/${id}`)
            .then(r => r.json())
            .then(data => { setAvailability(Array.isArray(data) ? data : []); setLoadingSlots(false); })
            .catch(() => { setAvailability([]); setLoadingSlots(false); });
    }, [id]);

    // Reset time when date changes
    useEffect(() => {
        setSelectedTime('');
    }, [selectedDate]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Filter slots for selected date
    const getSlotsForDate = () => {
        if (!selectedDate) return [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const d = new Date(selectedDate + 'T00:00:00');
        const dayName = dayNames[d.getDay()];
        return availability.filter(a => a.day === dayName);
    };

    const dailySlots = getSlotsForDate();

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px', fontSize: '1.2rem', color: '#666' }}>Loading land details...</div>;
    }

    const handleBooking = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const token = localStorage.getItem('access_token');
        if (!token) {
            setError('Please log in to book a visit.');
            setSubmitting(false);
            return;
        }

        try {
            const res = await fetch(`${API}/visits/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    land_id: land.id,
                    visit_type: visitType,
                    visit_date: selectedDate,
                    visit_time: selectedTime,
                    message: visitType === 'Agent' && requestAgent ? 'Agent requested' : ''
                }),
            });

            if (res.ok) {
                alert(`Visit Scheduled Successfully!\nType: ${visitType} Visit\nDate: ${selectedDate}\nTime: ${selectedTime}`);
                navigate(`/lands/${land.id}`);
            } else {
                const err = await res.json();
                setError(err.detail || 'Failed to book visit.');
            }
        } catch {
            setError('Server error. Please try again later.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="lands-root" style={{ background: '#FAF6F1', minHeight: '100vh', paddingBottom: '80px' }}>
            <div style={S.container}>
                {/* Header Section */}
                <button onClick={() => navigate(`/lands/${land.id}`)} style={S.backBtn}>
                    ← Back to Land Details
                </button>

                <div style={S.mainGrid}>
                    {/* Left Side: Land & Owner Info */}
                    <div style={S.infoSection}>
                        <div style={S.card}>
                            <img src={land.image_url ? land.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'} alt={land.name} style={S.landImg} />
                            <div style={S.cardBody}>
                                <h1 style={S.title}>{land.name}</h1>
                                <p style={S.location}><PinIcon /> {land.village}, {land.district}</p>

                                <div style={S.divider} />

                                <h3 style={S.sectionTitle}>Owner's Availability</h3>
                                <div style={S.slotsGrid}>
                                    {availability.length === 0 ? (
                                        <p style={{ color: '#999', fontSize: '0.9rem' }}>No availability slots listed yet.</p>
                                    ) : availability.map((slot, idx) => (
                                        <div key={idx} style={S.slotCard}>
                                            <span style={S.slotDay}>{slot.day}</span>
                                            <span style={S.slotTime}>{slot.time_slot}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Booking Form */}
                    <div style={S.formSection}>
                        <div style={S.card}>
                            <div style={S.cardBody}>
                                <h2 style={S.formTitle}>Schedule Your Visit</h2>
                                <p style={S.formSubtitle}>Choose your preferred visit type and timing</p>

                                <div style={S.typeToggle}>
                                    <button
                                        style={visitType === 'Self' ? S.activeToggle : S.inactiveToggle}
                                        onClick={() => setVisitType('Self')}
                                    >
                                        Self Visit
                                    </button>
                                    <button
                                        style={visitType === 'Agent' ? S.activeToggle : S.inactiveToggle}
                                        onClick={() => setVisitType('Agent')}
                                    >
                                        Agent Visit
                                    </button>
                                </div>

                                {error && <div style={{ color: '#F44336', background: '#FFEBEE', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>{error}</div>}

                                <form onSubmit={handleBooking} style={S.form}>
                                    <div style={S.inputGroup}>
                                        <label style={S.label}>Select Date</label>
                                        <input
                                            type="date"
                                            required
                                            style={S.input}
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        />
                                    </div>

                                    <div style={S.inputGroup}>
                                        <label style={S.label}>Select Time Slot</label>
                                        <select
                                            required
                                            style={S.input}
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                            disabled={!selectedDate || dailySlots.length === 0}
                                        >
                                            <option value="">{selectedDate ? (dailySlots.length > 0 ? '-- Select a Time Slot --' : 'No slots available for this day') : '-- Select a date first --'}</option>
                                            {dailySlots.map(s => (
                                                <option key={s.id} value={s.time_slot}>{s.time_slot}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {visitType === 'agent' && (
                                        <div style={S.agentOption}>
                                            <label style={S.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={requestAgent}
                                                    onChange={(e) => setRequestAgent(e.target.checked)}
                                                    style={S.checkbox}
                                                />
                                                Request a professional agent to accompany
                                            </label>
                                        </div>
                                    )}

                                    <button type="submit" style={S.submitBtn} disabled={submitting}>
                                        {submitting ? 'Processing...' : (visitType === 'Self' ? 'Confirm Self Visit' : 'Request Agent Visit')}
                                    </button>
                                </form>

                                <p style={S.notice}>
                                    * Booking is subject to owner's final confirmation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    container: {
        maxWidth: '1100px',
        margin: '0 auto',
        padding: '40px 24px',
    },
    backBtn: {
        background: 'none',
        border: 'none',
        color: '#555',
        fontSize: '0.9rem',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '24px',
        display: 'block'
    },
    mainGrid: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 400px',
        gap: '32px',
        alignItems: 'start'
    },
    card: {
        background: '#fff',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
    },
    landImg: {
        width: '100%',
        height: '240px',
        objectFit: 'cover'
    },
    cardBody: {
        padding: '32px'
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: '8px'
    },
    location: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#666',
        fontWeight: '500'
    },
    divider: {
        height: '1px',
        background: '#EEE',
        margin: '24px 0'
    },
    sectionTitle: {
        fontSize: '1.1rem',
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: '16px'
    },
    ownerBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: '#FAF6F1',
        padding: '16px',
        borderRadius: '16px'
    },
    avatar: {
        width: '48px',
        height: '48px',
        background: '#1A1A1A',
        color: '#fff',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        fontWeight: '700'
    },
    ownerName: {
        fontWeight: '700',
        color: '#1A1A1A',
        margin: 0
    },
    ownerRole: {
        fontSize: '0.8rem',
        color: '#777',
        margin: '2px 0'
    },
    ownerPhone: {
        fontSize: '0.85rem',
        color: '#1A1A1A',
        fontWeight: '600',
        margin: 0
    },
    slotsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '12px'
    },
    slotCard: {
        border: '1px solid #EEE',
        padding: '12px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column'
    },
    slotDay: {
        fontSize: '0.75rem',
        fontWeight: '700',
        color: '#555',
        textTransform: 'uppercase'
    },
    slotTime: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#1A1A1A',
        marginTop: '4px'
    },
    formTitle: {
        fontSize: '1.5rem',
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: '8px'
    },
    formSubtitle: {
        fontSize: '0.9rem',
        color: '#666',
        textAlign: 'center',
        marginBottom: '24px'
    },
    typeToggle: {
        display: 'flex',
        background: '#F5F5F5',
        padding: '4px',
        borderRadius: '10px',
        marginBottom: '24px'
    },
    activeToggle: {
        flex: 1,
        padding: '10px',
        border: 'none',
        borderRadius: '8px',
        background: '#fff',
        color: '#1A1A1A',
        fontWeight: '700',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer'
    },
    inactiveToggle: {
        flex: 1,
        padding: '10px',
        border: 'none',
        background: 'transparent',
        color: '#777',
        fontWeight: '600',
        cursor: 'pointer'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '0.85rem',
        fontWeight: '700',
        color: '#1A1A1A'
    },
    input: {
        padding: '12px',
        borderRadius: '10px',
        border: '1px solid #DDD',
        fontSize: '1rem',
        outline: 'none',
        fontFamily: 'inherit'
    },
    agentOption: {
        background: '#F9F9F9',
        padding: '12px',
        borderRadius: '10px'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.85rem',
        color: '#444',
        cursor: 'pointer',
        fontWeight: '500'
    },
    checkbox: {
        width: '18px',
        height: '18px'
    },
    submitBtn: {
        padding: '14px',
        background: '#1A1A1A',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '700',
        fontSize: '1rem',
        cursor: 'pointer',
        marginTop: '10px'
    },
    notice: {
        fontSize: '0.75rem',
        color: '#999',
        textAlign: 'center',
        marginTop: '20px'
    }
};

export default ScheduleVisitPage;
