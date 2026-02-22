import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const InquiryPage = () => {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Listing'); // 'Listing' or 'Service'
    const [message, setMessage] = useState('');

    // Mock user-specific inquiries with detailed messages and admin replies
    const [inquiries, setInquiries] = useState([
        {
            id: 101,
            title: 'Inquiry about Golden Valley',
            type: 'Listing',
            status: 'In Progress',
            date: '2024-02-20',
            message: 'I would like to know the exact square footage of the Golden Valley property.',
            adminReply: 'We are currently verifying the details with the surveyor. We will update you shortly.'
        },
        {
            id: 102,
            title: 'Service issue with site visit',
            type: 'Service',
            status: 'Open',
            date: '2024-02-21',
            message: 'My scheduled visit for yesterday was cancelled without prior notice.',
            adminReply: null
        },
    ]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const newInquiry = {
            id: Math.floor(Math.random() * 9000) + 1000,
            title,
            type,
            status: 'Open',
            date: new Date().toISOString().split('T')[0],
            message,
            adminReply: null
        };
        setInquiries([newInquiry, ...inquiries]);
        setTitle('');
        setMessage('');
        alert('Thank you! Your inquiry has been submitted.');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return '#FF9800';
            case 'In Progress': return '#2196F3';
            case 'Resolved': return '#4CAF50';
            default: return '#777';
        }
    };

    return (
        <div style={S.root}>
            <div style={S.container}>
                <header style={S.header}>
                    <h1 style={S.pageTitle}>Inquiries & Complaints</h1>
                    <p style={S.subtitle}>Submit your inquiries and track response from the admin</p>
                </header>

                <div style={S.layout}>
                    {/* Submit Form */}
                    <div style={S.formCard}>
                        <h2 style={S.sectionTitle}>Submit New Inquiry</h2>
                        <form onSubmit={handleSubmit} style={S.form}>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Subject / Title</label>
                                <input
                                    style={S.input}
                                    placeholder="Brief title of your inquiry"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Inquiry Type</label>
                                <select
                                    style={S.input}
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    <option value="Listing">About a Listing</option>
                                    <option value="Service">About a Service</option>
                                    <option value="General">General Complaint</option>
                                </select>
                            </div>
                            <div style={S.inputGroup}>
                                <label style={S.label}>Message Details</label>
                                <textarea
                                    style={{ ...S.input, height: '120px', resize: 'vertical' }}
                                    placeholder="Describe your inquiry in detail..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" style={S.submitBtn}>Submit Inquiry</button>
                        </form>
                    </div>

                    {/* Tracking List */}
                    <div style={S.listCard}>
                        <h2 style={S.sectionTitle}>Inquiry History & Replies</h2>
                        {!user ? (
                            <div style={S.loginNoticeBox}>
                                <p style={S.loginNotice}>Please login to view your specific inquiries and admin replies.</p>
                                <a href="/login" style={S.loginBtn}>Login Now</a>
                            </div>
                        ) : (
                            <div style={S.inquiryList}>
                                {inquiries.length === 0 ? (
                                    <p style={S.empty}>No inquiries found.</p>
                                ) : (
                                    inquiries.map((inq) => (
                                        <div key={inq.id} style={S.inquiryItem}>
                                            <div style={S.inqHeader}>
                                                <span style={S.inqType}>{inq.type}</span>
                                                <span
                                                    style={{
                                                        ...S.statusBadge,
                                                        backgroundColor: getStatusColor(inq.status) + '15',
                                                        color: getStatusColor(inq.status),
                                                        border: `1px solid ${getStatusColor(inq.status)}40`
                                                    }}
                                                >
                                                    {inq.status}
                                                </span>
                                            </div>
                                            <h3 style={S.inqTitle}>{inq.title}</h3>

                                            <div style={S.messageBox}>
                                                <p style={S.msgLabel}>Your Inquiry ({inq.date}):</p>
                                                <p style={S.msgContent}>{inq.message}</p>
                                            </div>

                                            {inq.adminReply ? (
                                                <div style={S.replyBox}>
                                                    <div style={S.replyHeader}>
                                                        <span style={S.replyTag}>Admin Reply</span>
                                                    </div>
                                                    <p style={S.replyContent}>{inq.adminReply}</p>
                                                </div>
                                            ) : (
                                                <div style={S.waitingBox}>
                                                    <p style={S.waitingText}>Admin has not replied yet. Please check back later.</p>
                                                </div>
                                            )}

                                            <div style={S.inqFooter}>
                                                <span style={S.inqId}>Ticket ID: #{inq.id}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100vh', padding: '120px 20px 60px' },
    container: { maxWidth: '1200px', margin: '0 auto' },
    header: { textAlign: 'center', marginBottom: '48px' },
    pageTitle: { fontSize: '2.5rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '12px' },
    subtitle: { fontSize: '1.1rem', color: '#666' },
    layout: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '40px', alignItems: 'start' },
    formCard: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', position: 'sticky', top: '120px' },
    listCard: { background: '#fff', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', minHeight: '500px' },
    sectionTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '24px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '0.85rem', fontWeight: '700', color: '#1A1A1A' },
    input: { padding: '12px 16px', borderRadius: '12px', border: '1px solid #EEE', fontSize: '0.95rem', background: '#F9F9F9', outline: 'none', transition: 'border 0.2s', fontFamily: 'inherit' },
    submitBtn: { padding: '14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    inquiryList: { display: 'flex', flexDirection: 'column', gap: '24px' },
    inquiryItem: { padding: '24px', borderRadius: '20px', border: '1px solid #F0F0F0', background: '#FFF' },
    inqHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    inqType: { fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: '#1A1A1A', background: '#F5F5F5', padding: '4px 10px', borderRadius: '6px' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
    inqTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px' },
    messageBox: { background: '#F9F9F9', padding: '16px', borderRadius: '12px', marginBottom: '16px' },
    msgLabel: { fontSize: '0.75rem', fontWeight: '700', color: '#777', marginBottom: '6px', textTransform: 'uppercase' },
    msgContent: { fontSize: '0.9rem', color: '#444', lineHeight: '1.5', margin: 0 },
    replyBox: { background: '#FAF6F1', padding: '16px', borderRadius: '12px', border: '1px solid #F2EBE1', borderLeft: '4px solid #1A1A1A' },
    replyHeader: { display: 'flex', alignItems: 'center', marginBottom: '8px' },
    replyTag: { fontSize: '0.75rem', fontWeight: '800', color: '#1A1A1A', textTransform: 'uppercase', background: '#FFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1A1A1A' },
    replyContent: { fontSize: '0.9rem', color: '#1A1A1A', lineHeight: '1.5', fontWeight: '500', margin: 0 },
    waitingBox: { padding: '12px', textAlign: 'center', background: '#F5F5F5', borderRadius: '12px', border: '1px dashed #DDD' },
    waitingText: { fontSize: '0.85rem', color: '#888', margin: 0, fontStyle: 'italic' },
    inqFooter: { marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F0F0F0', display: 'flex', justifyContent: 'flex-end' },
    inqId: { fontSize: '0.75rem', color: '#BBB', fontWeight: '600' },
    loginNoticeBox: { textAlign: 'center', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' },
    loginNotice: { color: '#666', fontSize: '0.95rem' },
    loginBtn: { padding: '10px 24px', background: '#1A1A1A', color: '#fff', textDecoration: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.9rem' },
    empty: { textAlign: 'center', marginTop: '40px', color: '#AAA', fontStyle: 'italic' }
};

export default InquiryPage;
