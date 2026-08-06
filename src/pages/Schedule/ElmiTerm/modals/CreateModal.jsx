// src/pages/Schedule/ElmiTerm/modals/CreateModal.jsx
import React from 'react';
import OstadSelector from '../../../../components/common/OstadSelector';
import { vazeeatOptions } from '../ElmiTermHelpers';

export default function CreateModal({
    show,
    onClose,
    onSubmit,
    formData,
    setFormData,
    termList,
    pastTerms,
    isOstad,
    canCreate,
    submitting
}) {
    if (!show) return null;

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <form onSubmit={onSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">ثبت درخواست جدید وضعیت ترمی</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">
                            {/* استاد */}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <OstadSelector
                                        label="استاد *"
                                        value={formData.userId}
                                        onChange={(userId) => setFormData({ ...formData, userId: userId || '' })}
                                        required={true}
                                        disabled={isOstad}
                                        onlyElmi={true}
                                        placeholder="جستجوی استاد..."
                                    />
                                    {isOstad && (
                                        <small className="text-muted">
                                            <i className="bi bi-info-circle me-1"></i>
                                            شما فقط می‌توانید درخواست خود را ثبت کنید
                                        </small>
                                    )}
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">کد ترم <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        value={formData.termCode}
                                        onChange={(e) => setFormData({ ...formData, termCode: e.target.value })}
                                        required
                                    >
                                        <option value="">انتخاب ترم...</option>
                                        {termList.map(term => (
                                            <option key={term.codeTerm} value={term.codeTerm}>
                                                {term.onvanTerm} ({term.codeTerm})
                                                {term.vazeeyat && ' ✅ (جاری)'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* کپی از ترم قبل */}
                            <div className="row">
                                <div className="col-md-12 mb-3">
                                    <label className="form-label">کپی از ترم قبل (اختیاری)</label>
                                    <select
                                        className="form-select"
                                        value={formData.copyFromId}
                                        onChange={(e) => setFormData({ ...formData, copyFromId: e.target.value })}
                                    >
                                        <option value="">بدون کپی</option>
                                        {pastTerms.map(term => (
                                            <option key={term.codeTerm} value={term.codeTerm}>
                                                {term.onvanTerm} ({term.codeTerm})
                                            </option>
                                        ))}
                                    </select>
                                    <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        با انتخاب یک ترم، تمام اطلاعات از آن ترم کپی می‌شود
                                    </small>
                                </div>
                            </div>

                            <hr />

                            {/* وضعیت + سمت اجرایی */}
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
                                            id="isEjeari"
                                            checked={formData.isEjeari}
                                            onChange={(e) => setFormData({ ...formData, isEjeari: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="isEjeari">
                                            دارای سمت اجرایی
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* عنوان پست اجرایی + تمام وقت */}
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
                                            id="fullTime"
                                            checked={formData.fullTime}
                                            onChange={(e) => setFormData({ ...formData, fullTime: e.target.checked })}
                                        />
                                        <label className="form-check-label" htmlFor="fullTime">
                                            تمام وقت
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* ساعت موظف + فایل */}
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">تعداد ساعت موظف هفتگی</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="مثال: 12"
                                        value={formData.tedadSaatMovazafi}
                                        onChange={(e) => setFormData({ ...formData, tedadSaatMovazafi: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">فایل مستندات</label>
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
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                انصراف
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={submitting || !canCreate}>
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        در حال ثبت...
                                    </>
                                ) : (
                                    'ثبت درخواست'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}