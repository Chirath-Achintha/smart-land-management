import React, { useState, useEffect } from 'react';

const SELLER_ID = 'sunil_perera';
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SellerAvailabilityPage = () => {
    const [listings, setListings] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [slots, setSlots] = useState([]);
    const [slotDay, setSlotDay] = useState('Monday');
    const [slotTime, setSlotTime] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(`seller_listings_${SELLER_ID}`);
        if (raw) {
            const parsed = JSON.parse(raw);
            setListings(parsed);
            if (parsed.length > 0) {
                setSelectedId(String(parsed[0].id));
                setSlots(parsed[0].freeSlots || []);
            }
        }
    }, []);

    const handleSelectListing = (id) => {
        setSelectedId(id);
        const found = listings.find(l => String(l.id) === id);
        setSlots(found?.freeSlots || []);
        setSaved(false);
    };

    const addSlot = () => {
        if (!slotTime.trim()) return;
        setSlots(prev => [...prev, { day: slotDay, time: slotTime.trim() }]);
        setSlotTime('');
        setSaved(false);
    };

    const removeSlot = (idx) => {
        setSlots(prev => prev.filter((_, i) => i !== idx));
        setSaved(false);
    };

    const saveSlots = () => {
        const updated = listings.map(l =>
            String(l.id) === selectedId ? { ...l, freeSlots: slots } : l
        );
        setListings(updated);
        localStorage.setItem(`seller_listings_${SELLER_ID}`, JSON.stringify(updated));
        setSaved(true);
    };

    const selectedListing = listings.find(l => String(l.id) === selectedId);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Site Visit Availability</h1>
                <p style={S.subtitle}>Set the days and times when buyers can visit your properties.</p>
            </div>

            {listings.length === 0 ? (
                <div style={S.empty}>No listings found. Add a listing first.</div>
            ) : (
                <div style={S.card}>
                    {/* Listing Selector */}
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
                        <div style={S.slotInputRow}>
                            <select value={slotDay} onChange={e => setSlotDay(e.target.value)} style={{ ...S.input, flex: '0 0 160px' }}>
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

                    {/* Slot List grouped by day */}
                    {slots.length > 0 ? (
                        <div style={S.slotListWrap}>
                            <div style={S.sectionLabel}>Scheduled Slots ({slots.length})</div>
                            <div style={S.slotGrid}>
                                {DAYS.map(day => {
                                    const daySlots = slots.map((s, i) => ({ ...s, idx: i })).filter(s => s.day === day);
                                    if (daySlots.length === 0) return null;
                                    return (
                                        <div key={day} style={S.dayGroup}>
                                            <div style={S.dayLabel}>{day}</div>
                                            {daySlots.map(slot => (
                                                <div key={slot.idx} style={S.slotChip}>
                                                    <span style={S.slotTime}>{slot.time}</span>
                                                    <button type="button" style={S.removeBtn} onClick={() => removeSlot(slot.idx)}>&times;</button>
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

                    {/* Save */}
                    <div style={S.footer}>
                        {saved && <span style={S.savedMsg}>Availability saved.</span>}
                        <button className="btn-dark" style={S.saveBtn} onClick={saveSlots}>Save Availability</button>
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
    slotInputRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
    input: { padding: '11px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' },
    addBtn: { padding: '11px 22px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap', flexShrink: 0 },
    slotListWrap: { marginBottom: '28px' },
    slotGrid: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' },
    dayGroup: { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' },
    dayLabel: { width: '96px', fontSize: '0.82rem', fontWeight: '700', color: '#555', flexShrink: 0 },
    slotChip: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f5f0ea', borderRadius: '8px', padding: '7px 12px', fontSize: '0.85rem' },
    slotTime: { color: '#333', fontWeight: '600' },
    removeBtn: { background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0, fontWeight: '700', display: 'flex', alignItems: 'center' },
    noSlots: { color: '#bbb', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '28px' },
    footer: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', borderTop: '1px solid #f0ebe4', paddingTop: '24px' },
    savedMsg: { fontSize: '0.85rem', color: '#2ecc71', fontWeight: '700' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' },
};

export default SellerAvailabilityPage;
