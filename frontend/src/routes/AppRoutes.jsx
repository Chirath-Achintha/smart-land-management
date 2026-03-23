import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Landing Page
import LandingPage from '../pages/landing/LandingPage';
import LandListingPage from '../pages/lands/LandListingPage';
import LandDetailPage from '../pages/lands/LandDetailPage';
import BiddingPage from '../pages/lands/BiddingPage';
import ScheduleVisitPage from '../pages/lands/ScheduleVisitPage';
import InquiryPage from '../pages/inquiry/InquiryPage';
import ServiceBookingPage from '../pages/services/ServiceBookingPage';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ResetPassword from '../pages/auth/ResetPassword';

// Dashboard Pages
import BuyerDashboard from '../pages/dashboard/BuyerDashboard';
import SellerDashboard from '../pages/dashboard/SellerDashboard';
import AgentDashboard from '../pages/dashboard/AgentDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import ConstructorManagerDashboard from '../pages/dashboard/ConstructorManagerDashboard';
import AgentAssignment from '../pages/dashboard/admin/AgentAssignment';
import AgentVisitsPage from '../pages/dashboard/admin/AgentVisitsPage';
import ServiceManagement from '../pages/dashboard/admin/ServiceManagement';
import ComplaintsManagement from '../pages/dashboard/admin/ComplaintsManagement';
import UserManagement from '../pages/dashboard/admin/UserManagement';
import AdminConstructorTeamsPage from '../pages/dashboard/admin/AdminConstructorTeamsPage';
import ConstructorProjectsPage from '../pages/dashboard/constructor/ConstructorProjectsPage';
import ConstructorServiceBookingsPage from '../pages/dashboard/constructor/ConstructorServiceBookingsPage';

// Buyer Sub-pages
import BuyerBidsPage from '../pages/dashboard/buyer/BuyerBidsPage';
import BuyerVisitsPage from '../pages/dashboard/buyer/BuyerVisitsPage';

// Seller Sub-pages
import SellerListingsPage from '../pages/dashboard/seller/SellerListingsPage';
import SellerBidsPage from '../pages/dashboard/seller/SellerBidsPage';
import SellerBiddingPage from '../pages/dashboard/seller/SellerBiddingPage';
import SellerAvailabilityPage from '../pages/dashboard/seller/SellerAvailabilityPage';
import SellerVisitsPage from '../pages/dashboard/seller/SellerVisitsPage';

// Agent Sub-pages
import AgentClientsPage from '../pages/dashboard/agent/AgentClientsPage';

import { useAuth } from '../context/AuthContext';

const SavedPropertiesPage = () => (
    <div style={savedPropertiesStyles.root}>
        <div style={savedPropertiesStyles.header}>
            <div>
                <h1 style={savedPropertiesStyles.title}>Saved Properties</h1>
                <p style={savedPropertiesStyles.subtitle}>Your bookmarked lands will appear here for quick access.</p>
            </div>
            <div style={savedPropertiesStyles.countBadge}>0 saved</div>
        </div>

        <div className="ui-card" style={savedPropertiesStyles.emptyCard}>
            <h3 style={savedPropertiesStyles.emptyTitle}>No saved properties yet</h3>
            <p style={savedPropertiesStyles.emptyText}>
                Browse listings and save properties to compare and revisit them later.
            </p>
            <a href="/lands" style={savedPropertiesStyles.browseLink}>Browse Listings</a>
        </div>
    </div>
);

const savedPropertiesStyles = {
    root: {
        background: 'var(--color-bg)',
        minHeight: '100%',
        padding: '40px',
        fontFamily: "'DM Sans', sans-serif",
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: '16px',
        marginBottom: '28px',
        flexWrap: 'wrap',
    },
    title: {
        fontSize: '2rem',
        fontWeight: '800',
        color: 'var(--color-dark)',
        marginBottom: '6px',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        color: 'var(--color-muted)',
        fontSize: '0.95rem',
        margin: 0,
    },
    countBadge: {
        background: 'var(--color-dark)',
        color: '#fff',
        borderRadius: '20px',
        padding: '6px 16px',
        fontWeight: '700',
        fontSize: '0.85rem',
    },
    emptyCard: {
        background: '#fff',
        border: '1px solid rgba(38, 50, 56, 0.1)',
        borderRadius: '20px',
        padding: '42px',
        textAlign: 'left',
        boxShadow: 'none',
        maxWidth: '780px',
    },
    emptyTitle: {
        margin: 0,
        marginBottom: '8px',
        fontSize: '1.25rem',
        color: 'var(--color-dark)',
        fontWeight: '800',
    },
    emptyText: {
        margin: 0,
        marginBottom: '18px',
        color: 'var(--color-muted)',
        lineHeight: 1.6,
    },
    browseLink: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
        borderRadius: '10px',
        background: 'var(--color-primary)',
        color: '#fff',
        textDecoration: 'none',
        fontWeight: '700',
        fontSize: '0.9rem',
    },
};

const AppRoutes = () => {
    const { user } = useAuth();
    const role = user?.role;
    const location = useLocation();

    const getDashboardByRole = () => {
        if (!user) return <Navigate to="/login" replace />;

        switch (role) {
            case 'buyer': return <BuyerDashboard />;
            case 'seller': return <SellerDashboard />;
            case 'agent': return <AgentDashboard />;
            case 'constructor_manager': return <ConstructorManagerDashboard />;
            case 'admin': return <AdminDashboard />;
            default: return <Navigate to="/login" replace />;
        }
    };

    return (
        <div key={location.pathname} className="ui-page">
        <Routes>
            <Route element={<MainLayout />}>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Protected Land Routes - Sellers blocked */}
                <Route
                    path="/lands"
                    element={role === 'seller' ? <Navigate to="/dashboard" replace /> : <LandListingPage />}
                />
                <Route
                    path="/lands/:id"
                    element={role === 'seller' ? <Navigate to="/dashboard" replace /> : <LandDetailPage />}
                />
                <Route
                    path="/bidding/:id"
                    element={role === 'seller' ? <Navigate to="/dashboard" replace /> : <BiddingPage />}
                />
                <Route
                    path="/schedule-visit/:id"
                    element={role === 'seller' ? <Navigate to="/dashboard" replace /> : <ScheduleVisitPage />}
                />

                <Route path="/inquiry" element={<InquiryPage />} />
                <Route
                    path="/services"
                    element={
                        !user
                            ? <Navigate to="/login" replace state={{ from: '/services' }} />
                            : role === 'buyer'
                                ? <Navigate to="/dashboard/services" replace />
                                : <Navigate to="/dashboard" replace />
                    }
                />

                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/verify-otp" element={<VerifyOtp />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* Dashboard Routes */}
                <Route element={<DashboardLayout role={role} />}>
                    <Route path="/dashboard" element={getDashboardByRole()} />
                    <Route path="/dashboard/properties" element={<SavedPropertiesPage />} />
                    <Route path="/dashboard/projects" element={<ConstructorProjectsPage />} />
                    <Route path="/dashboard/service-requests" element={<ConstructorServiceBookingsPage />} />
                    <Route path="/dashboard/listings" element={<div><h2 style={{ color: '#333' }}>My Listings</h2><p>Listings management goes here.</p></div>} />
                    <Route path="/dashboard/clients" element={<AgentClientsPage />} />

                    {/* Buyer Sub-pages */}
                    <Route path="/dashboard/bids" element={<BuyerBidsPage />} />
                    <Route path="/dashboard/visits" element={<BuyerVisitsPage />} />
                    <Route
                        path="/dashboard/services"
                        element={role === 'buyer' ? <ServiceBookingPage /> : <Navigate to="/dashboard" replace />}
                    />
                    <Route path="/dashboard/users" element={<UserManagement />} />
                    <Route path="/dashboard/seller/listings" element={<SellerListingsPage />} />
                    <Route path="/dashboard/seller/bids" element={<SellerBidsPage />} />
                    <Route path="/dashboard/seller/bidding" element={<SellerBiddingPage />} />
                    <Route path="/dashboard/seller/availability" element={<SellerAvailabilityPage />} />
                    <Route path="/dashboard/seller/visits" element={<SellerVisitsPage />} />

                    {/* Admin Specific Routes */}
                    <Route path="/dashboard/admin/agents" element={<AgentAssignment />} />
                    <Route path="/dashboard/admin/agent-visits" element={<AgentVisitsPage />} />
                    <Route path="/dashboard/admin/services" element={<ServiceManagement />} />
                    <Route path="/dashboard/admin/constructor-teams" element={<AdminConstructorTeamsPage />} />
                    <Route path="/dashboard/admin/complaints" element={<ComplaintsManagement />} />
                </Route>

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
        </Routes>
        </div>
    );
};

export default AppRoutes;
