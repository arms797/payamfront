import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useReshteh } from '../../../context/ReshtehContext';
import { useMarkaz } from '../../../context/MarkazContext';

export default function MarkazReshtehFormModal({ show, onClose, onSuccess, item }) {
    const { reshtehList } = useReshteh();
    const { markazList } = useMarkaz();

    const isEdit = !!item;

    const [formData, setFormData] = useState({
        markazId: '',
        reshtehId: '',
        tedadDaneshjoo: '',
        vazeeat: true
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    // ---- Options ----
    const markazOptions = useMemo(() => {
        return [...markazList]
            .sort((a, b) => (a.naamMarkaz || '').localeCompare(b.naamMarkaz || '', 'fa'));
    }, [markazList]);

    const reshtehOptions = useMemo(() => {
        return [...reshtehList]
            .sort((a, b) => (a.onvanReshte || '').localeCompare(b.onvanReshte || '', 'fa'));
    }, [reshtehList]);

    // ---- Reset on open ----
    useEffect(() => {
        if (!show) return;
        if (isEdit) {
            setFormData({
                markazId: item.markazId || '',
                reshtehId: item.reshtehId || '',
                tedadDaneshjoo: item.tedadDaneshjoo ?? '',
                vazeeat: item.vazeeat ?? true
            });
        } else {
            setFormData({
                markazId: '',
                reshtehId: '',
                tedadDaneshjoo: '',
                vazeeat: true
            });
        }
        setErrors({});
    }, [show, item, isEdit]);

    // ---- Save ----
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

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
        >
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {isEdit ? 'ویرایش رشته‌ی مرکز' : 'افزودن رشته به مرکز'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <div className="modal-body">
                        {/* مرکز */}
                        <div className="mb-3">
                            <label className="form-label">
                                مرکز <span className="text-danger">*</span>
                            </label>
                            <select
                                className={`form-select ${errors.markazId ? 'is-invalid' : ''}`}
                                value={formData.markazId}
                                onChange={(e) => {
                                    setFormData({ ...formData, markazId: e.target.value });
                                    setErrors({ ...errors, markazId: null });
                                }}
                                disabled={isEdit}
                            >
                                <option value="">انتخاب مرکز...</option>
                                {markazOptions.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.naamMarkaz} ({m.codeMarkaz})
                                    </option>
                                ))}
                            </select>
                            {errors.markazId && <div className="invalid-feedback">{errors.markazId}</div>}
                            {isEdit && <small className="text-muted">مرکز قابل تغییر نیست</small>}
                        </div>

                        {/* رشته */}
                        <div className="mb-3">
                            <label className="form-label">
                                رشته <span className="text-danger">*</span>
                            </label>
                            <select
                                className={`form-select ${errors.reshtehId ? 'is-invalid' : ''}`}
                                value={formData.reshtehId}
                                onChange={(e) => {
                                    setFormData({ ...formData, reshtehId: e.target.value });
                                    setErrors({ ...errors, reshtehId: null });
                                }}
                                disabled={isEdit}
                            >
                                <option value="">انتخاب رشته...</option>
                                {reshtehOptions.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.onvanReshte} ({r.codeReshte})
                                    </option>
                                ))}
                            </select>
                            {errors.reshtehId && <div className="invalid-feedback">{errors.reshtehId}</div>}
                            {isEdit && <small className="text-muted">رشته قابل تغییر نیست</small>}
                        </div>

                        {/* تعداد دانشجو */}
                        <div className="mb-3">
                            <label className="form-label">تعداد دانشجو</label>
                            <input
                                type="number"
                                className="form-control"
                                min="0"
                                value={formData.tedadDaneshjoo}
                                onChange={(e) => setFormData({ ...formData, tedadDaneshjoo: e.target.value })}
                                placeholder="مثلاً 150"
                            />
                        </div>

                        {/* وضعیت */}
                        <div className="form-check form-switch">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="vazeeatSwitch"
                                checked={formData.vazeeat}
                                onChange={(e) => setFormData({ ...formData, vazeeat: e.target.checked })}
                            />
                            <label className="form-check-label" htmlFor="vazeeatSwitch">
                                فعال
                            </label>
                        </div>
                    </div>

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
    );
}