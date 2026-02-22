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

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Dashboard Pages
import BuyerDashboard from '../pages/dashboard/BuyerDashboard';
import SellerDashboard from '../pages/dashboard/SellerDashboard';
import AgentDashboard from '../pages/dashboard/AgentDashboard';
import AdminDashboard from '../pages/dashboard/AdminDashboard';

import { useAuth } from '../context/AuthContext';

const AppRoutes = () => {
    const { user } = useAuth();
    const role = user?.role;

    const getDashboardByRole = () => {
        if (!user) return <Navigate to="/login" replace />;

        switch (role) {
            case 'buyer': return <BuyerDashboard />;
            case 'seller': return <SellerDashboard />;
            case 'agent': return <AgentDashboard />;
            case 'admin': return <AdminDashboard />;
            default: return <Navigate to="/login" replace />;
        }
    };

    return (
        <Routes>
            <Route element={<MainLayout />}>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/lands" element={<LandListingPage />} />
                <Route path="/lands/:id" element={<LandDetailPage />} />
                <Route path="/bidding/:id" element={<BiddingPage />} />
                <Route path="/schedule-visit/:id" element={<ScheduleVisitPage />} />

                {/* Auth Routes */}
                <Route element={<AuthLayout />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                </Route>

                {/* Dashboard Routes */}
                <Route element={<DashboardLayout role={role} />}>
                    <Route path="/dashboard" element={getDashboardByRole()} />
                    <Route path="/dashboard/properties" element={<div><h2 style={{ color: '#333' }}>Saved Properties</h2><p>Saved properties content goes here.</p></div>} />
                    <Route path="/dashboard/listings" element={<div><h2 style={{ color: '#333' }}>My Listings</h2><p>Listings management goes here.</p></div>} />
                    <Route path="/dashboard/clients" element={<div><h2 style={{ color: '#333' }}>My Clients</h2><p>Client management goes here.</p></div>} />
                    <Route path="/dashboard/users" element={<div><h2 style={{ color: '#333' }}>Manage Users</h2><p>System users management goes here.</p></div>} />
                </Route>

                {/* Fallback Catch-all Route */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
