// AppLayout.jsx — outer shell that wraps all pages with sidebar + top bar
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import StaleDataBanner from '../common/StaleDataBanner';
import { useNightMode } from '../../hooks/useNightMode';

export default function AppLayout({ children }) {
  const isNightMode = useNightMode();

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isNightMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <StaleDataBanner />
        {isNightMode && (
          <div className="px-4 py-2 border-b border-slate-700 bg-slate-900/90 text-slate-100 text-xs sm:text-sm">
            Night Mode Active: Low ambient light is normal during this time.
          </div>
        )}
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
