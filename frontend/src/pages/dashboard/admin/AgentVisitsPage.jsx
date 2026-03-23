import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_COLORS = {
    Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
    SellerAccepted: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' }, // New: Ready for admin
    Assigned: { bg: '#E3F2FD', color: '#0D47A1', border: '#BBDEFB' },
    Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Completed: { bg: '#E8F5E9', color: '#1B5E20', border: '#C8E6C9' },
    Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
    AgentDeclined: { bg: '#fff3e0', color: '#f57c00', border: '#ffe0b2' },
};

const AgentVisitsPage = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [updating, setUpdating] = useState(null);
    const [error, setError] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const [agents, setAgents] = useState([]);
    const [selectedAgents, setSelectedAgents] = useState({});
    const [rejectingVisit, setRejectingVisit] = useState(null); // Stores the visit object being rejected
    const [rejectMessage, setRejectMessage] = useState('');
    const [agentBusyMap, setAgentBusyMap] = useState({}); // { [agentId]: { [date]: [times] } }
    const [animatedCards, setAnimatedCards] = useState({});

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const fetchVisits = () => {
        setLoading(true);
        fetch(`${API}/visits/all-agent-visits`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                const list = Array.isArray(data) ? data : [];
                setVisits(list);
                
                // Build a quick map of agent busy times: { agentId: { date: [time1, time2] } }
                const busy = {};
                list.forEach(v => {
                    if (v.agent_id && ['Assigned', 'Accepted', 'Completed'].includes(v.status)) {
                        const aid = v.agent_id;
                        if (!busy[aid]) busy[aid] = {};
                        if (!busy[aid][v.visit_date]) busy[aid][v.visit_date] = [];
                        busy[aid][v.visit_date].push(v.visit_time);
                    }
                });
                setAgentBusyMap(busy);
                setLoading(false);
            })
            .catch(() => { setVisits([]); setLoading(false); });
    };

    const fetchAgents = () => {
        fetch(`${API}/admin/agents`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => setAgents(Array.isArray(data) ? data : []))
            .catch(err => console.error("Failed to fetch agents", err));
    };

    useEffect(() => {
        fetchVisits();
        fetchAgents();
    }, []);

    useEffect(() => {
        const source = filter === 'All'
            ? visits
            : filter === 'To Assign'
                ? visits.filter(v => v.status === 'SellerAccepted' || v.status === 'AgentDeclined')
                : visits.filter(v => v.status === filter);

        const timers = source.map((visit, idx) => {
            const key = visit._id || visit.id;
            return setTimeout(() => {
                setAnimatedCards((prev) => ({ ...prev, [key]: true }));
            }, idx * 60);
        });

        return () => timers.forEach(clearTimeout);
    }, [visits, filter]);

    const updateStatus = async (visitId, newStatus, message = '') => {
        const agentId = selectedAgents[visitId];
        if (newStatus === 'Accepted' && !agentId) {
            setError('Please select an agent to assign before confirming.');
            return;
        }

        const finalMessage = message || replyTexts[visitId] || '';

        setUpdating(visitId); setError('');
        try {
            const res = await fetch(`${API}/visits/${visitId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    status: newStatus,
                    agent_id: agentId || null,
                    seller_message: finalMessage
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to update.');
            } else {
                const assignedAgent = agents.find(a => (a.id || a._id) === agentId);
                setVisits(prev => prev.map(v => {
                    const vId = v._id || v.id;
                    return vId === visitId ? { 
                        ...v, 
                        status: newStatus, 
                        seller_message: finalMessage, 
                        agent_id: agentId,
                        agent_name: assignedAgent ? (assignedAgent.full_name || assignedAgent.name) : v.agent_name
                    } : v;
                }));
                setRejectingVisit(null);
                setRejectMessage('');
            }
        } catch { setError('Server error. Try again.'); }
        setUpdating(null);
    };

    const filtered = filter === 'All' 
        ? visits 
        : filter === 'To Assign' 
            ? visits.filter(v => v.status === 'SellerAccepted' || v.status === 'AgentDeclined')
            : visits.filter(v => v.status === filter);

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Agent Site Requests</h1>
                    <p style={S.subtitle}>Manage site visit requests assigned for agent assistance.</p>
                </div>
                <div style={S.countBadge}>{visits.filter(v => v.status === 'SellerAccepted' || v.status === 'AgentDeclined').length} To Assign</div>
            </div>

            {error && <div style={S.errBox}>{error}</div>}

            <div style={S.filterRow}>
                {['All', 'To Assign', 'Assigned', 'Accepted', 'Completed', 'Rejected', 'AgentDeclined'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            ...S.filterBtn,
                            background: filter === f ? 'var(--color-primary)' : '#fff',
                            color: filter === f ? '#fff' : '#555',
                            border: filter === f ? 'none' : '1px solid var(--color-accent)',
                        }}>
                        {f}
                        {f !== 'All' && (
                            <span style={S.filterCount}>
                                {visits.filter(v => 
                                    f === 'To Assign' ? (v.status === 'SellerAccepted' || v.status === 'AgentDeclined') : v.status === f
                                ).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={S.empty}>Loading requests…</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}requests found.</div>
            ) : (
                <div style={S.cards}>
                    {filtered.map(visit => {
                        const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.Pending;
                        const vId = visit._id || visit.id;

                        // Filter agents by land address (location match)
                        const landLoc = (visit.land_address || "").toLowerCase();
                        const localAgents = agents.filter(agent => {
                            const agentLoc = (agent.address || agent.Address || "").toLowerCase();
                            // If agent is in Piliyandala and land is Colombo Piliyandala, it should match
                            return landLoc.includes(agentLoc) || agentLoc.includes(landLoc);
                        });

                        return (
                            <div
                                key={vId}
                                style={{
                                    ...S.card,
                                    opacity: animatedCards[vId] ? 1 : 0,
                                    transform: animatedCards[vId] ? 'translateY(0)' : 'translateY(12px)',
                                    transition: 'opacity 0.34s ease, transform 0.34s ease'
                                }}
                            >
                                <div style={S.infoSection}>
                                    <div>
                                        <div style={S.buyerName}>{visit.buyer_name || 'Buyer'}</div>
                                        <div style={S.landName}>Property: {visit.land_name || visit.land_id}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>Location: {visit.land_address}</div>
                                    </div>
                                    <div style={S.detailsStrip}>
                                        <div style={S.infoItem}>
                                            <span style={S.detailKey}>SCHEDULED DATE</span>
                                            <span style={S.detailVal}>{visit.visit_date}</span>
                                        </div>
                                        <div style={S.infoItem}>
                                            <span style={S.detailKey}>TIME SLOT</span>
                                            <span style={S.detailVal}>{visit.visit_time}</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={S.messageSection}>
                                    {visit.status === 'SellerAccepted' ? (
                                        <div style={S.replyArea}>
                                            <select
                                                style={selectedAgents[vId] ? { ...S.replyInput, borderColor: 'var(--color-dark)', background: '#F0F7FF' } : S.replyInput}
                                                value={selectedAgents[vId] || ''}
                                                onChange={(e) => setSelectedAgents(prev => ({ ...prev, [vId]: e.target.value }))}
                                            >
                                                <option value="">Select a local agent...</option>
                                                {localAgents.map(a => (
                                                    <option key={a.id || a._id} value={a.id || a._id}>
                                                        {a.full_name || a.name} ({a.address || a.Address})
                                                    </option>
                                                ))}
                                                {localAgents.length === 0 && (
                                                    <option disabled>No local agents found for this area</option>
                                                )}
                                            </select>

                                            {selectedAgents[vId] && (
                                                <div style={S.busyPreview}>
                                                    <div style={S.busyTitle}>Agent's Schedule for {visit.visit_date}:</div>
                                                    {agentBusyMap[selectedAgents[vId]]?.[visit.visit_date]?.length > 0 ? (
                                                        <div style={S.busyList}>
                                                            {agentBusyMap[selectedAgents[vId]][visit.visit_date].map((t, idx) => (
                                                                <span key={idx} style={{
                                                                    ...S.busyTag, 
                                                                    background: t === visit.visit_time ? '#ffebee' : '#F9F7F5',
                                                                    color: t === visit.visit_time ? '#c62828' : '#777',
                                                                    border: t === visit.visit_time ? '1px solid #ef9a9a' : '1px solid #E5E0DA'
                                                                }}>
                                                                    {t} {t === visit.visit_time ? '(CONFLICT)' : ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={S.freeNote}>Full Availability: No other assignments on this date.</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {visit.agent_name && (
                                                <div style={{ ...S.messageWrapper, border: 'none', background: '#e3f2fd' }}>
                                                    <div style={{ ...S.messageKey, color: '#1565c0' }}>Assigned Agent</div>
                                                    <div style={S.messageContent}>{visit.agent_name}</div>
                                                </div>
                                            )}
                                            {visit.message && (
                                                <div style={{ ...S.messageWrapper, marginTop: '8px' }}>
                                                    <div style={S.messageKey}>Buyer Notes</div>
                                                    <div style={S.messageContent}>{visit.message}</div>
                                                </div>
                                            )}
                                            {visit.admin_message && (
                                                <div style={{ ...S.messageWrapper, marginTop: '8px', background: visit.status === 'AgentDeclined' ? '#fff3e0' : '#F9F7F5' }}>
                                                    <div style={S.messageKey}>{visit.status === 'AgentDeclined' ? 'AGENT DECLINE REASON' : 'Admin Notes'}</div>
                                                    <div style={S.messageContent}>{visit.admin_message}</div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div style={S.actionSection}>
                                    <div style={{ textAlign: 'right', marginBottom: '10px' }}>
                                        <span style={{ ...S.statusLabel, background: sc.bg, color: sc.color }}>
                                            {visit.status === 'SellerAccepted' ? 'READY TO ASSIGN' : visit.status.toUpperCase()}
                                        </span>
                                    </div>

                                    {(visit.status === 'SellerAccepted' || visit.status === 'AgentDeclined') && (
                                        <div style={S.actionButtons}>
                                            <button
                                                style={S.primaryBtn}
                                                disabled={updating === vId}
                                                onClick={() => updateStatus(vId, 'Assigned')}>
                                                {visit.status === 'AgentDeclined' ? 'Re-assign Agent' : 'Confirm & Assign'}
                                            </button>
                                            <button
                                                style={S.secondaryBtn}
                                                disabled={updating === vId}
                                                onClick={() => {
                                                    setRejectingVisit(visit);
                                                    setRejectMessage('');
                                                }}>
                                                Cancel Visit
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Decline Message Modal */}
            {rejectingVisit && (
                <div style={S.modalOverlay}>
                    <div style={S.modalBox}>
                        <h2 style={S.modalTitle}>Decline Request</h2>
                        <p style={S.modalSubtitle}>Please provide a reason or a message to the buyer for declining this visit.</p>
                        
                        <div style={S.modalInfo}>
                            <strong>{rejectingVisit.buyer_name}</strong> - {rejectingVisit.land_name}
                        </div>

                        <textarea
                            style={S.modalInput}
                            placeholder="Type your message here... (e.g. Agent unavailable on this date, please pick another time)"
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                        />

                        <div style={S.modalActions}>
                            <button 
                                style={S.cancelBtn} 
                                onClick={() => setRejectingVisit(null)}
                                disabled={updating === (rejectingVisit._id || rejectingVisit.id)}
                            >
                                Cancel
                            </button>
                            <button 
                                style={S.confirmDeclineBtn}
                                onClick={() => updateStatus(rejectingVisit._id || rejectingVisit.id, 'Rejected', rejectMessage)}
                                disabled={updating === (rejectingVisit._id || rejectingVisit.id)}
                            >
                                {updating === (rejectingVisit._id || rejectingVisit.id) ? 'Declining...' : 'Confirm Decline'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const S = {
    root: { background: 'linear-gradient(180deg, #FAF6F1 0%, #F5EFE6 100%)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '6px' },
    subtitle: { color: 'var(--color-muted)', fontSize: '0.95rem' },
    countBadge: { background: 'var(--color-primary)', color: '#fff', borderRadius: '30px', padding: '8px 18px', fontWeight: '700', fontSize: '0.8rem', boxShadow: '0 12px 24px rgba(59,130,86,0.25)' },
    errBox: { background: '#fdecea', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.88rem', border: '1px solid #ef9a9a' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
    filterCount: { background: 'rgba(0,0,0,0.1)', borderRadius: '10px', padding: '1px 6px', fontSize: '0.7rem' },
    empty: { textAlign: 'center', color: '#aaa', padding: '80px 20px' },
    cards: { display: 'flex', flexDirection: 'column', gap: '16px' },
    card: { background: '#fff', borderRadius: '16px', padding: '20px 24px', boxShadow: '0 14px 26px rgba(26,26,26,0.08)', border: '1px solid var(--color-accent)', display: 'flex', gap: '32px', alignItems: 'center' },
    infoSection: { flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '12px' },
    detailsStrip: { display: 'flex', gap: '20px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '2px' },
    buyerName: { fontWeight: '800', fontSize: '1.2rem', color: 'var(--color-dark)' },
    landName: { fontSize: '0.85rem', color: 'var(--color-muted)', fontWeight: '500' },
    statusLabel: { padding: '4px 10px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: '900', letterSpacing: '0.05em' },
    detailKey: { fontSize: '0.6rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.05em', textTransform: 'uppercase' },
    detailVal: { fontSize: '0.9rem', fontWeight: '700', color: '#1A1A1A' },

    messageSection: { flex: '2 1 300px' },
    messageWrapper: { background: '#F9F7F5', borderRadius: '12px', padding: '12px 16px', border: '1px dashed #E5E0DA' },
    messageKey: { fontSize: '0.6rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '2px' },
    messageContent: { fontSize: '0.82rem', color: '#444', lineHeight: '1.4' },

    actionSection: { flex: '1 1 250px' },
    actionButtons: { display: 'flex', gap: '8px', marginTop: '10px' },
    primaryBtn: { flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' },
    secondaryBtn: { flex: 1, padding: '10px', background: '#ECFDF5', color: '#166534', border: '1.5px solid #86EFAC', borderRadius: '8px', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer' },
    replyArea: { display: 'flex', flexDirection: 'column' },
    replyInput: { width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #E5E0DA', fontSize: '0.85rem', outline: 'none', background: '#fff' },

    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(17, 24, 39, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)', animation: 'overlayFadeIn 0.25s ease' },
    modalBox: { background: '#fff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'modalPopIn 0.25s ease' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    modalSubtitle: { fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: '1.5', margin: 0 },
    modalInfo: { padding: '12px 16px', background: '#FAF6F1', borderRadius: '12px', fontSize: '0.9rem', color: '#444' },
    modalInput: { width: '100%', boxSizing: 'border-box', minHeight: '120px', borderRadius: '16px', border: '1.5px solid #F0EBE4', padding: '16px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s', '&:focus': { borderColor: '#1A1A1A' } },
    modalActions: { display: 'flex', gap: '12px', marginTop: '10px' },
    cancelBtn: { flex: 1, padding: '14px', background: '#ECFDF5', border: '1.5px solid #86EFAC', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', color: '#166534' },
    confirmDeclineBtn: { flex: 1, padding: '14px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'background 0.2s' },
    
    // Busy Preview Styles
    busyPreview: { marginTop: '12px', padding: '12px', background: '#fff', borderRadius: '12px', border: '1px solid #E5E0DA' },
    busyTitle: { fontSize: '0.65rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', marginBottom: '8px' },
    busyList: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
    busyTag: { padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '700' },
    freeNote: { fontSize: '0.75rem', color: '#2e7d32', fontWeight: '600', fontStyle: 'italic' }
};

export default AgentVisitsPage;
