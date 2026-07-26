import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import AppProviders from './components/AppProviders';
import { isAuthenticated } from './utils/storage';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/landing/LandingPage';
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import PermissionList from './pages/Permission/PermissionList';
import MenuList from './pages/Menu/MenuList';
import RolePermissionList from './pages/RolePermission/RolePermissionList';
import RoleList from './pages/Role/RoleList';
import KarmandList from './pages/Karmand/KarmandList';
import KarmandCreate from './pages/Karmand/KarmandCreate';
import KarmandDetail from './pages/Karmand/KarmandDetail';

import UserRoles from './pages/Role/UserRoles';


// ============================================================
// کامپوننت محافظت از مسیرها (فقط لاگین)
// ============================================================
// در App.jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  // ============================================================
  // 🔥 اگر در حال بارگذاری است، چیزی نشان نده
  // ============================================================
  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  // ============================================================
  // 🔥 اگر احراز هویت نشده، به لاگین بفرست
  // ============================================================
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ============================================================
// کامپوننت محافظت با مجوز (داخل AuthProvider)
// ============================================================
function ProtectedRouteWithPermission({ children, requiredPermission }) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
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
                            مسیرهای داشبورد (با سایدبار و Outlet)
                            ============================================================ */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* صفحه اصلی داشبورد */}
              <Route index element={<DashboardHome />} />

              {/* زیرمسیرهای داشبورد */}
              <Route
                path="permissions"
                element={
                  <ProtectedRouteWithPermission requiredPermission="Permission.View">
                    <PermissionList />
                  </ProtectedRouteWithPermission>
                }
              />
              <Route
                path="menus"
                element={
                  <ProtectedRouteWithPermission requiredPermission="Menu.View">
                    <MenuList />
                  </ProtectedRouteWithPermission>
                }
              />
              <Route
                path="role-permissions"
                element={
                  <ProtectedRouteWithPermission requiredPermission="RolePermission.View">
                    <RolePermissionList />
                  </ProtectedRouteWithPermission>
                }
              />
              <Route
                path="roles"
                element={
                  <ProtectedRouteWithPermission requiredPermission="Role.View">
                    <RoleList />
                  </ProtectedRouteWithPermission>
                }
              />

              <Route
                path="personel"
                element={<ProtectedRouteWithPermission requiredPermission="Karmand.View">
                  <KarmandList />
                </ProtectedRouteWithPermission>}
              />
              <Route
                path="personel/create"
                element={<ProtectedRouteWithPermission requiredPermission="Karmand.Create">
                  <KarmandCreate />
                </ProtectedRouteWithPermission>}
              />
              <Route
                path="personel/:id"
                element={
                  <ProtectedRouteWithPermission requiredPermission="Karmand.View">
                    <KarmandDetail />
                  </ProtectedRouteWithPermission>
                }
              />
              <Route
                path="personel/:karmandId/roles"
                element={<ProtectedRouteWithPermission requiredPermission="RoleAssignment.View">
                  <UserRoles />
                </ProtectedRouteWithPermission>}
              />
              {/* پایان قسمت داشبورد */}
            </Route>


            {/* ============================================================
                            مسیر 404
                            ============================================================ */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* ============================================================
                        ToastContainer برای نمایش پیغام‌ها
                        ============================================================ */}
          <ToastContainer
            position="top-center"
            rtl={true}
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AppProviders>
    </BrowserRouter>
  );
}

export default App;