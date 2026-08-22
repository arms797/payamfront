// src/pages/Schedule/Hamjavar/modals/ReviewModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import PersianNumber from '../../../../components/common/PersianNumber';
import { useMarkaz } from '../../../../context/MarkazContext';

export default function ReviewModal({
    show,
    onClose,
    item,
    onSubmit,
    submitting,
    role // 'raeis' | 'khadamat' | 'moaven'
}) {
    const { markazList } = useMarkaz();

    // ============================================================
    // همه Stateها و Hooks باید در ابتدا تعریف شوند
    // ============================================================
    const [formData, setFormData] = useState({
        tedadRoozList: [],
        tozihat: '',
        upload: null
    });

    // ============================================================
    // محاسبه خودکار نظر بر اساس مقادیر ورودی
    // ============================================================
    const autoNazar = useMemo(() => {
        if (!formData.tedadRoozList || formData.tedadRoozList.length === 0) {
            return null;
        }

        const allEqual = formData.tedadRoozList.every(
            (item) => parseInt(item.value) === parseInt(item.defaultValue)
        );

        const allZero = formData.tedadRoozList.every(
            (item) => parseInt(item.value) === 0
        );

        if (allEqual) return 2; // تایید ✅
        if (allZero) return 3;  // رد ❌
        return 4;               // اصلاح ✏️
    }, [formData.tedadRoozList]);

    // ============================================================
    // دریافت عنوان نقش
    // ============================================================
    const roleTitle = {
        raeis: 'رئیس مرکز',
        khadamat: 'خدمات آموزشی استان',
        moaven: 'معاونت آموزشی استان'
    }[role] || '';

    // ============================================================
    // دریافت متن نظر
    // ============================================================
    const getNazarText = (nazar) => {
        const map = {
            2: '✅ تایید',
            3: '❌ رد',
            4: '✏️ اصلاح'
        };
        return map[nazar] || 'نامشخص';
    };

    const getNazarClass = (nazar) => {
        const map = {
            2: 'text-success',
            3: 'text-danger',
            4: 'text-warning'
        };
        return map[nazar] || '';
    };

    // ============================================================
    // دریافت فیلد مربوط به هر نقش
    // ============================================================
    const getTedadField = (role) => {
        const map = {
            raeis: 'tedadRoozRaeis',
            khadamat: 'tedadRoozKhadamat',
            moaven: 'tedadRoozMoaven'
        };
        return map[role] || '';
    };

    // ============================================================
    // دریافت مقدار پیش‌فرض برای هر Hamjavar1
    // ============================================================
    const getDefaultValue = (detail) => {
        const field = getTedadField(role);
        return detail[field] !== null && detail[field] !== undefined
            ? detail[field]
            : detail.tedadRoozElmi || 0;
    };

    // ============================================================
    // دریافت نام مرکز از markazList
    // ============================================================
    const getMarkazName = (markazId) => {
        if (!markazId) return '-';
        const markaz = markazList?.find(m => m.id === markazId);
        if (!markaz) return '-';

        // بر اساس Level نام مناسب را نمایش بده
        if (markaz.level === 2) {
            return 'سازمان مرکزی';
        } else if (markaz.level === 3) {
            return `ستاد استان ${markaz.naamOstan || ''}`;
        }
        return markaz.naamMarkaz || '-';
    };

    // ============================================================
    // مقداردهی اولیه
    // ============================================================
    useEffect(() => {
        if (show && item?.hamjavar1s) {
            const initialList = item.hamjavar1s.map(detail => ({
                id: detail.id,
                value: getDefaultValue(detail),
                defaultValue: detail.tedadRoozElmi || 0
            }));
            setFormData(prev => ({
                ...prev,
                tedadRoozList: initialList,
                tozihat: '',
                upload: null
            }));
        }
    }, [show, item, role]);

    // ============================================================
    // تغییر مقدار
    // ============================================================
    const handleTedadChange = (index, value) => {
        const newList = [...formData.tedadRoozList];
        newList[index] = { ...newList[index], value: value === '' ? '' : parseInt(value) };
        setFormData(prev => ({ ...prev, tedadRoozList: newList }));
    };

    // ============================================================
    // ثبت نظر
    // ============================================================
    const handleSubmit = (e) => {
        e.preventDefault();

        const tedadRoozList = formData.tedadRoozList.map(item => ({
            id: item.id,
            tedadRooz: item.value !== '' && item.value !== null && item.value !== undefined
                ? parseInt(item.value)
                : null
        }));

        onSubmit({
            tedadRoozList: tedadRoozList,
            nazar: autoNazar,
            tozihat: formData.tozihat,
            upload: formData.upload
        });
    };

    // ============================================================
    // شرط نمایش در انتهای کامپوننت (بعد از همه Hooks)
    // ============================================================
    if (!show || !item) return null;

    return (
        <div
            className="modal show d-block"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 1050
            }}
            onClick={onClose}
        >
            <div
                className="modal-dialog modal-dialog-centered modal-lg"
                style={{
                    margin: '0 auto',
                    width: '100%',
                    maxWidth: '800px',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-content" style={{ maxHeight: '90vh', overflow: 'auto' }}>
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
                                        <strong>استاد:</strong> {item.ostadName} {item.ostadLastName}
                                    </div>
                                    <div className="col-md-6">
                                        <strong>ترم:</strong> <PersianNumber>{item.termCode}</PersianNumber>
                                    </div>
                                </div>
                            </div>

                            {/* تعداد روز پیشنهادی */}
                            <h6 className="text-primary">تعداد روز پیشنهادی</h6>
                            <hr />

                            {item.hamjavar1s?.map((detail, index) => {
                                const markazName = getMarkazName(detail.markazId);
                                const faaliatNames = detail.faaliatNames?.join('، ') || '-';
                                const currentValue = formData.tedadRoozList[index]?.value ?? '';
                                const defaultValue = formData.tedadRoozList[index]?.defaultValue ?? 0;

                                return (
                                    <div key={detail.id} className="mb-3 p-2 border rounded bg-light">
                                        <div className="row align-items-center">
                                            <div className="col-md-8">
                                                <strong>مرکز:</strong> {markazName}
                                                <br />
                                                <small className="text-muted">
                                                    فعالیت‌های علمی: {faaliatNames}
                                                </small>
                                                <br />
                                                <small className="text-muted">
                                                    تعداد روز درخواستی استاد: <PersianNumber className="fw-bold">{defaultValue}</PersianNumber>
                                                </small>

                                                {/* ============================================================
                                                    نمایش نظرات قبلی به صورت یک خط
                                                    ============================================================ */}
                                                <div className="mt-1 d-flex flex-wrap gap-2">
                                                    <small className="text-muted">
                                                        <span className="fw-bold">نظر مسئولین</span>
                                                    </small>
                                                    <small className="text-muted">
                                                        <span className="fw-bold">رئیس: </span>
                                                        <PersianNumber className="fw-bold text-secondary">
                                                            {detail.tedadRoozRaeis !== null && detail.tedadRoozRaeis !== undefined
                                                                ? detail.tedadRoozRaeis
                                                                : '-'}
                                                        </PersianNumber>
                                                    </small>
                                                    <small className="text-muted">
                                                        <span className="fw-bold">خدمات آموزشی استان: </span>
                                                        <PersianNumber className="fw-bold text-secondary">
                                                            {detail.tedadRoozKhadamat !== null && detail.tedadRoozKhadamat !== undefined
                                                                ? detail.tedadRoozKhadamat
                                                                : '-'}
                                                        </PersianNumber>
                                                    </small>
                                                    <small className="text-muted">
                                                        <span className="fw-bold">معاونت آموزشی استان: </span>
                                                        <PersianNumber className="fw-bold text-secondary">
                                                            {detail.tedadRoozMoaven !== null && detail.tedadRoozMoaven !== undefined
                                                                ? detail.tedadRoozMoaven
                                                                : '-'}
                                                        </PersianNumber>
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="col-md-4">
                                                <small className="form-label">
                                                    تعداد روز مد نظر {roleTitle}
                                                </small>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={currentValue}
                                                    onChange={(e) => handleTedadChange(index, e.target.value)}
                                                    min="0"
                                                    max="6"
                                                    placeholder="۰ تا ۶"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* نمایش نظر خودکار */}
                            <div className="mb-3 p-2 border rounded bg-light d-flex align-items-center gap-3 flex-wrap">
                                {autoNazar ? (
                                    <span className={`fw-bold fs-6 ${getNazarClass(autoNazar)}`}>
                                        {getNazarText(autoNazar)}
                                    </span>
                                ) : (
                                    <span className="text-muted">در حال محاسبه...</span>
                                )}
                                <small className="text-muted">
                                    <i className="bi bi-info-circle me-1"></i>
                                    {autoNazar === 2 && 'تمامی روزهای پیشنهادی با روزهای علمی برابر است → تایید'}
                                    {autoNazar === 3 && 'تمامی روزهای پیشنهادی صفر است → رد'}
                                    {autoNazar === 4 && 'برخی روزهای پیشنهادی با روزهای علمی برابر نیست و همه صفر نیستند → اصلاح'}
                                </small>
                            </div>
                            {/* توضیحات تکمیلی */}
                            <div className="mb-3">
                                <label className="form-label">توضیحات تکمیلی (اختیاری)</label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    value={formData.tozihat}
                                    onChange={(e) => setFormData(prev => ({ ...prev, tozihat: e.target.value }))}
                                    placeholder="توضیحات خود را وارد کنید..."
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
                                disabled={submitting || !autoNazar}
                            >
                                {submitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        در حال ثبت...
                                    </>
                                ) : (
                                    `ثبت نظر (${autoNazar ? getNazarText(autoNazar) : 'نامشخص'})`
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}