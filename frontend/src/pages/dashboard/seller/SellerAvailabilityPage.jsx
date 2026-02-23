import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SellerAvailabilityPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [slots, setSlots] = useState([]);
    const [slotDay, setSlotDay] = useState('Monday');
    const [slotTime, setSlotTime] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Load seller's listings from DB
    useEffect(() => {
        fetch(`${API}/lands/my`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                const lands = Array.isArray(data) ? data : [];
                setListings(lands);
                if (lands.length > 0) {
                    setSelectedId(String(lands[0].id));
                }
                setLoading(false);
            })
            .catch(() => { setListings([]); setLoading(false); });
    }, []);

    // Load slots for selected land from DB
    useEffect(() => {
        if (!selectedId) return;
        fetch(`${API}/availability/land/${selectedId}`)
            .then(r => r.json())
            .then(data => setSlots(Array.isArray(data) ? data : []))
            .catch(() => setSlots([]));
        setSaved(false);
    }, [selectedId]);

    const handleSelectListing = (id) => {
        setSelectedId(id);
        setError('');
    };

    const addSlot = () => {
        if (!slotTime.trim()) { setError('Please enter a time range.'); return; }
        // Prevent duplicate
        const dup = slots.find(s => s.day === slotDay && s.time_slot === slotTime.trim());
        if (dup) { setError('This slot already exists.'); return; }
        setSlots(prev => [...prev, { day: slotDay, time_slot: slotTime.trim() }]);
        setSlotTime('');
        setSaved(false);
        setError('');
    };

    const removeSlot = (idx) => {
        setSlots(prev => prev.filter((_, i) => i !== idx));
        setSaved(false);
    };

    const saveSlots = async () => {
        setSaving(true); setSaved(false); setError('');
        try {
            const res = await fetch(`${API}/availability/land/${selectedId}`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(slots),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to save.');
            } else {
                const updated = await res.json();
                setSlots(Array.isArray(updated) ? updated : slots);
                setSaved(true);
            }
        } catch { setError('Server error. Please try again.'); }
        setSaving(false);
    };

    const selectedListing = listings.find(l => String(l.id) === selectedId);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Site Visit Availability</h1>
                <p style={S.subtitle}>Set the days and times when buyers can visit your properties.</p>
            </div>

            {loading ? (
                <div style={S.empty}>Loading listings…</div>
            ) : listings.length === 0 ? (
                <div style={S.empty}>No listings found. Add a listing from <strong>My Listings</strong> first.</div>
            ) : (
                <div style={S.card}>
                    {/* Property Selector */}
                    <div style={S.selectorRow}>
                        <label style={S.sectionLabel}>Select Property</label>
                        <select value={selectedId} onChange={e => handleSelectListing(e.target.value)} style={S.select}>
                            {listings.map(l => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
                        </select>
                        {selectedListing && (
                            <span style={S.locationTag}>{selectedListing.village}, {selectedListing.district}</span>
                        )}
                    </div>

                    <hr style={S.divider} />

                    {/* Add Slot */}
                    <div style={S.addSection}>
                        <div style={S.sectionLabel}>Add Availability Slot</div>
                        <p style={S.hint}>Choose a day and enter a time range (e.g. 09:00 AM – 12:00 PM)</p>
                        {error && <div style={S.errMsg}>{error}</div>}
                        <div style={S.slotInputRow}>
                            <select
                                value={slotDay}
                                onChange={e => setSlotDay(e.target.value)}
                                style={{ ...S.input, flex: '0 0 160px' }}
                            >
                                {DAYS.map(d => <option key={d}>{d}</option>)}
                            </select>
                            <input
                                type="text"
                                placeholder="e.g. 09:00 AM – 12:00 PM"
                                value={slotTime}
                                onChange={e => setSlotTime(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSlot())}
                                style={{ ...S.input, flex: 1 }}
                            />
                            <button type="button" style={S.addBtn} onClick={addSlot}>Add Slot</button>
                        </div>
                    </div>

                    {/* Slot List */}
                    {slots.length > 0 ? (
                        <div style={S.slotListWrap}>
                            <div style={S.sectionLabel}>Scheduled Slots ({slots.length})</div>
                            <div style={S.slotGrid}>
                                {DAYS.map(day => {
                                    const daySlots = slots.map((s, i) => ({ ...s, _idx: i })).filter(s => s.day === day);
                                    if (daySlots.length === 0) return null;
                                    return (
                                        <div key={day} style={S.dayGroup}>
                                            <div style={S.dayLabel}>{day}</div>
                                            {daySlots.map(slot => (
                                                <div key={slot._idx} style={S.slotChip}>
                                                    <span style={S.slotTime}>{slot.time_slot}</span>
                                                    <button type="button" style={S.removeBtn} onClick={() => removeSlot(slot._idx)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p style={S.noSlots}>No availability slots added yet for this property.</p>
                    )}

                    {/* Footer */}
                    <div style={S.footer}>
                        {saved && <span style={S.savedMsg}>✓ Saved to database!</span>}
                        <button className="btn-dark" style={S.saveBtn} onClick={saveSlots} disabled={saving}>
                            {saving ? 'Saving…' : 'Save Availability'}
                        </button>
                    </div>
                </div>
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
    card: { background: '#fff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '36px', maxWidth: '780px' },
    selectorRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
    sectionLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em', color: '#888', marginBottom: '10px', display: 'block' },
    select: { padding: '11px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer', background: '#fff', minWidth: '200px' },
    locationTag: { fontSize: '0.8rem', color: '#999', background: '#f5f0ea', padding: '5px 12px', borderRadius: '20px', fontWeight: '600' },
    divider: { border: 'none', borderTop: '1px solid #f0ebe4', margin: '28px 0' },
    addSection: { marginBottom: '28px' },
    hint: { fontSize: '0.82rem', color: '#aaa', marginBottom: '12px', marginTop: '4px' },
    errMsg: { background: '#fdecea', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.84rem', marginBottom: '12px' },
    slotInputRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
    input: { padding: '11px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
    addBtn: { padding: '11px 22px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0 },
    slotListWrap: { marginBottom: '28px' },
    slotGrid: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' },
    dayGroup: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    dayLabel: { width: '96px', fontSize: '0.82rem', fontWeight: '700', color: '#555', flexShrink: 0 },
    slotChip: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f0ea', borderRadius: '8px', padding: '7px 12px', fontSize: '0.85rem' },
    slotTime: { color: '#333', fontWeight: '600' },
    removeBtn: { background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 0, fontWeight: '700' },
    noSlots: { color: '#bbb', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '28px' },
    footer: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #f0ebe4', paddingTop: '24px' },
    savedMsg: { fontSize: '0.85rem', color: '#27ae60', fontWeight: '700' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' },
};

export default SellerAvailabilityPage;
