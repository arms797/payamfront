// src/pages/Schedule/BarnamehHaftegi/BarnamehHaftegiList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { useGrooheAmoozeshi } from '../../../context/GrooheAmoozeshiContext';
import { useReshteh } from '../../../context/ReshtehContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';

export default function BarnamehHaftegiList() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { termList, currentTermCode } = useTerm();
    const { grooheList } = useGrooheAmoozeshi();
    const { reshtehList } = useReshteh();
    const { confirm, ConfirmModal } = useConfirm();
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    // ============================================================
    // Stateهای اصلی
    // ============================================================
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0
    });

    // ============================================================
    // Stateهای فیلتر
    // ============================================================
    const [filters, setFilters] = useState({
        termCode: currentTermCode || '',
        search: '',
        ostanId: '',
        markazId: '',
        reshteh: '',
        approveStatus: '',
        grooheAmoozeshiId: '',
        noeHamkari: ''
    });

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [debouncedReshteh, setDebouncedReshteh] = useState('');
    const searchTimerRef = useRef(null);
    const reshtehTimerRef = useRef(null);

    // ============================================================
    // تشخیص نقش کاربر
    // ============================================================
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const codeRole = useMemo(() => user?.codeRole || 4, [user]);

    // ============================================================
    // تنظیم استان پیش‌فرض برای مدیران (CodeRole 3 و 4)
    // ============================================================
    useEffect(() => {
        if (!isOstad && (codeRole === 3 || codeRole === 4) && user?.markazOstan && !filters.ostanId) {
            setFilters(prev => ({ ...prev, ostanId: user.markazOstan }));
        }
    }, [isOstad, codeRole, user?.markazOstan]);

    // ============================================================
    // استخراج استان‌ها و مراکز قابل دسترس
    // ============================================================
    const accessibleOstans = useMemo(() => {
        if (!markazList) return [];
        let filtered = markazList.filter(m => m.vazeeyat !== false);

        if (isOstad) return [];

        if (codeRole === 3 || codeRole === 4) {
            const userOstan = user?.markazOstan;
            if (userOstan) {
                filtered = filtered.filter(m => m.codeOstan === userOstan);
            }
        }

        const unique = filtered
            .filter(m => m.codeOstan)
            .reduce((acc, curr) => {
                if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                    acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
                }
                return acc;
            }, []);
        return unique;
    }, [markazList, codeRole, user?.markazOstan, isOstad]);

    const accessibleMarkazs = useMemo(() => {
        if (!markazList || !filters.ostanId) return [];
        return markazList.filter(m => m.codeOstan === filters.ostanId && m.vazeeyat !== false);
    }, [markazList, filters.ostanId]);

    // ============================================================
    // دریافت لیست
    // ============================================================
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                termCode: filters.termCode,
                search: debouncedSearch || undefined,
                ostanId: filters.ostanId || undefined,
                markazId: filters.markazId || undefined,
                reshteh: debouncedReshteh || undefined,
                //approveStatus: filters.approveStatus || undefined,
                grooheAmoozeshiId: filters.grooheAmoozeshiId || undefined,
                noeHamkari: filters.noeHamkari || undefined,
                page: pagination.page,
                pageSize: pagination.pageSize
            };
            if (filters.approveStatus) {
                params.approveStatus = filters.approveStatus;
            }

            const response = await api.get('/BarnamehHaftegi/list', { params });
            if (response.data?.success) {
                setItems(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            toast.error('خطا در دریافت لیست برنامه‌ها');
        } finally {
            setLoading(false);
        }
    }, [filters, debouncedSearch, debouncedReshteh, pagination.page, pagination.pageSize]);

    // ============================================================
    // Debounce جستجو (700ms)
    // ============================================================
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 700);
        return () => clearTimeout(searchTimerRef.current);
    }, [filters.search]);

    // ============================================================
    // 🔥 دیبونس برای رشته تحصیلی (700ms)
    // ============================================================
    useEffect(() => {
        if (reshtehTimerRef.current) clearTimeout(reshtehTimerRef.current);
        reshtehTimerRef.current = setTimeout(() => {
            setDebouncedReshteh(filters.reshteh);
        }, 700);
        return () => clearTimeout(reshtehTimerRef.current);
    }, [filters.reshteh]);

    // ============================================================
    // بارگذاری اولیه و تغییر فیلترها
    // ============================================================
    useEffect(() => {
        if (filters.termCode) {
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                fetchItems();
            }
        }
    }, [filters.termCode,
    filters.ostanId,
    filters.markazId,
    filters.approveStatus,
    filters.grooheAmoozeshiId,
    filters.noeHamkari,
        debouncedSearch,
        debouncedReshteh]);

    useEffect(() => {
        if (filters.termCode) fetchItems();
    }, [pagination.page, pagination.pageSize]);

    // ============================================================
    // تغییر فیلتر
    // ============================================================
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // ============================================================
    // کلیک روی ردیف
    // ============================================================
    const handleRowClick = (ostadId) => {
        navigate(`/dashboard/barnameh-haftegi/${ostadId}`, {
            state: {
                fromList: true,
                page: pagination.page,
                pageSize: pagination.pageSize,
                filters: filters,
                termCode: filters.termCode
            }
        });
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

    // ============================================================
    // دریافت وضعیت نمایشی
    // ============================================================
    const getStatusBadge = (status) => {
        const map = {
            'pishnevis': { label: 'پیش‌نویس', className: 'bg-secondary text-white' },
            'tayeed_ostad': { label: 'تایید استاد', className: 'bg-info text-white' },
            'tayeed_modir': { label: 'تایید مدیر گروه', className: 'bg-primary text-white' },
            'tayeed_moaven': { label: 'تایید معاون', className: 'bg-success text-white' },
            'no_program': { label: 'فاقد برنامه', className: 'bg-dark text-white' }
        };
        const info = map[status] || map['no_program'];
        return <span className={`badge ${info.className}`}>{info.label}</span>;
    };

    // ============================================================
    // دریافت متن نوع همکاری
    // ============================================================
    const getNoeHamkariText = (noe) => {
        const map = {
            1: 'هیات علمی پیام نور',
            2: 'هیات علمی غیر پیام نور',
            3: 'مدرس مدعو',
            4: 'هیات علمی پیام نور (سایر استان‌ها)'
        };
        return map[noe] || '-';
    };

    // ============================================================
    // 🔥 دریافت کلاس رنگ برای نوع همکاری
    // ============================================================
    const getNoeHamkariClass = (noe) => {
        if (noe === 1) return 'bg-success';  // هیات علمی پیام نور → سبز
        if (noe === 4) return 'bg-info';     // هیات علمی پیام نور (سایر استان‌ها) → آبی
        if (noe === 2) return 'bg-warning text-dark'; // هیات علمی غیر پیام نور → زرد
        return 'bg-secondary';               // مدرس مدعو → خاکستری
    };

    // ============================================================
    // دریافت مقطع تحصیلی
    // ============================================================
    const getMaghtaText = (maghta) => {
        const map = {
            5: 'کارشناسی',
            10: 'کارشناسی ارشد',
            15: 'دکتری'
        };
        return map[maghta] || maghta || '-';
    };

    // ============================================================
    // قفل گروهی
    // ============================================================
    const [showBulkLockModal, setShowBulkLockModal] = useState(false);
    const [bulkLockData, setBulkLockData] = useState({
        noeHamkari: '',
        action: 'lock'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleBulkLock = async () => {
        if (!bulkLockData.noeHamkari) {
            toast.warning('لطفاً نوع همکاری را انتخاب کنید');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.patch('/BarnamehHaftegi/bulk-lock', {
                noeHamkari: parseInt(bulkLockData.noeHamkari),
                action: bulkLockData.action,
                termCode: filters.termCode
            });
            if (response.data?.success) {
                toast.success(response.data.message);
                setShowBulkLockModal(false);
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در قفل/باز کردن گروهی');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // رندر
    // ============================================================
    if (!hasPermission('BarnamehHaftegi.View')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                شما مجوز مشاهده این بخش را ندارید
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4>برنامه هفتگی اساتید</h4>
                    <small className="text-muted">
                        با کلیک روی هر ردیف، جزئیات برنامه را مشاهده کنید
                    </small>
                </div>
                <PermissionWrapper permission="BarnamehHaftegi.BulkLock">
                    <button
                        className="btn btn-warning"
                        onClick={() => setShowBulkLockModal(true)}
                    >
                        <i className="bi bi-lock-fill me-2"></i>
                        قفل گروهی
                    </button>
                </PermissionWrapper>
            </div>

            {/* ============================================================
                فیلترها (بدون دکمه ریست)
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    {/* ============================================================
                        ردیف اول: فیلترهای ضروری + دکمه بیشتر
                        ============================================================ */}
                    <div className="row g-3 align-items-end">
                        {/* جستجو */}
                        {!isOstad && (
                            <div className="col-md-3">
                                <label className="form-label">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="نام، کد استادی..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </div>
                        )}

                        {/* ترم */}
                        <div className="col-md-3">
                            <label className="form-label">ترم <span className="text-danger">*</span></label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.termCode}
                                onChange={(e) => handleFilterChange('termCode', e.target.value)}
                            >
                                {termList.map(term => (
                                    <option key={term.codeTerm} value={term.codeTerm}>
                                        {term.onvanTerm}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* وضعیت برنامه */}
                        {!isOstad && (
                            <div className="col-md-3">
                                <label className="form-label">وضعیت برنامه</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.approveStatus}
                                    onChange={(e) => handleFilterChange('approveStatus', e.target.value)}
                                >
                                    <option value="">همه</option>
                                    <option value="pishnevis">پیش‌نویس</option>
                                    <option value="tayeed_ostad">تایید استاد</option>
                                    <option value="tayeed_modir">تایید مدیر گروه</option>
                                    <option value="tayeed_moaven">تایید معاون</option>
                                    <option value="no_program">فاقد برنامه</option>
                                </select>
                            </div>
                        )}

                        {/* دکمه بیشتر */}
                        {!isOstad && (
                            <div className="col-md-3">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    type="button"
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                >
                                    <i className={`bi bi-chevron-${showAdvancedFilters ? 'up' : 'down'} me-1`}></i>
                                    {showAdvancedFilters ? 'فیلترهای کمتر' : 'فیلتر های بیشتر'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ============================================================
                        ردیف دوم: فیلترهای پیشرفته
                        ============================================================ */}
                    {showAdvancedFilters && (
                        <div className="row g-3 align-items-end mt-3">
                            {/* استان - فقط برای مدیران */}
                            {!isOstad && (
                                <div className="col-md-2">
                                    <label className="form-label">استان</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={filters.ostanId}
                                        onChange={(e) => {
                                            handleFilterChange('ostanId', e.target.value);
                                            handleFilterChange('markazId', '');
                                        }}
                                    >
                                        <option value="">همه استان‌ها</option>
                                        {accessibleOstans.map(ostan => (
                                            <option key={ostan.codeOstan} value={ostan.codeOstan}>
                                                {ostan.naamOstan}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* مرکز - فقط برای مدیران */}
                            {!isOstad && (
                                <div className="col-md-2">
                                    <label className="form-label">مرکز</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={filters.markazId}
                                        onChange={(e) => handleFilterChange('markazId', e.target.value)}
                                        disabled={!filters.ostanId || accessibleMarkazs.length === 0}
                                    >
                                        <option value="">همه مراکز</option>
                                        {accessibleMarkazs.map(m => (
                                            <option key={m.id} value={m.id}>{m.naamMarkaz}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {/* 🔥 نوع همکاری */}
                            <div className={`${!isOstad ? 'col-md-2' : 'col-md-2'}`}>
                                <label className="form-label">نوع همکاری</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.noeHamkari}
                                    onChange={(e) => handleFilterChange('noeHamkari', e.target.value)}
                                >
                                    <option value="">همه</option>
                                    <option value="1">هیات علمی پیام نور</option>
                                    <option value="2">هیات علمی غیر پیام نور</option>
                                    <option value="3">مدرس مدعو</option>
                                    <option value="4">هیات علمی پیام نور (سایر استان‌ها)</option>
                                </select>
                            </div>

                            {/* گروه آموزشی */}
                            <div className={`${!isOstad ? 'col-md-3' : 'col-md-4'}`}>
                                <label className="form-label">گروه آموزشی</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.grooheAmoozeshiId}
                                    onChange={(e) => handleFilterChange('grooheAmoozeshiId', e.target.value)}
                                >
                                    <option value="">همه گروه‌ها</option>
                                    {grooheList.map(g => (
                                        <option key={g.id} value={g.id}>
                                            {g.onvanGrooheAmoozeshi}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* رشته تحصیلی */}
                            <div className={`${!isOstad ? 'col-md-3' : 'col-md-4'}`}>
                                <label className="form-label">رشته تحصیلی</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="مثلاً کامپیوتر..."
                                    value={filters.reshteh}
                                    onChange={(e) => handleFilterChange('reshteh', e.target.value)}
                                />
                            </div>

                            {/* اگر کاربر استاد است، فیلدهای خالی برای هم‌ترازی */}
                            {isOstad && (
                                <>
                                    <div className="col-md-4"></div>
                                </>
                            )}
                        </div>
                    )}

                    {!filters.termCode && (
                        <div className="mt-2 text-warning small">
                            <i className="bi bi-info-circle me-1"></i>
                            برای مشاهده لیست، کد ترم را وارد کنید
                        </div>
                    )}
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
                                <option value="20">۲۰</option>
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
                                    <th>نام و نام خانوادگی</th>
                                    <th>کد استادی</th>
                                    <th>مرکز</th>
                                    <th>نوع همکاری</th>
                                    <th>مرتبه/مقطع</th>
                                    <th>رشته تحصیلی</th>
                                    <th>وضعیت برنامه</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center text-muted py-4">
                                            {filters.termCode ? 'هیچ استادی یافت نشد' : 'لطفاً کد ترم را وارد کنید'}
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => {
                                        const displayRank = item.noeHamkari === 3 || item.noeHamkari === 2
                                            ? getMaghtaText(item.maghta)
                                            : item.martabeElmi || '-';

                                        return (
                                            <tr
                                                key={item.ostadId}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleRowClick(item.ostadId)}
                                            >
                                                <td>
                                                    <PersianNumber>
                                                        {(pagination.page - 1) * pagination.pageSize + index + 1}
                                                    </PersianNumber>
                                                </td>
                                                <td>
                                                    <strong>{item.ostadName}</strong>
                                                </td>
                                                <td>
                                                    <PersianNumber>{item.ostadCode}</PersianNumber>
                                                </td>
                                                <td>{item.ostadMarkaz || '-'}</td>
                                                <td>
                                                    <span className={`badge ${getNoeHamkariClass(item.noeHamkari)}`}>
                                                        {getNoeHamkariText(item.noeHamkari)}
                                                    </span>
                                                </td>
                                                <td>{displayRank}</td>
                                                <td>{item.reshteh || '-'}</td>
                                                <td>{getStatusBadge(item.approveStatus)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* صفحه‌بندی */}
                    {pagination.totalPages > 1 && (
                        <nav>
                            <ul className="pagination justify-content-center">
                                <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.page - 1)}>
                                        قبلی
                                    </button>
                                </li>
                                {[...Array(Math.min(pagination.totalPages, 10)).keys()].map(num => {
                                    const pageNum = num + 1;
                                    return (
                                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                                                {pageNum}
                                            </button>
                                        </li>
                                    );
                                })}
                                {pagination.totalPages > 10 && (
                                    <li className="page-item disabled">
                                        <span className="page-link">...</span>
                                    </li>
                                )}
                                <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => handlePageChange(pagination.page + 1)}>
                                        بعدی
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {/* ============================================================
                مودال قفل گروهی
                ============================================================ */}
            {showBulkLockModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">قفل/باز کردن گروهی برنامه‌ها</h5>
                                <button type="button" className="btn-close" onClick={() => setShowBulkLockModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">نوع همکاری <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        value={bulkLockData.noeHamkari}
                                        onChange={(e) => setBulkLockData(prev => ({ ...prev, noeHamkari: e.target.value }))}
                                    >
                                        <option value="">همه اساتید</option>
                                        <option value="1">هیات علمی پیام نور</option>
                                        <option value="2">هیات علمی غیر پیام نور</option>
                                        <option value="3">مدرس مدعو</option>
                                        <option value="4">هیات علمی پیام نور (سایر استان‌ها)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">عملیات <span className="text-danger">*</span></label>
                                    <div className="d-flex gap-3">
                                        <div className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                id="actionLock"
                                                checked={bulkLockData.action === 'lock'}
                                                onChange={() => setBulkLockData(prev => ({ ...prev, action: 'lock' }))}
                                            />
                                            <label className="form-check-label" htmlFor="actionLock">
                                                <span className="text-danger">قفل</span> (غیرقابل ویرایش)
                                            </label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                id="actionUnlock"
                                                checked={bulkLockData.action === 'unlock'}
                                                onChange={() => setBulkLockData(prev => ({ ...prev, action: 'unlock' }))}
                                            />
                                            <label className="form-check-label" htmlFor="actionUnlock">
                                                <span className="text-success">باز کردن قفل</span> (قابل ویرایش)
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="alert alert-info small">
                                    <i className="bi bi-info-circle me-1"></i>
                                    این عملیات برای <strong>ترم {filters.termCode}</strong> و در <strong>سطح دسترسی شما</strong> اعمال می‌شود.
                                    {bulkLockData.noeHamkari && (
                                        <span> فقط اساتید با نوع همکاری <strong>{getNoeHamkariText(parseInt(bulkLockData.noeHamkari))}</strong> شامل می‌شوند.</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowBulkLockModal(false)}
                                >
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${bulkLockData.action === 'lock' ? 'btn-danger' : 'btn-success'}`}
                                    onClick={handleBulkLock}
                                    disabled={submitting || !bulkLockData.noeHamkari}
                                >
                                    {submitting ? 'در حال اجرا...' : 'اجرا'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showBulkLockModal && (
                <div
                    className="modal-backdrop show"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1040
                    }}
                    onClick={() => setShowBulkLockModal(false)}
                ></div>
            )}

            <ConfirmModal />
        </div>
    );
}