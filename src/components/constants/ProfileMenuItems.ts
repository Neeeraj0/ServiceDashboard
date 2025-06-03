const ProfileMenuItems = (username: any) => [
    { name: 'Account Overview', icon: '👤', path: '/account-settings' },
    { name: 'Assigned Tasks History', icon: '📝', path: `/account-settings/${username}/task-history` }, 
    // { name: 'Performance Analytics', icon: '📊', path: '/profile/analytics' },
    { name: 'Technician Management', icon: '👥', path: '/account-settings/manageTechnicians' },
    // { name: 'Task Scheduling', icon: '📅', path: '/profile/scheduling' },
    // { name: 'Feedback & Reports', icon: '📥', path: '/profile/reports' },
    { name: "Register a Technician", icon: '👷', path: '/account-settings/registration' },
];

export default ProfileMenuItems;
