import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const BuyerVisitsPage = () => {
    const [myVisits, setMyVisits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tok = localStorage.getItem('access_token');
        if (!tok) { setLoading(false); return; }
        fetch(`${API}/visits/my-requests`, {
            headers: { 'Authorization': `Bearer ${tok}` }
        })
            .then(r => r.json())
            .then(data => setMyVisits(Array.isArray(data) ? data : []))
            .catch(() => setMyVisits([]))
            .finally(() => setLoading(false));
    }, []);

    // Filter by status for quick overview (tabs)
    const [filter, setFilter] = useState('All');
    const filtered = filter === 'All' ? myVisits : myVisits.filter(v => v.status === filter);

    const STATUS_COLORS = {
        Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
        Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
        Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>My Site Visits</h1>
                    <p style={S.subtitle}>Overview of all your scheduled property visits and their status.</p>
                </div>
                <div style={S.countBadge}>{myVisits.length} total</div>
            </div>

            {/* Filter tabs */}
            <div style={S.filterRow}>
                {['All', 'Pending', 'Accepted', 'Rejected'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            ...S.filterBtn,
                            background: filter === f ? '#1A1A1A' : '#fff',
                            color: filter === f ? '#fff' : '#555',
                            border: filter === f ? 'none' : '1px solid #e5e0da',
                        }}>
                        {f}
                        {f !== 'All' && (
                            <span style={S.filterCount}>
                                {myVisits.filter(v => v.status === f).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={S.empty}>Loading visit requests...</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}visit requests found.</div>
            ) : (
                <div style={S.grid}>
                    {filtered.map(visit => {
                        const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.Pending;
                        return (
                            <div key={visit.id} style={S.card}>
                                <div style={S.cardHeader}>
                                    <div>
                                        <h3 style={S.landName}>{visit.land_name || `Land #${visit.land_id}`}</h3>
                                        <div style={{ ...S.typeTag, color: visit.visit_type === 'self_visit' ? '#1565c0' : '#7b1fa2' }}>
                                            {visit.visit_type === 'self_visit' ? 'Self Visit' : 'Agent Scheduled'}
                                        </div>
                                    </div>
                                    <span style={{ ...S.statusBadge, background: sc.bg, color: sc.color }}>
                                        {visit.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={S.details}>
                                    <div style={S.detailRow}>
                                        <span style={S.detailLabel}>SCHEDULED DATE</span>
                                        <span style={S.detailVal}>{new Date(visit.visit_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div style={S.detailRow}>
                                        <span style={S.detailLabel}>TIME SLOT</span>
                                        <span style={S.detailVal}>{visit.visit_time}</span>
                                    </div>
                                    {visit.message && (
                                        <div style={S.messageBox}>
                                            <span style={S.messageTitle}>Your Message</span>
                                            <p style={S.messageContent}>{visit.message}</p>
                                        </div>
                                    )}
                                    {visit.seller_message && (
                                        <div style={{ ...S.messageBox, background: '#E8F5E9' }}>
                                            <span style={{ ...S.messageTitle, color: '#2E7D32' }}>Seller's Reply</span>
                                            <p style={{ ...S.messageContent, color: '#1B5E20' }}>{visit.seller_message}</p>
                                        </div>
                                    )}
                                </div>
                                <div style={S.footer}>
                                    <span style={S.receivedDate}>Request sent {new Date(visit.created_at).toLocaleDateString()}</span>
                                    <button style={S.viewBtn} onClick={() => window.location.href = `/lands/${visit.land_id}`}>View Land</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '6px', letterSpacing: '-0.02em' },
    subtitle: { color: '#777', fontSize: '1rem', fontWeight: '500' },
    countBadge: { background: '#1A1A1A', color: '#fff', borderRadius: '30px', padding: '8px 18px', fontWeight: '700', fontSize: '0.85rem' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' },
    filterBtn: { padding: '10px 24px', borderRadius: '30px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
    filterCount: { background: 'rgba(255,255,255,0.2)', borderRadius: '10px', padding: '1px 8px', fontSize: '0.7rem' },
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(26, 26, 26, 0.04)', border: '1px solid #F0EBE4' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #F0EBE4', paddingBottom: '16px' },
    landName: { fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '2px' },
    typeTag: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statusBadge: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.08em' },

    details: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: '0.68rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.08em' },
    detailVal: { fontSize: '0.92rem', fontWeight: '700', color: '#1A1A1A' },

    messageBox: { background: '#F9F7F5', borderRadius: '16px', padding: '16px', marginTop: '8px' },
    messageTitle: { fontSize: '0.65rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em', display: 'block' },
    messageContent: { fontSize: '0.88rem', color: '#444', lineHeight: '1.5', fontWeight: '500', margin: 0 },

    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', borderTop: '1px solid #F0EBE4', paddingTop: '16px' },
    receivedDate: { fontSize: '0.72rem', color: '#BBB', fontWeight: '600' },
    viewBtn: { background: 'none', border: '1.5px solid #1A1A1A', borderRadius: '10px', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', color: '#1A1A1A', cursor: 'pointer' }
};

export default BuyerVisitsPage;
