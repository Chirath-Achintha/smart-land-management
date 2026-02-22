import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LANDS } from './landsData';
import { PinIcon } from '../landing/LandingIcons';

const BiddingPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const land = LANDS.find(l => l.id === parseInt(id));

    const [timeLeft, setTimeLeft] = useState('');
    const [bids, setBids] = useState([]);
    const [myBid, setMyBid] = useState('');
    const [editingBidId, setEditingBidId] = useState(null);
    const [isAuctionEnded, setIsAuctionEnded] = useState(false);

    // Load bids from localStorage or use defaults
    useEffect(() => {
        const savedBids = localStorage.getItem(`bids_land_${id}`);
        if (savedBids) {
            setBids(JSON.parse(savedBids));
        } else {
            // Sample initial bids
            const initialBids = [
                { id: Date.now() - 5000, name: "Saman Kumara", amount: land.baseBid + 50000, time: "10 mins ago" },
                { id: Date.now() - 10000, name: "Anura Perera", amount: land.baseBid + 20000, time: "1 hour ago" }
            ];
            setBids(initialBids);
            localStorage.setItem(`bids_land_${id}`, JSON.stringify(initialBids));
        }
    }, [id]);

    // Timer Logic
    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const end = new Date(land.auctionEnd).getTime();
            const distance = end - now;

            if (distance < 0) {
                clearInterval(timer);
                setTimeLeft("AUCTION ENDED");
                setIsAuctionEnded(true);
            } else {
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [land.auctionEnd]);

    const handlePlaceBid = (e) => {
        e.preventDefault();
        if (isAuctionEnded) return alert("Auction has ended!");

        const amount = parseFloat(myBid);
        const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : land.baseBid;

        if (amount <= highestBid) {
            return alert(`Your bid must be higher than the current highest bid: Rs. ${highestBid.toLocaleString()}`);
        }

        const newBid = {
            id: Date.now(),
            name: "Me (You)",
            amount: amount,
            time: "Just now",
            isUser: true
        };

        const updatedBids = [newBid, ...bids];
        setBids(updatedBids);
        localStorage.setItem(`bids_land_${id}`, JSON.stringify(updatedBids));
        setMyBid('');
    };

    const handleEditBid = (bidId, amount) => {
        setEditingBidId(bidId);
        setMyBid(amount.toString());
    };

    const handleUpdateBid = (e) => {
        e.preventDefault();
        const amount = parseFloat(myBid);
        // Basic validation: must be higher than other bids except this one
        const otherBids = bids.filter(b => b.id !== editingBidId);
        const highestOther = otherBids.length > 0 ? Math.max(...otherBids.map(b => b.amount)) : land.baseBid;

        if (amount <= highestOther) {
            return alert(`Updated bid must be higher than current highest bid: Rs. ${highestOther.toLocaleString()}`);
        }

        const updatedBids = bids.map(b =>
            b.id === editingBidId ? { ...b, amount: amount, time: "Updated just now" } : b
        );
        setBids(updatedBids);
        localStorage.setItem(`bids_land_${id}`, JSON.stringify(updatedBids));
        setMyBid('');
        setEditingBidId(null);
    };

    const handleRemoveBid = (bidId) => {
        if (window.confirm("Are you sure you want to remove your bid?")) {
            const updatedBids = bids.filter(b => b.id !== bidId);
            setBids(updatedBids);
            localStorage.setItem(`bids_land_${id}`, JSON.stringify(updatedBids));
        }
    };

    const highestBid = bids.length > 0 ? Math.max(...bids.map(b => b.amount)) : land.baseBid;

    return (
        <div className="lands-root" style={{ background: '#FAF6F1', minHeight: '100vh', paddingBottom: '60px' }}>
            <div style={S.container}>
                <button onClick={() => navigate(`/lands/${id}`)} style={S.backBtn}>← Back to Land Details</button>

                <div style={S.layout}>
                    {/* LEFT: Land Summary & Bid Input */}
                    <div style={S.leftCol}>
                        <div style={S.landCard}>
                            <img src={land.img} alt={land.name} style={S.landImg} />
                            <div style={S.landInfo}>
                                <h1 style={S.title}>{land.name}</h1>
                                <p style={S.loc}><PinIcon /> {land.village}, {land.district}</p>
                                <div style={S.priceRow}>
                                    <div>
                                        <span style={S.priceLabel}>BASE PRICE</span>
                                        <span style={S.priceVal}>Rs. {land.baseBid.toLocaleString()}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={S.priceLabel}>CURRENT HIGHEST</span>
                                        <span style={{ ...S.priceVal, color: '#2ecc71' }}>Rs. {highestBid.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={S.timerCard}>
                            <span style={S.timerLabel}>BIDDING ENDS IN:</span>
                            <span style={{ ...S.timerVal, color: isAuctionEnded ? '#e74c3c' : '#1A1A1A' }}>{timeLeft}</span>
                        </div>

                        {!isAuctionEnded && (
                            <div style={S.inputCard}>
                                <h3 style={S.inputTitle}>{editingBidId ? 'Update Your Bid' : 'Place Your Bid'}</h3>
                                <form onSubmit={editingBidId ? handleUpdateBid : handlePlaceBid} style={S.form}>
                                    <div style={S.inputGroup}>
                                        <span style={S.currencyPrefix}>Rs.</span>
                                        <input
                                            type="number"
                                            placeholder="Enter amount"
                                            style={S.input}
                                            value={myBid}
                                            onChange={(e) => setMyBid(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <button type="submit" className="btn-dark" style={S.bidBtn}>
                                        {editingBidId ? 'Update Bid' : 'Confirm Bid'}
                                    </button>
                                    {editingBidId && (
                                        <button
                                            type="button"
                                            style={S.cancelBtn}
                                            onClick={() => { setEditingBidId(null); setMyBid(''); }}
                                        >
                                            Cancel Edit
                                        </button>
                                    )}
                                </form>
                                <p style={S.note}>* Your bid must be higher than the current highest bid.</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT: Bids List */}
                    <div style={S.rightCol}>
                        <h2 style={S.sectionTitle}>Recent Bids ({bids.length})</h2>
                        <div style={S.bidsList}>
                            {bids.map((bid) => (
                                <div key={bid.id} style={{ ...S.bidItem, borderLeft: bid.isUser ? '4px solid #1A1A1A' : 'none' }}>
                                    <div style={S.bidHeader}>
                                        <span style={S.bidderName}>{bid.name} {bid.isUser && "(You)"}</span>
                                        <span style={S.bidTime}>{bid.time}</span>
                                    </div>
                                    <div style={S.bidBottom}>
                                        <span style={S.bidAmount}>Rs. {bid.amount.toLocaleString()}</span>
                                        {bid.isUser && !isAuctionEnded && (
                                            <div style={S.userActions}>
                                                <button style={S.actionBtn} onClick={() => handleEditBid(bid.id, bid.amount)}>Edit</button>
                                                <button style={{ ...S.actionBtn, color: '#e74c3c' }} onClick={() => handleRemoveBid(bid.id)}>Remove</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {bids.length === 0 && <p style={S.noBids}>No bids placed yet. Be the first!</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const S = {
    container: { maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' },
    backBtn: { border: 'none', background: 'transparent', color: '#555', fontWeight: '700', cursor: 'pointer', marginBottom: '24px' },
    layout: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' },
    leftCol: { display: 'flex', flexDirection: 'column', gap: '24px' },
    landCard: { background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    landImg: { width: '100%', height: '200px', objectFit: 'cover' },
    landInfo: { padding: '24px' },
    title: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' },
    loc: { color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' },
    priceRow: { display: 'flex', justifyContent: 'space-between', marginTop: '24px', borderTop: '1px solid #f0f0f0', paddingTop: '16px' },
    priceLabel: { display: 'block', fontSize: '0.7rem', color: '#888', fontWeight: '700', marginBottom: '4px' },
    priceVal: { fontSize: '1.1rem', fontWeight: '800' },
    timerCard: {
        background: '#1A1A1A', color: '#fff', padding: '24px', borderRadius: '16px', textAlign: 'center',
        display: 'flex', flexDirection: 'column', gap: '8px'
    },
    timerLabel: { fontSize: '0.8rem', fontWeight: '600', opacity: 0.8 },
    timerVal: { fontSize: '1.8rem', fontWeight: '800', letterSpacing: '1px' },
    inputCard: { background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' },
    inputTitle: { fontSize: '1.1rem', fontWeight: '800', marginBottom: '20px' },
    form: { display: 'flex', flexWrap: 'wrap', gap: '12px' },
    inputGroup: { flex: 1, position: 'relative', minWidth: '200px' },
    currencyPrefix: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#555' },
    input: { width: '100%', padding: '14px 16px 14px 45px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem', outline: 'none' },
    bidBtn: { padding: '14px 24px', borderRadius: '8px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '0.95rem' },
    cancelBtn: { padding: '14px', border: 'none', background: 'transparent', color: '#777', fontWeight: '600', cursor: 'pointer' },
    note: { fontSize: '0.75rem', color: '#888', marginTop: '12px' },
    rightCol: { background: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: '800', marginBottom: '24px' },
    bidsList: { flex: 1, overflowY: 'auto' },
    bidItem: { padding: '16px 0', borderBottom: '1px solid #f0f0f0' },
    bidHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
    bidderName: { fontWeight: '700', color: '#1A1A1A' },
    bidTime: { fontSize: '0.75rem', color: '#999' },
    bidBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    bidAmount: { fontSize: '1.1rem', fontWeight: '800', color: '#1A1A1A' },
    userActions: { display: 'flex', gap: '12px' },
    actionBtn: { background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer', color: '#555', padding: 0 },
    noBids: { textAlign: 'center', color: '#999', marginTop: '40px' }
};

export default BiddingPage;
