import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import api from '../../api/axiosConfig';

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
    const [changingRole, setChangingRole] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [isRoleChanging, setIsRoleChanging] = useState(false);
    const [displayRole, setDisplayRole] = useState(null);


    // ============================================================
    // 🔥 State برای نقش انتخاب‌شده در کومبو
    // ============================================================
    const [selectedRole, setSelectedRole] = useState(() => {
        const defaultRole = roles?.find(r => r.isDefault === true);
        return defaultRole || roles?.[0] || null;
    });

    // ============================================================
    // 🔥 همگام‌سازی selectedRole با roles و currentRoleId
    // ============================================================
    /*useEffect(() => {
        if (isRoleChanging) return;   // ← جلوگیری از overwrite در حین تغییر

        if (roles && roles.length > 0 && currentRoleId) {
            const activeRole = roles.find(r => r.id === currentRoleId);
            if (activeRole) {
                console.log('✅ Active role updated to:', activeRole);
                setSelectedRole(activeRole);
            }
        }
    }, [roles, currentRoleId, isRoleChanging]);*/

    // ============================================================
    // همگام‌سازی displayRole
    // ============================================================
    useEffect(() => {
        if (selectedRole) {
            setDisplayRole(selectedRole);
        }
    }, [selectedRole]);

    // ============================================================
    // 🔥 پیدا کردن نام مرکز
    // ============================================================
    const getMarkazName = (markazId) => {
        if (!markazId) return 'مرکز اصلی';
        const markaz = markazList?.find(m => m.id === markazId);
        return markaz?.naamMarkaz || 'مرکز اصلی';
    };

    // ============================================================
    // 🔥 مقدار نمایشی دکمه
    // ============================================================
    const displayName = displayRole?.name || 'نقش نامشخص';
    const displayMarkaz = getMarkazName(displayRole?.markazId);
    const buttonText = `${displayName} - ${displayMarkaz}`;

    // و در map roles هم برای isActive:
    //const isActive = displayRole?.id === role.id && displayRole?.markazId === role.markazId;

    // ============================================================
    // 🔥 تغییر نقش
    // ============================================================
    const handleRoleChange = async (roleId, markazId) => {
        const baseRole = roles?.find(r => r.id === roleId);
        if (!baseRole) return;

        if (selectedRole?.id === roleId && selectedRole?.markazId === markazId) {
            setDropdownOpen(false);
            return;
        }

        setChangingRole(true);
        try {
            const response = await api.post('/Auth/change-role', { roleId, markazId });

            if (response.data?.success && response.data?.data) {
                const newUserData = response.data.data;

                updateUser(newUserData);

                // ساخت نمایش نهایی
                const finalDisplayRole = {
                    ...baseRole,
                    markazId: markazId,
                    name: newUserData.currentRoleName || baseRole.name
                };

                setSelectedRole(finalDisplayRole);
                setDisplayRole(finalDisplayRole);

                //console.log('✅ Final Display Role:', finalDisplayRole);

                setDropdownOpen(false);
                toast.success('نقش با موفقیت تغییر کرد');
            }
        } catch (error) {
            console.error('❌ Error in change role:', error);
            toast.error(error.response?.data?.message || 'خطا در تغییر نقش');
        } finally {
            setChangingRole(false);
        }
    };


    const handleLogout = async () => {
        await logout();
    };

    // ============================================================
    // 🔥 اگر لاگین نیست → هدایت به صفحه اصلی
    // ============================================================
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    // ============================================================
    // 🔥 بستن dropdown با کلیک بیرون
    // ============================================================
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (markazLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header-top">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                        <button className="hamburger-btn" onClick={() => setIsOpen(!isOpen)}>
                            <i className={`bi ${isOpen ? 'bi-x-lg' : 'bi-list'} fs-3`}></i>
                        </button>
                        <h5 className="mb-0">سامانه پیام</h5>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        <span className="fw-semibold text-dark">
                            {user?.firstName} {user?.lastName}
                        </span>

                        {roles && roles.length > 0 && (
                            <div className="dropdown-custom" ref={dropdownRef}>
                                <button
                                    key={selectedRole?.id + '_' + selectedRole?.markazId}
                                    className={`btn btn-outline-primary btn-sm dropdown-custom-toggle ${dropdownOpen ? 'show' : ''}`}
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    disabled={changingRole}
                                >
                                    {buttonText}
                                    <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'} ms-1`}></i>
                                </button>

                                {dropdownOpen && (
                                    <div className="dropdown-custom-menu">
                                        {roles.map((role) => {
                                            const roleMarkazName = getMarkazName(role.markazId);
                                            const isActive = displayRole?.id === role.id && displayRole?.markazId === role.markazId;

                                            return (
                                                <button
                                                    key={`${role.id}_${role.markazId}`}
                                                    className={`dropdown-custom-item ${isActive ? 'active' : ''}`}
                                                    onClick={() => {
                                                        handleRoleChange(role.id, role.markazId);
                                                        setDropdownOpen(false);
                                                    }}
                                                    disabled={changingRole}
                                                >
                                                    {role.name} - {roleMarkazName}
                                                    {isActive && (
                                                        <i className="bi bi-check2 ms-2 text-primary"></i>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
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
                    <Sidebar />
                </div>

                <div className={`dashboard-content ${isOpen ? 'shifted' : ''}`}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default function DashboardLayout() {
    return <DashboardContent />;
}