import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
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
      <div className="app-container">
        <Routes>
          {/* صفحه اصلی = LandingPage (فعلاً فقط لاگین) */}
          <Route path="/" element={<LandingPage />} />

          {/* مسیر لاگین هم به صفحه اصلی هدایت شود */}
          <Route path="/login" element={<Navigate to="/" replace />} />

          {/* داشبورد (محافظت‌شده) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* هر مسیر دیگر به صفحه اصلی */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;