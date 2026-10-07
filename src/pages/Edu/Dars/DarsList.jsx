import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../../context/AuthContext';
import { useGrooheAmoozeshi } from '../../../context/GrooheAmoozeshiContext';
import { useReshteh } from '../../../context/ReshtehContext';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import CascadingFilter from '../../../components/common/CascadingFilter';
import DarsFormModal from './DarsFormModal';
import MultiSelectWrapper from '../../../components/common/MultiSelectWrapper';
import DarsBulkUploadModal from './DarsBulkUploadModal';
// ============================================================
// 🔥 بازیابی state از URL
// ============================================================
const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const parseArray = (key) => {
        const val = params.get(key);
        return val ? val.split(',').filter(Boolean) : [];
    };
    return {
        search: params.get('search') || '',
        maghtas: parseArray('maghtas'),
        daneshkades: parseArray('daneshkades'),
        groohes: parseArray('groohes'),
        reshtehs: parseArray('reshtehs'),
        vahedTypes: parseArray('vahedTypes'),
        termAkhzs: parseArray('termAkhzs'),
        noeDarsList: parseArray('noeDarsList'),
        manbaSearch: params.get('manbaSearch') || '',
        page: parseInt(params.get('page') || '1', 10),
        pageSize: parseInt(params.get('pageSize') || '20', 10)
    };
};

// ============================================================
// 🔥 تابع تولید لیست صفحات با سه‌نقطه
// ============================================================
const getPaginationRange = (currentPage, totalPages) => {
    const delta = 1;
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

export default function DarsList() {
    const { hasPermission } = useAuth();
    const { confirm, ConfirmModal } = useConfirm();
    const { grooheList, getGrooheName } = useGrooheAmoozeshi();
    const { reshtehList, getReshtehName } = useReshteh();

    const initialState = getInitialState();

    // Stateهای فیلتر
    const [search, setSearch] = useState(initialState.search);
    const [filterMaghtas, setFilterMaghtas] = useState(initialState.maghtas);
    const [filterDaneshkades, setFilterDaneshkades] = useState(initialState.daneshkades);
    const [filterGroohes, setFilterGroohes] = useState(initialState.groohes);
    const [filterReshtehs, setFilterReshtehs] = useState(initialState.reshtehs);
    const [filterVahedTypes, setFilterVahedTypes] = useState(initialState.vahedTypes);
    const [filterTermAkhzs, setFilterTermAkhzs] = useState(initialState.termAkhzs);
    const [filterNoeDars, setFilterNoeDars] = useState(initialState.noeDarsList);
    const [manbaSearch, setManbaSearch] = useState(initialState.manbaSearch);

    // صفحه‌بندی
    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);

    // داده‌ها
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    // لیست نوع درس
    const [noeDarsList, setNoeDarsList] = useState([]);

    // مودال
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

    // ============================================================
    // گزینه‌های واحد
    // ============================================================
    const vahedOptions = [
        { value: 'teori', label: 'صرفاً تئوری' },
        { value: 'amali', label: 'صرفاً عملی' },
        { value: 'teori_amali', label: 'تئوری عملی' }
    ];

    // ============================================================
    // گزینه‌های ترم اخذ
    // ============================================================
    const termOptions = useMemo(() => {
        const opts = [{ value: 'null', label: 'فاقد ترم اخذ' }];
        for (let i = 0; i <= 9; i++) {
            opts.push({ value: String(i), label: `ترم ${i}` });
        }
        return opts;
    }, []);

    // ============================================================
    // دریافت لیست درس‌ها
    // ============================================================
    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            filterMaghtas.forEach(v => params.append('maghtas', v));
            filterDaneshkades.forEach(v => params.append('daneshkades', v));
            filterGroohes.forEach(v => params.append('grooheAmoozeshiIds', v));
            filterReshtehs.forEach(v => params.append('reshtehIds', v));
            filterVahedTypes.forEach(v => params.append('vahedTypes', v));
            filterTermAkhzs.forEach(v => params.append('termAkhzs', v));
            filterNoeDars.forEach(v => params.append('noeDarsList', v));
            if (manbaSearch) params.append('manbaSearch', manbaSearch);
            params.append('page', page);
            params.append('pageSize', pageSize);

            const response = await api.get(`/Dars/list?${params.toString()}`);
            if (response.data?.success) {
                setItems(response.data.data || []);
                setPagination(response.data.pagination || { totalCount: 0, totalPages: 0 });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت لیست درس‌ها');
        } finally {
            setLoading(false);
        }
    };

    const fetchNoeDars = async () => {
        try {
            const response = await api.get('/Dars/noedars-list');
            if (response.data?.success) {
                setNoeDarsList(response.data.data || []);
            }
        } catch (error) {
            console.error('خطا در دریافت نوع درس‌ها:', error);
        }
    };

    useEffect(() => {
        fetchItems();
    }, [
        search, filterMaghtas, filterDaneshkades, filterGroohes,
        filterReshtehs, filterVahedTypes, filterTermAkhzs,
        filterNoeDars, manbaSearch, page, pageSize
    ]);

    useEffect(() => {
        fetchNoeDars();
    }, []);

    // ============================================================
    // درخواست با تأخیر (debounce) برای manbaSearch
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            if (manbaSearch !== initialState.manbaSearch) {
                setPage(1);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [manbaSearch]);

    // ============================================================
    // عملیات
    // ============================================================
    const openCreateModal = () => {
        setEditingItem(null);
        setShowFormModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setShowFormModal(true);
    };

    const handleDelete = async (item) => {
        const confirmed = await confirm({
            title: 'حذف درس',
            message: `آیا از حذف درس "${item.naamDars}" مطمئن هستید؟`,
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        try {
            const response = await api.delete(`/Dars/delete/${item.id}`);
            if (response.data?.success) {
                toast.success('درس با موفقیت حذف شد');
                fetchItems();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در حذف درس');
        }
    };

    // ============================================================
    // ذخیره state در URL
    // ============================================================
    const handleFormSuccess = () => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (filterMaghtas.length) params.set('maghtas', filterMaghtas.join(','));
        if (filterDaneshkades.length) params.set('daneshkades', filterDaneshkades.join(','));
        if (filterGroohes.length) params.set('groohes', filterGroohes.join(','));
        if (filterReshtehs.length) params.set('reshtehs', filterReshtehs.join(','));
        if (filterVahedTypes.length) params.set('vahedTypes', filterVahedTypes.join(','));
        if (filterTermAkhzs.length) params.set('termAkhzs', filterTermAkhzs.join(','));
        if (filterNoeDars.length) params.set('noeDarsList', filterNoeDars.join(','));
        if (manbaSearch) params.set('manbaSearch', manbaSearch);
        if (page > 1) params.set('page', page);
        if (pageSize !== 20) params.set('pageSize', pageSize);

        window.location.href = `${window.location.pathname}?${params.toString()}`;
    };

    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            <div className="container-fluid">
                {/* هدر */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="mb-0">مدیریت درس‌ها</h5>
                    </div>
                    <div className="d-flex gap-2">
                        {/* 🔥 دکمه آپلود اکسل */}
                        <PermissionWrapper permission="Dars.BulkUpload">
                            <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => setShowBulkUploadModal(true)}
                            >
                                <i className="bi bi-file-earmark-excel me-1"></i>
                                آپلود اکسل
                            </button>
                        </PermissionWrapper>

                        {/* دکمه درس جدید */}
                        <PermissionWrapper permission="Dars.Create">
                            <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                                <i className="bi bi-plus-circle me-1"></i>
                                درس جدید
                            </button>
                        </PermissionWrapper>
                    </div>
                </div>

                {/* 🔥 فیلترها: همه در یک کارت */}
                <div className="card mb-3">
                    <div className="card-body py-2">
                        {/* ============================================================ */}
                        {/* ردیف ۱: فیلتر آبشاری */}
                        {/* ============================================================ */}
                        <CascadingFilter
                            grooheList={grooheList}
                            reshtehList={reshtehList}
                            selectedMaghtas={filterMaghtas}
                            selectedDaneshkades={filterDaneshkades}
                            selectedGroohes={filterGroohes}
                            selectedReshtehs={filterReshtehs}
                            onMaghtaChange={(v) => { setFilterMaghtas(v); setPage(1); }}
                            onDaneshkadeChange={(v) => { setFilterDaneshkades(v); setPage(1); }}
                            onGrooheChange={(v) => { setFilterGroohes(v); setPage(1); }}
                            onReshtehChange={(v) => { setFilterReshtehs(v); setPage(1); }}
                            hideIndicator={true}
                        />

                        {/* ============================================================ */}
                        {/* ردیف ۲: سایر فیلترها */}
                        {/* ============================================================ */}
                        <div className="row g-2 align-items-end mt-2 pt-2 border-top">
                            {/* جستجو */}
                            <div className="col-md-3">
                                <label className="form-label small mb-1">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="کد درس یا نام درس..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>

                            {/* واحد درس */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">نوع واحد درس</label>
                                <MultiSelectWrapper
                                    options={vahedOptions}
                                    value={filterVahedTypes}
                                    onChange={(v) => { setFilterVahedTypes(v); setPage(1); }}
                                    placeholder="نوع واحد..."
                                    hideIndicator={true}   // 🔥 فقط فلش حذف میشه

                                />
                            </div>

                            {/* ترم اخذ */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">ترم اخذ</label>
                                <MultiSelectWrapper
                                    options={termOptions}
                                    value={filterTermAkhzs}
                                    onChange={(v) => { setFilterTermAkhzs(v); setPage(1); }}
                                    placeholder="انتخاب ترم..."
                                    hideIndicator={true}
                                />
                            </div>

                            {/* نوع درس */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">نوع درس</label>
                                <MultiSelectWrapper
                                    options={noeDarsList.map(n => ({ value: n, label: n }))}
                                    value={filterNoeDars}
                                    onChange={(v) => { setFilterNoeDars(v); setPage(1); }}
                                    placeholder=" نوع درس..."
                                    hideIndicator={true}
                                />
                            </div>

                            {/* منبع */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">منبع درس</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="شماره یا عنوان..."
                                    value={manbaSearch}
                                    onChange={(e) => setManbaSearch(e.target.value)}
                                />
                            </div>

                            {/* مجموع */}
                            <div className="col-md-1 text-end">
                                <span className="badge bg-primary">
                                    <PersianNumber>{pagination.totalCount}</PersianNumber>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول */}
                <div className="card">
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">در حال بارگذاری...</span>
                                </div>
                            </div>
                        ) : items.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>کد درس</th>
                                            <th>عنوان درس</th>
                                            <th className="text-center">کد رشته</th>
                                            <th>عنوان رشته</th>
                                            <th className="text-center">واحد تئوری</th>
                                            <th className="text-center">واحد عملی</th>
                                            <th className="text-center">ترم اخذ</th>
                                            <th>نوع درس</th>
                                            <th className="text-center">منابع</th>
                                            <th className="text-center" style={{ width: '130px' }}>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => {
                                            const reshteh = reshtehList.find(r => r.id === item.reshtehId);
                                            return (
                                                <tr key={item.id}>
                                                    <td className="text-center">
                                                        <PersianNumber>
                                                            {(page - 1) * pageSize + index + 1}
                                                        </PersianNumber>
                                                    </td>
                                                    <td className="text-center">
                                                        <PersianNumber>{item.codeDars || '-'}</PersianNumber>
                                                    </td>
                                                    <td><strong>{item.naamDars || '-'}</strong></td>
                                                    <td className="text-center">
                                                        <PersianNumber>{reshteh?.codeReshte || '-'}</PersianNumber>
                                                    </td>
                                                    <td>{reshteh?.onvanReshte || '-'}</td>
                                                    <td className="text-center">
                                                        <PersianNumber>{item.vahedTeori || 0}</PersianNumber>
                                                    </td>
                                                    <td className="text-center">
                                                        <PersianNumber>{item.vahedAmali || 0}</PersianNumber>
                                                    </td>
                                                    <td className="text-center">
                                                        {item.termAkhz !== null && item.termAkhz !== undefined
                                                            ? <PersianNumber>{item.termAkhz}</PersianNumber>
                                                            : <span className="text-muted">-</span>}
                                                    </td>
                                                    <td>{item.noeDars || '-'}</td>
                                                    <td>
                                                        {item.manbaList && item.manbaList.length > 0 ? (
                                                            <div>
                                                                {item.manbaList.map((m, idx) => (
                                                                    <div
                                                                        key={m.id}
                                                                        style={{
                                                                            color: idx === 0 ? 'inherit' : '#0d6efd',
                                                                            fontSize: '12px',
                                                                            fontWeight: idx === 0 ? 'normal' : 'bold'
                                                                        }}
                                                                    >
                                                                        {m.shomareManba || '-'} | {m.codePeyvast || '-'}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="d-flex gap-1 justify-content-center">
                                                            <PermissionWrapper permission="Dars.Update">
                                                                <button
                                                                    className="btn btn-sm btn-warning"
                                                                    onClick={() => openEditModal(item)}
                                                                    title="ویرایش"
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                            </PermissionWrapper>
                                                            <PermissionWrapper permission="Dars.Delete">
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
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center text-muted py-5">
                                <i className="bi bi-inbox fs-1 d-block mb-2"></i>
                                <p>هیچ درسی یافت نشد</p>
                            </div>
                        )}
                    </div>

                    {/* صفحه‌بندی */}
                    {pagination.totalPages > 1 && (
                        <div className="card-footer d-flex justify-content-between align-items-center">
                            <small className="text-muted">
                                نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, pagination.totalCount)} از {pagination.totalCount}
                            </small>
                            <nav>
                                <ul className="pagination pagination-sm mb-0">
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                    {getPaginationRange(page, pagination.totalPages).map((p, idx) => {
                                        if (p === '...') {
                                            return (
                                                <li key={`dots-${idx}`} className="page-item disabled">
                                                    <span className="page-link">...</span>
                                                </li>
                                            );
                                        }
                                        return (
                                            <li key={p} className={`page-item ${page === p ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => setPage(p)}>
                                                    <PersianNumber>{p}</PersianNumber>
                                                </button>
                                            </li>
                                        );
                                    })}
                                    <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                            <div className="d-flex align-items-center gap-2">
                                <label className="text-muted small mb-0">تعداد:</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ width: 'auto' }}
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }}
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
            <DarsFormModal
                key={`dars-modal-${editingItem?.id || 'new'}`}
                show={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                onSuccess={handleFormSuccess}
                item={editingItem}
            />

            <DarsBulkUploadModal
                show={showBulkUploadModal}
                onClose={() => setShowBulkUploadModal(false)}
                onSuccess={() => {
                    // 🔥 حفظ state فعلی
                    const params = new URLSearchParams();
                    if (search) params.set('search', search);
                    if (filterMaghtas.length) params.set('maghtas', filterMaghtas.join(','));
                    if (filterDaneshkades.length) params.set('daneshkades', filterDaneshkades.join(','));
                    if (filterGroohes.length) params.set('groohes', filterGroohes.join(','));
                    if (filterReshtehs.length) params.set('reshtehs', filterReshtehs.join(','));
                    if (filterVahedTypes.length) params.set('vahedTypes', filterVahedTypes.join(','));
                    if (filterTermAkhzs.length) params.set('termAkhzs', filterTermAkhzs.join(','));
                    if (filterNoeDars.length) params.set('noeDarsList', filterNoeDars.join(','));
                    if (manbaSearch) params.set('manbaSearch', manbaSearch);
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