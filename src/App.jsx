import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Overview from './pages/Overview';
import PlantHealth from './pages/PlantHealth';
import WateringGuidance from './pages/WateringGuidance';
import Telemetry from './pages/Telemetry';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route — no layout */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes — wrapped in AppLayout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/"          element={<Overview />} />
                    <Route path="/health"    element={<PlantHealth />} />
                    <Route path="/watering"  element={<WateringGuidance />} />
                    <Route path="/telemetry" element={<Telemetry />} />
                    <Route path="/settings"  element={<Settings />} />
                    <Route path="*"          element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
