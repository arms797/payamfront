import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';

export default function RolePermissionList() {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [rolePermissions, setRolePermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [selectedPermissionId, setSelectedPermissionId] = useState('');
    const [assigning, setAssigning] = useState(false);

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
            setRolePermissions(rpRes.data?.data || []);
        } catch (error) {
            toast.error('خطا در دریافت داده‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                setSelectedRoleId('');
                setSelectedPermissionId('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در تخصیص مجوز');
        } finally {
            setAssigning(false);
        }
    };

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

    const getRoleName = (id) => roles.find(r => r.id === id)?.name || id;
    const getPermissionName = (id) => permissions.find(p => p.id === id)?.name || id;

    return (
        <div className="container-fluid">
            <h4 className="mb-4">تخصیص مجوز به نقش‌ها</h4>

            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                            <label className="form-label">انتخاب نقش</label>
                            <select className="form-select" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
                                <option value="">انتخاب نقش...</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label">انتخاب مجوز</label>
                            <select className="form-select" value={selectedPermissionId} onChange={(e) => setSelectedPermissionId(e.target.value)}>
                                <option value="">انتخاب مجوز...</option>
                                {permissions.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <button className="btn btn-primary w-100" onClick={handleAssign} disabled={assigning}>
                                {assigning ? 'در حال تخصیص...' : 'تخصیص مجوز'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr><th>#</th><th>نقش</th><th>مجوز</th><th>وضعیت</th><th>عملیات</th></tr>
                        </thead>
                        <tbody>
                            {rolePermissions.length === 0 ? (
                                <tr><td colSpan="5" className="text-center text-muted">هیچ مجوزی به نقش‌ها اختصاص داده نشده است</td></tr>
                            ) : (
                                rolePermissions.map((rp, index) => (
                                    <tr key={rp.id}>
                                        <td>{index + 1}</td>
                                        <td><strong>{getRoleName(rp.roleId)}</strong></td>
                                        <td><code>{getPermissionName(rp.permissionId)}</code></td>
                                        <td><span className={`badge ${rp.vazeeat ? 'bg-success' : 'bg-danger'}`}>{rp.vazeeat ? 'فعال' : 'غیرفعال'}</span></td>
                                        <td>
                                            <PermissionWrapper permission="RolePermission.Delete">
                                                <button className="btn btn-danger btn-sm" onClick={() => handleRemove(rp.roleId, rp.permissionId)}>
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
            )}
        </div>
    );
}