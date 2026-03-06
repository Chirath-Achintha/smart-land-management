import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const BiddingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [land, setLand] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myBid, setMyBid] = useState('');
    const [myMessage, setMyMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [timeLeft, setTimeLeft] = useState('');
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);
    const [isAuctionStarted, setIsAuctionStarted] = useState(true);
    const [timeToStart, setTimeToStart] = useState('');

    const token = localStorage.getItem('access_token');
    const isLoggedIn = !!token;

    // ── Fetch land details ──────────────────────────────────────────────────
    useEffect(() => {
        fetch(`${API_BASE_URL}/lands/${id}`)
            .then(r => r.json())
            .then(data => { setLand(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    // ── Fetch bids (refresh every 15 seconds) ──────────────────────────────
    const fetchBids = useCallback(() => {
        fetch(`${API_BASE_URL}/bids/land/${id}`)
            .then(r => r.json())
            .then(data => setBids(Array.isArray(data) ? data : []))
            .catch(() => setBids([]));
    }, [id]);

    useEffect(() => {
        fetchBids();
        const interval = setInterval(fetchBids, 15000);
        return () => clearInterval(interval);
    }, [fetchBids]);

    // ── Countdown timer (handles both pre-start and end countdowns) ─────────
    useEffect(() => {
        if (!land) return;

        const parseISO = (str) => {
            if (!str) return null;
            // Handle both "YYYY-MM-DD" (legacy date-only) and full ISO strings
            if (!str.includes('T')) return new Date(str + 'T23:59:59');
            return new Date(str);
        };

        const tick = () => {
            const now = Date.now();
            const startDate = parseISO(land.bidding_start);
            const endDate = parseISO(land.bidding_end);

            // Check if auction hasn't started yet
            if (startDate && startDate.getTime() > now) {
                setIsAuctionStarted(false);
                setIsAuctionEnded(false);
                const dist = startDate.getTime() - now;
                const days = Math.floor(dist / 86400000);
                const hours = Math.floor((dist % 86400000) / 3600000);
                const mins = Math.floor((dist % 3600000) / 60000);
                const secs = Math.floor((dist % 60000) / 1000);
                setTimeToStart(days > 0
                    ? `${days}d ${hours}h ${mins}m ${secs}s`
                    : `${hours}h ${mins}m ${secs}s`);
                return;
            }

            // Auction has started (or no start date set)
            setIsAuctionStarted(true);

            if (!endDate) {
                setTimeLeft('No end time set');
                return;
            }

            const distance = endDate.getTime() - now;
            if (distance <= 0) {
                setTimeLeft('AUCTION ENDED');
                setIsAuctionEnded(true);
            } else {
                setIsAuctionEnded(false);
                const days = Math.floor(distance / 86400000);
                const hours = Math.floor((distance % 86400000) / 3600000);
                const mins = Math.floor((distance % 3600000) / 60000);
                const secs = Math.floor((distance % 60000) / 1000);
                setTimeLeft(days > 0
                    ? `${days}d ${hours}h ${mins}m ${secs}s`
                    : `${hours}h ${mins}m ${secs}s`);
            }
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [land?.bidding_start, land?.bidding_end]);

    // ── Derived values ──────────────────────────────────────────────────────
    const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);
    const highestBid = sortedBids.length > 0 ? sortedBids[0].amount : (land?.starting_bid || 0);

    // ── Submit bid ──────────────────────────────────────────────────────────
    const handlePlaceBid = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');

        if (!isLoggedIn) {
            navigate('/login');
            return;
        }

        const amount = parseFloat(myBid);
        if (!amount || amount <= highestBid) {
            setError(`Your bid must be higher than the current highest: Rs. ${Number(highestBid).toLocaleString()}`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${API_BASE_URL}/bids/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    land_id: id,
                    amount: amount,
                    message: myMessage.trim() || null,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to place bid. Please try again.');
            } else {
                setSuccess('🎉 Bid placed successfully!');
                setMyBid('');
                setMyMessage('');
                fetchBids();
                setTimeout(() => setSuccess(''), 4000);
            }
        } catch {
            setError('Cannot reach the server. Please check your connection.');
        }
        setSubmitting(false);
    };

    // ── Loading / not found ─────────────────────────────────────────────────
    if (loading) return (
        <div style={{ background: '#FAF6F1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: '#999', fontSize: '1.1rem', fontFamily: "'DM Sans', sans-serif" }}>Loading auction…</div>
        </div>
    );

    if (!land) return (
        <div style={{ background: '#FAF6F1', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1A1A1A' }}>Land not found</div>
            <button onClick={() => navigate('/lands')} style={S.darkBtn}>← Back to Listings</button>
        </div>
    );

    // ── Determine what the timer card shows ────────────────────────────────
    const isScheduled = !isAuctionStarted;
    const canBid = land.open_for_bidding && isAuctionStarted && !isAuctionEnded;

    const fmtEndDate = (iso) => {
        if (!iso) return '';
        const d = new Date(iso);
        return d.toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div style={{ background: '#FAF6F1', minHeight: '100vh', paddingBottom: '80px', fontFamily: "'DM Sans', sans-serif" }}>
            <div style={S.container}>
                <button onClick={() => navigate(`/lands/${id}`)} style={S.backLink}>← Back to Land Details</button>

                <div style={S.layout}>
                    {/* ── LEFT COLUMN ─────────────────────────────────── */}
                    <div style={S.leftCol}>

                        {/* Land summary card */}
                        <div style={S.landCard}>
                            <img
                                src={land.image_url
                                    ? land.image_url.split(',')[0]
                                    : 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80'}
                                alt={land.name}
                                style={S.landImg}
                            />
                            <div style={S.landInfo}>
                                <div style={S.landTag}>{land.land_type} Land</div>
                                <h1 style={S.title}>{land.name}</h1>
                                <p style={S.loc}>📍 {land.village}, {land.district}</p>
                                <div style={S.priceRow}>
                                    <div>
                                        <span style={S.priceLabel}>BASE PRICE</span>
                                        <span style={S.priceVal}>
                                            Rs. {Number(land.starting_bid || land.total_price).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={S.priceLabel}>CURRENT HIGHEST</span>
                                        <span style={{ ...S.priceVal, color: '#27ae60' }}>
                                            Rs. {Number(highestBid).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Timer card (scheduled / live / ended) ── */}
                        {isScheduled ? (
                            <div style={{ ...S.timerCard, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                                <span style={S.timerLabel}>⏳ AUCTION STARTS IN</span>
                                <span style={{ ...S.timerVal, color: '#f9ca24' }}>{timeToStart}</span>
                                {land.bidding_start && (
                                    <span style={S.timerDate}>
                                        Starts: {fmtEndDate(land.bidding_start)}
                                    </span>
                                )}
                                {land.bidding_end && (
                                    <span style={{ ...S.timerDate, marginTop: '2px' }}>
                                        Closes: {fmtEndDate(land.bidding_end)}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div style={S.timerCard}>
                                <span style={S.timerLabel}>
                                    {isAuctionEnded ? '🔴 AUCTION ENDED' : '🟢 BIDDING ENDS IN'}
                                </span>
                                <span style={{ ...S.timerVal, color: isAuctionEnded ? '#e74c3c' : '#fff' }}>
                                    {timeLeft || (land.bidding_end ? 'Calculating…' : 'No end time set')}
                                </span>
                                {land.bidding_end && (
                                    <span style={S.timerDate}>
                                        Closes: {fmtEndDate(land.bidding_end)}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Bid input form */}
                        {canBid ? (
                            <div style={S.inputCard}>
                                <h3 style={S.inputTitle}>Place Your Bid</h3>

                                {!isLoggedIn && (
                                    <div style={S.warningBox}>
                                        You must <button onClick={() => navigate('/login')} style={S.inlineLink}>log in</button> to place a bid.
                                    </div>
                                )}
                                {error && <div style={S.errorBox}>{error}</div>}
                                {success && <div style={S.successBox}>{success}</div>}

                                <form onSubmit={handlePlaceBid} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={S.inputGroup}>
                                        <span style={S.currencyPrefix}>Rs.</span>
                                        <input
                                            type="number"
                                            placeholder={`Min. Rs. ${Number(highestBid + 1).toLocaleString()}`}
                                            style={S.input}
                                            value={myBid}
                                            onChange={(e) => setMyBid(e.target.value)}
                                            min={highestBid + 1}
                                            required
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Add a message to the seller (optional)"
                                        style={{ ...S.input, padding: '12px 14px' }}
                                        value={myMessage}
                                        onChange={(e) => setMyMessage(e.target.value)}
                                        maxLength={200}
                                    />
                                    <button type="submit" style={S.darkBtn} disabled={submitting}>
                                        {submitting ? 'Submitting…' : 'Confirm Bid'}
                                    </button>
                                </form>
                                <p style={S.note}>* Your bid must be higher than the current highest bid.</p>
                            </div>
                        ) : (
                            <div style={S.closedBox}>
                                {isScheduled
                                    ? '📅 This auction hasn\'t started yet. Come back when it\'s live!'
                                    : isAuctionEnded
                                        ? '🔒 This auction has ended.'
                                        : '🔒 Bidding is currently closed for this property.'}
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: Bids ──────────────────────────── */}
                    <div style={S.rightCol}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '14px', borderBottom: '2px solid #f5f0ea' }}>
                            <h2 style={S.sectionTitle}>Recent Bids</h2>
                            <span style={S.bidCount}>{bids.length} bid{bids.length !== 1 ? 's' : ''}</span>
                        </div>

                        {sortedBids.length === 0 ? (
                            <div style={S.noBids}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏷️</div>
                                <div style={{ fontWeight: '700', color: '#555', marginBottom: '6px' }}>No bids yet</div>
                                <div style={{ color: '#aaa', fontSize: '0.875rem' }}>Be the first to place a bid!</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {sortedBids.map((bid, i) => (
                                    <div key={bid.id} style={{
                                        ...S.bidItem,
                                        borderLeft: i === 0 ? '4px solid #27ae60' : '4px solid #f0ebe4',
                                        background: i === 0 ? '#f0fdf4' : '#fafaf9',
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ ...S.avatar, background: i === 0 ? '#27ae60' : '#1A1A1A' }}>
                                                    {(bid.buyer_name || 'B').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={S.bidderName}>{bid.buyer_name || 'Bidder'}</div>
                                                    {i === 0 && <div style={S.highestTag}>🏆 Highest Bid</div>}
                                                </div>
                                            </div>
                                            <span style={S.bidTime}>
                                                {bid.created_at
                                                    ? new Date(bid.created_at).toLocaleString('en-LK', { dateStyle: 'short', timeStyle: 'short' })
                                                    : ''}
                                            </span>
                                        </div>
                                        <div style={S.bidAmount}>Rs. {Number(bid.amount).toLocaleString()}</div>
                                        {bid.message && (
                                            <div style={S.bidMsg}>"{bid.message}"</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    container: { maxWidth: '1150px', margin: '0 auto', padding: '40px 24px' },
    backLink: { background: 'none', border: 'none', color: '#555', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem', marginBottom: '28px', display: 'inline-block', padding: 0, fontFamily: "'DM Sans', sans-serif" },
    layout: { display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '32px', alignItems: 'start' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: '20px' },

    // Land card
    landCard: { background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
    landImg: { width: '100%', height: '220px', objectFit: 'cover', display: 'block' },
    landInfo: { padding: '24px' },
    landTag: { display: 'inline-block', background: '#FAF6F1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' },
    title: { fontSize: '1.6rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', marginTop: 0 },
    loc: { color: '#666', fontSize: '0.9rem', margin: '0 0 0 0' },
    priceRow: { display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #f0ebe4', paddingTop: '16px' },
    priceLabel: { display: 'block', fontSize: '0.68rem', color: '#999', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' },
    priceVal: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A' },

    // Timer
    timerCard: { background: '#1A1A1A', borderRadius: '16px', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' },
    timerLabel: { fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
    timerVal: { fontSize: '1.9rem', fontWeight: '800', letterSpacing: '2px', color: '#fff' },
    timerDate: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' },

    // Input
    inputCard: { background: '#fff', padding: '28px', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' },
    inputTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A', marginTop: 0, marginBottom: '18px' },
    inputGroup: { position: 'relative' },
    currencyPrefix: { position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#555', fontSize: '0.95rem', zIndex: 1 },
    input: { width: '100%', padding: '13px 14px 13px 46px', borderRadius: '10px', border: '1.5px solid #e5e0da', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif", background: '#fdfaf7' },
    darkBtn: { padding: '14px 24px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif", width: '100%' },
    note: { fontSize: '0.75rem', color: '#bbb', marginTop: '10px', fontStyle: 'italic' },
    closedBox: { background: '#f5f0ea', borderRadius: '12px', padding: '20px', textAlign: 'center', fontWeight: '600', color: '#888', fontSize: '0.95rem' },

    // Alerts
    warningBox: { background: '#fff8e1', color: '#e65100', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '14px', fontWeight: '500' },
    errorBox: { background: '#fdecea', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', marginBottom: '14px' },
    successBox: { background: '#eafaf1', color: '#27ae60', padding: '10px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem', marginBottom: '14px' },
    inlineLink: { background: 'none', border: 'none', color: '#e65100', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: 0, fontSize: 'inherit' },

    // Right column
    rightCol: { background: '#fff', padding: '28px', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', position: 'sticky', top: '100px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    bidCount: { background: '#1A1A1A', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '0.78rem', fontWeight: '700' },

    // Bid items
    bidItem: { padding: '16px', borderRadius: '12px', paddingLeft: '14px', transition: 'background 0.15s' },
    avatar: { width: '36px', height: '36px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.95rem', flexShrink: 0 },
    bidderName: { fontWeight: '700', color: '#1A1A1A', fontSize: '0.9rem' },
    highestTag: { fontSize: '0.7rem', color: '#27ae60', fontWeight: '700' },
    bidTime: { fontSize: '0.7rem', color: '#bbb', whiteSpace: 'nowrap', marginLeft: '8px' },
    bidAmount: { fontSize: '1.15rem', fontWeight: '800', color: '#1A1A1A', marginTop: '4px' },
    bidMsg: { fontSize: '0.8rem', color: '#999', fontStyle: 'italic', marginTop: '4px' },
    noBids: { textAlign: 'center', padding: '48px 16px' },
};

export default BiddingPage;
