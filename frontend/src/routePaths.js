export const getDefaultDashboardPath = (role) => {
    switch ((role || '').toLowerCase()) {
        case 'seller':
            return '/dashboard/seller/listings';
        case 'agent':
            return '/dashboard/clients';
        case 'constructor_manager':
            return '/dashboard/projects';
        case 'admin':
            return '/dashboard';
        case 'buyer':
            return '/dashboard';
        default:
            return '/dashboard';
    }
};
