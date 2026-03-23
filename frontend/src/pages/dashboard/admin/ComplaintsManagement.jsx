import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const ComplaintsManagement = () => {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('buyer'); // 'buyer' | 'seller'
    const [replyText, setReplyText] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [animatedCards, setAnimatedCards] = useState({});

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

    const handleSendReply = async (id, status = 'In Progress') => {
        const text = replyText[id] || '';
        
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

    useEffect(() => {
        if (!filteredInquiries.length) {
            setAnimatedCards({});
            return;
        }

        setAnimatedCards({});
        const timers = filteredInquiries.map((item, idx) =>
            setTimeout(() => {
                setAnimatedCards((prev) => ({ ...prev, [item._id]: true }));
            }, idx * 70)
        );

        return () => timers.forEach(clearTimeout);
    }, [activeTab, inquiries]);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Complaints & Inquiry Management</h2>
                <p style={styles.subtitle}>Review and resolve issues submitted by consumers and property owners.</p>
                <div style={styles.summaryRow}>
                    <span style={styles.summaryPill}>{inquiries.length} total</span>
                    <span style={{ ...styles.summaryPill, background: 'rgba(33, 150, 243, 0.14)', color: '#145b97' }}>
                        {inquiries.filter(i => (i.buyer_role || 'buyer') === 'buyer').length} buyer
                    </span>
                    <span style={{ ...styles.summaryPill, background: 'rgba(161, 136, 127, 0.18)', color: '#7a4f41' }}>
                        {inquiries.filter(i => i.buyer_role === 'seller').length} seller
                    </span>
                </div>
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
                        <div
                            key={item._id}
                            className="ui-card ui-lift"
                            style={{
                                ...styles.card,
                                opacity: animatedCards[item._id] ? 1 : 0,
                                transform: animatedCards[item._id] ? 'translateY(0)' : 'translateY(12px)'
                            }}
                        >
                            <div style={styles.cardHeader}>
                                <div>
                                    <span style={styles.id}>#{item._id}</span>
                                    <h4 style={styles.subject}>{item.title}</h4>
                                    <p style={styles.user}>
                                        From: <strong>{item.buyer_name}</strong> ({item.buyer_email}) • {new Date(item.created_at).toLocaleDateString()}
                                    </p>
                                    <span style={styles.typeTag}>{item.inquiry_type}</span>
                                </div>
                                <div style={styles.actions}>
                                    <select
                                        style={{
                                            ...styles.statusSelect,
                                            color: item.status === 'Resolved' ? '#059669' : item.status === 'In Progress' ? '#d97706' : '#dc2626'
                                        }}
                                        value={item.status}
                                        onChange={(e) => handleSendReply(item._id, e.target.value)}
                                        disabled={submitting[item._id]}
                                    >
                                        <option value="Open">Open</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                    <button style={styles.deleteBtn} onClick={() => handleRemove(item._id)}>Remove</button>
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
                                    value={replyText[item._id] || ''}
                                    onChange={(e) => setReplyText({ ...replyText, [item._id]: e.target.value })}
                                />
                                <button
                                    style={styles.sendBtn}
                                    onClick={() => handleSendReply(item._id, item.status)}
                                    disabled={submitting[item._id] || !replyText[item._id]}
                                >
                                    {submitting[item._id] ? 'Sending...' : 'Send Reply'}
                                </button>
                            </div>
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
    subtitle: { color: 'var(--color-muted)', fontSize: '0.95rem' },
    summaryRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' },
    summaryPill: { padding: '6px 12px', borderRadius: '20px', background: 'rgba(38, 50, 56, 0.12)', color: 'var(--color-dark)', fontWeight: '700', fontSize: '0.76rem' },

    tabs: { display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(38, 50, 56, 0.08)', borderRadius: '999px', padding: '6px', width: 'fit-content' },
    tab: { padding: '10px 20px', backgroundColor: 'transparent', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', borderRadius: '999px', transition: 'all 0.25s ease' },
    activeTab: { padding: '10px 20px', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '700', borderRadius: '999px', boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)' },

    list: { display: 'flex', flexDirection: 'column', gap: '24px' },
    card: { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid rgba(38, 50, 56, 0.1)', padding: '24px', boxShadow: 'none', transition: 'opacity 0.32s ease, transform 0.32s ease' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
    id: { fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
    subject: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', margin: '4px 0' },
    user: { fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '8px' },
    typeTag: { fontSize: '0.7rem', backgroundColor: 'rgba(139, 195, 74, 0.16)', color: '#3f6e10', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', textTransform: 'uppercase' },

    actions: { display: 'flex', gap: '12px' },
    statusSelect: { padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(38, 50, 56, 0.16)', fontSize: '0.85rem', fontWeight: '700', outline: 'none', cursor: 'pointer', backgroundColor: '#fff' },
    deleteBtn: { padding: '8px 12px', backgroundColor: '#fff', color: '#7a4f41', border: '1px solid rgba(161, 136, 127, 0.35)', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },

    cardBody: { padding: '20px', backgroundColor: 'rgba(38, 50, 56, 0.04)', borderRadius: '12px', marginBottom: '16px' },
    content: { fontSize: '0.95rem', color: 'var(--color-dark)', lineHeight: '1.6', margin: 0 },

    replyBox: { padding: '16px', backgroundColor: 'rgba(33, 150, 243, 0.12)', borderRadius: '12px', marginBottom: '16px', borderLeft: '4px solid var(--color-blue)' },
    replyHeader: { fontSize: '0.75rem', fontWeight: '800', color: '#145b97', marginBottom: '4px', textTransform: 'uppercase' },
    replyContent: { fontSize: '0.9rem', color: 'var(--color-dark)', margin: 0 },

    replyForm: { display: 'flex', gap: '12px', alignItems: 'flex-end' },
    textarea: { flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid rgba(38, 50, 56, 0.16)', fontSize: '0.92rem', minHeight: '80px', fontFamily: 'inherit', outline: 'none', transition: 'border 0.2s' },
    sendBtn: { padding: '12px 24px', backgroundColor: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', transition: 'opacity 0.2s' },

    loading: { textAlign: 'center', padding: '40px', color: 'var(--color-muted)' },
    emptyState: { textAlign: 'center', padding: '60px', backgroundColor: '#fff', borderRadius: '20px', border: '2px dashed rgba(38, 50, 56, 0.18)', color: 'var(--color-muted)' }
};

export default ComplaintsManagement;
