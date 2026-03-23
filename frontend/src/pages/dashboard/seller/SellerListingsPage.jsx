import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;
const MAX_IMAGES = 5;

const STATUS_COLORS = {
    Available: { bg: 'rgba(76, 175, 80, 0.18)', color: '#2e7d32', border: 'rgba(76, 175, 80, 0.4)' },
    Reserved: { bg: 'rgba(139, 195, 74, 0.18)', color: '#3f6e10', border: 'rgba(139, 195, 74, 0.45)' },
    Sold: { bg: 'rgba(161, 136, 127, 0.16)', color: '#6d4c41', border: 'rgba(161, 136, 127, 0.45)' },
};

const REVIEW_COLORS = {
    approved: { bg: 'rgba(76, 175, 80, 0.18)', color: '#2e7d32', border: 'rgba(76, 175, 80, 0.4)', label: 'Approved' },
    pending: { bg: 'rgba(33, 150, 243, 0.14)', color: '#145b97', border: 'rgba(33, 150, 243, 0.35)', label: 'Pending Review' },
    rejected: { bg: 'rgba(161, 136, 127, 0.18)', color: '#7a4f41', border: 'rgba(161, 136, 127, 0.45)', label: 'Rejected' },
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

function getImageUrls(imageUrlValue) {
    if (!imageUrlValue) return [];
    return imageUrlValue.split(',').map(url => url.trim()).filter(Boolean);
}

const SellerListingsPage = () => {
    const navigate = useNavigate();
    const [listings, setListings] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [error, setError] = useState('');
    const [animatedRows, setAnimatedRows] = useState({});

    const getToken = () => localStorage.getItem('access_token');
    const getAuthHeaders = () => {
        const token = getToken();
        return token ? { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type': 'application/json' };
    };

    const handleUnauthorized = () => {
        setError('Session expired. Please login again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        navigate('/login', { replace: true, state: { from: '/dashboard/seller/listings' } });
    };

    // ── Fetch seller's own listings from DB ────────────────────────────────
    const fetchListings = () => {
        setLoading(true);
        const token = getToken();
        if (!token) {
            handleUnauthorized();
            setLoading(false);
            return;
        }
        Promise.all([
            fetch(`${API}/lands/my`, { headers: getAuthHeaders() }).then(async r => {
                if (r.status === 401) {
                    handleUnauthorized();
                    return [];
                }
                return r.json();
            }).catch(() => []),
            fetch(`${API}/notifications/`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json()).catch(() => [])
        ])
            .then(([lands, notifs]) => {
                setListings(Array.isArray(lands) ? lands : []);
                setNotifications(Array.isArray(notifs) ? notifs : []);
            })
            .catch(() => {
                setListings([]);
                setNotifications([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchListings(); }, []);

    useEffect(() => {
        if (!listings.length) {
            setAnimatedRows({});
            return;
        }

        setAnimatedRows({});
        const timers = listings.map((l, idx) => {
            const lid = l.id || l._id;
            return setTimeout(() => {
                setAnimatedRows(prev => ({ ...prev, [lid]: true }));
            }, idx * 80);
        });

        return () => timers.forEach(clearTimeout);
    }, [listings]);

    const markAllRead = async () => {
        const token = getToken();
        if (!token) {
            handleUnauthorized();
            return;
        }
        try {
            const res = await fetch(`${API}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            fetchListings();
        } catch {
            // Ignore network failures for mark-as-read action.
        }
    };

    const verificationNotifications = notifications.filter(n =>
        (n.title || '').toLowerCase().includes('land verification') && !n.is_read
    );
    const unreadNotifCount = verificationNotifications.length;
    const activeCount = listings.filter(l => l.status === 'Available').length;
    const soldCount = listings.filter(l => l.status === 'Sold').length;
    const formCompletionFields = [
        form.name?.trim(),
        form.district?.trim(),
        form.village?.trim(),
        form.perches,
        form.price_per_perch,
        form.road_access?.trim(),
        getImageUrls(form.image_url).length > 0,
    ];
    const completedCount = formCompletionFields.filter(Boolean).length;
    const completionPct = Math.round((completedCount / formCompletionFields.length) * 100);

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    };

    const [isDragging, setIsDragging] = useState(false);

    const uploadSingleImage = async (file, landName) => {
        const token = getToken();
        if (!token) {
            throw new Error('No auth token');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('land_name', landName);

        const res = await fetch(`${API}/lands/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        if (res.status === 401) {
            throw new Error('Session expired');
        }
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    const handleUploadMany = async (files) => {
        if (!files || files.length === 0) return;

        const landName = (form.name || '').trim();
        if (!landName) {
            setError('Enter Property Name before uploading images.');
            return;
        }

        const existingUrls = getImageUrls(form.image_url);
        const remainingSlots = MAX_IMAGES - existingUrls.length;

        if (remainingSlots <= 0) {
            setError(`You can upload up to ${MAX_IMAGES} images only.`);
            return;
        }

        const selected = Array.from(files).slice(0, remainingSlots);
        if (files.length > remainingSlots) {
            setError(`Only ${remainingSlots} more image(s) can be uploaded. Max ${MAX_IMAGES}.`);
        }

        const uploadedUrls = [];
        try {
            for (const file of selected) {
                const uploadedUrl = await uploadSingleImage(file, landName);
                uploadedUrls.push(uploadedUrl);
            }

            const nextUrls = [...existingUrls, ...uploadedUrls].slice(0, MAX_IMAGES);
            setForm(f => ({ ...f, image_url: nextUrls.join(',') }));
            if (files.length <= remainingSlots) {
                setError('');
            }
        } catch (err) {
            if (err?.message === 'Session expired' || err?.message === 'No auth token') {
                setError('Session expired. Please login again before uploading images.');
            } else {
                setError('Image upload failed');
            }
        }
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length) {
            handleUploadMany(e.dataTransfer.files);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const removeImageAt = (index) => {
        const urls = getImageUrls(form.image_url);
        const nextUrls = urls.filter((_, i) => i !== index);
        setForm(f => ({ ...f, image_url: nextUrls.join(',') }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const perches = parseFloat(form.perches);
        const pricePerPerch = parseFloat(form.price_per_perch);
        if (Number.isNaN(perches) || Number.isNaN(pricePerPerch)) {
            setError('Size and price per perch are required.');
            return;
        }
        if (perches < 0 || pricePerPerch < 0) {
            setError('Size and price per perch cannot be negative.');
            return;
        }

        setSubmitting(true);

        const payload = {
            ...form,
            perches,
            price_per_perch: pricePerPerch,
            starting_bid: form.starting_bid ? parseFloat(form.starting_bid) : null,
        };

        try {
            let res;
            if (editingId) {
                res = await fetch(`${API}/lands/${editingId}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });
            } else {
                res = await fetch(`${API}/lands/`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(payload)
                });
            }

            if (res.status === 401) {
                handleUnauthorized();
                return;
            }

            if (!res.ok) {
                const err = await res.json();
                if (Array.isArray(err.detail)) {
                    setError(err.detail.map(d => d?.msg || 'Validation error').join(', '));
                } else {
                    setError(err.detail || 'Failed to save listing');
                }
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
            const res = await fetch(`${API}/lands/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
            if (res.status === 401) {
                handleUnauthorized();
                return;
            }
            fetchListings();
        } catch { /* ignore */ }
        setDeleteConfirm(null);
    };

    return (
        <div style={S.root}>
            {verificationNotifications.length > 0 && (
                <div style={S.notifPanel}>
                    <div style={S.notifHeader}>
                        <h2 style={S.notifTitle}>Seller Notifications {unreadNotifCount > 0 && <span style={S.unreadBadge}>{unreadNotifCount} new</span>}</h2>
                        <button onClick={markAllRead} style={S.readAllBtn}>Mark all read</button>
                    </div>
                    <div style={S.notifList}>
                        {verificationNotifications.slice(0, 5).map(n => (
                            <div key={n.id || n._id} style={S.notifItem}>
                                <div style={S.notifDot}></div>
                                <div>
                                    <div style={S.notifText}><strong>{n.title}</strong></div>
                                    <div style={S.notifSub}>{n.message}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={S.header}>
                <div>
                    <h1 style={S.title}>My Land Listings</h1>
                    <p style={S.subtitle}>Manage your properties and bidding settings.</p>
                </div>
                <div style={S.headerRight}>
                    <div style={S.summaryPills}>
                        <span style={S.summaryPill}>{listings.length} total</span>
                        <span style={{ ...S.summaryPill, background: 'rgba(76, 175, 80, 0.16)', color: '#2e7d32' }}>{activeCount} active</span>
                        <span style={{ ...S.summaryPill, background: 'rgba(161, 136, 127, 0.18)', color: '#6d4c41' }}>{soldCount} sold</span>
                    </div>
                <button className="btn-dark" style={S.addBtn}
                    onClick={() => { setForm(EMPTY_FORM); setEditingId(null); setError(''); setShowForm(true); }}>
                    + Add New Listing
                </button>
                </div>
            </div>

            {loading ? (
                <div style={S.empty}>Loading listings…</div>
            ) : listings.length === 0 ? (
                <div style={S.empty}>No listings yet. Add your first property!</div>
            ) : (
                <div className="ui-card" style={S.tableWrap}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {['Property', 'Location', 'Size', 'Price / Perch', 'Total Price', 'Bidding', 'Status', 'Review', 'Actions'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((l, i) => {
                                const sc = STATUS_COLORS[l.status] || STATUS_COLORS['Available'];
                                const rc = REVIEW_COLORS[l.review_status || 'pending'] || REVIEW_COLORS.pending;
                                const lid = l.id || l._id;
                                return (
                                    <tr
                                        key={lid}
                                        style={{
                                            ...S.tr,
                                            background: i % 2 === 0 ? '#fff' : 'rgba(139, 195, 74, 0.08)',
                                            opacity: animatedRows[lid] ? 1 : 0,
                                            transform: animatedRows[lid] ? 'translateY(0)' : 'translateY(12px)',
                                        }}
                                    >
                                        <td style={S.td}>
                                            <div style={S.nameCell}>
                                                {l.image_url && (
                                                    <img src={l.image_url.split(',')[0]} alt={l.name} style={S.thumbnail} />
                                                )}
                                                <span style={{ fontWeight: '700', color: 'var(--color-dark)' }}>{l.name}</span>
                                            </div>
                                        </td>
                                        <td style={S.td}>{l.village}, {l.district}</td>
                                        <td style={S.td}>{l.perches} perches</td>
                                        <td style={S.td}>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Rs. {Number(l.price_per_perch).toLocaleString()} / perch</div>
                                            {l.starting_bid && <div style={{ fontSize: '0.75rem', color: 'var(--color-dark)', fontWeight: '600' }}>Bid: Rs. {Number(l.starting_bid).toLocaleString()}</div>}
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
                                            <span style={{ ...S.statusBadge, background: rc.bg, color: rc.color, border: `1px solid ${rc.border}` }}>
                                                {rc.label}
                                            </span>
                                            {l.review_status === 'rejected' && l.verification_note && (
                                                <div style={S.rejectReason}>Reason: {l.verification_note}</div>
                                            )}
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
                                                    setEditingId(lid);
                                                    setError('');
                                                    setShowForm(true);
                                                }}>Edit</button>
                                                <button style={S.delBtn} onClick={() => setDeleteConfirm(lid)}>Delete</button>
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
                <div className="listing-modal-overlay" style={S.overlay}>
                    <div className="listing-form-modal" style={S.formModal}>
                        <div style={S.formHeader}>
                            <div>
                                <h2 style={S.formTitle}>{editingId ? 'Edit Listing' : 'Add New Listing'}</h2>
                                <p style={S.formSubtitle}>Complete the details below to publish a professional property listing.</p>
                            </div>
                            <div style={S.formHeaderActions}>
                                <div style={S.formProgressMeta}>{completedCount}/{formCompletionFields.length} complete</div>
                                <button style={S.closeBtn} onClick={() => setShowForm(false)}>✕</button>
                            </div>
                        </div>
                        <div style={S.progressTrack}>
                            <div style={{ ...S.progressFill, width: `${completionPct}%` }}></div>
                        </div>
                        {error && <p style={S.errorMsg}>{error}</p>}
                        <form onSubmit={handleSubmit} style={S.form}>
                            <div className="listing-form-section" style={{ ...S.formSection, animationDelay: '60ms' }}>
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
                                        <input name="perches" type="number" min="0" step="any" value={form.perches} onChange={handleFormChange} required style={S.input} />
                                    </div>
                                    <div style={S.formGroup}>
                                        <label style={S.label}>Price Per Perch (Rs.) *</label>
                                        <input name="price_per_perch" type="number" min="0" step="any" value={form.price_per_perch} onChange={handleFormChange} required style={S.input} />
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
                            </div>

                            <div className="listing-form-section" style={{ ...S.formSection, animationDelay: '140ms' }}>
                                <div style={S.sectionDivider}>Property Image</div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Upload Property Photos (Max {MAX_IMAGES})</label>
                                    <div
                                        onDrop={onDrop}
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                        style={{
                                            ...S.dropZone,
                                            borderColor: isDragging ? 'var(--color-blue)' : 'rgba(38, 50, 56, 0.2)',
                                            background: isDragging ? 'rgba(33, 150, 243, 0.08)' : '#fff'
                                        }}
                                        onClick={() => document.getElementById('fileInput').click()}
                                    >
                                        <div style={S.dropContent}>
                                            <span style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</span>
                                            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Drag & drop images here</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Support for JPG, PNG (Max 5MB each)</span>
                                            <span style={S.browseText}>or browse files</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{getImageUrls(form.image_url).length} / {MAX_IMAGES} selected</span>
                                        </div>
                                        <input
                                            id="fileInput"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            hidden
                                            onChange={(e) => handleUploadMany(e.target.files)}
                                        />
                                    </div>

                                    {getImageUrls(form.image_url).length > 0 && (
                                        <div style={S.previewGrid}>
                                            {getImageUrls(form.image_url).map((url, index) => (
                                                <div key={`${url}-${index}`} style={S.previewItem}>
                                                    <img src={url} alt={`Preview ${index + 1}`} style={S.previewImage} />
                                                    <button type="button" onClick={() => removeImageAt(index)} style={S.removeImgBtn}>
                                                        Remove
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="listing-form-section" style={{ ...S.formSection, animationDelay: '220ms' }}>
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
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    notifPanel: { background: 'rgba(33, 150, 243, 0.08)', border: '1px solid rgba(33, 150, 243, 0.2)', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: 'none' },
    notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    notifTitle: { fontSize: '1rem', fontWeight: '800', margin: 0, color: 'var(--color-dark)' },
    unreadBadge: { fontSize: '0.7rem', background: 'var(--color-accent)', color: '#FFF', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' },
    readAllBtn: { background: 'none', border: 'none', color: 'var(--color-blue)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' },
    notifList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    notifItem: { display: 'flex', gap: '12px', alignItems: 'center', background: '#FFF', padding: '12px', borderRadius: '12px', border: '1px solid rgba(38, 50, 56, 0.1)' },
    notifDot: { width: '8px', height: '8px', background: 'var(--color-blue)', borderRadius: '50%' },
    notifText: { fontSize: '0.9rem', color: 'var(--color-dark)' },
    notifSub: { fontSize: '0.8rem', color: 'var(--color-muted)' },
    rejectReason: { marginTop: '6px', fontSize: '0.74rem', color: '#7a4f41', fontWeight: '600' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', gap: '18px', flexWrap: 'wrap' },
    headerRight: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', justifyContent: 'flex-end' },
    summaryPills: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
    summaryPill: { padding: '6px 12px', borderRadius: '20px', background: 'rgba(38, 50, 56, 0.12)', color: 'var(--color-dark)', fontWeight: '700', fontSize: '0.76rem' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    subtitle: { color: 'var(--color-muted)', fontSize: '0.95rem', marginTop: '6px' },
    addBtn: { padding: '12px 24px', borderRadius: '10px', fontWeight: '700' },
    empty: { textAlign: 'center', color: 'var(--color-muted)', marginTop: '80px', fontSize: '1rem' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: 'none', border: '1px solid rgba(38, 50, 56, 0.1)', overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '2px solid rgba(38, 50, 56, 0.1)', background: 'rgba(139, 195, 74, 0.12)' },
    tr: { transition: 'background 0.2s ease, opacity 0.35s ease, transform 0.35s ease' },
    td: { padding: '16px 20px', fontSize: '0.875rem', borderBottom: '1px solid rgba(38, 50, 56, 0.08)', color: 'var(--color-dark)' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    thumbnail: { width: '48px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(38, 50, 56, 0.12)' },
    badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' },
    badgeOpen: { background: 'rgba(76, 175, 80, 0.2)', color: '#2e7d32' },
    badgeClosed: { background: 'rgba(161, 136, 127, 0.18)', color: '#7a4f41' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    actionBtns: { display: 'flex', gap: '8px' },
    editBtn: { background: 'var(--color-primary)', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
    delBtn: { background: '#fff', color: 'var(--color-accent)', border: '1px solid rgba(161, 136, 127, 0.45)', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(38, 50, 56, 0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(5px)' },
    dialog: { background: '#fff', borderRadius: '18px', padding: '32px', width: '380px', border: '1px solid rgba(38, 50, 56, 0.12)' },
    formModal: { background: '#fff', borderRadius: '22px', width: '860px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', border: '1px solid rgba(38, 50, 56, 0.12)', boxShadow: '0 24px 54px rgba(38, 50, 56, 0.2)' },
    formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '26px 32px 16px' },
    formTitle: { fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-dark)' },
    formSubtitle: { margin: '8px 0 0', color: 'var(--color-muted)', fontSize: '0.86rem' },
    formHeaderActions: { display: 'flex', alignItems: 'center', gap: '10px' },
    formProgressMeta: { padding: '6px 10px', borderRadius: '20px', background: 'rgba(33, 150, 243, 0.12)', color: '#145b97', fontWeight: '800', fontSize: '0.72rem' },
    closeBtn: { background: 'rgba(38, 50, 56, 0.08)', border: 'none', width: '34px', height: '34px', borderRadius: '50%', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-muted)' },
    progressTrack: { margin: '0 32px 12px', height: '8px', borderRadius: '999px', background: 'rgba(38, 50, 56, 0.1)', overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, var(--color-primary), var(--color-blue))', transition: 'width 0.35s ease' },
    errorMsg: { color: '#7a4f41', background: 'rgba(161, 136, 127, 0.16)', margin: '0 32px 16px', padding: '10px 16px', borderRadius: '8px', fontSize: '0.875rem', border: '1px solid rgba(161, 136, 127, 0.35)' },
    form: { padding: '0 32px 32px' },
    formSection: { animation: 'listingFormSectionIn 0.45s ease both' },
    sectionDivider: { fontSize: '0.72rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--color-muted)', borderBottom: '1px solid rgba(38, 50, 56, 0.12)', marginBottom: '20px', paddingBottom: '8px', marginTop: '24px' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.78rem', fontWeight: '700', color: 'var(--color-muted)' },
    input: { padding: '12px', border: '1px solid rgba(38, 50, 56, 0.16)', borderRadius: '10px', outline: 'none', fontFamily: 'inherit', color: 'var(--color-dark)' },
    checkRow: { display: 'flex', gap: '24px', marginBottom: '8px' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer', color: 'var(--color-dark)' },
    biddingSection: { background: 'rgba(33, 150, 243, 0.08)', padding: '20px', borderRadius: '12px', marginBottom: '16px', border: '1px solid rgba(33, 150, 243, 0.2)' },
    biddingFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' },
    cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid rgba(38, 50, 56, 0.2)', background: '#fff', cursor: 'pointer', fontWeight: '700', color: 'var(--color-dark)' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', background: '#2e7d32', color: '#fff', border: 'none' },
    confirmDelBtn: { padding: '12px 24px', background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
    dropZone: { border: '2px dashed rgba(38, 50, 56, 0.2)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' },
    dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    browseText: { color: 'var(--color-dark)', textDecoration: 'underline', fontWeight: '700', marginTop: '12px', fontSize: '0.85rem' },
    previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '14px' },
    previewItem: { border: '1px solid rgba(38, 50, 56, 0.14)', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff' },
    previewImage: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' },
    removeImgBtn: { background: '#fff', color: 'var(--color-accent)', border: '1px solid rgba(161, 136, 127, 0.35)', padding: '8px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }
};

export default SellerListingsPage;
