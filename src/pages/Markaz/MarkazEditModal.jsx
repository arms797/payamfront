import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';

export default function MarkazEditModal({ show, onClose, onSuccess, markaz }) {
    const [formData, setFormData] = useState({
        naamMarkaz: '',
        codeOstan: '',
        naamOstan: '',
        vahedMarkaz: '',
        nahiyeh: '',
        mahalMarkaz: '',
        adres: '',
        codePosti: '',
        webSite: '',
        telefon: '',
        vazeeyat: true,
        dakheli: true,
        level: 4,
        noeMarkaz: 1
    });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show && markaz) {
            setFormData({
                naamMarkaz: markaz.naamMarkaz || '',
                codeOstan: markaz.codeOstan || '',
                naamOstan: markaz.naamOstan || '',
                vahedMarkaz: markaz.vahedMarkaz || '',
                nahiyeh: markaz.nahiyeh || '',
                mahalMarkaz: markaz.mahalMarkaz || '',
                adres: markaz.adres || '',
                codePosti: markaz.codePosti || '',
                webSite: markaz.webSite || '',
                telefon: markaz.telefon || '',
                vazeeyat: markaz.vazeeyat ?? true,
                dakheli: markaz.dakheli ?? true,
                level: markaz.level ?? 4,
                noeMarkaz: markaz.noeMarkaz ?? 1
            });
            setErrors({});
        }
    }, [show, markaz]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !submitting) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, submitting, onClose]);

    useEffect(() => {
        if (show) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [show]);

    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.naamMarkaz.trim()) {
            newErrors.naamMarkaz = 'نام مرکز الزامی است';
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
                naamMarkaz: formData.naamMarkaz,
                codeOstan: formData.codeOstan || null,
                naamOstan: formData.naamOstan || null,
                vahedMarkaz: formData.vahedMarkaz || null,
                nahiyeh: formData.nahiyeh || null,
                mahalMarkaz: formData.mahalMarkaz || null,
                adres: formData.adres || null,
                codePosti: formData.codePosti || null,
                webSite: formData.webSite || null,
                telefon: formData.telefon || null,
                vazeeyat: formData.vazeeyat,
                dakheli: formData.dakheli,
                level: parseInt(formData.level) || 4,
                noeMarkaz: parseInt(formData.noeMarkaz) || 1
            };

            const response = await api.put(`/Markaz/update/${markaz.id}`, payload);

            if (response.data?.success) {
                toast.success('مرکز با موفقیت به‌روزرسانی شد');

                // 🔥 فقط onSuccess رو صدا بزن (نه onClose)
                if (onSuccess) onSuccess(); 
            } else {
                toast.error(response.data?.message || 'خطا در ذخیره تغییرات');
                setSubmitting(false);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره تغییرات');
            setSubmitting(false);
        }
    };

    if (!show || !markaz) return null;

    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={submitting ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
                            <div className="modal-header bg-warning">
                                <h5 className="modal-title">
                                    <i className="bi bi-pencil-square me-2"></i>
                                    ویرایش مرکز: {markaz.naamMarkaz}
                                </h5>
                                <button type="button" className="btn-close" onClick={onClose} disabled={submitting}></button>
                            </div>

                            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-info-circle me-1"></i>
                                    اطلاعات پایه
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">کد مرکز</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={markaz.codeMarkaz || ''}
                                            disabled
                                            style={{ backgroundColor: '#e9ecef' }}
                                        />
                                        <small className="text-muted">قابل ویرایش نیست</small>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">
                                            نام مرکز <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.naamMarkaz ? 'is-invalid' : ''}`}
                                            value={formData.naamMarkaz}
                                            onChange={handleChange('naamMarkaz')}
                                            disabled={submitting}
                                        />
                                        {errors.naamMarkaz && (
                                            <div className="invalid-feedback">{errors.naamMarkaz}</div>
                                        )}
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">کد استان</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.codeOstan}
                                            onChange={handleChange('codeOstan')}
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">نام استان</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.naamOstan}
                                            onChange={handleChange('naamOstan')}
                                            disabled={submitting}
                                        />
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">واحد مرکز</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.vahedMarkaz}
                                            onChange={handleChange('vahedMarkaz')}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-gear me-1"></i>
                                    مشخصات فنی
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-4">
                                        <label className="form-label">سطح</label>
                                        <select className="form-select" value={formData.level} onChange={handleChange('level')} disabled={submitting}>
                                            <option value="2">سازمان مرکزی</option>
                                            <option value="3">ستاد استان</option>
                                            <option value="4">مرکز</option>
                                        </select>
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">نوع مرکز</label>
                                        <select className="form-select" value={formData.noeMarkaz} onChange={handleChange('noeMarkaz')} disabled={submitting}>
                                            <option value="1">حضوری</option>
                                            <option value="2">مجازی</option>
                                            <option value="3">حضوری و مجازی</option>
                                        </select>
                                    </div>

                                    <div className="col-md-4">
                                        <label className="form-label">ناحیه</label>
                                        <input type="text" className="form-control" value={formData.nahiyeh} onChange={handleChange('nahiyeh')} disabled={submitting} />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">محل مرکز</label>
                                        <input type="text" className="form-control" value={formData.mahalMarkaz} onChange={handleChange('mahalMarkaz')} disabled={submitting} />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">کد پستی</label>
                                        <input type="text" className="form-control" value={formData.codePosti} onChange={handleChange('codePosti')} disabled={submitting} />
                                    </div>
                                </div>

                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-telephone me-1"></i>
                                    اطلاعات تماس
                                </h6>

                                <div className="row g-3 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label">تلفن</label>
                                        <input type="text" className="form-control" value={formData.telefon} onChange={handleChange('telefon')} disabled={submitting} />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">وب‌سایت</label>
                                        <input type="text" className="form-control" value={formData.webSite} onChange={handleChange('webSite')} disabled={submitting} />
                                    </div>

                                    <div className="col-md-12">
                                        <label className="form-label">آدرس</label>
                                        <textarea className="form-control" rows="2" value={formData.adres} onChange={handleChange('adres')} disabled={submitting}></textarea>
                                    </div>
                                </div>

                                <h6 className="text-primary mb-3">
                                    <i className="bi bi-toggle-on me-1"></i>
                                    وضعیت
                                </h6>

                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" id="vazeeyat" checked={formData.vazeeyat} onChange={handleChange('vazeeyat')} disabled={submitting} />
                                            <label className="form-check-label" htmlFor="vazeeyat">
                                                {formData.vazeeyat ? 'فعال' : 'غیرفعال'}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-check form-switch">
                                            <input className="form-check-input" type="checkbox" id="dakheli" checked={formData.dakheli} onChange={handleChange('dakheli')} disabled={submitting} />
                                            <label className="form-check-label" htmlFor="dakheli">
                                                {formData.dakheli ? 'داخلی' : 'خارجی'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                                    <i className="bi bi-x-lg me-1"></i>
                                    انصراف
                                </button>
                                <button type="submit" className="btn btn-warning" disabled={submitting}>
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
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}