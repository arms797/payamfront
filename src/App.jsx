import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import AppProviders from './components/AppProviders';
import { isAuthenticated } from './utils/storage';

function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* ============================================================
          AppProviders کل برنامه را احاطه کرده است
          ============================================================ */}
      <AppProviders>
        <div className="app-container">
          <Routes>
            {/* ============================================================
                صفحه لاگین (دسترسی به AuthContext دارد، اما Menu و Markaz ندارند)
                ============================================================ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* ============================================================
                مسیرهای محافظت‌شده
                ============================================================ */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* ============================================================
                سایر مسیرهای آینده
                ============================================================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;