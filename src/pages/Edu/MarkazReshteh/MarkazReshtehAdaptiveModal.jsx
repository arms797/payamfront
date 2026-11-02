import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useMarkaz } from '../../../context/MarkazContext';
import { useReshteh } from '../../../context/ReshtehContext';
import { useGrooheAmoozeshi } from '../../../context/GrooheAmoozeshiContext';
import { useAuth } from '../../../context/AuthContext';
import PersianNumber from '../../../components/common/PersianNumber';
import SingleSelectWrapper from '../../../components/common/SingleSelectWrapper';
import MultiSelectWrapper from '../../../components/common/MultiSelectWrapper';

export default function MarkazReshtehAdaptiveModal({ show, onClose, onSuccess }) {
    const { markazList } = useMarkaz();
    const { reshtehList } = useReshteh();
    const { grooheList, daneshkadeList } = useGrooheAmoozeshi();
    const { currentRoleId, user } = useAuth();

    // ============================================================
    // نقش کاربر
    // ============================================================
    const codeRole = useMemo(() => {
        if (!user?.roles || !currentRoleId) return 4;
        const activeRole = user.roles.find(r => r.id === currentRoleId);
        return activeRole?.codeRole || 4;
    }, [user, currentRoleId]);

    const userMarkazId = useMemo(() => user?.markazId || null, [user]);

    // 🔥 استان رو از markazList بگیر (چون user.markazOstan ممکنه نباشه)
    const userOstanCode = useMemo(() => {
        if (!userMarkazId || !markazList || markazList.length === 0) return null;
        const userMarkaz = markazList.find(m => m.id === userMarkazId);
        return userMarkaz?.codeOstan || null;
    }, [userMarkazId, markazList]);

    // ============================================================
    // سطح پیش‌فرض
    // ============================================================
    const defaultLevel = useMemo(() => {
        if (codeRole === 2) return 2;
        if (codeRole === 3) return 3;
        return 4;   // نقش 1 و 4
    }, [codeRole]);

    // ============================================================
    // State
    // ============================================================
    const [selectedLevel, setSelectedLevel] = useState(defaultLevel);
    const [selectedOstan, setSelectedOstan] = useState('');
    const [selectedMarkaz, setSelectedMarkaz] = useState('');

    // فیلترها
    const [filterMaghtas, setFilterMaghtas] = useState([]);
    const [filterDaneshkades, setFilterDaneshkades] = useState([]);
    const [filterGroohes, setFilterGroohes] = useState([]);
    const [searchReshteh, setSearchReshteh] = useState('');
    //const [searchReshteh, setSearchReshteh] = useState('');

    // 🔥 Debounced State برای فیلترها
    const [debouncedFilters, setDebouncedFilters] = useState({
        maghtas: [],
        daneshkades: [],
        groohes: [],
        search: '',
        page: 1,
        pageSize: 10
    });

    // لیست رشته‌ها و انتخاب‌ها
    const [reshtehs, setReshtehs] = useState([]);
    const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 0 });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [selectedReshtehIds, setSelectedReshtehIds] = useState(new Set());
    const [tedadDaneshjooMap, setTedadDaneshjooMap] = useState({});

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // ============================================================
    // 🔥 Debounce Effect — 700ms بعد از آخرین تغییر فیلترها
    // ============================================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters({
                maghtas: filterMaghtas,
                daneshkades: filterDaneshkades,
                groohes: filterGroohes,
                search: searchReshteh,
                page,
                pageSize
            });
        }, 700);

        return () => clearTimeout(timer);
    }, [filterMaghtas, filterDaneshkades, filterGroohes, searchReshteh, page, pageSize]);

    // ============================================================
    // Reset on open
    // ============================================================
    useEffect(() => {
        if (!show) return;

        setSelectedLevel(defaultLevel);
        setSelectedReshtehIds(new Set());
        setTedadDaneshjooMap({});
        setReshtehs([]);
        setPagination({ totalCount: 0, totalPages: 0 });
        setPage(1);
        setSearchReshteh('');

        // 🔥 ریست debouncedFilters
        setDebouncedFilters({
            maghtas: [],
            daneshkades: [],
            groohes: [],
            search: '',
            page: 1,
            pageSize: 10
        });
        // 🔥 ریست فیلترها
        setFilterMaghtas([]);
        setFilterDaneshkades([]);
        setFilterGroohes([]);

        // 🔥 نقش 4: استان و مرکز قفل
        if (codeRole === 4 && userMarkazId) {
            const userMarkaz = markazList.find(x => x.id === userMarkazId);
            setSelectedOstan(userMarkaz?.codeOstan || '');
            setSelectedMarkaz(String(userMarkazId));
        }
        // 🔥 نقش 3: استان قفل روی استان کاربر، مرکز باز
        else if (codeRole === 3 && userOstanCode) {
            setSelectedOstan(userOstanCode);
            setSelectedMarkaz('');
        }
        // 🔥 نقش 1 و 2: هر دو باز
        else {
            setSelectedOstan('');
            setSelectedMarkaz('');
        }
    }, [show, defaultLevel, codeRole, userMarkazId, userOstanCode, markazList]);
    // ============================================================
    // Fetch رشته‌ها
    // ============================================================
    const fetchReshtehs = useCallback(async () => {
        if (!selectedMarkaz) {
            setReshtehs([]);
            setPagination({ totalCount: 0, totalPages: 0 });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                level: selectedLevel,
                markazId: parseInt(selectedMarkaz),
                maghtas: debouncedFilters.maghtas,              // 🔥 debounced
                daneshkades: debouncedFilters.daneshkades,      // 🔥 debounced
                grooheAmoozeshiIds: debouncedFilters.groohes.map(x => parseInt(x)),  // 🔥 debounced
                search: debouncedFilters.search || null,        // 🔥 debounced
                page: debouncedFilters.page,                    // 🔥 debounced
                pageSize: debouncedFilters.pageSize             // 🔥 debounced
            };

            const response = await api.post('/MarkazReshteh/filter-reshtehs', payload);
            if (response.data?.success) {
                setReshtehs(response.data.data || []);
                setPagination(response.data.pagination || { totalCount: 0, totalPages: 0 });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در دریافت رشته‌ها');
        } finally {
            setLoading(false);
        }
    }, [selectedLevel, selectedMarkaz, debouncedFilters]);
    useEffect(() => {
        if (show && selectedMarkaz) {
            fetchReshtehs();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show, selectedMarkaz, selectedLevel, debouncedFilters]);
    // ============================================================
    // Options
    // ============================================================
    const ostanOptions = useMemo(() => {
        const map = new Map();
        markazList.forEach(m => {
            if (m.codeOstan && m.naamOstan && !map.has(m.codeOstan)) {
                map.set(m.codeOstan, m.naamOstan);
            }
        });
        return Array.from(map, ([code, name]) => ({ value: code, label: name }))
            .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
    }, [markazList]);

    const markazOptions = useMemo(() => {
        let filtered = markazList;
        if (selectedOstan) filtered = filtered.filter(m => m.codeOstan === selectedOstan);

        const buildName = (m) => {
            if (m.naamMarkaz && m.naamMarkaz.trim()) return m.naamMarkaz;
            if (m.level === 3) return m.naamOstan ? `ستاد استان ${m.naamOstan}` : 'ستاد استان';
            if (m.level === 2) return 'سازمان مرکزی';
            return m.codeMarkaz || '';
        };

        return filtered.map(m => ({
            value: String(m.id),
            label: `${buildName(m)} (${m.codeMarkaz || '-'})`
        }));
    }, [markazList, selectedOstan]);

    const maghtaOptions = [
        { value: '5', label: 'کارشناسی' },
        { value: '10', label: 'کارشناسی ارشد' },
        { value: '15', label: 'دکتری تخصصی' }
    ];

    const daneshkadeOptions = useMemo(() => {
        return [...daneshkadeList]
            .map(d => ({ value: d.code, label: d.name }))
            .sort((a, b) => a.label.localeCompare(b.label, 'fa'));
    }, [daneshkadeList]);

    const grooheOptions = useMemo(() => {
        let filtered = grooheList;
        if (filterDaneshkades.length > 0) {
            filtered = filtered.filter(g => filterDaneshkades.includes(g.codeDaneshkade));
        }
        return filtered.map(g => ({ value: String(g.id), label: g.onvanGrooheAmoozeshi }));
    }, [grooheList, filterDaneshkades]);

    // ============================================================
    // Handlers
    // ============================================================
    const handleLevelChange = (newLevel) => {
        setSelectedLevel(newLevel);
        setSelectedReshtehIds(new Set());
        setTedadDaneshjooMap({});
        setPage(1);
    };

    const handleOstanChange = (value) => {
        setSelectedOstan(value || '');
        setSelectedMarkaz('');
        setSelectedReshtehIds(new Set());
        setTedadDaneshjooMap({});
        setReshtehs([]);
        setPage(1);
    };

    const handleMarkazChange = (value) => {
        setSelectedMarkaz(value || '');
        setSelectedReshtehIds(new Set());
        setTedadDaneshjooMap({});
        setReshtehs([]);
        setPage(1);
    };

    const handleToggleReshteh = (reshtehId) => {
        const newSet = new Set(selectedReshtehIds);
        if (newSet.has(reshtehId)) newSet.delete(reshtehId);
        else newSet.add(reshtehId);
        setSelectedReshtehIds(newSet);
    };

    const handleSelectAllOnPage = () => {
        const selectableIds = reshtehs
            .filter(r => !r.alreadyAssigned)
            .map(r => r.reshtehId);
        const allSelected = selectableIds.every(id => selectedReshtehIds.has(id));

        if (allSelected) {
            // unselect all on page
            const newSet = new Set(selectedReshtehIds);
            selectableIds.forEach(id => newSet.delete(id));
            setSelectedReshtehIds(newSet);
        } else {
            const newSet = new Set(selectedReshtehIds);
            selectableIds.forEach(id => newSet.add(id));
            setSelectedReshtehIds(newSet);
        }
    };

    const handleTedadChange = (reshtehId, value) => {
        setTedadDaneshjooMap(prev => ({ ...prev, [reshtehId]: value }));
    };

    const handleSubmit = async () => {
        if (!selectedMarkaz) {
            toast.warning('ابتدا مرکز را انتخاب کنید');
            return;
        }

        if (selectedReshtehIds.size === 0) {
            toast.warning('حداقل یک رشته را انتخاب کنید');
            return;
        }

        // چک تعداد دانشجو برای نقش 4 (و نقش 1 + Level 4)
        const requiresManualTedad = codeRole === 4 || (codeRole === 1 && selectedLevel === 4);
        if (requiresManualTedad) {
            const missing = Array.from(selectedReshtehIds).filter(id => !tedadDaneshjooMap[id]);
            if (missing.length > 0) {
                toast.warning('تعداد دانشجو برای همه‌ی رشته‌های انتخاب‌شده الزامی است');
                return;
            }
        }

        setSaving(true);
        try {
            const items = Array.from(selectedReshtehIds).map(reshtehId => ({
                reshtehId,
                tedadDaneshjoo: requiresManualTedad
                    ? parseInt(tedadDaneshjooMap[reshtehId]) || 0
                    : null,
                vazeeyat: true
            }));

            const payload = {
                level: selectedLevel,
                markazId: parseInt(selectedMarkaz),
                items
            };

            const response = await api.post('/MarkazReshteh/bulk-assign', payload);

            if (response.data?.success) {
                toast.success(response.data.message || 'رشته‌ها اضافه شدند');
                onSuccess?.();
            } else {
                toast.error(response.data?.message || 'خطا در ذخیره');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };
    // ============================================================
    // محاسبه‌ی وضعیت
    // ============================================================
    const requiresManualTedad = codeRole === 4 || (codeRole === 1 && selectedLevel === 4);

    const levelOptions = useMemo(() => {
        if (codeRole === 1) {
            return [
                { value: 2, label: 'کشوری' },
                { value: 3, label: 'استانی' },
                { value: 4, label: 'مرکز' }
            ];
        }
        return [{ value: defaultLevel, label: defaultLevel === 2 ? 'کشوری' : defaultLevel === 3 ? 'استانی' : 'مرکز' }];
    }, [codeRole, defaultLevel]);

    const isOstanLocked = codeRole === 3 || codeRole === 4;
    const isMarkazLocked = codeRole === 4;
    const isLevelLocked = codeRole !== 1;
    const isFiltersDisabled = !selectedMarkaz;

    const selectableOnPage = reshtehs.filter(r => !r.alreadyAssigned);
    const allSelectedOnPage = selectableOnPage.length > 0 &&
        selectableOnPage.every(r => selectedReshtehIds.has(r.reshtehId));

    if (!show) return null;



    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={saving ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ maxHeight: '95vh' }}>
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-plus-circle me-2"></i>
                                افزودن رشته به مرکز
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={saving}
                            ></button>
                        </div>

                        <div className="modal-body" style={{ overflowY: 'auto', maxHeight: 'calc(95vh - 140px)' }}>
                            {/* سطح */}
                            <div className="row g-2 mb-3">
                                <div className="col-md-3">
                                    <label className="form-label small mb-1">سطح</label>
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedLevel}
                                        onChange={(e) => handleLevelChange(parseInt(e.target.value))}
                                        disabled={isLevelLocked || saving}
                                    >
                                        {levelOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* استان */}
                                {codeRole !== 4 && (
                                    <div className="col-md-4">
                                        <label className="form-label small mb-1">استان</label>
                                        <SingleSelectWrapper
                                            options={ostanOptions}
                                            value={selectedOstan}
                                            onChange={handleOstanChange}
                                            placeholder="انتخاب استان..."
                                            isDisabled={isOstanLocked || saving}
                                            isClearable={!isOstanLocked}
                                        />
                                    </div>
                                )}

                                {/* مرکز */}
                                <div className={codeRole === 4 ? 'col-md-9' : 'col-md-5'}>
                                    <label className="form-label small mb-1">
                                        انتخاب مرکز جهت افزودن رشته <span className="text-danger">*</span>
                                    </label>
                                    <SingleSelectWrapper
                                        options={markazOptions}
                                        value={selectedMarkaz}
                                        onChange={handleMarkazChange}
                                        placeholder={
                                            isMarkazLocked
                                                ? 'مرکز'
                                                : !selectedOstan && codeRole !== 4
                                                    ? 'ابتدا استان را انتخاب کنید'
                                                    : 'انتخاب مرکز...'
                                        }
                                        isDisabled={isMarkazLocked || saving || (!selectedOstan && codeRole !== 4)}
                                        isClearable={!isMarkazLocked}
                                    />
                                </div>
                            </div>

                            {/* فیلترها */}
                            <div className="row g-2 mb-3 border-top pt-3">
                                <div className="col-md-2">
                                    {/*<label className="form-label small mb-1">مقطع</label>*/}
                                    <MultiSelectWrapper
                                        options={maghtaOptions}
                                        value={filterMaghtas}
                                        onChange={(v) => { setFilterMaghtas(v); setPage(1); }}
                                        placeholder="مقطع..."
                                        isDisabled={isFiltersDisabled || saving}
                                        hideIndicator={true}
                                    />
                                </div>
                                <div className="col-md-3">
                                    {/*<label className="form-label small mb-1">دانشکده</label>*/}
                                    <MultiSelectWrapper
                                        options={daneshkadeOptions}
                                        value={filterDaneshkades}
                                        onChange={(v) => { setFilterDaneshkades(v); setFilterGroohes([]); setPage(1); }}
                                        placeholder="دانشکده..."
                                        isDisabled={isFiltersDisabled || saving}
                                        hideIndicator={true}
                                    />
                                </div>
                                <div className="col-md-3">
                                    {/*<label className="form-label small mb-1">گروه آموزشی</label>*/}
                                    <MultiSelectWrapper
                                        options={grooheOptions}
                                        value={filterGroohes}
                                        onChange={(v) => { setFilterGroohes(v); setPage(1); }}
                                        placeholder="گروه آموزشی..."
                                        isDisabled={isFiltersDisabled || saving}
                                        hideIndicator={true}
                                    />
                                </div>
                                <div className="col-md-4">
                                    {/*<label className="form-label small mb-1">جستجوی رشته</label>*/}
                                    <input
                                        type="text"
                                        className="form-control form-control-sm"
                                        placeholder="کد یا عنوان رشته..."
                                        value={searchReshteh}
                                        onChange={(e) => { setSearchReshteh(e.target.value); setPage(1); }}
                                        disabled={isFiltersDisabled || saving}
                                    />
                                </div>
                            </div>

                            {/* پیام اگر مرکز انتخاب نشده */}
                            {isFiltersDisabled && (
                                <div className="alert alert-info py-2 text-center">
                                    <i className="bi bi-info-circle me-1"></i>
                                    ابتدا مرکز را انتخاب نمایید تا لیست رشته‌ها جهت افزودن به آن مرکز نمایش داده شود
                                </div>
                            )}

                            {/* جدول رشته‌ها */}
                            {!isFiltersDisabled && (
                                <>
                                    {loading ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary" role="status"></div>
                                        </div>
                                    ) : reshtehs.length > 0 ? (
                                        <>
                                            <div className="table-responsive" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                                                <table className="table table-sm table-hover mb-0 align-middle">
                                                    <thead className="table-light sticky-top">
                                                        <tr>
                                                            <th style={{ width: '40px' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    className="form-check-input"
                                                                    checked={allSelectedOnPage}
                                                                    onChange={handleSelectAllOnPage}
                                                                    disabled={selectableOnPage.length === 0}
                                                                />
                                                            </th>
                                                            <th>کد</th>
                                                            <th>عنوان</th>
                                                            <th>مقطع</th>
                                                            <th>دانشکده</th>
                                                            <th>گروه</th>
                                                            <th className="text-center">تعداد دانشجو</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reshtehs.map(r => {
                                                            const isSelected = selectedReshtehIds.has(r.reshtehId);
                                                            const isDisabled = r.alreadyAssigned;
                                                            return (
                                                                <tr key={r.reshtehId} className={isDisabled ? 'table-secondary' : ''}>
                                                                    <td>
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            checked={isSelected || isDisabled}
                                                                            onChange={() => !isDisabled && handleToggleReshteh(r.reshtehId)}
                                                                            disabled={isDisabled}
                                                                        />
                                                                    </td>
                                                                    <td><PersianNumber>{r.codeReshte || '-'}</PersianNumber></td>
                                                                    <td>{r.onvanReshte || '-'}</td>
                                                                    <td>{r.maghta || r.codeMaghta || '-'}</td>
                                                                    <td>{r.daneshkadehName || '-'}</td>
                                                                    <td>{r.grooheAmoozeshiName || '-'}</td>
                                                                    <td className="text-center">
                                                                        {isDisabled ? (
                                                                            <span className="badge bg-success">قبلاً اضافه شده</span>
                                                                        ) : requiresManualTedad && isSelected ? (
                                                                            <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                style={{ width: '80px', margin: '0 auto' }}
                                                                                min="1"
                                                                                value={tedadDaneshjooMap[r.reshtehId] || ''}
                                                                                onChange={(e) => handleTedadChange(r.reshtehId, e.target.value)}
                                                                                placeholder="تعداد"
                                                                            />
                                                                        ) : r.calculatedTedad != null ? (
                                                                            <strong className="text-primary">
                                                                                <PersianNumber>{r.calculatedTedad}</PersianNumber>
                                                                            </strong>
                                                                        ) : (
                                                                            <span className="text-muted">—</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* صفحه‌بندی */}
                                            {pagination.totalPages > 1 && (
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <small className="text-muted">
                                                        نمایش {((page - 1) * pageSize) + 1} تا {Math.min(page * pageSize, pagination.totalCount)} از {pagination.totalCount}
                                                    </small>
                                                    <nav>
                                                        <ul className="pagination pagination-sm mb-0">
                                                            <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                                                                    <i className="bi bi-chevron-right"></i>
                                                                </button>
                                                            </li>
                                                            <li className="page-item active">
                                                                <span className="page-link">
                                                                    <PersianNumber>{page}</PersianNumber> / <PersianNumber>{pagination.totalPages}</PersianNumber>
                                                                </span>
                                                            </li>
                                                            <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                                                                <button className="page-link" onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}>
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
                                                    </select>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="alert alert-warning py-2 text-center">
                                            <i className="bi bi-exclamation-triangle me-1"></i>
                                            رشته‌ای با این فیلترها یافت نشد
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="modal-footer">
                            <div className="me-auto">
                                {selectedReshtehIds.size > 0 && (
                                    <span className="badge bg-primary">
                                        <PersianNumber>{selectedReshtehIds.size}</PersianNumber> رشته انتخاب شده
                                    </span>
                                )}
                            </div>
                            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                                انصراف
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={saving || !selectedMarkaz || selectedReshtehIds.size === 0}
                            >
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-check-lg me-1"></i>
                                        افزودن {selectedReshtehIds.size > 0 ? `(${selectedReshtehIds.size})` : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}