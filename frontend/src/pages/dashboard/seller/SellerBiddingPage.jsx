import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const SellerBiddingPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [form, setForm] = useState({ open_for_bidding: false, starting_bid: '', bidding_end: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // ── Load seller's listings from DB
    const fetchListings = () => {
        setLoading(true);
        fetch(`${API}/lands/my`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                const lands = Array.isArray(data) ? data : [];
                setListings(lands);
                if (lands.length > 0 && !selectedId) {
                    const first = lands[0];
                    setSelectedId(String(first.id));
                    setForm(extractForm(first));
                }
                setLoading(false);
            })
            .catch(() => { setListings([]); setLoading(false); });
    };

    useEffect(() => { fetchListings(); }, []);

    const extractForm = (land) => ({
        open_for_bidding: land.open_for_bidding || false,
        starting_bid: land.starting_bid || '',
        bidding_end: land.bidding_end || '',
    });

    const handleSelectListing = (id) => {
        setSelectedId(id);
        const found = listings.find(l => String(l.id) === id);
        if (found) setForm(extractForm(found));
        setSaved(false);
        setError('');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
        setSaved(false);
        setError('');
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSaved(false);

        const payload = {
            open_for_bidding: form.open_for_bidding,
            starting_bid: form.starting_bid ? parseFloat(form.starting_bid) : null,
            bidding_end: form.bidding_end || null,
        };

        try {
            const res = await fetch(`${API}/lands/${selectedId}`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to save');
            } else {
                setSaved(true);
                // Refresh list to show updated status
                fetchListings();
            }
        } catch {
            setError('Server error. Please try again.');
        }
        setSaving(false);
    };

    const selectedListing = listings.find(l => String(l.id) === selectedId);
    const today = new Date().toISOString().split('T')[0];
    const isLive = form.open_for_bidding && form.bidding_end >= today;

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Bidding Setup</h1>
                <p style={S.subtitle}>Configure which lands are open for bidding, set starting prices and closing dates.</p>
            </div>

            {loading ? (
                <div style={S.empty}>Loading your listings…</div>
            ) : listings.length === 0 ? (
                <div style={S.empty}>No listings found. Add a listing from <strong>My Listings</strong> first.</div>
            ) : (
                <form onSubmit={handleSave}>
                    <div style={S.card}>

                        {/* ── Land Selector ── */}
                        <div style={S.sectionLabel}>Select Land</div>
                        <div style={S.selectorRow}>
                            <select
                                value={selectedId}
                                onChange={e => handleSelectListing(e.target.value)}
                                style={S.select}
                            >
                                {listings.map(l => (
                                    <option key={l.id} value={String(l.id)}>{l.name}</option>
                                ))}
                            </select>
                            {selectedListing && (
                                <span style={S.locationTag}>{selectedListing.village}, {selectedListing.district}</span>
                            )}
                            {isLive && <span style={S.liveBadge}>LIVE</span>}
                        </div>

                        <hr style={S.divider} />

                        {/* ── Bidding Toggle ── */}
                        <div style={S.sectionLabel}>Bidding Status</div>
                        <label style={S.toggleRow}>
                            <input
                                type="checkbox"
                                name="open_for_bidding"
                                checked={form.open_for_bidding}
                                onChange={handleChange}
                                style={{ display: 'none' }}
                            />
                            <div style={{ ...S.toggleTrack, background: form.open_for_bidding ? '#1A1A1A' : '#ddd' }}>
                                <div style={{ ...S.toggleThumb, transform: form.open_for_bidding ? 'translateX(22px)' : 'translateX(2px)' }} />
                            </div>
                            <span style={S.toggleLabel}>
                                {form.open_for_bidding ? 'Open for Bidding' : 'Bidding Closed'}
                            </span>
                        </label>

                        {/* ── Bidding Details (when open) ── */}
                        {form.open_for_bidding && (
                            <>
                                <hr style={S.divider} />
                                <div style={S.sectionLabel}>Bidding Details</div>
                                <div style={S.fieldsGrid}>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Starting Bid Price (Rs.) *</label>
                                        <input
                                            name="starting_bid"
                                            type="number"
                                            min="1"
                                            value={form.starting_bid}
                                            onChange={handleChange}
                                            style={S.input}
                                            placeholder="e.g. 5000000"
                                            required
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Bidding End Date *</label>
                                        <input
                                            name="bidding_end"
                                            type="date"
                                            value={form.bidding_end}
                                            min={today}
                                            onChange={handleChange}
                                            style={S.input}
                                            required
                                        />
                                    </div>
                                </div>

                                {form.bidding_end && form.starting_bid && (
                                    <div style={S.periodSummary}>
                                        Bidding closes on <strong>{form.bidding_end}</strong> &nbsp;·&nbsp;
                                        Starting at <strong>Rs. {Number(form.starting_bid).toLocaleString()}</strong>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── All Listings Quick View ── */}
                        <hr style={S.divider} />
                        <div style={S.sectionLabel}>All Listings — Bidding Status</div>
                        <div style={S.quickList}>
                            {listings.map(l => {
                                const open = l.open_for_bidding;
                                const live = open && l.bidding_end >= today;
                                return (
                                    <div
                                        key={l.id}
                                        style={{
                                            ...S.quickRow,
                                            background: String(l.id) === selectedId ? '#f5f0ea' : '#fdfaf7',
                                            border: String(l.id) === selectedId ? '1px solid #ddd' : '1px solid #f0ebe4',
                                        }}
                                        onClick={() => handleSelectListing(String(l.id))}
                                    >
                                        <div>
                                            <span style={S.quickName}>{l.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#bbb', marginLeft: '10px' }}>
                                                {l.village}, {l.district}
                                            </span>
                                        </div>
                                        <div style={S.quickRight}>
                                            {open && l.starting_bid && (
                                                <span style={S.quickPrice}>Rs. {Number(l.starting_bid).toLocaleString()}</span>
                                            )}
                                            {open && l.bidding_end && (
                                                <span style={S.quickDate}>ends {l.bidding_end}</span>
                                            )}
                                            <span style={{
                                                ...S.quickBadge,
                                                ...(live ? S.quickOpen : (open ? S.quickPending : S.quickClosed))
                                            }}>
                                                {live ? '● Live' : open ? '○ Scheduled' : 'Closed'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Save Footer ── */}
                        <div style={S.footer}>
                            {error && <span style={S.errMsg}>{error}</span>}
                            {saved && <span style={S.savedMsg}>✓ Saved to database!</span>}
                            <button type="submit" className="btn-dark" style={S.saveBtn} disabled={saving}>
                                {saving ? 'Saving…' : 'Save Settings'}
                            </button>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    empty: { textAlign: 'center', color: '#aaa', marginTop: '80px', fontSize: '1rem' },
    card: { background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', maxWidth: '820px' },
    sectionLabel: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '12px', display: 'block' },
    selectorRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' },
    select: { padding: '11px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer', background: '#fff', minWidth: '240px' },
    locationTag: { fontSize: '0.8rem', color: '#999', background: '#f5f0ea', padding: '5px 12px', borderRadius: '20px', fontWeight: '600' },
    liveBadge: { fontSize: '0.7rem', fontWeight: '800', color: '#fff', background: '#e74c3c', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.07em' },
    divider: { border: 'none', borderTop: '1px solid #f0ebe4', margin: '24px 0' },
    toggleRow: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', marginBottom: '4px' },
    toggleTrack: { width: '46px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
    toggleThumb: { position: 'absolute', top: '3px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
    toggleLabel: { fontSize: '0.9rem', fontWeight: '700', color: '#333' },
    fieldsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' },
    input: { padding: '12px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' },
    periodSummary: { background: '#f5f0ea', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem', color: '#555', lineHeight: 1.6, marginBottom: '8px' },
    quickList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
    quickRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' },
    quickName: { fontWeight: '700', fontSize: '0.88rem', color: '#1A1A1A' },
    quickRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    quickPrice: { fontSize: '0.8rem', fontWeight: '700', color: '#555' },
    quickDate: { fontSize: '0.75rem', color: '#bbb' },
    quickBadge: { fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' },
    quickOpen: { background: '#eafaf1', color: '#27ae60', border: '1px solid #27ae60' },
    quickPending: { background: '#eaf4fb', color: '#1565c0', border: '1px solid #90caf9' },
    quickClosed: { background: '#f5f0ea', color: '#aaa', border: '1px solid #ddd' },
    footer: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #f0ebe4', paddingTop: '24px' },
    savedMsg: { fontSize: '0.85rem', color: '#27ae60', fontWeight: '700' },
    errMsg: { fontSize: '0.85rem', color: '#d32f2f', fontWeight: '600' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' },
};

export default SellerBiddingPage;
