import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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
import ConstructorCalendarPage from '../pages/dashboard/constructor/ConstructorCalendarPage';

// Buyer Sub-pages
import BuyerBidsPage from '../pages/dashboard/buyer/BuyerBidsPage';
import BuyerVisitsPage from '../pages/dashboard/buyer/BuyerVisitsPage';
import BuyerPurchasedLandsPage from '../pages/dashboard/buyer/BuyerPurchasedLandsPage';

// Seller Sub-pages
import SellerListingsPage from '../pages/dashboard/seller/SellerListingsPage';
import SellerBidsPage from '../pages/dashboard/seller/SellerBidsPage';
import SellerBiddingPage from '../pages/dashboard/seller/SellerBiddingPage';
import SellerAvailabilityPage from '../pages/dashboard/seller/SellerAvailabilityPage';
import SellerVisitsPage from '../pages/dashboard/seller/SellerVisitsPage';

// Agent Sub-pages
import AgentClientsPage from '../pages/dashboard/agent/AgentClientsPage';

import { useAuth } from '../context/AuthContext';
import { getDefaultDashboardPath } from '../routePaths';

const AppRoutes = () => {
    const { user } = useAuth();
    const role = user?.role;
    const dashboardPath = getDefaultDashboardPath(role);

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
        <Routes>
            <Route element={<MainLayout />}>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Protected Land Routes - Sellers blocked */}
                <Route
                    path="/lands"
                    element={role === 'seller' ? <Navigate to={dashboardPath} replace /> : <LandListingPage />}
                />
                <Route
                    path="/lands/:id"
                    element={role === 'seller' ? <Navigate to={dashboardPath} replace /> : <LandDetailPage />}
                />
                <Route
                    path="/bidding/:id"
                    element={role === 'seller' ? <Navigate to={dashboardPath} replace /> : <BiddingPage />}
                />
                <Route
                    path="/schedule-visit/:id"
                    element={role === 'seller' ? <Navigate to={dashboardPath} replace /> : <ScheduleVisitPage />}
                />

                <Route path="/inquiry" element={<InquiryPage />} />
                <Route
                    path="/services"
                    element={
                        !user
                            ? <Navigate to="/login" replace state={{ from: '/services' }} />
                            : role === 'buyer'
                                ? <Navigate to="/dashboard/services" replace />
                                : <Navigate to={dashboardPath} replace />
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
                <Route element={user ? <DashboardLayout role={role} /> : <Navigate to="/login" replace />}>
                    <Route path="/dashboard" element={getDashboardByRole()} />
                    <Route path="/dashboard/properties" element={<div><h2 style={{ color: '#333' }}>Saved Properties</h2><p>Saved properties content goes here.</p></div>} />
                    <Route path="/dashboard/projects" element={<ConstructorProjectsPage />} />
                    <Route path="/dashboard/service-requests" element={<ConstructorServiceBookingsPage />} />
                    <Route path="/dashboard/calendar" element={<ConstructorCalendarPage />} />
                    <Route path="/dashboard/listings" element={<div><h2 style={{ color: '#333' }}>My Listings</h2><p>Listings management goes here.</p></div>} />
                    <Route path="/dashboard/clients" element={<AgentClientsPage />} />

                    {/* Buyer Sub-pages */}
                    <Route path="/dashboard/bids" element={<BuyerBidsPage />} />
                    <Route path="/dashboard/purchased-lands" element={<BuyerPurchasedLandsPage />} />
                    <Route path="/dashboard/visits" element={<BuyerVisitsPage />} />
                    <Route
                        path="/dashboard/services"
                        element={role === 'buyer' ? <ServiceBookingPage /> : <Navigate to={dashboardPath} replace />}
                    />
                    <Route path="/dashboard/users" element={<UserManagement />} />
                    <Route path="/dashboard/seller/listings" element={<SellerListingsPage />} />
                    <Route
                        path="/dashboard/seller/listings/:id"
                        element={role === 'seller' ? <LandDetailPage /> : <Navigate to={dashboardPath} replace />}
                    />
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
                <Route path="*" element={user ? <Navigate to={dashboardPath} replace /> : <Navigate to="/login" replace />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
