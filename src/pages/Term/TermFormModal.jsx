import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import PersianDatePicker from '../../components/common/PersianDatePicker';

// ============================================================
// تبدیل تاریخ به فرمت yyyy-MM-dd
// ============================================================
const toInputDate = (dateStr) => {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    } catch {
        return '';
    }
};

export default function TermFormModal({ show, onClose, onSuccess, term }) {
    const isEditMode = !!term;

    const [formData, setFormData] = useState({
        codeTerm: '',
        onvanTerm: '',
        nimsal: '',
        salTahsili: '',
        termJariShoroo: '',
        termJariPayan: '',
        tarikheDastrasi: '',
        tarikheEraeeDars: '',
        tarikhePayanDars: '',
        tarikheShorooClass: '',
        tarikhePayanClass: '',
        tarikheShorooMojavezMarakez: '',
        tarikhePayanMojavezMarakez: '',
        vazeeyat: false,
        isHaftegiRequired: true
    });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ============================================================
    // مقداردهی
    // ============================================================
    useEffect(() => {
        if (show) {
            if (term) {
                setFormData({
                    codeTerm: term.codeTerm || '',
                    onvanTerm: term.onvanTerm || '',
                    nimsal: term.nimsal || '',
                    salTahsili: term.salTahsili || '',
                    termJariShoroo: toInputDate(term.termJariShoroo),
                    termJariPayan: toInputDate(term.termJariPayan),
                    tarikheDastrasi: toInputDate(term.tarikheDastrasi),
                    tarikheEraeeDars: toInputDate(term.tarikheEraeeDars),
                    tarikhePayanDars: toInputDate(term.tarikhePayanDars),
                    tarikheShorooClass: toInputDate(term.tarikheShorooClass),
                    tarikhePayanClass: toInputDate(term.tarikhePayanClass),
                    tarikheShorooMojavezMarakez: toInputDate(term.tarikheShorooMojavezMarakez),
                    tarikhePayanMojavezMarakez: toInputDate(term.tarikhePayanMojavezMarakez),
                    vazeeyat: term.vazeeyat ?? false,
                    isHaftegiRequired: term.isHaftegiRequired ?? true
                });
            } else {
                setFormData({
                    codeTerm: '',
                    onvanTerm: '',
                    nimsal: '',
                    salTahsili: '',
                    termJariShoroo: '',
                    termJariPayan: '',
                    tarikheDastrasi: '',
                    tarikheEraeeDars: '',
                    tarikhePayanDars: '',
                    tarikheShorooClass: '',
                    tarikhePayanClass: '',
                    tarikheShorooMojavezMarakez: '',
                    tarikhePayanMojavezMarakez: '',
                    vazeeyat: false,
                    isHaftegiRequired: true
                });
            }
            setErrors({});
            setSubmitting(false);
        }
    }, [show, term]);

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

    const handleDateChange = (field) => (isoDate) => {
        setFormData(prev => ({ ...prev, [field]: isoDate }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    // ============================================================
    // اعتبارسنجی
    // ============================================================
    const validate = () => {
        const newErrors = {};
        if (!formData.codeTerm.trim()) newErrors.codeTerm = 'کد ترم الزامی است';
        if (!formData.onvanTerm.trim()) newErrors.onvanTerm = 'عنوان ترم الزامی است';
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
                codeTerm: formData.codeTerm,
                onvanTerm: formData.onvanTerm,
                nimsal: formData.nimsal || null,
                salTahsili: formData.salTahsili || null,
                termJariShoroo: formData.termJariShoroo || null,
                termJariPayan: formData.termJariPayan || null,
                tarikheDastrasi: formData.tarikheDastrasi || null,
                tarikheEraeeDars: formData.tarikheEraeeDars || null,
                tarikhePayanDars: formData.tarikhePayanDars || null,
                tarikheShorooClass: formData.tarikheShorooClass || null,
                tarikhePayanClass: formData.tarikhePayanClass || null,
                tarikheShorooMojavezMarakez: formData.tarikheShorooMojavezMarakez || null,
                tarikhePayanMojavezMarakez: formData.tarikhePayanMojavezMarakez || null,
                vazeeyat: formData.vazeeyat,
                isHaftegiRequired: formData.isHaftegiRequired
            };

            let response;
            if (isEditMode) {
                const { codeTerm, ...updatePayload } = payload;
                response = await api.put(`/Term/update/${term.codeTerm}`, updatePayload);
            } else {
                response = await api.post('/Term/create', payload);
            }

            if (response.data?.success) {
                toast.success(isEditMode ? 'ترم با موفقیت ویرایش شد' : 'ترم با موفقیت ایجاد شد');
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
    // رندر - دقیقاً مثل FaaliatList
    // ============================================================
    return (
        <>
            {/* 🔥 اول modal (بدون fade, با backgroundColor روی خودش) */}
            <div
                className="modal show d-block"
                style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
            >
                <div className="modal-dialog modal-lg">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            {/* هدر */}
                            <div className={`modal-header ${isEditMode ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <h5 className="modal-title">
                                    <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                    {isEditMode ? `ویرایش ترم: ${term?.onvanTerm}` : 'ایجاد ترم جدید'}
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
                                {/* اطلاعات پایه */}
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-info-circle me-1"></i>
                                    اطلاعات پایه
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label">
                                            کد ترم <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.codeTerm ? 'is-invalid' : ''}`}
                                            value={formData.codeTerm}
                                            onChange={handleChange('codeTerm')}
                                            disabled={submitting || isEditMode}
                                            style={isEditMode ? { backgroundColor: '#e9ecef' } : {}}
                                        />
                                        {errors.codeTerm && <div className="invalid-feedback">{errors.codeTerm}</div>}
                                        {isEditMode && <small className="text-muted">قابل ویرایش نیست</small>}
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">
                                            عنوان ترم <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.onvanTerm ? 'is-invalid' : ''}`}
                                            value={formData.onvanTerm}
                                            onChange={handleChange('onvanTerm')}
                                            disabled={submitting}
                                        />
                                        {errors.onvanTerm && <div className="invalid-feedback">{errors.onvanTerm}</div>}
                                    </div>

                                    <div className="col-md-2">
                                        <label className="form-label">سال تحصیلی</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.salTahsili}
                                            onChange={handleChange('salTahsili')}
                                            disabled={submitting}
                                            placeholder="1404-1405"
                                        />
                                    </div>

                                    <div className="col-md-2">
                                        <label className="form-label">نیمسال</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.nimsal}
                                            onChange={handleChange('nimsal')}
                                            disabled={submitting}
                                            placeholder="اول/دوم"
                                        />
                                    </div>
                                </div>

                                {/* تاریخ‌های ترم */}
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-calendar3 me-1"></i>
                                    تاریخ‌های ترم
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label">شروع ترم</label>
                                        <PersianDatePicker
                                            value={formData.termJariShoroo}
                                            onChange={handleDateChange('termJariShoroo')}
                                            disabled={submitting}
                                            placeholder="انتخاب تاریخ شروع ترم..."

                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">پایان ترم</label>
                                        <PersianDatePicker
                                            value={formData.termJariPayan}
                                            onChange={handleDateChange('termJariPayan')}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">تاریخ دسترسی</label>
                                        <PersianDatePicker
                                            value={formData.tarikheDastrasi}
                                            onChange={handleDateChange('tarikheDastrasi')}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {/* تاریخ‌های ارائه درس */}
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-journal-text me-1"></i>
                                    تاریخ‌های ارائه درس
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">شروع ارائه درس</label>
                                        <PersianDatePicker
                                            value={formData.tarikheEraeeDars}
                                            onChange={handleDateChange('tarikheEraeeDars')}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">پایان ارائه درس</label>
                                        <PersianDatePicker
                                            value={formData.tarikhePayanDars}
                                            onChange={handleDateChange('tarikhePayanDars')}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {/* تاریخ‌های کلاس */}
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-mortarboard me-1"></i>
                                    تاریخ‌های کلاس
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">شروع کلاس‌ها</label>
                                        <PersianDatePicker
                                            value={formData.tarikheShorooClass}
                                            onChange={handleDateChange('tarikheShorooClass')}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">پایان کلاس‌ها</label>
                                        <PersianDatePicker
                                            value={formData.tarikhePayanClass}
                                            onChange={handleDateChange('tarikhePayanClass')}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {/* تاریخ‌های مجوز مراکز */}
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-file-earmark-check me-1"></i>
                                    تاریخ‌های مجوز مراکز
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">شروع مجوز مراکز</label>
                                        <PersianDatePicker
                                            value={formData.tarikheShorooMojavezMarakez}
                                            onChange={handleDateChange('tarikheShorooMojavezMarakez')}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">پایان مجوز مراکز</label>
                                        <PersianDatePicker
                                            value={formData.tarikhePayanMojavezMarakez}
                                            onChange={handleDateChange('tarikhePayanMojavezMarakez')}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                {/* وضعیت */}
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-toggle-on me-1"></i>
                                    وضعیت
                                </h6>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="vazeeyat"
                                                checked={formData.vazeeyat}
                                                onChange={handleChange('vazeeyat')}
                                                disabled={submitting}
                                            />
                                            <label className="form-check-label" htmlFor="vazeeyat">
                                                <strong>ترم فعال</strong>
                                                <small className="text-muted d-block">
                                                    با فعال کردن این ترم، سایر ترم‌ها غیرفعال می‌شوند
                                                </small>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="isHaftegiRequired"
                                                checked={formData.isHaftegiRequired}
                                                onChange={handleChange('isHaftegiRequired')}
                                                disabled={submitting}
                                            />
                                            <label className="form-check-label" htmlFor="isHaftegiRequired">
                                                <strong>نیاز به برنامه هفتگی</strong>
                                                <small className="text-muted d-block">
                                                    در این ترم برنامه هفتگی اساتید الزامی است
                                                </small>
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
                                    {/* 🔥 همیشه هر دو عنصر رندر می‌شن، فقط با CSS مخفی/ظاهر می‌شن */}
                                    <span
                                        className="spinner-border spinner-border-sm me-1"
                                        role="status"
                                        style={{ display: submitting ? 'inline-block' : 'none' }}
                                    ></span>
                                    <i
                                        className="bi bi-check-lg me-1"
                                        style={{ display: submitting ? 'none' : 'inline-block' }}
                                    ></i>
                                    <span>
                                        {submitting ? 'در حال ذخیره...' : (isEditMode ? 'ذخیره تغییرات' : 'ایجاد ترم')}
                                    </span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* 🔥 بعد backdrop (inline style) */}
            <div
                className="modal-backdrop show"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    zIndex: 1040
                }}
                onClick={submitting ? undefined : onClose}
            ></div>
        </>
    );
}