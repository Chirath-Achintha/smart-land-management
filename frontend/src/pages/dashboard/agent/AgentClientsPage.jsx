import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

const AGENT_ID = 'agent_001';

const AgentClientsPage = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [editingNotes, setEditingNotes] = useState(null); // ID of buyer
    const [tempNotes, setTempNotes] = useState('');

    useEffect(() => {
        // Derive clients from bookings
        const rawBookings = localStorage.getItem(`agent_bookings_${AGENT_ID}`);
        const bookings = rawBookings ? JSON.parse(rawBookings) : [];

        // Get unique buyers
        const buyersMap = {};
        bookings.forEach(b => {
            if (!buyersMap[b.buyer]) {
                buyersMap[b.buyer] = {
                    name: b.buyer,
                    email: `${b.buyer.toLowerCase().replace(' ', '.')}@example.com`,
                    phone: '+94 77 ' + Math.floor(1000000 + Math.random() * 9000000),
                    lastInterest: b.land,
                    notes: localStorage.getItem(`client_notes_${b.buyer}`) || ''
                };
            }
        });

        setClients(Object.values(buyersMap));
    }, []);

    const handleSaveNotes = (buyerName) => {
        localStorage.setItem(`client_notes_${buyerName}`, tempNotes);
        setClients(prev => prev.map(c => c.name === buyerName ? { ...c, notes: tempNotes } : c));
        setEditingNotes(null);
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
                        <div key={i} style={S.clientCard}>
                            <div style={S.cardTop}>
                                <div style={S.avatar}>{c.name.charAt(0)}</div>
                                <div style={S.mainInfo}>
                                    <h3 style={S.clientName}>{c.name}</h3>
                                    <span style={S.clientEmail}>{c.email}</span>
                                    <span style={S.clientPhone}>{c.phone}</span>
                                </div>
                            </div>


                            <div style={S.interestBox}>
                                <span style={S.labelSmall}>Recent Interest</span>
                                <span style={S.interestValue}>{c.lastInterest}</span>
                            </div>

                            <div style={S.notesSection}>
                                <div style={S.notesHeader}>
                                    <span style={S.labelSmall}>Internal Agent Notes</span>
                                    {editingNotes !== c.name ? (
                                        <button style={S.editNoteBtn} onClick={() => { setEditingNotes(c.name); setTempNotes(c.notes); }}>Edit</button>
                                    ) : (
                                        <button style={S.saveNoteBtn} onClick={() => handleSaveNotes(c.name)}>Save</button>
                                    )}
                                </div>
                                {editingNotes === c.name ? (
                                    <textarea
                                        style={S.notesInput}
                                        value={tempNotes}
                                        onChange={(e) => setTempNotes(e.target.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <p style={S.notesContent}>{c.notes || 'No notes added yet...'}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
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
    avatar: { width: '48px', height: '48px', borderRadius: '12px', background: '#1A1A1A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '800' },
    mainInfo: { display: 'flex', flexDirection: 'column' },
    clientName: { margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A' },
    clientEmail: { fontSize: '0.85rem', color: '#888' },
    clientPhone: { fontSize: '0.85rem', color: '#AAA', fontWeight: '600' },


    interestBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
    labelSmall: { fontSize: '0.75rem', fontWeight: '800', color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.05em' },
    interestValue: { fontSize: '0.9rem', color: '#3498db', fontWeight: '700' },

    notesSection: { background: '#F9F9F9', borderRadius: '12px', padding: '16px' },
    notesHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    editNoteBtn: { background: 'none', border: 'none', color: '#3498db', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer', padding: 0 },
    saveNoteBtn: { background: '#1A1A1A', border: 'none', color: '#fff', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', padding: '4px 10px', borderRadius: '6px' },
    notesContent: { margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.5', fontStyle: 'italic' },
    notesInput: { width: '100%', minHeight: '60px', padding: '8px', border: '1px solid #DDD', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'inherit', resize: 'vertical' },

    emptyBox: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#AAA', fontWeight: '600' }
};

export default AgentClientsPage;
