import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';

export default function KarmandList() {
    const navigate = useNavigate();
    const location = useLocation();
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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedOstanId, setSelectedOstanId] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState('');
    const [vazeeat, setVazeeat] = useState('true');

    // ============================================================
    // Stateهای مودال حذف
    // ============================================================
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedKarmand, setSelectedKarmand] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ============================================================
    // 🔥 بازیابی موقعیت هنگام بازگشت از جزئیات
    // ============================================================
    useEffect(() => {
        if (location.state?.fromDetail) {
            const savedPage = location.state.page;
            const savedPageSize = location.state.pageSize;
            const savedSearch = location.state.search;
            const savedOstanId = location.state.ostanId;
            const savedMarkazId = location.state.markazId;
            const savedVazeeat = location.state.vazeeat;

            if (savedPage) {
                setPagination(prev => ({
                    ...prev,
                    page: savedPage,
                    pageSize: savedPageSize || prev.pageSize
                }));
            }
            if (savedSearch !== undefined) setSearch(savedSearch || '');
            if (savedOstanId !== undefined) setSelectedOstanId(savedOstanId || '');
            if (savedMarkazId !== undefined) setSelectedMarkazId(savedMarkazId || '');
            if (savedVazeeat !== undefined) setVazeeat(savedVazeeat || 'true');

            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    // ============================================================
    // 🔥 تابع کمکی برای نمایش نام مرکز بر اساس Level
    // ============================================================
    const getDisplayName = useCallback((markaz) => {
        if (!markaz) return '';

        if (markaz.level === 2) {
            return 'سازمان مرکزی';
        }

        if (markaz.level === 3) {
            return `ستاد استان ${markaz.naamOstan || ''}`;
        }

        return markaz.naamMarkaz || '';
    }, []);

    // ============================================================
    // 🔥 Debounce برای جستجو
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 700);

        return () => clearTimeout(timer);
    }, [search]);

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
    const fetchKarmands = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: debouncedSearch || undefined,
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
    }, [pagination.page, pagination.pageSize, debouncedSearch, selectedOstanId, selectedMarkazId, vazeeat]);

    useEffect(() => {
        fetchKarmands();
    }, [fetchKarmands]);

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    // ============================================================
    // 🔥 کلیک روی ردیف - ذخیره موقعیت
    // ============================================================
    const handleRowClick = (karmandId) => {
        navigate(`/dashboard/personel/${karmandId}`, {
            state: {
                fromList: true,
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: search,
                ostanId: selectedOstanId,
                markazId: selectedMarkazId,
                vazeeat: vazeeat
            }
        });
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
        setShowDeleteModal(false);
        setSelectedKarmand(null);
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
    // استخراج استان‌های یکتا از مراکز
    // ============================================================
    const uniqueOstans = useMemo(() => {
        return markazList
            ?.filter(m => m.codeOstan)
            .reduce((acc, curr) => {
                if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                    acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
                }
                return acc;
            }, []) || [];
    }, [markazList]);

    const filteredMarkaz = useMemo(() => {
        return markazList?.filter(m => m.codeOstan === selectedOstanId) || [];
    }, [markazList, selectedOstanId]);

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
                                        {getDisplayName(markaz) || markaz.naamMarkaz || `مرکز ${markaz.id}`}
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
                                onClick={() => {
                                    setSearch('');
                                    setDebouncedSearch('');
                                    setSelectedOstanId('');
                                    setSelectedMarkazId('');
                                    setVazeeat('true');
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
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
                                    <th>مرکز محل خدمت</th>
                                    <th>تلفن</th>
                                    <th>وضعیت</th>
                                    <th>وضعیت موقت</th>
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
                                        <tr
                                            key={k.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleRowClick(k.id)}
                                        >
                                            <td>{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                                            <td><code>{k.codeMelli}</code></td>
                                            <td>{k.naam}</td>
                                            <td><strong>{k.naameKhanevadeghi}</strong></td>
                                            <td>{k.markazName}</td>
                                            <td>{k.mobile || '-'}</td>
                                            <td>
                                                <span className={`badge ${k.vazeeat ? 'bg-success' : 'bg-danger'}`}>
                                                    {k.vazeeat ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${k.vazeeatMovaghat ? 'bg-warning' : 'bg-secondary'}`}>
                                                    {k.vazeeatMovaghat ? 'مسدود' : 'عادی'}
                                                </span>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <span className="text-muted small">-</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

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

            {showDeleteModal && (
                <div
                    className="modal-backdrop show"
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }}
                    onClick={closeModals}
                ></div>
            )}
        </div>
    );
}