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
    // Stateها
    // ============================================================
    const [formData, setFormData] = useState({
        tedadRoozList: [],
        selectedFaaliatIds: [], // ← لیست فعالیت‌های انتخاب‌شده برای هر مرکز
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

        // اگر همه روزها صفر باشد و همه فعالیت‌ها غیرفعال باشد → رد
        const allFaaliatOff = formData.selectedFaaliatIds.every(
            (item) => item.selectedIds.length === 0
        );

        if (allEqual && !allFaaliatOff) return 2; // تایید ✅
        if (allZero || allFaaliatOff) return 3;   // رد ❌
        return 4;                                  // اصلاح ✏️
    }, [formData.tedadRoozList, formData.selectedFaaliatIds]);

    // ============================================================
    // دریافت عنوان نقش
    // ============================================================
    const roleTitle = {
        raeis: 'رئیس مرکز',
        khadamat: 'خدمات آموزشی استان',
        moaven: 'معاون آموزشی استان'
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
            // لیست تعداد روز
            const initialList = item.hamjavar1s.map(detail => ({
                id: detail.id,
                value: getDefaultValue(detail),
                defaultValue: detail.tedadRoozElmi || 0
            }));

            // لیست فعالیت‌های انتخاب‌شده برای هر مرکز (همه فعالیت‌ها به‌صورت پیش‌فرض انتخاب‌شده)
            const initialFaaliatList = item.hamjavar1s.map(detail => ({
                markazId: detail.markazId,
                markazName: getMarkazName(detail.markazId),
                faaliatIds: detail.faaliatIds || [],
                selectedIds: detail.faaliatIds || [] // ← همه فعالیت‌ها انتخاب‌شده
            }));

            setFormData(prev => ({
                ...prev,
                tedadRoozList: initialList,
                selectedFaaliatIds: initialFaaliatList,
                tozihat: '',
                upload: null
            }));
        }
    }, [show, item, role]);

    // ============================================================
    // تغییر تعداد روز
    // ============================================================
    const handleTedadChange = (index, value) => {
        const newList = [...formData.tedadRoozList];
        newList[index] = { ...newList[index], value: value === '' ? '' : parseInt(value) };
        setFormData(prev => ({ ...prev, tedadRoozList: newList }));
    };

    // ============================================================
    // تغییر انتخاب فعالیت (فقط برای معاون)
    // ============================================================
    const handleFaaliatToggle = (markazIndex, faaliatId) => {
        if (role !== 'moaven') return; // فقط معاون می‌تواند فعالیت‌ها را تغییر دهد

        const newList = [...formData.selectedFaaliatIds];
        const current = newList[markazIndex];
        const selectedIds = current.selectedIds || [];

        if (selectedIds.includes(faaliatId)) {
            // اگر قبلاً انتخاب شده بود، حذف کن
            current.selectedIds = selectedIds.filter(id => id !== faaliatId);
        } else {
            // اگر انتخاب نشده بود، اضافه کن
            current.selectedIds = [...selectedIds, faaliatId];
        }

        setFormData(prev => ({ ...prev, selectedFaaliatIds: newList }));
    };

    // ============================================================
    // ثبت نظر
    // ============================================================
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

        // ============================================================
        // 🔥 ساخت رشته فعالیت‌ها برای هر مرکز (فقط برای معاون)
        // ============================================================
        let faaliatIdsString = '';
        if (role === 'moaven') {
            const faaliatParts = formData.selectedFaaliatIds.map(item => {
                // فقط فعالیت‌های انتخاب‌شده را به رشته تبدیل کن
                if (item.selectedIds && item.selectedIds.length > 0) {
                    return item.selectedIds.join('|');
                }
                return '';
            });
            faaliatIdsString = faaliatParts.filter(p => p !== '').join('|');
        }

        console.log('📤 ارسال به سرور:', {
            tedadRoozList,
            faaliatIdsString,
            nazar: autoNazar,
            tozihat: formData.tozihat
        });

        // ============================================================
        // 🔥 ساخت FormData (با رشته فعالیت‌ها)
        // ============================================================
        const formDataToSend = new FormData();
        formDataToSend.append('hamjavarId', item.id);
        formDataToSend.append('nazar', autoNazar);
        formDataToSend.append('tozihat', formData.tozihat || '');
        formDataToSend.append('tedadRoozList', JSON.stringify(tedadRoozList));

        // فقط اگر معاون است و رشته خالی نیست، ارسال کن
        if (role === 'moaven' && faaliatIdsString) {
            formDataToSend.append('faaliatIdsString', faaliatIdsString);
        }

        if (formData.upload) {
            formDataToSend.append('uploadFile', formData.upload);
        }

        // ارسال به سرور
        onSubmit(formDataToSend);
    };

    // ============================================================
    // شرط نمایش
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
                    maxWidth: '900px',
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
                                {role === 'moaven' && (
                                    <span className="badge bg-info ms-2">قابل ویرایش - تعداد روز و فعالیت‌ها</span>
                                )}
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

                            {/* ============================================================
                                لیست مراکز و فعالیت‌ها
                                ============================================================ */}
                            <h6 className="text-primary">
                                مراکز و فعالیت‌های درخواستی
                                {role === 'moaven' && (
                                    <small className="text-muted fw-normal ms-2">
                                        (برای غیرفعال کردن هر فعالیت، روی آن کلیک کنید)
                                    </small>
                                )}
                            </h6>
                            <hr />

                            {item.hamjavar1s?.map((detail, index) => {
                                const markazName = getMarkazName(detail.markazId);
                                const faaliatNames = detail.faaliatNames || [];
                                const currentValue = formData.tedadRoozList[index]?.value ?? '';
                                const defaultValue = formData.tedadRoozList[index]?.defaultValue ?? 0;
                                const selectedIds = formData.selectedFaaliatIds[index]?.selectedIds || [];
                                const isMoaven = role === 'moaven';

                                return (
                                    <div key={detail.id} className="mb-3 p-3 border rounded bg-light">
                                        <div className="row">
                                            {/* ستون اطلاعات مرکز */}
                                            <div className="col-md-6">
                                                <strong className="fs-6">{markazName}</strong>
                                                <br />
                                                <small className="text-muted">
                                                    تعداد روز درخواستی استاد:{' '}
                                                    <PersianNumber className="fw-bold">{defaultValue}</PersianNumber>
                                                </small>

                                                {/* ============================================================
                                                    فعالیت‌ها (قابل کلیک برای معاون)
                                                    ============================================================ */}
                                                <div className="mt-2">
                                                    <small className="text-muted d-block mb-1">فعالیت‌ها:</small>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {faaliatNames.length > 0 ? (
                                                            faaliatNames.map((name, idx) => {
                                                                const faaliatId = detail.faaliatIds?.[idx];
                                                                const isSelected = selectedIds.includes(faaliatId);
                                                                const isDisabled = !isMoaven; // فقط معاون می‌تواند تغییر دهد

                                                                return (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        className={`badge ${isSelected ? 'bg-primary' : 'bg-secondary'} p-2`}
                                                                        style={{
                                                                            cursor: isMoaven ? 'pointer' : 'default',
                                                                            opacity: isSelected ? 1 : 0.5,
                                                                            fontSize: '12px',
                                                                            border: isSelected ? '2px solid #0d6efd' : '2px solid transparent',
                                                                            transition: 'all 0.2s'
                                                                        }}
                                                                        onClick={() => {
                                                                            if (isMoaven && faaliatId) {
                                                                                handleFaaliatToggle(index, faaliatId);
                                                                            }
                                                                        }}
                                                                        title={isMoaven ? 'کلیک برای تغییر وضعیت' : ''}
                                                                    >
                                                                        {isSelected ? '✅' : '⬜'} {name}
                                                                    </button>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-muted">-</span>
                                                        )}
                                                    </div>
                                                    {isMoaven && faaliatNames.length > 0 && (
                                                        <small className="text-muted d-block mt-1">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            برای غیرفعال کردن هر فعالیت، روی آن کلیک کنید
                                                        </small>
                                                    )}
                                                </div>

                                                {/* ============================================================
                                                    نظرات قبلی
                                                    ============================================================ */}
                                                <div className="mt-2 d-flex flex-wrap gap-2">
                                                    <small className="text-muted">
                                                        <span className="fw-bold">نظرات قبلی:</span>
                                                    </small>
                                                    <small className="text-muted">
                                                        رئیس: <PersianNumber className="fw-bold">
                                                            {detail.tedadRoozRaeis !== null && detail.tedadRoozRaeis !== undefined
                                                                ? detail.tedadRoozRaeis
                                                                : '-'}
                                                        </PersianNumber>
                                                    </small>
                                                    <small className="text-muted">
                                                        خدمات: <PersianNumber className="fw-bold">
                                                            {detail.tedadRoozKhadamat !== null && detail.tedadRoozKhadamat !== undefined
                                                                ? detail.tedadRoozKhadamat
                                                                : '-'}
                                                        </PersianNumber>
                                                    </small>
                                                    <small className="text-muted">
                                                        معاون: <PersianNumber className="fw-bold">
                                                            {detail.tedadRoozMoaven !== null && detail.tedadRoozMoaven !== undefined
                                                                ? detail.tedadRoozMoaven
                                                                : '-'}
                                                        </PersianNumber>
                                                    </small>
                                                </div>
                                            </div>

                                            {/* ستون تعداد روز */}
                                            <div className="col-md-6">
                                                <div className="d-flex flex-column">
                                                    <label className="form-label small">
                                                        تعداد روز مد نظر {roleTitle}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={currentValue}
                                                        onChange={(e) => handleTedadChange(index, e.target.value)}
                                                        min="0"
                                                        max="6"
                                                        placeholder="۰ تا ۶"
                                                    />
                                                    {role === 'moaven' && (
                                                        <small className="text-muted mt-1">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            با تغییر تعداد روز، نظر خودکار به‌روز می‌شود
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* ============================================================
                                نمایش نظر خودکار
                                ============================================================ */}
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
                                    {autoNazar === 2 && 'تمامی روزها با پیشنهاد استاد برابر است و همه فعالیت‌ها فعال → تایید'}
                                    {autoNazar === 3 && 'تمامی روزها صفر است یا همه فعالیت‌ها غیرفعال → رد'}
                                    {autoNazar === 4 && 'برخی تغییرات اعمال شده است → اصلاح'}
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