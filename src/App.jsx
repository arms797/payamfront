import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import { isAuthenticated } from './utils/storage';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './App.css';

// ============================================================
// محافظت از مسیرها (نیاز به لاگین)
// ============================================================
function ProtectedRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// ============================================================
// کامپوننت اصلی App
// ============================================================
function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          {/* صفحه لاگین (عمومی - بدون نیاز به لاگین) */}
          <Route path="/login" element={<Login />} />

          {/* مسیرهای محافظت‌شده (نیاز به لاگین) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* مسیر پیش‌فرض - هدایت به داشبورد */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* مسیر 404 - صفحه پیدا نشد */}
          <Route
            path="*"
            element={
              <div className="text-center mt-5">
                <h1>۴۰۴</h1>
                <p>صفحه مورد نظر یافت نشد</p>
                <a href="/dashboard" className="btn btn-primary">
                  بازگشت به داشبورد
                </a>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;