import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';

export default function GrooheAmoozeshiFormModal({ show, onClose, onSuccess, item }) {
    const isEditMode = !!item;

    const [formData, setFormData] = useState({
        codeDaneshkade: '',
        naamDaneshkadeh: '',
        codeGrooheAmoozeshi: '',
        onvanGrooheAmoozeshi: '',
        vazeeat: true
    });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            if (item) {
                setFormData({
                    codeDaneshkade: item.codeDaneshkade || '',
                    naamDaneshkadeh: item.naamDaneshkadeh || '',
                    codeGrooheAmoozeshi: item.codeGrooheAmoozeshi || '',
                    onvanGrooheAmoozeshi: item.onvanGrooheAmoozeshi || '',
                    vazeeat: item.vazeeat ?? true
                });
            } else {
                setFormData({
                    codeDaneshkade: '',
                    naamDaneshkadeh: '',
                    codeGrooheAmoozeshi: '',
                    onvanGrooheAmoozeshi: '',
                    vazeeat: true
                });
            }
            setErrors({});
            setSubmitting(false);
        }
    }, [show, item?.id]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !submitting) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, submitting, onClose]);

    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox'
            ? e.target.checked
            : e.target.value;

        setFormData(prev => ({ ...prev, [field]: value }));

        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.onvanGrooheAmoozeshi.trim()) {
            newErrors.onvanGrooheAmoozeshi = 'عنوان گروه آموزشی الزامی است';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSubmitting(true);
        try {
            const payload = {
                codeDaneshkade: formData.codeDaneshkade || null,
                naamDaneshkadeh: formData.naamDaneshkadeh || null,
                codeGrooheAmoozeshi: formData.codeGrooheAmoozeshi || null,
                onvanGrooheAmoozeshi: formData.onvanGrooheAmoozeshi,
                vazeeat: formData.vazeeat 
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/GrooheAmoozeshi/update/${item.id}`, payload);
            } else {
                response = await api.post('/GrooheAmoozeshi/create', payload);
            }

            if (response.data?.success) {
                toast.success(isEditMode ? 'گروه آموزشی با موفقیت ویرایش شد' : 'گروه آموزشی با موفقیت ایجاد شد');
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

    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={submitting ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit}>
                            <div className={`modal-header ${isEditMode ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <h5 className="modal-title">
                                    <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                    {isEditMode ? `ویرایش گروه: ${item?.onvanGrooheAmoozeshi}` : 'ایجاد گروه آموزشی جدید'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={onClose}
                                    disabled={submitting}
                                ></button>
                            </div>

                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">کد دانشکده</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.codeDaneshkade}
                                            onChange={handleChange('codeDaneshkade')}
                                            disabled={submitting}
                                            placeholder="مثلاً: 11"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">نام دانشکده</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.naamDaneshkadeh}
                                            onChange={handleChange('naamDaneshkadeh')}
                                            disabled={submitting}
                                            placeholder="مثلاً: علوم پایه"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">کد گروه آموزشی</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.codeGrooheAmoozeshi}
                                            onChange={handleChange('codeGrooheAmoozeshi')}
                                            disabled={submitting}
                                            placeholder="مثلاً: 11"
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">
                                            عنوان گروه آموزشی <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.onvanGrooheAmoozeshi ? 'is-invalid' : ''}`}
                                            value={formData.onvanGrooheAmoozeshi}
                                            onChange={handleChange('onvanGrooheAmoozeshi')}
                                            disabled={submitting}
                                            placeholder="مثلاً: ریاضی"
                                        />
                                        {errors.onvanGrooheAmoozeshi && (
                                            <div className="invalid-feedback">{errors.onvanGrooheAmoozeshi}</div>
                                        )}
                                    </div>
                                    {/* 🔥 وضعیت */}
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