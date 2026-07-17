import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';

export default function RoleList() {
    const { hasPermission } = useAuth();
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        codeRole: '',
        vazeeyat: true,
        emza: false
    });

    // ============================================================
    // بررسی مجوز مشاهده
    // ============================================================
    if (!hasPermission('Role.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت لیست نقش‌ها
    // ============================================================
    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Role/list');
            if (response.data?.data) {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error('خطا در دریافت نقش‌ها:', error);
            toast.error('خطا در دریافت لیست نقش‌ها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    // ============================================================
    // فیلتر کردن نقش‌ها
    // ============================================================
    const filteredRoles = roles.filter(r =>
        r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.codeRole?.toString().includes(searchTerm)
    );

    // ============================================================
    // ایجاد نقش جدید
    // ============================================================
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/Role/create', formData);
            if (response.data?.success) {
                toast.success('نقش با موفقیت ایجاد شد');
                setShowCreateModal(false);
                setFormData({ name: '', codeRole: '', vazeeyat: true, emza: false });
                fetchRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ایجاد نقش');
        }
    };

    // ============================================================
    // ویرایش نقش
    // ============================================================
    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/Role/update/${selectedRole.id}`, formData);
            if (response.data?.success) {
                toast.success('نقش با موفقیت ویرایش شد');
                setShowEditModal(false);
                setSelectedRole(null);
                fetchRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش نقش');
        }
    };

    // ============================================================
    // حذف نقش
    // ============================================================
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف نقش "${name}" مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/Role/delete/${id}`);
            if (response.data?.success) {
                toast.success('نقش با موفقیت حذف شد');
                fetchRoles();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف نقش');
        }
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = (role) => {
        setSelectedRole(role);
        setFormData({
            name: role.name || '',
            codeRole: role.codeRole || '',
            vazeeyat: role.vazeeyat ?? true,
            emza: role.emza ?? false
        });
        setShowEditModal(true);
    };

    // ============================================================
    // بستن مودال‌ها
    // ============================================================
    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedRole(null);
        setFormData({ name: '', codeRole: '', vazeeyat: true, emza: false });
    };

    return (
        <div className="container-fluid">
            {/* هدر */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>مدیریت نقش‌ها</h4>
                <PermissionWrapper permission="Role.Create">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        نقش جدید
                    </button>
                </PermissionWrapper>
            </div>

            {/* جستجو */}
            <div className="row mb-3">
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="جستجوی نقش..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-8 text-end">
                    <span className="badge bg-secondary">
                        تعداد نقش‌ها: {filteredRoles.length}
                    </span>
                </div>
            </div>

            {/* جدول نقش‌ها */}
            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">در حال بارگذاری...</span>
                    </div>
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>نام نقش</th>
                                <th>کد نقش</th>
                                <th>وضعیت</th>
                                <th>نیاز به امضا</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRoles.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted">
                                        هیچ نقشی یافت نشد
                                    </td>
                                </tr>
                            ) : (
                                filteredRoles.map((role, index) => (
                                    <tr key={role.id}>
                                        <td>{index + 1}</td>
                                        <td><strong>{role.name}</strong></td>
                                        <td><code>{role.codeRole}</code></td>
                                        <td>
                                            <span className={`badge ${role.vazeeyat ? 'bg-success' : 'bg-danger'}`}>
                                                {role.vazeeyat ? 'فعال' : 'غیرفعال'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${role.emza ? 'bg-info' : 'bg-secondary'}`}>
                                                {role.emza ? 'نیاز دارد' : 'نیاز ندارد'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <PermissionWrapper permission="Role.Update">
                                                    <button
                                                        className="btn btn-warning"
                                                        onClick={() => openEditModal(role)}
                                                        title="ویرایش"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                </PermissionWrapper>
                                                <PermissionWrapper permission="Role.Delete">
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDelete(role.id, role.name)}
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
            )}

            {/* ============================================================
                مودال ایجاد نقش
                ============================================================ */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleCreate}>
                                <div className="modal-header">
                                    <h5 className="modal-title">ایجاد نقش جدید</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">نام نقش *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="مثلاً مدیر سیستم"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">کد نقش *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.codeRole}
                                            onChange={(e) => setFormData({ ...formData, codeRole: e.target.value })}
                                            required
                                            placeholder="مثلاً 1"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={formData.vazeeyat}
                                                onChange={(e) => setFormData({ ...formData, vazeeyat: e.target.checked })}
                                            />
                                            <label className="form-check-label">فعال</label>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={formData.emza}
                                                onChange={(e) => setFormData({ ...formData, emza: e.target.checked })}
                                            />
                                            <label className="form-check-label">نیاز به امضا</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModals}>
                                        انصراف
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        ایجاد
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
            {showEditModal && selectedRole && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleEdit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">ویرایش نقش: {selectedRole.name}</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">نام نقش *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">کد نقش *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.codeRole}
                                            onChange={(e) => setFormData({ ...formData, codeRole: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={formData.vazeeyat}
                                                onChange={(e) => setFormData({ ...formData, vazeeyat: e.target.checked })}
                                            />
                                            <label className="form-check-label">فعال</label>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={formData.emza}
                                                onChange={(e) => setFormData({ ...formData, emza: e.target.checked })}
                                            />
                                            <label className="form-check-label">نیاز به امضا</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModals}>
                                        انصراف
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        ذخیره تغییرات
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}