import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';

export default function OstadList() {
    const navigate = useNavigate();
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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedOstanId, setSelectedOstanId] = useState('');
    const [selectedMarkazId, setSelectedMarkazId] = useState('');
    const [selectedNoeHamkari, setSelectedNoeHamkari] = useState('');
    const [vazeeat, setVazeeat] = useState('true');
    const [reshteh, setReshteh] = useState('');
    const [debouncedReshteh, setDebouncedReshteh] = useState('');

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
    // 🔥 Debounce برای جستجو (تاخیر ۵۰۰ میلی‌ثانیه)
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 700);

        return () => clearTimeout(timer);
    }, [search]);

    // ============================================================
    // 🔥 Debounce برای رشته تحصیلی (تاخیر ۵۰۰ میلی‌ثانیه)
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedReshteh(reshteh);
        }, 700);

        return () => clearTimeout(timer);
    }, [reshteh]);

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

    // ============================================================
    // تعیین استان پیش‌فرض بر اساس نقش کاربر
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
    // بررسی مجوز مشاهده
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
    // دریافت لیست اساتید
    // ============================================================
    const fetchOstads = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                pageSize: pagination.pageSize,
                search: debouncedSearch || undefined,
                vazeeat: vazeeat === 'all' ? undefined : vazeeat === 'true',
                reshteh: debouncedReshteh || undefined,
                noeHamkari: selectedNoeHamkari || undefined
            };

            if (selectedOstanId && !selectedMarkazId) {
                params.ostanId = parseInt(selectedOstanId);
            } else if (selectedOstanId && selectedMarkazId) {
                params.ostanId = parseInt(selectedOstanId);
                params.markazId = parseInt(selectedMarkazId);
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
    }, [pagination.page, pagination.pageSize, debouncedSearch, debouncedReshteh, selectedOstanId, selectedMarkazId, vazeeat, selectedNoeHamkari]);

    useEffect(() => {
        fetchOstads();
    }, [fetchOstads]);

    // ============================================================
    // تغییر صفحه
    // ============================================================
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const handlePageSizeChange = (e) => {
        setPagination(prev => ({ ...prev, pageSize: parseInt(e.target.value), page: 1 }));
    };

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
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

            {/* ============================================================
                فیلترها
                ============================================================ */}
            <div className="card mb-4">
                <div className="card-body">
                    <div className="row g-2 align-items-end">
                        {/* جستجو */}
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

                        {/* رشته تحصیلی */}
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

                        {/* استان */}
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

                        {/* مرکز */}
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

                        {/* نوع همکاری */}
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

                        {/* وضعیت */}
                        <div className="col-md-2">
                            <label className="form-label">وضعیت</label>
                            <select
                                className="form-select form-select-sm"
                                value={vazeeat}
                                onChange={(e) => setVazeeat(e.target.value)}
                            >
                                <option value="true">فعال</option>
                                <option value="false">غیرفعال</option>
                                <option value="all">همه</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                جدول اساتید
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
                                        <td colSpan="8" className="text-center text-muted">
                                            هیچ استادی یافت نشد
                                        </td>
                                    </tr>
                                ) : (
                                    ostads.map((ostad, index) => (
                                        <tr
                                            key={ostad.id}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => navigate(`/dashboard/ostad/${ostad.id}`)}
                                        >
                                            <td>{(pagination.page - 1) * pagination.pageSize + index + 1}</td>
                                            <td><code>{ostad.codeOstadi}</code></td>
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
                                                <span className={`badge ${ostad.vazeeat ? 'bg-success' : 'bg-danger'}`}>
                                                    {ostad.vazeeat ? 'فعال' : 'غیرفعال'}
                                                </span>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                {/* ============================================================
                                                    ❌ عملیات - خالی (فقط برای کلیک روی ردیف)
                                                    ============================================================ */}
                                                <span className="text-muted small">-</span>
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
        </div>
    );
}