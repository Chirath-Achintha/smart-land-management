import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_COLORS = {
    Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
    SellerAccepted: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' }, // Awaiting Admin
    Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
    Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
    Cancelled: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
    Completed: { bg: '#f5f5f5', color: '#616161', border: '#e0e0e0' }
};

const SellerVisitsPage = () => {
    const [visits, setVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null); 
    const [error, setError] = useState('');
    const [replyTexts, setReplyTexts] = useState({});
    const [rejectingVisit, setRejectingVisit] = useState(null);
    const [cancellingVisit, setCancellingVisit] = useState(null);
    const [rejectMessage, setRejectMessage] = useState('');
    const [cancelMessage, setCancelMessage] = useState('');
    const [viewMode, setViewMode] = useState('calendar'); 
    const [currentDate, setCurrentDate] = useState(new Date());

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

    const fetchMyLands = () => {
        fetch(`${API}/lands/my`, { headers: authHeaders })
            .then(r => r.json())
            .then(data => setMyLands(Array.isArray(data) ? data : []))
            .catch(() => setMyLands([]));
    };

    useEffect(() => { 
        fetchVisits(); 
        fetchMyLands();
    }, []);

    const location = useLocation();

    const [myLands, setMyLands] = useState([]);
    const [landFilter, setLandFilter] = useState('All Lands');
    const [isLandDropdownOpen, setIsLandDropdownOpen] = useState(false);
    const [visitTypeFilter, setVisitTypeFilter] = useState('All');
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        if (!loading && visits.length > 0) {
            const params = new URLSearchParams(location.search);
            const visitId = params.get('visit_id');
            if (visitId) {
                const v = visits.find(v => (v._id || v.id) === visitId);
                if (v) {
                    if (v.status === 'Cancelled' || v.status === 'Rejected') {
                        setFilter('Cancelled');
                    } else {
                        setFilter(v.status);
                    }
                    setTimeout(() => {
                        const el = document.getElementById(`visit-${visitId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.style.border = '2px solid #C62828';
                            setTimeout(() => { el.style.border = '1px solid var(--color-border)'; }, 3000);
                        }
                    }, 500);
                }
            }
        }
    }, [loading, visits, location.search]);

    const updateStatus = async (visitId, newStatus, message = '') => {
        let finalStatus = newStatus;
        const visit = visits.find(v => (v._id || v.id) === visitId);
        if (newStatus === 'Accepted' && visit?.visit_type === 'agent_visit') finalStatus = 'SellerAccepted';
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

    const landNamesFromMyLands = myLands.map(l => l.name);
    const landNamesFromVisits = [...new Set(visits.map(v => v.land_name || `Land #${v.land_id}`))];
    const uniqueLands = ['All Lands', ...new Set([...landNamesFromMyLands, ...landNamesFromVisits])];
    const typedVisits = visitTypeFilter === 'All' ? visits : visits.filter(v => v.visit_type === visitTypeFilter);

    const landFiltered = landFilter === 'All Lands'
        ? typedVisits
        : typedVisits.filter(v => (v.land_name || `Land #${v.land_id}`) === landFilter);

    const filtered = filter === 'All' 
        ? landFiltered 
        : filter === 'Cancelled'
            ? landFiltered.filter(v => v.status === 'Cancelled' || v.status === 'Rejected')
            : landFiltered.filter(v => v.status === filter);

    const byLand = filtered.reduce((acc, v) => {
        const key = v.land_id;
        if (!acc[key]) acc[key] = { land_name: v.land_name || `Land #${v.land_id}`, items: [] };
        acc[key].items.push(v);
        return acc;
    }, {});

    const activeSchedule = visits.filter(v => v.status === 'Accepted' || v.status === 'Completed');
    const scheduleByDate = activeSchedule.reduce((acc, v) => {
        const date = v.visit_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(v);
        return acc;
    }, {});

    const sortedDates = Object.keys(scheduleByDate).sort((a, b) => new Date(a) - new Date(b));

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date());

    const scrollToVisitCard = (visit) => {
        const vId = visit._id || visit.id;
        setViewMode('list');
        if (visit.status === 'Cancelled' || visit.status === 'Rejected') {
            setFilter('Cancelled');
        } else {
            setFilter(visit.status);
        }
        setTimeout(() => {
            const el = document.getElementById(`visit-${vId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.border = '2px solid #C62828';
                setTimeout(() => { el.style.border = '1px solid var(--color-border)'; }, 3000);
            }
        }, 100);
    };

    const renderCalendar = () => {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const daysInMonth = getDaysInMonth(month, year);
        const firstDay = getFirstDayOfMonth(month, year);
        const prevMonthDays = getDaysInMonth(month - 1, year);
        const days = [];

        for (let i = firstDay - 1; i >= 0; i--) days.push({ day: prevMonthDays - i, currentMonth: false, dateStr: `${year}-${month}-${prevMonthDays - i}` });
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({ day: i, currentMonth: true, dateStr: dStr });
        }
        const totalCells = 42;
        const remaining = totalCells - days.length;
        for (let i = 1; i <= remaining; i++) days.push({ day: i, currentMonth: false, dateStr: `${year}-${month + 2}-${i}` });

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
                                <div style={S.dayNum}><span style={isToday ? S.todayCircle : {}}>{d.day}</span></div>
                                <div style={S.eventList}>
                                    {dayVisits.map(v => (
                                        <div key={v.id || v._id} onClick={() => scrollToVisitCard(v)} style={{ 
                                            ...S.eventTag, 
                                            cursor: 'pointer',
                                            background: v.visit_type === 'self_visit' ? 'var(--color-primary-light)' : 'var(--color-secondary-light)',
                                            color: v.visit_type === 'self_visit' ? 'var(--color-primary-dark)' : 'var(--color-secondary-dark)',
                                            borderLeft: `3px solid ${v.visit_type === 'self_visit' ? 'var(--color-primary-dark)' : 'var(--color-secondary-dark)'}`
                                        }}>
                                            <span style={S.eventDot}></span>
                                            {v.visit_type === 'self_visit' ? 'Self' : 'Agent'} - {v.visit_time}
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <div style={S.typeToggleRow}>
                    {[{ id: 'All', label: 'All Visits' }, { id: 'self_visit', label: 'Self Visits' }, { id: 'agent_visit', label: 'Agent Visits' }].map(type => (
                        <button key={type.id} onClick={() => setVisitTypeFilter(type.id)} style={{
                            ...S.typeTab,
                            background: visitTypeFilter === type.id ? 'var(--color-dark)' : 'transparent',
                            color: visitTypeFilter === type.id ? '#fff' : 'var(--color-dark)',
                        }}>{type.label}</button>
                    ))}
                </div>

                <div style={S.landFilterBox} onClick={() => setIsLandDropdownOpen(!isLandDropdownOpen)}>
                    <span style={S.landFilterLabel}>FILTER BY LAND:</span>
                    <div style={S.customDropWrapper}>
                        <div style={S.customDropValue}>{landFilter} <span style={{ transition: 'transform 0.2s', transform: isLandDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span></div>
                        {isLandDropdownOpen && (
                            <div style={S.customDropList}>
                                {uniqueLands.map(l => (
                                    <div key={l} style={{ ...S.customDropOption, background: landFilter === l ? 'var(--color-dark)' : 'transparent', color: landFilter === l ? '#fff' : 'var(--color-dark)' }} onClick={(e) => { e.stopPropagation(); setLandFilter(l); setIsLandDropdownOpen(false); }}>{l}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={S.filterRow}>
                {['All', 'Pending', 'Accepted', 'Cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        ...S.filterBtn,
                        background: filter === f ? '#fff' : 'transparent',
                        color: filter === f ? 'var(--color-dark)' : 'var(--color-text-soft)',
                        border: filter === f ? '1px solid var(--color-dark)' : '1px solid var(--color-border)',
                    }}>
                        {f}
                        <span style={{ ...S.filterCount, background: filter === f ? 'var(--color-dark)' : 'transparent', color: filter === f ? '#fff' : 'var(--color-dark)' }}>
                            {f === 'All' ? landFiltered.length : f === 'Cancelled' ? landFiltered.filter(v => v.status === 'Cancelled' || v.status === 'Rejected').length : landFiltered.filter(v => v.status === f).length}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? <div style={S.empty}>Loading visit requests…</div> : filtered.length === 0 ? <div style={S.empty}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}visit requests yet.</div> : (
                Object.values(byLand).map(group => (
                    <div key={group.land_name} style={S.landGroup}>
                        <div style={S.landGroupTitle}>{group.land_name}</div>
                        <div style={S.cards}>
                            {group.items.map(visit => {
                                const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.Pending;
                                const vId = visit._id || visit.id;
                                return (
                                    <div key={vId} id={`visit-${vId}`} style={S.card}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                            <div>
                                                <div style={S.buyerName}>{visit.buyer_name || 'Buyer'}</div>
                                                <div style={{ ...S.typeLabel, color: visit.visit_type === 'self_visit' ? 'var(--color-primary-dark)' : 'var(--color-secondary-dark)' }}>{visit.visit_type === 'self_visit' ? 'Self Visit' : 'Agent Visit'}</div>
                                            </div>
                                            <span style={{ ...S.statusLabel, background: sc.bg, color: sc.color }}>{visit.status.toUpperCase()}</span>
                                        </div>
                                        <div style={S.detailsArea}>
                                            <div style={S.detailRow}><span style={S.detailKey}>SCHEDULED DATE</span><span style={S.detailVal}>{new Date(visit.visit_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                                            <div style={S.detailRow}><span style={S.detailKey}>TIME SLOT</span><span style={S.detailVal}>{visit.visit_time}</span></div>
                                        </div>
                                        {visit.status === 'Cancelled' ? (visit.cancel_reason && <div style={{ ...S.messageWrapper, background: '#fdecea', border: '1px solid #ef9a9a' }}><div style={{ ...S.messageKey, color: '#c62828' }}>Cancellation Reason</div><div style={{ ...S.messageContent, color: '#c62828' }}>{visit.cancel_reason}</div></div>) : (
                                            <>
                                                {visit.message && <div style={S.messageWrapper}><div style={S.messageKey}>Message from Buyer</div><div style={S.messageContent}>{visit.message}</div></div>}
                                                {visit.status === 'Pending' && visit.visit_type === 'self_visit' && (
                                                    <div style={S.replyArea}><label style={S.replyLabel}>YOUR RESPONSE (OPTIONAL)</label><textarea style={S.replyInput} placeholder="Type a message to the buyer..." value={replyTexts[vId] || ''} onChange={(e) => setReplyTexts(prev => ({ ...prev, [vId]: e.target.value }))} /></div>
                                                )}
                                                {visit.seller_message && <div style={{ ...S.messageWrapper, background: '#E8F5E9', border: '1px solid #C8E6C9' }}><div style={{ ...S.messageKey, color: '#2E7D32' }}>Your Reply</div><div style={S.messageContent}>{visit.seller_message}</div></div>}
                                            </>
                                        )}
                                        <div style={S.timestamp}>Request received {new Date(visit.created_at).toLocaleDateString()}</div>
                                        {visit.agent_name && (
                                            <div style={{ ...S.messageWrapper, background: 'var(--color-bg-light)', marginTop: '16px', border: '1px solid var(--color-border)' }}>
                                                <div style={{ ...S.messageKey }}>ASSIGNED AGENT</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                                    <div style={{ fontWeight: '700', color: 'var(--color-dark)' }}>{visit.agent_name}</div>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-primary)' }}>OFFICIAL AGENT</span>
                                                </div>
                                            </div>
                                        )}
                                        <div style={S.actionGrid}>
                                            {visit.status === 'Pending' && (
                                                <>
                                                    <button style={S.primaryBtn} disabled={updating === vId} onClick={() => updateStatus(vId, 'Accepted')}>{updating === vId ? '...' : 'Accept'}</button>
                                                    <button style={S.secondaryBtn} onClick={() => { setRejectingVisit(visit); setRejectMessage(''); }}>Decline</button>
                                                </>
                                            )}
                                            {['Accepted', 'SellerAccepted'].includes(visit.status) && (
                                                <button style={{ ...S.secondaryBtn, color: '#e74c3c', borderColor: '#e74c3c' }} onClick={() => setCancellingVisit(visit)}>Cancel Visit</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}

            {rejectingVisit && (
                <div style={S.modalOverlay}>
                    <div style={S.modalBox}>
                        <h2 style={S.modalTitle}>Decline Request</h2>
                        <textarea style={S.modalInput} placeholder="Provide a reason..." value={rejectMessage} onChange={(e) => setRejectMessage(e.target.value)} />
                        <div style={S.modalActions}>
                            <button style={S.cancelBtn} onClick={() => setRejectingVisit(null)}>Cancel</button>
                            <button style={S.confirmDeclineBtn} onClick={() => updateStatus(rejectingVisit._id || rejectingVisit.id, 'Rejected', rejectMessage)}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            {cancellingVisit && (
                <div style={S.modalOverlay}>
                    <div style={S.modalBox}>
                        <h2 style={S.modalTitle}>Cancel Visit</h2>
                        <textarea style={S.modalInput} placeholder="Reason for cancellation..." value={cancelMessage} onChange={(e) => setCancelMessage(e.target.value)} />
                        <div style={S.modalActions}>
                            <button style={S.cancelBtn} onClick={() => setCancellingVisit(null)}>Back</button>
                            <button style={S.confirmDeclineBtn} onClick={async () => {
                                const vId = cancellingVisit._id || cancellingVisit.id;
                                const res = await fetch(`${API}/visits/${vId}/cancel`, { method: 'PUT', headers: authHeaders, body: JSON.stringify({ reason: cancelMessage }) });
                                if (res.ok) { fetchVisits(); setCancellingVisit(null); }
                            }}>Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={S.scheduleSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <h2 style={S.sectionTitle}>Confirmed Schedule</h2>
                    <div style={S.viewToggle}>
                        <button onClick={() => setViewMode('list')} style={{ ...S.toggleBtn, ...(viewMode === 'list' ? S.toggleBtnActive : {}) }}>List</button>
                        <button onClick={() => setViewMode('calendar')} style={{ ...S.toggleBtn, ...(viewMode === 'calendar' ? S.toggleBtnActive : {}) }}>Calendar</button>
                    </div>
                </div>
                {viewMode === 'calendar' ? renderCalendar() : (
                    <div style={S.tableWrapper}>
                        <table style={S.table}>
                            <thead><tr><th style={S.th}>Date/Time</th><th style={S.th}>Land</th><th style={S.th}>Buyer</th><th style={S.th}>Type</th></tr></thead>
                            <tbody>
                                {activeSchedule.length === 0 ? <tr><td colSpan="4" style={{ ...S.td, textAlign: 'center', color: '#aaa', padding: '40px' }}>No visits scheduled.</td></tr> : sortedDates.map(date => scheduleByDate[date].map(v => (
                                    <tr key={v._id || v.id} style={S.tr}>
                                        <td style={S.td}>{date} {v.visit_time}</td>
                                        <td style={S.td}>{v.land_name}</td>
                                        <td style={S.td}>{v.buyer_name}</td>
                                        <td style={S.td}>{v.visit_type}</td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const S = {
    root: { background: 'var(--color-bg)', minHeight: '100vh', padding: '40px', fontFamily: "'DM Sans', sans-serif", color: 'var(--color-dark)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', margin: 0 },
    subtitle: { color: 'var(--color-text-soft)', margin: '4px 0 0' },
    countBadge: { background: 'var(--color-primary)', color: '#fff', borderRadius: '20px', padding: '4px 12px', fontSize: '0.85rem', fontWeight: '700' },
    typeToggleRow: { display: 'flex', gap: '8px', background: 'var(--color-bg-light)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border)' },
    typeTab: { padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
    landFilterBox: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' },
    landFilterLabel: { fontSize: '0.7rem', fontWeight: '800', color: 'var(--color-text-soft)' },
    customDropWrapper: { background: '#fff', border: '1px solid var(--color-border)', padding: '8px 16px', borderRadius: '10px', minWidth: '160px' },
    customDropValue: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700' },
    customDropList: { position: 'absolute', top: '100%', right: 0, background: '#fff', border: '1px solid var(--color-border)', borderRadius: '10px', boxShadow: 'var(--shadow-elevated)', zIndex: 10, width: '200px', marginTop: '4px' },
    customDropOption: { padding: '10px 16px', cursor: 'pointer', fontWeight: '600' },
    errBox: { background: '#fdecea', color: '#d32f2f', padding: '12px', borderRadius: '8px', marginBottom: '20px' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '32px' },
    filterBtn: { padding: '8px 16px', borderRadius: '20px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
    filterCount: { borderRadius: '10px', padding: '2px 6px', fontSize: '0.7rem' },
    empty: { textAlign: 'center', padding: '60px', color: 'var(--color-text-soft)', fontWeight: '600' },
    landGroup: { marginBottom: '40px' },
    landGroupTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '16px' },
    cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
    card: { background: '#fff', borderRadius: '20px', padding: '24px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-soft)' },
    buyerName: { fontSize: '1.1rem', fontWeight: '800' },
    typeLabel: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' },
    statusLabel: { fontSize: '0.65rem', fontWeight: '800', padding: '4px 8px', borderRadius: '6px' },
    detailsArea: { margin: '20px 0', padding: '16px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)' },
    detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    detailKey: { fontSize: '0.7rem', color: 'var(--color-text-soft)', fontWeight: '700' },
    detailVal: { fontSize: '0.9rem', fontWeight: '700' },
    messageWrapper: { background: 'var(--color-bg-light)', padding: '12px', borderRadius: '12px', marginBottom: '16px' },
    messageKey: { fontSize: '0.65rem', fontWeight: '800', color: 'var(--color-text-soft)', marginBottom: '4px' },
    messageContent: { fontSize: '0.85rem', fontWeight: '500' },
    timestamp: { fontSize: '0.7rem', color: 'var(--color-text-soft)' },
    actionGrid: { display: 'flex', gap: '10px', marginTop: '20px' },
    primaryBtn: { flex: 1, padding: '10px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    secondaryBtn: { flex: 1, padding: '10px', background: '#fff', color: 'var(--color-dark)', border: '1px solid var(--color-border)', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' },
    replyArea: { marginBottom: '16px' },
    replyLabel: { fontSize: '0.7rem', fontWeight: '700', color: 'var(--color-text-soft)', display: 'block', marginBottom: '6px' },
    replyInput: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--color-border)', fontFamily: 'inherit', height: '60px' },
    scheduleSection: { marginTop: '60px', padding: '40px', background: '#fff', borderRadius: '24px', border: '1px solid var(--color-border)' },
    sectionTitle: { fontSize: '1.5rem', fontWeight: '800', margin: 0 },
    tableWrapper: { overflowX: 'auto', marginTop: '20px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', fontSize: '0.75rem', fontWeight: '800', color: 'var(--color-text-soft)', borderBottom: '2px solid var(--color-border)' },
    tr: { borderBottom: '1px solid var(--color-border)' },
    td: { padding: '12px', fontSize: '0.9rem', fontWeight: '600' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(4px)' },
    modalBox: { background: '#fff', padding: '32px', borderRadius: '24px', width: '400px', boxShadow: 'var(--shadow-elevated)' },
    modalTitle: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '16px' },
    modalInput: { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--color-border)', height: '100px', marginBottom: '20px' },
    modalActions: { display: 'flex', gap: '10px' },
    cancelBtn: { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', fontWeight: '700', cursor: 'pointer' },
    confirmDeclineBtn: { flex: 1, padding: '12px', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' },
    viewToggle: { display: 'flex', gap: '4px', background: 'var(--color-bg-light)', padding: '4px', borderRadius: '10px' },
    toggleBtn: { padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer' },
    toggleBtnActive: { background: '#fff', boxShadow: 'var(--shadow-soft)' },
    calendarRoot: { border: '1px solid var(--color-border)', borderRadius: '20px', overflow: 'hidden' },
    calHeader: { padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' },
    calTitle: { fontSize: '1.2rem', fontWeight: '800' },
    calNav: { display: 'flex', gap: '8px' },
    calNavBtn: { padding: '6px 12px', border: '1px solid var(--color-border)', background: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' },
    todayBtn: { background: 'var(--color-primary)', color: '#fff', border: 'none' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--color-border)', gap: '1px' },
    weekDayHead: { padding: '12px', textAlign: 'center', fontSize: '0.7rem', fontWeight: '800', background: 'var(--color-bg-light)' },
    dayCell: { background: '#fff', padding: '8px', minHeight: '100px' },
    dayNum: { textAlign: 'right', fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-text-soft)' },
    todayCircle: { background: 'var(--color-primary)', color: '#fff', padding: '2px 6px', borderRadius: '50%' },
    eventList: { display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' },
    eventTag: { fontSize: '0.65rem', padding: '4px 6px', borderRadius: '4px', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    eventDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor', marginRight: '4px', display: 'inline-block' }
};

export default SellerVisitsPage;
