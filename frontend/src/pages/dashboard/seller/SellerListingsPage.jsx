import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;
const MAX_IMAGES = 5;

const ALL_DISTRICTS = [
    'Ampara', 'Anuradhapura', 'Badulla', 'Batticaloa', 'Colombo', 'Galle',
    'Gampaha', 'Hambantota', 'Jaffna', 'Kalutara', 'Kandy', 'Kegalle',
    'Kilinochchi', 'Kurunegala', 'Mannar', 'Matale', 'Matara', 'Monaragala',
    'Mullaitivu', 'Nuwara Eliya', 'Polonnaruwa', 'Puttalam', 'Ratnapura',
    'Trincomalee', 'Vavuniya',
];

const REVIEW_COLORS = {
    approved: { bg: '#eafaf1', color: '#2ecc71', border: '#2ecc71', label: 'Approved' },
    pending: { bg: '#fff8e6', color: '#b7791f', border: '#f2c86b', label: 'Pending Review' },
    rejected: { bg: '#fff1f0', color: '#c0392b', border: '#f1b0aa', label: 'Rejected' },
};

const SIZE_ERROR = 'Size (Perches) must be greater than zero.';
const PRICE_ERROR = 'Price Per Perch must be greater than zero.';
const STARTING_BID_ERROR = 'Starting Bid must be greater than zero.';
const STARTING_BID_MIN_CURRENT_PRICE_ERROR = (currentPrice) =>
    `Starting Bid cannot be lower than Current Price (Rs. ${currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}).`;
const BIDDING_END_REQUIRED_ERROR = 'Bidding End Date is required when bidding is open.';
const BIDDING_END_FUTURE_ERROR = 'Bidding End Date must be today or a future date.';

const EMPTY_FORM = {
    name: '', district: '', village: '', perches: '', price_per_perch: '',
    land_type: 'Residential', road_access: '',
    electricity: false, water: false,
    distance_to_town_km: '',
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

function getTodayLocalDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    const [fieldErrors, setFieldErrors] = useState({ perches: '', price_per_perch: '', starting_bid: '', bidding_end: '' });
    const [anomalyWarning, setAnomalyWarning] = useState(null); // { is_anomaly, price_status, district_average }
    const [showPredictor, setShowPredictor] = useState(false);
    const [predictForm, setPredictForm] = useState({ district: '', land_type: 'Residential' });
    const [predictionResult, setPredictionResult] = useState(null);
    const totalPrice = calcTotal(form.perches, form.price_per_perch);
    const minBiddingDate = getTodayLocalDate();

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const handleSessionExpired = () => {
        setError('Session expired. Please login again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setTimeout(() => {
            navigate('/login', { state: { from: '/dashboard/seller/listings' } });
        }, 700);
    };

    // ── Fetch seller's own listings from DB ────────────────────────────────
    const fetchListings = () => {
        setLoading(true);
        Promise.all([
            fetch(`${API}/lands/my`, { headers: authHeaders })
                .then(async (r) => {
                    if (r.status === 401) {
                        handleSessionExpired();
                        return [];
                    }
                    return r.json();
                })
                .catch(() => []),
            fetch(`${API}/notifications/`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(async (r) => {
                    if (r.status === 401) {
                        handleSessionExpired();
                        return [];
                    }
                    return r.json();
                })
                .catch(() => [])
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

    const markAllRead = async () => {
        try {
            await fetch(`${API}/notifications/read-all`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchListings();
        } catch {
            // Ignore network failures for mark-as-read action.
        }
    };

    const verificationNotifications = notifications.filter(n =>
        (n.title || '').toLowerCase().includes('land verification') && !n.is_read
    );
    const unreadNotifCount = verificationNotifications.length;

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const nextValue = type === 'checkbox' ? checked : value;

        if (name === 'perches' || name === 'price_per_perch') {
            if (value !== '' && Number(value) <= 0) {
                const message = name === 'perches' ? SIZE_ERROR : PRICE_ERROR;
                setFieldErrors((prev) => ({ ...prev, [name]: message }));
            } else {
                setFieldErrors((prev) => ({ ...prev, [name]: '' }));
            }
        }

        if (name === 'starting_bid') {
            const startingBidValue = Number(value);
            if (value !== '' && startingBidValue <= 0) {
                setFieldErrors((prev) => ({ ...prev, starting_bid: STARTING_BID_ERROR }));
            } else if (value !== '' && totalPrice > 0 && startingBidValue < totalPrice) {
                setFieldErrors((prev) => ({ ...prev, starting_bid: STARTING_BID_MIN_CURRENT_PRICE_ERROR(totalPrice) }));
            } else {
                setFieldErrors((prev) => ({ ...prev, starting_bid: '' }));
            }
        }

        if (name === 'bidding_end') {
            if (!value) {
                setFieldErrors((prev) => ({ ...prev, bidding_end: BIDDING_END_REQUIRED_ERROR }));
            } else {
                const endDate = new Date(`${value}T23:59:59`);
                if (Number.isNaN(endDate.getTime()) || endDate < new Date()) {
                    setFieldErrors((prev) => ({ ...prev, bidding_end: BIDDING_END_FUTURE_ERROR }));
                } else {
                    setFieldErrors((prev) => ({ ...prev, bidding_end: '' }));
                }
            }
        }

        if (name === 'open_for_bidding' && !checked) {
            setFieldErrors((prev) => ({ ...prev, starting_bid: '', bidding_end: '' }));
        }

        setAnomalyWarning(null); // Reset warning if anything changes
        setForm(f => ({ ...f, [name]: nextValue }));
    };

    const [isDragging, setIsDragging] = useState(false);

    const uploadSingleImage = async (file) => {
        const landNameForFolder = (form.name || '').trim() || 'untitled-land';
        const formData = new FormData();
        formData.append('file', file);
        formData.append('land_name', landNameForFolder);

        const res = await fetch(`${API}/lands/upload`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        return data.url;
    };

    const handleUploadMany = async (files) => {
        if (!files || files.length === 0) return;

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
                const uploadedUrl = await uploadSingleImage(file);
                uploadedUrls.push(uploadedUrl);
            }

            const nextUrls = [...existingUrls, ...uploadedUrls].slice(0, MAX_IMAGES);
            setForm(f => ({ ...f, image_url: nextUrls.join(',') }));
            if (files.length <= remainingSlots) {
                setError('');
            }
        } catch {
            setError('Image upload failed');
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

    const handleCheckAnomaly = async () => {
        if (!form.district || !form.price_per_perch || !form.distance_to_town_km) {
            setError('Please fill name, district, price and distance to use AI Check.');
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                ...form,
                perches: parseFloat(form.perches),
                price_per_perch: parseFloat(form.price_per_perch),
                distance_to_town_km: parseFloat(form.distance_to_town_km) || 0,
            };
            const res = await fetch(`${API}/lands/analyze`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            setAnomalyWarning(result);
        } catch {
            setError('Could not reach AI service.');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePredict = async () => {
        if (!predictForm.district) return;
        setSubmitting(true);
        try {
            // We use the analyze endpoint with a dummy low price to just get the district average
            const payload = {
                ...EMPTY_FORM,
                district: predictForm.district,
                land_type: predictForm.land_type,
                price_per_perch: 1000, 
                distance_to_town_km: 0
            };
            const res = await fetch(`${API}/lands/analyze`, {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            setPredictionResult(result.district_average);
        } catch {
            setError('Prediction service unavailable');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({ perches: '', price_per_perch: '', starting_bid: '', bidding_end: '' });
        setSubmitting(true);

        const payload = {
            ...form,
            perches: parseFloat(form.perches),
            price_per_perch: parseFloat(form.price_per_perch),
            distance_to_town_km: parseFloat(form.distance_to_town_km) || 0,
            starting_bid: form.starting_bid ? parseFloat(form.starting_bid) : null,
        };

        if (!Number.isFinite(payload.perches) || payload.perches <= 0) {
            setFieldErrors((prev) => ({ ...prev, perches: SIZE_ERROR }));
            setSubmitting(false);
            return;
        }

        if (!Number.isFinite(payload.price_per_perch) || payload.price_per_perch <= 0) {
            setFieldErrors((prev) => ({ ...prev, price_per_perch: PRICE_ERROR }));
            setSubmitting(false);
            return;
        }

        if (form.open_for_bidding) {
            const startingBidValue = Number(form.starting_bid);
            if (!Number.isFinite(startingBidValue) || startingBidValue <= 0) {
                setFieldErrors((prev) => ({ ...prev, starting_bid: STARTING_BID_ERROR }));
                setSubmitting(false);
                return;
            }

            if (totalPrice > 0 && startingBidValue < totalPrice) {
                setFieldErrors((prev) => ({ ...prev, starting_bid: STARTING_BID_MIN_CURRENT_PRICE_ERROR(totalPrice) }));
                setSubmitting(false);
                return;
            }

            if (!form.bidding_end) {
                setFieldErrors((prev) => ({ ...prev, bidding_end: BIDDING_END_REQUIRED_ERROR }));
                setSubmitting(false);
                return;
            }

            const biddingEndDate = new Date(`${form.bidding_end}T23:59:59`);
            if (Number.isNaN(biddingEndDate.getTime()) || biddingEndDate < new Date()) {
                setFieldErrors((prev) => ({ ...prev, bidding_end: BIDDING_END_FUTURE_ERROR }));
                setSubmitting(false);
                return;
            }
        }

        // If it's a new listing or price changed, check for anomaly FIRST if not already warned
        if (!anomalyWarning) {
            try {
                const res = await fetch(`${API}/lands/analyze`, {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const result = await res.json();
                    if (result.is_anomaly) {
                        setAnomalyWarning(result);
                        setSubmitting(false);
                        return; // Stop and show warning
                    }
                }
            } catch { /* proceed if analyze fails */ }
        }

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
                if (res.status === 401) {
                    handleSessionExpired();
                    return;
                }
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
            const res = await fetch(`${API}/lands/${id}`, { method: 'DELETE', headers: authHeaders });
            if (res.status === 401) {
                handleSessionExpired();
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
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button style={S.aiPredictBtn} onClick={() => { setShowPredictor(true); setPredictionResult(null); }}>
                        ✨ AI Price Predictor
                    </button>
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
                <div style={S.tableWrap}>
                    <table style={S.table}>
                        <thead>
                            <tr>
                                {['Property', 'Location', 'Size', 'Price / Perch', 'Total Price', 'Bidding', 'Review', 'Actions'].map(h => (
                                    <th key={h} style={S.th}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {listings.map((l, i) => {
                                const rc = REVIEW_COLORS[l.review_status || 'pending'] || REVIEW_COLORS.pending;
                                const lid = l.id || l._id;
                                return (
                                    <tr key={lid} style={{ ...S.tr, background: i % 2 === 0 ? '#fff' : '#fdfaf7' }}>
                                        <td style={S.td}>
                                            <div style={S.nameCell}>
                                                {l.image_url && (
                                                    <img src={l.image_url.split(',')[0]} alt={l.name} style={S.thumbnail} />
                                                )}
                                                <button
                                                    type="button"
                                                    style={S.propertyLinkBtn}
                                                    onClick={() => navigate(`/dashboard/seller/listings/${lid}`)}
                                                >
                                                    {l.name}
                                                </button>
                                            </div>
                                        </td>
                                        <td style={S.td}>{l.village}, {l.district}</td>
                                        <td style={S.td}>{l.perches} perches</td>
                                        <td style={S.td}>
                                            <div style={{ fontSize: '0.8rem', color: '#666' }}>Rs. {Number(l.price_per_perch).toLocaleString()} / perch</div>
                                            {l.starting_bid && <div style={{ fontSize: '0.75rem', color: '#1A1A1A', fontWeight: '600' }}>Bid: Rs. {Number(l.starting_bid).toLocaleString()}</div>}
                                        </td>
                                        <td style={{ ...S.td, fontWeight: '700' }}>
                                            <div>Rs. {Number(l.total_price).toLocaleString()}</div>
                                            {l.is_anomaly ? (
                                                <div style={{ 
                                                    marginTop: '4px', 
                                                    fontSize: '0.65rem', 
                                                    color: '#e74c3c',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <span>⚠️</span> 
                                                    {l.price_status === 'high' ? 'High Price Anomaly' : 'Low Price Anomaly'}
                                                </div>
                                            ) : (
                                                <div style={{ 
                                                    marginTop: '4px', 
                                                    fontSize: '0.65rem', 
                                                    color: '#2ecc71',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    <span>✅</span> AI Market Aligned
                                                </div>
                                            )}
                                        </td>
                                        <td style={S.td}>
                                            <span style={{ ...S.badge, ...(l.open_for_bidding ? S.badgeOpen : S.badgeClosed) }}>
                                                {l.open_for_bidding ? 'Open' : 'Closed'}
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
                                                        land_type: l.land_type,
                                                        road_access: l.road_access || '',
                                                        electricity: l.electricity, water: l.water,
                                                        distance_to_town_km: l.distance_to_town_km || '',
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
                                    <select name="district" value={form.district} onChange={handleFormChange} required style={S.input}>
                                        <option value="">Select District</option>
                                        {ALL_DISTRICTS.map((district) => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Village / Area *</label>
                                    <input name="village" value={form.village} onChange={handleFormChange} required style={S.input} />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Size (Perches) *</label>
                                    <input
                                        name="perches"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.perches}
                                        onChange={handleFormChange}
                                        required
                                        style={S.input}
                                    />
                                    {fieldErrors.perches && <span style={S.fieldError}>{fieldErrors.perches}</span>}
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Price Per Perch (Rs.) *</label>
                                    <input
                                        name="price_per_perch"
                                        type="number"
                                        value={form.price_per_perch}
                                        onChange={handleFormChange}
                                        required
                                        style={S.input}
                                    />
                                    {fieldErrors.price_per_perch && <span style={S.fieldError}>{fieldErrors.price_per_perch}</span>}
                                </div>
                                <div style={{ ...S.formGroup, gridColumn: '1 / -1' }}>
                                    <label style={S.label}>Final Price (Rs.)</label>
                                    <div style={S.totalPriceBox}>
                                        Rs. {totalPrice > 0 ? totalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                                    </div>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Land Type</label>
                                    <select name="land_type" value={form.land_type} onChange={handleFormChange} style={S.input}>
                                        {['Residential', 'Agricultural', 'Commercial', 'Mixed'].map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Road Access</label>
                                    <input name="road_access" value={form.road_access} onChange={handleFormChange} style={S.input} placeholder="e.g. 15ft Carpet Road" />
                                </div>
                                <div style={S.formGroup}>
                                    <label style={S.label}>Distance To Town (Km) *</label>
                                    <input 
                                        name="distance_to_town_km" 
                                        type="number" 
                                        step="0.1" 
                                        value={form.distance_to_town_km} 
                                        onChange={handleFormChange} 
                                        required 
                                        style={S.input} 
                                        placeholder="Distance for AI analysis"
                                    />
                                </div>
                            </div>

                            <div style={S.checkRow}>
                                <label style={S.checkLabel}><input type="checkbox" name="electricity" checked={form.electricity} onChange={handleFormChange} /> Electricity</label>
                                <label style={S.checkLabel}><input type="checkbox" name="water" checked={form.water} onChange={handleFormChange} /> Water</label>
                            </div>

                            <div style={S.sectionDivider}>Property Image</div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Upload Property Photos (Max {MAX_IMAGES})</label>
                                <div
                                    onDrop={onDrop}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    style={{
                                        ...S.dropZone,
                                        borderColor: isDragging ? '#1A1A1A' : '#e5e0da',
                                        background: isDragging ? '#fdfaf7' : '#fff'
                                    }}
                                    onClick={() => document.getElementById('fileInput').click()}
                                >
                                    <div style={S.dropContent}>
                                        <span style={{ fontSize: '2rem', marginBottom: '8px' }}>📸</span>
                                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Drag & drop images here</span>
                                        <span style={{ fontSize: '0.75rem', color: '#888' }}>Support for JPG, PNG (Max 5MB each)</span>
                                        <span style={S.browseText}>or browse files</span>
                                        <span style={{ fontSize: '0.75rem', color: '#777' }}>{getImageUrls(form.image_url).length} / {MAX_IMAGES} selected</span>
                                    </div>
                                    <input
                                        id="fileInput"
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        hidden
                                        onChange={(e) => {
                                            handleUploadMany(e.target.files);
                                            setAnomalyWarning(null); // reset if files changed
                                        }}
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

                            <div style={S.sectionDivider}>Bidding Config</div>
                            <div style={S.biddingSection}>
                                <label style={S.checkLabel}>
                                    <input type="checkbox" name="open_for_bidding" checked={form.open_for_bidding} onChange={handleFormChange} />
                                    Open for Bidding
                                </label>
                                {form.open_for_bidding && (
                                    <div style={S.biddingFields}>
                                        <div style={S.currentPriceCard}>
                                            <span style={S.currentPriceLabel}>Current Price (Rs.)</span>
                                            <span style={S.currentPriceValue}>
                                                Rs. {totalPrice > 0 ? totalPrice.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'}
                                            </span>
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Starting Bid (Rs.)</label>
                                            <input
                                                name="starting_bid"
                                                type="number"
                                                value={form.starting_bid}
                                                onChange={handleFormChange}
                                                style={S.input}
                                            />
                                            {fieldErrors.starting_bid && <span style={S.fieldError}>{fieldErrors.starting_bid}</span>}
                                        </div>
                                        <div style={S.formGroup}>
                                            <label style={S.label}>Bidding End Date</label>
                                            <input name="bidding_end" type="date" min={minBiddingDate} value={form.bidding_end} onChange={handleFormChange} style={S.input} />
                                            {fieldErrors.bidding_end && <span style={S.fieldError}>{fieldErrors.bidding_end}</span>}
                                        </div>
                                    </div>
                                )}
                            </div>


                            {anomalyWarning && (
                                <div style={{ 
                                    background: anomalyWarning.is_anomaly ? '#FFF5F5' : '#F5FFF5', 
                                    border: `1px solid ${anomalyWarning.is_anomaly ? '#FFC1C1' : '#C1FFC1'}`,
                                    padding: '16px', 
                                    borderRadius: '12px', 
                                    marginTop: '20px' 
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: '800', color: anomalyWarning.is_anomaly ? '#C53030' : '#2F855A' }}>
                                        {anomalyWarning.is_anomaly ? 'AI Market Validation: Pricing Deviation Detected' : 'AI Market Validation: Optimal Pricing'}
                                    </h4>
                                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#1a1a1a', lineHeight: '1.5', fontWeight: '700' }}>
                                        {anomalyWarning.is_anomaly 
                                            ? `Our analysis indicates the price per perch (Rs. ${Number(form.price_per_perch).toLocaleString()}) is significantly ${anomalyWarning.price_status} for ${form.district}.`
                                            : `The specified price aligns effectively with the current market valuation trends for ${form.district}.`
                                        }
                                    </p>
                                    <div style={{ marginTop: '10px', fontSize: '0.94rem', fontWeight: '900', color: '#1A52E8' }}>
                                        District Market Average: Rs. {Number(anomalyWarning.district_average).toLocaleString()}
                                    </div>
                                    {anomalyWarning.is_anomaly && (
                                        <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', fontWeight: '800', fontStyle: 'italic', color: '#C53030' }}>
                                            Confirmation required: Do you wish to proceed with this valuation?
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                        <button type="button" style={{ ...S.cancelBtn, flex: 1, padding: '8px' }} onClick={() => setAnomalyWarning(null)}>Adjust Price</button>
                                        <button type="button" style={{ ...S.confirmBtn, flex: 1, padding: '8px', background: anomalyWarning.is_anomaly ? '#E53E3E' : '#38A169', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }} onClick={() => {
                                            const warning = anomalyWarning;
                                            setAnomalyWarning(null); 
                                            handleSubmit({ preventDefault: () => {}, target: { form: {} }, forceSubmit: true });
                                        }}>
                                            {anomalyWarning.is_anomaly ? 'Proceed anyway' : 'Continue'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div style={S.formFooter}>
                                {!anomalyWarning && (
                                    <button type="button" onClick={handleCheckAnomaly} style={S.aiCheckBtnFooter} disabled={submitting}>
                                        🔍 Check the price with anomaly detection
                                    </button>
                                )}
                                <button type="button" style={S.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                                <button type="submit" className="btn-dark" style={S.saveBtn} disabled={submitting}>
                                    {submitting ? 'Saving…' : (editingId ? 'Save Changes' : 'Create Listing')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* AI Predictor Modal */}
            {showPredictor && (
                <div style={S.overlay}>
                    <div style={{ ...S.dialog, width: '450px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <h3 style={{ margin: 0 }}>AI Market Predictor</h3>
                            <button onClick={() => setShowPredictor(false)} style={S.closeBtn}>&times;</button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '20px' }}>
                            Select a location to see the AI-predicted average market value per perch.
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={S.formGroup}>
                                <label style={S.label}>District</label>
                                <select 
                                    value={predictForm.district} 
                                    onChange={(e) => setPredictForm({ ...predictForm, district: e.target.value })}
                                    style={S.input}
                                >
                                    <option value="">Select District</option>
                                    {ALL_DISTRICTS.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div style={S.formGroup}>
                                <label style={S.label}>Land Type</label>
                                <select 
                                    value={predictForm.land_type} 
                                    onChange={(e) => setPredictForm({ ...predictForm, land_type: e.target.value })}
                                    style={S.input}
                                >
                                    {['Residential', 'Agricultural', 'Commercial', 'Mixed'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            
                            <button 
                                onClick={handlePredict} 
                                disabled={!predictForm.district || submitting}
                                style={{ ...S.saveBtn, background: '#1A52E8', marginTop: '10px' }}
                            >
                                {submitting ? 'Analyzing...' : 'Predict Market Value'}
                            </button>

                            {predictionResult && (
                                <div style={{ 
                                    marginTop: '20px', 
                                    padding: '20px', 
                                    background: '#F0F4FF', 
                                    borderRadius: '12px', 
                                    textAlign: 'center',
                                    border: '1px solid #D0DBFF'
                                }}>
                                    <div style={{ fontSize: '0.8rem', color: '#1A52E8', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>
                                        AI Predicted Valuation
                                    </div>
                                    <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#1A1A1A' }}>
                                        Rs. {Number(predictionResult).toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                                        Average price per perch in {predictForm.district}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    notifPanel: { background: '#FFF5F5', border: '1px solid #FFE4E4', borderRadius: '20px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    notifHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    notifTitle: { fontSize: '1rem', fontWeight: '800', margin: 0 },
    unreadBadge: { fontSize: '0.7rem', background: '#FF4D4D', color: '#FFF', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' },
    readAllBtn: { background: 'none', border: 'none', color: '#666', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' },
    notifList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    notifItem: { display: 'flex', gap: '12px', alignItems: 'center', background: '#FFF', padding: '12px', borderRadius: '12px', border: '1px solid #F0EBE4' },
    notifDot: { width: '8px', height: '8px', background: '#FF4D4D', borderRadius: '50%' },
    notifText: { fontSize: '0.9rem', color: '#1A1A1A' },
    notifSub: { fontSize: '0.8rem', color: '#666' },
    rejectReason: { marginTop: '6px', fontSize: '0.74rem', color: '#a23a2b', fontWeight: '600' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
<<<<<<< Updated upstream
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '0.95rem' },
    addBtn: { padding: '12px 24px', borderRadius: '10px', fontWeight: '700', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' },
    aiPredictBtn: { 
        padding: '12px 24px', 
        borderRadius: '10px', 
        fontWeight: '700', 
        background: '#fff', 
        color: '#1A52E8', 
        border: '1.5px solid #1A52E8', 
        cursor: 'pointer', 
        transition: 'all 0.2s' 
    },
=======
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A' },
    subtitle: { color: '#777', fontSize: '0.95rem' },
    addBtn: { padding: '12px 24px', borderRadius: '10px', fontWeight: '700' },
>>>>>>> Stashed changes
    empty: { textAlign: 'center', color: '#999', marginTop: '80px', fontSize: '1rem' },
    tableWrap: { background: '#fff', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflow: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '16px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#888', borderBottom: '2px solid #f5f0ea' },
    tr: { transition: 'background 0.15s' },
    td: { padding: '16px 20px', fontSize: '0.875rem', borderBottom: '1px solid #f5f0ea' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    propertyLinkBtn: {
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        fontWeight: '700',
        color: '#1A1A1A',
        cursor: 'pointer',
        textAlign: 'left',
        textDecoration: 'underline'
    },
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
    totalPriceBox: {
        padding: '12px',
        border: '1px solid #d8d1c8',
        borderRadius: '8px',
        background: '#fdfaf7',
        fontWeight: '800',
        color: '#1A1A1A'
    },
    fieldError: { fontSize: '0.76rem', color: '#d32f2f', marginTop: '2px', fontWeight: '600' },
    checkRow: { display: 'flex', gap: '24px', marginBottom: '8px' },
    checkLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' },
    biddingSection: { background: '#fdfaf7', padding: '20px', borderRadius: '12px', marginBottom: '16px' },
    biddingFields: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' },
    currentPriceCard: {
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderRadius: '8px',
        border: '1px solid #d8d1c8',
        background: '#fff'
    },
    currentPriceLabel: { fontSize: '0.78rem', fontWeight: '700', color: '#666' },
<<<<<<< Updated upstream
    currentPriceValue: { fontSize: '1rem', fontWeight: '800', color: 'var(--color-dark)' },
    formFooter: { display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '32px' },
    cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontWeight: '700', transition: 'all 0.2s' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700', background: 'var(--color-primary)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.2s' },
    aiCheckBtnFooter: { 
        padding: '12px 20px', 
        borderRadius: '8px', 
        fontWeight: '700', 
        background: '#fff', 
        color: '#1A52E8', 
        border: '1.5px solid #1A52E8', 
        cursor: 'pointer', 
        transition: 'all 0.2s', 
        fontSize: '0.88rem',
        marginRight: 'auto' // Pulls it to the left side of footer
    },
    confirmBtn: { transition: 'all 0.2s' },
    confirmDelBtn: { padding: '12px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    dropZone: { border: '2px dashed var(--color-border)', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' },
=======
    currentPriceValue: { fontSize: '1rem', fontWeight: '800', color: '#1A1A1A' },
    formFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' },
    cancelBtn: { padding: '12px 24px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontWeight: '700' },
    saveBtn: { padding: '12px 32px', borderRadius: '8px', fontWeight: '700' },
    confirmDelBtn: { padding: '12px 24px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
    dropZone: { border: '2px dashed #e5e0da', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative' },
>>>>>>> Stashed changes
    dropContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' },
    browseText: { color: '#1A1A1A', textDecoration: 'underline', fontWeight: '700', marginTop: '12px', fontSize: '0.85rem' },
    previewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginTop: '14px' },
    previewItem: { border: '1px solid #e5e0da', borderRadius: '10px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff' },
    previewImage: { width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' },
    removeImgBtn: { background: '#fff', color: '#c0392b', border: '1px solid #f1b0aa', padding: '8px 10px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }
};

export default SellerListingsPage;
