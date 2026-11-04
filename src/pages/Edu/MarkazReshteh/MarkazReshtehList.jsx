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
import MarkazReshtehBulkUploadModal from './MarkazReshtehBulkUploadModal';
import MarkazReshtehAdaptiveModal from './MarkazReshtehAdaptiveModal';
import { useConfirm } from '../../../hooks/useConfirm';

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
        level: parseArray('level'),
        page: parseInt(params.get('page') || '1', 10),
        pageSize: parseInt(params.get('pageSize') || '20', 10)
    };
};

// ============================================================
// 🔥 تابع تولید لیست صفحات: اول + آخر + جاری ± ۱
// ============================================================
const getPaginationRange = (currentPage, totalPages) => {
    const delta = 1;
    const pages = new Set();
    pages.add(1);
    pages.add(totalPages);

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
        if (i >= 1 && i <= totalPages) {
            pages.add(i);
        }
    }

    const sortedPages = Array.from(pages).sort((a, b) => a - b);
    const result = [];
    let prev = 0;

    for (const page of sortedPages) {
        if (prev) {
            if (page - prev === 2) {
                result.push(prev + 1);
            } else if (page - prev > 2) {
                result.push('...');
            }
        }
        result.push(page);
        prev = page;
    }

    return result;
};

const FILTER_DEBOUNCE_MS = 700;

export default function MarkazReshtehList() {
    const { hasPermission } = useAuth();
    const { grooheList, daneshkadeList } = useGrooheAmoozeshi();
    const { markazList } = useMarkaz();
    const { reshtehList } = useReshteh();
    const { confirm, ConfirmModal } = useConfirm();

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
    const [filterLevels, setFilterLevels] = useState(initialState.level);

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
        levels: initialState.level,
        page: initialState.page,
        pageSize: initialState.pageSize
    });

    // ---- داده ----
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    const [recalculating, setRecalculating] = useState(false);

    // ---- مودال ----
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
    const [showAdaptiveModal, setShowAdaptiveModal] = useState(false);

    const { user, currentRoleId } = useAuth();

    const codeRole = useMemo(() => {
        if (!user?.roles || !currentRoleId) return 4;
        const activeRole = user.roles.find(r => r.id === currentRoleId);
        return activeRole?.codeRole || 4;
    }, [user, currentRoleId]);
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
    // 🔥 Helper سطح
    const getLevelInfo = (level) => {
        switch (level) {
            case 4:
                return { label: 'مرکز', color: 'secondary', style: {} };
            case 3:
                return { label: 'استانی', color: 'primary', style: {} };
            case 2:
                return { label: 'کشوری', color: 'success', style: {} };
            default:
                return { label: '-', color: 'light', style: {} };
        }
    };

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

    // 🔥 گزینه‌های سطح
    const levelOptions = [
        { value: '4', label: 'مرکز' },
        { value: '3', label: 'استانی' },
        { value: '2', label: 'کشوری' }
    ];

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
                levels: filterLevels,
                page,
                pageSize
            });
        }, FILTER_DEBOUNCE_MS);

        return () => clearTimeout(timer);
    }, [
        search, filterMaghtas, filterDaneshkades, filterGroohes, filterReshtehs,
        filterOstans, filterMarkazIds, filterVazeeyat, filterLevels,
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
            if (debouncedFilters.levels && debouncedFilters.levels.length > 0) {
                debouncedFilters.levels.forEach(v => params.append('level', v));
            }
            params.append('page', debouncedFilters.page);
            params.append('pageSize', debouncedFilters.pageSize);

            //const response = await api.get(`/MarkazReshteh/list?page=1&pageSize=20`);
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

    // محاسبه تعداد دانشجویان مرکز رشته های لول 3 و 2
    const handleRecalculate = async () => {
        // تعیین سطح بر اساس نقش
        let level;
        if (codeRole === 1) {
            // نقش 1: از کاربر بپرس (به‌طور پیش‌فرض 3)
            level = 3;
        } else if (codeRole === 2) {
            level = 2;
        } else if (codeRole === 3) {
            level = 3;
        } else {
            toast.error('شما مجاز به این عملیات نیستید');
            return;
        }

        const markazId = user?.markazId;
        if (!markazId) {
            toast.error('مرکز کاربری مشخص نیست');
            return;
        }

        const confirmed = await confirm({
            title: 'محاسبه مجدد تعداد دانشجو',
            message: `آیا از محاسبه مجدد تعداد دانشجو برای سطح ${level === 2 ? 'کشوری' : 'استانی'} مطمئن هستید؟`,
            confirmText: 'بله، محاسبه کن',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;

        setRecalculating(true);
        try {
            const response = await api.post(
                `/MarkazReshteh/recalculate-tedad?markazId=${markazId}&level=${level}`
            );

            if (response.data?.success) {
                toast.success(response.data.message || 'محاسبه انجام شد');
                await fetchItems(false);
            } else {
                toast.error(response.data?.message || 'خطا در محاسبه');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در محاسبه');
        } finally {
            setRecalculating(false);
        }
    };
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
                    <div className="d-flex gap-2">
                        {/* 🔥 دکمه آپلود اکسل */}
                        <PermissionWrapper permission="MarkazReshteh.BulkUpload">
                            <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => setShowBulkUploadModal(true)}
                            >
                                <i className="bi bi-file-earmark-excel me-1"></i>
                                آپلود اکسل
                            </button>
                        </PermissionWrapper>

                        <PermissionWrapper permission="MarkazReshteh.BulkAssign">
                            <button className="btn btn-primary btn-sm" onClick={() => setShowAdaptiveModal(true)}>
                                <i className="bi bi-plus-circle me-1"></i>
                                افزودن رشته به مرکز
                            </button>
                        </PermissionWrapper>
                        {/* 🔥 دکمه محاسبه مجدد — فقط برای نقش 1، 2، 3 */}
                        {(codeRole === 1 || codeRole === 2 || codeRole === 3) && (
                            <PermissionWrapper permission="MarkazReshteh.RecalculateTedad">
                                <button
                                    className="btn btn-warning btn-sm"
                                    onClick={handleRecalculate}
                                    disabled={recalculating}
                                >
                                    {recalculating ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1"></span>
                                            در حال محاسبه...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-arrow-repeat me-1"></i>
                                            محاسبه مجدد تعداد دانشجو
                                        </>
                                    )}
                                </button>
                            </PermissionWrapper>
                        )}
                    </div>
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
                            <div className="col-md-2">
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



                            {/* 🔥 سطح */}
                            <div className="col-md-2">
                                <label className="form-label small mb-1">سطح رشته</label>
                                <MultiSelectWrapper
                                    options={levelOptions}
                                    value={filterLevels}
                                    onChange={(v) => { setFilterLevels(v); setPage(1); }}
                                    placeholder="سطح رشته..."
                                    hideIndicator={true}
                                />
                            </div>
                            {/* وضعیت */}
                            <div className="col-md-1">
                                <label className="form-label small mb-1">وضعیت</label>
                                <select
                                    className="form-select form-select-sm"
                                    style={{ fontSize: '12px' }}
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
                            <div className="col-md-1 text-end">
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
                                            <th>استان</th>
                                            <th>مرکز</th>
                                            <th>نام رشته</th>
                                            <th>کد رشته</th>
                                            <th>مقطع</th>
                                            <th>دانشکده</th>
                                            <th>گروه آموزشی</th>
                                            <th className="text-center">سطح رشته</th>
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
                                                <td>{getOstanName(item.codeOstan)}</td>
                                                <td>{getMarkazName(item.markazId)}</td>
                                                <td><strong><PersianNumber>{item.reshtehName || '-'}</PersianNumber></strong></td>
                                                <td className="text-center">
                                                    <PersianNumber>{item.codeReshte || '-'}</PersianNumber>
                                                </td>

                                                <td>{item.maghta || item.codeMaghta || '-'}</td>
                                                <td>{getDaneshkadehName(item.codeDaneshkadeh)}</td>
                                                <td>{getGrooheName(item.grooheAmoozeshiId)}</td>
                                                <td className="text-center">
                                                    {(() => {
                                                        const levelInfo = getLevelInfo(item.level);
                                                        return (
                                                            <span className={`badge bg-${levelInfo.color}`}>
                                                                {levelInfo.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>

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
                                    {/* قبلی */}
                                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            title="صفحه قبل"
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>

                                    {/* شماره صفحات */}
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

                                    {/* بعدی */}
                                    <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                            title="صفحه بعد"
                                        >
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
            {/* 🔥 مودال آپلود اکسل */}
            <MarkazReshtehBulkUploadModal
                show={showBulkUploadModal}
                onClose={() => setShowBulkUploadModal(false)}
                onSuccess={async () => {
                    setShowBulkUploadModal(false);
                    await fetchItems(false);
                }}
            />
            <MarkazReshtehAdaptiveModal
                show={showAdaptiveModal}
                onClose={() => setShowAdaptiveModal(false)}
                onSuccess={async () => {
                    setShowAdaptiveModal(false);
                    await fetchItems(false);
                }}
            />
            <ConfirmModal />
        </>
    );
}