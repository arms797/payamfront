import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';

export default function KarmandList() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { markazList } = useMarkaz();

    // ============================================================
    // Stateهای اصلی
    // ============================================================
    const [karmands, setKarmands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 50,
        totalCount: 0,
        totalPages: 0
    });

    // ============================================================
    // Stateهای فیلتر
    // ============================================================
    const [search, setSearch] = useState('');
    const [selectedOstanId, setSelectedOstanId] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState('');
    const [vazeeat, setVazeeat] = useState('true');

    // ============================================================
    // Stateهای مودال
    // ============================================================
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedKarmand, setSelectedKarmand] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [editFormData, setEditFormData] = useState({
        naam: '',
        naameKhanevadeghi: '',
        markazId: '',
        markazAsliId: '',
        mobile: '',
        mobile2: '',
        telefonMostaghim: '',
        telefonGhayreMostaghim: '',
        telefonDakheli: '',
        email: '',
        emza: ''
    });

    // ============================================================
    // بررسی مجوز مشاهده
    // ============================================================
    if (!hasPermission('Karmand.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    // ============================================================
    // دریافت لیست کارمندان
    // ============================================================
    const fetchKarmands = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: search || undefined,
                vazeeat: vazeeat === 'all' ? undefined : vazeeat === 'true'
            };

            if (selectedOstanId && !selectedMarkazId) {
                params.ostanId = parseInt(selectedOstanId);
            } else if (selectedOstanId && selectedMarkazId) {
                params.ostanId = parseInt(selectedOstanId);
                params.markazId = parseInt(selectedMarkazId);
            }

            const response = await api.get('/Karmand/list', { params });
            if (response.data?.success) {
                setKarmands(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            console.error('خطا در دریافت کارمندان:', error);
            toast.error('خطا در دریافت لیست کارمندان');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchKarmands();
    }, [pagination.page, pagination.pageSize, search, selectedOstanId, selectedMarkazId, vazeeat]);

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = (karmand) => {
        setSelectedKarmand(karmand);
        setEditFormData({
            naam: karmand.naam || '',
            naameKhanevadeghi: karmand.naameKhanevadeghi || '',
            markazId: karmand.markazId || '',
            markazAsliId: karmand.markazAsliId || '',
            mobile: karmand.mobile || '',
            mobile2: karmand.mobile2 || '',
            telefonMostaghim: karmand.telefonMostaghim || '',
            telefonGhayreMostaghim: karmand.telefonGhayreMostaghim || '',
            telefonDakheli: karmand.telefonDakheli || '',
            email: karmand.email || '',
            emza: karmand.emza || ''
        });
        setShowEditModal(true);
    };

    // ============================================================
    // باز کردن مودال حذف
    // ============================================================
    const openDeleteModal = (karmand) => {
        setSelectedKarmand(karmand);
        setShowDeleteModal(true);
    };

    // ============================================================
    // بستن مودال‌ها
    // ============================================================
    const closeModals = () => {
        setShowEditModal(false);
        setShowDeleteModal(false);
        setSelectedKarmand(null);
        setEditFormData({
            naam: '',
            naameKhanevadeghi: '',
            markazId: '',
            markazAsliId: '',
            mobile: '',
            mobile2: '',
            telefonMostaghim: '',
            telefonGhayreMostaghim: '',
            telefonDakheli: '',
            email: '',
            emza: ''
        });
    };

    // ============================================================
    // ویرایش کارمند
    // ============================================================
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditLoading(true);

        try {
            const response = await api.put(`/Karmand/update/${selectedKarmand.id}`, {
                ...editFormData,
                markazId: editFormData.markazId ? parseInt(editFormData.markazId) : null,
                markazAsliId: editFormData.markazAsliId ? parseInt(editFormData.markazAsliId) : null
            });

            if (response.data?.success) {
                toast.success('کارمند با موفقیت ویرایش شد');
                closeModals();
                fetchKarmands();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ویرایش کارمند');
        } finally {
            setEditLoading(false);
        }
    };

    // ============================================================
    // حذف کارمند
    // ============================================================
    const handleDeleteConfirm = async () => {
        if (!selectedKarmand) return;
        setDeleteLoading(true);

        try {
            const response = await api.delete(`/Karmand/delete/${selectedKarmand.id}`);
            if (response.data?.success) {
                toast.success('کارمند با موفقیت حذف شد');
                closeModals();
                fetchKarmands();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف کارمند');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedOstanId('');
        setSelectedMarkazId('');
        setVazeeat('true');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // ============================================================
    // استخراج استان‌های یکتا از مراکز
    // ============================================================
    const uniqueOstans = markazList
        ?.filter(m => m.codeOstan)
        .reduce((acc, curr) => {
            if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
            }
            return acc;
        }, []) || [];

    const filteredMarkaz = markazList?.filter(m => m.codeOstan === selectedOstanId) || [];

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>مدیریت کارمندان</h4>
                <PermissionWrapper permission="Karmand.Create">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/dashboard/personel/create')}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        کارمند جدید
                    </button>
                </PermissionWrapper>
            </div>

            {/* ============================================================
                فیلترها
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                            <label className="form-label">جستجو</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="نام، نام خانوادگی، کد ملی..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">استان</label>
                            <select
                                className="form-select"
                                value={selectedOstanId}
                                onChange={(e) => {
                                    setSelectedOstanId(e.target.value);
                                    setSelectedMarkazId('');
                                }}
                            >
                                <option value="">همه استان‌ها</option>
                                {uniqueOstans.map(ostan => (
                                    <option key={ostan.codeOstan} value={ostan.codeOstan}>
                                        {ostan.naamOstan}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">مرکز</label>
                            <select
                                className="form-select"
                                value={selectedMarkazId}
                                onChange={(e) => setSelectedMarkazId(e.target.value)}
                                disabled={!selectedOstanId}
                            >
                                <option value="">همه مراکز</option>
                                {filteredMarkaz.map(markaz => (
                                    <option key={markaz.id} value={markaz.id}>
                                        {markaz.naamMarkaz}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">وضعیت</label>
                            <select
                                className="form-select"
                                value={vazeeat}
                                onChange={(e) => setVazeeat(e.target.value)}
                            >
                                <option value="true">فعال</option>
                                <option value="false">غیرفعال</option>
                                <option value="all">همه</option>
                            </select>
                        </div>

                        <div className="col-md-3 d-flex gap-2">
                            <button
                                className="btn btn-secondary"
                                onClick={() => {
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                    fetchKarmands();
                                }}
                            >
                                <i className="bi bi-search me-1"></i>
                                جستجو
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={resetFilters}
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                ریست
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                جدول
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
                            تعداد کل: {pagination.totalCount} کارمند
                        </span>
                        <div className="d-flex align-items-center gap-2">
                            <label className="text-muted small">تعداد در صفحه:</label>
                            <select
                                className="form-select form-select-sm"
                                style={{ width: 'auto' }}
                                value={pagination.pageSize}
                                onChange={handlePageSizeChange}
                            >
                                <option value="10">۱۰</option>
                                <option value="25">۲۵</option>
                                <option value="50">۵۰</option>
                                <option value="100">۱۰۰</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-hover table-striped">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>کد ملی</th>
                                    <th>نام</th>
                                    <th>نام خانوادگی</th>
                                    <th>مرکز</th>
                                    <th>تلفن</th>
                                    <th>ایمیل</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {karmands.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center text-muted">
                                            هیچ کارمندی یافت نشد
                                        </td>
                                    </tr>
                                ) : (
                                    karmands.map((k, index) => (
                                        <tr key={k.id}>
                                            <td>{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                                            <td><code>{k.codeMelli}</code></td>
                                            <td>{k.naam}</td>
                                            <td><strong>{k.naameKhanevadeghi}</strong></td>
                                            <td>{k.markazName}</td>
                                            <td>{k.mobile || '-'}</td>
                                            <td>{k.email || '-'}</td>
                                            <td>
                                                <span className={`badge ${k.vazeeat ? 'bg-success' : 'bg-danger'}`}>
                                                    {k.vazeeat ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    {/* ============================================================
                                                        دکمه ویرایش → مودال
                                                        ============================================================ */}
                                                    <PermissionWrapper permission="Karmand.Update">
                                                        <button
                                                            className="btn btn-warning"
                                                            onClick={() => openEditModal(k)}
                                                            title="ویرایش"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                    </PermissionWrapper>

                                                    {/* ============================================================
                                                        دکمه حذف → مودال
                                                        ============================================================ */}
                                                    <PermissionWrapper permission="Karmand.Delete">
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => openDeleteModal(k)}
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

                    {/* ============================================================
                        صفحه‌بندی
                        ============================================================ */}
                    {pagination.totalPages > 1 && (
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                    >
                                        قبلی
                                    </button>
                                </li>
                                {[...Array(pagination.totalPages).keys()].map(num => (
                                    <li
                                        key={num + 1}
                                        className={`page-item ${pagination.page === num + 1 ? 'active' : ''}`}
                                    >
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(num + 1)}
                                        >
                                            {num + 1}
                                        </button>
                                    </li>
                                ))}
                                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                    >
                                        بعدی
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* ============================================================
                مودال ویرایش
                ============================================================ */}
            {showEditModal && selectedKarmand && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <form onSubmit={handleEditSubmit}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        ویرایش کارمند: {selectedKarmand.naam} {selectedKarmand.naameKhanevadeghi}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeModals}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">نام *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naam}
                                                onChange={(e) => setEditFormData({ ...editFormData, naam: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">نام خانوادگی *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.naameKhanevadeghi}
                                                onChange={(e) => setEditFormData({ ...editFormData, naameKhanevadeghi: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">مرکز خدمتی *</label>
                                            <select
                                                className="form-select"
                                                value={editFormData.markazId}
                                                onChange={(e) => setEditFormData({ ...editFormData, markazId: e.target.value })}
                                                required
                                            >
                                                <option value="">انتخاب مرکز...</option>
                                                {markazList?.map(m => (
                                                    <option key={m.id} value={m.id}>{m.naamMarkaz}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">مرکز اصلی</label>
                                            <select
                                                className="form-select"
                                                value={editFormData.markazAsliId}
                                                onChange={(e) => setEditFormData({ ...editFormData, markazAsliId: e.target.value })}
                                            >
                                                <option value="">انتخاب مرکز...</option>
                                                {markazList?.map(m => (
                                                    <option key={m.id} value={m.id}>{m.naamMarkaz}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">تلفن همراه ۱</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.mobile}
                                                onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">تلفن همراه ۲</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.mobile2}
                                                onChange={(e) => setEditFormData({ ...editFormData, mobile2: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">ایمیل</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editFormData.email}
                                                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">امضا</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={editFormData.emza}
                                                onChange={(e) => setEditFormData({ ...editFormData, emza: e.target.value })}
                                            />
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
                                        disabled={editLoading}
                                    >
                                        {editLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                مودال تأیید حذف
                ============================================================ */}
            {showDeleteModal && selectedKarmand && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">تأیید حذف</h5>
                                <button type="button" className="btn-close" onClick={closeModals}></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    آیا از حذف کارمند <strong>"{selectedKarmand.naam} {selectedKarmand.naameKhanevadeghi}"</strong> مطمئن هستید؟
                                </p>
                                <p className="text-danger small">
                                    <i className="bi bi-exclamation-triangle-fill me-1"></i>
                                    این عملیات غیرقابل بازگشت است و کاربر مربوطه نیز حذف خواهد شد.
                                </p>
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
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={handleDeleteConfirm}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'در حال حذف...' : 'تأیید حذف'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                پس‌زمینه مودال‌ها
                ============================================================ */}
            {(showEditModal || showDeleteModal) && (
                <div
                    className="modal-backdrop show"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={closeModals}
                ></div>
            )}
        </div>
    );
}