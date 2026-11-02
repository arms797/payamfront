import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useReshteh } from '../../../context/ReshtehContext';
import { useMarkaz } from '../../../context/MarkazContext';
import SingleSelectWrapper from '../../../components/common/SingleSelectWrapper';

export default function MarkazReshtehFormModal({ show, onClose, onSuccess, item }) {
    const { reshtehList } = useReshteh();
    const { markazList } = useMarkaz();

    const isEdit = !!item;

    // ============================================================
    // State فرم
    // ============================================================
    const [formData, setFormData] = useState({
        ostanCode: '',
        markazId: '',
        reshtehId: '',
        tedadDaneshjoo: '',
        vazeeat: true
    });

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // ============================================================
    // لیست مقطع‌ها (فقط برای نمایش در لیبل رشته)
    // ============================================================
    const maghtaMap = useMemo(() => {
        return {
            '5': 'کارشناسی',
            '10': 'کارشناسی ارشد',
            '15': 'دکتری تخصصی'
        };
    }, []);

    // ============================================================
    // لیست استان‌ها
    // ============================================================
    const ostanOptions = useMemo(() => {
        const map = new Map();
        markazList.forEach(m => {
            if (m.codeOstan && m.naamOstan && !map.has(m.codeOstan)) {
                map.set(m.codeOstan, m.naamOstan);
            }
        });
        return Array.from(map, ([code, name]) => ({
            value: code,
            label: name
        })).sort((a, b) => a.label.localeCompare(b.label, 'fa'));
    }, [markazList]);

    // ============================================================
    // لیست مراکز (فقط استان انتخاب‌شده)
    // ============================================================
    const markazOptions = useMemo(() => {
        if (!formData.ostanCode) return [];

        const filtered = markazList.filter(m => m.codeOstan === formData.ostanCode);

        const buildName = (m) => {
            if (m.naamMarkaz && m.naamMarkaz.trim()) return m.naamMarkaz;
            if (m.level === 3) return m.naamOstan ? `ستاد استان ${m.naamOstan}` : 'ستاد استان';
            if (m.level === 2) return 'سازمان مرکزی';
            return m.codeMarkaz || '';
        };

        return [...filtered]
            .sort((a, b) => buildName(a).localeCompare(buildName(b), 'fa'))
            .map(m => ({
                value: String(m.id),
                label: `${buildName(m)} (${m.codeMarkaz || '-'})`,
                searchText: `${m.codeMarkaz} ${buildName(m)}`
            }));
    }, [markazList, formData.ostanCode]);

    // ============================================================
    // لیست رشته‌ها — label شامل کد + عنوان + مقطع
    // ============================================================
    const reshtehOptions = useMemo(() => {
        return [...(reshtehList || [])]
            .sort((a, b) => (a.onvanReshte || '').localeCompare(b.onvanReshte || '', 'fa'))
            .map(r => {
                const maghtaName = maghtaMap[r.codeMaghta] || r.maghta || '';
                return {
                    value: String(r.id),
                    label: `${r.codeReshte || '-'} - ${r.onvanReshte || '-'}${maghtaName ? ` (${maghtaName})` : ''}`,
                    searchText: `${r.codeReshte || ''} ${r.onvanReshte || ''} ${maghtaName}`
                };
            });
    }, [reshtehList, maghtaMap]);

    // ============================================================
    // Reset on open
    // ============================================================
    useEffect(() => {
        if (!show) return;

        if (isEdit) {
            const markaz = markazList.find(m => m.id === item.markazId);
            const ostanCode = markaz?.codeOstan || '';

            setFormData({
                ostanCode: ostanCode,
                markazId: String(item.markazId || ''),
                reshtehId: String(item.reshtehId || ''),
                tedadDaneshjoo: item.tedadDaneshjoo ?? '',
                vazeeat: item.vazeeat ?? true
            });
        } else {
            setFormData({
                ostanCode: '',
                markazId: '',
                reshtehId: '',
                tedadDaneshjoo: '',
                vazeeat: true
            });
        }
        setErrors({});
        setSaving(false);
    }, [show, item, markazList, isEdit]);

    // ============================================================
    // تغییر استان → ریست مرکز و رشته
    // ============================================================
    const handleOstanChange = (value) => {
        setFormData(prev => ({
            ...prev,
            ostanCode: value || '',
            markazId: '',
            reshtehId: ''
        }));
        setErrors(prev => ({ ...prev, markazId: null }));
    };

    // ============================================================
    // تغییر مرکز
    // ============================================================
    const handleMarkazChange = (value) => {
        setFormData(prev => ({ ...prev, markazId: value || '' }));
        setErrors(prev => ({ ...prev, markazId: null }));
    };

    // ============================================================
    // تغییر رشته
    // ============================================================
    const handleReshtehChange = (value) => {
        setFormData(prev => ({ ...prev, reshtehId: value || '' }));
        setErrors(prev => ({ ...prev, reshtehId: null }));
    };

    // ============================================================
    // ذخیره
    // ============================================================
    const handleSave = async () => {
        const newErrors = {};
        if (!isEdit && !formData.markazId) newErrors.markazId = 'مرکز الزامی است';
        if (!isEdit && !formData.reshtehId) newErrors.reshtehId = 'رشته الزامی است';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSaving(true);
        try {
            const payload = isEdit
                ? {
                    tedadDaneshjoo: formData.tedadDaneshjoo === '' ? null : parseInt(formData.tedadDaneshjoo, 10),
                    vazeeat: formData.vazeeat
                }
                : {
                    markazId: parseInt(formData.markazId, 10),
                    reshtehId: parseInt(formData.reshtehId, 10),
                    tedadDaneshjoo: formData.tedadDaneshjoo === '' ? null : parseInt(formData.tedadDaneshjoo, 10),
                    vazeeat: formData.vazeeat
                };

            const url = isEdit
                ? `/MarkazReshteh/update/${item.id}`
                : '/MarkazReshteh/create';
            const method = isEdit ? 'put' : 'post';

            const response = await api[method](url, payload);
            if (response.data?.success) {
                toast.success(isEdit ? 'ویرایش شد' : 'ایجاد شد');
                onSuccess?.();
            } else {
                toast.error(response.data?.message || 'خطا');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };

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
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        {/* هدر */}
                        <div className={`modal-header ${isEdit ? 'bg-warning' : 'bg-primary'} text-white`}>
                            <h5 className="modal-title">
                                <i className={`bi ${isEdit ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                {isEdit ? 'ویرایش رشته‌ی مرکز' : 'افزودن رشته به مرکز'}
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={saving}
                            ></button>
                        </div>

                        {/* بدنه */}
                        <div className="modal-body">
                            {/* ==== استان (فقط در حالت ایجاد) ==== */}
                            {!isEdit && (
                                <div className="mb-3">
                                    <label className="form-label">
                                        استان <span className="text-danger">*</span>
                                    </label>
                                    <SingleSelectWrapper
                                        options={ostanOptions}
                                        value={formData.ostanCode}
                                        onChange={handleOstanChange}
                                        placeholder="انتخاب استان..."
                                        isDisabled={saving}
                                    />
                                    <small className="text-muted">
                                        ابتدا استان را انتخاب کنید، سپس مرکز
                                    </small>
                                </div>
                            )}

                            {/* ==== مرکز ==== */}
                            <div className="mb-3">
                                <label className="form-label">
                                    مرکز <span className="text-danger">*</span>
                                </label>
                                <SingleSelectWrapper
                                    options={markazOptions}
                                    value={formData.markazId}
                                    onChange={handleMarkazChange}
                                    placeholder={
                                        isEdit
                                            ? 'مرکز'
                                            : !formData.ostanCode
                                                ? 'ابتدا استان را انتخاب کنید'
                                                : 'انتخاب مرکز...'
                                    }
                                    isDisabled={saving || isEdit || !formData.ostanCode}
                                    isClearable={!isEdit}
                                />
                                {errors.markazId && (
                                    <small className="text-danger">{errors.markazId}</small>
                                )}
                                {isEdit && (
                                    <small className="text-muted d-block">مرکز قابل تغییر نیست</small>
                                )}
                            </div>

                            {/* ==== رشته (جستجو) ==== */}
                            <div className="mb-3">
                                <label className="form-label">
                                    رشته <span className="text-danger">*</span>
                                </label>
                                <SingleSelectWrapper
                                    options={reshtehOptions}
                                    value={formData.reshtehId}
                                    onChange={handleReshtehChange}
                                    placeholder="جستجو بر اساس کد یا عنوان رشته..."
                                    isDisabled={saving || isEdit}
                                    isClearable={!isEdit}
                                />
                                {errors.reshtehId && (
                                    <small className="text-danger">{errors.reshtehId}</small>
                                )}
                                {isEdit && (
                                    <small className="text-muted d-block">رشته قابل تغییر نیست</small>
                                )}
                                
                            </div>

                            {/* ==== تعداد دانشجو ==== */}
                            <div className="mb-3">
                                <label className="form-label">تعداد دانشجو</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    min="0"
                                    value={formData.tedadDaneshjoo}
                                    onChange={(e) => setFormData({ ...formData, tedadDaneshjoo: e.target.value })}
                                    disabled={saving}
                                    placeholder="مثلاً 150"
                                />
                            </div>

                            {/* ==== وضعیت ==== */}
                            <div className="form-check form-switch">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="vazeeatSwitch"
                                    checked={formData.vazeeat}
                                    onChange={(e) => setFormData({ ...formData, vazeeat: e.target.checked })}
                                    disabled={saving}
                                />
                                <label className="form-check-label" htmlFor="vazeeatSwitch">
                                    فعال
                                </label>
                            </div>
                        </div>

                        {/* فوتر */}
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={onClose} disabled={saving}>
                                انصراف
                            </button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    isEdit ? 'ویرایش' : 'ایجاد'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}