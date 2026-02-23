import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_COLORS = {
    Available: { bg: '#eafaf1', color: '#2ecc71', border: '#2ecc71' },
    Reserved: { bg: '#fef5e7', color: '#e67e22', border: '#e67e22' },
    Sold: { bg: '#f0f0f0', color: '#888', border: '#ccc' },
};

const EMPTY_FORM = {
    name: '', district: '', village: '', perches: '', price_per_perch: '',
    land_type: 'Residential', status: 'Available', road_access: '',
    electricity: false, water: false,
    image_url: '',           // stored as URL string
    open_for_bidding: false, starting_bid: '', bidding_end: '',
};

function calcTotal(perches, ppp) {
    return (parseFloat(perches) || 0) * (parseFloat(ppp) || 0);
}

const SellerListingsPage = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [error, setError] = useState('');

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    // ── Fetch seller's own listings from DB ────────────────────────────────
    const fetchListings = () => {
        setLoading(true);
        fetch(`${API}/lands/my`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => setListings(Array.isArray(data) ? data : []))
            .catch(() => setListings([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchListings(); }, []);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const payload = {
            ...form,
            perches: parseFloat(form.perches),
            price_per_perch: parseFloat(form.price_per_perch),
            starting_bid: form.starting_bid ? parseFloat(form.starting_bid) : null,
        };

        try {
            let res;
            if (editingId) {
                res = await fetch(`${API}/lands/${editingId}`, {
                    method: 'PUT',
                    headers: authHeaders,
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API}/lands/`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify(payload)
                });
            }

            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to save listing');
                return;
            }

            setShowForm(false);
            setForm(EMPTY_FORM);
            fetchListings();
        } catch {
            setError('Server error. Make sure the backend is running.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await fetch(`${API}/lands/${id}`, { method: 'DELETE', headers: authHeaders });
            fetchListings();
        } catch { /* ignore */ }
        setDeleteConfirm(null);
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>My Land Listings</h1>
                    <p style={S.subtitle}>Manage your properties and bidding settings.</p>
                </div>
                <button className="btn-dark" style={S.addBtn}
                    onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setError(''); setShowForm(true); }}>
                    + Add New Listing
                </button>
            </div>

            {loading ? (
                <div style={S.empty}>Loading listings…</div>
            ) : listings.length === 0 ? (
                <div style={S.empty}>No listings yet. Add your first property!</div>
            ) : (
                <div style={S.tableWrap}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {['Property', 'Location', 'Size', 'Price / Perch', 'Total Price', 'Bidding', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((l, i) => {
                                const sc = STATUS_COLORS[l.status] || STATUS_COLORS['Available'];
                                return (
                                    <tr key={l.id} style={{ ...S.tr, background: i % 2 === 0 ? '#fff' : '#fdfaf7' }}>
                                        <td style={S.td}>
                                            <div style={S.nameCell}>
                                                {l.image_url && (
                                                    <img src={l.image_url.split(',')[0]} alt={l.name} style={S.thumbnail} />
                                                )}
                                                <span style={{ fontWeight: '700', color: '#1A1A1A' }}>{l.name}</span>
                                            </div>
                                        </td>
                                        <td style={S.td}>{l.village}, {l.district}</td>
                                        <td style={S.td}>{l.perches} perches</td>
                                        <td style={S.td}>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Rs. {Number(l.price_per_perch).toLocaleString()} / perch</div>
                                            {l.starting_bid && <div style={{ fontSize: '0.75rem', color: '#1A1A1A', fontWeight: '600' }}>Bid: Rs. {Number(l.starting_bid).toLocaleString()}</div>}
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '700' }}>Rs. {Number(l.total_price).toLocaleString()}</td>
                                        <td style={S.td}>
                                            <span style={{ ...S.badge, ...(l.open_for_bidding ? S.badgeOpen : S.badgeClosed) }}>
                                                {l.open_for_bidding ? 'Open' : 'Closed'}
                                            </span>
                                        </td>
                                        <td style={S.td}>
                                            <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td style={S.td}>
                                            <div style={S.actionBtns}>
                                                <button style={S.editBtn} onClick={() => {
                                                    setForm({
                                                        name: l.name, district: l.district, village: l.village,
                                                        perches: l.perches, price_per_perch: l.price_per_perch,
                                                        land_type: l.land_type, status: l.status,
                                                        road_access: l.road_access || '',
                                                        electricity: l.electricity, water: l.water,
                                                        image_url: l.image_url || '',
                                                        open_for_bidding: l.open_for_bidding,
                                                        starting_bid: l.starting_bid || '',
                                                        bidding_end: l.bidding_end || '',
                                                    });
                                                    setEditingId(l.id);
                                                    setError('');
                                                    setShowForm(true);
                                                }}>Edit</button>
                                                <button style={S.delBtn} onClick={() => setDeleteConfirm(l.id)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirm */}
            {deleteConfirm && (
                <div style={S.overlay}>
                    <div style={S.dialog}>
                        <h3>Delete Listing?</h3>
                        <p>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button style={S.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button style={S.confirmDelBtn} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Form */}
            {showForm && (
                <div style={S.overlay}>
                    <div style={S.formModal}>
                        <div style={S.formHeader}>
                            <h2 style={S.formTitle}>{editingId ? 'Edit Listing' : 'Add New Listing'}</h2>
                            <button style={S.closeBtn} onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        {error && <p style={S.errorMsg}>{error}</p>}
                        <form onSubmit={handleSubmit} style={S.form}>
                            <div style={S.sectionDivider}>Property Details</div>
                            <div style={S.formGrid}>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Property Name *</label>
                                    <input name="name" value={form.name} onChange={handleFormChange} required style={S.input} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>District *</label>
                                    <input name="district" value={form.district} onChange={handleFormChange} required style={S.input} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Village / Area *</label>
                                    <input name="village" value={form.village} onChange={handleFormChange} required style={S.input} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Size (Perches) *</label>
                                    <input name="perches" type="number" value={form.perches} onChange={handleFormChange} required style={S.input} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Price Per Perch (Rs.) *</label>
                                    <input name="price_per_perch" type="number" value={form.price_per_perch} onChange={handleFormChange} required style={S.input} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Land Type</label>
                                    <select name="land_type" value={form.land_type} onChange={handleFormChange} style={S.input}>
                                        {['Residential', 'Agricultural', 'Commercial', 'Mixed'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Status</label>
                                    <select name="status" value={form.status} onChange={handleFormChange} style={S.input}>
                                        {Object.keys(STATUS_COLORS).map(s => <option key={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Road Access</label>
                                    <input name="road_access" value={form.road_access} onChange={handleFormChange} style={S.input} placeholder="e.g. 15ft Carpet Road" />
                                </div>
                            </div>

                            <div style={S.checkRow}>
                                <label style={S.checkLabel}><input type="checkbox" name="electricity" checked={form.electricity} onChange={handleFormChange} /> Electricity</label>
                                <label style={S.checkLabel}><input type="checkbox" name="water" checked={form.water} onChange={handleFormChange} /> Water</label>
                            </div>

                            <div style={S.sectionDivider}>Property Image</div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Image URL (paste a link to the image)</label>
                                <input name="image_url" value={form.image_url} onChange={handleFormChange} style={S.input} placeholder="https://example.com/image.jpg" />
                                {form.image_url && (
                                    <img src={form.image_url} alt="Preview" style={{ marginTop: '10px', maxHeight: '140px', borderRadius: '8px', objectFit: 'cover' }}
                                        onError={e => { e.target.style.display = 'none'; }} />
                                )}
                            </div>

                            <div style={S.sectionDivider}>Bidding Config</div>
                            <div style={S.biddingSection}>
                                <label style={S.checkLabel}>
                                    <input type="checkbox" name="open_for_bidding" checked={form.open_for_bidding} onChange={handleFormChange} />
                                    Open for Bidding
                                </label>
                                {form.open_for_bidding && (
                                    <div style={S.biddingFields}>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Starting Bid (Rs.)</label>
                                            <input name="starting_bid" type="number" value={form.starting_bid} onChange={handleFormChange} style={S.input} />
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Bidding End Date</label>
                                            <input name="bidding_end" type="date" value={form.bidding_end} onChange={handleFormChange} style={S.input} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={S.formFooter}>
                                <button type="button" style={S.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-dark" style={S.saveBtn} disabled={submitting}>
                                    {submitting ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Listing')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    addBtn: { padding: '12px 24px', borderRadius: '10px', fontWeight: '700' },
    empty: { textAlign: 'center', color: '#999', marginTop: '80px', fontSize: '1rem' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#888', borderBottom: '2px solid #f5f0ea' },
    tr: { transition: 'background 0.15s' },
    td: { padding: '16px 20px', fontSize: '0.875rem', borderBottom: '1px solid #f5f0ea' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    thumbnail: { width: '48px', height: '36px', borderRadius: '6px', objectFit: 'cover' },
    badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' },
    badgeOpen: { background: '#eafaf1', color: '#2ecc71' },
    badgeClosed: { background: '#f5f0ea', color: '#aaa' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    actionBtns: { display: 'flex', gap: '8px' },
    editBtn: { background: '#1A1A1A', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' },
    delBtn: { background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    dialog: { background: '#fff', borderRadius: '16px', padding: '32px', width: '380px' },
    formModal: { background: '#fff', borderRadius: '20px', width: '680px', maxHeight: '90vh', overflowY: 'auto' },
    formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px' },
    formTitle: { fontSize: '1.4rem', fontWeight: '800' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#999' },
    errorMsg: { color: '#d32f2f', background: '#fdecea', margin: '0 32px 16px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.875rem' },
    form: { padding: '0 32px 32px' },
    sectionDivider: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: '#aaa', borderBottom: '1px solid #f0ebe4', marginBottom: '20px', paddingBottom: '8px', marginTop: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.78rem', fontWeight: '700', color: '#666' },
    input: { padding: '12px', border: '1px solid #e5e0da', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' },
    checkRow: { display: 'flex', gap: '24px', marginBottom: '8px' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' },
    biddingSection: { background: '#fdfaf7', padding: '20px', borderRadius: '12px', marginBottom: '16px' },
    biddingFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' },
    cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: '700' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700' },
    confirmDelBtn: { padding: '12px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
};

export default SellerListingsPage;
