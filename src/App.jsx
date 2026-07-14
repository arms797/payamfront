import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import Dashboard from './components/dashboard/Dashboard';
import AppProviders from './components/AppProviders';
import { isAuthenticated } from './utils/storage';

// ============================================================
// کامپوننت محافظت از مسیرها
// ============================================================
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// ============================================================
// کامپوننت اصلی App
// ============================================================
function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <div className="app-container">
          <Routes>
            {/* ============================================================
                            صفحه لاگین (عمومی)
                            ============================================================ */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/" replace />} />

            {/* ============================================================
                            مسیرهای محافظت‌شده (نیاز به لاگین)
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
                            مسیرهای آینده (نمونه)
                            ============================================================ */}
            {/* 
                        <Route
                            path="/ostad/list"
                            element={
                                <ProtectedRoute>
                                    <OstadList />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/ostad/create"
                            element={
                                <ProtectedRoute>
                                    <OstadCreate />
                                </ProtectedRoute>
                            }
                        />
                        */}

            {/* ============================================================
                            مسیر 404
                            ============================================================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;