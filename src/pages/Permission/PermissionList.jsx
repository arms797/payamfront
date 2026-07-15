import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';

export default function PermissionList() {
    const { hasPermission } = useAuth();
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPermission, setSelectedPermission] = useState(null);
    const [formData, setFormData] = useState({
        resource: '',
        action: '',
        name: '',
        description: '',
        isActive: true
    });

    // ============================================================
    // اگر کاربر مجوز مشاهده ندارد، پیغام نمایش بده
    // ============================================================
    if (!hasPermission('Permission.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت لیست مجوزها
    // ============================================================
    const fetchPermissions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Permission/list');
            if (response.data?.data) {
                setPermissions(response.data.data);
            }
        } catch (error) {
            console.error('خطا در دریافت مجوزها:', error);
            toast.error('خطا در دریافت لیست مجوزها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPermissions();
    }, []);

    // ============================================================
    // فیلتر کردن مجوزها بر اساس جستجو
    // ============================================================
    const filteredPermissions = permissions.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ============================================================
    // ایجاد مجوز جدید
    // ============================================================
    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/Permission/create', formData);
            if (response.data?.success) {
                toast.success('مجوز با موفقیت ایجاد شد');
                setShowCreateModal(false);
                setFormData({ resource: '', action: '', name: '', description: '', isActive: true });
                fetchPermissions();
            }
        } catch (error) {
            console.error('خطا در ایجاد مجوز:', error);
            toast.error(error.response?.data?.message || 'خطا در ایجاد مجوز');
        }
    };

    // ============================================================
    // ویرایش مجوز
    // ============================================================
    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/Permission/update/${selectedPermission.id}`, formData);
            if (response.data?.success) {
                toast.success('مجوز با موفقیت ویرایش شد');
                setShowEditModal(false);
                setSelectedPermission(null);
                fetchPermissions();
            }
        } catch (error) {
            console.error('خطا در ویرایش مجوز:', error);
            toast.error(error.response?.data?.message || 'خطا در ویرایش مجوز');
        }
    };

    // ============================================================
    // حذف مجوز
    // ============================================================
    const handleDelete = async (id, name) => {
        if (!window.confirm(`آیا از حذف مجوز "${name}" مطمئن هستید؟`)) return;

        try {
            const response = await api.delete(`/Permission/delete/${id}`);
            if (response.data?.success) {
                toast.success('مجوز با موفقیت حذف شد');
                fetchPermissions();
            }
        } catch (error) {
            console.error('خطا در حذف مجوز:', error);
            toast.error(error.response?.data?.message || 'خطا در حذف مجوز');
        }
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = (permission) => {
        setSelectedPermission(permission);
        setFormData({
            resource: permission.resource || '',
            action: permission.action || '',
            name: permission.name || '',
            description: permission.description || '',
            isActive: permission.isActive ?? true
        });
        setShowEditModal(true);
    };

    // ============================================================
    // بستن مودال‌ها
    // ============================================================
    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedPermission(null);
        setFormData({ resource: '', action: '', name: '', description: '', isActive: true });
    };

    return (
        <div className="container-fluid">
            {/* هدر */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>مدیریت مجوزها</h4>
                <PermissionWrapper permission="Permission.Create">
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        مجوز جدید
                    </button>
                </PermissionWrapper>
            </div>

            {/* جستجو */}
            <div className="row mb-3">
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-search"></i>
                        </span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="جستجوی مجوز..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-8 text-end">
                    <span className="badge bg-secondary">
                        تعداد مجوزها: {filteredPermissions.length}
                    </span>
                </div>
            </div>

            {/* جدول مجوزها */}
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
                                <th>منبع</th>
                                <th>عملیات</th>
                                <th>نام مجوز</th>
                                <th>توضیحات</th>
                                <th>وضعیت</th>
                                <th>تاریخ ایجاد</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPermissions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center text-muted">
                                        هیچ مجوزی یافت نشد
                                    </td>
                                </tr>
                            ) : (
                                filteredPermissions.map((p, index) => (
                                    <tr key={p.id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <code>{p.resource}</code>
                                        </td>
                                        <td>
                                            <code>{p.action}</code>
                                        </td>
                                        <td>
                                            <strong>{p.name}</strong>
                                        </td>
                                        <td>{p.description || '-'}</td>
                                        <td>
                                            <span className={`badge ${p.isActive ? 'bg-success' : 'bg-danger'}`}>
                                                {p.isActive ? 'فعال' : 'غیرفعال'}
                                            </span>
                                        </td>
                                        <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString('fa-IR') : '-'}</td>
                                        <td>
                                            <div className="btn-group btn-group-sm">
                                                <PermissionWrapper permission="Permission.Update">
                                                    <button
                                                        className="btn btn-warning"
                                                        onClick={() => openEditModal(p)}
                                                        title="ویرایش"
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>
                                                </PermissionWrapper>
                                                <PermissionWrapper permission="Permission.Delete">
                                                    <button
                                                        className="btn btn-danger"
                                                        onClick={() => handleDelete(p.id, p.name)}
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
                مودال ایجاد مجوز
                ============================================================ */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleCreate}>
                                <div className="modal-header">
                                    <h5 className="modal-title">ایجاد مجوز جدید</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">منبع (Resource) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.resource}
                                            onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                                            required
                                            placeholder="مثلاً Ostad"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">عملیات (Action) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.action}
                                            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                            required
                                            placeholder="مثلاً Create"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">نام مجوز (Name) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            placeholder="مثلاً Ostad.Create"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">توضیحات</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="توضیحات اختیاری"
                                        ></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label className="form-check-label">فعال</label>
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
                مودال ویرایش مجوز
                ============================================================ */}
            {showEditModal && selectedPermission && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleEdit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">ویرایش مجوز: {selectedPermission.name}</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">منبع (Resource) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.resource}
                                            onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">عملیات (Action) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.action}
                                            onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">نام مجوز (Name) *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">توضیحات</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input
                                                type="checkbox"
                                                className="form-check-input"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            />
                                            <label className="form-check-label">فعال</label>
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