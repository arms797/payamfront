import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';

/**
 * مودال اختصاصی تغییر مرکز خدمتی و مرکز اصلی استاد
 * 
 * @param {boolean} show - نمایش/عدم نمایش مودال
 * @param {function} onClose - تابع بستن مودال
 * @param {function} onSuccess - تابع فراخوانی بعد از ذخیره موفق
 * @param {number} ostadId - شناسه استاد
 * @param {string} ostadName - نام استاد (برای نمایش در عنوان)
 * @param {number} currentMarkazId - مرکز خدمتی فعلی
 * @param {number} currentMarkazAsliId - مرکز اصلی فعلی
 */
export default function ChangeOstadMarkazModal({
    show,
    onClose,
    onSuccess,
    ostadId,
    ostadName = '',
    currentMarkazId = null,
    currentMarkazAsliId = null
}) {
    const [formData, setFormData] = useState({
        markazId: '',
        markazAsliId: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ============================================================
    // مقداردهی اولیه هنگام باز شدن مودال
    // ============================================================
    useEffect(() => {
        if (show) {
            setFormData({
                markazId: currentMarkazId || '',
                markazAsliId: currentMarkazAsliId || ''
            });
            setErrors({});
        }
    }, [show, currentMarkazId, currentMarkazAsliId]);

    // ============================================================
    // بستن با کلید Escape
    // ============================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !submitting) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, submitting, onClose]);

    // ============================================================
    // تغییر مقادیر فرم
    // ============================================================
    const handleChange = (field) => (value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        // پاک کردن خطای آن فیلد
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    // ============================================================
    // اعتبارسنجی
    // ============================================================
    const validate = () => {
        const newErrors = {};

        if (!formData.markazId) {
            newErrors.markazId = 'انتخاب مرکز خدمتی الزامی است';
        }

        // اگر مرکز اصلی انتخاب شده ولی مرکز خدمتی نه
        if (formData.markazAsliId && !formData.markazId) {
            newErrors.markazId = 'ابتدا مرکز خدمتی را انتخاب کنید';
        }

        // مرکز خدمتی و مرکز اصلی نباید یکی باشند (اختیاری - بسته به قوانین شما)
        // if (formData.markazId && formData.markazAsliId && 
        //     parseInt(formData.markazId) === parseInt(formData.markazAsliId)) {
        //     newErrors.markazAsliId = 'مرکز اصلی نباید با مرکز خدمتی یکسان باشد';
        // }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================
    // ذخیره تغییرات
    // ============================================================
    const handleSubmit = async () => {
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                markazId: parseInt(formData.markazId),
                markazAsliId: formData.markazAsliId ? parseInt(formData.markazAsliId) : null
            };

            const response = await api.patch(`/Ostad/${ostadId}/change-markaz`, payload);

            if (response.data?.success) {
                toast.success('مراکز استاد با موفقیت به‌روزرسانی شد');
                if (onSuccess) {
                    onSuccess(response.data.data);
                }
                onClose();
            } else {
                toast.error(response.data?.message || 'خطا در ذخیره تغییرات');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'خطا در ذخیره تغییرات';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    // ============================================================
    // عدم نمایش
    // ============================================================
    if (!show) return null;

    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            {/* Backdrop */}
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={submitting ? undefined : onClose}
            ></div>

            {/* Modal */}
            <div
                className="modal fade show d-block"
                style={{ zIndex: 1055 }}
                tabIndex="-1"
                role="dialog"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        {/* ============================================================ */}
                        {/* Header */}
                        {/* ============================================================ */}
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-building-gear me-2"></i>
                                تغییر مراکز استاد
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={submitting}
                            ></button>
                        </div>

                        {/* ============================================================ */}
                        {/* Body */}
                        {/* ============================================================ */}
                        <div className="modal-body">
                            {/* نمایش نام استاد */}
                            {ostadName && (
                                <div className="alert alert-info py-2 mb-3">
                                    <i className="bi bi-person-badge me-2"></i>
                                    <strong>استاد:</strong> {ostadName}
                                </div>
                            )}

                            {/* هشدار */}
                            <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '12px' }}>
                                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                تغییر مرکز خدمتی و مرکز اصلی استاد، تأثیر مستقیم بر برنامه هفتگی و دسترسی‌های ایشان دارد. لطفاً با دقت اقدام کنید.
                                تغییر مرکز خدمتی استاد به منزله انتقال موقت به مرکز مقصد میباشد.
                                تغییر مرکز اصلی به منزله انتقال استاد از یک مرکز به مرکز دیگر و مطابق حکم استخدامی می‌باشد.
                            </div>

                            {/* مرکز خدمتی */}
                            <div className="mb-3">
                                <MarkazSelector
                                    label="مرکز خدمتی"
                                    value={formData.markazId}
                                    onChange={handleChange('markazId')}
                                    required={true}
                                    placeholder="انتخاب مرکز خدمتی..."
                                />
                                {errors.markazId && (
                                    <small className="text-danger d-block mt-1">
                                        <i className="bi bi-x-circle me-1"></i>
                                        {errors.markazId}
                                    </small>
                                )}
                            </div>

                            {/* مرکز اصلی */}
                            <div className="mb-3">
                                <MarkazSelector
                                    label="مرکز اصلی"
                                    value={formData.markazAsliId || ''}
                                    onChange={handleChange('markazAsliId')}
                                    required={false}
                                    placeholder="انتخاب مرکز اصلی (اختیاری)..."
                                />
                                {errors.markazAsliId && (
                                    <small className="text-danger d-block mt-1">
                                        <i className="bi bi-x-circle me-1"></i>
                                        {errors.markazAsliId}
                                    </small>
                                )}
                                <small className="text-muted d-block mt-1">
                                    <i className="bi bi-info-circle me-1"></i>
                                    در صورت خالی بودن، مرکز خدمتی به عنوان مرکز اصلی در نظر گرفته می‌شود.
                                </small>
                            </div>
                        </div>

                        {/* ============================================================ */}
                        {/* Footer */}
                        {/* ============================================================ */}
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
                                type="button"
                                className="btn btn-primary"
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
                                        <i className="bi bi-check-lg me-1"></i>
                                        ذخیره تغییرات
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