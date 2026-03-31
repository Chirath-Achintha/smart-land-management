import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const BuyerVisitsPage = () => {
    const [myVisits, setMyVisits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingVisit, setUpdatingVisit] = useState(null);
    const navigate = useNavigate();
    const [cancellingVisit, setCancellingVisit] = useState(null);
    const [editData, setEditData] = useState({ date: '', time: '', message: '' });
    const [availability, setAvailability] = useState([]);
    const [loadingAvail, setLoadingAvail] = useState(false);
    const [updateError, setUpdateError] = useState('');
    const DAYS_FIXED = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date()); // Auto-detect current month/year
    const [highlightedVisitId, setHighlightedVisitId] = useState(null);
    const [cancelReason, setCancelReason] = useState('');

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

    const location = useLocation();

    // Scroll to visit logic
    useEffect(() => {
        if (!loading && myVisits.length > 0) {
            const params = new URLSearchParams(location.search);
            const visitId = params.get('visit_id');
            if (visitId) {
                // Find visit and set filter if needed
                const v = myVisits.find(v => (v._id || v.id) === visitId);
                if (v) {
                    if (v.status === 'Cancelled' || v.status === 'Rejected') {
                        setFilter('Cancelled');
                    } else if (v.status === 'Accepted' || v.status === 'Completed') {
                        setFilter(v.status);
                    } else if (v.status === 'Pending') {
                        setFilter('Pending');
                    }
                    
                    setTimeout(() => {
                        setHighlightedVisitId(visitId);
                        const el = document.getElementById(`visit-card-${visitId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        setTimeout(() => { setHighlightedVisitId(null); }, 3000);
                    }, 100);
                }
            }
        }
    }, [location.search, loading, myVisits]);

    // Filter by visit type separately
    const [visitTypeFilter, setVisitTypeFilter] = useState('All');

    // Filter by status for quick overview (tabs)
    const [filter, setFilter] = useState('All');

    // First filter by type
    const typedVisits = visitTypeFilter === 'All'
        ? myVisits
        : myVisits.filter(v => v.visit_type === visitTypeFilter);

    // Then filter by status
    const filtered = filter === 'All' 
        ? typedVisits 
        : filter === 'Accepted'
            ? typedVisits.filter(v => ['Accepted', 'SellerAccepted', 'Assigned'].includes(v.status))
        : filter === 'Pending'
            ? typedVisits.filter(v => v.status === 'Pending' || v.status === 'AgentDeclined')
            : typedVisits.filter(v => v.status === filter);

    const STATUS_COLORS = {
        Pending: { bg: '#fff8e1', color: '#e65100', border: '#ffe082' },
        SellerAccepted: { bg: '#e1f5fe', color: '#0288d1', border: '#b3e5fc' },
        Assigned: { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
        AgentDeclined: { bg: '#fff3e0', color: '#f57c00', border: '#ffe0b2' },
        Accepted: { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
        Rejected: { bg: '#fdecea', color: '#c62828', border: '#ef9a9a' },
        Cancelled: { bg: '#eeeeee', color: '#757575', border: '#e0e0e0' },
    };

    const handleCancelSubmit = async () => {
        if (!cancellingVisit) return;
        const vId = cancellingVisit._id || cancellingVisit.id;
        if (!vId || vId === 'undefined') {
            toast.error('Error: Visit ID is missing');
            return;
        }

        try {
            const tok = localStorage.getItem('access_token');
            const res = await fetch(`${API}/visits/${vId}/cancel`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${tok}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason: cancelReason })
            });

            if (res.ok) {
                setMyVisits(prev => prev.map(v => (v._id || v.id) === vId ? { ...v, status: 'Cancelled' } : v));
                toast.success('Your visit trip has been cancelled.');
                setCancellingVisit(null);
                setCancelReason('');
            } else {
                const err = await res.json();
                toast.error(err.detail || 'Failed to cancel');
            }
        } catch (err) {
            toast.error('Error cancelling');
        }
    };

    const handleUpdate = async (visit) => {
        setUpdatingVisit(visit);
        setEditData({
            date: visit.visit_date,
            time: visit.visit_time,
            message: visit.message || ''
        });
        setUpdateError('');
        
        // Fetch Availability for this land
        setLoadingAvail(true);
        try {
            const res = await fetch(`${API}/availability/land/${visit.land_id}`);
            const data = await res.json();
            setAvailability(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch availability", err);
        } finally {
            setLoadingAvail(false);
        }
    };

    // Live Validation for Update Modal
    useEffect(() => {
        if (!updatingVisit || !editData.date || availability.length === 0) {
            setUpdateError('');
            return;
        }

        const selectedDateObj = new Date(editData.date);
        const dayIdx = selectedDateObj.getDay();
        const dayName = DAYS_FIXED[dayIdx === 0 ? 6 : dayIdx - 1];
        
        const daySlot = availability.find(a => a.day === dayName);
        if (!daySlot) {
            setUpdateError(`Owner is not available on ${dayName}s.`);
            return;
        }

        if (editData.time) {
            const [startStr, endStr] = daySlot.time_slot.split(' – ');
            const parseDisplayStr = (str) => {
                const [timePart, ampm] = str.split(' ');
                let [h, m] = timePart.split(':').map(Number);
                if (ampm === 'PM' && h !== 12) h += 12;
                if (ampm === 'AM' && h === 12) h = 0;
                return h * 60 + m;
            };
            const startMins = parseDisplayStr(startStr);
            const endMins = parseDisplayStr(endStr);
            const [h, m] = editData.time.split(':').map(Number);
            const selectedMins = h * 60 + m;

            if (selectedMins < startMins || selectedMins > endMins) {
                setUpdateError(`Window for ${dayName} is ${daySlot.time_slot}.`);
                return;
            }
        }
        setUpdateError('');
    }, [editData.date, editData.time, availability, updatingVisit]);

    const handleUpdateSubmit = async () => {
        if (!updatingVisit || updateError) return;
        const vId = updatingVisit._id || updatingVisit.id;
        if (!vId || vId === 'undefined') {
            toast.error('Error: Visit ID is missing');
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
                toast.success('Schedule updated successfully!');
            } else {
                const err = await res.json();
                const errorMsg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                toast.error(errorMsg || 'Failed to update schedule');
            }
        } catch (err) {
            console.error('Update update error:', err);
            toast.error('Error updating schedule.');
        }
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date());

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

        const calendarVisits = myVisits.filter(v => ['Accepted', 'Completed'].includes(v.status));

        return (
            <div style={S.calendarRoot}>
                <div style={S.calHeader}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <h2 style={S.calTitle}>{monthNames[month]} {year}</h2>
                        <div style={S.calLegend}>
                            <div style={S.legendItem}>
                                <div style={{ ...S.legendDot, background: '#1565C0' }}></div>
                                <span>Self Visit</span>
                            </div>
                            <div style={S.legendItem}>
                                <div style={{ ...S.legendDot, background: '#7B1FA2' }}></div>
                                <span>Agent Visit</span>
                            </div>
                        </div>
                    </div>
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
                        const todayStr = new Date().toISOString().split('T')[0];
                        const isToday = d.dateStr === todayStr;
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
                                                background: v.visit_type === 'self_visit' ? '#E3F1FF' : '#F5E6FF',
                                                color: v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2',
                                                borderLeft: `5px solid ${v.visit_type === 'self_visit' ? '#1565C0' : '#7B1FA2'}`
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
                {['All', 'Pending', 'Accepted', 'Rejected', 'Cancelled'].map(f => (
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
                                {f === 'Accepted'
                                    ? typedVisits.filter(v => ['Accepted', 'SellerAccepted', 'Assigned'].includes(v.status)).length
                                : f === 'Pending'
                                    ? typedVisits.filter(v => v.status === 'Pending' || v.status === 'AgentDeclined').length
                                    : typedVisits.filter(v => v.status === f).length
                                }
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
                                    {visit.status === 'Cancelled' ? (
                                        visit.cancel_reason && (
                                            <div style={{ ...S.messageBox, background: '#fdecea', border: '1px solid #ef9a9a' }}>
                                                <span style={{ ...S.messageTitle, color: '#c62828' }}>
                                                    {visit.cancelled_by === 'buyer' ? 'My Cancellation Reason' : 
                                                     visit.cancelled_by === 'seller' ? "Owner's Cancellation Reason" : 
                                                     'Cancellation Reason'}
                                                </span>
                                                <p style={{ ...S.messageContent, color: '#c62828' }}>{visit.cancel_reason}</p>
                                            </div>
                                        )
                                    ) : (
                                        <>
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
                                        </>
                                    )}

                                    {/* Agent Details */}
                                    {['Accepted', 'Completed'].includes(visit.status) && visit.agent_name && (
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
                                        <button style={S.viewBtn} onClick={() => navigate(`/lands/${visit.land_id}`)}>View Land</button>
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
                            {loadingAvail && <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>Loading owner availability...</div>}
                            {updateError && (
                                <div style={{ 
                                    background: '#fdecea', 
                                    color: '#d32f2f', 
                                    padding: '12px', 
                                    borderRadius: '12px', 
                                    fontSize: '0.85rem',
                                    border: '1px solid #ef9a9a' 
                                }}>
                                    {updateError}
                                </div>
                            )}

                            <div style={S.inputRow}>
                                <label style={S.label}>New Date</label>
                                <input 
                                    type="date" 
                                    style={S.input} 
                                    min={new Date().toISOString().split('T')[0]}
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
                            {availability.length > 0 && (
                                <div style={{ 
                                    background: '#F9F7F5', 
                                    padding: '12px', 
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    color: '#666'
                                }}>
                                    <strong style={{ display: 'block', marginBottom: '4px', color: '#1A1A1A' }}>Owner Availability:</strong>
                                    {availability.map((a, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{a.day}:</span>
                                            <span style={{ fontWeight: '700' }}>{a.time_slot}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div style={S.modalFooter}>
                            <button style={S.cancelBtn} onClick={() => setUpdatingVisit(null)}>Close</button>
                            <button 
                                style={{ ...S.saveBtn, opacity: updateError ? 0.5 : 1 }} 
                                onClick={handleUpdateSubmit}
                                disabled={!!updateError}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Modal */}
            {cancellingVisit && (
                <div style={S.modalOverlay}>
                    <div style={S.modalContent}>
                        <h2 style={S.modalTitle}>Cancel Trip</h2>
                        <p style={S.modalSub}>Please provide a reason for cancelling your visit request.</p>
                        
                        <div style={S.modalInfoBox}>
                            <div style={S.modalInfoMain}>Property: {cancellingVisit.land_name}</div>
                            <div style={S.modalInfoSub}>Scheduled for: {cancellingVisit.visit_date} at {cancellingVisit.visit_time}</div>
                        </div>

                        <textarea
                            style={{ ...S.input, minHeight: '120px', marginTop: '20px' }}
                            placeholder="e.g. Schedule conflict, sorry..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />

                        <div style={{ ...S.modalFooter, justifyContent: 'center', marginTop: '32px' }}>
                            <button style={S.cancelBtn} onClick={() => { setCancellingVisit(null); setCancelReason(''); }}>Back</button>
                            <button style={{ ...S.saveBtn, backgroundColor: '#1A1A1A' }} onClick={handleCancelSubmit}>Confirm Cancel</button>
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
    root: { background: 'var(--color-bg)', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' },
    title: { fontSize: '2.2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '6px', letterSpacing: '-0.02em' },
    subtitle: { color: 'var(--color-text-soft)', fontSize: '1rem', fontWeight: '500' },
    countBadge: { background: 'var(--color-primary)', color: '#fff', borderRadius: '30px', padding: '8px 18px', fontWeight: '700', fontSize: '0.85rem' },
    typeToggleRow: { display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--color-bg)', padding: '6px', borderRadius: '40px', width: 'fit-content', border: '1px solid var(--color-border)' },
    typeTab: { padding: '10px 20px', borderRadius: '30px', border: 'none', fontWeight: '800', fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease-in-out' },
    filterRow: { display: 'flex', gap: '12px', marginBottom: '40px', flexWrap: 'wrap' },
    filterBtn: { padding: '8px 20px', borderRadius: '30px', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' },
    filterCount: { borderRadius: '10px', padding: '2px 8px', fontSize: '0.75rem', border: '1px solid var(--color-border)' },
    empty: { textAlign: 'center', color: '#aaa', padding: '100px 20px', fontSize: '1.1rem', fontWeight: '500' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' },

    card: { background: '#fff', borderRadius: '24px', padding: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' },
    landName: { fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '2px' },
    typeTag: { fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    statusBadge: { padding: '4px 12px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '900', letterSpacing: '0.08em' },

    details: { display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' },
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    detailLabel: { fontSize: '0.68rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.08em' },
    detailVal: { fontSize: '0.92rem', fontWeight: '700', color: 'var(--color-dark)' },

    messageBox: { background: 'var(--color-bg)', borderRadius: '16px', padding: '16px', marginTop: '8px' },
    messageTitle: { fontSize: '0.65rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em', display: 'block' },
    messageContent: { fontSize: '0.88rem', color: '#444', lineHeight: '1.5', fontWeight: '500', margin: 0 },

    footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '16px' },
    receivedDate: { fontSize: '0.72rem', color: '#BBB', fontWeight: '600' },
    viewBtn: { background: 'none', border: '1.5px solid var(--color-dark)', borderRadius: '10px', padding: '8px 16px', fontWeight: '700', fontSize: '0.85rem', color: 'var(--color-dark)', cursor: 'pointer', transition: 'all 0.2s ease-in-out' },
    
    // Modal Styles
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: '#fff', borderRadius: '32px', padding: '40px', width: '100%', maxWidth: '500px', boxShadow: 'var(--shadow-elevated)', display: 'flex', flexDirection: 'column', gap: '20px' },
    modalTitle: { fontSize: '2rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    modalSub: { color: 'var(--color-text-soft)', fontSize: '1rem', lineHeight: '1.5', margin: 0 },
    modalInfoBox: { padding: '24px', background: 'var(--color-bg)', borderRadius: '16px', border: '1px solid var(--color-border)' },
    modalInfoMain: { fontSize: '1rem', fontWeight: '700', color: 'var(--color-dark)', marginBottom: '4px' },
    modalInfoSub: { fontSize: '0.88rem', color: 'var(--color-text-soft)', fontWeight: '500' },
    input: { padding: '20px', borderRadius: '16px', border: '1.5px solid var(--color-border)', fontSize: '1rem', outline: 'none', background: '#fff', width: '100%', boxSizing: 'border-box' },
    label: { fontSize: '0.68rem', fontWeight: '800', color: '#AAA', letterSpacing: '0.08em', marginBottom: '8px', display: 'block' },
    modalFooter: { display: 'flex', gap: '14px', marginTop: '10px' },
    cancelBtn: { flex: 1, padding: '16px', background: 'var(--color-bg)', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '1rem', color: '#666', cursor: 'pointer' },
    saveBtn: { flex: 1, padding: '16px', background: 'var(--color-primary)', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '1rem', color: '#fff', cursor: 'pointer' },
    warningIcon: { width: '50px', height: '50px', borderRadius: '50%', border: '3px solid #e74c3c', color: '#e74c3c', fontSize: '1.5rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },

    // Schedule / Calendar Styles
    scheduleSection: { marginTop: '80px', background: '#fff', padding: '48px', borderRadius: '32px', boxShadow: 'var(--shadow-soft)', border: '1px solid var(--color-border)' },
    scheduleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
    sectionTitle: { fontSize: '1.8rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '8px', margin: 0 },
    sectionSubtitle: { fontSize: '1rem', color: 'var(--color-text-soft)', margin: 0 },
    
    calendarRoot: { border: '1px solid var(--color-border)', borderRadius: '32px', overflow: 'hidden', background: '#fff' },
    calHeader: { padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' },
    calTitle: { fontSize: '1.4rem', fontWeight: '800', color: 'var(--color-dark)', margin: 0 },
    calLegend: { display: 'flex', gap: '16px', marginTop: '6px' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', fontWeight: '800', color: 'var(--color-text-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' },
    legendDot: { width: '8px', height: '8px', borderRadius: '50%' },
    calNav: { display: 'flex', gap: '8px' },
    calNavBtn: { padding: '8px 16px', border: '1px solid var(--color-border)', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: 'var(--color-dark)', fontFamily: 'inherit' },
    todayBtn: { padding: '8px 20px', background: 'var(--color-primary)', color: '#fff', border: 'none' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(140px, auto)' },
    weekDayHead: { padding: '16px', fontSize: '0.75rem', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' },
    dayCell: { borderRight: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '12px', minHeight: '140px' },
    dayNum: { textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#666', marginBottom: '8px' },
    todayCircle: { background: 'var(--color-primary)', color: '#fff', padding: '4px 8px', borderRadius: '50%', fontSize: '0.75rem' },
    eventList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    eventTag: { padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.2s' },
    eventDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }
};

export default BuyerVisitsPage;
