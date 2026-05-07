// TopBar.jsx — mobile header with hamburger menu
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { navItems } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="md:hidden bg-white border-b border-green-100 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-semibold text-green-800 tracking-tight">GrowCloud</span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Toggle navigation"
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {open && (
        <nav className="flex flex-col border-t border-gray-100 px-4 pb-3 pt-1 gap-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-green-50 text-green-800 font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-green-700'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors mt-1 border-t border-gray-100 pt-3"
          >
            <span>🚪</span> Sign out
          </button>
        </nav>
      )}
    </header>
  );
}
