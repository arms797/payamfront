import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import { useMarkaz } from '../../context/MarkazContext';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import PersianNumber from '../../components/common/PersianNumber';
import MarkazEditModal from './MarkazEditModal';

// ============================================================
// 🔥 تابع تولید لیست صفحات با سه‌نقطه
// ============================================================
const getPaginationRange = (currentPage, totalPages) => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= currentPage - delta && i <= currentPage + delta)
        ) {
            range.push(i);
        }
    }

    for (let i of range) {
        if (l) {
            if (i - l === 2) {
                rangeWithDots.push(l + 1);
            } else if (i - l !== 1) {
                rangeWithDots.push('...');
            }
        }
        rangeWithDots.push(i);
        l = i;
    }

    return rangeWithDots;
};

// ============================================================
// 🔥 بازیابی state از sessionStorage
// ============================================================
const getInitialState = () => {
    try {
        const saved = sessionStorage.getItem('markazList_state');
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('خطا در بازیابی state:', e);
    }
    return {};
};

export default function MarkazList() {
    const { refreshMarkaz } = useMarkaz();

    // ============================================================
    // 🔥 Stateها با مقدار اولیه از sessionStorage
    // ============================================================
    const initialState = getInitialState();

    const [markazList, setMarkazList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState(initialState.search || '');
    const [filterOstan, setFilterOstan] = useState(initialState.filterOstan || '');
    const [filterVazeeyat, setFilterVazeeyat] = useState(initialState.filterVazeeyat || 'all');
    const [filterLevel, setFilterLevel] = useState(initialState.filterLevel || '');
    const [page, setPage] = useState(initialState.page || 1);
    const [pageSize, setPageSize] = useState(initialState.pageSize || 20);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMarkaz, setEditingMarkaz] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    // ============================================================
    // 🔥 پاک کردن state ذخیره‌شده بعد از بازیابی
    // ============================================================
    useEffect(() => {
        sessionStorage.removeItem('markazList_state');
    }, []);

    // ============================================================
    // دریافت همه مراکز
    // ============================================================
    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            try {
                const response = await api.get('/Markaz/list', { params: { all: true } });
                if (response.data?.data) {
                    setMarkazList(response.data.data);
                }
            } catch (error) {
                console.error('خطا در دریافت مراکز:', error);
                toast.error('خطا در دریافت لیست مراکز');
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // ============================================================
    // توابع کمکی
    // ============================================================
    const getLevelText = (level) => {
        const map = {
            1: 'سازمان مرکزی',
            2: 'سازمان مرکزی',
            3: 'ستاد استان',
            4: 'مرکز'
        };
        return map[level] || `سطح ${level}`;
    };

    const getNoeMarkazText = (noe) => {
        const map = { 1: 'حضوری', 2: 'مجازی', 3: 'حضوری و مجازی' };
        return map[noe] || '-';
    };

    // ============================================================
    // لیست استان‌های یکتا
    // ============================================================
    const uniqueOstans = useMemo(() => {
        if (!markazList) return [];
        const map = new Map();
        markazList.forEach(m => {
            if (m.codeOstan && m.naamOstan && !map.has(m.codeOstan)) {
                map.set(m.codeOstan, m.naamOstan);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fa'));
    }, [markazList]);

    // ============================================================
    // فیلتر + مرتب‌سازی
    // ============================================================
    const filteredMarkazs = useMemo(() => {
        if (!markazList) return [];
        let filtered = [...markazList];

        if (search.trim()) {
            const s = search.trim().toLowerCase();
            filtered = filtered.filter(m =>
                (m.naamMarkaz || '').toLowerCase().includes(s) ||
                (m.codeMarkaz || '').toLowerCase().includes(s) ||
                (m.naamOstan || '').toLowerCase().includes(s) ||
                (m.codeOstan || '').toLowerCase().includes(s)
            );
        }

        if (filterOstan) filtered = filtered.filter(m => m.codeOstan === filterOstan);
        if (filterVazeeyat === 'active') filtered = filtered.filter(m => m.vazeeyat === true);
        else if (filterVazeeyat === 'inactive') filtered = filtered.filter(m => m.vazeeyat !== true);
        if (filterLevel) filtered = filtered.filter(m => String(m.level) === String(filterLevel));

        filtered.sort((a, b) => {
            const c = (a.naamOstan || '').localeCompare(b.naamOstan || '', 'fa');
            if (c !== 0) return c;
            return (a.naamMarkaz || '').localeCompare(b.naamMarkaz || '', 'fa');
        });

        return filtered;
    }, [markazList, search, filterOstan, filterVazeeyat, filterLevel]);

    // ============================================================
    // صفحه‌بندی
    // ============================================================
    const paginatedMarkazs = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredMarkazs.slice(start, start + pageSize);
    }, [filteredMarkazs, page, pageSize]);

    const totalPages = Math.ceil(filteredMarkazs.length / pageSize);

    const handleFilterChange = (setter) => (value) => {
        setter(value);
        setPage(1);
    };

    // ============================================================
    // باز کردن مودال ویرایش
    // ============================================================
    const openEditModal = async (markaz) => {
        setLoadingDetail(true);
        try {
            const response = await api.get(`/Markaz/${markaz.id}`);
            if (response.data?.success && response.data.data) {
                setEditingMarkaz(response.data.data);
                setShowEditModal(true);
            } else {
                toast.error('خطا در دریافت اطلاعات مرکز');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت اطلاعات مرکز');
        } finally {
            setLoadingDetail(false);
        }
    };

    // ============================================================
    // 🔥 بستن مودال
    // ============================================================
    const handleCloseModal = () => {
        setShowEditModal(false);
        setEditingMarkaz(null);
    };

    // ============================================================
    // 🔥 بعد از ویرایش موفق: ذخیره state و reload
    // ============================================================
    const handleEditSuccess = () => {
        // ذخیره کل state
        sessionStorage.setItem('markazList_state', JSON.stringify({
            search,
            filterOstan,
            filterVazeeyat,
            filterLevel,
            page,
            pageSize
        }));

        // بستن مودال
        setShowEditModal(false);
        setEditingMarkaz(null);

        // رفرش صفحه بعد از ۳۰۰ms
        setTimeout(() => {
            window.location.reload();
        }, 300);
    };

    // ============================================================
    // لودینگ اولیه
    // ============================================================
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            <div className="container-fluid">
                {/* هدر */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">
                        <i className="bi bi-building me-2"></i>
                        مدیریت مراکز
                    </h4>
                    <span className="badge bg-primary">
                        مجموع: <PersianNumber>{filteredMarkazs.length}</PersianNumber> مرکز
                    </span>
                </div>

                {/* کارت فیلترها */}
                <div className="card mb-3">
                    <div className="card-body">
                        <div className="row g-2">
                            <div className="col-md-3">
                                <label className="form-label small mb-1">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="نام مرکز، کد مرکز..."
                                    value={search}
                                    onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
                                />
                            </div>

                            <div className="col-md-3">
                                <label className="form-label small mb-1">استان</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterOstan}
                                    onChange={(e) => handleFilterChange(setFilterOstan)(e.target.value)}
                                >
                                    <option value="">همه استان‌ها</option>
                                    {uniqueOstans.map(o => (
                                        <option key={o.code} value={o.code}>{o.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label small mb-1">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterVazeeyat}
                                    onChange={(e) => handleFilterChange(setFilterVazeeyat)(e.target.value)}
                                >
                                    <option value="all">همه</option>
                                    <option value="active">فعال</option>
                                    <option value="inactive">غیرفعال</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label small mb-1">سطح</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterLevel}
                                    onChange={(e) => handleFilterChange(setFilterLevel)(e.target.value)}
                                >
                                    <option value="">همه</option>
                                    <option value="2">سازمان مرکزی</option>
                                    <option value="3">ستاد استان</option>
                                    <option value="4">مرکز</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label small mb-1">تعداد در صفحه</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(parseInt(e.target.value));
                                        setPage(1);
                                    }}
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول */}
                <div className="card">
                    <div className="card-body p-0">
                        {paginatedMarkazs.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped table-sm mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>کد مرکز</th>
                                            <th>نام مرکز</th>
                                            <th>استان</th>
                                            <th>سطح</th>
                                            <th>نوع مرکز</th>
                                            <th>تلفن</th>
                                            <th className="text-center">وضعیت</th>
                                            <th className="text-center" style={{ width: '100px' }}>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedMarkazs.map((markaz, index) => (
                                            <tr key={`markaz-row-${markaz.id}`}>
                                                <td>{(page - 1) * pageSize + index + 1}</td>
                                                <td>{markaz.codeMarkaz || '-'}</td>
                                                <td className="fw-bold">{markaz.naamMarkaz || '-'}</td>
                                                <td>{markaz.naamOstan || '-'}</td>
                                                <td>
                                                    <span className="badge bg-info text-dark">
                                                        {getLevelText(markaz.level)}
                                                    </span>
                                                </td>
                                                <td><small>{getNoeMarkazText(markaz.noeMarkaz)}</small></td>
                                                <td>{markaz.telefon || '-'}</td>
                                                <td className="text-center">
                                                    {markaz.vazeeyat ? (
                                                        <span className="badge bg-success">
                                                            <i className="bi bi-check-circle me-1"></i>
                                                            فعال
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-danger">
                                                            <i className="bi bi-x-circle me-1"></i>
                                                            غیرفعال
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <PermissionWrapper permission="Markaz.Update">
                                                        <button
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => openEditModal(markaz)}
                                                            disabled={loadingDetail}
                                                            title="ویرایش"
                                                        >
                                                            {loadingDetail ? (
                                                                <span className="spinner-border spinner-border-sm" role="status"></span>
                                                            ) : (
                                                                <i className="bi bi-pencil"></i>
                                                            )}
                                                        </button>
                                                    </PermissionWrapper>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-muted py-5">
                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                <p>هیچ مرکزی با این فیلترها یافت نشد</p>
                            </div>
                        )}
                    </div>

                    {/* صفحه‌بندی */}
                    {totalPages > 1 && (
                        <div className="card-footer d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <small className="text-muted">
                                نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, filteredMarkazs.length)} از {filteredMarkazs.length}
                            </small>

                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>

                                    {getPaginationRange(page, totalPages).map((pageNum, index) => {
                                        if (pageNum === '...') {
                                            return (
                                                <li key={`pag-dots-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }

                                        return (
                                            <li
                                                key={`pag-${pageNum}`}
                                                className={`page-item ${page === pageNum ? 'active' : ''}`}
                                            >
                                                <button
                                                    className="page-link"
                                                    onClick={() => setPage(pageNum)}
                                                >
                                                    <PersianNumber>{pageNum}</PersianNumber>
                                                </button>
                                            </li>
                                        );
                                    })}

                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    )}
                </div>
            </div>

            {/* مودال ویرایش */}
            <MarkazEditModal
                show={showEditModal}
                onClose={handleCloseModal}
                onSuccess={handleEditSuccess}
                markaz={editingMarkaz}
            />
        </>
    );
}