// AppLayout.jsx — outer shell that wraps all pages with sidebar + top bar
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import StaleDataBanner from '../common/StaleDataBanner';

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar />
        <StaleDataBanner />
        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
