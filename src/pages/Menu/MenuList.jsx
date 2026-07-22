import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';

export default function MenuList() {
    const { hasPermission } = useAuth();
    const [menus, setMenus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);

    // ============================================================
    // 🔥 لیست آیکون‌های معروف Bootstrap Icons
    // ============================================================
    const iconOptions = [
        { value: 'bi-gear-fill', label: '⚙️ چرخ دنده' },
        { value: 'bi-person-fill', label: '👤 ادم' },
        { value: 'bi-people-fill', label: '👥 افراد' },
        { value: 'bi-list-ul', label: '📋 منو' },
        { value: 'bi-shield-lock-fill', label: '🛡️ مجوز' },
        { value: 'bi-person-badge-fill', label: '🎖️ نقش' },
        { value: 'bi-mortarboard-fill', label: '🎓 استاد' },
        { value: 'bi-book-fill', label: '📚 کتاب' },
        { value: 'bi-calendar-event-fill', label: '📅 کلاس' },
        { value: 'bi-gear-wide-connected', label: '🔧 مدیریت' },
        { value: 'bi-clock-history', label: '⏳ برنامه ریزی' },
        { value: 'bi-house-fill', label: '🏠 خانه' },
        { value: 'bi-grid-1x2-fill', label: '📊 داشبورد' },
        { value: 'bi-file-earmark-text-fill', label: '📄 گزارش' },
        { value: 'bi-envelope-fill', label: '✉️ پیام' },
        { value: 'bi-bell-fill', label: '🔔 اعلان' },
        { value: 'bi-search', label: '🔍 جستجو' },
        { value: 'bi-plus-circle-fill', label: '➕ افزودن' },
        { value: 'bi-pencil-fill', label: '✏️ ویرایش' },
        { value: 'bi-trash-fill', label: '🗑️ حذف' },
        { value: 'bi-download', label: '⬇️ دانلود' },
        { value: 'bi-upload', label: '⬆️ آپلود' },
        { value: 'bi-building', label: '🏢 مرکز' },
        { value: 'bi-map-fill', label: '🗺️ استان' },
        { value: 'bi-flag-fill', label: '🚩 کشور' },
        { value: 'bi-star-fill', label: '⭐ ویژه' },
        { value: 'bi-heart-fill', label: '❤️ علاقه' },
        { value: 'bi-chat-fill', label: '💬 گفتگو' },
        { value: 'bi-telephone-fill', label: '📞 تلفن' },
        { value: 'bi-whatsapp', label: '💬 واتساپ' },
        { value: 'bi-telegram', label: '✈️ تلگرام' },
    ];

    // ============================================================
    // Stateهای مربوط به کومبوهای پویا مجوز و فیلتر والد
    // ============================================================
    const [resourcesList, setResourcesList] = useState([]);
    const [permissionsList, setPermissionsList] = useState([]);
    const [filteredPermissions, setFilteredPermissions] = useState([]);

    // ============================================================
    // Stateهای مربوط به فیلتر بر اساس والد
    // ============================================================
    const [selectedParentId, setSelectedParentId] = useState('');
    const [parentMenus, setParentMenus] = useState([]);

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

    // ============================================================
    // دریافت لیست منوها
    // ============================================================
    const fetchMenus = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Menu/list');
            if (response.data?.data) {
                setMenus(response.data.data);
                const parents = response.data.data.filter(m => m.parentId === null);
                setParentMenus(parents);
            }
        } catch (error) {
            toast.error('خطا در دریافت لیست منوها');
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // دریافت لیست مجوزها برای کومبو
    // ============================================================
    const fetchPermissions = async () => {
        try {
            const response = await api.get('/Permission/list');
            if (response.data?.data) {
                const uniqueResources = [...new Set(response.data.data.map(p => p.resource).filter(Boolean))];
                setResourcesList(uniqueResources);
                setPermissionsList(response.data.data);
            }
        } catch (error) {
            console.error('خطا در دریافت لیست مجوزها:', error);
        }
    };

    useEffect(() => {
        fetchMenus();
        fetchPermissions();
    }, []);

    // ============================================================
    // دریافت منوهای فیلتر شده بر اساس والد انتخاب‌شده
    // ============================================================
    const getFilteredMenus = () => {
        if (!selectedParentId) {
            return buildHierarchicalMenus(menus);
        }
        const filtered = menus.filter(m => m.parentId === parseInt(selectedParentId));
        return sortMenusByOrder(filtered);
    };

    // ============================================================
    // ساخت لیست سلسله‌مراتبی منوها
    // ============================================================
    const buildHierarchicalMenus = (allMenus) => {
        const result = [];
        const parents = allMenus
            .filter(m => m.parentId === null)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        for (const parent of parents) {
            result.push(parent);
            const children = allMenus
                .filter(m => m.parentId === parent.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0));
            for (const child of children) {
                result.push(child);
            }
        }
        return result;
    };

    // ============================================================
    // مرتب‌سازی منوها بر اساس ترتیب
    // ============================================================
    const sortMenusByOrder = (menuList) => {
        return [...menuList].sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    // ============================================================
    // دریافت منوهای نمایش داده شده
    // ============================================================
    const displayedMenus = getFilteredMenus();

    // ============================================================
    // تغییر منبع → فیلتر مجوزها
    // ============================================================
    const handleResourceChange = (resource) => {
        const filtered = permissionsList.filter(p => p.resource === resource);
        setFilteredPermissions(filtered);
        setFormData(prev => ({
            ...prev,
            permissionName: ''
        }));
    };

    // ============================================================
    // انتخاب مجوز
    // ============================================================
    const handlePermissionChange = (permissionName) => {
        setFormData(prev => ({
            ...prev,
            permissionName: permissionName
        }));
    };

    // ============================================================
    // تغییر والد (برای مودال)
    // ============================================================
    const handleParentChange = (parentId) => {
        setFormData(prev => ({
            ...prev,
            parentId: parentId
        }));
    };

    // ============================================================
    // 🔥 تغییر آیکون
    // ============================================================
    const handleIconChange = (iconValue) => {
        setFormData(prev => ({
            ...prev,
            icon: iconValue
        }));
    };

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
                setFilteredPermissions([]);
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
                setFilteredPermissions([]);
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

        if (menu.permissionName) {
            const parts = menu.permissionName.split('.');
            if (parts.length > 1) {
                const resource = parts[0];
                const filtered = permissionsList.filter(p => p.resource === resource);
                setFilteredPermissions(filtered);
            }
        }

        setShowEditModal(true);
    };

    const closeModals = () => {
        setShowCreateModal(false);
        setShowEditModal(false);
        setSelectedMenu(null);
        setFormData({ title: '', parentId: '', path: '', icon: '', permissionName: '', order: 0, vazeeat: true });
        setFilteredPermissions([]);
    };

    // ============================================================
    // تابع برای نمایش آیکون در سلول جدول
    // ============================================================
    const renderIcon = (iconName) => {
        if (!iconName) return '-';
        return <i className={`bi ${iconName} fs-5`}></i>;
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

            {/* کومبوی فیلتر بر اساس والد */}
            <div className="row mb-3">
                <div className="col-md-4">
                    <div className="input-group">
                        <span className="input-group-text">
                            <i className="bi bi-funnel-fill"></i>
                        </span>
                        <select
                            className="form-select"
                            value={selectedParentId}
                            onChange={(e) => setSelectedParentId(e.target.value)}
                        >
                            <option value="">همه منوها</option>
                            {parentMenus.map(parent => (
                                <option key={parent.id} value={parent.id}>
                                    {parent.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="col-md-8 text-end">
                    <span className="badge bg-secondary">
                        تعداد منوها: {displayedMenus.length}
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>عنوان</th>
                                <th>والد</th>
                                <th>مسیر</th>
                                <th>آیکون</th>
                                <th>مجوز</th>
                                <th>ترتیب</th>
                                <th>وضعیت</th>
                                <th>عملیات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedMenus.length === 0 ? (
                                <tr><td colSpan="9" className="text-center text-muted">
                                    {selectedParentId ? 'هیچ زیرمنویی برای این والد یافت نشد' : 'هیچ منویی یافت نشد'}
                                </td></tr>
                            ) : (
                                displayedMenus.map((m, index) => {
                                    const parent = menus.find(p => p.id === m.parentId);
                                    const isParent = m.parentId === null;
                                    return (
                                        <tr key={m.id}>
                                            <td>{index + 1}</td>
                                            <td>
                                                <strong>{m.title}</strong>
                                                {isParent && (
                                                    <span className="badge bg-primary ms-2">والد</span>
                                                )}
                                            </td>
                                            <td>{parent?.title || '-'}</td>
                                            <td><code>{m.path || '-'}</code></td>
                                            <td>{renderIcon(m.icon)}</td>
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
                                    <div className="mb-3">
                                        <label className="form-label">عنوان *</label>
                                        <input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">منوی والد</label>
                                        <select className="form-select" value={formData.parentId} onChange={(e) => handleParentChange(e.target.value)}>
                                            <option value="">بدون والد</option>
                                            {menus.filter(m => m.id !== selectedMenu?.id).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">مسیر</label>
                                        <input type="text" className="form-control" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} placeholder="/dashboard/ostad" />
                                    </div>

                                    {/* ============================================================
                                        🔥 کومبوی آیکون
                                        ============================================================ */}
                                    <div className="mb-3">
                                        <label className="form-label">آیکون</label>
                                        <select
                                            className="form-select"
                                            value={formData.icon}
                                            onChange={(e) => handleIconChange(e.target.value)}
                                        >
                                            <option value="">بدون آیکون</option>
                                            {iconOptions.map(icon => (
                                                <option key={icon.value} value={icon.value}>
                                                    {icon.label}
                                                </option>
                                            ))}
                                        </select>
                                        {formData.icon && (
                                            <div className="mt-1">
                                                <span className="badge bg-light text-dark border">
                                                    <i className={`bi ${formData.icon} me-1`}></i>
                                                    {formData.icon}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">منبع مجوز</label>
                                        <select className="form-select" onChange={(e) => handleResourceChange(e.target.value)}>
                                            <option value="">انتخاب منبع...</option>
                                            {resourcesList.map(res => (
                                                <option key={res} value={res}>{res}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">مجوز مورد نیاز</label>
                                        <select
                                            className="form-select"
                                            value={formData.permissionName}
                                            onChange={(e) => handlePermissionChange(e.target.value)}
                                            disabled={filteredPermissions.length === 0}
                                        >
                                            <option value="">انتخاب مجوز...</option>
                                            {filteredPermissions.map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">ترتیب</label>
                                        <input type="number" className="form-control" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
                                    </div>

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
                                    <div className="mb-3">
                                        <label className="form-label">عنوان *</label>
                                        <input type="text" className="form-control" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">منوی والد</label>
                                        <select className="form-select" value={formData.parentId} onChange={(e) => handleParentChange(e.target.value)}>
                                            <option value="">بدون والد</option>
                                            {menus.filter(m => m.id !== selectedMenu.id).map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">مسیر</label>
                                        <input type="text" className="form-control" value={formData.path} onChange={(e) => setFormData({ ...formData, path: e.target.value })} />
                                    </div>

                                    {/* ============================================================
                                        🔥 کومبوی آیکون (ویرایش)
                                        ============================================================ */}
                                    <div className="mb-3">
                                        <label className="form-label">آیکون</label>
                                        <select
                                            className="form-select"
                                            value={formData.icon}
                                            onChange={(e) => handleIconChange(e.target.value)}
                                        >
                                            <option value="">بدون آیکون</option>
                                            {iconOptions.map(icon => (
                                                <option key={icon.value} value={icon.value}>
                                                    {icon.label}
                                                </option>
                                            ))}
                                        </select>
                                        {formData.icon && (
                                            <div className="mt-1">
                                                <span className="badge bg-light text-dark border">
                                                    <i className={`bi ${formData.icon} me-1`}></i>
                                                    {formData.icon}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">منبع مجوز</label>
                                        <select className="form-select" onChange={(e) => handleResourceChange(e.target.value)}>
                                            <option value="">انتخاب منبع...</option>
                                            {resourcesList.map(res => (
                                                <option key={res} value={res}>{res}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">مجوز مورد نیاز</label>
                                        <select
                                            className="form-select"
                                            value={formData.permissionName}
                                            onChange={(e) => handlePermissionChange(e.target.value)}
                                            disabled={filteredPermissions.length === 0}
                                        >
                                            <option value="">انتخاب مجوز...</option>
                                            {filteredPermissions.map(p => (
                                                <option key={p.id} value={p.name}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">ترتیب</label>
                                        <input type="number" className="form-control" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
                                    </div>

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