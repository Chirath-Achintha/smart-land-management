import React, { useState, useEffect } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const BuyerVisitsPage = () => {
    const [myVisits, setMyVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingVisit, setUpdatingVisit] = useState(null);
    const [cancellingVisit, setCancellingVisit] = useState(null);
    const [editData, setEditData] = useState({ date: '', time: '', message: '' });
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 21)); // Mar 21, 2026
    const [highlightedVisitId, setHighlightedVisitId] = useState(null);

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

    // Filter by visit type separately
    const [visitTypeFilter, setVisitTypeFilter] = useState('All');

    // Filter by status for quick overview (tabs)
    const [filter, setFilter] = useState('All');

    // First filter by type
    const typedVisits = visitTypeFilter === 'All'
        ? myVisits
        : myVisits.filter(v => v.visit_type === visitTypeFilter);

    // Then filter by status
    const filtered = filter === 'All' ? typedVisits : typedVisits.filter(v => v.status === filter);

    const STATUS_COLORS = {
        Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
        Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
        Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
        Cancelled: { bg: '#eeeeee', color: '#757575', border: '#e0e0e0' },
    };

    const handleCancelSubmit = async () => {
        if (!cancellingVisit) return;
        const vId = cancellingVisit._id || cancellingVisit.id;
        if (!vId || vId === 'undefined') {
            alert('Error: Visit ID is missing');
            return;
        }

        try {
            const tok = localStorage.getItem('access_token');
            const res = await fetch(`${API}/visits/${vId}/cancel`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${tok}` }
            });
            if (res.ok) {
                setMyVisits(myVisits.map(v => v.id === vId || v._id === vId ? { ...v, status: 'Cancelled' } : v));
                setCancellingVisit(null);
            } else {
                const err = await res.json();
                alert(err.detail || 'Failed to cancel visit');
            }
        } catch (err) {
            alert('Error cancelling visit');
        }
    };

    const handleUpdate = (visit) => {
        setUpdatingVisit(visit);
        setEditData({
            date: visit.visit_date,
            time: visit.visit_time,
            message: visit.message || ''
        });
    };

    const handleUpdateSubmit = async () => {
        if (!updatingVisit) return;
        const vId = updatingVisit._id || updatingVisit.id;
        if (!vId || vId === 'undefined') {
            alert('Error: Visit ID is missing');
            return;
        }

        try {
            const tok = localStorage.getItem('access_token');
            const res = await fetch(`${API}/visits/${vId}/update`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${tok}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    land_id: updatingVisit.land_id,
                    visit_type: updatingVisit.visit_type,
                    visit_date: editData.date,
                    visit_time: editData.time,
                    message: editData.message,
                    status: 'Pending' // Force back to Pending so Seller can re-approve new time
                })
            });
            if (res.ok) {
                const updated = await res.json();
                const uId = updated._id || updated.id;
                setMyVisits(myVisits.map(v => (v._id || v.id) === uId ? updated : v));
                setUpdatingVisit(null);
                alert('Schedule updated successfully!');
            } else {
                const err = await res.json();
                const errorMsg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                alert(errorMsg || 'Failed to update schedule');
            }
        } catch (err) {
            console.error('Update update error:', err);
            alert('Error updating schedule. See console for details.');
        }
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date(2026, 2, 21));

    const scrollToVisit = (visitId) => {
        setHighlightedVisitId(visitId);
        const element = document.getElementById(`visit-card-${visitId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedVisitId(null), 3000);
        }
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

        const calendarVisits = myVisits.filter(v => ['Pending', 'Accepted', 'SellerAccepted', 'Assigned', 'Completed'].includes(v.status));

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
                        const dayVisits = calendarVisits.filter(v => v.visit_date === d.dateStr);
                        const isToday = d.dateStr === '2026-03-21';
                        return (
                            <div key={i} style={{ ...S.dayCell, opacity: d.currentMonth ? 1 : 0.4 }}>
                                <div style={S.dayNum}><span style={isToday ? S.todayCircle : {}}>{d.day}</span></div>
                                <div style={S.eventList}>
                                    {dayVisits.map(v => (
                                        <div 
                                            key={v.id || v._id} 
                                            style={{ 
                                                ...S.eventTag, 
                                                cursor: 'pointer',
                                                background: v.visit_type === 'self_visit' ? '#E3F2FD' : '#F3E5F5',
                                                color: v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2',
                                                borderLeft: `3px solid ${v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2'}`
                                            }}
                                            onClick={() => scrollToVisit(v.id || v._id)}
                                            title="Click to see details above"
                                        >
                                            <span style={S.eventDot}></span>
                                            {v.visit_time} - {v.land_name || 'Land'}
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
                    <h1 style={S.title}>My Site Visits</h1>
                    <p style={S.subtitle}>Overview of all your scheduled property visits and their status.</p>
                </div>
                <div style={S.countBadge}>{myVisits.length} total</div>
            </div>

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
                <div style={S.empty}>Loading visit requests...</div>
            ) : filtered.length === 0 ? (
                <div style={S.empty}>No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}visit requests found.</div>
            ) : (
                <div style={S.grid}>
                    {filtered.map(visit => {
                        const sc = STATUS_COLORS[visit.status] || STATUS_COLORS.Pending;
                        const vId = visit.id || visit._id;
                        const isHighlighted = highlightedVisitId === vId;
                        return (
                            <div 
                                key={vId} 
                                id={`visit-card-${vId}`}
                                style={{ 
                                    ...S.card,
                                    border: isHighlighted ? '2px solid #3498db' : '1px solid #F0EBE4',
                                    boxShadow: isHighlighted ? '0 12px 32px rgba(52, 152, 219, 0.2)' : '0 8px 32px rgba(26, 26, 26, 0.04)',
                                    transform: isHighlighted ? 'scale(1.02)' : 'scale(1)',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <div style={S.cardHeader}>
                                    <div>
                                        <h3 style={S.landName}>{visit.land_name || `Land #${visit.land_id}`}</h3>
                                        <div style={{ ...S.typeTag, color: visit.visit_type === 'self_visit' ? '#1565c0' : '#7b1fa2' }}>
                                            {visit.visit_type === 'self_visit' ? 'Self Visit' : 'Agent Visit'}
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
                                        <div style={{ 
                                            ...S.messageBox, 
                                            background: (visit.status === 'Rejected' && !visit.admin_message) ? '#fdecea' : '#E8F5E9' 
                                        }}>
                                            <span style={{ 
                                                ...S.messageTitle, 
                                                color: (visit.status === 'Rejected' && !visit.admin_message) ? '#C62828' : '#2E7D32' 
                                            }}>
                                                Seller's Reply
                                            </span>
                                            <p style={{ 
                                                ...S.messageContent, 
                                                color: (visit.status === 'Rejected' && !visit.admin_message) ? '#C62828' : '#1B5E20' 
                                            }}>
                                                {visit.seller_message}
                                            </p>
                                        </div>
                                    )}
                                    {visit.admin_message && (
                                        <div style={{ 
                                            ...S.messageBox, 
                                            marginTop: visit.seller_message ? '12px' : '0',
                                            padding: '16px',
                                            borderRadius: '16px',
                                            background: (visit.status === 'Rejected') ? '#fdecea' : '#E3F2FD' 
                                        }}>
                                            <span style={{ 
                                                ...S.messageTitle, 
                                                color: (visit.status === 'Rejected') ? '#C62828' : '#1565C0' 
                                            }}>
                                                Admin's Reply
                                            </span>
                                            <p style={{ 
                                                ...S.messageContent, 
                                                color: (visit.status === 'Rejected') ? '#C62828' : '#0D47A1' 
                                            }}>
                                                {visit.admin_message}
                                            </p>
                                        </div>
                                    )}

                                    {/* Agent Details */}
                                    {(visit.status === 'Accepted' || visit.status === 'Completed') && visit.agent_name && (
                                        <div style={{ ...S.messageBox, background: '#F5F5F5', marginTop: '16px', border: '1px solid #E0E0E0' }}>
                                            <span style={S.messageTitle}>Assigned Agent</span>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                                <span style={{ fontWeight: '700', color: '#1A1A1A' }}>{visit.agent_name}</span>
                                                <span style={{ fontSize: '0.8rem', color: '#3498db', fontWeight: '800' }}>OFFICIAL AGENT</span>
                                            </div>
                                            <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                                                <span style={{ color: '#555', fontWeight: '700' }}>TEL: {visit.agent_phone || 'N/A'}</span>
                                                <span style={{ color: '#555', fontWeight: '700' }}>NIC: {visit.agent_nic || 'N/A'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ ...S.footer, flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {visit.status !== 'Cancelled' && visit.status !== 'Rejected' && visit.status !== 'Completed' && (
                                                <button 
                                                    style={{ ...S.viewBtn, borderColor: '#e74c3c', color: '#e74c3c' }}
                                                    onClick={() => setCancellingVisit(visit)}
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            {['Pending', 'SellerAccepted'].includes(visit.status) && (
                                                <button 
                                                    style={{ ...S.viewBtn, borderColor: '#3498db', color: '#3498db' }}
                                                    onClick={() => handleUpdate(visit)}
                                                >
                                                    Update
                                                </button>
                                            )}
                                        </div>
                                        <button style={S.viewBtn} onClick={() => window.location.href = `/lands/${visit.land_id}`}>View Land</button>
                                    </div>
                                    <div style={{ marginTop: '12px', width: '100%' }}>
                                        <span style={S.receivedDate}>Request sent {new Date(visit.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Update Modal */}
            {updatingVisit && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <h2 style={S.modalTitle}>Update Site Visit</h2>
                        <p style={S.modalSub}>Adjust your scheduled date and time for <strong>{updatingVisit.land_name || 'this property'}</strong>.</p>
                        
                        <div style={S.modalBody}>
                            <div style={S.inputRow}>
                                <label style={S.label}>New Date</label>
                                <input 
                                    type="date" 
                                    style={S.input} 
                                    value={editData.date}
                                    onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                                />
                            </div>
                            <div style={S.inputRow}>
                                <label style={S.label}>New Time</label>
                                <input 
                                    type="time" 
                                    style={S.input} 
                                    value={editData.time}
                                    onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                                />
                            </div>
                        </div>

                        <div style={S.modalFooter}>
                            <button style={S.cancelBtn} onClick={() => setUpdatingVisit(null)}>Close</button>
                            <button style={S.saveBtn} onClick={handleUpdateSubmit}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancellingVisit && (
                <div style={S.modalOverlay}>
                    <div style={{ ...S.modalContent, maxWidth: '400px', textAlign: 'center' }}>
                        <div style={S.warningIcon}>!</div>
                        <h2 style={S.modalTitle}>Are you sure?</h2>
                        <p style={S.modalSub}>You are about to cancel your visit request for <strong>{cancellingVisit.land_name}</strong>. This action cannot be undone.</p>
                        
                        <div style={{ ...S.modalFooter, justifyContent: 'center', marginTop: '32px' }}>
                            <button style={S.cancelBtn} onClick={() => setCancellingVisit(null)}>Keep Booking</button>
                            <button style={{ ...S.saveBtn, backgroundColor: '#e74c3c' }} onClick={handleCancelSubmit}>Yes, Cancel it</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timetable Section */}
            <div style={S.scheduleSection}>
                <div style={S.scheduleHeader}>
                    <div>
                        <h2 style={S.sectionTitle}>My Visit Timetable</h2>
                        <p style={S.sectionSubtitle}>A visual monthly overview of all your property site visits.</p>
                    </div>
                </div>
                {renderCalendar()}
            </div>
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
    filterRow: { display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
    filterCount: { borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', border: '1px solid #e5e0da' },
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: '0 8px 32px rgba(26, 26, 26, 0.04)', border: '1px solid #F0EBE4', display: 'flex', flexDirection: 'column' },
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

    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid #F0EBE4', paddingTop: '16px' },
    receivedDate: { fontSize: '0.72rem', color: '#BBB', fontWeight: '600' },
    viewBtn: { background: 'none', border: '1.5px solid #1A1A1A', borderRadius: '10px', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', color: '#1A1A1A', cursor: 'pointer', transition: 'all 0.2s ease-in-out', hover: { background: '#1A1A1A', color: '#fff' } },
    
    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: '#fff', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' },
    modalTitle: { fontSize: '1.75rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    modalSub: { color: '#666', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '32px' },
    modalBody: { display: 'flex', flexDirection: 'column', gap: '20px' },
    input: { padding: '16px', borderRadius: '12px', border: '1.5px solid #F0EBE4', fontSize: '1rem', outline: 'none', background: '#FDFDFD', width: '100%', boxSizing: 'border-box' },
    label: { fontSize: '0.68rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.08em', marginBottom: '8px', display: 'block' },
    modalFooter: { display: 'flex', gap: '12px', marginTop: '40px', justifyContent: 'flex-end' },
    cancelBtn: { padding: '12px 24px', background: '#f5f5f5', border: 'none', borderRadius: '12px', fontWeight: '800', color: '#666', cursor: 'pointer', fontSize: '0.9rem' },
    saveBtn: { padding: '12px 24px', background: '#1A1A1A', border: 'none', borderRadius: '12px', fontWeight: '800', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' },
    warningIcon: { width: '50px', height: '50px', borderRadius: '50%', border: '3px solid #e74c3c', color: '#e74c3c', fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },

    // Schedule / Calendar Styles
    scheduleSection: { marginTop: '80px', background: '#fff', padding: '48px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    scheduleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
    sectionTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px', margin: 0 },
    sectionSubtitle: { fontSize: '1rem', color: '#777', margin: 0 },
    
    calendarRoot: { border: '1px solid #F0EBE4', borderRadius: '32px', overflow: 'hidden', background: '#fff' },
    calHeader: { padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F0F0' },
    calTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    calNav: { display: 'flex', gap: '8px' },
    calNavBtn: { padding: '8px 16px', border: '1px solid #E5E0DA', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#1A1A1A', fontFamily: 'inherit' },
    todayBtn: { padding: '8px 20px', background: '#1A1A1A', color: '#fff', border: 'none' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(140px, auto)' },
    weekDayHead: { padding: '16px', fontSize: '0.75rem', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: '1px solid #F0F0F0', background: '#FAF9F7' },
    dayCell: { borderRight: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0', padding: '12px', minHeight: '140px' },
    dayNum: { textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#666', marginBottom: '8px' },
    todayCircle: { background: '#00B4D8', color: '#fff', padding: '4px 8px', borderRadius: '50%', fontSize: '0.75rem' },
    eventList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    eventTag: { padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.2s', ':hover': { transform: 'translateX(4px)' } },
    eventDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }
};

export default BuyerVisitsPage;
