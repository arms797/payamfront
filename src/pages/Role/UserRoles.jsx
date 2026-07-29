import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';
import { PermissionWrapper } from '../../components/PermissionWrapper';

export default function UserRoles() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();

    // ============================================================
    // 🔥 دریافت نوع کاربر از query params
    // ============================================================
    const queryParams = new URLSearchParams(location.search);
    const userType = queryParams.get('type') || 'karmand'; // پیش‌فرض: کارمند

    const { hasPermission, user } = useAuth();
    const { markazList } = useMarkaz();

    // ============================================================
    // Stateهای اصلی
    // ============================================================
    const [userInfo, setUserInfo] = useState(null);
    const [appUserId, setAppUserId] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    // ============================================================
    // Stateهای مودال ایجاد
    // ============================================================
    const [createForm, setCreateForm] = useState({
        markazId: '',
        roleId: '',
        parentUserRoleId: '',
        isDefault: false
    });
    const [assignableRoles, setAssignableRoles] = useState([]);
    const [assignedRoles, setAssignedRoles] = useState([]);
    const [creating, setCreating] = useState(false);

    // ============================================================
    // Stateهای مودال ویرایش
    // ============================================================
    const [editForm, setEditForm] = useState({
        isDefault: false,
        parentUserRoleId: ''
    });
    const [editing, setEditing] = useState(false);

    // ============================================================
    // بررسی مجوز
    // ============================================================
    if (!hasPermission('RoleAssignment.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت اطلاعات کاربر (با API واحد)
    // ============================================================
    const fetchUserInfo = async () => {
        if (!id) return;

        try {
            const userResponse = await api.get(`/User/by-type`, {
                params: { type: userType, id: parseInt(id) }
            });

            if (userResponse.data?.success) {
                const data = userResponse.data.data;
                setUserInfo(data);
                setAppUserId(data.id);
            }
        } catch (error) {
            console.error('خطا در دریافت اطلاعات کاربر:', error);
            toast.error('خطا در دریافت اطلاعات کاربر');
        }
    };

    // ============================================================
    // دریافت نقش‌های کاربر
    // ============================================================
    const fetchUserRoles = async () => {
        if (!appUserId) return;

        setLoading(true);
        try {
            const response = await api.get(`/RoleAssignment/by-user/${appUserId}`);
            if (response.data?.success) {
                setRoles(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت نقش‌های کاربر:', error);
            toast.error('خطا در دریافت نقش‌های کاربر');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    useEffect(() => {
        if (id) {
            fetchUserInfo();
        }
    }, [id, userType]);

    // ============================================================
    // بارگذاری نقش‌ها بعد از دریافت AppUserId
    // ============================================================
    useEffect(() => {
        if (appUserId) {
            fetchUserRoles();
        }
    }, [appUserId]);

    // ============================================================
    // دریافت نقش‌های قابل تخصیص به مرکز
    // ============================================================
    const fetchAssignableRoles = async (markazId) => {
        if (!markazId) {
            setAssignableRoles([]);
            return;
        }

        try {
            const response = await api.get(`/RoleAssignment/assignable-roles/${markazId}`);
            if (response.data?.success) {
                setAssignableRoles(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت نقش‌های قابل تخصیص:', error);
            toast.error('خطا در دریافت نقش‌های قابل تخصیص');
        }
    };

    // ============================================================
    // دریافت نقش‌های اختصاص‌یافته به مرکز (برای والد)
    // ============================================================
    const fetchAssignedRoles = async (markazId) => {
        if (!markazId) {
            setAssignedRoles([]);
            return;
        }

        try {
            const response = await api.get(`/RoleAssignment/assigned-roles/${markazId}`);
            if (response.data?.success) {
                setAssignedRoles(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت نقش‌های اختصاص‌یافته:', error);
        }
    };

    // ============================================================
    // تغییر مرکز در مودال ایجاد
    // ============================================================
    const handleCreateMarkazChange = (value) => {
        setCreateForm({
            ...createForm,
            markazId: value,
            roleId: '',
            parentUserRoleId: ''
        });
        if (value) {
            fetchAssignableRoles(value);
            fetchAssignedRoles(value);
        } else {
            setAssignableRoles([]);
            setAssignedRoles([]);
        }
    };

    // ============================================================
    // ایجاد نقش جدید
    // ============================================================
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            const payload = {
                userId: parseInt(appUserId),
                roleId: parseInt(createForm.roleId),
                markazId: parseInt(createForm.markazId),
                isDefault: createForm.isDefault,
                parentUserRoleId: createForm.parentUserRoleId ? parseInt(createForm.parentUserRoleId) : null
            };
            const response = await api.post('/RoleAssignment/create', payload);

            if (response.data?.success) {
                toast.success('نقش با موفقیت به کاربر اختصاص داده شد');
                setShowCreateModal(false);
                setCreateForm({
                    markazId: '',
                    roleId: '',
                    parentUserRoleId: '',
                    isDefault: false
                });
                setAssignableRoles([]);
                setAssignedRoles([]);
                fetchUserRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در اختصاص نقش');
        } finally {
            setCreating(false);
        }
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = (assignment) => {
        setSelectedAssignment(assignment);
        setEditForm({
            isDefault: assignment.isDefault || false,
            parentUserRoleId: assignment.parentUserRoleId || ''
        });
        setShowEditModal(true);
    };

    // ============================================================
    // دریافت نقش‌های اختصاص‌یافته به مرکز برای ویرایش
    // ============================================================
    const fetchAssignedRolesForEdit = async () => {
        if (selectedAssignment?.markazId) {
            await fetchAssignedRoles(selectedAssignment.markazId);
        }
    };

    useEffect(() => {
        if (showEditModal && selectedAssignment) {
            fetchAssignedRolesForEdit();
        }
    }, [showEditModal, selectedAssignment]);

    // ============================================================
    // ویرایش نقش
    // ============================================================
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditing(true);

        try {
            const payload = {
                isDefault: editForm.isDefault,
                parentUserRoleId: editForm.parentUserRoleId ? parseInt(editForm.parentUserRoleId) : null
            };

            const response = await api.put(`/RoleAssignment/update/${selectedAssignment.id}`, payload);

            if (response.data?.success) {
                toast.success('نقش با موفقیت ویرایش شد');
                setShowEditModal(false);
                setSelectedAssignment(null);
                fetchUserRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش نقش');
        } finally {
            setEditing(false);
        }
    };

    // ============================================================
    // حذف نقش
    // ============================================================
    const handleDelete = async (assignmentId, roleName) => {
        if (!window.confirm(`آیا از حذف نقش "${roleName}" از این کاربر مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/RoleAssignment/delete/${assignmentId}`);
            if (response.data?.success) {
                toast.success('نقش با موفقیت از کاربر حذف شد');
                fetchUserRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف نقش');
        }
    };

    // ============================================================
    // تنظیم نقش پیش‌فرض
    // ============================================================
    const handleSetDefault = async (assignmentId) => {
        try {
            const response = await api.patch(`/RoleAssignment/set-default/${assignmentId}`);
            if (response.data?.success) {
                toast.success('نقش به‌عنوان پیش‌فرض تنظیم شد');
                fetchUserRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تنظیم نقش پیش‌فرض');
        }
    };

    // ============================================================
    // بستن مودال‌ها
    // ============================================================
    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedAssignment(null);
        setCreateForm({
            markazId: '',
            roleId: '',
            parentUserRoleId: '',
            isDefault: false
        });
        setEditForm({
            isDefault: false,
            parentUserRoleId: ''
        });
        setAssignableRoles([]);
        setAssignedRoles([]);
    };

    // ============================================================
    // تابع کمکی برای نمایش نام مرکز
    // ============================================================
    const getMarkazDisplayName = (markazId) => {
        const markaz = markazList?.find(m => m.id === markazId);
        if (!markaz) return `مرکز ${markazId}`;
        if (markaz.level === 2) return 'سازمان مرکزی';
        if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`;
        return markaz.naamMarkaz || `مرکز ${markazId}`;
    };

    // ============================================================
    // تابع کمکی برای نمایش نام نقش
    // ============================================================
    const getRoleDisplayName = (role) => {
        let name = role.roleName || `نقش ${role.roleId}`;
        if (role.isAdmin) {
            name += ' 👑';
        }
        return name;
    };

    // ============================================================
    // تابع کمکی برای نمایش عنوان صفحه
    // ============================================================
    const getPageTitle = () => {
        switch (userType) {
            case 'karmand':
                return 'کارمند';
            case 'ostad':
                return 'استاد';
            case 'daneshjoo':
                return 'دانشجو';
            case 'admin':
                return 'ادمین';
            default:
                return 'کاربر';
        }
    };

    const getUserFullName = () => {
        if (!userInfo) return '';
        const firstName = userInfo.firstName || userInfo.naam || '';
        const lastName = userInfo.lastName || userInfo.naameKhanevadeghi || '';
        return `${firstName} ${lastName}`.trim() || userInfo.userName || '';
    };

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate(-1)}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">
                        مدیریت نقش‌های {getPageTitle()}
                    </h4>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <i className="bi bi-plus-circle me-2"></i>
                    اختصاص نقش جدید
                </button>
            </div>

            {/* ============================================================
                اطلاعات کاربر
                ============================================================ */}
            {userInfo && (
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-4">
                                <small className="text-muted">نام کاربری</small>
                                <p className="fw-bold">{userInfo.userName || '-'}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">نام و نام خانوادگی</small>
                                <p className="fw-bold">{getUserFullName() || '-'}</p>
                            </div>
                            <div className="col-md-4">
                                <small className="text-muted">نوع کاربر</small>
                                <p className="fw-bold">
                                    <span className="badge bg-info">{getPageTitle()}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                جدول نقش‌های کاربر
                ============================================================ */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>
            ) : (
                <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <span className="text-muted">
                            تعداد نقش‌ها: {roles.length}
                        </span>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>نقش</th>
                                    <th>کد نقش</th>
                                    <th>مرکز</th>
                                    <th>پیش‌فرض</th>
                                    <th>مدیر بالادستی</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted">
                                            این کاربر هیچ نقشی ندارد
                                        </td>
                                    </tr>
                                ) : (
                                    roles.map((role, index) => (
                                        <tr key={role.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <strong>{getRoleDisplayName(role)}</strong>
                                            </td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {role.codeRole}
                                                </span>
                                            </td>
                                            <td>{getMarkazDisplayName(role.markazId)}</td>
                                            <td>
                                                {role.isDefault ? (
                                                    <span className="badge bg-success">
                                                        <i className="bi bi-check-circle me-1"></i>
                                                        پیش‌فرض
                                                    </span>
                                                ) : (
                                                    <button
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() => handleSetDefault(role.id)}
                                                        title="تنظیم به‌عنوان پیش‌فرض"
                                                    >
                                                        <i className="bi bi-star"></i>
                                                    </button>
                                                )}
                                            </td>
                                            <td>
                                                {role.parentUserName || '-'}
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <PermissionWrapper permission="RoleAssignment.Update">
                                                        <button
                                                            className="btn btn-warning"
                                                            onClick={() => openEditModal(role)}
                                                            title="ویرایش"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                    </PermissionWrapper>
                                                    <PermissionWrapper permission="RoleAssignment.Delete">
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleDelete(role.id, role.roleName)}
                                                            title="حذف"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </PermissionWrapper>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ============================================================
                مودال ایجاد نقش جدید
                ============================================================ */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleCreateSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">اختصاص نقش جدید به کاربر</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    {/* انتخاب مرکز */}
                                    <div className="mb-3">
                                        <MarkazSelector
                                            label="مرکز *"
                                            value={createForm.markazId}
                                            onChange={handleCreateMarkazChange}
                                            required={true}
                                            placeholder="انتخاب مرکز..."
                                        />
                                    </div>

                                    {/* انتخاب نقش */}
                                    <div className="mb-3">
                                        <label className="form-label">نقش *</label>
                                        <select
                                            className="form-select"
                                            value={createForm.roleId}
                                            onChange={(e) => setCreateForm({ ...createForm, roleId: e.target.value })}
                                            required
                                            disabled={!createForm.markazId || assignableRoles.length === 0}
                                        >
                                            <option value="">انتخاب نقش...</option>
                                            {assignableRoles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.name} {role.isAdmin ? '👑' : ''}
                                                    {role.isUniquePerMarkaz && (
                                                        <span className="text-warning ms-1">(یکتا)</span>
                                                    )}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.markazId && assignableRoles.length === 0 && (
                                            <small className="text-warning">
                                                هیچ نقشی برای این مرکز قابل تخصیص نیست
                                            </small>
                                        )}
                                    </div>

                                    {/* انتخاب والد */}
                                    <div className="mb-3">
                                        <label className="form-label">مدیر بالادستی (والد)</label>
                                        <select
                                            className="form-select"
                                            value={createForm.parentUserRoleId}
                                            onChange={(e) => setCreateForm({ ...createForm, parentUserRoleId: e.target.value })}
                                            disabled={!createForm.markazId || assignedRoles.length === 0}
                                        >
                                            <option value="">بدون والد</option>
                                            {assignedRoles.map(role => (
                                                <option key={role.id} value={role.id}>
                                                    {role.userFullName || role.userName} - {role.roleName}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.markazId && assignedRoles.length === 0 && (
                                            <small className="text-muted">
                                                هیچ نقشی در این مرکز اختصاص داده نشده است
                                            </small>
                                        )}
                                    </div>

                                    {/* نقش پیش‌فرض */}
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={createForm.isDefault}
                                                onChange={(e) => setCreateForm({ ...createForm, isDefault: e.target.checked })}
                                            />
                                            <label className="form-check-label">
                                                این نقش به‌عنوان نقش پیش‌فرض کاربر باشد
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeModals}
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={creating}
                                    >
                                        {creating ? 'در حال ثبت...' : 'اختصاص نقش'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                مودال ویرایش نقش
                ============================================================ */}
            {showEditModal && selectedAssignment && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        ویرایش نقش: {selectedAssignment.roleName}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    {/* اطلاعات فقط نمایشی */}
                                    <div className="mb-3">
                                        <label className="form-label">مرکز</label>
                                        <p className="form-control-plaintext">
                                            {getMarkazDisplayName(selectedAssignment.markazId)}
                                        </p>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">نقش</label>
                                        <p className="form-control-plaintext">
                                            {getRoleDisplayName(selectedAssignment)}
                                        </p>
                                    </div>

                                    <hr />

                                    {/* انتخاب والد */}
                                    <div className="mb-3">
                                        <label className="form-label">مدیر بالادستی (والد)</label>
                                        <select
                                            className="form-select"
                                            value={editForm.parentUserRoleId}
                                            onChange={(e) => setEditForm({ ...editForm, parentUserRoleId: e.target.value })}
                                        >
                                            <option value="">بدون والد</option>
                                            {assignedRoles
                                                .filter(r => r.id !== selectedAssignment.id)
                                                .map(role => (
                                                    <option key={role.id} value={role.id}>
                                                        {role.userFullName || role.userName} - {role.roleName}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    {/* نقش پیش‌فرض */}
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={editForm.isDefault}
                                                onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                                            />
                                            <label className="form-check-label">
                                                این نقش به‌عنوان نقش پیش‌فرض کاربر باشد
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeModals}
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={editing}
                                    >
                                        {editing ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                پس‌زمینه مودال‌ها
                ============================================================ */}
            {(showCreateModal || showEditModal) && (
                <div
                    className="modal-backdrop show"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={closeModals}
                ></div>
            )}
        </div>
    );
}