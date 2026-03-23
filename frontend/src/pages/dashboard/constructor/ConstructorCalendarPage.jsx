import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import API_BASE_URL from '../../../apiConfig';
import toast from 'react-hot-toast';

const API = API_BASE_URL;

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EVENT_COLORS = {
    Pending: '#F59E0B',
    'Quote Submitted': '#3B82F6',
    Accepted: '#10B981',
    Completed: '#6B7280',
    Cancelled: '#EF4444'
};

const ConstructorCalendarPage = () => {
    const token = localStorage.getItem('access_token');
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = async () => {
        try {
            const res = await fetch(`${API}/service-bookings/assigned`, { headers: authH });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to load calendar');
            
            const mapped = (Array.isArray(data) ? data : []).map(b => {
                // Try to parse preferred_date (YYYY-MM-DD or similar)
                // If it fails, fallback to created_at
                let start = new Date(b.preferred_date);
                if (isNaN(start.getTime())) start = new Date(b.created_at);
                
                // Set time if available (preferred_time HH:mm)
                if (b.preferred_time) {
                    const [h, m] = b.preferred_time.split(':');
                    start.setHours(parseInt(h), parseInt(m));
                }

                const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2 hour duration default

                return {
                    id: b.id,
                    title: `${b.status}: ${b.service_type} (${b.land_name || 'No Land'})`,
                    start,
                    end,
                    resource: b
                };
            });
            setEvents(mapped);
        } catch (e) {
            toast.error(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEvents(); }, []);

    const eventStyleGetter = (event) => {
        const backgroundColor = EVENT_COLORS[event.resource.status] || '#3174ad';
        return {
            style: {
                backgroundColor,
                borderRadius: '8px',
                opacity: 0.8,
                color: 'white',
                border: 'none',
                display: 'block',
                fontSize: '0.85rem',
                fontWeight: '600',
                padding: '2px 8px'
            }
        };
    };

    return (
        <div style={S.root}>
            <div style={S.header}>
                <h1 style={S.title}>Constructor Schedule</h1>
                <p style={S.subtitle}>Visualize your upcoming site visits, projects, and pending requests.</p>
            </div>

            <div style={S.calendarContainer}>
                {loading ? (
                    <div style={S.loading}>Loading schedule...</div>
                ) : (
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: 'calc(100vh - 250px)' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={(e) => toast(`Project: ${e.resource.service_type}\nStatus: ${e.resource.status}`, { icon: '📅' })}
                        views={['month', 'week', 'day']}
                    />
                )}
            </div>

            <div style={S.legend}>
                {Object.entries(EVENT_COLORS).map(([status, color]) => (
                    <div key={status} style={S.legendItem}>
                        <div style={{ ...S.dot, backgroundColor: color }} />
                        <span>{status}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const S = {
    root: { background: '#FAF6F1', minHeight: '100%', padding: '40px', fontFamily: "'DM Sans', sans-serif" },
    header: { marginBottom: '32px' },
    title: { fontSize: '2rem', fontWeight: '800', color: '#1A1A1A', marginBottom: '8px' },
    subtitle: { color: '#777', fontSize: '1rem' },
    calendarContainer: { background: '#fff', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #F0F0F0' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999' },
    legend: { display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap', background: '#fff', padding: '16px 24px', borderRadius: '16px', border: '1px solid #F0F0F0' },
    legendItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: '700', color: '#4B5563' },
    dot: { width: '12px', height: '12px', borderRadius: '50%' }
};

export default ConstructorCalendarPage;
