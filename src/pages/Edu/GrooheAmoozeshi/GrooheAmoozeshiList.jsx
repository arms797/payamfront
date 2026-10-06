import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../../context/AuthContext';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import GrooheAmoozeshiFormModal from './GrooheAmoozeshiFormModal';

// 🔥 تابع کمکی: بازیابی state
const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        search: params.get('search') || '',
        filterDaneshkade: params.get('filterDaneshkade') || '',
        filterVazeeyat: params.get('filterVazeeyat') || '',
        page: parseInt(params.get('page') || '1', 10),
        pageSize: parseInt(params.get('pageSize') || '20', 10)
    };
    /*
    try {
        const saved = sessionStorage.getItem('grooheList_state');
        if (saved) return JSON.parse(saved);
    } catch (e) {
        console.error('خطا در بازیابی state:', e);
    }
    return {};*/
};

export default function GrooheAmoozeshiList() {
    const { hasPermission } = useAuth();
    const { confirm, ConfirmModal } = useConfirm();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const initialState = getInitialState();
    const [search, setSearch] = useState(initialState.search);
    const [filterDaneshkade, setFilterDaneshkade] = useState(initialState.filterDaneshkade);
    const [filterVazeeat, setFilterVazeeat] = useState('');
    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const [listVersion, setListVersion] = useState(0);
    // مودال
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);



    useEffect(() => {
        sessionStorage.removeItem('grooheList_state');
    }, []);

    // ============================================================
    // دریافت لیست
    // ============================================================
    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await api.get('/GrooheAmoozeshi/list');
            if (response.data?.success) {
                setItems(response.data.data || []);
            }
            //console.log('All grooh :',response.data.data)
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت لیست گروه‌های آموزشی');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    // ============================================================
    // لیست دانشکده‌های یکتا (برای فیلتر)
    // ============================================================
    const uniqueDaneshkades = useMemo(() => {
        if (!items) return [];
        const map = new Map();
        items.forEach(item => {
            if (item.codeDaneshkade && item.naamDaneshkadeh && !map.has(item.codeDaneshkade)) {
                map.set(item.codeDaneshkade, item.naamDaneshkadeh);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fa'));
    }, [items]);

    // ============================================================
    // فیلتر + مرتب‌سازی
    // ============================================================
    const filteredItems = useMemo(() => {
        let filtered = [...items];

        if (search.trim()) {
            const s = search.trim().toLowerCase();
            filtered = filtered.filter(item =>
                (item.onvanGrooheAmoozeshi || '').toLowerCase().includes(s) ||
                (item.codeGrooheAmoozeshi || '').toLowerCase().includes(s) ||
                (item.naamDaneshkadeh || '').toLowerCase().includes(s) ||
                (item.codeDaneshkade || '').toLowerCase().includes(s)
            );
        }

        if (filterDaneshkade) {
            filtered = filtered.filter(item => item.codeDaneshkade === filterDaneshkade);
        }
        // 🔥 فیلتر وضعیت
        if (filterVazeeat === 'true') {
            filtered = filtered.filter(item => item.vazeeat === true);
        } else if (filterVazeeat === 'false') {
            filtered = filtered.filter(item => item.vazeeat === false);
        }

        // مرتب‌سازی: اول دانشکده، بعد گروه
        /*filtered.sort((a, b) => {
            const d = (a.codeDaneshkadeh || '').localeCompare(b.codeDaneshkadeh || '', 'fa');
            if (d !== 0) return d;
            return (a.codeGrooheAmoozeshi || '').localeCompare(b.codeGrooheAmoozeshi || '', 'fa');
        });*/

        return filtered;
    }, [items, search, filterDaneshkade, filterVazeeat]);

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
            title: 'حذف گروه آموزشی',
            message: `آیا از حذف گروه "${item.onvanGrooheAmoozeshi}" مطمئن هستید؟`,
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await api.delete(`/GrooheAmoozeshi/delete/${item.id}`);
            if (response.data?.success) {
                toast.success('گروه آموزشی با موفقیت حذف شد');
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف گروه آموزشی');
        }
    };

    // ============================================================
    // موفقیت فرم
    // ============================================================
    const handleFormSuccess = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterDaneshkade) params.set('filterDaneshkade', filterDaneshkade);
        if (filterVazeeat) params.set('filterVazeeat', filterVazeeat);
        if (page > 1) params.set('page', page);
        if (pageSize !== 20) params.set('pageSize', pageSize);

        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.location.href = newUrl;
        /*
                sessionStorage.setItem('grooheList_state', JSON.stringify({
                    search,
                    filterDaneshkade,
                    page,
                    pageSize
                }));
                // ۱. اول مودال رو ببند
                setShowFormModal(false);
                setEditingItem(null);
        
                // ۲. بعد از ۳۰۰ms لیست رو رفرش کن
                //fetchItems();
                //setListVersion(v => v + 1);
                // 🔥 رفرش کامل صفحه
                setTimeout(() => {
                    window.location.reload();
                }, 100);
                */
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
            <div className="container-fluid" key={listVersion}>
                {/* هدر */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="mb-0">مدیریت گروه‌های آموزشی</h4>
                        <small className="text-muted">لیست گروه‌های آموزشی دانشگاه</small>
                    </div>
                    <PermissionWrapper permission="GrooheAmoozeshi.Create">
                        <button className="btn btn-primary" onClick={openCreateModal}>
                            <i className="bi bi-plus-circle me-2"></i>
                            گروه آموزشی جدید
                        </button>
                    </PermissionWrapper>
                </div>

                {/* فیلترها */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <label className="form-label">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="عنوان گروه، کد گروه، نام دانشکده..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <div className="col-md-3">
                                <label className="form-label">دانشکده</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterDaneshkade}
                                    onChange={(e) => { setFilterDaneshkade(e.target.value); setPage(1); }}
                                >
                                    <option value="">همه دانشکده‌ها</option>
                                    {uniqueDaneshkades.map(d => (
                                        <option key={d.code} value={d.code}>{d.name}</option>
                                    ))}
                                </select>
                            </div>
                            {/* 🔥 فیلتر وضعیت */}
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
                            <div className="col-md-2">
                                <button
                                    className="btn btn-outline-secondary btn-sm w-100"
                                    onClick={() => {
                                        setSearch('');
                                        setFilterDaneshkade('');
                                        setFilterVazeeat('');
                                        setPage(1);
                                    }}
                                >
                                    <i className="bi bi-arrow-counterclockwise me-1"></i>
                                    ریست
                                </button>
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
                                            <th>کد دانشکده</th>
                                            <th>نام دانشکده</th>
                                            <th>کد گروه</th>
                                            <th>عنوان گروه آموزشی</th>
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
                                                <td className="text-center">
                                                    <PersianNumber>{item.codeDaneshkade || '-'}</PersianNumber>
                                                </td>
                                                <td>{item.naamDaneshkadeh || '-'}</td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.codeGrooheAmoozeshi || '-'}</PersianNumber>
                                                </td>
                                                <td><strong>{item.onvanGrooheAmoozeshi || '-'}</strong></td>
                                                <td className="text-center">
                                                    {item.vazeeat ? (
                                                        <span className="badge bg-success">فعال</span>
                                                    ) : (
                                                        <span className="badge bg-danger">غیرفعال</span>
                                                    )}
                                                </td>
                                                <td className="text-center">
                                                    <div className="d-flex gap-1 justify-content-center">
                                                        <PermissionWrapper permission="GrooheAmoozeshi.Update">
                                                            <button
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => openEditModal(item)}
                                                                title="ویرایش"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                        </PermissionWrapper>
                                                        <PermissionWrapper permission="GrooheAmoozeshi.Delete">
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
                                <p>هیچ گروه آموزشی یافت نشد</p>
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
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                    {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                                        <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => handlePageChange(p)}>
                                                <PersianNumber>{p}</PersianNumber>
                                            </button>
                                        </li>
                                    ))}
                                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
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

            {/* مودال ایجاد/ویرایش */}
            <GrooheAmoozeshiFormModal
                show={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                onSuccess={handleFormSuccess}
                item={editingItem}
            />

            <ConfirmModal />
        </>
    );
}