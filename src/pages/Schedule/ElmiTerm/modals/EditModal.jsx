// src/pages/Schedule/ElmiTerm/modals/EditModal.jsx
import React from 'react';
import { vazeeatOptions } from '../ElmiTermHelpers';

export default function EditModal({
    show,
    onClose,
    onSubmit,
    formData,
    setFormData,
    selectedItem,
    submitting
}) {
    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">
                                ویرایش درخواست - {selectedItem?.ostadName}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">وضعیت</label>
                                    <select
                                        className="form-select"
                                        value={formData.akharinVazeeat}
                                        onChange={(e) => setFormData({ ...formData, akharinVazeeat: e.target.value })}
                                    >
                                        <option value="">انتخاب...</option>
                                        {vazeeatOptions.filter(o => o.value).map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <div className="form-check mt-4">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="editIsEjeari"
                                            checked={formData.isEjeari}
                                            onChange={(e) => setFormData({ ...formData, isEjeari: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="editIsEjeari">
                                            دارای سمت اجرایی
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">عنوان پست اجرایی</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="مثال: مدیر گروه"
                                        value={formData.onvanEjraei}
                                        onChange={(e) => setFormData({ ...formData, onvanEjraei: e.target.value })}
                                        disabled={!formData.isEjeari}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <div className="form-check mt-4">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="editFullTime"
                                            checked={formData.fullTime}
                                            onChange={(e) => setFormData({ ...formData, fullTime: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="editFullTime">
                                            تمام وقت
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">تعداد ساعت موظف هفتگی</label>
                                    <input
                                        type="number"
                                        step="1"
                                        min={0}
                                        max={60}
                                        className="form-control"
                                        placeholder="مثال: 40"
                                        value={formData.tedadSaatMovazafi}
                                        onChange={(e) => setFormData({ ...formData, tedadSaatMovazafi: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">تعداد واحد موظفی</label>
                                    <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        max={24}
                                        className="form-control"
                                        placeholder="مثال: 12"
                                        value={formData.tedadVahedMovazafi}
                                        onChange={(e) => setFormData({ ...formData, tedadVahedMovazafi: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">فایل مستندات (اختیاری)</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                    />
                                    <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۲ مگابایت
                                    </small>
                                    {selectedItem?.filePath && (
                                        <div className="mt-1">
                                            <span className="badge bg-info">
                                                <i className="bi bi-paperclip me-1"></i>
                                                فایل قبلی وجود دارد
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                انصراف
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    'ذخیره تغییرات'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}