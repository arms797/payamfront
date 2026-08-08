// src/pages/Schedule/Hamjavar/modals/ReviewModal.jsx
import React, { useState } from 'react';
import PersianNumber from '../../../../components/common/PersianNumber';

export default function ReviewModal({
    show,
    onClose,
    item,
    onSubmit,
    submitting,
    role // 'raeis' | 'khadamat' | 'moaven'
}) {
    const [formData, setFormData] = useState({
        tedadRoozList: [],
        nazar: '',
        upload: null
    });

    if (!show || !item) return null;

    // دریافت عنوان نقش
    const roleTitle = {
        raeis: 'رئیس مرکز',
        khadamat: 'خدمات آموزشی استان',
        moaven: 'معاونت آموزشی استان'
    }[role] || '';

    // دریافت فیلد مربوط به هر نقش
    const getTedadField = (role) => {
        const map = {
            raeis: 'tedadRoozRaeis',
            khadamat: 'tedadRoozKhadamat',
            moaven: 'tedadRoozMoaven'
        };
        return map[role] || '';
    };

    // دریافت مقدار پیش‌فرض برای هر Hamjavar1
    const getDefaultValue = (detail) => {
        const field = getTedadField(role);
        return detail[field] || '';
    };

    // مقداردهی اولیه
    React.useEffect(() => {
        if (show && item?.hamjavar1s) {
            const initialList = item.hamjavar1s.map(detail => ({
                id: detail.id,
                value: getDefaultValue(detail) || ''
            }));
            setFormData(prev => ({
                ...prev,
                tedadRoozList: initialList
            }));
        }
    }, [show, item]);

    // تغییر مقدار
    const handleTedadChange = (index, value) => {
        const newList = [...formData.tedadRoozList];
        newList[index] = { ...newList[index], value };
        setFormData(prev => ({ ...prev, tedadRoozList: newList }));
    };

    // ثبت نظر
    const handleSubmit = (e) => {
        e.preventDefault();
        const tedadRoozList = formData.tedadRoozList.map(item =>
            item.value ? parseInt(item.value) : null
        );
        onSubmit({
            tedadRoozList,
            nazar: formData.nazar,
            upload: formData.upload
        });
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title">
                                ثبت نظر - {roleTitle}
                            </h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">
                            {/* اطلاعات خلاصه */}
                            <div className="alert alert-info">
                                <div className="row">
                                    <div className="col-md-6">
                                        <strong>استاد:</strong> {item.ostadName}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>ترم:</strong> {item.termCode}
                                    </div>
                                </div>
                            </div>

                            {/* تعداد روز پیشنهادی */}
                            <h6 className="text-primary">تعداد روز پیشنهادی</h6>
                            <hr />

                            {item.hamjavar1s?.map((detail, index) => {
                                const markazName = detail.markazName || '-';
                                const faaliatNames = detail.faaliatNames?.join('، ') || '-';
                                return (
                                    <div key={detail.id} className="mb-3 p-2 border rounded bg-light">
                                        <div className="row align-items-center">
                                            <div className="col-md-5">
                                                <strong>مرکز:</strong> {markazName}
                                                <br />
                                                <small className="text-muted">
                                                    فعالیت‌ها: {faaliatNames}
                                                </small>
                                                <br />
                                                <small className="text-muted">
                                                    تعداد روز علمی: <PersianNumber>{detail.tedadRoozElmi || 0}</PersianNumber>
                                                </small>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="form-label">
                                                    تعداد روز پیشنهادی
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={formData.tedadRoozList[index]?.value || ''}
                                                    onChange={(e) => handleTedadChange(index, e.target.value)}
                                                    min="0"
                                                    max="6"
                                                    placeholder="۰ تا ۶"
                                                />
                                            </div>
                                            <div className="col-md-3">
                                                <small className="text-muted">
                                                    {formData.tedadRoozList[index]?.value !== '' &&
                                                        `پیشنهادی: ${formData.tedadRoozList[index]?.value} روز`
                                                    }
                                                </small>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* نظر */}
                            <div className="mb-3">
                                <label className="form-label">نظر</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={formData.nazar}
                                    onChange={(e) => setFormData(prev => ({ ...prev, nazar: e.target.value }))}
                                    placeholder="نظر خود را وارد کنید..."
                                />
                            </div>

                            {/* بارگذاری مستندات */}
                            <div className="mb-3">
                                <label className="form-label">بارگذاری مستندات (اختیاری)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => setFormData(prev => ({ ...prev, upload: e.target.files[0] }))}
                                />
                                <small className="text-muted">
                                    فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۲ مگابایت
                                </small>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={onClose}
                            >
                                انصراف
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        در حال ثبت...
                                    </>
                                ) : (
                                    'ثبت نظر'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}