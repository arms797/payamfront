import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { MarkazProvider, useMarkaz } from '../../context/MarkazContext';
import api from '../../api/axiosConfig';

// ============================================================
// محتوای اصلی داشبورد (با سایدبار و Outlet)
// ============================================================
function DashboardContent() {
    const {
        user,
        isAuthenticated,
        logout,
        updateUser,
        roles,
        currentRoleId,
        changeRole
    } = useAuth();

    const { markazList, loading: markazLoading } = useMarkaz();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId || null);
    const [changingRole, setChangingRole] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const toggleSidebar = () => setIsOpen(!isOpen);

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

    const handleLogout = async () => {
        await logout();
    };

    if (markazLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    const activeRole = roles?.find(r => r.id === selectedRoleId);
    const activeMarkaz = markazList?.find(m => m.id === activeRole?.markazId);
    const markazName = activeMarkaz?.naamMarkaz || 'مرکز اصلی';

    return (
        <div className="dashboard-container">
            {/* هدر */}
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

            {/* بدنه */}
            <div className="dashboard-body-wrapper">
                <div className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
                    <Sidebar />
                </div>

                <div className={`dashboard-content ${isOpen ? 'shifted' : ''}`}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

// ============================================================
// خروجی نهایی با MarkazProvider
// ============================================================
export default function DashboardLayout() {
    return (
        <MarkazProvider>
            <DashboardContent />
        </MarkazProvider>
    );
}