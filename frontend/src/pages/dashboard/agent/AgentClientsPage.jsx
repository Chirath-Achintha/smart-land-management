import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import API_BASE_URL from '../../../apiConfig';


const AgentClientsPage = () => {
    const { user } = useAuth();
    const [clients, setClients] = useState([]);
    const [editingNotes, setEditingNotes] = useState(null); // ID of buyer
    const [tempNotes, setTempNotes] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClients = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE_URL}/visits/my-assignments`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                });
                const data = await res.json();
                if (res.ok && Array.isArray(data)) {
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

    emptyBox: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#AAA', fontWeight: '600' }
};

export default AgentClientsPage;
