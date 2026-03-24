import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '../../../apiConfig';

const API = API_BASE_URL;

const STATUS_COLORS = {
    Requested: { bg: '#fef3c7', fg: '#92400e' },
    Approved: { bg: '#dbeafe', fg: '#1d4ed8' },
    Scheduled: { bg: '#dbeafe', fg: '#1d4ed8' },
    'In Progress': { bg: '#ffedd5', fg: '#9a3412' },
    Completed: { bg: '#dcfce7', fg: '#166534' },
    Cancelled: { bg: '#fee2e2', fg: '#991b1b' },
};

const ALL_DISTRICTS = [
    'Ampara',
    'Anuradhapura',
    'Badulla',
    'Batticaloa',
    'Colombo',
    'Galle',
    'Gampaha',
    'Hambantota',
    'Jaffna',
    'Kalutara',
    'Kandy',
    'Kegalle',
    'Kilinochchi',
    'Kurunegala',
    'Mannar',
    'Matale',
    'Matara',
    'Monaragala',
    'Mullaitivu',
    'Nuwara Eliya',
    'Polonnaruwa',
    'Puttalam',
    'Ratnapura',
    'Trincomalee',
    'Vavuniya',
];

const titleCaseDistrict = (value) => {
    const input = (value || '').trim();
    if (!input) return '';
    return input
        .toLowerCase()
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
};

const mergeDistricts = (...groups) => {
    const byKey = new Map();

    groups.flat().forEach((item) => {
        const normalized = titleCaseDistrict(item);
        if (!normalized) return;
        const key = normalized.toLowerCase();
        if (!byKey.has(key)) {
            byKey.set(key, normalized);
        }
    });

    return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const normalizeDistrict = (value) => {
    let base = normalizeText(value);
    const aliases = {
        'kaluthara': 'kalutara',
        'moneragala': 'monaragala',
        'anuradapura': 'anuradhapura',
        'rathnapura': 'ratnapura',
        'kurunagala': 'kurunegala',
        'baticaloa': 'batticaloa',
    };
    return aliases[base] || base;
};

const toErrorMessage = (payload, fallback) => {
    if (payload instanceof Error) {
        return payload.message || fallback;
    }

    const detail = payload?.detail ?? payload?.message ?? payload?.error ?? payload;

    if (typeof detail === 'string') return detail;

    if (Array.isArray(detail)) {
        const msg = detail
            .map((item) => {
                if (typeof item === 'string') return item;
                if (item?.msg && Array.isArray(item?.loc)) return `${item.loc.join('.')}: ${item.msg}`;
                if (item?.msg) return item.msg;
                return '';
            })
            .filter(Boolean)
            .join(', ');
        return msg || fallback;
    }

    if (detail && typeof detail === 'object') {
        if (typeof detail.msg === 'string') return detail.msg;
        try {
            return JSON.stringify(detail);
        } catch {
            return fallback;
        }
    }

    return fallback;
};

const normalizeBooking = (booking) => ({
    ...booking,
    id: booking?.id || booking?._id || '',
});

const isRejectedByConstructor = (booking) => booking?.status === 'Cancelled' && Boolean(booking?.constructor_id);

const ServiceManagement = () => {
    const token = localStorage.getItem('access_token');
    const authH = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    const [bookings, setBookings] = useState([]);
    const [constructorsByBooking, setConstructorsByBooking] = useState({});
    const [selectedConstructor, setSelectedConstructor] = useState({});
    const [loading, setLoading] = useState(true);
    const [assigningId, setAssigningId] = useState('');
    const [error, setError] = useState('');
    const [teams, setTeams] = useState([]);
    const [teamLoading, setTeamLoading] = useState(true);

    const fetchBookings = async () => {
        if (!token) {
            setError('Please log in as admin to manage service bookings.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API}/service-bookings/admin`, { headers: authH });
            const data = await res.json();
            if (!res.ok) throw new Error(toErrorMessage(data, 'Failed to fetch bookings'));
            const normalized = (Array.isArray(data) ? data : []).map(normalizeBooking);
            setBookings(normalized);
        } catch (e) {
            setBookings([]);
            setError(toErrorMessage(e, 'Failed to fetch bookings'));
        } finally {
            setLoading(false);
        }
    };

    const fetchConstructorsForBooking = async (booking) => {
        const district = booking.land_district || '';
        try {
            const q = district ? `?district=${encodeURIComponent(district)}` : '';
            const res = await fetch(`${API}/service-bookings/constructors${q}`, { headers: authH });
            const data = await res.json();
            if (!res.ok) throw new Error(toErrorMessage(data, 'Failed to load teams'));
            setConstructorsByBooking((prev) => ({ ...prev, [booking.id]: Array.isArray(data) ? data : [] }));
        } catch {
            setConstructorsByBooking((prev) => ({ ...prev, [booking.id]: [] }));
        }
    };

    const fetchTeams = async () => {
        if (!token) {
            setTeamLoading(false);
            return;
        }

        setTeamLoading(true);
        try {
            const res = await fetch(`${API}/admin/constructor-teams/`, { headers: authH });
            const data = await res.json();
            if (!res.ok) throw new Error(toErrorMessage(data, 'Failed to fetch constructor teams'));
            setTeams(Array.isArray(data) ? data : []);
        } catch {
            setTeams([]);
        } finally {
            setTeamLoading(false);
        }
    };



    // Form removed

    useEffect(() => {
        fetchBookings();
        fetchTeams();
    }, []);



    useEffect(() => {
        bookings.forEach((booking) => {
            if (!constructorsByBooking[booking.id]) {
                fetchConstructorsForBooking(booking);
            }
        });
    }, [bookings]);

    const sortedBookings = useMemo(
        () => [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
        [bookings]
    );

    const teamsByUserId = useMemo(
        () => Object.fromEntries(teams.map((t) => [t.user_id, t])),
        [teams]
    );

    const rejectedCount = useMemo(
        () => bookings.filter((b) => isRejectedByConstructor(b)).length,
        [bookings]
    );

    const handleAssign = async (bookingId) => {
        const constructorId = selectedConstructor[bookingId];
        if (!constructorId) {
            alert('Please choose a constructor team first.');
            return;
        }

        setAssigningId(bookingId);
        try {
            const res = await fetch(`${API}/service-bookings/${bookingId}/assign`, {
                method: 'PATCH',
                headers: authH,
                body: JSON.stringify({ constructor_id: constructorId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(toErrorMessage(data, 'Assignment failed'));

            const normalizedUpdated = normalizeBooking(data);
            setBookings((prev) => prev.map((b) => (b.id === bookingId ? normalizedUpdated : b)));
            setSelectedConstructor((prev) => ({ ...prev, [bookingId]: '' }));
        } catch (e) {
            alert(toErrorMessage(e, 'Assignment failed'));
        } finally {
            setAssigningId('');
        }
    };

    const getRegisteredOptionsForBooking = (booking) => {
        const bookingId = booking.id;
        const raw = constructorsByBooking[bookingId] || [];
        const bookingDistrict = normalizeDistrict(booking?.land_district);
        const bookingServiceType = (booking?.service_type || '').toLowerCase();
        const availabilityByUserId = Object.fromEntries(
            raw.map((opt) => [String(opt.id || opt._id), opt])
        );

        const mapped = teams
            .map((team) => {
                const availability = availabilityByUserId[String(team.user_id)] || {};
                const specialization = team.specialization || 'Both';
                const specializationLower = specialization.toLowerCase();
                const serviceMatch =
                    specializationLower === 'both'
                    || (specializationLower === 'full construction' && bookingServiceType === 'full construction')
                    || (specializationLower === 'land development' && bookingServiceType === 'land development');
                const districtMatchFromAPI = availability.district_match;
                const districtMatchFromTeam = bookingDistrict
                    ? normalizeDistrict(team.district) === bookingDistrict
                    : true;
                const districtMatch = typeof districtMatchFromAPI === 'boolean'
                    ? districtMatchFromAPI
                    : districtMatchFromTeam;

                return {
                    id: team.user_id,
                    team_name: team.team_name,
                    manager_name: team.manager_name,
                    district: team.district,
                    specialization,
                    phone: team.phone,
                    email: team.email,
                    district_match: districtMatch,
                    service_match: serviceMatch,
                    is_available: availability.is_available ?? true,
                    active_assignments: availability.active_assignments ?? 0,
                };
            });

        const districtMatched = mapped.filter((team) => team.district_match);
        const filtered = bookingDistrict ? districtMatched : mapped;

        return filtered.sort((a, b) => {
            const aKey = `${a.service_match ? 0 : 1}-${a.is_available ? 0 : 1}-${a.team_name}`;
            const bKey = `${b.service_match ? 0 : 1}-${b.is_available ? 0 : 1}-${b.team_name}`;
            return aKey.localeCompare(bKey);
        });
    };

    // Modal removed

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Construction Service Assignments</h2>
                <p style={styles.subtitle}>
                    Assign constructor teams by district and availability. Once assigned, buyers and constructor teams will see the same booking details.
                </p>
            </header>

    {/* Card removed */}

            <div style={styles.card}>
                <div style={styles.toolbar}>
                    {rejectedCount > 0 && (
                        <div style={styles.attentionBadge}>
                            {rejectedCount} constructor-rejected request{rejectedCount > 1 ? 's' : ''} need reassignment
                        </div>
                    )}
                    <button style={styles.refreshBtn} onClick={() => { fetchBookings(); fetchTeams(); }}>Refresh</button>
                </div>

                {loading ? (
                    <div style={styles.empty}>Loading bookings...</div>
                ) : error ? (
                    <div style={styles.error}>{error}</div>
                ) : sortedBookings.length === 0 ? (
                    <div style={styles.empty}>No service bookings available.</div>
                ) : (
                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Request</th>
                                    <th style={styles.th}>Project Location</th>
                                    <th style={styles.th}>Assign Constructor Team</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBookings.map((booking) => {
                                    const options = getRegisteredOptionsForBooking(booking);
                                    const selectedId = selectedConstructor[booking.id] || '';
                                    const palette = STATUS_COLORS[booking.status] || STATUS_COLORS.Requested;
                                    const rejectedByConstructor = isRejectedByConstructor(booking);
                                    const alreadyAssigned = Boolean(booking.constructor_id) && !rejectedByConstructor;

                                    return (
                                        <tr key={booking.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                <div style={{ fontWeight: 700 }}>{booking.service_type}</div>
                                                <div style={styles.metaText}>{booking.buyer_name || `Buyer #${booking.buyer_id}`}</div>
                                                <div style={styles.metaText}>{booking.land_name || 'No linked land'}</div>
                                                <div style={styles.metaText}>#{booking.id}</div>
                                            </td>
                                            <td style={styles.td}>
                                                <div>{booking.land_district || 'District unavailable'}</div>
                                                <div style={styles.metaText}>{booking.preferred_date} at {booking.preferred_time}</div>
                                            </td>
                                            <td style={styles.td}>
                                                {alreadyAssigned ? (
                                                    <div>
                                                        <div style={styles.assignedName}>{booking.constructor_name || 'Assigned Team'}</div>
                                                        <div style={styles.metaText}>{booking.constructor_email || '-'}</div>
                                                        <div style={styles.metaText}>{booking.constructor_phone || '-'}</div>
                                                    </div>
                                                ) : (
                                                    <select
                                                        style={styles.select}
                                                        value={selectedId}
                                                        onChange={(e) => setSelectedConstructor((prev) => ({ ...prev, [booking.id]: e.target.value }))}
                                                    >
                                                        <option value="">{rejectedByConstructor ? 'Select a new team for reassignment' : 'Select a registered team'}</option>
                                                        {options.map((team) => (
                                                            <option key={team.id} value={team.id}>
                                                                    {(team.team_name || team.full_name)} | {team.specialization || 'Both'} | {team.district || 'district n/a'} | {team.service_match ? 'service-match' : 'service-mismatch'} | {team.district_match ? 'district-match' : 'other district'} | {team.is_available ? 'free' : `busy (${team.active_assignments})`}
                                                            </option>
                                                        ))}
                                                    </select>
                                                )}
                                                {rejectedByConstructor && (
                                                    <div style={styles.rejectedText}>Rejected by constructor team. Please reassign this request.</div>
                                                )}
                                                {!alreadyAssigned && options.length === 0 && (
                                                    <div style={styles.warnText}>No registered constructor teams available for this request.</div>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.status, backgroundColor: palette.bg, color: palette.fg }}>
                                                    {booking.status}
                                                </span>
                                                {rejectedByConstructor && (
                                                    <div style={styles.statusMention}>Mention: Rejected by assigned constructor</div>
                                                )}
                                            </td>
                                            <td style={styles.td}>
                                                {alreadyAssigned ? (
                                                    <span style={styles.doneTag}>Assigned</span>
                                                ) : (
                                                    <button
                                                        style={styles.assignBtn}
                                                        disabled={assigningId === booking.id || !selectedId}
                                                        onClick={() => handleAssign(booking.id)}
                                                    >
                                                        {assigningId === booking.id ? 'Assigning...' : rejectedByConstructor ? 'Reassign' : 'Assign'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        {/* Modal removed */}
        </div>
    );
};

const styles = {
    container: { padding: '32px', background: 'var(--color-bg)', minHeight: '100%' },
    header: { marginBottom: '20px' },
    title: { margin: 0, fontSize: '1.7rem', color: 'var(--color-dark)' },
    subtitle: { marginTop: '8px', color: 'var(--color-text-soft)', maxWidth: '760px' },
    card: { background: '#fff', borderRadius: '14px', border: '1px solid var(--color-border)', padding: '20px', marginBottom: '20px', boxShadow: 'var(--shadow-soft)' },
    sectionTitle: { margin: '0 0 14px', fontSize: '1.1rem', color: 'var(--color-dark)' },
    formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' },
    input: { border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.9rem' },
    primaryBtn: { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', padding: '10px 14px', cursor: 'pointer', fontWeight: 700, width: '220px' },
    teamListWrap: { marginTop: '18px', borderTop: '1px solid var(--color-border)', paddingTop: '14px' },
    teamListHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    teamListHead: { fontSize: '0.85rem', color: '#555', fontWeight: 700, marginBottom: '10px' },
    teamRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--color-border)' },
    viewBtn: { border: '1px solid var(--color-border)', background: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 },
    toolbar: { display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' },
    attentionBadge: { marginRight: 'auto', background: '#fff7ed', color: '#9a3412', border: '1px solid #fdba74', padding: '8px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 700 },
    refreshBtn: { border: '1px solid var(--color-border)', background: '#fff', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 600 },
    tableWrap: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { borderBottom: '1px solid var(--color-border)' },
    th: { textAlign: 'left', color: '#7a7a7a', fontSize: '0.76rem', textTransform: 'uppercase', padding: '12px' },
    tr: { borderBottom: '1px solid var(--color-border)' },
    td: { padding: '14px 12px', verticalAlign: 'top', fontSize: '0.9rem', color: '#1d1d1d' },
    metaText: { fontSize: '0.78rem', color: '#777', marginTop: '4px' },
    assignedName: { fontWeight: 700, color: 'var(--color-dark)' },
    select: { width: '100%', minWidth: '280px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '8px 10px' },
    status: { borderRadius: '999px', padding: '6px 12px', fontSize: '0.76rem', fontWeight: 700, display: 'inline-block' },
    assignBtn: { border: 'none', background: 'var(--color-primary)', color: '#fff', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontWeight: 700 },
    warnText: { fontSize: '0.76rem', color: '#b45309', marginTop: '6px' },
    rejectedText: { fontSize: '0.76rem', color: '#991b1b', marginTop: '6px', fontWeight: 700 },
    statusMention: { fontSize: '0.72rem', color: '#991b1b', marginTop: '6px', fontWeight: 700 },
    doneTag: { fontSize: '0.78rem', color: '#166534', fontWeight: 700 },
    empty: { textAlign: 'center', color: '#8a8a8a', padding: '42px' },
    error: { border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b', padding: '12px 14px', borderRadius: '10px' },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 },
    modal: { width: 'min(980px, 92vw)', maxHeight: '82vh', overflow: 'auto', background: '#fff', borderRadius: '14px', padding: '18px', border: '1px solid var(--color-border)' },
    modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    modalTitle: { margin: 0, fontSize: '1rem', color: 'var(--color-dark)' },
    closeBtn: { border: '1px solid var(--color-border)', background: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontWeight: 700 },
    modalTableWrap: { overflowX: 'auto' },
};

export default ServiceManagement;
