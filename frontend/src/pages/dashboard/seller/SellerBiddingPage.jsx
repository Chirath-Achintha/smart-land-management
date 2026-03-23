import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

/* ── helpers ── */
const pad = (n) => String(n).padStart(2, '0');

const formatDateTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' });
};

const isoNow = () => new Date().toISOString();

const addDuration = (fromIso, hours, minutes) => {
    const d = new Date(fromIso);
    d.setHours(d.getHours() + parseInt(hours || 0));
    d.setMinutes(d.getMinutes() + parseInt(minutes || 0));
    return d.toISOString();
};

const isAfterNow = (iso) => iso && new Date(iso) > new Date();
const isBeforeNow = (iso) => iso && new Date(iso) <= new Date();

const SellerBiddingPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [form, setForm] = useState({
        open_for_bidding: false,
        starting_bid: '',
        bidding_start: '',   // ISO string — empty = start immediately
        bidding_end: '',     // ISO string — computed from start + duration
        durationHours: '1',
        durationMins: '0',
        useSchedule: false,
        scheduleDate: '',    // "YYYY-MM-DD"
        scheduleTime: '',    // "HH:MM"
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const fetchListings = () => {
        setLoading(true);
        fetch(`${API}/lands/my`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                const lands = Array.isArray(data) ? data : [];
                setListings(lands);
                if (lands.length > 0 && !selectedId) {
                    const firstId = lands[0].id || lands[0]._id;
                    setSelectedId(String(firstId));
                    setForm(extractForm(lands[0]));
                }
                setLoading(false);
            })
            .catch(() => { setListings([]); setLoading(false); });
    };

    useEffect(() => { fetchListings(); }, []);

    /* Reconstruct form state from a land object */
    const extractForm = (land) => {
        const bStart = land.bidding_start || '';
        const bEnd = land.bidding_end || '';

        // Estimate stored duration from start→end if both exist
        let hours = '1', mins = '0';
        if (bStart && bEnd) {
            const diffMs = new Date(bEnd) - new Date(bStart);
            if (diffMs > 0) {
                hours = String(Math.floor(diffMs / 3600000));
                mins = String(Math.floor((diffMs % 3600000) / 60000));
            }
        }

        // Schedule fields
        let useSchedule = false, scheduleDate = '', scheduleTime = '';
        if (bStart && isAfterNow(bStart)) {
            useSchedule = true;
            const d = new Date(bStart);
            scheduleDate = d.toISOString().split('T')[0];
            scheduleTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

        return {
            open_for_bidding: land.open_for_bidding || false,
            starting_bid: land.starting_bid || '',
            bidding_start: bStart,
            bidding_end: bEnd,
            durationHours: hours,
            durationMins: mins,
            useSchedule,
            scheduleDate,
            scheduleTime,
        };
    };

    const handleSelectListing = (id) => {
        setSelectedId(id);
        const found = listings.find(l => String(l.id || l._id) === id);
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

    /* Validate & compute bidding_start / bidding_end before saving */
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSaved(false);

        const hours = parseInt(form.durationHours || 0);
        const mins = parseInt(form.durationMins || 0);

        if (form.open_for_bidding && hours === 0 && mins === 0) {
            setError('Please set a bidding duration of at least 1 minute.');
            setSaving(false); return;
        }

        let startIso = '';
        let endIso = '';

        if (form.open_for_bidding) {
            if (form.useSchedule) {
                if (!form.scheduleDate || !form.scheduleTime) {
                    setError('Please enter both a schedule date and time.');
                    setSaving(false); return;
                }
                startIso = new Date(`${form.scheduleDate}T${form.scheduleTime}:00`).toISOString();
                if (new Date(startIso) <= new Date()) {
                    setError('Scheduled start time must be in the future.');
                    setSaving(false); return;
                }
            } else {
                startIso = isoNow();   // start immediately
            }
            endIso = addDuration(startIso, hours, mins);
        }

        const payload = {
            open_for_bidding: form.open_for_bidding,
            starting_bid: form.starting_bid ? parseFloat(form.starting_bid) : null,
            bidding_start: startIso || null,
            bidding_end: endIso || null,
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
                fetchListings();
            }
        } catch {
            setError('Server error. Please try again.');
        }
        setSaving(false);
    };

    const selectedListing = listings.find(l => String(l.id || l._id) === selectedId);

    /* Status helpers for quick list */
    const getStatus = (land) => {
        if (!land.open_for_bidding) return 'closed';
        const now = new Date();
        const start = land.bidding_start ? new Date(land.bidding_start) : null;
        const end = land.bidding_end ? new Date(land.bidding_end) : null;
        if (end && end <= now) return 'ended';
        if (start && start > now) return 'scheduled';
        return 'live';
    };

    /* Duration display helper */
    const fmtDuration = (h, m) => {
        const hp = parseInt(h || 0), mp = parseInt(m || 0);
        if (hp === 0 && mp === 0) return '—';
        const parts = [];
        if (hp) parts.push(`${hp}h`);
        if (mp) parts.push(`${mp}m`);
        return parts.join(' ');
    };

    /* Min datetime for schedule input — now + 1 min */
    const minDateTime = (() => {
        const d = new Date(Date.now() + 60000);
        return `${d.toISOString().split('T')[0]}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    })();

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Bidding Setup</h1>
                <p style={S.subtitle}>Configure which lands are open for bidding, set starting prices and auction duration.</p>
            </div>

            {loading ? (
                <div style={S.empty}>Loading your listings…</div>
            ) : listings.length === 0 ? (
                <div style={S.empty}>No listings found. Add a listing from <strong>My Listings</strong> first.</div>
            ) : (
                <form onSubmit={handleSave}>
                    <div className="ui-card" style={S.card}>

                        {/* ── Land Selector ── */}
                        <div style={S.sectionLabel}>Select Land</div>
                        <div style={S.selectorRow}>
                            <select value={selectedId} onChange={e => handleSelectListing(e.target.value)} style={S.select}>
                                {listings.map(l => {
                                    const lid = l.id || l._id;
                                    return <option key={lid} value={String(lid)}>{l.name}</option>
                                })}
                            </select>
                            {selectedListing && (
                                <span style={S.locationTag}>{selectedListing.village}, {selectedListing.district}</span>
                            )}
                        </div>

                        <hr style={S.divider} />

                        {/* ── Bidding Toggle ── */}
                        <div style={S.sectionLabel}>Bidding Status</div>
                        <label style={S.toggleRow}>
                            <input type="checkbox" name="open_for_bidding" checked={form.open_for_bidding} onChange={handleChange} style={{ display: 'none' }} />
                            <div style={{ ...S.toggleTrack, background: form.open_for_bidding ? 'var(--color-primary)' : 'rgba(38, 50, 56, 0.22)' }}>
                                <div style={{ ...S.toggleThumb, transform: form.open_for_bidding ? 'translateX(22px)' : 'translateX(2px)' }} />
                            </div>
                            <span style={S.toggleLabel}>{form.open_for_bidding ? 'Open for Bidding' : 'Bidding Closed'}</span>
                        </label>

                        {/* ── Bidding Details (when open) ── */}
                        {form.open_for_bidding && (
                            <>
                                <hr style={S.divider} />
                                <div style={S.sectionLabel}>Bidding Details</div>

                                {/* Starting bid */}
                                <div style={{ ...S.formGroup, marginBottom: '20px' }}>
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

                                {/* ── Duration Selector ── */}
                                <div style={S.durationBox}>
                                    <div style={S.durationHeader}>
                                        <span style={S.durationIcon}>⏱</span>
                                        <div>
                                            <div style={S.durationTitle}>Auction Duration</div>
                                            <div style={S.durationSub}>Bid will automatically close after this time</div>
                                        </div>
                                    </div>
                                    <div style={S.durationControls}>
                                        <div style={S.durationUnit}>
                                            <label style={S.label}>Hours</label>
                                            <div style={S.spinnerWrap}>
                                                <button type="button" style={S.spinBtn} onClick={() => setForm(f => ({ ...f, durationHours: String(Math.max(0, parseInt(f.durationHours || 0) - 1)) }))}>−</button>
                                                <input
                                                    name="durationHours"
                                                    type="number"
                                                    min="0"
                                                    max="999"
                                                    value={form.durationHours}
                                                    onChange={handleChange}
                                                    style={S.spinInput}
                                                />
                                                <button type="button" style={S.spinBtn} onClick={() => setForm(f => ({ ...f, durationHours: String(parseInt(f.durationHours || 0) + 1) }))}>+</button>
                                            </div>
                                        </div>
                                        <div style={{ ...S.durationUnit, alignSelf: 'flex-end', paddingBottom: '10px', fontSize: '1.4rem', color: 'var(--color-muted)', fontWeight: '300' }}>:</div>
                                        <div style={S.durationUnit}>
                                            <label style={S.label}>Minutes</label>
                                            <div style={S.spinnerWrap}>
                                                <button type="button" style={S.spinBtn} onClick={() => setForm(f => ({ ...f, durationMins: String(Math.max(0, parseInt(f.durationMins || 0) - 1)) }))}>−</button>
                                                <input
                                                    name="durationMins"
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={form.durationMins}
                                                    onChange={handleChange}
                                                    style={S.spinInput}
                                                />
                                                <button type="button" style={S.spinBtn} onClick={() => setForm(f => ({ ...f, durationMins: String(Math.min(59, parseInt(f.durationMins || 0) + 1)) }))}>+</button>
                                            </div>
                                        </div>
                                        <div style={S.durationPreview}>
                                            <div style={S.durationPreviewLabel}>Duration</div>
                                            <div style={S.durationPreviewVal}>{fmtDuration(form.durationHours, form.durationMins)}</div>
                                        </div>
                                    </div>

                                    {/* Quick presets */}
                                    <div style={S.presets}>
                                        {[
                                            { label: '30 min', h: 0, m: 30 },
                                            { label: '1 hr', h: 1, m: 0 },
                                            { label: '3 hrs', h: 3, m: 0 },
                                            { label: '6 hrs', h: 6, m: 0 },
                                            { label: '12 hrs', h: 12, m: 0 },
                                            { label: '24 hrs', h: 24, m: 0 },
                                            { label: '3 days', h: 72, m: 0 },
                                        ].map(p => (
                                            <button
                                                key={p.label}
                                                type="button"
                                                style={{
                                                    ...S.presetBtn,
                                                    ...(String(form.durationHours) === String(p.h) && String(form.durationMins) === String(p.m) ? S.presetBtnActive : {})
                                                }}
                                                onClick={() => setForm(f => ({ ...f, durationHours: String(p.h), durationMins: String(p.m) }))}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <hr style={S.divider} />

                                {/* ── Schedule Start ── */}
                                <div style={S.scheduleBox}>
                                    <label style={S.toggleRow}>
                                        <input type="checkbox" name="useSchedule" checked={form.useSchedule} onChange={handleChange} style={{ display: 'none' }} />
                                        <div style={{ ...S.toggleTrack, background: form.useSchedule ? 'var(--color-blue)' : 'rgba(38, 50, 56, 0.22)' }}>
                                            <div style={{ ...S.toggleThumb, transform: form.useSchedule ? 'translateX(22px)' : 'translateX(2px)' }} />
                                        </div>
                                        <div>
                                            <div style={S.toggleLabel}>Schedule Start</div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: '2px' }}>
                                                {form.useSchedule ? 'Bid will start automatically at the scheduled time' : 'Bid starts immediately when you save'}
                                            </div>
                                        </div>
                                    </label>

                                    {form.useSchedule && (
                                        <div style={S.scheduleInputRow}>
                                            <div style={S.formGroup}>
                                                <label style={S.label}>Start Date &amp; Time</label>
                                                <input
                                                    type="datetime-local"
                                                    name="scheduleDate"
                                                    min={minDateTime}
                                                    value={form.scheduleDate && form.scheduleTime ? `${form.scheduleDate}T${form.scheduleTime}` : ''}
                                                    onChange={(e) => {
                                                        const [date, time] = e.target.value.split('T');
                                                        setForm(f => ({ ...f, scheduleDate: date || '', scheduleTime: time || '' }));
                                                    }}
                                                    style={S.input}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Summary */}
                                {form.starting_bid && (parseInt(form.durationHours || 0) > 0 || parseInt(form.durationMins || 0) > 0) && (
                                    <div style={S.summaryBox}>
                                        <div style={S.summaryRow}>
                                            <span style={S.summaryIcon}>💰</span>
                                            Starting at <strong>Rs. {Number(form.starting_bid).toLocaleString()}</strong>
                                        </div>
                                        <div style={S.summaryRow}>
                                            <span style={S.summaryIcon}>{form.useSchedule ? '📅' : '🚀'}</span>
                                            {form.useSchedule && form.scheduleDate && form.scheduleTime
                                                ? <>Starts on <strong>{new Date(`${form.scheduleDate}T${form.scheduleTime}`).toLocaleString('en-LK', { dateStyle: 'medium', timeStyle: 'short' })}</strong></>
                                                : <>Starts <strong>immediately</strong> on save</>
                                            }
                                        </div>
                                        <div style={S.summaryRow}>
                                            <span style={S.summaryIcon}>⏱</span>
                                            Runs for <strong>{fmtDuration(form.durationHours, form.durationMins)}</strong>, then auto-closes
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* ── All Listings Quick View ── */}
                        <hr style={S.divider} />
                        <div style={S.sectionLabel}>All Listings — Bidding Status</div>
                        <div style={S.quickList}>
                            {listings.map(l => {
                                const status = getStatus(l);
                                return (
                                    <div
                                        key={l.id || l._id}
                                        style={{
                                            ...S.quickRow,
                                            background: String(l.id || l._id) === selectedId ? 'rgba(76, 175, 80, 0.12)' : '#fff',
                                            border: String(l.id || l._id) === selectedId ? '1px solid rgba(76, 175, 80, 0.4)' : '1px solid rgba(38, 50, 56, 0.1)',
                                        }}
                                        onClick={() => handleSelectListing(String(l.id || l._id))}
                                    >
                                        <div>
                                            <span style={S.quickName}>{l.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginLeft: '10px' }}>
                                                {l.village}, {l.district}
                                            </span>
                                        </div>
                                        <div style={S.quickRight}>
                                            {l.open_for_bidding && l.starting_bid && (
                                                <span style={S.quickPrice}>Rs. {Number(l.starting_bid).toLocaleString()}</span>
                                            )}
                                            {l.bidding_end && (
                                                <span style={S.quickDate}>ends {formatDateTime(l.bidding_end)}</span>
                                            )}
                                            <span style={{
                                                ...S.quickBadge,
                                                ...(status === 'live' ? S.quickOpen
                                                    : status === 'scheduled' ? S.quickPending
                                                        : status === 'ended' ? S.quickEnded
                                                            : S.quickClosed)
                                            }}>
                                                {status === 'live' ? '● Live'
                                                    : status === 'scheduled' ? '○ Scheduled'
                                                        : status === 'ended' ? '✓ Ended'
                                                            : 'Closed'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ── Save Footer ── */}
                        <div style={S.footer}>
                            {error && <div style={S.errMsg}>{error}</div>}
                            {saved && (
                                <div style={S.successToast}>
                                    <div style={S.toastIcon}>✓</div>
                                    <div>
                                        <div style={S.toastTitle}>Settings Saved</div>
                                        <div style={S.toastDesc}>
                                            <strong>{selectedListing?.name}</strong> is {form.open_for_bidding ? (form.useSchedule ? 'scheduled' : 'LIVE') : 'CLOSED'}.
                                        </div>
                                    </div>
                                </div>
                            )}
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
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-muted)', fontSize: '0.95rem' },
    empty: { textAlign: 'center', color: 'var(--color-muted)', marginTop: '80px', fontSize: '1rem' },
    card: { background: '#fff', borderRadius: '20px', padding: '36px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)', maxWidth: '820px' },
    sectionLabel: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-muted)', marginBottom: '12px', display: 'block' },
    selectorRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' },
    select: { padding: '11px 14px', border: '1px solid rgba(38, 50, 56, 0.18)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer', background: '#fff', minWidth: '240px', color: 'var(--color-dark)' },
    locationTag: { fontSize: '0.8rem', color: 'var(--color-dark)', background: 'rgba(139, 195, 74, 0.16)', padding: '5px 12px', borderRadius: '20px', fontWeight: '600' },
    divider: { border: 'none', borderTop: '1px solid rgba(38, 50, 56, 0.1)', margin: '24px 0' },
    toggleRow: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none', marginBottom: '4px' },
    toggleTrack: { width: '46px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
    toggleThumb: { position: 'absolute', top: '3px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
    toggleLabel: { fontSize: '0.9rem', fontWeight: '700', color: 'var(--color-dark)' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' },
    input: { padding: '12px 14px', border: '1px solid rgba(38, 50, 56, 0.16)', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box', color: 'var(--color-dark)' },

    // Duration
    durationBox: { background: 'rgba(139, 195, 74, 0.1)', border: '1px solid rgba(139, 195, 74, 0.24)', borderRadius: '12px', padding: '20px 24px', marginBottom: '4px' },
    durationHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' },
    durationIcon: { fontSize: '1.4rem' },
    durationTitle: { fontWeight: '700', color: 'var(--color-dark)', fontSize: '0.92rem' },
    durationSub: { fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '2px' },
    durationControls: { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' },
    durationUnit: { display: 'flex', flexDirection: 'column', gap: '6px' },
    spinnerWrap: { display: 'flex', alignItems: 'center', border: '1px solid rgba(38, 50, 56, 0.14)', borderRadius: '8px', overflow: 'hidden', background: '#fff' },
    spinBtn: { border: 'none', background: 'rgba(38, 50, 56, 0.08)', color: 'var(--color-dark)', fontWeight: '700', fontSize: '1.1rem', padding: '8px 14px', cursor: 'pointer', lineHeight: 1, userSelect: 'none' },
    spinInput: { border: 'none', outline: 'none', textAlign: 'center', width: '54px', fontSize: '1.05rem', fontWeight: '700', color: 'var(--color-dark)', fontFamily: "'DM Sans', sans-serif", padding: '8px 4px' },
    durationPreview: { marginLeft: 'auto', textAlign: 'right', paddingLeft: '16px', borderLeft: '1px solid rgba(38, 50, 56, 0.12)' },
    durationPreviewLabel: { fontSize: '0.68rem', color: 'var(--color-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' },
    durationPreviewVal: { fontSize: '1.6rem', fontWeight: '800', color: 'var(--color-dark)', letterSpacing: '-0.5px' },
    presets: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    presetBtn: { padding: '5px 13px', border: '1px solid rgba(38, 50, 56, 0.14)', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', background: '#fff', color: 'var(--color-dark)', transition: 'all 0.15s' },
    presetBtnActive: { background: 'var(--color-primary)', color: '#fff', border: '1px solid var(--color-primary)' },

    // Schedule
    scheduleBox: { background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.24)', borderRadius: '12px', padding: '20px 24px', marginBottom: '4px' },
    scheduleInputRow: { marginTop: '16px', maxWidth: '320px' },

    // Summary
    summaryBox: { background: 'rgba(76, 175, 80, 0.14)', border: '1px solid rgba(76, 175, 80, 0.28)', borderRadius: '10px', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' },
    summaryRow: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: '#2e7d32' },
    summaryIcon: { fontSize: '1rem' },

    // Quick list
    quickList: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' },
    quickRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.15s' },
    quickName: { fontWeight: '700', fontSize: '0.88rem', color: 'var(--color-dark)' },
    quickRight: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' },
    quickPrice: { fontSize: '0.8rem', fontWeight: '700', color: 'var(--color-dark)' },
    quickDate: { fontSize: '0.72rem', color: 'var(--color-muted)' },
    quickBadge: { fontSize: '0.72rem', fontWeight: '700', padding: '3px 10px', borderRadius: '20px' },
    quickOpen: { background: 'rgba(76, 175, 80, 0.18)', color: '#2e7d32', border: '1px solid rgba(76, 175, 80, 0.4)' },
    quickPending: { background: 'rgba(33, 150, 243, 0.14)', color: '#145b97', border: '1px solid rgba(33, 150, 243, 0.35)' },
    quickEnded: { background: 'rgba(161, 136, 127, 0.18)', color: '#6d4c41', border: '1px solid rgba(161, 136, 127, 0.45)' },
    quickClosed: { background: 'rgba(38, 50, 56, 0.12)', color: 'var(--color-muted)', border: '1px solid rgba(38, 50, 56, 0.2)' },

    // Footer
    footer: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid rgba(38, 50, 56, 0.1)', paddingTop: '24px', flexWrap: 'wrap' },
    errMsg: { fontSize: '0.85rem', color: '#7a4f41', fontWeight: '600' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' },
    successToast: { background: '#fff', border: '1px solid rgba(76, 175, 80, 0.4)', borderRadius: '12px', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 4px 16px rgba(76,175,80,0.15)' },
    toastIcon: { background: 'var(--color-primary)', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem' },
    toastTitle: { fontWeight: '800', fontSize: '0.88rem', color: 'var(--color-dark)', marginBottom: '2px' },
    toastDesc: { fontSize: '0.8rem', color: 'var(--color-muted)' },
};

export default SellerBiddingPage;
