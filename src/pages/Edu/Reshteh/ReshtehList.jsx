import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../../context/AuthContext';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import ReshtehFormModal from './ReshtehFormModal';
import ReshtehBulkUploadModal from './ReshtehBulkUploadModal';


// ============================================================
// 🔥 بازیابی state از URL
// ============================================================
const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        search: params.get('search') || '',
        filterDaneshkade: params.get('filterDaneshkade') || '',
        filterGroohe: params.get('filterGroohe') || '',
        filterVazeeat: params.get('filterVazeeat') || '',
        page: parseInt(params.get('page') || '1', 10),
        pageSize: parseInt(params.get('pageSize') || '20', 10)
    };
};

// ============================================================
// 🔥 تابع تولید لیست صفحات با سه‌نقطه
// ============================================================
const getPaginationRange = (currentPage, totalPages) => {
    const delta = 1;  // ← یکی قبل و یکی بعد
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

export default function ReshtehList() {
    const { hasPermission } = useAuth();
    const { confirm, ConfirmModal } = useConfirm();

    // 🔥 بازیابی state
    const initialState = getInitialState();

    const [items, setItems] = useState([]);
    const [grooheList, setGrooheList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(initialState.search);
    const [filterDaneshkade, setFilterDaneshkade] = useState(initialState.filterDaneshkade);
    const [filterGroohe, setFilterGroohe] = useState(initialState.filterGroohe);
    const [filterVazeeat, setFilterVazeeat] = useState(initialState.filterVazeeat);
    const [filterMaghta, setFilterMaghta] = useState('');
    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);

    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

    // ============================================================
    // دریافت لیست
    // ============================================================
    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get('/Reshteh/list');
            if (response.data?.success) {
                setItems(response.data.data || []);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت لیست رشته‌ها');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroohes = async () => {
        try {
            const response = await api.get('/GrooheAmoozeshi/list');
            if (response.data?.success) {
                setGrooheList(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت گروه‌های آموزشی:', error);
        }
    };

    useEffect(() => {
        fetchItems();
        fetchGroohes();
    }, []);

    // ============================================================
    // لیست دانشکده‌های یکتا
    // ============================================================
    const uniqueDaneshkades = useMemo(() => {
        if (!grooheList) return [];
        const map = new Map();
        grooheList.forEach(g => {
            if (g.codeDaneshkade && g.naamDaneshkadeh && !map.has(g.codeDaneshkade)) {
                map.set(g.codeDaneshkade, g.naamDaneshkadeh);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }))
            .sort((a, b) => parseInt(a.code) - parseInt(b.code));
    }, [grooheList]);

    // ============================================================
    // لیست گروه‌های یک دانشکده (برای فیلتر)
    // ============================================================
    const groohesOfSelectedDaneshkade = useMemo(() => {
        if (!filterDaneshkade) return [];
        return grooheList.filter(g => g.codeDaneshkade === filterDaneshkade);
    }, [grooheList, filterDaneshkade]);

    // ============================================================
    // فیلتر + مرتب‌سازی
    // ============================================================
    const filteredItems = useMemo(() => {
        let filtered = [...items];

        // جستجو در کد و عنوان رشته
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            filtered = filtered.filter(item =>
                (item.codeReshte || '').toLowerCase().includes(s) ||
                (item.onvanReshte || '').toLowerCase().includes(s)
            );
        }
        //فیلتر مقطع
        if (filterMaghta) {
            filtered = filtered.filter(item =>
                String(item.codeMaghta) === String(filterMaghta)
            );
        }

        // فیلتر دانشکده
        if (filterDaneshkade) {
            filtered = filtered.filter(item => {
                const groohe = grooheList.find(g => g.id === item.grooheAmoozeshiId);
                return groohe?.codeDaneshkade === filterDaneshkade;
            });
        }

        // فیلتر گروه
        if (filterGroohe) {
            filtered = filtered.filter(item => item.grooheAmoozeshiId === parseInt(filterGroohe));
        }

        // فیلتر وضعیت
        if (filterVazeeat === 'true') {
            filtered = filtered.filter(item => item.vazeeat === true);
        } else if (filterVazeeat === 'false') {
            filtered = filtered.filter(item => item.vazeeat === false);
        }

        return filtered;
    }, [items, search, filterDaneshkade, filterGroohe, filterVazeeat, grooheList, filterMaghta]);

    // ============================================================
    // صفحه‌بندی
    // ============================================================
    const paginatedItems = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filteredItems.slice(start, start + pageSize);
    }, [filteredItems, page, pageSize]);

    const totalPages = Math.ceil(filteredItems.length / pageSize);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setPage(1);
    };

    // ============================================================
    // باز کردن مودال
    // ============================================================
    const openCreateModal = () => {
        setEditingItem(null);
        setShowFormModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setShowFormModal(true);
    };

    // ============================================================
    // حذف
    // ============================================================
    const handleDelete = async (item) => {
        const confirmed = await confirm({
            title: 'حذف رشته',
            message: `آیا از حذف رشته "${item.onvanReshte}" مطمئن هستید؟`,
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await api.delete(`/Reshteh/delete/${item.id}`);
            if (response.data?.success) {
                toast.success('رشته با موفقیت حذف شد');
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف رشته');
        }
    };

    // ============================================================
    // موفقیت فرم — ذخیره state در URL
    // ============================================================
    const handleFormSuccess = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterDaneshkade) params.set('filterDaneshkade', filterDaneshkade);
        if (filterGroohe) params.set('filterGroohe', filterGroohe);
        if (filterVazeeat) params.set('filterVazeeat', filterVazeeat);
        if (page > 1) params.set('page', page);
        if (pageSize !== 20) params.set('pageSize', pageSize);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.location.href = newUrl;
    };

    // ============================================================
    // توابع کمکی برای نمایش
    // ============================================================
    const getGrooheName = (grooheId) => {
        const groohe = grooheList.find(g => g.id === grooheId);
        return groohe?.onvanGrooheAmoozeshi || '-';
    };

    const getDaneshkadeName = (grooheId) => {
        const groohe = grooheList.find(g => g.id === grooheId);
        return groohe?.naamDaneshkadeh || '-';
    };

    const getMaghtaName = (codeMaghta) => {
        const map = { 5: 'کارشناسی', 10: 'کارشناسی ارشد', 15: 'دکتری تخصصی' };
        return map[codeMaghta] || codeMaghta || '-';
    };

    // ============================================================
    // رندر
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

    return (
        <>
            <div className="container-fluid">
                {/* هدر */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-0">مدیریت رشته‌ها</h4>
                        <small className="text-muted">لیست رشته‌های تحصیلی</small>
                    </div>
                    <div className="d-flex gap-2">
                        <PermissionWrapper permission="Reshteh.Create">
                            <button
                                className="btn btn-outline-success"
                                onClick={() => setShowBulkUploadModal(true)}
                            >
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                آپلود اکسل
                            </button>
                        </PermissionWrapper>

                        <PermissionWrapper permission="Reshteh.Create">
                            <button className="btn btn-primary" onClick={openCreateModal}>
                                <i className="bi bi-plus-circle me-2"></i>
                                رشته جدید
                            </button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* فیلترها */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-2">
                                <label className="form-label">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="کد رشته، عنوان رشته..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div className="col-md-2">
                                <label className="form-label">مقطع</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterMaghta}
                                    onChange={(e) => { setFilterMaghta(e.target.value); setPage(1); }}
                                >
                                    <option value="">همه مقاطع</option>
                                    <option value="5">کارشناسی</option>
                                    <option value="10">کارشناسی ارشد</option>
                                    <option value="15">دکتری تخصصی</option>
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">دانشکده</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterDaneshkade}
                                    onChange={(e) => {
                                        setFilterDaneshkade(e.target.value);
                                        setFilterGroohe('');
                                        setPage(1);
                                    }}
                                >
                                    <option value="">همه دانشکده‌ها</option>
                                    {uniqueDaneshkades.map(d => (
                                        <option key={d.code} value={d.code}>{d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">گروه آموزشی</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterGroohe}
                                    onChange={(e) => { setFilterGroohe(e.target.value); setPage(1); }}
                                    disabled={!filterDaneshkade}
                                >
                                    <option value="">همه گروه‌ها</option>
                                    {groohesOfSelectedDaneshkade.map(g => (
                                        <option key={g.id} value={g.id}>{g.onvanGrooheAmoozeshi}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-md-2">
                                <label className="form-label">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterVazeeat}
                                    onChange={(e) => { setFilterVazeeat(e.target.value); setPage(1); }}
                                >
                                    <option value="">همه</option>
                                    <option value="true">فعال</option>
                                    <option value="false">غیرفعال</option>
                                </select>
                            </div>

                            <div className="col-md-2 text-end">
                                <span className="badge bg-primary">
                                    مجموع: <PersianNumber>{filteredItems.length}</PersianNumber>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول */}
                <div className="card">
                    <div className="card-body p-0">
                        {paginatedItems.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>دانشکده</th>
                                            <th>گروه آموزشی</th>
                                            <th className="text-center">کد رشته</th>
                                            <th>عنوان رشته</th>
                                            <th className="text-center">مقطع</th>
                                            <th className="text-center">ترم ورود</th>
                                            <th className="text-center">ترم اعمال</th>
                                            <th className="text-center">وضعیت</th>
                                            <th className="text-center" style={{ width: '130px' }}>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedItems.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="text-center">
                                                    <PersianNumber>
                                                        {(page - 1) * pageSize + index + 1}
                                                    </PersianNumber>
                                                </td>
                                                <td>{getDaneshkadeName(item.grooheAmoozeshiId)}</td>
                                                <td>{getGrooheName(item.grooheAmoozeshiId)}</td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.codeReshte || '-'}</PersianNumber>
                                                </td>
                                                <td><strong>{item.onvanReshte || '-'}</strong></td>
                                                <td className="text-center">
                                                    {getMaghtaName(item.codeMaghta)}
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.termVorood || '-'}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.termEamal || '-'}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    {item.vazeeat ? (
                                                        <span className="badge bg-success">فعال</span>
                                                    ) : (
                                                        <span className="badge bg-danger">غیرفعال</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <PermissionWrapper permission="Reshteh.Update">
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => openEditModal(item)}
                                                                title="ویرایش"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </PermissionWrapper>
                                                        <PermissionWrapper permission="Reshteh.Delete">
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDelete(item)}
                                                                title="حذف"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </PermissionWrapper>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-muted py-5">
                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                <p>هیچ رشته‌ای یافت نشد</p>
                            </div>
                        )}
                    </div>

                    {/* صفحه‌بندی */}
                    {totalPages > 1 && (
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, filteredItems.length)} از {filteredItems.length}
                            </small>
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    {/* قبلی */}
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page === 1}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>

                                    {/* 🔥 صفحات با سه‌نقطه */}
                                    {getPaginationRange(page, totalPages).map((pageNum, index) => {
                                        if (pageNum === '...') {
                                            return (
                                                <li key={`dots-${index}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => handlePageChange(pageNum)}>
                                                    <PersianNumber>{pageNum}</PersianNumber>
                                                </button>
                                            </li>
                                        );
                                    })}

                                    {/* بعدی */}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={page === totalPages}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                            <div className="d-flex align-items-center gap-2">
                                <label className="text-muted small mb-0">تعداد در صفحه:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto' }}
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                >
                                    <option value="10">۱۰</option>
                                    <option value="20">۲۰</option>
                                    <option value="50">۵۰</option>
                                    <option value="100">۱۰۰</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* مودال */}
            <ReshtehFormModal
                key={`reshteh-modal-${editingItem?.id || 'new'}`}
                show={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                onSuccess={handleFormSuccess}
                item={editingItem}
                grooheList={grooheList}
            />

            <ReshtehBulkUploadModal
                show={showBulkUploadModal}
                onClose={() => setShowBulkUploadModal(false)}
                onSuccess={() => {
                    setShowBulkUploadModal(false);
                    // حفظ state در URL + رفرش
                    const params = new URLSearchParams();
                    if (search) params.set('search', search);
                    if (filterDaneshkade) params.set('filterDaneshkade', filterDaneshkade);
                    if (filterGroohe) params.set('filterGroohe', filterGroohe);
                    if (filterVazeeat) params.set('filterVazeeat', filterVazeeat);
                    if (page > 1) params.set('page', page);
                    if (pageSize !== 20) params.set('pageSize', pageSize);

                    const newUrl = `${window.location.pathname}?${params.toString()}`;
                    window.location.href = newUrl;
                }}
            />

            <ConfirmModal />
        </>
    );
}