import React, { useState, useEffect } from 'react';

const SELLER_ID = 'sunil_perera';

const STATUS_COLORS = {
    Available: { bg: '#eafaf1', color: '#2ecc71', border: '#2ecc71' },
    Reserved: { bg: '#fef5e7', color: '#e67e22', border: '#e67e22' },
    Sold: { bg: '#f0f0f0', color: '#888', border: '#ccc' },
};

const EMPTY_FORM = {
    id: null, name: '', district: '', village: '', perches: '', pricePerPerch: '',
    type: 'Residential', status: 'Available', roadAccess: '',
    electricity: false, water: false, img: '',
    // Bidding config
    openForBidding: false,
    startingBid: '',
    biddingStart: '',
    biddingEnd: '',
};

function calcTotal(perches, ppp) {
    const p = parseFloat(perches) || 0;
    const r = parseFloat(ppp) || 0;
    return p * r;
}

function getSeedListings() {
    return [
        { id: 101, name: 'Golden Valley Acres', district: 'Kandy', village: 'Digana', perches: 40, pricePerPerch: 150000, totalPrice: 6000000, type: 'Agricultural', status: 'Available', roadAccess: '15ft Carpet Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80', openForBidding: true, startingBid: 5000000, biddingStart: '2024-02-01', biddingEnd: '2024-03-01' },
        { id: 102, name: 'Ocean View Ridge', district: 'Galle', village: 'Unawatuna', perches: 20, pricePerPerch: 850000, totalPrice: 17000000, type: 'Residential', status: 'Reserved', roadAccess: '20ft Concrete Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80', openForBidding: false, startingBid: '', biddingStart: '', biddingEnd: '' },
        { id: 103, name: 'Pine Forest Retreat', district: 'Nuwara Eliya', village: 'Nanu Oya', perches: 160, pricePerPerch: 300000, totalPrice: 48000000, type: 'Mixed', status: 'Sold', roadAccess: '12ft Gravel Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', openForBidding: false, startingBid: '', biddingStart: '', biddingEnd: '' },
        { id: 101, name: 'Golden Valley Acres', district: 'Kandy', village: 'Digana', perches: 40, pricePerPerch: 150000, totalPrice: 6000000, type: 'Agricultural', status: 'Available', roadAccess: '15ft Carpet Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80' },
        { id: 102, name: 'Ocean View Ridge', district: 'Galle', village: 'Unawatuna', perches: 20, pricePerPerch: 850000, totalPrice: 17000000, type: 'Residential', status: 'Reserved', roadAccess: '20ft Concrete Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80' },
        { id: 103, name: 'Pine Forest Retreat', district: 'Nuwara Eliya', village: 'Nanu Oya', perches: 160, pricePerPerch: 300000, totalPrice: 48000000, type: 'Mixed', status: 'Sold', roadAccess: '12ft Gravel Road', electricity: true, water: true, img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
    ];
}

const SellerListingsPage = () => {
    const [listings, setListings] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    // Quick bid modal
    const [bidModal, setBidModal] = useState(null); // { listing }
    const [bidForm, setBidForm] = useState({ startingBid: '', biddingStart: '', biddingEnd: '' });

    useEffect(() => {
        const raw = localStorage.getItem(`seller_listings_${SELLER_ID}`);
        if (raw) {
            setListings(JSON.parse(raw));
        } else {
            const seed = getSeedListings();
            setListings(seed);
            localStorage.setItem(`seller_listings_${SELLER_ID}`, JSON.stringify(seed));
        }
    }, []);

    const save = (updated) => {
        setListings(updated);
        localStorage.setItem(`seller_listings_${SELLER_ID}`, JSON.stringify(updated));
    };

    const openAdd = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); };
    const openEdit = (l) => { setForm({ ...EMPTY_FORM, ...l }); setEditingId(l.id); setShowForm(true); };
    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (listing) => {
        setForm({ ...listing });
        setEditingId(listing.id);
        setShowForm(true);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setForm(f => ({ ...f, img: ev.target.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const total = calcTotal(form.perches, form.pricePerPerch);
        const entry = {
            ...form,
            totalPrice: total,
            perches: parseFloat(form.perches),
            pricePerPerch: parseFloat(form.pricePerPerch),
            startingBid: form.startingBid ? parseFloat(form.startingBid) : '',
        };
        if (editingId) {
            save(listings.map(l => l.id === editingId ? { ...entry, id: editingId } : l));
        } else {
            save([...listings, { ...entry, id: Date.now() }]);
        }
        setShowForm(false); setForm(EMPTY_FORM); setEditingId(null);
    };

    const handleDelete = (id) => { save(listings.filter(l => l.id !== id)); setDeleteConfirm(null); };
        reader.onload = (ev) => {
            setForm(f => ({ ...f, img: ev.target.result }));
        };
        reader.readAsDataURL(file);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        const total = calcTotal(form.perches, form.pricePerPerch);
        if (editingId) {
            const updated = listings.map(l =>
                l.id === editingId ? { ...form, id: editingId, totalPrice: total, perches: parseFloat(form.perches), pricePerPerch: parseFloat(form.pricePerPerch) } : l
            );
            save(updated);
        } else {
            const newItem = {
                ...form,
                id: Date.now(),
                totalPrice: total,
                perches: parseFloat(form.perches),
                pricePerPerch: parseFloat(form.pricePerPerch),
            };
            save([...listings, newItem]);
        }
        setShowForm(false);
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const handleDelete = (id) => {
        save(listings.filter(l => l.id !== id));
        setDeleteConfirm(null);
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>My Land Listings</h1>
                    <p style={S.subtitle}>Manage your properties, bidding settings, and pricing.</p>
                </div>
                <button className="btn-dark" style={S.addBtn} onClick={openAdd}>+ Add New Listing</button>
            </div>

                    <p style={S.subtitle}>Manage, add, and update all your property listings.</p>
                </div>
                <button className="btn-dark" style={S.addBtn} onClick={openAdd}>
                    + Add New Listing
                </button>
            </div>

            {/* Listings Table */}
            {listings.length === 0 ? (
                <div style={S.empty}>No listings yet. Add your first property!</div>
            ) : (
                <div style={S.tableWrap}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {['Property', 'Location', 'Size', 'Starting Bid', 'Total Price', 'Type', 'Bidding', 'Status', 'Actions'].map(h => (
                                {['Property Name', 'Location', 'Size', 'Price/Perch', 'Total Price', 'Type', 'Status', 'Actions'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((l, i) => {
                                const sc = STATUS_COLORS[l.status] || STATUS_COLORS['Available'];
                                const biddingOpen = l.openForBidding;
                                return (
                                    <tr key={l.id} style={{ ...S.tr, background: i % 2 === 0 ? '#fff' : '#fdfaf7' }}>
                                        <td style={S.td}>
                                            <div style={S.nameCell}>
                                                {l.img && <img src={l.img} alt={l.name} style={S.thumbnail} />}
                                                <img src={l.img} alt={l.name} style={S.thumbnail} />
                                                <span style={{ fontWeight: '700', color: '#1A1A1A' }}>{l.name}</span>
                                            </div>
                                        </td>
                                        <td style={S.td}>{l.village}, {l.district}</td>
                                        <td style={S.td}>{l.perches} perches</td>
                                        <td style={S.td}>
                                            {l.startingBid
                                                ? <span style={S.startBidTag}>Rs. {Number(l.startingBid).toLocaleString()}</span>
                                                : <span style={S.naBadge}>—</span>}
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '700' }}>Rs. {Number(l.totalPrice).toLocaleString()}</td>
                                        <td style={S.td}><span style={S.typeTag}>{l.type}</span></td>
                                        <td style={S.td}>
                                            <span style={{ ...S.biddingBadge, ...(biddingOpen ? S.biddingOpen : S.biddingClosed) }}>
                                                {biddingOpen ? 'Open' : 'Closed'}
                                            </span>
                                            {biddingOpen && l.biddingEnd && (
                                                <div style={S.biddingDate}>ends {l.biddingEnd}</div>
                                            )}
                                        </td>
                                        <td style={S.td}>
                                        <td style={S.td}>Rs. {Number(l.pricePerPerch).toLocaleString()}</td>
                                        <td style={{ ...S.td, fontWeight: '700' }}>Rs. {Number(l.totalPrice).toLocaleString()}</td>
                                        <td style={S.td}><span style={S.typeTag}>{l.type}</span></td>
                                        <td style={S.td}>
                                            <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                                                {l.status}
                                            </span>
                                        </td>
                                        <td style={S.td}>
                                            <div style={S.actionBtns}>
                                                <button style={S.editBtn} onClick={() => openEdit(l)}>Edit</button>
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
            {/* Delete Confirm Dialog */}
            {deleteConfirm && (
                <div style={S.overlay}>
                    <div style={S.dialog}>
                        <h3 style={{ fontWeight: '800', marginBottom: '12px' }}>Delete Listing?</h3>
                        <p style={{ color: '#666', marginBottom: '24px' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button style={S.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                            <button style={S.confirmDelBtn} onClick={() => handleDelete(deleteConfirm)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit Form Modal */}
            {showForm && (
                <div style={S.overlay}>
                    <div style={S.formModal}>
                        <div style={S.formHeader}>
                            <h2 style={S.formTitle}>{editingId ? 'Edit Listing' : 'Add New Listing'}</h2>
                            <button style={S.closeBtn} onClick={() => setShowForm(false)}>&#x2715;</button>
                        </div>
                        <form onSubmit={handleSubmit} style={S.form}>
                            {/* ── Property Details ── */}
                            <div style={S.sectionDivider}>Property Details</div>
                            <button style={S.closeBtn} onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} style={S.form}>
                            <div style={S.formGrid}>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Property Name *</label>
                                    <input name="name" value={form.name} onChange={handleFormChange} required style={S.input} placeholder="e.g. Golden Valley Acres" />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>District *</label>
                                    <input name="district" value={form.district} onChange={handleFormChange} required style={S.input} placeholder="e.g. Kandy" />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Village / Area *</label>
                                    <input name="village" value={form.village} onChange={handleFormChange} required style={S.input} placeholder="e.g. Digana" />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Size (Perches) *</label>
                                    <input name="perches" type="number" min="1" value={form.perches} onChange={handleFormChange} required style={S.input} placeholder="e.g. 40" />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Price Per Perch (Rs.) *</label>
                                    <input name="pricePerPerch" type="number" min="1" value={form.pricePerPerch} onChange={handleFormChange} required style={S.input} placeholder="e.g. 150000" />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Total Price</label>
                                    <input value={`Rs. ${calcTotal(form.perches, form.pricePerPerch).toLocaleString()}`} readOnly style={{ ...S.input, background: '#f5f0ea', color: '#555', fontWeight: '700' }} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Land Type *</label>
                                    <select name="type" value={form.type} onChange={handleFormChange} style={S.input}>
                                        {['Residential', 'Agricultural', 'Commercial', 'Mixed'].map(t => <option key={t}>{t}</option>)}
                                        {['Residential', 'Agricultural', 'Commercial', 'Mixed'].map(t => (
                                            <option key={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ ...S.formGroup, gridColumn: '1/-1' }}>
                                    <label style={S.label}>Road Access</label>
                                    <input name="roadAccess" value={form.roadAccess} onChange={handleFormChange} style={S.input} placeholder="e.g. 15ft Carpet Road" />
                                </div>
                                <div style={{ ...S.formGroup, gridColumn: '1/-1' }}>
                                    <label style={S.label}>Property Image</label>
                                    <label style={S.imgUploadBox}>
                                        {form.img ? (
                                            <img src={form.img} alt="preview" style={S.imgPreview} />
                                        ) : (
                                            <div style={S.imgPlaceholder}>
                                                <span style={{ fontSize: '2rem', color: '#ccc' }}>+</span>
                                                <span style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '6px' }}>Click to upload an image</span>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                                    </label>
                                    {form.img && (
                                        <button type="button" style={S.removeImgBtn} onClick={() => setForm(f => ({ ...f, img: '' }))}>Remove image</button>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleImageUpload}
                                        />
                                    </label>
                                    {form.img && (
                                        <button
                                            type="button"
                                            style={S.removeImgBtn}
                                            onClick={() => setForm(f => ({ ...f, img: '' }))}
                                        >
                                            Remove image
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Facilities */}
                            <div style={S.facilitiesRow}>
                                <span style={{ ...S.label, marginBottom: 0 }}>Facilities:</span>
                                <label style={S.checkLabel}><input type="checkbox" name="electricity" checked={form.electricity} onChange={handleFormChange} /> Electricity</label>
                                <label style={S.checkLabel}><input type="checkbox" name="water" checked={form.water} onChange={handleFormChange} /> Water</label>
                            </div>

                            {/* ── Bidding Settings ── */}
                            <div style={S.sectionDivider}>Bidding Settings</div>
                            <div style={S.biddingSection}>
                                <label style={S.toggleRow}>
                                    <input
                                        type="checkbox"
                                        name="openForBidding"
                                        checked={form.openForBidding}
                                        onChange={handleFormChange}
                                        style={{ display: 'none' }}
                                    />
                                    <div style={{ ...S.toggleTrack, background: form.openForBidding ? '#1A1A1A' : '#ddd' }}>
                                        <div style={{ ...S.toggleThumb, transform: form.openForBidding ? 'translateX(22px)' : 'translateX(2px)' }} />
                                    </div>
                                    <span style={S.toggleLabel}>
                                        {form.openForBidding ? 'Open for Bidding' : 'Bidding Closed'}
                                    </span>
                                </label>

                                {form.openForBidding && (
                                    <div style={S.biddingFields}>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Starting Bid Price (Rs.) *</label>
                                            <input
                                                name="startingBid"
                                                type="number"
                                                min="1"
                                                value={form.startingBid}
                                                onChange={handleFormChange}
                                                style={S.input}
                                                placeholder="e.g. 5000000"
                                                required={form.openForBidding}
                                            />
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Bidding Start Date *</label>
                                            <input
                                                name="biddingStart"
                                                type="date"
                                                value={form.biddingStart}
                                                onChange={handleFormChange}
                                                style={S.input}
                                                required={form.openForBidding}
                                            />
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Bidding End Date *</label>
                                            <input
                                                name="biddingEnd"
                                                type="date"
                                                value={form.biddingEnd}
                                                onChange={handleFormChange}
                                                style={S.input}
                                                required={form.openForBidding}
                                                min={form.biddingStart || undefined}
                                            />
                                        </div>
                                    </div>
                                )}
                                <label style={S.checkLabel}>
                                    <input type="checkbox" name="electricity" checked={form.electricity} onChange={handleFormChange} />
                                    Electricity
                                </label>
                                <label style={S.checkLabel}>
                                    <input type="checkbox" name="water" checked={form.water} onChange={handleFormChange} />
                                    Water
                                </label>
                            </div>

                            <div style={S.formFooter}>
                                <button type="button" style={S.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-dark" style={{ padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem' }}>
                                    {editingId ? 'Save Changes' : 'Add Listing'}
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
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    addBtn: { padding: '12px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', whiteSpace: 'nowrap' },
    empty: { textAlign: 'center', color: '#999', marginTop: '80px', fontSize: '1.1rem' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
    th: { padding: '16px 16px', textAlign: 'left', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', borderBottom: '2px solid #f5f0ea', whiteSpace: 'nowrap' },
    tr: { transition: 'background 0.15s' },
    td: { padding: '14px 16px', fontSize: '0.875rem', color: '#333', verticalAlign: 'middle', borderBottom: '1px solid #f5f0ea' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
    thumbnail: { width: '44px', height: '34px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 },
    typeTag: { background: '#f5f0ea', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: '#555' },
    startBidTag: { fontWeight: '700', color: '#1A1A1A', fontSize: '0.82rem' },
    naBadge: { color: '#ccc' },
    biddingBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-block' },
    biddingOpen: { background: '#eafaf1', color: '#2ecc71', border: '1px solid #2ecc71' },
    biddingClosed: { background: '#f5f0ea', color: '#aaa', border: '1px solid #ddd' },
    biddingDate: { fontSize: '0.7rem', color: '#bbb', marginTop: '3px' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    th: { padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#888', borderBottom: '2px solid #f5f0ea', whiteSpace: 'nowrap' },
    tr: { transition: 'background 0.15s' },
    td: { padding: '16px 20px', fontSize: '0.875rem', color: '#333', verticalAlign: 'middle', borderBottom: '1px solid #f5f0ea' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    thumbnail: { width: '48px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 },
    typeTag: { background: '#f5f0ea', padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', color: '#555' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    actionBtns: { display: 'flex', gap: '8px' },
    editBtn: { background: '#1A1A1A', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' },
    delBtn: { background: '#fff', color: '#e74c3c', border: '1px solid #e74c3c', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer' },
    startBidBtn: { background: '#1A1A1A', color: '#C8F169', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    stopBidBtn: { background: '#fff', color: '#e67e22', border: '1px solid #e67e22', padding: '6px 14px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
    dialog: { background: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '380px' },
    formModal: { background: '#fff', borderRadius: '20px', width: '100%', maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
    formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 32px 0' },
    formTitle: { fontSize: '1.4rem', fontWeight: '800', color: '#1A1A1A' },
    closeBtn: { background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#999' },
    form: { padding: '24px 32px 32px' },
    sectionDivider: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', borderBottom: '1px solid #f0ebe4', paddingBottom: '8px', marginBottom: '18px', marginTop: '4px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.78rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#666' },
    input: { padding: '12px 14px', border: '1px solid #e5e0da', borderRadius: '8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', width: '100%', boxSizing: 'border-box' },
    facilitiesRow: { display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px', flexWrap: 'wrap' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer' },
    biddingSection: { background: '#fdfaf7', border: '1px solid #ede8e1', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' },
    toggleRow: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' },
    toggleTrack: { width: '46px', height: '24px', borderRadius: '12px', position: 'relative', transition: 'background 0.2s', flexShrink: 0 },
    toggleThumb: { position: 'absolute', top: '3px', width: '18px', height: '18px', background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'transform 0.2s' },
    toggleLabel: { fontSize: '0.9rem', fontWeight: '700', color: '#333' },
    biddingFields: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '20px' },
    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    cancelBtn: { background: '#f5f0ea', color: '#555', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" },
    confirmDelBtn: { background: '#e74c3c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" },
    imgUploadBox: { display: 'block', border: '2px dashed #e0dbd4', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', minHeight: '140px', background: '#fdfaf7' },
    imgPreview: { width: '100%', height: '160px', objectFit: 'cover', display: 'block' },
    imgPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px' },
    removeImgBtn: { marginTop: '8px', background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" },
    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
    cancelBtn: { background: '#f5f0ea', color: '#555', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" },
    confirmDelBtn: { background: '#e74c3c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" },
    imgUploadBox: { display: 'block', border: '2px dashed #e0dbd4', borderRadius: '10px', overflow: 'hidden', cursor: 'pointer', minHeight: '140px', background: '#fdfaf7', transition: 'border-color 0.2s' },
    imgPreview: { width: '100%', height: '160px', objectFit: 'cover', display: 'block' },
    imgPlaceholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '140px' },
    removeImgBtn: { marginTop: '8px', background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: 0, fontFamily: "'DM Sans', sans-serif" },
    availSection: { background: '#fdfaf7', border: '1px solid #ede8e1', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px' },
    availHint: { fontSize: '0.8rem', color: '#999', margin: '4px 0 16px', fontWeight: '500' },
    slotInputRow: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' },
    addSlotBtn: { padding: '12px 20px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif", flexShrink: 0 },
    slotList: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' },
    slotChip: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '7px 12px', fontSize: '0.85rem' },
    slotDay: { fontWeight: '700', color: '#1A1A1A' },
    slotTime: { color: '#555' },
    slotRemove: { background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 2px', fontWeight: '700', display: 'flex', alignItems: 'center' },
    noSlots: { fontSize: '0.8rem', color: '#bbb', marginTop: '12px', marginBottom: 0, fontStyle: 'italic' },
};

export default SellerListingsPage;
