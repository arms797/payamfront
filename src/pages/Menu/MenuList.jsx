import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';

export default function MenuList() {
    const { hasPermission } = useAuth();
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        parentId: '',
        path: '',
        icon: '',
        permissionName: '',
        order: 0,
        vazeeat: true
    });

    // ============================================================
    // اگر کاربر مجوز مشاهده ندارد، پیغام نمایش بده
    // ============================================================
    if (!hasPermission('Menu.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    const fetchMenus = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Menu/list');
            if (response.data?.data) {
                setMenus(response.data.data);
            }
        } catch (error) {
            toast.error('خطا در دریافت لیست منوها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMenus();
    }, []);

    // ============================================================
    // 🔥 جستجو در نام منو و نام والد
    // ============================================================
    const filteredMenus = menus.filter(m => {
        // پیدا کردن نام والد
        const parent = menus.find(p => p.id === m.parentId);
        const parentTitle = parent?.title || '';

        const searchLower = searchTerm.toLowerCase();

        return m.title?.toLowerCase().includes(searchLower) ||
            m.path?.toLowerCase().includes(searchLower) ||
            m.permissionName?.toLowerCase().includes(searchLower) ||
            parentTitle.toLowerCase().includes(searchLower);
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('/Menu/create', {
                ...formData,
                parentId: formData.parentId ? parseInt(formData.parentId) : null
            });
            if (response.data?.success) {
                toast.success('منو با موفقیت ایجاد شد');
                setShowCreateModal(false);
                setFormData({ title: '', parentId: '', path: '', icon: '', permissionName: '', order: 0, vazeeat: true });
                fetchMenus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ایجاد منو');
        }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.put(`/Menu/update/${selectedMenu.id}`, {
                ...formData,
                parentId: formData.parentId ? parseInt(formData.parentId) : null
            });
            if (response.data?.success) {
                toast.success('منو با موفقیت ویرایش شد');
                setShowEditModal(false);
                setSelectedMenu(null);
                fetchMenus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش منو');
        }
    };

    const handleDelete = async (id, title) => {
        if (!window.confirm(`آیا از حذف منو "${title}" مطمئن هستید؟`)) return;
        try {
            const response = await api.delete(`/Menu/delete/${id}`);
            if (response.data?.success) {
                toast.success('منو با موفقیت حذف شد');
                fetchMenus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف منو');
        }
    };

    const openEditModal = (menu) => {
        setSelectedMenu(menu);
        setFormData({
            title: menu.title || '',
            parentId: menu.parentId || '',
            path: menu.path || '',
            icon: menu.icon || '',
            permissionName: menu.permissionName || '',
            order: menu.order || 0,
            vazeeat: menu.vazeeat ?? true
        });
        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedMenu(null);
        setFormData({ title: '', parentId: '', path: '', icon: '', permissionName: '', order: 0, vazeeat: true });
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>مدیریت منوها</h4>
                <PermissionWrapper permission="Menu.Create">
                    <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                        <i className="bi bi-plus-circle me-2"></i> منوی جدید
                    </button>
                </PermissionWrapper>
            </div>

            <div className="row mb-3">
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text"><i className="bi bi-search"></i></span>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="جستجو در عنوان منو و والد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="col-md-8 text-end">
                    <span className="badge bg-secondary">
                        تعداد منوها: {filteredMenus.length}
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr><th>#</th><th>عنوان</th><th>والد</th><th>مسیر</th><th>آیکون</th><th>مجوز</th><th>ترتیب</th><th>وضعیت</th><th>عملیات</th></tr>
                        </thead>
                        <tbody>
                            {filteredMenus.length === 0 ? (
                                <tr><td colSpan="9" className="text-center text-muted">هیچ منویی یافت نشد</td></tr>
                            ) : (
                                filteredMenus.map((m, index) => {
                                    const parent = menus.find(p => p.id === m.parentId);
                                    return (
                                        <tr key={m.id}>
                                            <td>{index + 1}</td>
                                            <td><strong>{m.title}</strong></td>
                                            <td>{parent?.title || '-'}</td>
                                            <td><code>{m.path || '-'}</code></td>
                                            <td>{m.icon && <i className={`bi ${m.icon}`}></i>}</td>
                                            <td>{m.permissionName || '-'}</td>
                                            <td>{m.order}</td>
                                            <td><span className={`badge ${m.vazeeat ? 'bg-success' : 'bg-danger'}`}>{m.vazeeat ? 'فعال' : 'غیرفعال'}</span></td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <PermissionWrapper permission="Menu.Update">
                                                        <button className="btn btn-warning" onClick={() => openEditModal(m)}><i className="bi bi-pencil"></i></button>
                                                    </PermissionWrapper>
                                                    <PermissionWrapper permission="Menu.Delete">
                                                        <button className="btn btn-danger" onClick={() => handleDelete(m.id, m.title)}><i className="bi bi-trash"></i></button>
                                                    </PermissionWrapper>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============================================================
                مودال ایجاد منو
                ============================================================ */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleCreate}>
                                <div className="modal-header">
                                    <h5 className="modal-title">ایجاد منوی جدید</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3"><label className="form-label">عنوان *</label><input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                                    <div className="mb-3"><label className="form-label">منوی والد</label>
                                        <select className="form-select" value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}>
                                            <option value="">بدون والد</option>
                                            {menus.filter(m => m.id !== selectedMenu?.id).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3"><label className="form-label">مسیر</label><input type="text" className="form-control" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder="/dashboard/ostad" /></div>
                                    <div className="mb-3"><label className="form-label">آیکون</label><input type="text" className="form-control" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} placeholder="bi-people" /></div>
                                    <div className="mb-3"><label className="form-label">مجوز مورد نیاز</label><input type="text" className="form-control" value={formData.permissionName} onChange={(e) => setFormData({ ...formData, permissionName: e.target.value })} placeholder="Ostad.View" /></div>
                                    <div className="mb-3"><label className="form-label">ترتیب</label><input type="number" className="form-control" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" checked={formData.vazeeat} onChange={(e) => setFormData({ ...formData, vazeeat: e.target.checked })} />
                                            <label className="form-check-label">فعال</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModals}>انصراف</button>
                                    <button type="submit" className="btn btn-primary">ایجاد</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                مودال ویرایش منو
                ============================================================ */}
            {showEditModal && selectedMenu && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <form onSubmit={handleEdit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">ویرایش منو: {selectedMenu.title}</h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3"><label className="form-label">عنوان *</label><input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required /></div>
                                    <div className="mb-3"><label className="form-label">منوی والد</label>
                                        <select className="form-select" value={formData.parentId} onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}>
                                            <option value="">بدون والد</option>
                                            {menus.filter(m => m.id !== selectedMenu.id).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3"><label className="form-label">مسیر</label><input type="text" className="form-control" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} /></div>
                                    <div className="mb-3"><label className="form-label">آیکون</label><input type="text" className="form-control" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} /></div>
                                    <div className="mb-3"><label className="form-label">مجوز مورد نیاز</label><input type="text" className="form-control" value={formData.permissionName} onChange={(e) => setFormData({ ...formData, permissionName: e.target.value })} /></div>
                                    <div className="mb-3"><label className="form-label">ترتیب</label><input type="number" className="form-control" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} /></div>
                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input type="checkbox" className="form-check-input" checked={formData.vazeeat} onChange={(e) => setFormData({ ...formData, vazeeat: e.target.checked })} />
                                            <label className="form-check-label">فعال</label>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={closeModals}>انصراف</button>
                                    <button type="submit" className="btn btn-primary">ذخیره</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}