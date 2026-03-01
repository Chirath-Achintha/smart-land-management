import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SellerAvailabilityPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [propertySlots, setPropertySlots] = useState([]);

    // Form state
    const [slotDay, setSlotDay] = useState('Monday');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // Load seller's listings
    useEffect(() => {
        const loadInitial = async () => {
            try {
                const res = await fetch(`${API}/lands/my`, { headers: authHeaders });
                const lands = await res.json();
                setListings(Array.isArray(lands) ? lands : []);
                if (Array.isArray(lands) && lands.length > 0) {
                    const firstId = lands[0]._id || lands[0].id;
                    setSelectedId(String(firstId));
                }
            } catch (err) {
                console.error("Failed to load listings", err);
            }
            setLoading(false);
        };
        loadInitial();
    }, []);

    // Load slots for selected land
    useEffect(() => {
        if (!selectedId || selectedId === 'undefined') return;
        fetch(`${API}/availability/land/${selectedId}`)
            .then(r => r.json())
            .then(data => setPropertySlots(Array.isArray(data) ? data : []))
            .catch(() => setPropertySlots([]));
    }, [selectedId]);

    const formatTimeStr = (t24) => {
        if (!t24) return '';
        const [h, m] = t24.split(':');
        let hrs = parseInt(h);
        const ampm = hrs >= 12 ? 'PM' : 'AM';
        hrs = hrs % 12 || 12;
        return `${String(hrs).padStart(2, '0')}:${m} ${ampm}`;
    };

    const addSlot = () => {
        if (!startTime || !endTime) { setError('Please select both start and end times.'); return; }
        const timeRange = `${formatTimeStr(startTime)} – ${formatTimeStr(endTime)}`;

        const dup = propertySlots.find(s => s.day === slotDay && s.time_slot === timeRange);
        if (dup) { setError('This slot already exists.'); return; }

        const newSlot = { day: slotDay, time_slot: timeRange };
        setPropertySlots([...propertySlots, newSlot]);
        setError('');
        setSaved(false);
        return newSlot;
    };

    const removeSlot = async (idx) => {
        const slotToRemove = propertySlots[idx];
        const slotId = slotToRemove._id || slotToRemove.id;
        if (slotId) {
            try {
                const res = await fetch(`${API}/availability/${slotId}`, { method: 'DELETE', headers: authHeaders });
                if (!res.ok) { setError('Failed to delete slot.'); return; }
            } catch { setError('Server error while deleting slot.'); return; }
        }
        setPropertySlots(prev => prev.filter((_, i) => i !== idx));
        setSaved(false);
    };

    const saveSlots = async () => {
        if (!selectedId || selectedId === 'undefined') return;
        setSaving(true); setSaved(false); setError('');

        let currentSlots = [...propertySlots];

        // If user didn't click "Add Slot" but filled the form, auto-add it
        if (currentSlots.length === 0 && startTime && endTime) {
            const timeRange = `${formatTimeStr(startTime)} – ${formatTimeStr(endTime)}`;
            currentSlots = [{ day: slotDay, time_slot: timeRange }];
            setPropertySlots(currentSlots);
        }

        try {
            const res = await fetch(`${API}/availability/land/${selectedId}`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(currentSlots),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to save.');
            } else {
                const updated = await res.json();
                setPropertySlots(updated);
                setSaved(true);
            }
        } catch { setError('Server error. Please try again.'); }
        setSaving(false);
    };

    const selectedListing = listings.find(l => String(l._id || l.id) === selectedId);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Site Visit Availability</h1>
                <p style={S.subtitle}>Manage your time slots for each property listing individually.</p>
            </div>

            {loading ? (
                <div style={S.empty}>Loading initial data…</div>
            ) : (
                <div style={S.card}>
                    <div style={S.selectorRow}>
                        <label style={S.sectionLabel}>Select Property</label>
                        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={S.select}>
                            {listings.length === 0 ? <option disabled>No listings found</option> :
                                listings.map(l => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
                        </select>
                        {selectedListing && (
                            <span style={S.locationTag}>{selectedListing.village}, {selectedListing.district}</span>
                        )}
                    </div>

                    <hr style={S.divider} />

                    {/* Add Slot */}
                    <div style={S.addSection}>
                        <div style={S.sectionLabel}>Add Property Availability Slot</div>
                        <p style={S.hint}>Choose a day and enter a time range for the selected property.</p>
                        {error && <div style={S.errMsg}>{error}</div>}
                        <div style={S.slotInputRow}>
                            <select value={slotDay} onChange={e => setSlotDay(e.target.value)} style={{ ...S.input, flex: '0 0 160px' }}>
                                {DAYS.map(d => <option key={d}>{d}</option>)}
                            </select>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={{ ...S.input, flex: '1 1 120px' }} />
                            <span style={{ color: '#888', fontWeight: 'bold' }}>to</span>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={{ ...S.input, flex: '1 1 120px' }} />
                            <button type="button" style={S.addBtn} onClick={addSlot}>Add Slot</button>
                        </div>
                    </div>

                    {/* Slot List */}
                    {propertySlots.length > 0 ? (
                        <div style={S.slotListWrap}>
                            <div style={S.sectionLabel}>Current Slots ({propertySlots.length})</div>
                            <div style={S.slotGrid}>
                                {DAYS.map(day => {
                                    const daySlots = propertySlots.map((s, i) => ({ ...s, _idx: i })).filter(s => s.day === day);
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
                        <p style={S.noSlots}>No slots added yet for this property.</p>
                    )}

                    {/* Footer */}
                    <div style={S.footer}>
                        {saved && (
                            <div style={S.successToast}>
                                <div style={S.toastIcon}>✓</div>
                                <div>
                                    <div style={S.toastTitle}>Schedule Updated</div>
                                    <div style={S.toastDesc}>
                                        Availability for <strong>{selectedListing?.name}</strong> has been saved.
                                    </div>
                                </div>
                            </div>
                        )}
                        <button className="btn-dark" style={S.saveBtn} onClick={saveSlots} disabled={saving || !selectedId}>
                            {saving ? 'Saving…' : 'Save Schedule'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100vh', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    empty: { textAlign: 'center', color: '#aaa', marginTop: '80px', fontSize: '1rem' },
    card: { background: '#fff', borderRadius: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', padding: '40px', maxWidth: '820px', position: 'relative' },
    tabRow: { display: 'flex', background: '#F5F0EA', borderRadius: '12px', padding: '5px', gap: '5px', marginBottom: '32px' },
    tabBtn: { flex: 1, padding: '12px', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', background: 'transparent', color: '#888', transition: 'all 0.2s' },
    tabActive: { background: '#fff', color: '#1A1A1A', fontWeight: '800', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
    selectorRow: { display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' },
    sectionLabel: { fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1A1A1A', marginBottom: '12px', display: 'block' },
    select: { padding: '12px 16px', border: '1.5px solid #E5E0DA', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', cursor: 'pointer', background: '#fff', minWidth: '240px' },
    locationTag: { fontSize: '0.82rem', color: '#999', background: '#FAF6F1', padding: '6px 14px', borderRadius: '20px', fontWeight: '600' },
    divider: { border: 'none', borderTop: '1.5px solid #F0EBE4', margin: '32px 0' },
    addSection: { marginBottom: '32px' },
    hint: { fontSize: '0.82rem', color: '#999', marginBottom: '16px', marginTop: '-4px' },
    errMsg: { background: '#fdecea', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', fontSize: '0.88rem', marginBottom: '16px' },
    slotInputRow: { display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' },
    input: { padding: '12px 16px', border: '1.5px solid #E5E0DA', borderRadius: '10px', fontSize: '0.95rem', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff' },
    addBtn: { padding: '12px 24px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap' },
    slotListWrap: { marginBottom: '32px' },
    slotGrid: { display: 'flex', flexDirection: 'column', gap: '14px' },
    dayGroup: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
    dayLabel: { width: '100px', fontSize: '0.85rem', fontWeight: '800', color: '#1A1A1A', flexShrink: 0 },
    slotChip: { display: 'flex', alignItems: 'center', gap: '10px', background: '#FAF6F1', borderRadius: '10px', padding: '8px 14px', fontSize: '0.88rem', border: '1px solid #E5E0DA' },
    slotTime: { color: '#1A1A1A', fontWeight: '700' },
    removeBtn: { background: 'none', border: 'none', color: '#AAA', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, padding: 0 },
    noSlots: { color: '#BBB', fontSize: '0.88rem', fontStyle: 'italic', marginBottom: '32px' },
    footer: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', borderTop: '1.5px solid #F5F0EA', paddingTop: '32px' },
    saveBtn: { padding: '14px 40px', borderRadius: '12px', fontWeight: '700', fontSize: '1rem' },
    successToast: { position: 'absolute', bottom: '40px', left: '40px', background: '#fff', border: '1px solid #27ae60', borderRadius: '14px', padding: '18px 26px', display: 'flex', alignItems: 'center', gap: '18px', boxShadow: '0 12px 40px rgba(39, 174, 96, 0.15)', animation: 'slideUp 0.4s ease-out', zIndex: 100 },
    toastIcon: { background: '#27ae60', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem' },
    toastTitle: { fontWeight: '900', fontSize: '1rem', color: '#1A1A1A', marginBottom: '2px' },
    toastDesc: { fontSize: '0.85rem', color: '#666' },
};

export default SellerAvailabilityPage;
