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
    const { termList, currentTerm } = useTerm();  // ← currentTerm اضافه شد
    const { grooheList } = useGrooheAmoozeshi();
    const { reshtehList } = useReshteh();
    const { confirm, ConfirmModal } = useConfirm();
    const [ostadId, setOstadId] = useState(null);

    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 20,
        totalCount: 0,
        totalPages: 0
    });

    const [filters, setFilters] = useState({
        termCode: currentTerm?.codeTerm || '',
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
    // دریافت ostadId از user.id
    // ============================================================
    useEffect(() => {
        if (!user?.id) return;

        const fetchUserInfo = async () => {
            try {
                const response = await api.get(`/User/${user.id}`);
                if (response.data?.success) {
                    const data = response.data.data;
                    if (data?.ostadId) {
                        setOstadId(data.ostadId);
                    }
                }
            } catch (error) {
                console.error('خطا در دریافت اطلاعات کاربر:', error);
            }
        };

        fetchUserInfo();
    }, [user?.id]);
    // ============================================================
    // 🔥 بررسی دسترسی استاد برای ایجاد برنامه
    // ============================================================
    const canCreateProgram = useMemo(() => {
        if (!isOstad) return false;
        if (!filters.termCode) return false;

        const selectedTerm = termList.find(t => t.codeTerm === filters.termCode);
        if (!selectedTerm) return false;

        const now = new Date();

        // 1️⃣ بررسی مجوز ترم (تاریخ مجوز هم‌جاوری)
        if (!selectedTerm.tarikheShorooMojavezMarakez || !selectedTerm.tarikhePayanMojavezMarakez) return false;
        const start = new Date(selectedTerm.tarikheShorooMojavezMarakez);
        const end = new Date(selectedTerm.tarikhePayanMojavezMarakez);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        if (now < start || now > end) return false;

        // 2️⃣ بررسی اینکه ترم تمام نشده باشد
        const endDate = selectedTerm.termJariPayan || selectedTerm.tarikhePayanClass;
        if (endDate) {
            const termEnd = new Date(endDate);
            termEnd.setHours(23, 59, 59, 999);
            if (now > termEnd) return false;
        }

        return true;
    }, [isOstad, filters.termCode, termList]);

    // ============================================================
    // 🔥 بررسی اینکه آیا استاد قبلاً برنامه ثبت کرده است
    // ============================================================
    const hasProgram = useMemo(() => {
        if (!isOstad || !items.length) return false;
        return items.some(item => item.ostadId === ostadId && item.hasProgram);
    }, [items, isOstad, ostadId]);

    // ============================================================
    // Refها برای ذخیره‌ی مقادیر
    // ============================================================
    const pageRef = useRef(1);
    const pageSizeRef = useRef(20);
    const searchRef = useRef('');
    const reshtehRef = useRef('');
    const ostanIdRef = useRef('');
    const markazIdRef = useRef('');
    const noeHamkariRef = useRef('');
    const approveStatusRef = useRef('');
    const grooheAmoozeshiIdRef = useRef('');
    const termCodeRef = useRef(filters.termCode);

    // ============================================================
    // همگام‌سازی Stateها با Refها
    // ============================================================
    useEffect(() => { pageRef.current = pagination.page; }, [pagination.page]);
    useEffect(() => { pageSizeRef.current = pagination.pageSize; }, [pagination.pageSize]);
    useEffect(() => { searchRef.current = debouncedSearch; }, [debouncedSearch]);
    useEffect(() => { reshtehRef.current = debouncedReshteh; }, [debouncedReshteh]);
    useEffect(() => { ostanIdRef.current = filters.ostanId; }, [filters.ostanId]);
    useEffect(() => { markazIdRef.current = filters.markazId; }, [filters.markazId]);
    useEffect(() => { noeHamkariRef.current = filters.noeHamkari; }, [filters.noeHamkari]);
    useEffect(() => { approveStatusRef.current = filters.approveStatus; }, [filters.approveStatus]);
    useEffect(() => { grooheAmoozeshiIdRef.current = filters.grooheAmoozeshiId; }, [filters.grooheAmoozeshiId]);
    useEffect(() => { termCodeRef.current = filters.termCode; }, [filters.termCode]);

    // ============================================================
    // 🔥 بازیابی موقعیت هنگام بازگشت از جزئیات
    // ============================================================
    useEffect(() => {
        if (location.state?.fromDetail) {
            setIsRestoring(true);

            const savedPage = location.state.page || 1;
            const savedPageSize = location.state.pageSize || 20;
            const savedFilters = location.state.filters || {};
            const savedTermCode = location.state.termCode || '';

            setPagination(prev => ({
                ...prev,
                page: savedPage,
                pageSize: savedPageSize
            }));

            setFilters(prev => ({
                ...prev,
                ...savedFilters,
                termCode: savedTermCode || prev.termCode
            }));

            pageRef.current = savedPage;
            pageSizeRef.current = savedPageSize;
            termCodeRef.current = savedTermCode || termCodeRef.current;
            if (savedFilters.search !== undefined) searchRef.current = savedFilters.search;
            if (savedFilters.ostanId !== undefined) ostanIdRef.current = savedFilters.ostanId;
            if (savedFilters.markazId !== undefined) markazIdRef.current = savedFilters.markazId;
            if (savedFilters.reshteh !== undefined) reshtehRef.current = savedFilters.reshteh;
            if (savedFilters.approveStatus !== undefined) approveStatusRef.current = savedFilters.approveStatus;
            if (savedFilters.grooheAmoozeshiId !== undefined) grooheAmoozeshiIdRef.current = savedFilters.grooheAmoozeshiId;
            if (savedFilters.noeHamkari !== undefined) noeHamkariRef.current = savedFilters.noeHamkari;

            if (savedFilters.search !== undefined) setDebouncedSearch(savedFilters.search);
            if (savedFilters.reshteh !== undefined) setDebouncedReshteh(savedFilters.reshteh);

            window.history.replaceState({}, document.title);

            setTimeout(() => {
                setIsRestoring(false);
            }, 150);
        }
    }, [location.state]);

    // ============================================================
    // تنظیم استان پیش‌فرض برای مدیران
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
        if (isRestoring) return;

        setLoading(true);
        try {
            const params = {
                termCode: termCodeRef.current,
                search: searchRef.current || undefined,
                ostanId: ostanIdRef.current || undefined,
                markazId: markazIdRef.current || undefined,
                reshteh: reshtehRef.current || undefined,
                grooheAmoozeshiId: grooheAmoozeshiIdRef.current || undefined,
                noeHamkari: noeHamkariRef.current || undefined,
                approveStatus: approveStatusRef.current || undefined,
                page: pageRef.current,
                pageSize: pageSizeRef.current
            };

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
    }, [isRestoring]);

    // ============================================================
    // وقتی isRestoring false شد و ترم وجود دارد، fetch کن
    // ============================================================
    useEffect(() => {
        if (!isRestoring && termCodeRef.current) {
            fetchItems();
        }
    }, [isRestoring, fetchItems]);

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

    useEffect(() => {
        if (reshtehTimerRef.current) clearTimeout(reshtehTimerRef.current);
        reshtehTimerRef.current = setTimeout(() => {
            setDebouncedReshteh(filters.reshteh);
        }, 700);
        return () => clearTimeout(reshtehTimerRef.current);
    }, [filters.reshteh]);

    // ============================================================
    // وقتی فیلترها تغییر می‌کنند
    // ============================================================
    useEffect(() => {
        if (isRestoring) return;
        if (filters.termCode) {
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                fetchItems();
            }
        }
    }, [
        filters.termCode,
        filters.ostanId,
        filters.markazId,
        filters.approveStatus,
        filters.grooheAmoozeshiId,
        filters.noeHamkari,
        debouncedSearch,
        debouncedReshteh
    ]);

    useEffect(() => {
        if (isRestoring) return;
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
    const handleRowClick = (item) => {
        if (!item.hasProgram || !item.programId) {
            toast.info('برای این استاد در این ترم برنامه‌ای ثبت نشده است');
            return;
        }
        navigate(`/dashboard/barnameh-haftegi/${item.programId}`, {
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
        if (newPage < 1 || newPage > pagination.totalPages) return;
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    // ============================================================
    // صفحه‌بندی هوشمند
    // ============================================================
    const renderPagination = () => {
        const { page, totalPages } = pagination;
        if (totalPages <= 1) return null;

        const pages = [];
        pages.push(1);

        let start = Math.max(2, page - 2);
        let end = Math.min(totalPages - 1, page + 2);

        if (start > 2) {
            pages.push('...');
        }

        for (let i = start; i <= end; i++) {
            if (i === 1 || i === totalPages) continue;
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push('...');
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return (
            <nav className="mt-3">
                <ul className="pagination justify-content-center">
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(1)}>
                            <i className="bi bi-chevron-double-right"></i>
                        </button>
                    </li>
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page - 1)}>
                            <i className="bi bi-chevron-right"></i>
                        </button>
                    </li>

                    {pages.map((num, index) => {
                        if (num === '...') {
                            return (
                                <li key={`ellipsis-${index}`} className="page-item disabled">
                                    <span className="page-link">…</span>
                                </li>
                            );
                        }
                        return (
                            <li key={num} className={`page-item ${page === num ? 'active' : ''}`}>
                                <button className="page-link" onClick={() => handlePageChange(num)}>
                                    <PersianNumber>{num}</PersianNumber>
                                </button>
                            </li>
                        );
                    })}

                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(page + 1)}>
                            <i className="bi bi-chevron-left"></i>
                        </button>
                    </li>
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePageChange(totalPages)}>
                            <i className="bi bi-chevron-double-left"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    // ============================================================
    // وضعیت نمایشی
    // ============================================================
    const getStatusBadge = (status) => {
        const map = {
            'pishnevis': { label: 'پیش‌نویس', className: 'bg-secondary text-white' },
            'tayeed_ostad': { label: 'تایید استاد', className: 'bg-info text-white' },
            'tayeed_modir': { label: 'تایید مدیر گروه', className: 'bg-primary text-white' },
            'tayeed_moaven': { label: 'تایید معاون', className: 'bg-success text-white' },
            'no_program': { label: 'فاقد برنامه', className: 'bg-warning text-dark' }
        };
        const info = map[status] || map['no_program'];
        return <span className={`badge ${info.className}`}>{info.label}</span>;
    };

    const getNoeHamkariText = (noe) => {
        const map = {
            1: 'هیات علمی پیام نور',
            2: 'هیات علمی غیر پیام نور',
            3: 'مدرس مدعو',
            4: 'هیات علمی پیام نور (سایر استان‌ها)'
        };
        return map[noe] || '-';
    };

    const getNoeHamkariClass = (noe) => {
        if (noe === 1) return 'bg-success';
        if (noe === 4) return 'bg-info';
        if (noe === 2) return 'bg-primary';
        return 'bg-secondary';
    };

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
                <div className="d-flex gap-2">
                    {/* ============================================================
                        🔥 دکمه ایجاد برنامه هفتگی (فقط برای استاد)
                        ============================================================ */}
                    {isOstad && canCreateProgram && !hasProgram && (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                navigate('/dashboard/barnameh-haftegi-create', {
                                    state: { termCode: filters.termCode }
                                });
                            }}
                        >
                            <i className="bi bi-plus-circle me-2"></i>
                            ایجاد برنامه هفتگی
                        </button>
                    )}

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
            </div>

            {/* ============================================================
                فیلترها
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-3 align-items-end">
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

                    {showAdvancedFilters && (
                        <div className="row g-3 align-items-end mt-3">
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

                            <div className="col-md-2">
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

                            <div className="col-md-3">
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

                            <div className="col-md-3">
                                <label className="form-label">رشته تحصیلی</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="مثلاً کامپیوتر..."
                                    value={filters.reshteh}
                                    onChange={(e) => handleFilterChange('reshteh', e.target.value)}
                                />
                            </div>
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
                                                style={{ cursor: item.hasProgram ? 'pointer' : 'default' }}
                                                onClick={() => handleRowClick(item)}
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

                    {renderPagination()}
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