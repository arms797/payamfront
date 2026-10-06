import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';

export default function ReshtehFormModal({ show, onClose, onSuccess, item, grooheList }) {
    const isEditMode = !!item;

    const [formData, setFormData] = useState({
        grooheAmoozeshiId: '',
        codeMaghta: '',
        maghta: '',
        codeReshte: '',
        onvanReshte: '',
        termVorood: '',
        termEamal: '',
        vazeeat: true
    });

    const [selectedDaneshkade, setSelectedDaneshkade] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ============================================================
    // لیست مقطع‌ها
    // ============================================================
    const maghtaOptions = [
        { value: 5, label: 'کارشناسی' },
        { value: 10, label: 'کارشناسی ارشد' },
        { value: 15, label: 'دکتری تخصصی' }
    ];

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
    // لیست گروه‌های دانشکده انتخاب‌شده (فقط فعال‌ها)
    // ============================================================
    const filteredGroohes = useMemo(() => {
        if (!selectedDaneshkade || !grooheList) return [];
        return grooheList.filter(g => g.codeDaneshkade === selectedDaneshkade);
    }, [grooheList, selectedDaneshkade]);

    // ============================================================
    // مقداردهی اولیه
    // ============================================================
    useEffect(() => {
        if (show) {
            if (item) {
                setFormData({
                    grooheAmoozeshiId: item.grooheAmoozeshiId || '',
                    codeMaghta: item.codeMaghta || '',
                    maghta: item.maghta || '',
                    codeReshte: item.codeReshte || '',
                    onvanReshte: item.onvanReshte || '',
                    termVorood: item.termVorood || '',
                    termEamal: item.termEamal || '',
                    vazeeat: item.vazeeat === true
                });

                // پیدا کردن دانشکده از گروه
                const groohe = grooheList?.find(g => g.id === item.grooheAmoozeshiId);
                setSelectedDaneshkade(groohe?.codeDaneshkade || '');
            } else {
                setFormData({
                    grooheAmoozeshiId: '',
                    codeMaghta: '',
                    maghta: '',
                    codeReshte: '',
                    onvanReshte: '',
                    termVorood: '',
                    termEamal: '',
                    vazeeat: true
                });
                setSelectedDaneshkade('');
            }
            setErrors({});
            setSubmitting(false);
        }
    }, [show, item?.id]);

    // ============================================================
    // Escape
    // ============================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !submitting) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, submitting, onClose]);

    // ============================================================
    // تغییر مقادیر
    // ============================================================
    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    // 🔥 تغییر دانشکده → ریست گروه
    const handleDaneshkadeChange = (e) => {
        setSelectedDaneshkade(e.target.value);
        setFormData(prev => ({ ...prev, grooheAmoozeshiId: '' }));
    };

    // 🔥 تغییر مقطع
    const handleMaghtaChange = (e) => {
        const codeMaghta = e.target.value;
        const maghtaLabel = maghtaOptions.find(m => m.value === parseInt(codeMaghta))?.label || '';
        setFormData(prev => ({
            ...prev,
            codeMaghta: codeMaghta,
            maghta: maghtaLabel
        }));
    };

    // ============================================================
    // اعتبارسنجی
    // ============================================================
    const validate = () => {
        const newErrors = {};
        if (!formData.grooheAmoozeshiId) newErrors.grooheAmoozeshiId = 'گروه آموزشی الزامی است';
        if (!formData.codeMaghta) newErrors.codeMaghta = 'مقطع الزامی است';
        if (!formData.codeReshte?.trim()) newErrors.codeReshte = 'کد رشته الزامی است';
        if (!formData.onvanReshte?.trim()) newErrors.onvanReshte = 'عنوان رشته الزامی است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================
    // ذخیره
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                grooheAmoozeshiId: formData.grooheAmoozeshiId ? parseInt(formData.grooheAmoozeshiId) : null,
                codeMaghta: formData.codeMaghta || null,
                maghta: formData.maghta || null,
                codeReshte: formData.codeReshte || null,
                onvanReshte: formData.onvanReshte,
                termVorood: formData.termVorood || null,
                termEamal: formData.termEamal || null,
                vazeeat: Boolean(formData.vazeeat)
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/Reshteh/update/${item.id}`, payload);
            } else {
                response = await api.post('/Reshteh/create', payload);
            }

            if (response.data?.success) {
                toast.success(isEditMode ? 'رشته با موفقیت ویرایش شد' : 'رشته با موفقیت ایجاد شد');
                setSubmitting(false);
                onSuccess();
            } else {
                toast.error(response.data?.message || 'خطا در ذخیره تغییرات');
                setSubmitting(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره تغییرات');
            setSubmitting(false);
        }
    };

    if (!show) return null;

    // ============================================================
    // رندر
    // ============================================================
    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={submitting ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            {/* هدر */}
                            <div className={`modal-header ${isEditMode ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <h5 className="modal-title">
                                    <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                    {isEditMode ? `ویرایش رشته: ${item?.onvanReshte}` : 'ایجاد رشته جدید'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={onClose}
                                    disabled={submitting}
                                ></button>
                            </div>

                            {/* بدنه */}
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {/* ردیف اول: دانشکده + گروه آموزشی */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            دانشکده <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={selectedDaneshkade}
                                            onChange={handleDaneshkadeChange}
                                            disabled={submitting}
                                        >
                                            <option value="">انتخاب دانشکده...</option>
                                            {uniqueDaneshkades.map(d => (
                                                <option key={d.code} value={d.code}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">
                                            گروه آموزشی <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${errors.grooheAmoozeshiId ? 'is-invalid' : ''}`}
                                            value={formData.grooheAmoozeshiId}
                                            onChange={handleChange('grooheAmoozeshiId')}
                                            disabled={submitting || !selectedDaneshkade}
                                        >
                                            <option value="">انتخاب گروه...</option>
                                            {filteredGroohes.map(g => (
                                                <option key={g.id} value={g.id}>
                                                    {g.onvanGrooheAmoozeshi}
                                                    {g.vazeeat === false && ' (غیرفعال)'}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.grooheAmoozeshiId && (
                                            <div className="invalid-feedback">{errors.grooheAmoozeshiId}</div>
                                        )}
                                    </div>
                                </div>

                                {/* ردیف دوم: کد رشته + عنوان رشته */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label">
                                            کد رشته <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.codeReshte ? 'is-invalid' : ''}`}
                                            value={formData.codeReshte}
                                            onChange={handleChange('codeReshte')}
                                            disabled={submitting}
                                            placeholder="مثلاً: 111130"
                                        />
                                        {errors.codeReshte && (
                                            <div className="invalid-feedback">{errors.codeReshte}</div>
                                        )}
                                    </div>

                                    <div className="col-md-8">
                                        <label className="form-label">
                                            عنوان رشته <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.onvanReshte ? 'is-invalid' : ''}`}
                                            value={formData.onvanReshte}
                                            onChange={handleChange('onvanReshte')}
                                            disabled={submitting}
                                            placeholder="مثلاً: ریاضی (کاربردی)"
                                        />
                                        {errors.onvanReshte && (
                                            <div className="invalid-feedback">{errors.onvanReshte}</div>
                                        )}
                                    </div>
                                </div>

                                {/* ردیف سوم: مقطع */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">
                                            مقطع <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className={`form-select ${errors.codeMaghta ? 'is-invalid' : ''}`}
                                            value={formData.codeMaghta}
                                            onChange={handleMaghtaChange}
                                            disabled={submitting}
                                        >
                                            <option value="">انتخاب مقطع...</option>
                                            {maghtaOptions.map(m => (
                                                <option key={m.value} value={m.value}>{m.label}</option>
                                            ))}
                                        </select>
                                        {errors.codeMaghta && (
                                            <div className="invalid-feedback">{errors.codeMaghta}</div>
                                        )}
                                    </div>
                                </div>

                                {/* ردیف چهارم: ترم ورود + ترم اعمال */}
                                <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ترم ورود</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.termVorood}
                                            onChange={handleChange('termVorood')}
                                            disabled={submitting}
                                            placeholder="مثلاً: 3771"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">ترم اعمال</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.termEamal}
                                            onChange={handleChange('termEamal')}
                                            disabled={submitting}
                                            placeholder="مثلاً: 3872"
                                        />
                                    </div>
                                </div>

                                {/* وضعیت */}
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">وضعیت</label>
                                        <div className="form-check form-switch mt-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="vazeeat"
                                                checked={formData.vazeeat}
                                                onChange={handleChange('vazeeat')}
                                                disabled={submitting}
                                            />
                                            <label className="form-check-label" htmlFor="vazeeat">
                                                {formData.vazeeat ? 'فعال' : 'غیرفعال'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* فوتر */}
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    <i className="bi bi-x-lg me-1"></i>
                                    انصراف
                                </button>
                                <button
                                    type="submit"
                                    className={`btn ${isEditMode ? 'btn-warning' : 'btn-primary'}`}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-1"></i>
                                            {isEditMode ? 'ذخیره تغییرات' : 'ایجاد'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
}