import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API_BASE_URL from '../../apiConfig';

const InquiryPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [type, setType] = useState('General');
    const [useCustomType, setUseCustomType] = useState(false);
    const [customType, setCustomType] = useState('');
    const [message, setMessage] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedLandId, setSelectedLandId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState('');
    const [submitError, setSubmitError] = useState('');

    const [inquiries, setInquiries] = useState([]);
    const [loadingList, setLoadingList] = useState(false);
    const [lands, setLands] = useState([]);
    const [loadingLands, setLoadingLands] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editType, setEditType] = useState('General');
    const [editMessage, setEditMessage] = useState('');
    const [editLandId, setEditLandId] = useState('');
    const [editDistrict, setEditDistrict] = useState('');

    const token = localStorage.getItem('access_token');
    const allowedInquiryTypes = ['Listing', 'Service', 'General'];
    const normalizeInquiryType = (value) => {
        const raw = String(value || '').trim().toLowerCase();
        const matched = allowedInquiryTypes.find((item) => item.toLowerCase() === raw);
        return matched || 'General';
    };
    const validateCustomInquiryType = (value) => {
        const trimmed = value.trim();

        if (!trimmed) {
            return 'Enter a custom inquiry type for testing.';
        }

        if (trimmed.length > 40) {
            return 'Custom inquiry type must be 40 characters or fewer.';
        }

        if (!/^[A-Za-z]/.test(trimmed)) {
            return 'Custom inquiry type must start with a letter (A-Z).';
        }

        if (!/^[A-Za-z0-9 _-]*$/.test(trimmed)) {
            return 'Use only letters, numbers, spaces, underscore (_), or hyphen (-).';
        }

        return '';
    };

    // Fetch buyer's own inquiries
    const fetchInquiries = () => {
        if (!token) return;
        setLoadingList(true);
        fetch(`${API_BASE_URL}/inquiries/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                setInquiries(Array.isArray(data) ? data : []);
                setLoadingList(false);
            })
            .catch(() => setLoadingList(false));
    };

    const fetchLands = () => {
        setLoadingLands(true);
        fetch(`${API_BASE_URL}/lands/`)
            .then(r => r.json())
            .then(data => {
                setLands(Array.isArray(data) ? data : []);
                setLoadingLands(false);
            })
            .catch(() => {
                setLands([]);
                setLoadingLands(false);
            });
    };

    useEffect(() => {
        fetchInquiries();
        fetchLands();
    }, []);

    const handleEditClick = (inq) => {
        setEditingId(inq._id);
        setEditTitle(inq.title);
        const normType = normalizeInquiryType(inq.inquiry_type);
        setEditType(normType);
        setEditMessage(inq.message);
        setEditLandId(inq.land_id || '');
        
        if (normType === 'Listing' && inq.land_id) {
            const land = lands.find(l => (l._id || l.id) === inq.land_id);
            if (land) setEditDistrict(land.district || '');
        } else {
            setEditDistrict('');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditLandId('');
        setEditDistrict('');
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setSubmitError(''); setSubmitMsg('');

        const normalizedEditType = normalizeInquiryType(editType);
        if (normalizedEditType === 'Listing' && !editLandId) {
            setSubmitError('Please select a land for listing inquiries.');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/inquiries/${editingId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: editTitle,
                    inquiry_type: normalizedEditType,
                    message: editMessage,
                    land_id: normalizedEditType === 'Listing' ? editLandId : null,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setSubmitError(err.detail || 'Failed to update. Please try again.');
            } else {
                setSubmitMsg('✅ Your inquiry has been updated.');
                setEditingId(null);
                setEditDistrict('');
                fetchInquiries();
                setTimeout(() => setSubmitMsg(''), 5000);
            }
        } catch {
            setSubmitError('Cannot reach the server. Please check your connection.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;
        setSubmitError(''); setSubmitMsg('');
        try {
            const res = await fetch(`${API_BASE_URL}/inquiries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                const err = await res.json();
                setSubmitError(err.detail || 'Failed to delete.');
            } else {
                setSubmitMsg('✅ Inquiry deleted successfully.');
                fetchInquiries();
                setTimeout(() => setSubmitMsg(''), 5000);
            }
        } catch {
            setSubmitError('Cannot reach the server.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(''); setSubmitMsg('');

        if (!token) {
            navigate('/login');
            return;
        }

        if (!useCustomType && !allowedInquiryTypes.includes(type)) {
            setSubmitError('Please select a valid inquiry type.');
            return;
        }

        if (useCustomType) {
            const validationMessage = validateCustomInquiryType(customType);
            if (validationMessage) {
                setSubmitError(validationMessage);
                return;
            }
        }

        if (!useCustomType && type === 'Listing' && !selectedLandId) {
            setSubmitError('Please select a land for listing inquiries.');
            return;
        }

        setSubmitting(true);
        const inquiryTypeToSend = useCustomType
            ? (customType.trim() || type)
            : type;

        try {
            const res = await fetch(`${API_BASE_URL}/inquiries/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title,
                    inquiry_type: inquiryTypeToSend,
                    message,
                    land_id: !useCustomType && inquiryTypeToSend === 'Listing' ? selectedLandId : null,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setSubmitError(err.detail || 'Failed to submit. Please try again.');
            } else {
                setSubmitMsg('✅ Your inquiry has been submitted. We will reply soon!');
                setTitle('');
                setType('General');
                setUseCustomType(false);
                setCustomType('');
                setSelectedDistrict('');
                setSelectedLandId('');
                setMessage('');
                fetchInquiries();
                setTimeout(() => setSubmitMsg(''), 5000);
            }
        } catch {
            setSubmitError('Cannot reach the server. Please check your connection.');
        }
        setSubmitting(false);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return '#FF9800';
            case 'In Progress': return '#2196F3';
            case 'Resolved': return '#4CAF50';
            default: return '#777';
        }
    };

    const getLandLabelById = (landId) => {
        if (!landId) return '';
        const land = lands.find((item) => (item._id || item.id) === landId);
        if (!land) return 'Selected listing';
        return `${land.name} - ${land.district} (${land.village})`;
    };

    // Derived lists
    const uniqueDistricts = [...new Set(lands.map(l => l.district).filter(Boolean))].sort();
    const filteredLands = selectedDistrict 
        ? lands.filter(l => l.district === selectedDistrict)
        : [];
    
    const editFilteredLands = editDistrict
        ? lands.filter(l => l.district === editDistrict)
        : [];

    return (
        <div style={S.root}>
            <div style={S.container}>
                <header style={S.header}>
                    <h1 style={S.pageTitle}>Inquiries & Complaints</h1>
                    <p style={S.subtitle}>Submit your inquiries and track responses from the admin</p>
                </header>

                <div style={S.layout}>
                    {/* ── Submit Form ─────────────────────────────── */}
                    <div style={S.formCard}>
                        <h2 style={S.sectionTitle}>Submit New Inquiry</h2>

                        {!user ? (
                            <div style={S.loginNoticeBox}>
                                <p style={S.loginNotice}>Please log in to submit an inquiry.</p>
                                <a href="/login" style={S.loginBtn}>Login Now</a>
                            </div>
                        ) : user.role === 'admin' ? (
                            <div style={S.loginNoticeBox}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛡️</div>
                                <p style={S.loginNotice}>Admins cannot submit inquiries through this public form.</p>
                                <button 
                                    onClick={() => navigate('/dashboard/admin/complaints')} 
                                    style={S.loginBtn}
                                >
                                    Go to Inquiry Management
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} style={S.form}>
                                {submitError && <div style={S.errorBox}>{submitError}</div>}
                                {submitMsg && <div style={S.successBox}>{submitMsg}</div>}

                                <div style={S.inputGroup}>
                                    <label style={S.label}>Subject / Title</label>
                                    <input
                                        style={S.input}
                                        placeholder="Brief title of your inquiry"
                                        value={title}
                                        onChange={e => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={S.inputGroup}>
                                    <label style={S.label}>Inquiry Type</label>
                                    <select
                                        style={S.input}
                                        value={type}
                                        onChange={e => {
                                            setType(e.target.value);
                                            setSelectedDistrict('');
                                            setSelectedLandId('');
                                        }}
                                        disabled={useCustomType}
                                    >
                                        <option value="Listing">About a Listing</option>
                                        <option value="Service">About a Service</option>
                                        <option value="General">General Complaint</option>
                                    </select>
                                    <label style={S.inlineCheck}>
                                        <input
                                            type="checkbox"
                                            checked={useCustomType}
                                            onChange={(e) => setUseCustomType(e.target.checked)}
                                        />
                                        Use custom inquiry type (testing)
                                    </label>
                                    {useCustomType && (
                                        <input
                                            style={S.input}
                                            placeholder="Example: RandomType"
                                            value={customType}
                                            onChange={(e) => setCustomType(e.target.value)}
                                            maxLength={40}
                                        />
                                    )}
                                    {useCustomType && (
                                        <p style={S.hintText}>
                                            This is for negative testing. Backend should map unknown types to General.
                                        </p>
                                    )}
                                </div>

                                {!useCustomType && type === 'Listing' && (
                                    <>
                                        <div style={S.inputGroup}>
                                            <label style={S.label}>Select District</label>
                                            <select
                                                style={S.input}
                                                value={selectedDistrict}
                                                onChange={e => {
                                                    setSelectedDistrict(e.target.value);
                                                    setSelectedLandId('');
                                                }}
                                                required
                                            >
                                                <option value="">Choose a district...</option>
                                                {uniqueDistricts.map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {selectedDistrict && (
                                            <div style={S.inputGroup}>
                                                <label style={S.label}>Select Land</label>
                                                <select
                                                    style={S.input}
                                                    value={selectedLandId}
                                                    onChange={e => setSelectedLandId(e.target.value)}
                                                    required
                                                >
                                                    <option value="">Choose a listing in {selectedDistrict}...</option>
                                                    {filteredLands.map((land) => (
                                                        <option key={land._id || land.id} value={land._id || land.id}>
                                                            {land.name} ({land.village})
                                                        </option>
                                                    ))}
                                                </select>
                                                {loadingLands && <p style={S.hintText}>Loading available listings...</p>}
                                                {!loadingLands && filteredLands.length === 0 && (
                                                    <p style={S.hintText}>No available listings found in this district.</p>
                                                )}
                                            </div>
                                        )}
                                    </>
                                )}

                                <div style={S.inputGroup}>
                                    <label style={S.label}>Message Details</label>
                                    <textarea
                                        style={{ ...S.input, height: '130px', resize: 'vertical' }}
                                        placeholder="Describe your inquiry in detail…"
                                        value={message}
                                        onChange={e => setMessage(e.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" style={S.submitBtn} disabled={submitting}>
                                    {submitting ? 'Submitting…' : 'Submit Inquiry'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* ── Inquiry History ─────────────────────────── */}
                    <div style={S.listCard}>
                        <h2 style={S.sectionTitle}>Inquiry History & Replies</h2>

                        {!user ? (
                            <div style={S.loginNoticeBox}>
                                <p style={S.loginNotice}>Please log in to view your inquiries and admin replies.</p>
                                <a href="/login" style={S.loginBtn}>Login Now</a>
                            </div>
                        ) : user.role === 'admin' ? (
                            <div style={S.emptyState}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📊</div>
                                <div style={{ fontWeight: '700', color: '#555', marginBottom: '6px' }}>Administrative View</div>
                                <div style={{ color: '#aaa', fontSize: '0.875rem' }}>Personal inquiry history is disabled for admins. Please use the management dashboard to view all user inquiries.</div>
                            </div>
                        ) : loadingList ? (
                            <p style={S.empty}>Loading your inquiries…</p>
                        ) : inquiries.length === 0 ? (
                            <div style={S.emptyState}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📬</div>
                                <div style={{ fontWeight: '700', color: '#555', marginBottom: '6px' }}>No inquiries yet</div>
                                <div style={{ color: '#aaa', fontSize: '0.875rem' }}>Submit your first inquiry using the form on the left.</div>
                            </div>
                        ) : (
                            <div style={S.inquiryList}>
                                {inquiries.map(inq => (
                                    <div key={inq._id} style={S.inquiryItem}>
                                        {editingId === inq._id ? (
                                            /* ── Inline Edit Form ── */
                                            <form onSubmit={handleUpdate} style={S.form}>
                                                <h3 style={{ ...S.inqTitle, marginBottom: '10px' }}>Edit Inquiry</h3>
                                                <div style={S.inputGroup}>
                                                    <label style={S.label}>Subject / Title</label>
                                                    <input
                                                        style={S.input}
                                                        value={editTitle}
                                                        onChange={e => setEditTitle(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div style={S.inputGroup}>
                                                    <label style={S.label}>Inquiry Type</label>
                                                    <select
                                                        style={S.input}
                                                        value={editType}
                                                        onChange={e => {
                                                            setEditType(e.target.value);
                                                            setEditDistrict('');
                                                            setEditLandId('');
                                                        }}
                                                    >
                                                        <option value="Listing">About a Listing</option>
                                                        <option value="Service">About a Service</option>
                                                        <option value="General">General Complaint</option>
                                                    </select>
                                                </div>
                                                {normalizeInquiryType(editType) === 'Listing' && (
                                                    <div style={S.inputGroup}>
                                                        <label style={S.label}>Select District</label>
                                                        <select
                                                            style={S.input}
                                                            value={editDistrict}
                                                            onChange={e => {
                                                                setEditDistrict(e.target.value);
                                                                setEditLandId('');
                                                            }}
                                                            required
                                                        >
                                                            <option value="">Choose a district...</option>
                                                            {uniqueDistricts.map(d => (
                                                                <option key={d} value={d}>{d}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                {normalizeInquiryType(editType) === 'Listing' && editDistrict && (
                                                    <div style={S.inputGroup}>
                                                        <label style={S.label}>Select Land</label>
                                                        <select
                                                            style={S.input}
                                                            value={editLandId}
                                                            onChange={e => setEditLandId(e.target.value)}
                                                            required
                                                        >
                                                            <option value="">Choose a listing in {editDistrict}...</option>
                                                            {editFilteredLands.map((land) => (
                                                                <option key={land._id || land.id} value={land._id || land.id}>
                                                                    {land.name} ({land.village})
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {loadingLands && <p style={S.hintText}>Loading available listings...</p>}
                                                    </div>
                                                )}
                                                <div style={S.inputGroup}>
                                                    <label style={S.label}>Message Details</label>
                                                    <textarea
                                                        style={{ ...S.input, height: '100px', resize: 'vertical' }}
                                                        value={editMessage}
                                                        onChange={e => setEditMessage(e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button type="submit" style={{ ...S.submitBtn, flex: 1, marginTop: 0 }}>Save Changes</button>
                                                    <button type="button" onClick={handleCancelEdit} style={{ ...S.submitBtn, flex: 1, marginTop: 0, background: '#EEE', color: '#333' }}>Cancel</button>
                                                </div>
                                            </form>
                                        ) : (
                                            /* ── Normal View ── */
                                            <>
                                                {/* Header row */}
                                                <div style={S.inqHeader}>
                                                    <span style={S.inqType}>{normalizeInquiryType(inq.inquiry_type)}</span>
                                                    <span style={{
                                                        ...S.statusBadge,
                                                        backgroundColor: getStatusColor(inq.status) + '18',
                                                        color: getStatusColor(inq.status),
                                                        border: `1px solid ${getStatusColor(inq.status)}40`,
                                                    }}>
                                                        {inq.status}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <h3 style={S.inqTitle}>{inq.title}</h3>
                                                    {!inq.admin_reply && (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button 
                                                                onClick={() => handleEditClick(inq)} 
                                                                style={{ ...S.actionBtn, color: '#3182CE' }}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(inq._id)} 
                                                                style={{ ...S.actionBtn, color: '#E53E3E' }}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {normalizeInquiryType(inq.inquiry_type) === 'Listing' && inq.land_id && (
                                                    <div style={S.landInfoBox}>
                                                        <p style={S.landInfoLabel}>Selected Land</p>
                                                        <p style={S.landInfoText}>{getLandLabelById(inq.land_id)}</p>
                                                    </div>
                                                )}

                                                {/* Buyer's message */}
                                                <div style={S.messageBox}>
                                                    <p style={S.msgLabel}>
                                                        Your Inquiry ({inq.created_at ? new Date(inq.created_at).toLocaleDateString() : ''}):
                                                    </p>
                                                    <p style={S.msgContent}>{inq.message}</p>
                                                </div>

                                                {/* Admin reply or waiting */}
                                                {inq.admin_reply ? (
                                                    <div style={S.replyBox}>
                                                        <div style={S.replyHeader}>
                                                            <span style={S.replyTag}>Admin Reply</span>
                                                        </div>
                                                        <p style={S.replyContent}>{inq.admin_reply}</p>
                                                    </div>
                                                ) : (
                                                    <div style={S.waitingBox}>
                                                        <p style={S.waitingText}>⏳ Waiting for admin reply. Please check back later.</p>
                                                    </div>
                                                )}

                                                <div style={S.inqFooter}>
                                                    <span style={S.inqId}>Ticket ID: #{inq._id}</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100vh', padding: '120px 20px 60px', fontFamily: "'DM Sans', sans-serif" },
    container: { maxWidth: '1200px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: '48px' },
    pageTitle: { fontSize: '2.5rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '12px' },
    subtitle: { fontSize: '1.1rem', color: '#666' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'start' },

    formCard: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', position: 'sticky', top: '120px' },
    listCard: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', minHeight: '500px' },
    sectionTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px', marginTop: 0 },

    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    inlineCheck: { display: 'flex', alignItems: 'center', gap: '8px', color: '#555', fontSize: '0.84rem', fontWeight: '600' },
    hintText: { margin: 0, color: '#777', fontSize: '0.78rem' },
    label: { fontSize: '0.85rem', fontWeight: '700', color: '#1A1A1A' },
    input: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #EEE', fontSize: '0.95rem', background: '#F9F9F9', outline: 'none', fontFamily: "'DM Sans', sans-serif", transition: 'border 0.2s' },
    submitBtn: { padding: '14px', background: '#22A455', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '6px', fontFamily: "'DM Sans', sans-serif" },

    errorBox: { background: '#fdecea', color: '#d32f2f', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem' },
    successBox: { background: '#eafaf1', color: '#27ae60', padding: '10px 14px', borderRadius: '8px', fontWeight: '700', fontSize: '0.875rem' },

    inquiryList: { display: 'flex', flexDirection: 'column', gap: '24px' },
    inquiryItem: { padding: '24px', borderRadius: '20px', border: '1px solid #F0F0F0', background: '#FFF' },
    inqHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    inqType: { fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#1A1A1A', background: '#F5F5F5', padding: '4px 10px', borderRadius: '6px', letterSpacing: '0.05em' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    inqTitle: { fontSize: '1.15rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px', marginTop: 0 },

    landInfoBox: { background: '#F5F8ED', border: '1px solid #DDE7C6', borderRadius: '10px', padding: '10px 12px', marginBottom: '16px' },
    landInfoLabel: { fontSize: '0.72rem', fontWeight: '800', color: '#6C7A3A', textTransform: 'uppercase', margin: '0 0 4px 0', letterSpacing: '0.03em' },
    landInfoText: { fontSize: '0.88rem', color: '#2E3A1F', margin: 0, fontWeight: '600' },

    messageBox: { background: '#F9F9F9', padding: '16px', borderRadius: '12px', marginBottom: '16px' },
    msgLabel: { fontSize: '0.72rem', fontWeight: '700', color: '#999', marginBottom: '8px', textTransform: 'uppercase', margin: '0 0 8px 0' },
    msgContent: { fontSize: '0.9rem', color: '#444', lineHeight: '1.6', margin: 0 },

    replyBox: { background: '#FAF6F1', padding: '16px', borderRadius: '12px', border: '1px solid #F2EBE1', borderLeft: '4px solid #1A1A1A', marginBottom: '8px' },
    replyHeader: { display: 'flex', alignItems: 'center', marginBottom: '10px' },
    replyTag: { fontSize: '0.72rem', fontWeight: '800', color: '#1A1A1A', textTransform: 'uppercase', background: '#FFF', padding: '3px 8px', borderRadius: '4px', border: '1px solid #1A1A1A', letterSpacing: '0.05em' },
    replyContent: { fontSize: '0.9rem', color: '#1A1A1A', lineHeight: '1.6', fontWeight: '500', margin: 0 },

    waitingBox: { padding: '12px 16px', textAlign: 'center', background: '#F5F5F5', borderRadius: '12px', border: '1px dashed #DDD', marginBottom: '8px' },
    waitingText: { fontSize: '0.85rem', color: '#888', margin: 0, fontStyle: 'italic' },

    inqFooter: { marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'flex-end' },
    inqId: { fontSize: '0.72rem', color: '#CCC', fontWeight: '600' },
    actionBtn: { background: '#fff', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '6px 14px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center' },

    loginNoticeBox: { textAlign: 'center', marginTop: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    loginNotice: { color: '#666', fontSize: '0.95rem' },
    loginBtn: { padding: '10px 24px', background: '#1A1A1A', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem' },

    empty: { textAlign: 'center', marginTop: '40px', color: '#AAA', fontStyle: 'italic' },
    emptyState: { textAlign: 'center', paddingTop: '60px' },
};

export default InquiryPage;
