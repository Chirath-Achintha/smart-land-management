import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../apiConfig';

const API = API_BASE_URL;

const AdminDashboard = () => {
    const navigate = useNavigate();

    // Stats
    const [stats, setStats] = useState([]);

    // Profile fetched from DB
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);

    // Land verification state
    const [sellerLandGroups, setSellerLandGroups] = useState([]);
    const [landsLoading, setLandsLoading] = useState(true);
    const [landsError, setLandsError] = useState('');
    const [allLands, setAllLands] = useState([]);
    const [allLandsLoading, setAllLandsLoading] = useState(true);
    const [allLandsError, setAllLandsError] = useState('');
    const [landTab, setLandTab] = useState('pending');
    const [actionLoadingId, setActionLoadingId] = useState('');
    const [previewLand, setPreviewLand] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState('');
    const [imageViewer, setImageViewer] = useState({ open: false, images: [], index: 0 });
    const [rejectLand, setRejectLand] = useState(null);
    const [rejectMessage, setRejectMessage] = useState('');
    const [rejectError, setRejectError] = useState('');
    const [editLand, setEditLand] = useState(null);
    const [editForm, setEditForm] = useState({
        name: '',
        district: '',
        village: '',
        perches: '',
        price_per_perch: '',
        land_type: 'Residential',
        status: 'Available',
        road_access: '',
        image_url: '',
        electricity: false,
        water: false
    });
    const [editError, setEditError] = useState('');

    const getToken = () => localStorage.getItem('access_token');

    const fetchSellerLandGroups = async () => {
        const token = getToken();
        if (!token) {
            setLandsLoading(false);
            return;
        }

        setLandsLoading(true);
        setLandsError('');

        try {
            const res = await fetch(`${API}/lands/admin/by-seller`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to load land verification queue');
            }

            const data = await res.json();
            setSellerLandGroups(Array.isArray(data) ? data : []);
        } catch (e) {
            if (e.message === 'Failed to fetch') {
                setLandsError('Cannot connect to backend. Please make sure FastAPI server is running on http://localhost:8000.');
            } else {
                setLandsError(e.message || 'Failed to load land verification queue');
            }
            setSellerLandGroups([]);
        } finally {
            setLandsLoading(false);
        }
    };

    const fetchAllLands = async () => {
        const token = getToken();
        if (!token) {
            setAllLandsLoading(false);
            return;
        }

        setAllLandsLoading(true);
        setAllLandsError('');

        try {
            const res = await fetch(`${API}/lands/admin/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to load all lands');
            }

            const data = await res.json();
            setAllLands(Array.isArray(data) ? data : []);
        } catch (e) {
            if (e.message === 'Failed to fetch') {
                setAllLandsError('Cannot connect to backend. Please make sure FastAPI server is running on http://localhost:8000.');
            } else {
                setAllLandsError(e.message || 'Failed to load all lands');
            }
            setAllLands([]);
        } finally {
            setAllLandsLoading(false);
        }
    };

    const refreshLandData = async () => {
        await Promise.all([fetchSellerLandGroups(), fetchAllLands()]);
    };

    const handleVerifyLand = async (land, shouldVerify, note = null) => {
        const token = getToken();
        if (!token) return false;

        setActionLoadingId(land.id || land._id);
        try {
            const res = await fetch(`${API}/lands/${land.id || land._id}/verify`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    is_verified: shouldVerify,
                    verification_note: note || null
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (!shouldVerify && res.status === 404) {
                    // If already removed by a previous request, treat as success and refresh.
                    await refreshLandData();
                    return true;
                }
                throw new Error(err.detail || 'Failed to update verification status');
            }

            await refreshLandData();
            return true;
        } catch (e) {
            alert(e.message || 'Failed to update verification status');
            return false;
        } finally {
            setActionLoadingId('');
        }
    };

    const openRejectModal = (land) => {
        setRejectLand(land);
        setRejectMessage('');
        setRejectError('');
    };

    const closeRejectModal = () => {
        setRejectLand(null);
        setRejectMessage('');
        setRejectError('');
    };

    const submitReject = async () => {
        if (!rejectLand) return;
        if (!rejectMessage.trim()) {
            setRejectError('Rejection message is required.');
            return;
        }

        const ok = await handleVerifyLand(rejectLand, false, rejectMessage.trim());
        if (ok) {
            closeRejectModal();
        }
    };

    const openEditModal = (land) => {
        setEditLand(land);
        setEditError('');
        setEditForm({
            name: land.name || '',
            district: land.district || '',
            village: land.village || '',
            perches: String(land.perches ?? ''),
            price_per_perch: String(land.price_per_perch ?? ''),
            land_type: land.land_type || 'Residential',
            status: land.status || 'Available',
            road_access: land.road_access || '',
            image_url: land.image_url || '',
            electricity: Boolean(land.electricity),
            water: Boolean(land.water)
        });
    };

    const closeEditModal = () => {
        setEditLand(null);
        setEditError('');
    };

    const submitEditLand = async () => {
        if (!editLand) return;
        const token = getToken();
        if (!token) return;

        const landId = editLand.id || editLand._id;
        const perchesValue = Number(editForm.perches);
        const pricePerPerchValue = Number(editForm.price_per_perch);

        if (!editForm.name.trim() || !editForm.district.trim() || !editForm.village.trim()) {
            setEditError('Name, district, and village are required.');
            return;
        }

        if (!Number.isFinite(perchesValue) || perchesValue <= 0) {
            setEditError('Perches must be a positive number.');
            return;
        }

        if (!Number.isFinite(pricePerPerchValue) || pricePerPerchValue <= 0) {
            setEditError('Price per perch must be a positive number.');
            return;
        }

        setActionLoadingId(landId);
        setEditError('');

        try {
            const payload = {
                name: editForm.name.trim(),
                district: editForm.district.trim(),
                village: editForm.village.trim(),
                perches: perchesValue,
                price_per_perch: pricePerPerchValue,
                land_type: editForm.land_type,
                status: editForm.status,
                road_access: editForm.road_access.trim() || null,
                image_url: editForm.image_url.trim() || null,
                electricity: Boolean(editForm.electricity),
                water: Boolean(editForm.water)
            };

            const res = await fetch(`${API}/lands/${landId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to update land');
            }

            await refreshLandData();
            closeEditModal();
        } catch (e) {
            setEditError(e.message || 'Failed to update land');
        } finally {
            setActionLoadingId('');
        }
    };

    const handleDeleteLand = async (land) => {
        const token = getToken();
        if (!token) return;
        const landId = land.id || land._id;

        if (!window.confirm(`Delete land listing "${land.name}"? This cannot be undone.`)) {
            return;
        }

        setActionLoadingId(landId);
        try {
            const res = await fetch(`${API}/lands/${landId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to delete land');
            }

            await refreshLandData();
        } catch (e) {
            alert(e.message || 'Failed to delete land');
        } finally {
            setActionLoadingId('');
        }
    };

    const getLandImages = (imageUrl) => {
        if (!imageUrl) return [];
        return String(imageUrl).split(',').map((u) => u.trim()).filter(Boolean);
    };

    const openPreviewModal = async (land) => {
        const token = getToken();
        const landId = land.id || land._id;

        setPreviewLand(land);
        setPreviewLoading(true);
        setPreviewError('');

        if (!token || !landId) {
            setPreviewLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API}/lands/${landId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.detail || 'Failed to load full land details.');
            }

            const data = await res.json();
            setPreviewLand(data || land);
        } catch (e) {
            setPreviewError(e.message || 'Failed to load full land details.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const openImageViewer = (images, index = 0) => {
        if (!Array.isArray(images) || images.length === 0) return;
        const safeIndex = Math.max(0, Math.min(index, images.length - 1));
        setImageViewer({ open: true, images, index: safeIndex });
    };

    const closeImageViewer = () => {
        setImageViewer({ open: false, images: [], index: 0 });
    };

    const showPrevImage = () => {
        setImageViewer((prev) => {
            if (!prev.open || prev.images.length === 0) return prev;
            const nextIndex = (prev.index - 1 + prev.images.length) % prev.images.length;
            return { ...prev, index: nextIndex };
        });
    };

    const showNextImage = () => {
        setImageViewer((prev) => {
            if (!prev.open || prev.images.length === 0) return prev;
            const nextIndex = (prev.index + 1) % prev.images.length;
            return { ...prev, index: nextIndex };
        });
    };

    const renderLandRow = (land, extraMeta = null, mode = 'pending') => {
        const landId = land.id || land._id;
        const isWorking = actionLoadingId === landId;

        return (
            <div key={landId} style={S.landRow}>
                <div style={S.landMain}>
                    {land.image_url ? (
                        <img src={land.image_url.split(',')[0]} alt={land.name} style={S.landImage} />
                    ) : (
                        <div style={S.landImagePlaceholder}>No Image</div>
                    )}
                    <div>
                        <div style={S.landTitle}>{land.name}</div>
                        <div style={S.landMeta}>
                            {land.village}, {land.district} | {land.perches} perches | Rs. {Number(land.total_price || 0).toLocaleString()}
                        </div>
                        <div style={S.landMeta}>
                            Status: {land.status} | Verification: {land.is_verified ? 'Verified' : 'Pending'}
                        </div>
                        {extraMeta && <div style={S.landMeta}>{extraMeta}</div>}
                        {land.verification_note && (
                            <div style={S.noteText}>Note: {land.verification_note}</div>
                        )}
                    </div>
                </div>

                {mode === 'pending' ? (
                    <div style={S.verifyActions}>
                        <button
                            style={S.viewActionBtn}
                            onClick={() => openPreviewModal(land)}
                        >
                            View
                        </button>
                        <button
                            style={S.approveBtn}
                            disabled={isWorking || land.is_verified}
                            onClick={() => handleVerifyLand(land, true, null)}
                        >
                            {isWorking ? 'Saving...' : 'Approve'}
                        </button>
                        <button
                            style={S.rejectBtn}
                            disabled={isWorking}
                            onClick={() => openRejectModal(land)}
                        >
                            {isWorking ? 'Saving...' : 'Reject'}
                        </button>
                    </div>
                ) : (
                    <div style={S.verifyActions}>
                        <button
                            style={S.viewActionBtn}
                            onClick={() => navigate(`/lands/${landId}`)}
                        >
                            View
                        </button>
                        <button
                            style={S.deleteActionBtn}
                            disabled={isWorking}
                            onClick={() => handleDeleteLand(land)}
                        >
                            {isWorking ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    // Fetch user from DB using JWT
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) { setProfileLoading(false); return; }

        // Fetch Profile
        fetch(`${API}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                const profileData = {
                    name: data.full_name || '',
                    email: data.email || '',
                    nic: data.nic_number || '',
                    address: data.address || '',
                    role: (data.role || '').replace('_', ' '),
                };
                setProfile(profileData);
            })
            .catch(console.error)
            .finally(() => setProfileLoading(false));

        // Fetch Stats
        fetch(`${API}/admin/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(setStats)
            .catch(console.error);

        refreshLandData();
    }, []);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Admin Dashboard</h1>
                <p style={S.subtitle}>
                    {profileLoading ? 'Loading...' : <>Welcome back, <strong>{profile?.name}</strong>! System overview and management center.</>}
                </p>
            </div>

            {/* Summary Cards */}
            <div style={S.cardGrid}>
                {stats.map((c, i) => (
                    <div
                        key={i}
                        style={{ ...S.card, borderTop: `4px solid ${c.color}` }}
                        onClick={() => navigate(c.route)}
                    >
                        <div style={{ ...S.statVal, color: c.color }}>{c.count}</div>
                        <div style={S.statLabel}>{c.label}</div>
                    </div>
                ))}

                {previewLand && (
                    <div style={S.modalOverlay}>
                        <div style={S.previewModalCard}>
                            <div style={S.previewHeader}>
                                <h3 style={S.modalTitle}>Land Details</h3>
                                <button
                                    style={S.modalCancelBtn}
                                    onClick={() => {
                                        setPreviewLand(null);
                                        setPreviewError('');
                                    }}
                                >
                                    Close
                                </button>
                            </div>

                            {previewError && <div style={S.modalError}>{previewError}</div>}
                            {previewLoading ? (
                                <div style={S.emptyState}>Loading full details...</div>
                            ) : (
                                <>
                                    <div style={S.previewDetailsGrid}>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Property</span><span style={S.previewValue}>{previewLand.name || '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Land Type</span><span style={S.previewValue}>{previewLand.land_type || '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>District</span><span style={S.previewValue}>{previewLand.district || '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Village</span><span style={S.previewValue}>{previewLand.village || '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Perches</span><span style={S.previewValue}>{previewLand.perches ?? '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Price / Perch</span><span style={S.previewValue}>Rs. {Number(previewLand.price_per_perch || 0).toLocaleString()}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Total Price</span><span style={S.previewValue}>Rs. {Number(previewLand.total_price || 0).toLocaleString()}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Road Access</span><span style={S.previewValue}>{previewLand.road_access || '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Status</span><span style={S.previewValue}>{previewLand.status || '-'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Verification</span><span style={S.previewValue}>{previewLand.is_verified ? 'Verified' : 'Pending'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Electricity</span><span style={S.previewValue}>{previewLand.electricity ? 'Yes' : 'No'}</span></div>
                                        <div style={S.previewDetailItem}><span style={S.previewLabel}>Water</span><span style={S.previewValue}>{previewLand.water ? 'Yes' : 'No'}</span></div>
                                    </div>

                                    {previewLand.verification_note && (
                                        <div style={S.previewNote}>Verification Note: {previewLand.verification_note}</div>
                                    )}

                                    <div style={S.previewSectionTitle}>Property Images</div>
                                    {getLandImages(previewLand.image_url).length > 0 ? (
                                        <div style={S.previewImagesGrid}>
                                            {getLandImages(previewLand.image_url).map((img, idx, images) => (
                                                <button
                                                    key={`${img}-${idx}`}
                                                    type="button"
                                                    style={S.previewImageBtn}
                                                    onClick={() => openImageViewer(images, idx)}
                                                >
                                                    <img src={img} alt={`Land ${idx + 1}`} style={S.previewImage} />
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={S.emptyState}>No images uploaded for this listing.</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div style={S.dashboardContent}>
                <div style={S.mainColumn}>
                    {/* Quick Actions */}
                    <div style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Management</h2>
                        <div style={S.btnRow}>
                            <button className="btn-dark" style={S.actionBtn} onClick={() => navigate('/dashboard/users')}>
                                User Directory
                            </button>
                            <button className="btn-dark" style={{ ...S.actionBtn, background: '#e74c3c' }} onClick={() => navigate('/dashboard/admin/complaints')}>
                                Inquiry Inbox 📩
                            </button>
                        </div>
                    </div>

                    {/* Land Verification */}
                    <div style={S.sectionCard}>
                        <div style={S.cardHeader}>
                            <h2 style={S.sectionTitle}>Land Management</h2>
                            <div style={S.tabActions}>
                                <button
                                    style={{ ...S.tabBtn, ...(landTab === 'pending' ? S.tabBtnActive : {}) }}
                                    onClick={() => setLandTab('pending')}
                                >
                                    Pending Queue
                                </button>
                                <button
                                    style={{ ...S.tabBtn, ...(landTab === 'all' ? S.tabBtnActive : {}) }}
                                    onClick={() => setLandTab('all')}
                                >
                                    All Lands
                                </button>
                                <button style={S.editBtn} onClick={refreshLandData}>Refresh</button>
                            </div>
                        </div>

                        {landTab === 'pending' ? (
                            landsLoading ? (
                                <div style={S.emptyState}>Loading lands...</div>
                            ) : landsError ? (
                                <div style={S.errorBox}>{landsError}</div>
                            ) : sellerLandGroups.length === 0 ? (
                                <div style={S.emptyState}>No seller listings found.</div>
                            ) : (
                                <div style={S.verifyWrap}>
                                    {sellerLandGroups.map((group) => (
                                        <div key={group.seller_id} style={S.sellerBlock}>
                                            <div style={S.sellerHeader}>
                                                <div>
                                                    <h3 style={S.sellerName}>{group.seller_name}</h3>
                                                    <div style={S.sellerMeta}>{group.seller_email}</div>
                                                </div>
                                                <div style={S.countRow}>
                                                    <span style={S.countBadge}>Total: {group.total_lands}</span>
                                                    <span style={{ ...S.countBadge, ...S.verifiedBadge }}>Verified: {group.verified_lands}</span>
                                                    <span style={{ ...S.countBadge, ...S.pendingBadge }}>Pending: {group.pending_lands}</span>
                                                </div>
                                            </div>

                                            {group.lands.length === 0 ? (
                                                <div style={S.emptyStateSmall}>No lands from this seller yet.</div>
                                            ) : (
                                                <div style={S.landList}>
                                                    {group.lands.map((land) => renderLandRow(land, null, 'pending'))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : allLandsLoading ? (
                            <div style={S.emptyState}>Loading all lands...</div>
                        ) : allLandsError ? (
                            <div style={S.errorBox}>{allLandsError}</div>
                        ) : allLands.length === 0 ? (
                            <div style={S.emptyState}>No lands found.</div>
                        ) : (
                            <div style={S.sellerBlock}>
                                <div style={S.allLandsHeader}>
                                    Total listings: <strong>{allLands.length}</strong>
                                </div>
                                <div style={S.landList}>
                                    {allLands.map((land) => renderLandRow(land, `Seller ID: ${land.seller_id} | Review: ${land.review_status || 'pending'}`, 'view-delete'))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div style={S.sideColumn}>
                    {/* System Status Activity */}
                    <div style={S.sectionCard}>
                        <h2 style={S.sectionTitle}>System Logs</h2>
                        <div style={S.activityList}>
                            {[
                                { text: 'All systems operational', time: 'Active', color: '#27ae60' },
                                { text: 'Database backup completed', time: '2 hrs ago', color: '#3498db' },
                                { text: '3 agent applications pending', time: 'Action Reqd', color: '#e67e22' },
                            ].map((a, i) => (
                                <div key={i} style={S.activityItem}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.color }} />
                                    <span style={S.actText}>{a.text}</span>
                                    <span style={S.actTime}>{a.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {imageViewer.open && (
                <div style={S.imageViewerOverlay} onClick={closeImageViewer}>
                    <div style={S.imageViewerCard} onClick={(e) => e.stopPropagation()}>
                        <button style={S.imageViewerCloseBtn} onClick={closeImageViewer}>Close</button>
                        <img
                            src={imageViewer.images[imageViewer.index]}
                            alt={`Preview ${imageViewer.index + 1}`}
                            style={S.imageViewerMain}
                        />
                        {imageViewer.images.length > 1 && (
                            <div style={S.imageViewerNavRow}>
                                <button style={S.imageViewerNavBtn} onClick={showPrevImage}>Previous</button>
                                <span style={S.imageViewerCount}>{imageViewer.index + 1} / {imageViewer.images.length}</span>
                                <button style={S.imageViewerNavBtn} onClick={showNextImage}>Next</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {rejectLand && (
                <div style={S.modalOverlay}>
                    <div style={S.modalCard}>
                        <h3 style={S.modalTitle}>Reject Land Listing</h3>
                        <p style={S.modalText}>
                            Send a rejection message to seller for <strong>{rejectLand.name}</strong>.
                        </p>
                        <textarea
                            style={S.modalTextArea}
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                            placeholder="Type rejection reason here..."
                            rows={4}
                        />
                        {rejectError && <div style={S.modalError}>{rejectError}</div>}
                        <div style={S.modalActions}>
                            <button style={S.modalCancelBtn} onClick={closeRejectModal}>Cancel</button>
                            <button
                                style={S.modalRejectBtn}
                                onClick={submitReject}
                                disabled={Boolean(rejectLand && actionLoadingId === (rejectLand.id || rejectLand._id))}
                            >
                                {Boolean(rejectLand && actionLoadingId === (rejectLand.id || rejectLand._id)) ? 'Sending...' : 'Send & Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editLand && (
                <div style={S.modalOverlay}>
                    <div style={S.modalCard}>
                        <h3 style={S.modalTitle}>Edit Land Listing</h3>
                        <p style={S.modalText}>Update details for <strong>{editLand.name}</strong>.</p>

                        <div style={S.editFormGrid}>
                            <input style={S.modalInput} value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} placeholder="Name" />
                            <input style={S.modalInput} value={editForm.district} onChange={(e) => setEditForm((p) => ({ ...p, district: e.target.value }))} placeholder="District" />
                            <input style={S.modalInput} value={editForm.village} onChange={(e) => setEditForm((p) => ({ ...p, village: e.target.value }))} placeholder="Village" />
                            <input style={S.modalInput} type="number" min="0" step="0.01" value={editForm.perches} onChange={(e) => setEditForm((p) => ({ ...p, perches: e.target.value }))} placeholder="Perches" />
                            <input style={S.modalInput} type="number" min="0" step="0.01" value={editForm.price_per_perch} onChange={(e) => setEditForm((p) => ({ ...p, price_per_perch: e.target.value }))} placeholder="Price Per Perch" />
                            <select style={S.modalInput} value={editForm.land_type} onChange={(e) => setEditForm((p) => ({ ...p, land_type: e.target.value }))}>
                                <option value="Residential">Residential</option>
                                <option value="Agricultural">Agricultural</option>
                                <option value="Mixed">Mixed</option>
                                <option value="Commercial">Commercial</option>
                            </select>
                            <select style={S.modalInput} value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}>
                                <option value="Available">Available</option>
                                <option value="Reserved">Reserved</option>
                                <option value="Sold">Sold</option>
                            </select>
                            <input style={S.modalInput} value={editForm.road_access} onChange={(e) => setEditForm((p) => ({ ...p, road_access: e.target.value }))} placeholder="Road Access" />
                        </div>

                        <input
                            style={{ ...S.modalInput, marginTop: '10px' }}
                            value={editForm.image_url}
                            onChange={(e) => setEditForm((p) => ({ ...p, image_url: e.target.value }))}
                            placeholder="Image URL(s), comma-separated"
                        />

                        <div style={S.checkboxRow}>
                            <label style={S.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={editForm.electricity}
                                    onChange={(e) => setEditForm((p) => ({ ...p, electricity: e.target.checked }))}
                                />
                                Electricity
                            </label>
                            <label style={S.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    checked={editForm.water}
                                    onChange={(e) => setEditForm((p) => ({ ...p, water: e.target.checked }))}
                                />
                                Water
                            </label>
                        </div>

                        {editError && <div style={S.modalError}>{editError}</div>}

                        <div style={S.modalActions}>
                            <button style={S.modalCancelBtn} onClick={closeEditModal}>Cancel</button>
                            <button
                                style={S.modalSaveBtn}
                                onClick={submitEditLand}
                                disabled={Boolean(editLand && actionLoadingId === (editLand.id || editLand._id))}
                            >
                                {Boolean(editLand && actionLoadingId === (editLand.id || editLand._id)) ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: 'var(--sage-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--sage-text-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--sage-text-med)', fontSize: '1rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' },
    card: { background: 'var(--sage-card)', borderRadius: '16px', padding: '32px 28px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all 0.2s', cursor: 'pointer' },
    statVal: { fontSize: '2.8rem', fontWeight: '800', lineHeight: 1 },
    statLabel: { fontSize: '0.85rem', color: 'var(--sage-text-light)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' },

    dashboardContent: { display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' },
    mainColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },
    sideColumn: { display: 'flex', flexDirection: 'column', gap: '32px' },

    sectionCard: { background: 'var(--sage-card)', borderRadius: '24px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', border: '1px solid rgba(85, 107, 47, 0.05)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(85, 107, 47, 0.05)', paddingBottom: '16px' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--sage-text-dark)', margin: 0 },
    tabActions: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    tabBtn: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #d6dccb',
        background: '#fff',
        fontWeight: '700',
        fontSize: '0.82rem',
        cursor: 'pointer',
        color: '#536246'
    },
    tabBtnActive: {
        background: '#eef5e6',
        borderColor: '#b7c7a4',
        color: '#324623'
    },

    editActions: { display: 'flex', gap: '8px' },
    editBtn: { padding: '8px 16px', background: 'rgba(85, 107, 47, 0.05)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-primary)' },
    saveBtn: { padding: '8px 16px', background: 'var(--sage-primary)', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: '#fff' },
    cancelBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #DDD', borderRadius: '8px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--sage-text-med)' },

    profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    profileItem: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontSize: '0.75rem', fontWeight: '700', color: 'var(--sage-text-light)', textTransform: 'uppercase' },
    value: { fontSize: '1rem', fontWeight: '600', color: 'var(--sage-text-dark)' },
    input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(85, 107, 47, 0.1)', background: 'var(--sage-bg)', fontSize: '0.9rem', outline: 'none', color: 'var(--sage-text-dark)' },

    btnRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
    actionBtn: { padding: '14px 28px', borderRadius: '10px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: 'none', fontFamily: "'DM Sans', sans-serif" },
    outlineBtn: { background: 'var(--sage-card)', color: 'var(--sage-primary)', border: '2px solid var(--sage-primary)' },

    activityList: { display: 'flex', flexDirection: 'column' },
    activityItem: { display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 0', borderBottom: '1px solid rgba(85, 107, 47, 0.05)' },
    actText: { flex: 1, fontSize: '0.9rem', color: 'var(--sage-text-dark)', fontWeight: '500' },
    actTime: { fontSize: '0.75rem', color: 'var(--sage-text-light)', whiteSpace: 'nowrap' },

    verifyWrap: { display: 'flex', flexDirection: 'column', gap: '16px' },
    sellerBlock: { border: '1px solid rgba(85, 107, 47, 0.12)', borderRadius: '14px', overflow: 'hidden' },
    sellerHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: '#f8fbf3',
        borderBottom: '1px solid rgba(85, 107, 47, 0.08)'
    },
    sellerName: { margin: 0, fontSize: '1rem', fontWeight: '800', color: 'var(--sage-text-dark)' },
    sellerMeta: { fontSize: '0.8rem', color: 'var(--sage-text-light)', marginTop: '2px' },
    countRow: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' },
    countBadge: {
        fontSize: '0.73rem',
        fontWeight: '700',
        padding: '4px 10px',
        borderRadius: '999px',
        background: '#eef1e7',
        color: '#4d5f2e'
    },
    verifiedBadge: { background: '#e8f8ef', color: '#1f8f4e' },
    pendingBadge: { background: '#fff3e8', color: '#b7641e' },
    allLandsHeader: {
        padding: '12px 16px',
        background: '#f8fbf3',
        borderBottom: '1px solid rgba(85, 107, 47, 0.08)',
        fontSize: '0.86rem',
        color: '#4b5b3d'
    },
    landList: { display: 'flex', flexDirection: 'column' },
    landRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(85, 107, 47, 0.06)'
    },
    landMain: { display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 },
    landImage: { width: '74px', height: '56px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e6e6e6' },
    landImagePlaceholder: {
        width: '74px',
        height: '56px',
        borderRadius: '10px',
        border: '1px dashed #d4d9c8',
        background: '#fafcf7',
        display: 'grid',
        placeItems: 'center',
        fontSize: '0.72rem',
        color: '#97a184'
    },
    landTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#233018', marginBottom: '2px' },
    landMeta: { fontSize: '0.78rem', color: '#667258', lineHeight: 1.4 },
    noteText: { marginTop: '4px', fontSize: '0.76rem', color: '#4d5f2e', fontStyle: 'italic' },
    verifyActions: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
    approveBtn: {
        border: 'none',
        borderRadius: '8px',
        background: '#2f8f58',
        color: '#fff',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    rejectBtn: {
        border: '1px solid #d5a493',
        borderRadius: '8px',
        background: '#fff7f4',
        color: '#9a4a33',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    editActionBtn: {
        border: '1px solid #cbd5c0',
        borderRadius: '8px',
        background: '#f8fbf3',
        color: '#3f4d2f',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    viewActionBtn: {
        border: '1px solid #cfd8e4',
        borderRadius: '8px',
        background: '#f4f8ff',
        color: '#304a6b',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    deleteActionBtn: {
        border: '1px solid #e6b1a4',
        borderRadius: '8px',
        background: '#fff0eb',
        color: '#a33d2b',
        fontWeight: '700',
        fontSize: '0.8rem',
        padding: '8px 12px',
        cursor: 'pointer'
    },
    emptyState: {
        border: '1px dashed rgba(85, 107, 47, 0.2)',
        borderRadius: '10px',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--sage-text-light)',
        background: '#fbfdf8'
    },
    emptyStateSmall: {
        padding: '12px 16px',
        color: 'var(--sage-text-light)',
        fontSize: '0.85rem'
    },
    errorBox: {
        borderRadius: '10px',
        background: '#fff1f0',
        border: '1px solid #f2c8c3',
        color: '#9c3a30',
        padding: '12px 14px',
        fontSize: '0.88rem'
    },
    modalOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.38)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '16px'
    },
    modalCard: {
        width: '100%',
        maxWidth: '520px',
        background: '#fff',
        borderRadius: '16px',
        padding: '22px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.18)'
    },
    previewModalCard: {
        width: '100%',
        maxWidth: '900px',
        maxHeight: '88vh',
        overflowY: 'auto',
        background: '#fff',
        borderRadius: '16px',
        padding: '22px',
        boxShadow: '0 20px 48px rgba(0,0,0,0.18)'
    },
    previewHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '14px'
    },
    previewDetailsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '10px',
        marginBottom: '12px'
    },
    previewDetailItem: {
        border: '1px solid #e4ead9',
        borderRadius: '10px',
        padding: '10px 12px',
        background: '#fbfdf8',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
    },
    previewLabel: {
        fontSize: '0.73rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#7b876c',
        fontWeight: '700'
    },
    previewValue: {
        fontSize: '0.92rem',
        color: '#2a3720',
        fontWeight: '700'
    },
    previewNote: {
        borderRadius: '10px',
        border: '1px solid #ead8bc',
        background: '#fff8ec',
        color: '#7a5425',
        fontSize: '0.85rem',
        padding: '10px 12px',
        marginBottom: '14px'
    },
    previewSectionTitle: {
        marginTop: '2px',
        marginBottom: '8px',
        fontSize: '0.86rem',
        fontWeight: '800',
        color: '#425335',
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
    },
    previewImagesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '10px'
    },
    previewImageBtn: {
        border: 'none',
        padding: 0,
        margin: 0,
        background: 'transparent',
        cursor: 'pointer'
    },
    previewImage: {
        width: '100%',
        height: '140px',
        objectFit: 'cover',
        borderRadius: '10px',
        border: '1px solid #dbe3ce'
    },
    imageViewerOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2600,
        padding: '16px'
    },
    imageViewerCard: {
        width: '100%',
        maxWidth: '980px',
        maxHeight: '90vh',
        background: '#fff',
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
    },
    imageViewerCloseBtn: {
        alignSelf: 'flex-end',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #d3d3d3',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: '700',
        color: '#4f5d42'
    },
    imageViewerMain: {
        width: '100%',
        height: 'calc(90vh - 130px)',
        minHeight: '280px',
        objectFit: 'contain',
        borderRadius: '10px',
        background: '#f6f8f2'
    },
    imageViewerNavRow: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '14px'
    },
    imageViewerNavBtn: {
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #cfd8e4',
        background: '#f4f8ff',
        color: '#304a6b',
        fontWeight: '700',
        cursor: 'pointer'
    },
    imageViewerCount: {
        fontSize: '0.88rem',
        color: '#4f5d42',
        fontWeight: '700'
    },
    modalTitle: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#263319' },
    modalText: { marginTop: '8px', marginBottom: '12px', fontSize: '0.9rem', color: '#5a6650' },
    modalTextArea: {
        width: '100%',
        border: '1px solid #ced9c1',
        borderRadius: '10px',
        padding: '10px 12px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.9rem',
        outline: 'none',
        resize: 'vertical'
    },
    editFormGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px'
    },
    modalInput: {
        width: '100%',
        border: '1px solid #ced9c1',
        borderRadius: '10px',
        padding: '10px 12px',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '0.9rem',
        outline: 'none',
        background: '#fff'
    },
    checkboxRow: {
        marginTop: '12px',
        display: 'flex',
        gap: '16px'
    },
    checkboxLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.88rem',
        color: '#4f5d42'
    },
    modalError: {
        marginTop: '10px',
        borderRadius: '8px',
        background: '#fff1f0',
        border: '1px solid #f2c8c3',
        color: '#9c3a30',
        padding: '8px 10px',
        fontSize: '0.84rem'
    },
    modalActions: {
        marginTop: '14px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px'
    },
    modalCancelBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: '1px solid #d3d3d3',
        background: '#fff',
        color: '#5c5c5c',
        cursor: 'pointer',
        fontWeight: '700'
    },
    modalRejectBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: 'none',
        background: '#9a4a33',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '700'
    },
    modalSaveBtn: {
        padding: '9px 14px',
        borderRadius: '8px',
        border: 'none',
        background: '#2f8f58',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '700'
    },
};

export default AdminDashboard;


