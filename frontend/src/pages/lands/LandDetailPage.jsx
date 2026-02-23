import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PinIcon } from '../landing/LandingIcons';
import './LandListingPage.css';

const API = 'http://127.0.0.1:8000';

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
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBidModal, setShowBidModal] = useState(false);
    const [showVisitModal, setShowVisitModal] = useState(false);

    // ── Tab state ──────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('property'); // 'property' | 'services'

    // ── Service booking modal state ────────────────────────────────────────────
    const [bookingService, setBookingService] = useState(null);   // null | { type, icon, desc, estimate }
    const [bkgStep, setBkgStep] = useState(1);         // 1=form, 2=review, 3=done
    const [bkgForm, setBkgForm] = useState({ preferred_date: '', preferred_time: '', notes: '' });
    const [bkgErr, setBkgErr] = useState('');
    const [bkgLoading, setBkgLoading] = useState(false);

    const SERVICES = [
        { type: 'Full Construction', icon: '🏗️', desc: 'Architectural design & complete building services.', estimate: 'Rs. 25,000,000+' },
        { type: 'Land Development', icon: '🚜', desc: 'Clearance, leveling, and utility infrastructure.', estimate: 'Rs. 5,000,000+' },
    ];

    const openBookingModal = (svc) => {
        setBookingService(svc);
        setBkgStep(1);
        setBkgForm({ preferred_date: '', preferred_time: '', notes: '' });
        setBkgErr('');
    };
    const closeBookingModal = () => { setBookingService(null); setBkgStep(1); };

    const handleBookingConfirm = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { setBkgErr('Please log in first.'); return; }
        setBkgLoading(true); setBkgErr('');
        try {
            const res = await fetch(`${API}/service-bookings/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    land_id: parseInt(id),
                    service_type: bookingService.type,
                    preferred_date: bkgForm.preferred_date,
                    preferred_time: bkgForm.preferred_time,
                    notes: bkgForm.notes || null,
                }),
            });
            if (!res.ok) { const e = await res.json(); setBkgErr(e.detail || 'Failed. Try again.'); setBkgLoading(false); return; }
            setBkgStep(3);
        } catch { setBkgErr('Server error. Try again.'); }
        setBkgLoading(false);
    };

    const fetchBids = () => {
        fetch(`${API}/bids/land/${id}`)
            .then(r => r.json())
            .then(data => setBids(Array.isArray(data) ? data : []))
            .catch(() => setBids([]));
    };

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch(`${API}/lands/${id}`)
            .then(r => r.json())
            .then(data => { setLand(data); setLoading(false); })
            .catch(() => setLoading(false));
        fetchBids();
    }, [id]);

    if (loading) return <div className="lands-root" style={{ textAlign: 'center', padding: '100px', color: '#999' }}>Loading…</div>;
    if (!land) return (
        <div className="lands-root" style={{ textAlign: 'center', padding: '100px 20px' }}>
            <h2>Land not found</h2>
            <button className="btn-dark" onClick={() => navigate('/lands')}>Back to Listings</button>
        </div>
    );

    const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : null;

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

                        {/* ── Tab toggles ─────────────────────────────────────── */}
                        <div style={S.tabRow}>
                            <button
                                style={{ ...S.tabBtn, ...(activeTab === 'property' ? S.tabActive : {}) }}
                                onClick={() => setActiveTab('property')}
                            >Property Details</button>
                            <button
                                style={{ ...S.tabBtn, ...(activeTab === 'services' ? S.tabActive : {}) }}
                                onClick={() => setActiveTab('services')}
                            >Construction Services</button>
                        </div>

                        {/* ── Property Details Tab ─────────────────────────────── */}
                        {activeTab === 'property' && (
                            <>
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
                                <div style={{ marginBottom: '8px' }}>
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

                                {/* Construction Services Promo Banner */}
                                <div style={S.svcBanner} onClick={() => setActiveTab('services')}>
                                    <div style={{ fontSize: '0.85rem', color: '#444', lineHeight: '1.5' }}>
                                        <strong>Need construction on this land?</strong>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#1A52e8', textDecoration: 'underline', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                                            View Construction Services
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#1A52e8' }}>≡</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ── Construction Services Tab ────────────────────────── */}
                        {activeTab === 'services' && (
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' }}>
                                    Available Land Services
                                </h3>
                                <p style={{ fontSize: '0.82rem', color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                                    Enhance your land with our professional construction and development services.
                                    Our automated matching system will assign the best local team for your project.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                    {SERVICES.map(svc => (
                                        <div key={svc.type} style={S.svcRow}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                                                <span style={{ fontSize: '1.8rem' }}>{svc.icon}</span>
                                                <div>
                                                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1A1A1A' }}>{svc.type}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '2px' }}>{svc.desc}</div>
                                                </div>
                                            </div>
                                            <button
                                                style={S.svcBookBtn}
                                                onClick={() => openBookingModal(svc)}
                                            >Book Now</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Action box (always visible) ───────────────────────── */}
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
                                    onClick={() => land.open_for_bidding && setShowBidModal(true)}
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
                                    {highestBid && <>&nbsp;·&nbsp; Highest: <strong>Rs. {Number(highestBid).toLocaleString()}</strong></>}
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

                {/* Current bids */}
                {bids.length > 0 && (
                    <div style={S.bidsSection}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '24px', color: '#1A1A1A' }}>
                            Current Bids ({bids.length})
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {bids.map((bid, i) => (
                                <div key={bid.id} style={{
                                    background: '#FAFAFA', borderRadius: '12px', padding: '20px 24px',
                                    borderLeft: `4px solid ${i === 0 ? '#27ae60' : '#ddd'}`
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1A1A1A' }}>
                                                Rs. {Number(bid.amount).toLocaleString()}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                                                by {bid.buyer_name || 'Buyer'} · {bid.created_at ? new Date(bid.created_at).toLocaleDateString() : ''}
                                            </div>
                                            {bid.message && (
                                                <div style={{ fontSize: '0.85rem', color: '#444', marginTop: '8px', fontStyle: 'italic' }}>
                                                    "{bid.message}"
                                                </div>
                                            )}
                                        </div>
                                        <span style={{
                                            display: 'inline-block', padding: '4px 12px', borderRadius: '20px',
                                            fontSize: '0.75rem', fontWeight: '700',
                                            background: bid.status === 'Accepted' ? '#eafaf1' : bid.status === 'Rejected' ? '#fdecea' : '#f0f4ff',
                                            color: bid.status === 'Accepted' ? '#27ae60' : bid.status === 'Rejected' ? '#d32f2f' : '#1565c0',
                                        }}>
                                            {i === 0 && bid.status === 'Pending' ? '🏆 Highest' : bid.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {showBidModal && <BidModal land={land} onClose={() => { setShowBidModal(false); fetchBids(); }} />}
            {showVisitModal && <VisitModal land={land} onClose={() => setShowVisitModal(false)} />}

            {/* ── Service Booking Modal (Screenshot Redesign) ───────────── */}
            {bookingService && (
                <div style={BK.overlay} onClick={closeBookingModal}>
                    <div style={BK.modal} onClick={e => e.stopPropagation()}>
                        <button style={BK.closeX} onClick={closeBookingModal}>✕</button>

                        <h2 style={BK.title}>Book Service</h2>

                        {/* Step Progress Indicator */}
                        <div style={BK.steps}>
                            {[1, 2, 3].map(n => (
                                <React.Fragment key={n}>
                                    <div style={{
                                        ...BK.stepDot,
                                        background: bkgStep >= n ? '#1A1A1A' : '#f0f0f0',
                                        color: bkgStep >= n ? '#fff' : '#aaa'
                                    }}>{n}</div>
                                    {n < 3 && <div style={{
                                        ...BK.stepLine,
                                        background: bkgStep > n ? '#1A1A1A' : '#f0f0f0'
                                    }} />}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Step 1: Form */}
                        {bkgStep === 1 && (
                            <>
                                <h3 style={BK.stepHeader}>Schedule Visit</h3>
                                <div style={BK.formGroup}>
                                    <label style={BK.label}>Preferred Date</label>
                                    <input type="date" style={BK.input}
                                        min={new Date().toISOString().split('T')[0]}
                                        value={bkgForm.preferred_date}
                                        onChange={e => setBkgForm(p => ({ ...p, preferred_date: e.target.value }))}
                                        placeholder="mm/dd/yyyy"
                                    />
                                </div>
                                <div style={BK.formGroup}>
                                    <label style={BK.label}>Preferred Time</label>
                                    <input type="time" style={BK.input}
                                        value={bkgForm.preferred_time}
                                        onChange={e => setBkgForm(p => ({ ...p, preferred_time: e.target.value }))}
                                    />
                                </div>
                                <div style={BK.formGroup}>
                                    <label style={BK.label}>Notes (optional)</label>
                                    <textarea style={{ ...BK.input, minHeight: '100px', resize: 'none' }}
                                        placeholder="Any specific requirements..."
                                        value={bkgForm.notes}
                                        onChange={e => setBkgForm(p => ({ ...p, notes: e.target.value }))}
                                    />
                                </div>
                                {bkgErr && <div style={BK.err}>{bkgErr}</div>}
                                <div style={BK.btnRow}>
                                    <button style={BK.cancelBtn} onClick={closeBookingModal}>Cancel</button>
                                    <button className="btn-dark" style={BK.nextBtn}
                                        disabled={!bkgForm.preferred_date || !bkgForm.preferred_time}
                                        onClick={() => { if (!bkgForm.preferred_date || !bkgForm.preferred_time) return; setBkgStep(2); }}>
                                        Next: Review →
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 2: Review */}
                        {bkgStep === 2 && (
                            <>
                                <h3 style={BK.stepHeader}>Review Booking</h3>
                                <div style={BK.reviewCard}>
                                    <div style={BK.reviewRow}><span style={BK.reviewLbl}>Service</span> <span style={BK.reviewVal}>{bookingService.type}</span></div>
                                    <div style={BK.reviewRow}><span style={BK.reviewLbl}>Land</span> <span style={BK.reviewVal}>{land.name}</span></div>
                                    <div style={BK.reviewRow}><span style={BK.reviewLbl}>Date</span> <span style={BK.reviewVal}>{bkgForm.preferred_date}</span></div>
                                    <div style={BK.reviewRow}><span style={BK.reviewLbl}>Time</span> <span style={BK.reviewVal}>{bkgForm.preferred_time}</span></div>
                                    {bkgForm.notes && <div style={BK.reviewRow}><span style={BK.reviewLbl}>Notes</span> <span style={BK.reviewVal}>{bkgForm.notes}</span></div>}
                                </div>
                                <p style={BK.hint}>A constructor manager will be automatically assigned to review your request.</p>
                                {bkgErr && <div style={BK.err}>{bkgErr}</div>}
                                <div style={BK.btnRow}>
                                    <button style={BK.cancelBtn} onClick={() => setBkgStep(1)}>Back</button>
                                    <button className="btn-dark" style={BK.nextBtn}
                                        disabled={bkgLoading} onClick={handleBookingConfirm}>
                                        {bkgLoading ? 'Confirming...' : 'Confirm & Book'}
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Step 3: Success */}
                        {bkgStep === 3 && (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>✅</div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '10px' }}>Booking Confirmed!</h2>
                                <p style={{ color: '#666', marginBottom: '30px', lineHeight: '1.6' }}>
                                    Your {bookingService.type} request has been submitted.
                                    You can track it in your service dashboard.
                                </p>
                                <button className="btn-dark" style={{ width: '100%', padding: '16px' }}
                                    onClick={() => { closeBookingModal(); navigate('/services'); }}>
                                    Go to My Bookings
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Styles ──────────────────────────────────────────────────────────────────
const BK = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' },
    modal: { background: '#fff', borderRadius: '32px', padding: '48px', width: '100%', maxWidth: '520px', position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' },
    closeX: { position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#ccc' },
    title: { fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '30px' },
    steps: { display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 10px' },
    stepDot: { width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem' },
    stepLine: { flex: 1, height: '2px', margin: '0 8px' },
    stepHeader: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px' },
    formGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#1A1A1A', marginBottom: '8px' },
    input: { width: '100%', padding: '16px', borderRadius: '16px', border: 'none', background: '#F8F8F8', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
    err: { color: '#d32f2f', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' },
    btnRow: { display: 'flex', gap: '12px', marginTop: '30px' },
    cancelBtn: { flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#F5F5F5', color: '#1A1A1A', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
    nextBtn: { flex: 2, padding: '16px', borderRadius: '14px', fontSize: '0.95rem' },
    reviewCard: { background: '#F8F8F8', borderRadius: '20px', padding: '24px', marginBottom: '20px' },
    reviewRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px' },
    reviewLbl: { color: '#888', fontSize: '0.9rem', fontWeight: '600' },
    reviewVal: { color: '#1A1A1A', fontSize: '0.9rem', fontWeight: '700' },
    hint: { fontSize: '0.82rem', color: '#888', textAlign: 'center', lineHeight: '1.4' }
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
    // ── Tab ──
    tabRow: { display: 'flex', background: '#F5F5F5', borderRadius: '12px', padding: '4px', gap: '4px' },
    tabBtn: { flex: 1, padding: '10px 14px', border: 'none', borderRadius: '9px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', background: 'transparent', color: '#888', transition: 'all 0.15s' },
    tabActive: { background: '#fff', color: '#1A1A1A', fontWeight: '700', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    // ── Service rows ──
    svcRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', borderBottom: '1px solid #EEE', gap: '12px' },
    svcBookBtn: { padding: '10px 20px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 },
    svcBanner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#EEF2FF', borderRadius: '12px', padding: '16px 20px', cursor: 'pointer', gap: '12px' },
    // ── Property ──
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
