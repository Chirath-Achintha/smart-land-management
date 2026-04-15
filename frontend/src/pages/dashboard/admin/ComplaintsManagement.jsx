import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const ComplaintsManagement = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' | 'seller'
    const [replyText, setReplyText] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [replyError, setReplyError] = useState({});

    const token = localStorage.getItem('access_token');

    const fetchInquiries = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/inquiries/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setInquiries(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch inquiries:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchInquiries();
    }, []);

    const handleSendReply = async (id, status = 'In Progress', requireMessage = false) => {
        const text = (replyText[id] || '').trim();

        if (requireMessage && !text) {
            setReplyError((prev) => ({
                ...prev,
                [id]: 'Reply message is required before sending.',
            }));
            return;
        }
        
        // If status is still 'Open' but we are sending a reply, move it to 'In Progress'
        const finalStatus = status === 'Open' ? 'In Progress' : status;

        const payload = { status: finalStatus };
        if (text) {
            payload.admin_reply = text;
        }

        setSubmitting({ ...submitting, [id]: true });
        try {
            const res = await fetch(`${API_BASE_URL}/inquiries/${id}/reply`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setReplyText({ ...replyText, [id]: '' });
                setReplyError((prev) => ({ ...prev, [id]: '' }));
                fetchInquiries(); // Refresh list
            }
        } catch (error) {
            console.error("Reply failed:", error);
        }
        setSubmitting({ ...submitting, [id]: false });
    };

    const handleRemove = async (id) => {
        if (!window.confirm('Are you sure you want to permanently delete this inquiry?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/inquiries/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchInquiries();
        } catch (error) {
            console.error("Delete failed:", error);
        }
    };

    // Filter inquiries by active tab
    const filteredInquiries = inquiries.filter(inq => {
        const role = inq.buyer_role || 'buyer';
        return role.toLowerCase() === activeTab;
    });

    const getInquiryId = (item) => item.id || item._id;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Complaints & Inquiry Management</h2>
                <p style={styles.subtitle}>Review and resolve issues submitted by consumers and property owners.</p>
            </header>

            {/* Tab navigation */}
            <div style={styles.tabs}>
                <button
                    style={activeTab === 'buyer' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('buyer')}
                >
                    Buyer Inquiries ({inquiries.filter(i => (i.buyer_role || 'buyer') === 'buyer').length})
                </button>
                <button
                    style={activeTab === 'seller' ? styles.activeTab : styles.tab}
                    onClick={() => setActiveTab('seller')}
                >
                    Seller Inquiries ({inquiries.filter(i => i.buyer_role === 'seller').length})
                </button>
            </div>

            {loading ? (
                <p style={styles.loading}>Loading inquiries...</p>
            ) : filteredInquiries.length === 0 ? (
                <div style={styles.emptyState}>
                    <p>No inquiries found for this category.</p>
                </div>
            ) : (
                <div style={styles.list}>
                    {filteredInquiries.map(item => (
                        <div key={getInquiryId(item)} style={styles.card}>
                            <div style={styles.cardHeader}>
                                <div>
                                    <span style={styles.id}>#{getInquiryId(item)}</span>
                                    <h4 style={styles.subject}>{item.title}</h4>
                                    <p style={styles.user}>
                                        From: <strong>{item.buyer_name}</strong> ({item.buyer_email}) • {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                    <span style={styles.typeTag}>{item.inquiry_type}</span>
                                    {item.inquiry_type === 'Listing' && (
                                        <p style={styles.landInfo}>
                                            Related Land: <strong>{item.land_name || 'Unknown Listing'}</strong>
                                            {item.land_district || item.land_village
                                                ? ` (${item.land_district || '-'} / ${item.land_village || '-'})`
                                                : ''}
                                        </p>
                                    )}
                                </div>
                                <div style={styles.actions}>
                                    <select
                                        style={{
                                            ...styles.statusSelect,
                                            color: item.status === 'Resolved' ? '#059669' : item.status === 'In Progress' ? '#d97706' : '#dc2626'
                                        }}
                                        value={item.status}
                                        onChange={(e) => handleSendReply(getInquiryId(item), e.target.value)}
                                        disabled={submitting[getInquiryId(item)]}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                    <button style={styles.deleteBtn} onClick={() => handleRemove(getInquiryId(item))}>Remove</button>
                                </div>
                            </div>

                            <div style={styles.cardBody}>
                                <p style={styles.content}>{item.message}</p>
                            </div>

                            {item.admin_reply && (
                                <div style={styles.replyBox}>
                                    <p style={styles.replyHeader}>Admin Reply:</p>
                                    <p style={styles.replyContent}>{item.admin_reply}</p>
                                </div>
                            )}

                            <div style={styles.replyForm}>
                                <textarea
                                    placeholder="Type your reply here..."
                                    style={styles.textarea}
                                    value={replyText[getInquiryId(item)] || ''}
                                    onChange={(e) => {
                                        const id = getInquiryId(item);
                                        setReplyText({ ...replyText, [id]: e.target.value });
                                        if ((replyError[id] || '') && e.target.value.trim()) {
                                            setReplyError((prev) => ({ ...prev, [id]: '' }));
                                        }
                                    }}
                                />
                                <button
                                    style={styles.sendBtn}
                                    onClick={() => handleSendReply(getInquiryId(item), item.status, true)}
                                    disabled={submitting[getInquiryId(item)]}
                                >
                                    {submitting[getInquiryId(item)] ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
                            {!!replyError[getInquiryId(item)] && (
                                <p style={styles.replyErrorText}>{replyError[getInquiryId(item)]}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '32px', maxWidth: '1200px', margin: '0 auto', background: 'var(--color-bg)', minHeight: '100%' },
    header: { marginBottom: '32px' },
    title: { fontSize: '1.75rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '0.95rem' },

    tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '1px' },
    tab: { padding: '10px 20px', backgroundColor: 'transparent', border: 'none', color: 'var(--color-text-soft)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' },
    activeTab: { padding: '10px 20px', backgroundColor: '#fff', border: '1px solid var(--color-border)', borderBottom: '2px solid var(--color-primary)', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700' },

    list: { display: 'flex', flexDirection: 'column', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid var(--color-border)', padding: '24px', boxShadow: 'var(--shadow-soft)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    id: { fontSize: '0.7rem', fontWeight: '800', color: '#bbb', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
    subject: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: '4px 0' },
    user: { fontSize: '0.85rem', color: 'var(--color-text-soft)', marginBottom: '8px' },
    typeTag: { fontSize: '0.7rem', backgroundColor: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase' },
    landInfo: { fontSize: '0.84rem', color: '#4b5563', marginTop: '8px', marginBottom: '0' },

    actions: { display: 'flex', gap: '12px' },
    statusSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem', fontWeight: '700', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' },
    deleteBtn: { padding: '8px 12px', backgroundColor: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },

    cardBody: { padding: '20px', backgroundColor: 'var(--color-bg)', borderRadius: '12px', marginBottom: '16px' },
    content: { fontSize: '0.95rem', color: '#444', lineHeight: '1.6', margin: 0 },

    replyBox: { padding: '16px', backgroundColor: '#eef2ff', borderRadius: '12px', marginBottom: '16px', borderLeft: '4px solid var(--color-blue)' },
    replyHeader: { fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-blue)', marginBottom: '4px', textTransform: 'uppercase' },
    replyContent: { fontSize: '0.9rem', color: '#1e1b4b', margin: 0 },

    replyForm: { display: 'flex', gap: '12px', alignItems: 'flex-end' },
    textarea: { flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.92rem', minHeight: '80px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
    sendBtn: { padding: '12px 24px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'opacity 0.2s' },
    replyErrorText: { marginTop: '10px', marginBottom: 0, color: '#dc2626', fontSize: '0.85rem', fontWeight: '600' },

    loading: { textAlign: 'center', padding: '40px', color: '#666' },
    emptyState: { textAlign: 'center', padding: '60px', backgroundColor: 'var(--color-bg)', borderRadius: '20px', border: '2px dashed var(--color-border)', color: '#999' }
};

export default ComplaintsManagement;
