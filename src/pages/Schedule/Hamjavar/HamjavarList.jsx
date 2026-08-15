// src/pages/Schedule/Hamjavar/HamjavarList.jsx
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTerm } from '../../../context/TermContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';

// توابع کمکی
import { getStatusBadge } from './HamjavarHelpers';

export default function HamjavarList() {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const { termList, currentTermCode } = useTerm();
    const { markazList, loading: markazLoading } = useMarkaz();
    const { ConfirmModal } = useConfirm();

    // ============================================================
    // تشخیص نقش کاربر
    // ============================================================
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isMoaven = useMemo(() => hasPermission('Hamjavar.ReviewMoaven') || hasPermission('Hamjavar.CreateMoaven'), [hasPermission]);

    // ============================================================
    // 🔥 دریافت CodeRole کاربر
    // ============================================================
    const codeRole = useMemo(() => {
        try {
            if (user?.codeRole) return user.codeRole;
            const activeRole = user?.roles?.find(r => r.id === user?.currentRoleId);
            return activeRole?.codeRole || 4;
        } catch (error) {
            console.error('خطا در دریافت CodeRole:', error);
            return 4;
        }
    }, [user]);

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
        status: '',
        fromDate: '',
        toDate: ''
    });

    // ============================================================
    // 🔥 State برای جستجوی Debounce شده
    // ============================================================
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const searchTimerRef = useRef(null);

    // ============================================================
    // 🔥 Debounce برای جستجو (700ms)
    // ============================================================
    useEffect(() => {
        if (searchTimerRef.current) {
            clearTimeout(searchTimerRef.current);
        }

        searchTimerRef.current = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 700);

        return () => {
            if (searchTimerRef.current) {
                clearTimeout(searchTimerRef.current);
            }
        };
    }, [filters.search]);

    // ============================================================
    // 🔥 وقتی debouncedSearch تغییر کرد، fetch انجام شود
    // ============================================================
    useEffect(() => {
        if (pagination.page === 1) {
            fetchItems();
        } else {
            setPagination(prev => ({ ...prev, page: 1 }));
        }
    }, [debouncedSearch, filters.termCode, filters.ostanId, filters.markazId, filters.status]);

    // ============================================================
    // 🔥 تعیین استان‌های قابل دسترس بر اساس CodeRole
    // ============================================================
    const accessibleOstans = useMemo(() => {
        try {
            if (!markazList || markazList.length === 0) return [];

            let filteredMarkaz = markazList.filter(m => m.vazeeyat !== false);

            if (codeRole === 1 || codeRole === 2) {
                // همه استان‌ها
            } else if (codeRole === 3) {
                const userOstanCode = user?.markazOstan;
                if (!userOstanCode) return [];
                filteredMarkaz = filteredMarkaz.filter(m => m.codeOstan === userOstanCode);
            } else if (codeRole === 4) {
                const userOstanCode = user?.markazOstan;
                if (!userOstanCode) return [];
                filteredMarkaz = filteredMarkaz.filter(m => m.codeOstan === userOstanCode);
            }

            const uniqueOstans = filteredMarkaz
                .filter(m => m.codeOstan)
                .reduce((acc, curr) => {
                    if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                        acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
                    }
                    return acc;
                }, []);

            return uniqueOstans;
        } catch (error) {
            console.error('خطا در دریافت استان‌های قابل دسترس:', error);
            return [];
        }
    }, [markazList, codeRole, user]);

    // ============================================================
    // 🔥 لیست مراکز قابل دسترس بر اساس استان انتخاب‌شده و CodeRole
    // ============================================================
    const accessibleMarkazs = useMemo(() => {
        try {
            if (!markazList || !filters.ostanId) return [];

            let filtered = markazList.filter(m =>
                m.codeOstan === filters.ostanId &&
                m.vazeeyat !== false
            );

            if (codeRole === 4 && user?.markazId) {
                filtered = filtered.filter(m => m.id === user.markazId);
            }

            return filtered;
        } catch (error) {
            console.error('خطا در دریافت مراکز قابل دسترس:', error);
            return [];
        }
    }, [markazList, filters.ostanId, codeRole, user]);

    // ============================================================
    // 🔥 تابع کمکی برای نمایش نام مرکز بر اساس Level
    // ============================================================
    const getDisplayName = useCallback((markaz) => {
        if (!markaz) return '';

        try {
            if (markaz.level === 2) {
                return 'سازمان مرکزی';
            }
            if (markaz.level === 3) {
                return `ستاد استان ${markaz.naamOstan || ''}`;
            }
            return markaz.naamMarkaz || '';
        } catch (error) {
            console.error('خطا در نمایش نام مرکز:', error);
            return markaz?.naamMarkaz || '';
        }
    }, []);

    // ============================================================
    // 🔥 تنظیم استان پیش‌فرض برای کاربران CodeRole 3 و 4
    // ============================================================
    useEffect(() => {
        try {
            if (markazList && markazList.length > 0 && (codeRole === 3 || codeRole === 4)) {
                const userOstanCode = user?.markazOstan;
                if (userOstanCode && accessibleOstans.some(o => o.codeOstan === userOstanCode)) {
                    setFilters(prev => ({ ...prev, ostanId: userOstanCode }));
                }
            }
        } catch (error) {
            console.error('خطا در تنظیم استان پیش‌فرض:', error);
        }
    }, [markazList, codeRole, user, accessibleOstans]);

    // ============================================================
    // دریافت لیست درخواست‌ها
    // ============================================================
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                termCode: filters.termCode || undefined,
                search: debouncedSearch || undefined,
                markazId: filters.markazId || undefined,
                status: filters.status || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined
            };

            const response = await api.get('/Hamjavar/list', { params });
            if (response.data?.success) {
                setItems(response.data.data || []);
                setPagination(prev => ({
                    ...prev,
                    totalCount: response.data.pagination?.totalCount || 0,
                    totalPages: response.data.pagination?.totalPages || 0
                }));
            }
        } catch (error) {
            console.error('خطا در دریافت لیست:', error);
            toast.error('خطا در دریافت لیست درخواست‌ها');
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.pageSize, filters, debouncedSearch]);

    // ============================================================
    // 🔥 وقتی صفحه یا pageSize تغییر کرد، fetch انجام شود
    // ============================================================
    useEffect(() => {
        fetchItems();
    }, [pagination.page, pagination.pageSize]);

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
    // ریست فیلترها
    // ============================================================
    const resetFilters = () => {
        const defaultOstanId = (codeRole === 3 || codeRole === 4) ? (user?.markazOstan || '') : '';
        setFilters({
            termCode: currentTermCode || '',
            search: '',
            ostanId: defaultOstanId,
            markazId: '',
            status: '',
            fromDate: '',
            toDate: ''
        });
        setDebouncedSearch('');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // ============================================================
    // 🔥 گزینه‌های وضعیت برای فیلتر (فقط وضعیت‌های جدید)
    // ============================================================
    const statusOptions = [
        { value: '', label: 'همه' },
        { value: 'PishNevis', label: 'پیش‌نویس' },
        { value: 'Taeed', label: 'تایید' },
        { value: 'Rad', label: 'رد ❌' },
        { value: 'Eslah', label: 'اصلاح ✏️' }
    ];

    // ============================================================
    // کلیک روی ردیف → هدایت به صفحه جزئیات
    // ============================================================
    const handleRowClick = (itemId) => {
        navigate(`/dashboard/tadris-hamjavar-detailes/${itemId}`);
    };

    // ============================================================
    // هدایت به صفحه ایجاد درخواست جدید
    // ============================================================
    const goToCreate = () => {
        navigate('/dashboard/tadris-hamjavar-create');
    };

    // ============================================================
    // تغییر استان → ریست مرکز
    // ============================================================
    const handleOstanChange = (e) => {
        const ostanId = e.target.value;
        setFilters(prev => ({
            ...prev,
            ostanId: ostanId,
            markazId: ''
        }));
    };

    // اگر مراکز در حال بارگذاری هستند
    if (markazLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری مراکز...</span>
                </div>
            </div>
        );
    }

    // اگر markazList خالی است یا undefined
    if (!markazList) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    اطلاعات مراکز در دسترس نیست
                </div>
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
                    <h4 className="mb-0">درخواست‌های تدریس در سایر مراکز</h4>
                    <small className="text-muted">
                        برای مشاهده جزئیات و انجام عملیات، روی هر ردیف کلیک کنید
                    </small>
                </div>
                {(isOstad || isMoaven) && (
                    <PermissionWrapper permission={isMoaven ? 'Hamjavar.CreateMoaven' : 'Hamjavar.Create'}>
                        <button
                            className="btn btn-primary"
                            onClick={goToCreate}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            تقاضای جدید
                        </button>
                    </PermissionWrapper>
                )}
            </div>

            {/* ============================================================
                فیلترها
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">

                        {/* جستجو - فقط برای غیر استاد */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="نام، کد استادی..."
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                        )}

                        {/* ترم */}
                        <div className="col-md-3">
                            <label className="form-label">ترم</label>
                            <select
                                className="form-select form-select-sm"
                                value={filters.termCode}
                                onChange={(e) => setFilters(prev => ({ ...prev, termCode: e.target.value }))}
                            >
                                {termList.map(term => (
                                    <option key={term.codeTerm} value={term.codeTerm}>
                                        <PersianNumber>{term.onvanTerm}</PersianNumber>
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* استان - فقط برای غیر استاد */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">استان</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.ostanId}
                                    onChange={handleOstanChange}
                                    disabled={codeRole === 3 || codeRole === 4}
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

                        {/* مرکز - فقط برای غیر استاد */}
                        {!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">مرکز</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.markazId}
                                    onChange={(e) => setFilters(prev => ({ ...prev, markazId: e.target.value }))}
                                    disabled={!filters.ostanId || accessibleMarkazs.length === 0}
                                >
                                    <option value="">همه مراکز</option>
                                    {accessibleMarkazs.map(markaz => {
                                        const displayName = getDisplayName(markaz);
                                        const finalName = displayName || markaz.naamMarkaz || `مرکز ${markaz.id}`;
                                        return (
                                            <option key={markaz.id} value={markaz.id}>
                                                {finalName}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        )}

                        {/* وضعیت - فقط برای غیر استاد */}
                        {/*!isOstad && (
                            <div className="col-md-2">
                                <label className="form-label">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filters.status}
                                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        )*/}
                    </div>
                </div>
            </div>

            {/* ============================================================
                جدول لیست
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
                            تعداد کل: <PersianNumber>{pagination.totalCount}</PersianNumber> درخواست
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
                                    <th>ترم</th>                                    
                                    <th>نام استاد</th>
                                    <th>کد استادی</th>
                                    <th>مرکز فعلی</th>
                                    <th><small>تعداد واحد موظف</small></th>
                                    <th><small> آخرین مرحله بررسی</small></th>
                                    <th>وضعیت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="text-center text-muted py-4">
                                            هیچ درخواستی یافت نشد
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handleRowClick(item.id)}
                                            className="table-row-clickable"
                                        >
                                            <td><PersianNumber>{(pagination.page - 1) * pagination.pageSize + index + 1}</PersianNumber></td>
                                            <td><PersianNumber>{item.termCode}</PersianNumber></td>
                                            
                                            <td><strong>{item.ostadName}</strong></td>
                                            <td><PersianNumber>{item.ostadCode}</PersianNumber></td>
                                            <td>{item.ostadMarkaz || '-'}</td>
                                            <td><PersianNumber>{item.vahedMovazaf}</PersianNumber></td>
                                            <td>{item.akharinBarrasi || '-'}</td>
                                            <td>{getStatusBadge(item.akharinTaghaza)}</td>
                                        </tr>
                                    ))
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
                                                <PersianNumber>{pageNum}</PersianNumber>
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

            <ConfirmModal />
        </div>
    );
}