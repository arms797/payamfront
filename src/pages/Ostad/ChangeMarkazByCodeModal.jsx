import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';

export default function ChangeMarkazByCodeModal({ show, onClose, onSuccess }) {
    const [step, setStep] = useState(1);   // ۱ = جستجو، ۲ = انتخاب مراکز
    const [code, setCode] = useState('');
    const [searching, setSearching] = useState(false);
    const [foundOstad, setFoundOstad] = useState(null);
    const [formData, setFormData] = useState({
        markazId: '',
        markazAsliId: ''
    });
    const [submitting, setSubmitting] = useState(false);

    // ============================================================
    // ریست کردن فرم هنگام بستن
    // ============================================================
    const handleClose = () => {
        if (submitting) return;
        setStep(1);
        setCode('');
        setFoundOstad(null);
        setFormData({ markazId: '', markazAsliId: '' });
        onClose();
    };

    // ============================================================
    // مرحله ۱: جستجو
    // ============================================================
    const handleSearch = async () => {
        if (!code.trim()) {
            toast.warning('کد استادی را وارد کنید');
            return;
        }

        setSearching(true);
        try {
            const response = await api.get(`/Ostad/search-by-code/${code.trim()}`);

            if (response.data?.success) {
                const ostad = response.data.data;
                setFoundOstad(ostad);
                // پیش‌پر کردن با مقادیر فعلی (اگه وجود داشته باشه)
                setFormData({
                    markazId: ostad.markazId || '',
                    markazAsliId: ostad.markazAsliId || ''
                });
                setStep(2);
                toast.success(`استاد «${ostad.fullName}» یافت شد`);
            } else {
                toast.error(response.data?.message || 'استاد یافت نشد');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'خطا در جستجوی استاد';
            toast.error(msg);
        } finally {
            setSearching(false);
        }
    };

    // ============================================================
    // بازگشت به مرحله جستجو
    // ============================================================
    const handleBackToSearch = () => {
        setStep(1);
        setFoundOstad(null);
        setFormData({ markazId: '', markazAsliId: '' });
    };

    // ============================================================
    // مرحله ۲: ذخیره تغییرات
    // ============================================================
    const handleSubmit = async () => {
        if (!formData.markazId) {
            toast.warning('انتخاب مرکز خدمتی الزامی است');
            return;
        }

        // بررسی تغییر واقعی
        const originalMarkazId = foundOstad.markazId || null;
        const newMarkazId = parseInt(formData.markazId);
        if (originalMarkazId === newMarkazId &&
            (foundOstad.markazAsliId || null) === (formData.markazAsliId ? parseInt(formData.markazAsliId) : null)) {
            toast.info('هیچ تغییری اعمال نشد');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                codeOstadi: foundOstad.codeOstadi,
                markazId: newMarkazId,
                markazAsliId: formData.markazAsliId ? parseInt(formData.markazAsliId) : null
            };

            const response = await api.patch('/Ostad/change-markaz-by-code', payload);

            if (response.data?.success) {
                toast.success(response.data.message || 'تغییرات با موفقیت ذخیره شد');
                if (onSuccess) onSuccess(response.data.data);
                handleClose();
            } else {
                toast.error(response.data?.message || 'خطا در ذخیره تغییرات');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره تغییرات');
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // رندر
    // ============================================================
    if (!show) return null;

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={handleClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        {/* هدر */}
                        <div className="modal-header bg-danger text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-shield-lock me-2"></i>
                                تغییر مراکز استاد (با کد استادی)
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={handleClose}
                                disabled={submitting}
                            ></button>
                        </div>

                        {/* بدنه */}
                        <div className="modal-body">
                            {/* هشدار ادمین */}
                            <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '12px' }}>
                                <i className="bi bi-exclamation-octagon-fill me-2"></i>
                                <strong>ویژه ادمین سامانه</strong> - این عملیات امکان تغییر مراکز استاد را حتی برای اساتیدی که در لیست نمایش داده نمی‌شوند فراهم می‌کند.
                            </div>

                            {/* ============================================================ */}
                            {/* مرحله ۱: جستجو */}
                            {/* ============================================================ */}
                            {step === 1 && (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">
                                            کد استادی <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group">
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="کد استادی را وارد کنید..."
                                                disabled={searching}
                                                autoFocus
                                            />
                                            <button
                                                className="btn btn-primary"
                                                onClick={handleSearch}
                                                disabled={searching || !code.trim()}
                                            >
                                                {searching ? (
                                                    <span className="spinner-border spinner-border-sm" role="status"></span>
                                                ) : (
                                                    <>
                                                        <i className="bi bi-search me-1"></i>
                                                        جستجو
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                        <small className="text-muted d-block mt-1">
                                            با وارد کردن کد استادی، استاد مربوطه پیدا می‌شود
                                        </small>
                                    </div>
                                </>
                            )}

                            {/* ============================================================ */}
                            {/* مرحله ۲: نمایش نتیجه + انتخاب مراکز */}
                            {/* ============================================================ */}
                            {step === 2 && foundOstad && (
                                <>
                                    {/* کارت اطلاعات استاد */}
                                    <div className="card mb-3 border-primary">
                                        <div className="card-header bg-primary text-white py-2">
                                            <i className="bi bi-person-check-fill me-2"></i>
                                            استاد یافت شد
                                        </div>
                                        <div className="card-body py-2">
                                            <div className="row mb-1">
                                                <div className="col-4 text-muted">کد استادی:</div>
                                                <div className="col-8 fw-bold">{foundOstad.codeOstadi}</div>
                                            </div>
                                            <div className="row mb-1">
                                                <div className="col-4 text-muted">نام و فامیل:</div>
                                                <div className="col-8 fw-bold text-primary">{foundOstad.fullName}</div>
                                            </div>
                                            <div className="row mb-1">
                                                <div className="col-4 text-muted">مرکز فعلی:</div>
                                                <div className="col-8">
                                                    {foundOstad.markazName || <span className="badge bg-secondary">بدون مرکز</span>}
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-4 text-muted">مرکز اصلی فعلی:</div>
                                                <div className="col-8">
                                                    {foundOstad.markazAsliName || <span className="badge bg-secondary">ندارد</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* هشدار تأیید */}
                                    <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '12px' }}>
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        لطفاً از درستی این استاد مطمئن شوید. مراکز جدید را انتخاب و سپس ذخیره کنید.
                                    </div>

                                    {/* انتخاب مرکز خدمتی */}
                                    <div className="mb-3">
                                        <MarkazSelector
                                            label="مرکز خدمتی جدید *"
                                            value={formData.markazId}
                                            onChange={(val) => setFormData(prev => ({ ...prev, markazId: val }))}
                                            allVazeeyat={false}// همه مراکز
                                            required={true}
                                            placeholder="انتخاب مرکز خدمتی جدید..."
                                        />
                                    </div>

                                    {/* انتخاب مرکز اصلی */}
                                    <div className="mb-3">
                                        <MarkazSelector
                                            label="مرکز اصلی جدید"
                                            value={formData.markazAsliId}
                                            onChange={(val) => setFormData(prev => ({ ...prev, markazAsliId: val }))}
                                            allVazeeyat={false}// همه مراکز
                                            required={false}
                                            placeholder="انتخاب مرکز اصلی جدید (اختیاری)..."
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* فوتر */}
                        <div className="modal-footer">
                            {step === 1 ? (
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={handleClose}
                                    disabled={searching}
                                >
                                    <i className="bi bi-x-lg me-1"></i>
                                    انصراف
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleBackToSearch}
                                        disabled={submitting}
                                    >
                                        <i className="bi bi-arrow-right me-1"></i>
                                        بازگشت به جستجو
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleSubmit}
                                        disabled={submitting || !formData.markazId}
                                    >
                                        {submitting ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                در حال ذخیره...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-check-circle me-1"></i>
                                                تأیید و ذخیره
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}