import React, { useState, useEffect } from 'react';

const SELLER_ID = 'sunil_perera';

const SellerBiddingPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [form, setForm] = useState({ openForBidding: false, startingBid: '', biddingStart: '', biddingEnd: '' });
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(`seller_listings_${SELLER_ID}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            setListings(parsed);
            if (parsed.length > 0) {
                const first = parsed[0];
                setSelectedId(String(first.id));
                setForm(extractBidForm(first));
            }
        }
    }, []);

    function extractBidForm(l) {
        return {
            openForBidding: l.openForBidding || false,
            startingBid: l.startingBid || '',
            biddingStart: l.biddingStart || '',
            biddingEnd: l.biddingEnd || '',
        };
    }

    const handleSelectListing = (id) => {
        setSelectedId(id);
        const found = listings.find(l => String(l.id) === id);
        setForm(extractBidForm(found || {}));
        setSaved(false);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
        setSaved(false);
    };

    const handleSave = (e) => {
        e.preventDefault();
        const updated = listings.map(l =>
            String(l.id) === selectedId
                ? { ...l, openForBidding: form.openForBidding, startingBid: form.startingBid ? parseFloat(form.startingBid) : '', biddingStart: form.biddingStart, biddingEnd: form.biddingEnd }
                : l
        );
        setListings(updated);
        localStorage.setItem(`seller_listings_${SELLER_ID}`, JSON.stringify(updated));
        setSaved(true);
    };

    const selectedListing = listings.find(l => String(l.id) === selectedId);
    const now = new Date().toISOString().split('T')[0];
    const isLive = form.openForBidding && form.biddingStart <= now && form.biddingEnd >= now;

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Bidding Setup</h1>
                <p style={S.subtitle}>Configure which lands are open for bidding, set starting prices and bidding periods.</p>
            </div>

            {listings.length === 0 ? (
                <div style={S.empty}>No listings found. Add a listing first.</div>
            ) : (
                <form onSubmit={handleSave}>
                    <div style={S.card}>
                        {/* Land Selector */}
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

                        {/* Open for Bidding toggle */}
                        <div style={S.sectionLabel}>Bidding Status</div>
                        <label style={S.toggleRow}>
                            <input type="checkbox" name="openForBidding" checked={form.openForBidding} onChange={handleChange} style={{ display: 'none' }} />
                            <div style={{ ...S.toggleTrack, background: form.openForBidding ? '#1A1A1A' : '#ddd' }}>
                                <div style={{ ...S.toggleThumb, transform: form.openForBidding ? 'translateX(22px)' : 'translateX(2px)' }} />
                            </div>
                            <span style={S.toggleLabel}>{form.openForBidding ? 'Open for Bidding' : 'Bidding Closed'}</span>
                        </label>

                        {/* Fields only when open */}
                        {form.openForBidding && (
                            <>
                                <hr style={S.divider} />
                                <div style={S.sectionLabel}>Bidding Details</div>
                                <div style={S.fieldsGrid}>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Starting Bid Price (Rs.) *</label>
                                        <input
                                            name="startingBid"
                                            type="number"
                                            min="1"
                                            value={form.startingBid}
                                            onChange={handleChange}
                                            style={S.input}
                                            placeholder="e.g. 5000000"
                                            required
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Bidding Start Date *</label>
                                        <input
                                            name="biddingStart"
                                            type="date"
                                            value={form.biddingStart}
                                            onChange={handleChange}
                                            style={S.input}
                                            required
                                        />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Bidding End Date *</label>
                                        <input
                                            name="biddingEnd"
                                            type="date"
                                            value={form.biddingEnd}
                                            min={form.biddingStart || undefined}
                                            onChange={handleChange}
                                            style={S.input}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Period summary */}
                                {form.biddingStart && form.biddingEnd && (
                                    <div style={S.periodSummary}>
                                        Bidding period: <strong>{form.biddingStart}</strong> → <strong>{form.biddingEnd}</strong>
                                        {form.startingBid && (
                                            <> &nbsp;·&nbsp; Starting at <strong>Rs. {Number(form.startingBid).toLocaleString()}</strong></>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* All listings at a glance */}
                        <hr style={S.divider} />
                        <div style={S.sectionLabel}>All Listings — Bidding Status</div>
                        <div style={S.quickList}>
                            {listings.map(l => {
                                const open = l.openForBidding;
                                return (
                                    <div key={l.id} style={S.quickRow} onClick={() => handleSelectListing(String(l.id))}>
                                        <span style={S.quickName}>{l.name}</span>
                                        <div style={S.quickRight}>
                                            {open && l.startingBid && (
                                                <span style={S.quickPrice}>Rs. {Number(l.startingBid).toLocaleString()}</span>
                                            )}
                                            {open && l.biddingEnd && (
                                                <span style={S.quickDate}>ends {l.biddingEnd}</span>
                                            )}
                                            <span style={{ ...S.quickBadge, ...(open ? S.quickOpen : S.quickClosed) }}>
                                                {open ? 'Open' : 'Closed'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div style={S.footer}>
                            {saved && <span style={S.savedMsg}>Bidding settings saved.</span>}
                            <button type="submit" className="btn-dark" style={S.saveBtn}>Save Settings</button>
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
    empty: { textAlign: 'center', color: '#aaa', marginTop: '80px' },
    card: { background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', maxWidth: '800px' },
    sectionLabel: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: '12px', display: 'block' },
    selectorRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' },
    select: { padding: '11px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer', background: '#fff', minWidth: '220px' },
    locationTag: { fontSize: '0.8rem', color: '#999', background: '#f5f0ea', padding: '5px 12px', borderRadius: '20px', fontWeight: '600' },
    liveBadge: { fontSize: '0.7rem', fontWeight: '800', color: '#fff', background: '#e74c3c', padding: '4px 10px', borderRadius: '20px', letterSpacing: '0.07em', animation: 'pulse 1.5s infinite' },
    divider: { border: 'none', borderTop: '1px solid #f0ebe4', margin: '24px 0' },
    toggleRow: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', marginBottom: '4px' },
    toggleTrack: { width: '46px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
    toggleThumb: { position: 'absolute', top: '3px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
    toggleLabel: { fontSize: '0.9rem', fontWeight: '700', color: '#333' },
    fieldsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#888' },
    input: { padding: '12px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' },
    periodSummary: { background: '#f5f0ea', borderRadius: '8px', padding: '12px 16px', fontSize: '0.85rem', color: '#555', lineHeight: 1.6 },
    quickList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
    quickRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#fdfaf7', borderRadius: '10px', cursor: 'pointer', border: '1px solid #f0ebe4', transition: 'background 0.15s' },
    quickName: { fontWeight: '700', fontSize: '0.88rem', color: '#1A1A1A' },
    quickRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    quickPrice: { fontSize: '0.8rem', fontWeight: '700', color: '#555' },
    quickDate: { fontSize: '0.75rem', color: '#bbb' },
    quickBadge: { fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' },
    quickOpen: { background: '#eafaf1', color: '#2ecc71', border: '1px solid #2ecc71' },
    quickClosed: { background: '#f5f0ea', color: '#aaa', border: '1px solid #ddd' },
    footer: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #f0ebe4', paddingTop: '24px' },
    savedMsg: { fontSize: '0.85rem', color: '#2ecc71', fontWeight: '700' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' },
};

export default SellerBiddingPage;
