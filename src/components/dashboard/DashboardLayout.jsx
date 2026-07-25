import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { MarkazProvider, useMarkaz } from '../../context/MarkazContext';
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

    // ============================================================
    // 🔥 State برای نقش انتخاب‌شده در کومبو
    // ============================================================
    const [selectedRole, setSelectedRole] = useState(() => {
        // مقدار اولیه: نقشی که isDefault === true است
        const defaultRole = roles?.find(r => r.isDefault === true);
        return defaultRole || roles?.[0] || null;
    });

    // ============================================================
    // 🔥 هر وقت roles یا currentRoleId تغییر کرد، selectedRole را همگام کن
    // ============================================================
    useEffect(() => {
        const defaultRole = roles?.find(r => r.isDefault === true);
        if (defaultRole) {
            setSelectedRole(defaultRole);
        } else if (roles && roles.length > 0) {
            setSelectedRole(roles[0]);
        }
    }, [roles, currentRoleId]);

    // ============================================================
    // 🔥 پیدا کردن نام مرکز
    // ============================================================
    const getMarkazName = (markazId) => {
        if (!markazId) return 'مرکز اصلی';
        const markaz = markazList?.find(m => m.id === markazId);
        return markaz?.naamMarkaz || 'مرکز اصلی';
    };

    // ============================================================
    // 🔥 مقدار نمایشی دکمه (بر اساس selectedRole)
    // ============================================================
    const displayName = selectedRole?.name || 'نقش نامشخص';
    const displayMarkaz = getMarkazName(selectedRole?.markazId);
    const buttonText = `${displayName} - ${displayMarkaz}`;

    // ============================================================
    // 🔥 دیباگ
    // ============================================================
    /*console.log('🔍 selectedRole:', selectedRole);
    console.log('📝 buttonText:', buttonText);
    console.log('🔍 roles:', roles);*/

    // ============================================================
    // 🔥 تغییر نقش
    // ============================================================
    const handleRoleChange = async (roleId, markazId) => {
        // پیدا کردن نقش جدید از آرایه roles
        const newRole = roles?.find(r => r.id === roleId && r.markazId === markazId);
        if (!newRole) return;

        // اگر همان نقش انتخاب شده، فقط کومبو را ببند
        if (selectedRole?.id === roleId && selectedRole?.markazId === markazId) {
            setDropdownOpen(false);
            return;
        }

        setChangingRole(true);
        try {
            const response = await api.post('/Auth/change-role', {
                roleId,
                markazId
            });
            console.log('📦 Full response from change-role:', response);
            if (response.data?.data) {
                const newUserData = response.data.data;

                // ============================================================
                // 🔥 این رو با دقت ببین
                // ============================================================
                console.log('🔍 NEW TOKEN ROLE ID:', newUserData.currentRoleId);
                console.log('🔍 NEW TOKEN ROLE NAME:', newUserData.currentRoleName);
                // ============================================================
                // 🔥 توکن رو decode کن تا RoleId رو ببینی
                // ============================================================
                const tokenParts = newUserData.accessToken.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('🔍 Decoded token RoleId:', payload.RoleId);
                    console.log('🔍 Decoded token Role:', payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']);
                }

                updateUser(newUserData);
                changeRole(roleId);

                // ============================================================
                // 🔥 مهم: selectedRole را به‌روز کن (این باعث رندر مجدد می‌شود)
                // ============================================================
                setSelectedRole(newRole);

                setDropdownOpen(false);
                toast.success('نقش با موفقیت تغییر کرد');
                // ============================================================
                // 🔥 به جای رفرش، فقط به داشبورد هدایت کن
                // ============================================================
                navigate('/dashboard', { replace: true });
                // ============================================================
                // 🔥 دیباگ: بررسی توکن جدید
                // ============================================================
                /*console.log('✅ New accessToken:', newUserData.accessToken?.substring(0, 30) + '...');
                console.log('✅ localStorage token:', localStorage.getItem('accessToken')?.substring(0, 30) + '...');
                console.log('✅ api.defaults.headers:', api.defaults.headers.common['Authorization']?.substring(0, 30) + '...');
                console.log('🔑 localStorage token:', localStorage.getItem('accessToken'));
                console.log('🔑 api headers:', api.defaults.headers.common['Authorization']);*/
            }
        } catch (error) {
            console.error('❌ Error in change role:', error);
            toast.error('خطا در تغییر نقش');
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
                                    key={selectedRole?.id + '_' + selectedRole?.markazId}  // ← این خط مهم است
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
                                            const isActive = selectedRole?.id === role.id && selectedRole?.markazId === role.markazId;

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
    return (
        <MarkazProvider>
            <DashboardContent />
        </MarkazProvider>
    );
}