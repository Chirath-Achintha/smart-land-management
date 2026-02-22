export const LANDS = [
    {
        id: 1,
        name: "Golden Valley Acres",
        district: "Kandy",
        village: "Digana",
        publishedDate: "2024-02-15",
        pricePerPerch: 150000,
        perches: 40,
        totalPrice: 6000000,
        roadAccess: "15ft Carpet Road",
        electricity: "Available",
        water: "Available",
        distanceToTown: 2.5,
        type: "Agricultural",
        img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
        auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
        baseBid: 5500000,
        owner: {
            name: "Sunil Perera",
            phone: "+94 77 123 4567",
            role: "Seller",
            freeSlots: [
                { day: "Monday", time: "10:00 AM - 02:00 PM" },
                { day: "Wednesday", time: "09:00 AM - 12:00 PM" },
                { day: "Saturday", time: "03:00 PM - 06:00 PM" }
            ]
        }
    },
    {
        id: 2,
        name: "Ocean View Ridge",
        district: "Galle",
        village: "Unawatuna",
        publishedDate: "2024-02-10",
        pricePerPerch: 850000,
        perches: 20,
        totalPrice: 17000000,
        roadAccess: "20ft Concrete Road",
        electricity: "Available",
        water: "Available",
        distanceToTown: 1.2,
        type: "Residential",
        img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80",
        auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
        baseBid: 16000000,
        owner: {
            name: "Kamal Gunaratne",
            phone: "+94 71 987 6543",
            role: "Seller",
            freeSlots: [
                { day: "Tuesday", time: "02:00 PM - 05:00 PM" },
                { day: "Friday", time: "10:00 AM - 01:00 PM" },
                { day: "Sunday", time: "08:00 AM - 11:00 AM" }
            ]
        }
    },
    {
        id: 3,
        name: "Pine Forest Retreat",
        district: "Nuwara Eliya",
        village: "Nanu Oya",
        publishedDate: "2024-02-20",
        pricePerPerch: 300000,
        perches: 160,
        totalPrice: 48000000,
        roadAccess: "12ft Gravel Road",
        electricity: "Available",
        water: "Natural Spring",
        distanceToTown: 5.0,
        type: "Mixed",
        img: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
        auctionEnd: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
        baseBid: 45000000,
        owner: {
            name: "Dilini Fernando",
            phone: "+94 76 555 1234",
            role: "Seller",
            freeSlots: [
                { day: "Monday", time: "08:00 AM - 10:00 AM" },
                { day: "Thursday", time: "01:00 PM - 04:00 PM" }
            ]
        }
    },
    {
        id: 4,
        name: "Sun-Kissed Plains",
        district: "Anuradhapura",
        village: "Nochchiyagama",
        publishedDate: "2024-01-25",
        pricePerPerch: 45000,
        perches: 320,
        totalPrice: 14400000,
        roadAccess: "Proposed Road",
        electricity: "Planning Phase",
        water: "Well Water",
        distanceToTown: 8.5,
        type: "Agricultural",
        img: "https://images.unsplash.com/photo-1516466723877-e4ec1d736c8a?w=800&q=80",
        auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
        baseBid: 14000000,
        owner: {
            name: "Nimal Siriwardena",
            phone: "+94 70 111 2222",
            role: "Seller",
            freeSlots: [
                { day: "Wednesday", time: "02:00 PM - 06:00 PM" },
                { day: "Friday", time: "02:00 PM - 06:00 PM" }
            ]
        }
    },
    {
        id: 5,
        name: "Emerald Hills",
        district: "Mathale",
        village: "Rattota",
        publishedDate: "2024-02-05",
        pricePerPerch: 180000,
        perches: 60,
        totalPrice: 10800000,
        roadAccess: "Main Road Access",
        electricity: "Available",
        water: "Available",
        distanceToTown: 3.2,
        type: "Residential",
        img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
        auctionEnd: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        baseBid: 10000000,
        owner: {
            name: "Anura Bandara",
            phone: "+94 72 333 4444",
            role: "Seller",
            freeSlots: [
                { day: "Monday", time: "09:00 AM - 11:00 AM" },
                { day: "Friday", time: "03:00 PM - 05:00 PM" }
            ]
        }
    },
    {
        id: 6,
        name: "Desert Oasis Plot",
        district: "Hambantota",
        village: "Ambalantota",
        publishedDate: "2024-02-18",
        pricePerPerch: 75000,
        perches: 80,
        totalPrice: 6000000,
        roadAccess: "20ft Container Access",
        electricity: "Available",
        water: "Available",
        distanceToTown: 4.5,
        type: "Commercial",
        img: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=800&q=80",
        auctionEnd: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
        baseBid: 5800000,
        owner: {
            name: "Priyantha Kumara",
            phone: "+94 78 888 9999",
            role: "Seller",
            freeSlots: [
                { day: "Saturday", time: "10:00 AM - 04:00 PM" },
                { day: "Sunday", time: "10:00 AM - 04:00 PM" }
            ]
        }
    }
];

