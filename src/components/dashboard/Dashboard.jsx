import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useMenu } from '../../context/MenuContext';
import { useMarkaz } from '../../context/MarkazContext';
import api from '../../api/axiosConfig';

export default function Dashboard() {
  const {
    user,
    isAuthenticated,
    logout,
    updateUser,
    roles,
    currentRoleId,
    changeRole
  } = useAuth();

  const { loading: menuLoading } = useMenu();
  const { markazList, loading: markazLoading } = useMarkaz();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId || null);
  const [changingRole, setChangingRole] = useState(false);

  // اگر کاربر لاگین نبود، به صفحه اصلی برو
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  // ============================================================
  // تابع تغییر نقش
  // ============================================================
  const handleRoleChange = async (roleId) => {
    if (roleId === selectedRoleId) return;

    setChangingRole(true);
    try {
      const response = await api.post('/Auth/change-role', { roleId });

      if (response.data?.data) {
        const newUserData = response.data.data;
        updateUser(newUserData);
        changeRole(roleId);
        setSelectedRoleId(roleId);
        window.location.reload();
      }
    } catch (error) {
      console.error('خطا در تغییر نقش:', error);
    } finally {
      setChangingRole(false);
    }
  };

  // ============================================================
  // تابع خروج
  // ============================================================
  const handleLogout = async () => {
    await logout();
  };

  // نمایش لودینگ
  if (menuLoading || markazLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">در حال بارگذاری...</span>
        </div>
      </div>
    );
  }

  // پیدا کردن نقش فعال و مرکز مربوطه
  const activeRole = roles?.find(r => r.id === selectedRoleId);
  const activeMarkaz = markazList?.find(m => m.id === activeRole?.markazId);
  const markazName = activeMarkaz?.naamMarkaz || 'مرکز اصلی';

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-top">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <button className="hamburger-btn" onClick={toggleSidebar}>
              <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-3`}></i>
            </button>
            <h5 className="mb-0">سامانه پیام</h5>
          </div>

          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold text-dark">
              {user?.firstName} {user?.lastName}
            </span>

            {roles && roles.length > 0 && (
              <div className="dropdown">
                <button
                  className="btn btn-outline-primary btn-sm dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  disabled={changingRole}
                >
                  {activeRole?.name} - {markazName}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {roles.map((role) => {
                    const roleMarkaz = markazList?.find(m => m.id === role.markazId);
                    const roleMarkazName = roleMarkaz?.naamMarkaz || 'مرکز اصلی';

                    return (
                      <li key={role.id}>
                        <button
                          className={`dropdown-item ${role.id === selectedRoleId ? 'active' : ''}`}
                          onClick={() => handleRoleChange(role.id)}
                          disabled={changingRole}
                        >
                          {role.name} - {roleMarkazName}
                          {role.id === selectedRoleId && (
                            <i className="bi bi-check2 ms-2 text-primary"></i>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-body-wrapper">
        <div className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
          <Sidebar closeSidebar={closeSidebar} />
        </div>

        <div className={`dashboard-content ${isOpen ? 'shifted' : ''}`}>
          <div className="dashboard-welcome">
            <h2>خوش آمدید {user?.firstName} {user?.lastName}</h2>
            <p className="text-muted">
              نقش فعلی: {activeRole?.name} | مرکز: {markazName}
            </p>
          </div>

          <div className="row g-4 mt-3">
            <div className="col-md-4 col-sm-6">
              <div className="dashboard-card">
                <div className="dashboard-card-icon bg-primary-subtle">
                  <i className="bi bi-people fs-2 text-primary"></i>
                </div>
                <div className="dashboard-card-body">
                  <h6>تعداد کاربران</h6>
                  <h3>۱۲۴</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="dashboard-card">
                <div className="dashboard-card-icon bg-success-subtle">
                  <i className="bi bi-calendar fs-2 text-success"></i>
                </div>
                <div className="dashboard-card-body">
                  <h6>برنامه هفتگی</h6>
                  <h3>۴۲</h3>
                </div>
              </div>
            </div>
            <div className="col-md-4 col-sm-6">
              <div className="dashboard-card">
                <div className="dashboard-card-icon bg-warning-subtle">
                  <i className="bi bi-mortarboard fs-2 text-warning"></i>
                </div>
                <div className="dashboard-card-body">
                  <h6>اساتید</h6>
                  <h3>۱۸</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-main-content mt-4">
            <div className="card">
              <div className="card-body">
                <h5>اطلاعیه‌ها</h5>
                <p className="text-muted">به زودی...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}