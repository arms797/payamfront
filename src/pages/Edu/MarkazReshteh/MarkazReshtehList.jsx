import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../../context/AuthContext';
import { useGrooheAmoozeshi } from '../../../context/GrooheAmoozeshiContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useReshteh } from '../../../context/ReshtehContext';
import { PermissionWrapper } from '../../../components/PermissionWrapper';
import PersianNumber from '../../../components/common/PersianNumber';
import CascadingFilter from '../../../components/common/CascadingFilter';
import MultiSelectWrapper from '../../../components/common/MultiSelectWrapper';
import MarkazReshtehFormModal from './MarkazReshtehFormModal';

// ============================================================
// بازیابی state از URL
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
        ostans: parseArray('ostans'),
        markazIds: parseArray('markazIds').map(x => parseInt(x, 10)).filter(x => !isNaN(x)),
        vazeeyat: params.get('vazeeyat') === 'true' ? true : params.get('vazeeyat') === 'false' ? false : null,
        page: parseInt(params.get('page') || '1', 10),
        pageSize: parseInt(params.get('pageSize') || '20', 10)
    };
};

const FILTER_DEBOUNCE_MS = 700;

export default function MarkazReshtehList() {
    const { hasPermission } = useAuth();
    const { grooheList, daneshkadeList } = useGrooheAmoozeshi();
    const { markazList } = useMarkaz();
    const { reshtehList } = useReshteh();

    const initialState = getInitialState();

    // ---- فیلترهای آبشاری (رشته) ----
    const [filterMaghtas, setFilterMaghtas] = useState(initialState.maghtas);
    const [filterDaneshkades, setFilterDaneshkades] = useState(initialState.daneshkades);
    const [filterGroohes, setFilterGroohes] = useState(initialState.groohes);
    const [filterReshtehs, setFilterReshtehs] = useState(initialState.reshtehs);

    // ---- فیلترهای آبشاری (مرکز) ----
    const [filterOstans, setFilterOstans] = useState(initialState.ostans);
    const [filterMarkazIds, setFilterMarkazIds] = useState(initialState.markazIds);

    // ---- فیلترهای ساده ----
    const [search, setSearch] = useState(initialState.search);
    const [filterVazeeyat, setFilterVazeeyat] = useState(initialState.vazeeyat);

    // ---- صفحه‌بندی ----
    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);

    // ---- debounced ----
    const [debouncedFilters, setDebouncedFilters] = useState({
        search: initialState.search,
        maghtas: initialState.maghtas,
        daneshkades: initialState.daneshkades,
        groohes: initialState.groohes,
        reshtehs: initialState.reshtehs,
        ostans: initialState.ostans,
        markazIds: initialState.markazIds,
        vazeeyat: initialState.vazeeyat,
        page: initialState.page,
        pageSize: initialState.pageSize
    });

    // ---- داده ----
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    // ---- مودال ----
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // ============================================================
    // Lookup Maps (O(1))
    // ============================================================
    const markazMap = useMemo(() => {
        const map = new Map();
        markazList.forEach(m => map.set(m.id, m));
        return map;
    }, [markazList]);

    const grooheMap = useMemo(() => {
        const map = new Map();
        grooheList.forEach(g => map.set(g.id, g));
        return map;
    }, [grooheList]);

    const daneshkadeMap = useMemo(() => {
        const map = new Map();
        daneshkadeList.forEach(d => map.set(d.code, d));
        return map;
    }, [daneshkadeList]);

    const ostanMap = useMemo(() => {
        const map = new Map();
        markazList.forEach(m => {
            if (m.codeOstan && !map.has(m.codeOstan)) {
                map.set(m.codeOstan, m.naamOstan);
            }
        });
        return map;
    }, [markazList]);

    // ---- Helpers ----
    const getMarkazName = (markazId) => {
        const m = markazMap.get(markazId);
        if (!m) return '-';

        // اگه نام مرکز خالی نبود، همون رو بده
        if (m.naamMarkaz && m.naamMarkaz.trim()) {
            return m.naamMarkaz;
        }

        // نام خالی → بساز از Level + استان
        if (m.level === 3) {
            // ستاد استان
            return m.naamOstan ? `ستاد استان ${m.naamOstan}` : 'ستاد استان';
        }

        if (m.level === 2) {
            return 'سازمان مرکزی';
        }

        return '-';
    };
    const getGrooheName = (grooheId) => grooheMap.get(grooheId)?.onvanGrooheAmoozeshi || '-';
    const getDaneshkadehName = (codeDaneshkadeh) => daneshkadeMap.get(codeDaneshkadeh)?.name || '-';
    const getOstanName = (codeOstan) => ostanMap.get(codeOstan) || codeOstan || '-';

    // ============================================================
    // Options (فیلترهای زنجیره‌ای مرکز/استان)
    // ============================================================
    const ostanOptions = useMemo(() => {
        const set = new Set();
        const list = [];
        markazList.forEach(m => {
            if (m.codeOstan && !set.has(m.codeOstan)) {
                set.add(m.codeOstan);
                list.push({ value: m.codeOstan, label: m.naamOstan || m.codeOstan });
            }
        });
        return list.sort((a, b) => a.label.localeCompare(b.label, 'fa'));
    }, [markazList]);

    // 🔥 مراکز: فقط مراکز استان‌های انتخاب‌شده
    const markazOptions = useMemo(() => {
        if (filterOstans.length === 0) return [];

        const filtered = markazList.filter(m => filterOstans.includes(m.codeOstan));

        const buildName = (m) => {
            if (m.naamMarkaz && m.naamMarkaz.trim()) return m.naamMarkaz;
            if (m.level === 3) return m.naamOstan ? `ستاد استان ${m.naamOstan}` : 'ستاد استان';
            if (m.level === 2) return 'سازمان مرکزی';
            return m.codeMarkaz || '';
        };

        return [...filtered]
            .sort((a, b) => buildName(a).localeCompare(buildName(b), 'fa'))
            .map(m => ({ value: String(m.id), label: buildName(m) }));
    }, [markazList, filterOstans]);

    // ============================================================
    // Debounce Effect
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters({
                search,
                maghtas: filterMaghtas,
                daneshkades: filterDaneshkades,
                groohes: filterGroohes,
                reshtehs: filterReshtehs,
                ostans: filterOstans,
                markazIds: filterMarkazIds,
                vazeeyat: filterVazeeyat,
                page,
                pageSize
            });
        }, FILTER_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [
        search, filterMaghtas, filterDaneshkades, filterGroohes, filterReshtehs,
        filterOstans, filterMarkazIds, filterVazeeyat,
        page, pageSize
    ]);

    // ============================================================
    // Fetch
    // ============================================================
    const fetchItems = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (debouncedFilters.search) params.append('search', debouncedFilters.search);
            debouncedFilters.maghtas.forEach(v => params.append('maghtas', v));
            debouncedFilters.daneshkades.forEach(v => params.append('daneshkades', v));
            debouncedFilters.groohes.forEach(v => params.append('grooheAmoozeshiIds', v));
            debouncedFilters.reshtehs.forEach(v => params.append('reshtehIds', v));
            debouncedFilters.ostans.forEach(v => params.append('ostans', v));
            debouncedFilters.markazIds.forEach(v => params.append('markazIds', v));
            if (debouncedFilters.vazeeyat !== null && debouncedFilters.vazeeyat !== undefined) {
                params.append('vazeeyat', debouncedFilters.vazeeyat);
            }
            params.append('page', debouncedFilters.page);
            params.append('pageSize', debouncedFilters.pageSize);

            const response = await api.get(`/MarkazReshteh/list?${params.toString()}`);
            if (response.data?.success) {
                setItems(response.data.data || []);
                setPagination(response.data.pagination || { totalCount: 0, totalPages: 0 });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت لیست');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedFilters]);

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

    const handleFormSuccess = () => {
        setShowFormModal(false);
        setEditingItem(null);
        fetchItems();
    };

    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            <div className="container-fluid">
                {/* هدر */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="mb-0">رشته‌های مرکز</h5>
                    <PermissionWrapper permission="MarkazReshteh.Create">
                        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
                            <i className="bi bi-plus-circle me-1"></i>
                            افزودن رشته به مرکز
                        </button>
                    </PermissionWrapper>
                </div>

                {/* ============================================================ */}
                {/* فیلترها */}
                {/* ============================================================ */}
                <div className="card mb-3">
                    <div className="card-body py-2">
                        {/* 🔥 ردیف ۱: فیلتر آبشاری رشته (مقطع → دانشکده → گروه → رشته) */}
                        <CascadingFilter
                            grooheList={grooheList}
                            reshtehList={reshtehList}
                            selectedMaghtas={filterMaghtas}
                            selectedDaneshkades={filterDaneshkades}
                            selectedGroohes={filterGroohes}
                            selectedReshtehs={filterReshtehs}
                            onMaghtaChange={(v) => {
                                setFilterMaghtas(v);
                                setFilterDaneshkades([]);
                                setFilterGroohes([]);
                                setFilterReshtehs([]);
                                setPage(1);
                            }}
                            onDaneshkadeChange={(v) => {
                                setFilterDaneshkades(v);
                                setFilterGroohes([]);
                                setFilterReshtehs([]);
                                setPage(1);
                            }}
                            onGrooheChange={(v) => {
                                setFilterGroohes(v);
                                setFilterReshtehs([]);
                                setPage(1);
                            }}
                            onReshtehChange={(v) => {
                                setFilterReshtehs(v);
                                setPage(1);
                            }}
                            hideIndicator={true}
                        />

                        {/* 🔥 ردیف ۲: فیلتر آبشاری مرکز (استان → مرکز) + جستجو + وضعیت */}
                        <div className="row g-2 align-items-end mt-2 pt-2 border-top">
                            {/* جستجو */}
                            <div className="col-md-3">
                                <label className="form-label small mb-1">جستجو</label>
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="کد یا نام رشته..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>

                            {/* استان */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">استان</label>
                                <MultiSelectWrapper
                                    options={ostanOptions}
                                    value={filterOstans}
                                    onChange={(v) => {
                                        setFilterOstans(v);
                                        setFilterMarkazIds([]);
                                        setPage(1);
                                    }}
                                    placeholder="استان..."
                                    hideIndicator={true}
                                />
                            </div>

                            {/* مرکز */}
                            <div className="col-md-3">
                                <label className="form-label small mb-1">مرکز</label>
                                <MultiSelectWrapper
                                    options={markazOptions}
                                    value={filterMarkazIds.map(x => String(x))}
                                    onChange={(v) => { setFilterMarkazIds(v.map(x => parseInt(x, 10))); setPage(1); }}
                                    placeholder={filterOstans.length > 0 ? 'مرکز...' : 'ابتدا استان انتخاب کنید '}
                                    hideIndicator={true}
                                />
                            </div>

                            {/* وضعیت */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    value={filterVazeeyat === null ? '' : String(filterVazeeyat)}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setFilterVazeeyat(v === '' ? null : v === 'true');
                                        setPage(1);
                                    }}
                                >
                                    <option value="">همه</option>
                                    <option value="true">فعال</option>
                                    <option value="false">غیرفعال</option>
                                </select>
                            </div>

                            {/* مجموع */}
                            <div className="col-md-2 text-end">
                                <span className="badge bg-primary">
                                    مجموع: <PersianNumber>{pagination.totalCount}</PersianNumber>
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
                                <div className="spinner-border text-primary" role="status"></div>
                            </div>
                        ) : items.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped mb-0 align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '50px' }}>#</th>
                                            <th>کد رشته</th>
                                            <th>نام رشته</th>
                                            <th>مقطع</th>
                                            <th>دانشکده</th>
                                            <th>گروه</th>
                                            <th>مرکز</th>
                                            <th>استان</th>
                                            <th className="text-center">تعداد دانشجو</th>
                                            <th className="text-center">وضعیت</th>
                                            <th className="text-center" style={{ width: '80px' }}>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="text-center">
                                                    <PersianNumber>{(page - 1) * pageSize + index + 1}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.codeReshte || '-'}</PersianNumber>
                                                </td>
                                                <td><strong>{item.reshtehName || '-'}</strong></td>
                                                <td>{item.maghta || item.codeMaghta || '-'}</td>
                                                <td>{getDaneshkadehName(item.codeDaneshkadeh)}</td>
                                                <td>{getGrooheName(item.grooheAmoozeshiId)}</td>
                                                <td>{getMarkazName(item.markazId)}</td>
                                                <td>{getOstanName(item.codeOstan)}</td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.tedadDaneshjoo || 0}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge bg-${item.vazeeat ? 'success' : 'secondary'}`}>
                                                        {item.vazeeat ? 'فعال' : 'غیرفعال'}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <PermissionWrapper permission="MarkazReshteh.Update">
                                                        <button
                                                            className="btn btn-sm btn-warning"
                                                            onClick={() => openEditModal(item)}
                                                            title="ویرایش"
                                                        >
                                                            <i className="bi bi-pencil"></i>
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
                                <p>هیچ رشته‌ای یافت نشد</p>
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
                                    <li className="page-item active">
                                        <span className="page-link">
                                            <PersianNumber>{page}</PersianNumber> / <PersianNumber>{pagination.totalPages}</PersianNumber>
                                        </span>
                                    </li>
                                    <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                                        <button className="page-link" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
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
                    )}
                </div>
            </div>

            {/* مودال */}
            <MarkazReshtehFormModal
                show={showFormModal}
                onClose={() => { setShowFormModal(false); setEditingItem(null); }}
                onSuccess={handleFormSuccess}
                item={editingItem}
            />
        </>
    );
}