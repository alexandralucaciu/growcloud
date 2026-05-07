// Sidebar.jsx — desktop left-side navigation
import { NavLink, useNavigate } from 'react-router-dom';
import { navItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-white border-r border-green-100 shadow-sm px-4 py-6">
      {/* Brand */}
      <div className="flex items-center gap-2 mb-8 px-2">
        <span className="text-2xl">🌱</span>
        <span className="text-lg font-semibold text-green-800 tracking-tight">GrowCloud</span>
      </div>

      {/* Navigation links */}
      <nav className="flex flex-col gap-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
              ${isActive
                ? 'bg-green-50 text-green-800 font-semibold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2 pt-6 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mb-3"
        >
          <span>🚪</span> Sign out
        </button>
        <p className="text-xs text-gray-400 px-1">GC-ESP32-001<br />License Project 2026</p>
      </div>
    </aside>
  );
}
