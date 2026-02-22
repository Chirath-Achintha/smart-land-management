import React from 'react';

export const PROPERTIES = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=700&q=80",
    location: "San Francisco, California",
    rooms: 4,
    sqft: "3,500",
    price: "$2,500,000",
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=700&q=80",
    location: "Beverly Hills, California",
    rooms: 3,
    sqft: "1,500",
    price: "$850,000",
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=700&q=80",
    location: "Palo Alto, California",
    rooms: 6,
    sqft: "4,000",
    price: "$3,700,000",
  },
];

export const WHY_CARDS = [
  {
    id: 1,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Expert Guidance",
    desc: "Benefit from our team's seasoned expertise for a smooth buying experience",
  },
  {
    id: 2,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M22 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Personalized Service",
    desc: "Our services adapt to your unique needs, making your journey stress-free",
  },
  {
    id: 3,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    ),
    title: "Transparent Process",
    desc: "Stay informed with our clear and honest approach to buying your home",
  },
  {
    id: 4,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M11 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14z" />
        <path d="M20.5 20.5l-4.35-4.35" />
        <path d="M8 11h6M11 8v6" />
      </svg>
    ),
    title: "Exceptional Support",
    desc: "Providing peace of mind with our responsive and attentive customer service",
  },
];

export const NAV = ["Home", "Service", "Inquiry", "Contact"];
