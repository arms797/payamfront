// src/pages/Karmand/KarmandList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import PersianNumber from '../../components/common/PersianNumber';

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
    const [selectedOstanId, setSelectedOstanId] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState('');
    const [vazeeat, setVazeeat] = useState(1);

    // ============================================================
    // Refها برای ذخیره آخرین مقادیر
    // ============================================================
    const pageRef = useRef(1);
    const pageSizeRef = useRef(50);
    const searchRef = useRef('');
    const ostanIdRef = useRef('');
    const markazIdRef = useRef('');
    const vazeeatRef = useRef(1);

    // ============================================================
    // Ref برای debounce
    // ============================================================
    const searchTimerRef = useRef(null);

    // ============================================================
    // Flag برای جلوگیری از fetch هنگام بازیابی موقعیت
    // ============================================================
    const [isRestoring, setIsRestoring] = useState(false);

    // ============================================================
    // Stateهای مودال حذف
    // ============================================================
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedKarmand, setSelectedKarmand] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ============================================================
    // 🔥 تابع کمکی برای نمایش نام مرکز بر اساس Level
    // ============================================================
    const getDisplayName = useCallback((markaz) => {
        if (!markaz) return '';
        if (markaz.level === 2) return 'سازمان مرکزی';
        if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`;
        return markaz.naamMarkaz || '';
    }, []);

    // ============================================================
    // استخراج استان‌های یکتا
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
    // 🔥 همگام‌سازی Refs با Stateها
    // ============================================================
    useEffect(() => {
        pageRef.current = pagination.page;
    }, [pagination.page]);

    useEffect(() => {
        pageSizeRef.current = pagination.pageSize;
    }, [pagination.pageSize]);

    useEffect(() => {
        searchRef.current = search;
    }, [search]);

    useEffect(() => {
        ostanIdRef.current = selectedOstanId;
    }, [selectedOstanId]);

    useEffect(() => {
        markazIdRef.current = selectedMarkazId;
    }, [selectedMarkazId]);

    useEffect(() => {
        vazeeatRef.current = vazeeat;
    }, [vazeeat]);

    // ============================================================
    // 🔥 بازیابی موقعیت هنگام بازگشت از جزئیات
    // ============================================================
    useEffect(() => {
        if (location.state?.fromDetail) {
            setIsRestoring(true);

            const savedPage = location.state.page || 1;
            const savedPageSize = location.state.pageSize || 50;
            const savedSearch = location.state.search || '';
            const savedOstanId = location.state.ostanId || '';
            const savedMarkazId = location.state.markazId || '';
            const savedVazeeat = location.state.vazeeat || 1;

            setPagination(prev => ({
                ...prev,
                page: savedPage,
                pageSize: savedPageSize
            }));
            setSearch(savedSearch);
            setSelectedOstanId(savedOstanId);
            setSelectedMarkazId(savedMarkazId);
            setVazeeat(savedVazeeat);

            // 🔥 Refها را هم به‌روز کن
            pageRef.current = savedPage;
            pageSizeRef.current = savedPageSize;
            searchRef.current = savedSearch;
            ostanIdRef.current = savedOstanId;
            markazIdRef.current = savedMarkazId;
            vazeeatRef.current = savedVazeeat;

            window.history.replaceState({}, document.title);

            setTimeout(() => {
                setIsRestoring(false);
            }, 150);
        }
    }, [location.state]);

    // ============================================================
    // 🔥 Debounce برای search
    // ============================================================
    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            searchRef.current = search;
            if (!isRestoring) {
                if (pagination.page !== 1) {
                    setPagination(prev => ({ ...prev, page: 1 }));
                } else {
                    fetchKarmands();
                }
            }
        }, 700);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [search]);

    // ============================================================
    // 🔥 سایر فیلترها (بدون debounce)
    // ============================================================
    useEffect(() => {
        if (isRestoring) return;
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        } else {
            fetchKarmands();
        }
    }, [
        selectedOstanId,
        selectedMarkazId,
        vazeeat,
        pagination.pageSize,
    ]);

    // ============================================================
    // 🔥 دریافت لیست کارمندان (با استفاده از Refs)
    // ============================================================
    const fetchKarmands = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pageRef.current,
                pageSize: pageSizeRef.current,
                search: searchRef.current || undefined,
                vazeeat: vazeeatRef.current
            };

            if (ostanIdRef.current && !markazIdRef.current) {
                params.ostanId = parseInt(ostanIdRef.current);
            } else if (ostanIdRef.current && markazIdRef.current) {
                params.ostanId = parseInt(ostanIdRef.current);
                params.markazId = parseInt(markazIdRef.current);
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
    }, []);

    // ============================================================
    // 🔥 وقتی صفحه تغییر می‌کند، fetch را اجرا کن
    // ============================================================
    useEffect(() => {
        if (isRestoring) return;
        fetchKarmands();
    }, [pagination.page]);

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        pageRef.current = newPage;
    };

    const handlePageSizeChange = (e) => {
        const newSize = parseInt(e.target.value);
        setPagination(prev => ({ ...prev, pageSize: newSize, page: 1 }));
        pageSizeRef.current = newSize;
        pageRef.current = 1;
    };

    // ============================================================
    // کلیک روی ردیف - ذخیره موقعیت
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
    // صفحه‌بندی
    // ============================================================
    const renderPagination = () => {
        const { page, totalPages } = pagination;
        if (totalPages <= 1) return null;

        const maxVisible = 5;
        let pages = [];
        let start = Math.max(1, page - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        return (
            <nav className="mt-3">
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">
                        صفحه {page} از {totalPages}
                    </span>
                    <ul className="pagination mb-0">
                        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(page - 1)}>
                                قبلی
                            </button>
                        </li>

                        {start > 1 && (
                            <>
                                <li className="page-item">
                                    <button className="page-link" onClick={() => handlePageChange(1)}>1</button>
                                </li>
                                {start > 2 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                            </>
                        )}

                        {pages.map(num => (
                            <li key={num} className={`page-item ${page === num ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(num)}>
                                    {num}
                                </button>
                            </li>
                        ))}

                        {end < totalPages && (
                            <>
                                {end < totalPages - 1 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                <li className="page-item">
                                    <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                                        {totalPages}
                                    </button>
                                </li>
                            </>
                        )}

                        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => handlePageChange(page + 1)}>
                                بعدی
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>
        );
    };

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
                                <option value="1">فعال</option>
                                <option value="2">غیرفعال</option>
                                <option value="3">همه</option>
                            </select>
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
                                    <th>وضعیت کاربر</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {karmands.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted">
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
                                            <td><PersianNumber>{(pagination.page - 1) * pagination.pageSize + index + 1}</PersianNumber></td>
                                            <td><PersianNumber>{k.codeMelli}</PersianNumber></td>
                                            <td>{k.naam}</td>
                                            <td><strong>{k.naameKhanevadeghi}</strong></td>
                                            <td>{k.markazName}</td>
                                            <td><PersianNumber>{k.mobile || '-'}</PersianNumber></td>
                                            <td>
                                                {k.vazeeat && k.vazeeatMovaghat && (
                                                    <span className="badge bg-success">فعال</span>
                                                )}
                                                {!k.vazeeat && !k.vazeeatMovaghat && (
                                                    <span className="badge bg-danger">غیرفعال دائم</span>
                                                )}
                                                {k.vazeeat && !k.vazeeatMovaghat && (
                                                    <span className="badge bg-warning text-dark">موقتا غیرفعال</span>
                                                )}
                                                {!k.vazeeat && k.vazeeatMovaghat && (
                                                    <span className="badge bg-info">غیرفعال</span>
                                                )}
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

                    {renderPagination()}
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