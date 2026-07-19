import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';

export default function RolePermissionList() {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [allRolePermissions, setAllRolePermissions] = useState([]);
    const [filteredRolePermissions, setFilteredRolePermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedResource, setSelectedResource] = useState('');
    const [selectedPermissionId, setSelectedPermissionId] = useState('');
    const [assigning, setAssigning] = useState(false);

    // ============================================================
    // Stateهای صفحه‌بندی
    // ============================================================
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalItems, setTotalItems] = useState(0);

    // ============================================================
    // اگر کاربر مجوز مشاهده ندارد، پیغام نمایش بده
    // ============================================================
    if (!hasPermission('RolePermission.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت داده‌ها
    // ============================================================
    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes, rpRes] = await Promise.all([
                api.get('/Role/list'),
                api.get('/Permission/list'),
                api.get('/RolePermission/list')
            ]);
            setRoles(rolesRes.data?.data || []);
            setPermissions(permsRes.data?.data || []);
            setAllRolePermissions(rpRes.data?.data || []);
            setCurrentPage(1);
        } catch (error) {
            toast.error('خطا در دریافت داده‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ============================================================
    // 🔥 فیلتر کردن بر اساس نقش و منبع (Resource)
    // ============================================================
    useEffect(() => {
        let filtered = [...allRolePermissions];

        // 1️⃣ فیلتر بر اساس نقش
        if (selectedRoleId) {
            filtered = filtered.filter(rp => rp.roleId === parseInt(selectedRoleId));
        }

        // 2️⃣ 🔥 فیلتر بر اساس منبع (Resource)
        if (selectedResource) {
            // پیدا کردن PermissionIdهای مربوط به منبع انتخاب‌شده
            const permissionIds = permissions
                .filter(p => p.resource === selectedResource)
                .map(p => p.id);

            filtered = filtered.filter(rp => permissionIds.includes(rp.permissionId));
        }

        setFilteredRolePermissions(filtered);
        setTotalItems(filtered.length);
        setCurrentPage(1);
    }, [allRolePermissions, selectedRoleId, selectedResource, permissions]);

    // ============================================================
    // داده‌های صفحه‌بندی شده
    // ============================================================
    const paginatedData = filteredRolePermissions.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const totalPages = Math.ceil(totalItems / pageSize);

    // ============================================================
    // استخراج منابع (Resources) یکتا از مجوزها
    // ============================================================
    const resources = [...new Set(permissions.map(p => p.resource).filter(Boolean))].sort();

    // ============================================================
    // مجوزهای فیلتر شده بر اساس منبع انتخاب شده
    // ============================================================
    const filteredPermissions = permissions.filter(p =>
        p.resource === selectedResource && p.isActive
    );

    // ============================================================
    // تخصیص مجوز به نقش
    // ============================================================
    const handleAssign = async () => {
        if (!selectedRoleId || !selectedPermissionId) {
            toast.warning('لطفاً نقش و مجوز را انتخاب کنید');
            return;
        }
        setAssigning(true);
        try {
            const response = await api.post('/RolePermission/assign', {
                roleId: parseInt(selectedRoleId),
                permissionId: parseInt(selectedPermissionId),
                vazeeat: true
            });
            if (response.data?.success) {
                toast.success('مجوز با موفقیت به نقش اختصاص داده شد');
                fetchData();
                setSelectedPermissionId('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تخصیص مجوز');
        } finally {
            setAssigning(false);
        }
    };

    // ============================================================
    // حذف مجوز از نقش
    // ============================================================
    const handleRemove = async (roleId, permissionId) => {
        if (!window.confirm('آیا از حذف این مجوز از نقش مطمئن هستید؟')) return;
        try {
            const response = await api.delete('/RolePermission/remove', {
                data: { roleId, permissionId }
            });
            if (response.data?.success) {
                toast.success('مجوز با موفقیت از نقش حذف شد');
                fetchData();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف مجوز');
        }
    };

    // ============================================================
    // تغییر منبع
    // ============================================================
    const handleResourceChange = (resource) => {
        setSelectedResource(resource);
        setSelectedPermissionId('');
    };

    const getRoleName = (id) => roles.find(r => r.id === id)?.name || id;
    const getPermissionName = (id) => permissions.find(p => p.id === id)?.name || id;

    return (
        <div className="container-fluid">
            <h4 className="mb-4">تخصیص مجوز به نقش‌ها</h4>

            {/* ============================================================
                بخش تخصیص مجوز
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        {/* انتخاب نقش */}
                        <div className="col-md-3">
                            <label className="form-label">انتخاب نقش</label>
                            <select
                                className="form-select"
                                value={selectedRoleId}
                                onChange={(e) => {
                                    setSelectedRoleId(e.target.value);
                                    setSelectedResource('');
                                    setSelectedPermissionId('');
                                }}
                            >
                                <option value="">همه نقش‌ها</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* انتخاب منبع (Resource) */}
                        <div className="col-md-3">
                            <label className="form-label">انتخاب منبع</label>
                            <select
                                className="form-select"
                                value={selectedResource}
                                onChange={(e) => handleResourceChange(e.target.value)}
                                disabled={!selectedRoleId}
                            >
                                <option value="">انتخاب منبع...</option>
                                {resources.map(res => (
                                    <option key={res} value={res}>{res}</option>
                                ))}
                            </select>
                        </div>

                        {/* انتخاب مجوز (بر اساس منبع) */}
                        <div className="col-md-3">
                            <label className="form-label">انتخاب مجوز</label>
                            <select
                                className="form-select"
                                value={selectedPermissionId}
                                onChange={(e) => setSelectedPermissionId(e.target.value)}
                                disabled={!selectedResource}
                            >
                                <option value="">انتخاب مجوز...</option>
                                {filteredPermissions.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* دکمه تخصیص */}
                        <div className="col-md-3">
                            <button
                                className="btn btn-primary w-100"
                                onClick={handleAssign}
                                disabled={assigning || !selectedRoleId || !selectedPermissionId}
                            >
                                {assigning ? 'در حال تخصیص...' : 'تخصیص مجوز'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                جدول مجوزهای اختصاص‌یافته
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
                            {selectedRoleId
                                ? `مجوزهای نقش "${getRoleName(parseInt(selectedRoleId))}"`
                                : 'همه مجوزهای اختصاص‌یافته'}
                            {selectedResource && ` - منبع: ${selectedResource}`}
                            {` (${totalItems} مورد)`}
                        </span>
                        <span className="text-muted small">
                            نمایش {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} از {totalItems}
                        </span>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>نقش</th>
                                    <th>مجوز</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center text-muted">
                                            {selectedRoleId
                                                ? `هیچ مجوزی به نقش "${getRoleName(parseInt(selectedRoleId))}" اختصاص داده نشده است`
                                                : 'هیچ مجوزی به نقش‌ها اختصاص داده نشده است'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedData.map((rp, index) => (
                                        <tr key={rp.id}>
                                            <td>{(currentPage - 1) * pageSize + index + 1}</td>
                                            <td><strong>{getRoleName(rp.roleId)}</strong></td>
                                            <td><code>{getPermissionName(rp.permissionId)}</code></td>
                                            <td>
                                                <span className={`badge ${rp.vazeeat ? 'bg-success' : 'bg-danger'}`}>
                                                    {rp.vazeeat ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </td>
                                            <td>
                                                <PermissionWrapper permission="RolePermission.Delete">
                                                    <button
                                                        className="btn btn-danger btn-sm"
                                                        onClick={() => handleRemove(rp.roleId, rp.permissionId)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </PermissionWrapper>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* ============================================================
                        صفحه‌بندی
                        ============================================================ */}
                    {totalPages > 1 && (
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(p => p - 1)}>
                                        قبلی
                                    </button>
                                </li>
                                {[...Array(totalPages).keys()].map(num => (
                                    <li key={num + 1} className={`page-item ${currentPage === num + 1 ? 'active' : ''}`}>
                                        <button className="page-link" onClick={() => setCurrentPage(num + 1)}>
                                            {num + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setCurrentPage(p => p + 1)}>
                                        بعدی
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}
        </div>
    );
}