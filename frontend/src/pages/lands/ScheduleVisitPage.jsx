import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { PinIcon } from '../landing/LandingIcons';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ScheduleVisitPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const editId = queryParams.get('edit');

    const [land, setLand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [availability, setAvailability] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);

    const [visitType, setVisitType] = useState('self_visit');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const today = new Date().toISOString().split('T')[0];

    // Fetch Land Details
    useEffect(() => {
        window.scrollTo(0, 0);
        fetch(`${API}/lands/${id}`)
            .then(r => r.json())
            .then(data => {
                setLand(data);
                setLoading(false);
            })
            .catch(() => {
                setLand(null);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        if (!editId) return;
        const token = localStorage.getItem('access_token');
        fetch(`${API}/visits/my-requests`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(r => r.json())
        .then(data => {
            const v = data.find(item => item.id === editId);
            if (v) {
                setVisitType(v.visit_type);
                setDate(v.visit_date);
                setTime(v.visit_time);
                setMessage(v.message || '');
            }
        });
    }, [editId]);

    // Fetch Availability
    useEffect(() => {
        if (!id) return;
        fetch(`${API}/availability/land/${id}`)
            .then(r => r.json())
            .then(data => {
                setAvailability(Array.isArray(data) ? data : []);
                setLoadingSlots(false);
            })
            .catch(() => {
                setAvailability([]);
                setLoadingSlots(false);
            });
    }, [id]);

    // --- LIVE VALIDATION ---
    useEffect(() => {
        if (!date || !availability || availability.length === 0) {
            setError('');
            return;
        }

        const selectedDateObj = new Date(date);
        const dayName = DAYS[selectedDateObj.getDay() === 0 ? 6 : selectedDateObj.getDay() - 1];
        
        const daySlot = availability.find(a => a.day === dayName);
        if (!daySlot) {
            setError(`The owner is not available on ${dayName}s. Please pick an available day.`);
            return;
        }

        if (time) {
            const [startStr, endStr] = daySlot.time_slot.split(' – ');
            const parseDisplayStr = (str) => {
                const [timePart, ampm] = str.split(' ');
                let [h, m] = timePart.split(':').map(Number);
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            const startMins = parseDisplayStr(startStr);
            const endMins = parseDisplayStr(endStr);
            const selectedMins = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);

            if (selectedMins < startMins || selectedMins > endMins) {
                setError(`The owner's window for ${dayName} is ${daySlot.time_slot}. Please adjust your time.`);
                return;
            }
        }

        setError(''); // Clear error if all checks pass
    }, [date, time, availability]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (error) return; // Prevent submission if live error exists
        
        setError(''); setSubmitting(true);
        const token = localStorage.getItem('access_token');
        if (!token) {
            setError('Please log in to book a visit.');
            setSubmitting(false);
            return;
        }

        const landId = land?._id || land?.id || id;
        const url = editId ? `${API}/visits/${editId}/update` : `${API}/visits/`;
        const method = editId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    land_id: landId,
                    visit_type: visitType,
                    visit_date: date,
                    visit_time: time,
                    message: message,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to process visit request.');
            } else {
                setSuccess(editId 
                    ? `✓ Visit schedule has been updated successfully!` 
                    : `✓ ${visitType === 'self_visit' ? 'Self' : 'Agent'} Visit request sent for ${date} at ${time}. Waiting for seller confirmation.`
                );
                setTimeout(() => {
                    navigate('/dashboard/visits');
                }, 3000);
            }
        } catch {
            setError('Server error. Please try again.');
        }
        setSubmitting(false);
    };

    if (loading) return <div style={S.loading}>Loading land details...</div>;
    if (!land) return <div style={S.loading}>Land not found.</div>;

    const initials = (land.seller_name || 'S').charAt(0).toUpperCase();

    return (
        <div style={S.root}>
            <div style={S.container}>
                <button onClick={() => navigate(`/lands/${id}`)} style={S.backBtn}>
                    ← Back to Property
                </button>

                <div style={S.card}>
                    {/* Left Panel: Info */}
                    <div style={S.leftPanel}>
                        <img
                            src={land.image_url ? land.image_url.split(',')[0] : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'}
                            alt={land.name}
                            style={S.landImg}
                        />
                        <div style={S.landContent}>
                            <h1 style={S.landTitle}>{land.name}</h1>
                            <p style={S.landLoc}><PinIcon /> {land.village}, {land.district}</p>

                            <h4 style={S.sectionLabel}>Owner Details</h4>
                            <div style={S.ownerCard}>
                                <div style={S.avatar}>{initials}</div>
                                <div>
                                    <div style={S.ownerName}>{land.seller_name || 'Seller'}</div>
                                    <div style={S.ownerRole}>Property Owner</div>
                                    <div style={S.ownerPhone}>+94 77 123 4567</div>
                                </div>
                            </div>

                            <h4 style={S.sectionLabel}>Owner's Weekly Availability</h4>
                            {loadingSlots ? (
                                <p style={S.hint}>Loading availability...</p>
                            ) : availability.length === 0 ? (
                                <p style={S.hint}>No specific slots listed yet.</p>
                            ) : (
                                <div style={S.slotsGrid}>
                                    {availability.map((a, i) => (
                                        <div key={i} style={S.slotCard}>
                                            <div style={S.slotDay}>{a.day}</div>
                                            <div style={S.slotTime}>{a.time_slot}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Form */}
                    <div style={S.rightPanel}>
                        <h2 style={S.formTitle}>Schedule Your Visit</h2>
                        <p style={S.formSub}>Choose your preferred visit type and timing</p>

                        {!success ? (
                            <form onSubmit={handleSubmit} style={S.form}>
                                <div style={S.tabGroup}>
                                    <button
                                        type="button"
                                        style={{ ...S.tab, ...(visitType === 'self_visit' ? S.tabActive : S.tabInactive) }}
                                        onClick={() => setVisitType('self_visit')}
                                    >
                                        Self Visit
                                    </button>
                                    <button
                                        type="button"
                                        style={{ ...S.tab, ...(visitType === 'agent_visit' ? S.tabActive : S.tabInactive) }}
                                        onClick={() => setVisitType('agent_visit')}
                                    >
                                        Agent Visit
                                    </button>
                                </div>

                                {error && <div style={S.error}>{error}</div>}

                                <div style={S.inputRow}>
                                    <label style={S.label}>Select Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        min={today}
                                        onChange={e => setDate(e.target.value)}
                                        style={S.input}
                                        required
                                    />
                                </div>

                                <div style={S.inputRow}>
                                    <label style={S.label}>Select Time</label>
                                    <input
                                        type="time"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                        style={S.input}
                                        required
                                    />
                                </div>

                                {visitType === 'self_visit' && (
                                    <div style={S.inputRow}>
                                        <label style={S.label}>Message (Optional)</label>
                                        <textarea
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            placeholder="Any special requests or details?"
                                            style={{ ...S.input, height: '100px', resize: 'none' }}
                                        />
                                    </div>
                                )}

                                <button type="submit" className="btn-dark" style={{ ...S.submitBtn, opacity: (submitting || error) ? 0.6 : 1 }} disabled={submitting || error}>
                                    {submitting ? 'Sending Request...' : `Confirm ${visitType === 'self_visit' ? 'Self' : 'Agent'} Visit`}
                                </button>

                                <p style={S.disclaimer}>
                                    * Booking is subject to owner's final confirmation. You will be redirected after success.
                                </p>
                            </form>
                        ) : (
                            <div style={S.successCard}>
                                <div style={S.successIcon}>✓</div>
                                <div style={S.successText}>{success}</div>
                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                    <button 
                                        onClick={() => navigate(`/lands/${land?._id || land?.id || id}`)} 
                                        style={S.returnBtn}
                                    >
                                        Return to Land Details
                                    </button>
                                    <button 
                                        onClick={() => navigate('/dashboard/visits')} 
                                        style={{ ...S.returnBtn, background: '#f5f0ea', color: '#1a1a1a', border: '1.5px solid #1a1a1a' }}
                                    >
                                        View My Visits
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100vh', padding: '40px 20px', fontFamily: "'DM Sans', sans-serif" },
    container: { maxWidth: '1000px', margin: '0 auto' },
    loading: { textAlign: 'center', padding: '100px', color: '#999', fontSize: '1.1rem' },
    backBtn: { background: 'none', border: 'none', color: '#888', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' },
    card: { background: '#fff', borderRadius: '32px', overflow: 'hidden', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', boxShadow: '0 20px 60px rgba(0,0,0,0.05)' },

    // Left Panel
    leftPanel: { borderRight: '1px solid #F0EBE4' },
    landImg: { width: '100%', height: '280px', objectFit: 'cover' },
    landContent: { padding: '40px' },
    landTitle: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    landLoc: { fontSize: '0.95rem', color: '#666', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '32px' },
    sectionLabel: { fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#999', marginBottom: '16px' },
    ownerCard: { display: 'flex', alignItems: 'center', gap: '16px', background: '#FAF6F1', borderRadius: '16px', padding: '16px', marginBottom: '32px' },
    avatar: { width: '48px', height: '48px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' },
    ownerName: { fontWeight: '700', fontSize: '1rem', color: '#1A1A1A' },
    ownerRole: { fontSize: '0.8rem', color: '#888', margin: '2px 0' },
    ownerPhone: { fontSize: '0.85rem', color: '#555' },
    slotsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    slotCard: { background: '#F5F0EA', borderRadius: '12px', padding: '12px 16px' },
    slotDay: { fontSize: '0.7rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '4px' },
    slotTime: { fontSize: '0.9rem', fontWeight: '700', color: '#1A1A1A' },
    hint: { fontSize: '0.9rem', color: '#bbb', fontStyle: 'italic' },

    // Right Panel
    rightPanel: { padding: '60px 50px', display: 'flex', flexDirection: 'column' },
    formTitle: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '10px' },
    formSub: { fontSize: '1rem', color: '#888', marginBottom: '40px' },
    form: { display: 'flex', flexDirection: 'column', gap: '24px' },
    tabGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F5F0EA', borderRadius: '14px', padding: '5px', gap: '5px' },
    tab: { padding: '12px', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    tabActive: { background: '#1A1A1A', color: '#fff' },
    tabInactive: { background: 'transparent', color: '#888' },
    inputRow: { display: 'flex', flexDirection: 'column', gap: '10px' },
    label: { fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', color: '#1A1A1A' },
    input: { padding: '16px', borderRadius: '12px', border: '1.5px solid #F0EBE4', fontSize: '1rem', outline: 'none', background: '#FDFDFD' },
    submitBtn: { padding: '18px', borderRadius: '14px', fontSize: '1.1rem', fontWeight: '700', marginTop: '10px' },
    disclaimer: { fontSize: '0.8rem', color: '#aaa', textAlign: 'center', lineHeight: '1.5' },
    error: { background: '#fdecea', color: '#d32f2f', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' },

    // Success
    successCard: { textAlign: 'center', padding: '40px 0' },
    successIcon: { width: '64px', height: '64px', background: '#27ae60', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', margin: '0 auto 24px' },
    successText: { fontSize: '1.1rem', fontWeight: '700', color: '#27ae60', lineHeight: '1.6', marginBottom: '32px' },
    returnBtn: { padding: '14px 30px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' }
};

export default ScheduleVisitPage;
