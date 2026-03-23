import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_COLORS = {
    Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
    SellerAccepted: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' }, // Awaiting Admin
    Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SellerVisitsPage = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null); 
    const [error, setError] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const [rejectingVisit, setRejectingVisit] = useState(null);
    const [rejectMessage, setRejectMessage] = useState('');
    const [viewMode, setViewMode] = useState('calendar'); // Default to the new calendar view
    const [currentDate, setCurrentDate] = useState(new Date()); // Auto-detect today

    const token = localStorage.getItem('access_token');
    const authHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

    const fetchVisits = () => {
        setLoading(true);
        fetch(`${API}/visits/my-lands`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => {
                setVisits(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => { setVisits([]); setLoading(false); });
    };

    useEffect(() => { fetchVisits(); }, []);

    const updateStatus = async (visitId, newStatus, message = '') => {
        let finalStatus = newStatus;
        const visit = visits.find(v => (v._id || v.id) === visitId);

        if (newStatus === 'Accepted' && visit?.visit_type === 'agent_visit') {
            finalStatus = 'SellerAccepted';
        }

        const finalMessage = message || replyTexts[visitId] || '';

        setUpdating(visitId); setError('');
        try {
            const res = await fetch(`${API}/visits/${visitId}/status`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({ status: finalStatus, seller_message: finalMessage }),
            });
            if (!res.ok) {
                const err = await res.json();
                setError(err.detail || 'Failed to update.');
            } else {
                setVisits(prev => prev.map(v => {
                    const vId = v._id || v.id;
                    return vId === visitId ? { ...v, status: finalStatus, seller_message: finalMessage } : v;
                }));
                setReplyTexts(prev => {
                    const next = { ...prev };
                    delete next[visitId];
                    return next;
                });
                setRejectingVisit(null);
                setRejectMessage('');
            }
        } catch { setError('Server error. Try again.'); }
        setUpdating(null);
    };
    // Filter by visit type separately
    const [visitTypeFilter, setVisitTypeFilter] = useState('All');

    // Filter by status for quick overview (tabs)
    const [filter, setFilter] = useState('All');

    const typedVisits = visitTypeFilter === 'All' 
        ? visits 
        : visits.filter(v => v.visit_type === visitTypeFilter);

    const filtered = filter === 'All' ? typedVisits : typedVisits.filter(v => v.status === filter);

    // Group by land
    const byLand = filtered.reduce((acc, v) => {
        const key = v.land_id;
        if (!acc[key]) acc[key] = { land_name: v.land_name || `Land #${v.land_id}`, items: [] };
        acc[key].items.push(v);
        return acc;
    }, {});

    // Accepted visits for the schedule table
    // Also include SellerAccepted in the visual schedule (since seller confirmed time)
    const activeSchedule = visits.filter(v => v.status === 'Accepted' || v.status === 'Completed');
    const scheduleByDate = activeSchedule.reduce((acc, v) => {
        const date = v.visit_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(v);
        return acc;
    }, {});

    const sortedDates = Object.keys(scheduleByDate).sort((a, b) => new Date(a) - new Date(b));

    // Calendar logic
    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        
        const prevMonthDays = getDaysInMonth(month - 1, year);
        const days = [];

        // Prev month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            days.push({ day: prevMonthDays - i, currentMonth: false, dateStr: `${year}-${month}-${prevMonthDays - i}` });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, currentMonth: true, dateStr: dStr });
        }

        // Next month padding
        const totalCells = 42;
        const remaining = totalCells - days.length;
        for (let i = 1; i <= remaining; i++) {
            days.push({ day: i, currentMonth: false, dateStr: `${year}-${month + 2}-${i}` });
        }

        return (
            <div style={S.calendarRoot}>
                <div style={S.calHeader}>
                    <h2 style={S.calTitle}>{monthNames[month]} {year}</h2>
                    <div style={S.calNav}>
                        <button style={S.calNavBtn} onClick={prevMonth}>&lt;</button>
                        <button style={{ ...S.calNavBtn, ...S.todayBtn }} onClick={goToToday}>Today</button>
                        <button style={S.calNavBtn} onClick={nextMonth}>&gt;</button>
                    </div>
                </div>
                <div style={S.calGrid}>
                    {weekDays.map(wd => <div key={wd} style={S.weekDayHead}>{wd}</div>)}
                    {days.map((d, i) => {
                        const dayVisits = activeSchedule.filter(v => v.visit_date === d.dateStr);
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = d.dateStr === todayStr;
                        return (
                            <div key={i} style={{ ...S.dayCell, opacity: d.currentMonth ? 1 : 0.4 }}>
                                <div style={S.dayNum}>
                                    <span style={isToday ? S.todayCircle : {}}>{d.day}</span>
                                </div>
                                <div style={S.eventList}>
                                    {dayVisits.map(v => (
                                        <div key={v.id || v._id} style={{ 
                                            ...S.eventTag, 
                                            background: v.visit_type === 'self_visit' ? '#E3F2FD' : '#F3E5F5',
                                            color: v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2',
                                            borderLeft: `3px solid ${v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2'}`
                                        }}>
                                            <span style={S.eventDot}></span>
                                            {v.visit_type === 'self_visit' ? 'Self Visit' : 'Agent Visit'} — {v.visit_time} - {v.land_name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <div>
                    <h1 style={S.title}>Site Visit Requests</h1>
                    <p style={S.subtitle}>Review and respond to buyer visit requests for your listings.</p>
                </div>
                <div style={S.countBadge}>{visits.length} total</div>
            </div>

            {error && <div style={S.errBox}>{error}</div>}

            {/* Type Toggle */}
            <div style={S.typeToggleRow}>
                {[
                    { id: 'All', label: 'All Visits' },
                    { id: 'self_visit', label: 'Self Visits' },
                    { id: 'agent_visit', label: 'Agent Visits' }
                ].map(type => (
                    <button 
                        key={type.id} 
                        onClick={() => setVisitTypeFilter(type.id)}
                        style={{
                            ...S.typeTab,
                            background: visitTypeFilter === type.id ? '#1A1A1A' : 'transparent',
                            color: visitTypeFilter === type.id ? '#fff' : '#1A1A1A',
                        }}>
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={S.filterRow}>
                {['All', 'Pending', 'Accepted', 'Rejected'].map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        style={{
                            ...S.filterBtn,
                            background: filter === f ? '#fff' : 'transparent',
                            color: filter === f ? '#1A1A1A' : '#555',
                            border: filter === f ? '1px solid #1A1A1A' : '1px solid #e5e0da',
                        }}>
                        {f}
                        {f !== 'All' && (
                            <span style={{
                                ...S.filterCount,
                                background: filter === f ? '#1A1A1A' : 'transparent',
                                color: filter === f ? '#fff' : '#1A1A1A'
                            }}>
                                {typedVisits.filter(v => v.status === f).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={S.empty}>Loading visit requests…</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}visit requests yet.</div>
            ) : (
                Object.values(byLand).map(group => (
                    <div key={group.land_name} style={S.landGroup}>
                        <div style={S.landGroupTitle}>{group.land_name}</div>
                        <div style={S.cards}>
                            {group.items.map(visit => {
                                const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.Pending;
                                const vId = visit._id || visit.id;
                                return (
                                    <div key={vId} style={S.card}>
                                        {/* Header: Buyer Name + Status */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                            <div>
                                                <div style={S.buyerName}>{visit.buyer_name || 'Buyer'}</div>
                                                <div style={{ ...S.typeLabel, color: visit.visit_type === 'self_visit' ? '#1565c0' : '#7b1fa2' }}>
                                                    {visit.visit_type === 'self_visit' ? 'Self Visit' : 'Agent Visit'}
                                                </div>
                                            </div>
                                            <span style={{ ...S.statusLabel, background: sc.bg, color: sc.color }}>
                                                {visit.status.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Visit Details: Minimalist Rows */}
                                        <div style={S.detailsArea}>
                                            <div style={S.detailRow}>
                                                <span style={S.detailKey}>SCHEDULED DATE</span>
                                                <span style={S.detailVal}>{new Date(visit.visit_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                            </div>
                                            <div style={S.detailRow}>
                                                <span style={S.detailKey}>TIME SLOT</span>
                                                <span style={S.detailVal}>{visit.visit_time}</span>
                                            </div>
                                        </div>

                                        {visit.message && (
                                            <div style={S.messageWrapper}>
                                                <div style={S.messageKey}>Message from Buyer</div>
                                                <div style={S.messageContent}>{visit.message}</div>
                                            </div>
                                        )}

                                        <div style={S.timestamp}>
                                            Request received {new Date(visit.created_at).toLocaleDateString()}
                                        </div>

                                        {/* Seller Reply Input (Only for Self Visits as per user request) */}
                                        {visit.status === 'Pending' && visit.visit_type === 'self_visit' && (
                                            <div style={S.replyArea}>
                                                <label style={S.replyLabel}>YOUR RESPONSE (OPTIONAL)</label>
                                                <textarea
                                                    style={S.replyInput}
                                                    placeholder="Type a message to the buyer..."
                                                    value={replyTexts[vId] || ''}
                                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [vId]: e.target.value }))}
                                                />
                                            </div>
                                        )}

                                        {visit.seller_message && (
                                            <div style={{ ...S.messageWrapper, background: '#E8F5E9', marginTop: '16px' }}>
                                                <div style={{ ...S.messageKey, color: '#2E7D32' }}>Your Reply</div>
                                                <div style={S.messageContent}>{visit.seller_message}</div>
                                            </div>
                                        )}

                                        {visit.admin_message && (
                                            <div style={{ ...S.messageWrapper, background: '#E3F2FD', marginTop: '16px' }}>
                                                <div style={{ ...S.messageKey, color: '#1565C0' }}>Admin's Reply</div>
                                                <div style={S.messageContent}>{visit.admin_message}</div>
                                            </div>
                                        )}

                                        {/* Assigned Agent info */}
                                        {(visit.status === 'Accepted' || visit.status === 'Completed') && visit.agent_name && (
                                            <div style={{ ...S.messageWrapper, background: '#F5F5F5', marginTop: '16px', border: '1px solid #E0E0E0' }}>
                                                <div style={{ ...S.messageKey, color: '#616161' }}>ASSIGNED AGENT</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                    <div style={{ fontWeight: '700', color: '#1A1A1A' }}>{visit.agent_name}</div>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#3498db' }}>OFFICIAL AGENT</span>
                                                </div>
                                                <div style={{ marginTop: '12px', display: 'flex', gap: '20px', fontSize: '0.8rem' }}>
                                                    <span style={{ color: '#555', fontWeight: 600 }}>TEL: {visit.agent_phone || 'N/A'}</span>
                                                    <span style={{ color: '#555', fontWeight: 600 }}>NIC: {visit.agent_nic || 'N/A'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        {visit.status === 'Pending' && (
                                            <div style={S.actionGrid}>
                                                <button
                                                    style={S.primaryBtn}
                                                    disabled={updating === vId}
                                                    onClick={() => updateStatus(vId, 'Accepted')}>
                                                    {updating === vId ? 'Processing...' : 'Accept Request'}
                                                </button>
                                                <button
                                                    style={S.secondaryBtn}
                                                    disabled={updating === vId}
                                                    onClick={() => {
                                                        setRejectingVisit(visit);
                                                        setRejectMessage('');
                                                    }}>
                                                    {updating === vId ? '...' : 'Decline'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {/* Decline Message Modal */}
            {rejectingVisit && (
                <div style={S.modalOverlay}>
                    <div style={S.modalBox}>
                        <h2 style={S.modalTitle}>Decline Visit Request</h2>
                        <p style={S.modalSubtitle}>Please provide a short reason for declining this request.</p>
                        
                        <div style={S.modalInfo}>
                            <strong>Buyer: {rejectingVisit.buyer_name}</strong><br/>
                            Date: {rejectingVisit.visit_date} at {rejectingVisit.visit_time}
                        </div>

                        <textarea
                            style={S.modalInput}
                            placeholder="e.g. I am not available at this time, please suggest another date."
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                        />

                        <div style={S.modalActions}>
                            <button style={S.cancelBtn} onClick={() => setRejectingVisit(null)}>Cancel</button>
                            <button 
                                style={S.confirmDeclineBtn}
                                onClick={() => updateStatus(rejectingVisit._id || rejectingVisit.id, 'Rejected', rejectMessage)}
                            >
                                Confirm Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Daily Schedule Summary Table */}
            {activeSchedule.length > 0 && (
                <div style={S.scheduleSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                        <div>
                            <h2 style={S.sectionTitle}>Confirmed Visit Schedule</h2>
                            <p style={S.sectionSubtitle}>A quick overview of all your upcoming site visits{viewMode === 'calendar' ? ' in a monthly view' : ''}.</p>
                        </div>
                        <div style={S.viewToggle}>
                            <button 
                                onClick={() => setViewMode('list')}
                                style={{ ...S.toggleBtn, ...(viewMode === 'list' ? S.toggleBtnActive : {}) }}
                            >
                                List View
                            </button>
                            <button 
                                onClick={() => setViewMode('calendar')}
                                style={{ ...S.toggleBtn, ...(viewMode === 'calendar' ? S.toggleBtnActive : {}) }}
                            >
                                Calendar View
                            </button>
                        </div>
                    </div>

                    {viewMode === 'calendar' ? renderCalendar() : (
                        <div style={S.tableWrapper}>
                            <table style={S.table}>
                                <thead>
                                    <tr>
                                        <th style={S.th}>Date</th>
                                        <th style={S.th}>Time</th>
                                        <th style={S.th}>Land</th>
                                        <th style={S.th}>Buyer</th>
                                        <th style={S.th}>Visit Type</th>
                                        <th style={S.th}>Agent Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedDates.map(date => (
                                        scheduleByDate[date].sort((a, b) => a.visit_time.localeCompare(b.visit_time)).map((v, idx) => (
                                            <tr key={v._id || v.id} style={S.tr}>
                                                {idx === 0 ? (
                                                    <td style={{ ...S.td, fontWeight: '800', borderLeft: '4px solid #1A1A1A' }} rowSpan={scheduleByDate[date].length}>
                                                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}
                                                    </td>
                                                ) : null}
                                                <td style={{ ...S.td, fontWeight: '700', color: '#1A1A1A' }}>{v.visit_time}</td>
                                                <td style={S.td}>{v.land_name}</td>
                                                <td style={{ ...S.td, fontWeight: '600' }}>
                                                    {v.buyer_name}
                                                    <div style={{ fontSize: '0.75rem', color: '#777', marginTop: '2px', fontWeight: '500' }}>{v.buyer_phone || 'No phone'}</div>
                                                </td>
                                                <td style={S.td}>
                                                    <span style={{ 
                                                        padding: '4px 10px', 
                                                        borderRadius: '6px', 
                                                        fontSize: '0.7rem', 
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em',
                                                        background: v.visit_type === 'self_visit' ? '#E3F2FD' : '#F3E5F5',
                                                        color: v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2'
                                                    }}>
                                                        {v.visit_type === 'self_visit' ? 'Self Visit' : 'Agent Visit'}
                                                    </span>
                                                </td>
                                                <td style={S.td}>
                                                    {v.visit_type === 'agent_visit' ? (
                                                        (v.status === 'Accepted' || v.status === 'Completed') && v.agent_name ? (
                                                            <div>
                                                                <div style={{ fontWeight: '700', color: '#3498db', fontSize: '0.85rem' }}>{v.agent_name}</div>
                                                                <div style={{ color: '#555', fontSize: '0.75rem', fontWeight: '600', marginTop: '2px' }}>{v.agent_phone}</div>
                                                            </div>
                                                        ) : (
                                                            <span style={{ color: '#aaa', fontSize: '0.75rem', fontWeight: '600', fontStyle: 'italic' }}>Pending Assignment</span>
                                                        )
                                                    ) : (
                                                        <span style={{ color: '#ccc', fontSize: '0.9rem', fontWeight: '700' }}>—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
    typeToggleRow: { display: 'flex', gap: '8px', marginBottom: '20px', background: '#F0EBE4', padding: '6px', borderRadius: '40px', width: 'fit-content' },
    typeTab: { padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease-in-out' },
    errBox: { background: '#fdecea', color: '#d32f2f', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', fontSize: '0.88rem', border: '1px solid #ef9a9a' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
    filterCount: { borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #e5e0da' },
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    landGroup: { marginBottom: '48px' },
    landGroupTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '20px', paddingLeft: '4px' },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    // Bespoke Card Styles
    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(26, 26, 26, 0.04)', border: '1px solid #F0EBE4', transition: 'transform 0.2s', position: 'relative' },
    buyerName: { fontWeight: '800', fontSize: '1.2rem', color: '#1A1A1A', marginBottom: '2px' },
    typeLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statusLabel: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.08em' },

    detailsArea: { marginTop: '24px', borderTop: '1px solid #F0EBE4', paddingTop: '20px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    detailKey: { fontSize: '0.68rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.08em' },
    detailVal: { fontSize: '0.92rem', fontWeight: '700', color: '#1A1A1A' },

    messageWrapper: { marginTop: '16px', background: '#F9F7F5', borderRadius: '16px', padding: '16px 20px' },
    messageKey: { fontSize: '0.65rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' },
    messageContent: { fontSize: '0.88rem', color: '#444', lineHeight: '1.5', fontWeight: '500' },

    timestamp: { fontSize: '0.72rem', color: '#BBB', marginTop: '24px', fontWeight: '600' },

    actionGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px', marginTop: '24px' },
    primaryBtn: { padding: '14px', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },
    secondaryBtn: { padding: '14px', background: '#fff', color: '#C62828', border: '1.5px solid #FDECEA', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.2s' },

    replyArea: { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
    replyLabel: { fontSize: '0.65rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.05em' },
    replyInput: { padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #E5E0DA', fontSize: '0.88rem', fontFamily: 'inherit', resize: 'vertical', minHeight: '60px', outline: 'none', transition: 'border-color 0.2s' },

    // Schedule Table Styles
    scheduleSection: { marginTop: '80px', background: '#fff', padding: '48px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    sectionTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    sectionSubtitle: { fontSize: '1rem', color: '#777', marginBottom: '32px' },
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F0F0F0' },
    tr: { borderBottom: '1px solid #F7F7F7', transition: 'background 0.2s' },
    td: { padding: '20px', fontSize: '0.95rem', color: '#333', fontWeight: '600' },

    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalBox: { background: '#fff', borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '20px' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    modalSubtitle: { fontSize: '0.9rem', color: '#666', lineHeight: '1.5', margin: 0 },
    modalInfo: { padding: '12px 16px', background: '#FAF6F1', borderRadius: '12px', fontSize: '0.85rem', color: '#444', lineHeight: '1.6' },
    modalInput: { width: '100%', boxSizing: 'border-box', minHeight: '120px', borderRadius: '16px', border: '1.5px solid #F0EBE4', padding: '16px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' },
    modalActions: { display: 'flex', gap: '12px', marginTop: '10px' },
    cancelBtn: { flex: 1, padding: '14px', background: 'none', border: '1.5px solid #E5E0DA', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', color: '#666' },
    confirmDeclineBtn: { flex: 1, padding: '14px', background: '#C62828', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer' },

    // View Toggle
    viewToggle: { display: 'flex', background: '#F0F0F0', padding: '4px', borderRadius: '12px', gap: '4px' },
    toggleBtn: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#666', transition: 'all 0.2s' },
    toggleBtnActive: { background: '#fff', color: '#1A1A1A', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },

    // Calendar Specific Styles
    calendarRoot: { border: '1px solid #F0EBE4', borderRadius: '32px', overflow: 'hidden', background: '#fff' },
    calHeader: { padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F0F0' },
    calTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    calNav: { display: 'flex', gap: '8px' },
    calNavBtn: { padding: '8px 16px', border: '1px solid #E5E0DA', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#1A1A1A', hover: { background: '#F9F9F9' } },
    todayBtn: { padding: '8px 20px', background: '#1A1A1A', color: '#fff', border: 'none' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(140px, auto)' },
    weekDayHead: { padding: '16px', fontSize: '0.75rem', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: '1px solid #F0F0F0', background: '#FAF9F7' },
    dayCell: { borderRight: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0', padding: '12px', position: 'relative', minHeight: '140px' },
    dayNum: { textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#666', marginBottom: '8px' },
    todayCircle: { background: '#00B4D8', color: '#fff', padding: '4px 8px', borderRadius: '50%', fontSize: '0.75rem' },
    eventList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    eventTag: { padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    eventDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }
};

export default SellerVisitsPage;
