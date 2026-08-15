// src/pages/Ostad/OstadList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import PersianNumber from '../../components/common/PersianNumber';

export default function OstadList() {
    const navigate = useNavigate();
    const location = useLocation();
    const { hasPermission, user } = useAuth();
    const { markazList } = useMarkaz();

    // ============================================================
    // Stateهای اصلی
    // ============================================================
    const [ostads, setOstads] = useState([]);
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
    const [selectedNoeHamkari, setSelectedNoeHamkari] = useState('');
    const [vazeeat, setVazeeat] = useState(1);
    const [reshteh, setReshteh] = useState('');

    // ============================================================
    // Refها برای ذخیره آخرین مقادیر
    // ============================================================
    const pageRef = useRef(1);
    const pageSizeRef = useRef(50);
    const searchRef = useRef('');
    const ostanIdRef = useRef('');
    const markazIdRef = useRef('');
    const noeHamkariRef = useRef('');
    const vazeeatRef = useRef(1);
    const reshtehRef = useRef('');

    // ============================================================
    // Ref برای debounce
    // ============================================================
    const searchTimerRef = useRef(null);
    const reshtehTimerRef = useRef(null);

    // ============================================================
    // Flag برای جلوگیری از fetch هنگام بازیابی موقعیت
    // ============================================================
    const [isRestoring, setIsRestoring] = useState(false);

    // ============================================================
    // تابع کمکی برای نمایش نام مرکز
    // ============================================================
    const getDisplayName = useCallback((markaz) => {
        if (!markaz) return '';
        if (markaz.level === 2) return 'سازمان مرکزی';
        if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`;
        return markaz.naamMarkaz || '';
    }, []);

    // ============================================================
    // استخراج استان‌ها
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
    // استان پیش‌فرض
    // ============================================================
    useEffect(() => {
        if (markazList && user?.markazId) {
            const userMarkaz = markazList.find(m => m.id === user.markazId);
            if (userMarkaz?.codeOstan) {
                setSelectedOstanId(userMarkaz.codeOstan);
            }
        }
    }, [markazList, user?.markazId]);

    // ============================================================
    // بررسی مجوز
    // ============================================================
    if (!hasPermission('Ostad.View')) {
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
        noeHamkariRef.current = selectedNoeHamkari;
    }, [selectedNoeHamkari]);

    useEffect(() => {
        vazeeatRef.current = vazeeat;
    }, [vazeeat]);

    useEffect(() => {
        reshtehRef.current = reshteh;
    }, [reshteh]);

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
            const savedNoeHamkari = location.state.noeHamkari || '';
            const savedVazeeat = location.state.vazeeat || 1;
            const savedReshteh = location.state.reshteh || '';

            setPagination(prev => ({
                ...prev,
                page: savedPage,
                pageSize: savedPageSize
            }));
            setSearch(savedSearch);
            setSelectedOstanId(savedOstanId);
            setSelectedMarkazId(savedMarkazId);
            setSelectedNoeHamkari(savedNoeHamkari);
            setVazeeat(savedVazeeat);
            setReshteh(savedReshteh);

            // 🔥 Refها را هم به‌روز کن
            pageRef.current = savedPage;
            pageSizeRef.current = savedPageSize;
            searchRef.current = savedSearch;
            ostanIdRef.current = savedOstanId;
            markazIdRef.current = savedMarkazId;
            noeHamkariRef.current = savedNoeHamkari;
            vazeeatRef.current = savedVazeeat;
            reshtehRef.current = savedReshteh;

            window.history.replaceState({}, document.title);

            // بعد از یک تاخیر کوتاه، flag را غیرفعال کن
            setTimeout(() => {
                setIsRestoring(false);
            }, 150);
        }
    }, [location.state]);

    // ============================================================
    // 🔥 Debounce برای search و reshteh
    // ============================================================
    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            searchRef.current = search;
            // اگر در حالت بازیابی نیستیم، fetch را اجرا کن
            if (!isRestoring) {
                if (pagination.page !== 1) {
                    setPagination(prev => ({ ...prev, page: 1 }));
                } else {
                    fetchOstads();
                }
            }
        }, 700);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [search]);

    useEffect(() => {
        if (reshtehTimerRef.current) {
            clearTimeout(reshtehTimerRef.current);
        }

        reshtehTimerRef.current = setTimeout(() => {
            reshtehRef.current = reshteh;
            if (!isRestoring) {
                if (pagination.page !== 1) {
                    setPagination(prev => ({ ...prev, page: 1 }));
                } else {
                    fetchOstads();
                }
            }
        }, 700);

        return () => {
            if (reshtehTimerRef.current) {
                clearTimeout(reshtehTimerRef.current);
            }
        };
    }, [reshteh]);

    // ============================================================
    // 🔥 سایر فیلترها (بدون debounce)
    // ============================================================
    useEffect(() => {
        if (isRestoring) return;
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        } else {
            fetchOstads();
        }
    }, [
        selectedOstanId,
        selectedMarkazId,
        selectedNoeHamkari,
        vazeeat,
        pagination.pageSize,
    ]);

    // ============================================================
    // 🔥 دریافت لیست اساتید (با استفاده از Refs)
    // ============================================================
    const fetchOstads = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pageRef.current,
                pageSize: pageSizeRef.current,
                search: searchRef.current || undefined,
                vazeeat: vazeeatRef.current,
                reshteh: reshtehRef.current || undefined,
                noeHamkari: noeHamkariRef.current || undefined
            };

            if (ostanIdRef.current && !markazIdRef.current) {
                params.ostanId = parseInt(ostanIdRef.current);
            } else if (ostanIdRef.current && markazIdRef.current) {
                params.ostanId = parseInt(ostanIdRef.current);
                params.markazId = parseInt(markazIdRef.current);
            }

            const response = await api.get('/Ostad/list', { params });
            if (response.data?.success) {
                setOstads(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            console.error('خطا در دریافت اساتید:', error);
            toast.error('خطا در دریافت لیست اساتید');
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================================
    // 🔥 وقتی صفحه تغییر می‌کند، fetch را اجرا کن
    // ============================================================
    useEffect(() => {
        if (isRestoring) return;
        fetchOstads();
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
    // کلیک روی ردیف
    // ============================================================
    const handleRowClick = (ostadId) => {
        navigate(`/dashboard/ostad/${ostadId}`, {
            state: {
                fromList: true,
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: search,
                ostanId: selectedOstanId,
                markazId: selectedMarkazId,
                noeHamkari: selectedNoeHamkari,
                vazeeat: vazeeat,
                reshteh: reshteh
            }
        });
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

    // ============================================================
    // رندر اصلی
    // ============================================================
    return (
        <div className="container-fluid">
            {/* هدر */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4>مدیریت اساتید</h4>
                <PermissionWrapper permission="Ostad.Create">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/dashboard/ostad/create')}
                    >
                        <i className="bi bi-plus-circle me-2"></i>
                        استاد جدید
                    </button>
                </PermissionWrapper>
            </div>

            {/* فیلترها */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-2 align-items-end">
                        <div className="col-md-2">
                            <label className="form-label">جستجو</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="نام، کد استادی..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">رشته تحصیلی</label>
                            <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="مثلاً کامپیوتر..."
                                value={reshteh}
                                onChange={(e) => setReshteh(e.target.value)}
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">استان</label>
                            <select
                                className="form-select form-select-sm"
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
                                className="form-select form-select-sm"
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
                            <label className="form-label">نوع همکاری</label>
                            <select
                                className="form-select form-select-sm"
                                value={selectedNoeHamkari}
                                onChange={(e) => setSelectedNoeHamkari(e.target.value)}
                            >
                                <option value="">همه</option>
                                <option value="1">هیات علمی پیام نور</option>
                                <option value="2">هیات علمی غیر پیام نور</option>
                                <option value="3">مدرس مدعو</option>
                                <option value="4">هیات علمی پیام نور (سایر استان‌ها)</option>
                            </select>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">وضعیت</label>
                            <select
                                className="form-select form-select-sm"
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

            {/* جدول */}
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
                            تعداد کل: {pagination.totalCount} استاد
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
                                    <th>کد استادی</th>
                                    <th>نام</th>
                                    <th>نام خانوادگی</th>
                                    <th>مرکز</th>
                                    <th>رشته تحصیلی</th>
                                    <th>نوع همکاری</th>
                                    <th>وضعیت</th>
                                    <th>عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ostads.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center text-muted">
                                            هیچ استادی یافت نشد
                                        </td>
                                    </tr>
                                ) : (
                                    ostads.map((ostad, index) => (
                                        <tr
                                            key={ostad.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleRowClick(ostad.id)}
                                        >
                                            <td>
                                                <PersianNumber>{(pagination.page - 1) * pagination.pageSize + index + 1}</PersianNumber>
                                            </td>
                                            <td><PersianNumber>{ostad.codeOstadi}</PersianNumber></td>
                                            <td>{ostad.naam}</td>
                                            <td><strong>{ostad.naamKhanevadegi}</strong></td>
                                            <td>{ostad.markazName}</td>
                                            <td>{ostad.reshteh || '-'}</td>
                                            <td>
                                                <span className="badge bg-secondary">
                                                    {ostad.noeHamkari === 1 && 'هیات علمی پیام نور'}
                                                    {ostad.noeHamkari === 2 && 'هیات علمی غیر پیام نور'}
                                                    {ostad.noeHamkari === 3 && 'مدرس مدعو'}
                                                    {ostad.noeHamkari === 4 && 'هیات علمی پیام نور (سایر استان‌ها)'}
                                                    {!ostad.noeHamkari && '-'}
                                                </span>
                                            </td>
                                            <td>
                                                {ostad.vazeeat && ostad.vazeeatMovaghat && (
                                                    <span className="badge bg-success">فعال</span>
                                                )}
                                                {!ostad.vazeeat && !ostad.vazeeatMovaghat && (
                                                    <span className="badge bg-danger">غیرفعال دائم</span>
                                                )}
                                                {ostad.vazeeat && !ostad.vazeeatMovaghat && (
                                                    <span className="badge bg-warning text-dark">موقتا غیرفعال</span>
                                                )}
                                                {!ostad.vazeeat && ostad.vazeeatMovaghat && (
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
        </div>
    );
}