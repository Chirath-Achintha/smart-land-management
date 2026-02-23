import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PinIcon } from '../landing/LandingIcons';
import './LandListingPage.css';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

// ── Bid Modal ──────────────────────────────────────────────────────────────────
const BidModal = ({ land, onClose }) => {
    const [amount, setAmount] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        const token = localStorage.getItem('access_token');
        if (!token) { setError('Please log in to place a bid.'); return; }
        if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid bid amount.'); return; }
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/bids/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ land_id: land.id, amount: parseFloat(amount), message }),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to place bid.');
            } else {
                setSuccess('🎉 Bid placed successfully!');
                setTimeout(onClose, 1800);
            }
        } catch { setError('Server error. Try again.'); }
        setSubmitting(false);
    };

    return (
        <div style={MO.overlay} onClick={onClose}>
            <div style={MO.modal} onClick={e => e.stopPropagation()}>
                <button style={MO.closeBtn} onClick={onClose}>✕</button>
                <h2 style={MO.title}>Place a Bid</h2>
                <p style={MO.landName}>{land.name}</p>
                <p style={MO.sub}>{land.village}, {land.district} · {land.perches} perches</p>
                {land.starting_bid && (
                    <div style={MO.hint}>
                        Starting bid: <strong>Rs. {Number(land.starting_bid).toLocaleString()}</strong>
                        {land.bidding_end && <> &nbsp;·&nbsp; Closes <strong>{land.bidding_end}</strong></>}
                    </div>
                )}
                {error && <div style={MO.err}>{error}</div>}
                {success && <div style={MO.ok}>{success}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={MO.label}>Your Bid Amount (Rs.) *</label>
                        <input type="number" min={land.starting_bid || 1} value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={MO.input} placeholder="e.g. 6500000" required />
                    </div>
                    <div>
                        <label style={MO.label}>Message to Seller (optional)</label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)}
                            style={{ ...MO.input, resize: 'vertical', minHeight: '72px' }}
                            placeholder="Why are you interested in this land?" />
                    </div>
                    <button type="submit" className="btn-dark" style={{ padding: '14px' }} disabled={submitting}>
                        {submitting ? 'Submitting…' : 'Submit Bid'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// ── Visit Modal (two-panel layout) ─────────────────────────────────────────────
const VisitModal = ({ land, onClose }) => {
    const [visitType, setVisitType] = useState('Self');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [availability, setAvailability] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(true);
    const today = new Date().toISOString().split('T')[0];

    // Fetch real availability slots from DB
    useEffect(() => {
        fetch(`${API}/availability/land/${land.id}`)
            .then(r => r.json())
            .then(data => { setAvailability(Array.isArray(data) ? data : []); setLoadingSlots(false); })
            .catch(() => { setAvailability([]); setLoadingSlots(false); });
    }, [land.id]);

    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSubmitting(true);
        const token = localStorage.getItem('access_token');
        if (!token) { setError('Please log in to book a visit.'); setSubmitting(false); return; }
        try {
            const res = await fetch(`${API}/visits/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    land_id: land.id,
                    visit_type: visitType,
                    visit_date: date,
                    visit_time: time,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to book visit.');
            } else {
                setSuccess(`✓ ${visitType} Visit request sent for ${date} at ${time}. Waiting for seller confirmation.`);
            }
        } catch { setError('Server error. Please try again.'); }
        setSubmitting(false);
    };


    // Seller initials helper
    const initials = (land.seller_name || 'S').charAt(0).toUpperCase();

    return (
        <div style={VS.overlay} onClick={onClose}>
            <div style={VS.container} onClick={e => e.stopPropagation()}>
                {/* ── Left panel: land info + owner ── */}
                <div style={VS.leftPanel}>
                    <img
                        src={land.image_url
                            ? land.image_url.split(',')[0]
                            : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'}
                        alt={land.name}
                        style={VS.landImg}
                    />
                    <div style={VS.landInfo}>
                        <h3 style={VS.landName}>{land.name}</h3>
                        <p style={VS.landLoc}>
                            <span style={{ marginRight: '4px' }}>📍</span>
                            {land.village}, {land.district}
                        </p>

                        <h4 style={VS.sectionHead}>Owner Details</h4>
                        <div style={VS.ownerCard}>
                            <div style={VS.avatar}>{initials}</div>
                            <div>
                                <div style={VS.ownerName}>{land.seller_name || 'Seller'}</div>
                                <div style={VS.ownerRole}>Seller</div>
                                <div style={VS.ownerPhone}>+94 77 123 4567</div>
                            </div>
                        </div>

                        <h4 style={VS.sectionHead}>Owner's Availability</h4>
                        {loadingSlots ? (
                            <p style={{ fontSize: '0.82rem', color: '#bbb' }}>Loading slots…</p>
                        ) : availability.length === 0 ? (
                            <p style={{ fontSize: '0.82rem', color: '#bbb', fontStyle: 'italic' }}>No availability slots listed yet.</p>
                        ) : (
                            <div style={VS.slotsGrid}>
                                {availability.map(a => (
                                    <div key={a.id} style={VS.slotCard}>
                                        <div style={VS.slotDay}>{a.day.toUpperCase()}</div>
                                        <div style={VS.slotTime}>{a.time_slot}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right panel: booking form ── */}
                <div style={VS.rightPanel}>
                    <button style={VS.closeBtn} onClick={onClose}>✕</button>
                    <h2 style={VS.formTitle}>Schedule Your Visit</h2>
                    <p style={VS.formSub}>Choose your preferred visit type and timing</p>

                    {!success ? (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Self / Agent tab toggle */}
                            <div style={VS.tabGroup}>
                                {['Self', 'Agent'].map(t => (
                                    <button key={t} type="button"
                                        style={{
                                            ...VS.tab,
                                            background: visitType === t ? '#1A1A1A' : '#fff',
                                            color: visitType === t ? '#fff' : '#555',
                                            border: visitType === t ? 'none' : '1px solid #e5e0da',
                                        }}
                                        onClick={() => setVisitType(t)}>
                                        {t} Visit
                                    </button>
                                ))}
                            </div>

                            {error && (
                                <div style={{ background: '#fdecea', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                                    {error}
                                </div>
                            )}

                            <div>
                                <label style={VS.label}>Select Date</label>
                                <input type="date" value={date} min={today}
                                    onChange={e => setDate(e.target.value)}
                                    style={VS.input} required />
                            </div>
                            <div>
                                <label style={VS.label}>Select Time</label>
                                <input type="time" value={time}
                                    onChange={e => setTime(e.target.value)}
                                    style={VS.input} required />
                            </div>

                            <button type="submit" className="btn-dark"
                                style={{ padding: '16px', fontSize: '0.95rem', borderRadius: '10px' }}
                                disabled={submitting}>
                                {submitting ? 'Sending request…' : `Confirm ${visitType} Visit`}
                            </button>
                            <p style={VS.disclaimer}>
                                * Booking is subject to owner's final confirmation.
                            </p>
                        </form>
                    ) : (
                        <div style={VS.successBox}>{success}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Land Detail Page ──────────────────────────────────────────────────────────
const LandDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [land, setLand] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showVisitModal, setShowVisitModal] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch(`${API}/lands/${id}`)
            .then(r => r.json())
            .then(data => { setLand(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="lands-root" style={{ textAlign: 'center', padding: '100px', color: '#999' }}>Loading…</div>;
    if (!land) return (
        <div className="lands-root" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2>Land not found</h2>
            <button className="btn-dark" onClick={() => navigate('/lands')}>Back to Listings</button>
        </div>
    );

    const highestBid = null;

    return (
        <div style={{ background: '#FAF6F1', minHeight: '100vh', paddingBottom: '80px' }}>
            <div style={S.container}>
                <button onClick={() => navigate('/lands')} style={S.backBtn}>← Back to Listings</button>

                <div style={S.layout}>
                    {/* Image */}
                    <div style={S.imageSection}>
                        <img
                            src={land.image_url
                                ? land.image_url.split(',')[0]
                                : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'}
                            alt={land.name} style={S.heroImg}
                        />
                        <div style={S.priceBadge}>Rs. {Number(land.total_price).toLocaleString()}</div>
                    </div>

                    {/* Content */}
                    <div style={S.contentSection}>
                        <div>
                            <span style={S.tag}>{land.land_type} Land</span>
                            <h1 style={S.title}>{land.name}</h1>
                            <div style={S.location}><PinIcon /> {land.village}, {land.district} District</div>
                        </div>

                        <div style={S.grid}>
                            <div style={S.infoCard}>
                                <span style={S.infoLabel}>Price Per Perch</span>
                                <span style={S.infoValue}>Rs. {Number(land.price_per_perch).toLocaleString()}</span>
                            </div>
                            <div style={S.infoCard}>
                                <span style={S.infoLabel}>Land Size</span>
                                <span style={S.infoValue}>{land.perches} Perches</span>
                            </div>
                            <div style={S.infoCard}>
                                <span style={S.infoLabel}>Status</span>
                                <span style={{ ...S.infoValue, color: land.status === 'Available' ? '#27ae60' : '#e67e22' }}>
                                    {land.status}
                                </span>
                            </div>
                            <div style={S.infoCard}>
                                <span style={S.infoLabel}>Bidding</span>
                                <span style={{ ...S.infoValue, color: land.open_for_bidding ? '#27ae60' : '#bbb' }}>
                                    {land.open_for_bidding ? 'Open' : 'Closed'}
                                </span>
                            </div>
                        </div>

                        {/* Amenities */}
                        <div style={{ marginBottom: '28px' }}>
                            <h3 style={S.subTitle}>Infrastructure & Amenities</h3>
                            {[
                                ['🛣️ Road Access', land.road_access || '—'],
                                ['🔌 Electricity', land.electricity ? 'Available' : 'Not Available'],
                                ['💧 Water Facility', land.water ? 'Available' : 'Not Available'],
                            ].map(([label, val]) => (
                                <div key={label} style={S.amenityRow}>
                                    <span style={{ color: '#555', fontSize: '0.88rem' }}>{label}</span>
                                    <span style={{ fontWeight: '600', fontSize: '0.88rem' }}>{val}</span>
                                </div>
                            ))}
                        </div>

                        {/* Action box */}
                        <div style={S.actionBox}>
                            <h3 style={S.subTitle}>Interested in this Land?</h3>
                            <p style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6, marginBottom: '20px' }}>
                                Contact our dedicated agent for a site visit or more information regarding the property title and registration process.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn-dark"
                                    style={{
                                        flex: 1, padding: '14px',
                                        opacity: land.open_for_bidding ? 1 : 0.45,
                                        cursor: land.open_for_bidding ? 'pointer' : 'not-allowed',
                                    }}
                                    onClick={() => land.open_for_bidding && navigate(`/bidding/${id}`)}
                                    title={land.open_for_bidding ? '' : 'Bidding is currently closed'}>
                                    Place a Bid
                                </button>
                                <button
                                    style={{ flex: 1, padding: '14px', background: '#fff', border: '1.5px solid #1A1A1A', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                                    onClick={() => setShowVisitModal(true)}>
                                    Schedule a Visit
                                </button>
                            </div>
                            {land.open_for_bidding && land.starting_bid && (
                                <p style={{ fontSize: '0.78rem', color: '#888', marginTop: '12px' }}>
                                    Starting bid: <strong>Rs. {Number(land.starting_bid).toLocaleString()}</strong>
                                    {land.bidding_end && <> · Closes {land.bidding_end}</>}
                                    {highestBid && <> &nbsp;·&nbsp; Highest: <strong>Rs. {Number(highestBid).toLocaleString()}</strong></>}
                                </p>
                            )}
                            {!land.open_for_bidding && (
                                <p style={{ fontSize: '0.78rem', color: '#bbb', marginTop: '12px' }}>
                                    Bidding is currently closed for this listing.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bids CTA — link to dedicated bidding page */}
                {land.open_for_bidding && (
                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                        <button
                            onClick={() => navigate(`/bidding/${id}`)}
                            style={{
                                background: 'transparent', border: '1.5px solid #1A1A1A',
                                borderRadius: '10px', padding: '12px 32px',
                                fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer',
                                color: '#1A1A1A', fontFamily: "'DM Sans', sans-serif"
                            }}
                        >
                            View All Bids →
                        </button>
                    </div>
                )}
            </div>

            {showVisitModal && <VisitModal land={land} onClose={() => setShowVisitModal(false)} />}
        </div>
    );
};

// ── Page Styles ───────────────────────────────────────────────────────────────
const S = {
    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' },
    backBtn: { background: 'none', border: 'none', color: '#555', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', marginBottom: '24px', padding: 0 },
    layout: { display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '48px', background: '#fff', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', marginBottom: '40px' },
    imageSection: { position: 'relative', minHeight: '500px' },
    heroImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    priceBadge: { position: 'absolute', bottom: '24px', left: '24px', background: '#1A1A1A', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontSize: '1.25rem', fontWeight: '800', boxShadow: '0 8px 16px rgba(0,0,0,0.2)' },
    contentSection: { padding: '48px', display: 'flex', flexDirection: 'column', gap: '28px' },
    tag: { display: 'inline-block', background: '#FAF6F1', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '10px', lineHeight: 1.1 },
    location: { display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontWeight: '500' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
    infoCard: { background: '#F9F9F9', padding: '18px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '4px' },
    infoLabel: { fontSize: '0.72rem', color: '#777', fontWeight: '700', textTransform: 'uppercase' },
    infoValue: { fontSize: '1.05rem', fontWeight: '700', color: '#1A1A1A' },
    subTitle: { fontSize: '1rem', fontWeight: '800', marginBottom: '14px', color: '#1A1A1A' },
    amenityRow: { display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #EEE', marginBottom: '10px' },
    actionBox: { background: '#FAF6F1', padding: '28px', borderRadius: '18px' },
    bidsSection: { background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
};

// ── Bid Modal Styles ──────────────────────────────────────────────────────────
const MO = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
    modal: { background: '#fff', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '480px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
    closeBtn: { position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#999' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '4px' },
    landName: { fontWeight: '700', fontSize: '1rem', color: '#333', marginBottom: '4px' },
    sub: { fontSize: '0.85rem', color: '#888', marginBottom: '12px' },
    hint: { background: '#FAF6F1', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', color: '#555', marginBottom: '14px' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '6px' },
    input: { padding: '12px 14px', border: '1.5px solid #e5e0da', borderRadius: '10px', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
    err: { background: '#fdecea', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '10px' },
    ok: { background: '#eafaf1', color: '#27ae60', padding: '12px 16px', borderRadius: '10px', fontWeight: '700', textAlign: 'center', fontSize: '0.95rem' },
};

// ── Visit Modal Styles ────────────────────────────────────────────────────────
const VS = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
    container: { display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#FAF6F1', borderRadius: '24px', overflow: 'hidden', width: '100%', maxWidth: '860px', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' },
    // Left panel
    leftPanel: { background: '#fff', display: 'flex', flexDirection: 'column' },
    landImg: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
    landInfo: { padding: '24px' },
    landName: { fontSize: '1.3rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    landLoc: { fontSize: '0.85rem', color: '#666', marginBottom: '22px', display: 'flex', alignItems: 'center' },
    sectionHead: { fontSize: '0.88rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '12px' },
    ownerCard: { display: 'flex', alignItems: 'center', gap: '14px', background: '#FAF6F1', borderRadius: '12px', padding: '14px 16px', marginBottom: '22px' },
    avatar: { width: '44px', height: '44px', borderRadius: '50%', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', flexShrink: 0 },
    ownerName: { fontWeight: '700', fontSize: '0.95rem', color: '#1A1A1A' },
    ownerRole: { fontSize: '0.78rem', color: '#888' },
    ownerPhone: { fontSize: '0.82rem', color: '#555', marginTop: '2px' },
    slotsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
    slotCard: { background: '#F5F0EA', borderRadius: '10px', padding: '12px 14px' },
    slotDay: { fontSize: '0.65rem', fontWeight: '800', color: '#888', letterSpacing: '0.07em', marginBottom: '4px' },
    slotTime: { fontSize: '0.82rem', fontWeight: '700', color: '#1A1A1A' },
    // Right panel
    rightPanel: { padding: '40px 36px', position: 'relative', display: 'flex', flexDirection: 'column' },
    closeBtn: { position: 'absolute', top: '16px', right: '20px', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#999' },
    formTitle: { fontSize: '1.6rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    formSub: { fontSize: '0.85rem', color: '#888', marginBottom: '28px' },
    tabGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#F0EBE4', borderRadius: '10px', padding: '4px', gap: '4px', marginBottom: '4px' },
    tab: { padding: '10px', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888', marginBottom: '8px' },
    input: { padding: '14px 16px', border: '1.5px solid #E5E0DA', borderRadius: '10px', outline: 'none', fontSize: '0.95rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', background: '#fff' },
    disclaimer: { fontSize: '0.75rem', color: '#aaa', textAlign: 'center', marginTop: '-8px' },
    successBox: { background: '#eafaf1', color: '#27ae60', padding: '20px', borderRadius: '12px', fontWeight: '700', textAlign: 'center', fontSize: '1rem', marginTop: '20px' },
};

export default LandDetailPage;
