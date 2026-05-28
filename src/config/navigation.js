// navigation.js — shared navigation items used by both Sidebar and TopBar.
// Add or rename routes here only once.

export const navItems = [
  { to: '/',          label: 'Overview' },
  { to: '/health',    label: 'Plant Health' },
  { to: '/watering',  label: 'Watering' },
  { to: '/telemetry', label: 'Telemetry' },
  { to: '/settings',  label: 'Device & About', icon: 'ℹ️', iconClass: 'text-blue-500' },
];
