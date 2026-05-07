// NotFound.jsx — shown when no route matches
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-5xl mb-4">🌿</span>
      <h1 className="text-2xl font-bold text-green-900 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 mb-6">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
      >
        Back to Overview
      </Link>
    </div>
  );
}
