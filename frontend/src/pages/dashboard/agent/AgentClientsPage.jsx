import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_BASE_URL from '../../../apiConfig';


const AgentClientsPage = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [allVisits, setAllVisits] = useState([]); // Raw visit data
    const [editingNotes, setEditingNotes] = useState(null); // ID of buyer
    const [tempNotes, setTempNotes] = useState('');

    const [loading, setLoading] = useState(false);
    const [viewMode, setViewMode] = useState('calendar');
    const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 21)); // Mar 21, 2026
    const [highlightedClient, setHighlightedClient] = useState(null);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/visits/my-assignments`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) {
                    setAllVisits(data);
                    // Unique buyers from all assignments (Assigned, Accepted, Completed)
                    const buyersMap = {};
                    data.forEach(v => {
                        const bName = v.buyer_name || 'Buyer';
                        if (!buyersMap[bName]) {
                            buyersMap[bName] = {
                                visitId: v._id || v.id, // Keep the latest visit ID for updating notes
                                name: bName,
                                phone: v.buyer_phone || 'N/A',
                                address: v.land_address || 'Address not listed',
                                lastInterest: v.land_name || 'Property',
                                seller_name: v.seller_name || 'Not Available',
                                seller_phone: v.seller_phone || 'N/A',
                                time: v.visit_time || 'TBD',
                                notes: v.internal_notes || '' 
                            };
                        }
                    });
                    setClients(Object.values(buyersMap));
                }
            } catch (err) { console.error('Clients fetch error:', err); }
            setLoading(false);
        };
        fetchClients();
    }, []);

    const handleSaveNotes = async (client) => {
        try {
            const res = await fetch(`${API_BASE_URL}/visits/${client.visitId}/status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}` 
                },
                body: JSON.stringify({ 
                    status: 'Accepted', // Keep current status
                    internal_notes: tempNotes 
                })
            });
            if (res.ok) {
                setClients(prev => prev.map(c => c.visitId === client.visitId ? { ...c, notes: tempNotes } : c));
                setEditingNotes(null);
            } else {
                alert('Cloud save failed. Please check connection.');
            }
        } catch (err) {
            console.error('Update notes error:', err);
            alert('Failed to save notes to database.');
        }
    };

    const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const goToToday = () => setCurrentDate(new Date(2026, 2, 21));

    // Accepted visits for Agent
    const activeSchedule = allVisits.filter(v => v.status === 'Accepted' || v.status === 'Completed' || v.status === 'SellerAccepted');
    const scheduleByDate = activeSchedule.reduce((acc, v) => {
        const date = v.visit_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(v);
        return acc;
    }, {});
    const sortedDates = Object.keys(scheduleByDate).sort((a, b) => new Date(a) - new Date(b));

    const scrollToClient = (buyerName) => {
        setHighlightedClient(buyerName);
        const element = document.getElementById(`client-${buyerName.replace(/\s+/g, '-').toLowerCase()}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove highlight after a few seconds
            setTimeout(() => setHighlightedClient(null), 3000);
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
                        const isToday = d.dateStr === '2026-03-21';
                        return (
                            <div key={i} style={{ ...S.dayCell, opacity: d.currentMonth ? 1 : 0.4 }}>
                                <div style={S.dayNum}><span style={isToday ? S.todayCircle : {}}>{d.day}</span></div>
                                <div style={S.eventList}>
                                    {dayVisits.map(v => (
                                        <div 
                                            key={v.id || v._id} 
                                            style={{ ...S.eventTag, cursor: 'pointer' }}
                                            onClick={() => scrollToClient(v.buyer_name)}
                                            title="Click to see client details"
                                        >
                                            <span style={S.eventDot}></span>
                                            {v.visit_time} - {v.buyer_name} - {v.land_name}
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
                <h1 style={S.title}>My Clients</h1>
                <p style={S.subtitle}>Directory of buyers you are currently assisting.</p>
            </div>

            <div style={S.clientGrid}>
                {clients.length === 0 ? (
                    <div style={S.emptyBox}>No active clients found in your assignments.</div>
                ) : (
                    clients.map((c, i) => (
                        <div 
                            key={i} 
                            id={`client-${c.name.replace(/\s+/g, '-').toLowerCase()}`}
                            style={{
                                ...S.clientCard,
                                border: highlightedClient === c.name ? '2px solid #3498db' : '1px solid #F0F0F0',
                                boxShadow: highlightedClient === c.name ? '0 12px 32px rgba(52, 152, 219, 0.2)' : '0 4px 20px rgba(0,0,0,0.03)',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                transform: highlightedClient === c.name ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div style={S.cardTop}>
                                <div style={S.avatar}>{c.name.charAt(0)}</div>
                                <div style={S.mainInfo}>
                                    <h3 style={S.clientName}>{c.name} <span style={{fontSize: '0.7rem', fontWeight: 500, color: '#888', marginLeft: '5px'}}>(Buyer)</span></h3>
                                    <span style={S.clientPhone}>TEL: {c.phone}</span>
                                </div>
                            </div>

                            <div style={{...S.infoGrid, borderTop: '1px solid #F0F0F0', paddingTop: '16px'}}>
                                <div style={S.infoItem}>
                                    <span style={S.labelSmall}>Property & Location</span>
                                    <span style={S.propertyValue}>{c.lastInterest}</span>
                                    <span style={S.addressValue}>{c.address}</span>
                                </div>
                                <div style={S.infoItem}>
                                    <span style={S.labelSmall}>Scheduled Visit</span>
                                    <span style={S.timeValue}>TIME: {c.time}</span>
                                </div>
                            </div>

                            <div style={{...S.infoGrid, background: '#f8f9fa', padding: '12px', borderRadius: '12px'}}>
                                <div style={S.infoItem}>
                                    <span style={S.labelSmall}>Property Professional (Seller)</span>
                                    <span style={S.sellerValue}>NAME: {c.seller_name}</span>
                                    <span style={S.sellerPhone}>TEL: {c.seller_phone}</span>
                                </div>
                            </div>

                            <div style={S.notesSection}>
                                <div style={S.notesHeader}>
                                    <span style={S.labelExtraSmall}>Confidential Agent Notes</span>
                                    {editingNotes !== c.name ? (
                                        <button style={S.editNoteBtn} onClick={() => { setEditingNotes(c.name); setTempNotes(c.notes); }}>Edit Notes</button>
                                    ) : (
                                        <button style={S.saveNoteBtn} onClick={() => handleSaveNotes(c)}>Save to Cloud</button>
                                    )}
                                </div>
                                {editingNotes === c.name ? (
                                    <textarea
                                        style={S.notesInput}
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        autoFocus
                                        placeholder="Enter secure internal observations here..."
                                    />
                                ) : (
                                    <p style={S.notesContent}>{c.notes || 'No confidential notes recorded for this client.'}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <div style={S.scheduleSection}>
                <div style={S.scheduleHeader}>
                    <div>
                        <h2 style={S.sectionTitle}>Confirmed Visit Schedule</h2>
                        <p style={S.sectionSubtitle}>A visual overview of all your upcoming property visits.</p>
                    </div>
                </div>

                {renderCalendar()}
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '36px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },

    clientGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' },
    clientCard: { background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0', display: 'flex', flexDirection: 'column', gap: '20px' },

    cardTop: { display: 'flex', gap: '16px', alignItems: 'center' },
    avatar: { width: '56px', height: '56px', borderRadius: '16px', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: '800' },
    mainInfo: { display: 'flex', flexDirection: 'column', gap: '4px' },
    clientName: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#1A1A1A' },
    clientPhone: { fontSize: '0.9rem', color: '#555', fontWeight: '700' },

    infoGrid: { display: 'flex', flexDirection: 'column', gap: '16px' },
    infoItem: { display: 'flex', flexDirection: 'column', gap: '4px' },
    labelSmall: { fontSize: '0.75rem', fontWeight: '800', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' },
    labelExtraSmall: { fontSize: '0.65rem', fontWeight: '800', color: '#AAA', textTransform: 'uppercase', letterSpacing: '0.05em' },
    
    propertyValue: { fontSize: '1rem', color: '#3498db', fontWeight: '700' },
    addressValue: { fontSize: '0.85rem', color: '#666', fontWeight: '500' },
    timeValue: { fontSize: '1rem', color: '#e67e22', fontWeight: '800' },
    
    sellerValue: { fontSize: '0.9rem', color: '#27ae60', fontWeight: '700' },
    sellerPhone: { fontSize: '0.85rem', color: '#555', fontWeight: '600' },

    notesSection: { background: '#fff', borderRadius: '12px', padding: '12px', border: '1px dashed #DDD' },
    notesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    editNoteBtn: { background: 'none', border: 'none', color: '#3498db', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 },
    saveNoteBtn: { background: '#1A1A1A', border: 'none', color: '#fff', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px' },
    notesContent: { margin: 0, fontSize: '0.8rem', color: '#888', lineHeight: '1.5', fontStyle: 'italic' },
    notesInput: { width: '100%', minHeight: '60px', padding: '8px', border: '1px solid #DDD', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' },

    emptyBox: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#AAA', fontWeight: '600' },

    // Schedule Styling
    scheduleSection: { marginTop: '80px', background: '#fff', padding: '48px', borderRadius: '32px', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    scheduleHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' },
    sectionTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px', margin: 0 },
    sectionSubtitle: { fontSize: '1rem', color: '#777', margin: 0 },
    viewToggle: { display: 'flex', background: '#F0F0F0', padding: '4px', borderRadius: '12px', gap: '4px' },
    toggleBtn: { padding: '8px 16px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '700', cursor: 'pointer', background: 'transparent', color: '#666', transition: 'all 0.2s' },
    toggleBtnActive: { background: '#fff', color: '#1A1A1A', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
    
    // Table Styling
    tableWrapper: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '16px 20px', fontSize: '0.75rem', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #F0F0F0' },
    tr: { borderBottom: '1px solid #F7F7F7', transition: 'background 0.2s' },
    td: { padding: '20px', fontSize: '0.95rem', color: '#333', fontWeight: '600' },

    // Calendar Specific Styles
    calendarRoot: { border: '1px solid #F0EBE4', borderRadius: '32px', overflow: 'hidden', background: '#fff' },
    calHeader: { padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F0F0F0' },
    calTitle: { fontSize: '1.5rem', fontWeight: '800', color: '#1A1A1A', margin: 0 },
    calNav: { display: 'flex', gap: '8px' },
    calNavBtn: { padding: '8px 16px', border: '1px solid #E5E0DA', background: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', color: '#1A1A1A' },
    todayBtn: { padding: '8px 20px', background: '#1A1A1A', color: '#fff', border: 'none' },
    calGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(140px, auto)' },
    weekDayHead: { padding: '16px', fontSize: '0.75rem', fontWeight: '800', color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', borderBottom: '1px solid #F0F0F0', background: '#FAF9F7' },
    dayCell: { borderRight: '1px solid #F0F0F0', borderBottom: '1px solid #F0F0F0', padding: '12px', minHeight: '140px' },
    dayNum: { textAlign: 'right', fontSize: '0.85rem', fontWeight: '800', color: '#666', marginBottom: '8px' },
    todayCircle: { background: '#00B4D8', color: '#fff', padding: '4px 8px', borderRadius: '50%', fontSize: '0.75rem' },
    eventList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    eventTag: { padding: '6px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: '700', background: '#F3E5F5', color: '#7B1FA2', borderLeft: '3px solid #7B1FA2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '6px' },
    eventDot: { width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }
};

export default AgentClientsPage;
