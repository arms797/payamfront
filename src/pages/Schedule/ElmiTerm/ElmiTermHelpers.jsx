// src/pages/Schedule/ElmiTerm/ElmiTermHelpers.js

// ============================================================
// گزینه‌های وضعیت تایید
// ============================================================
export const approveStatusOptions = [
    { value: '', label: 'همه' },
    { value: '0', label: 'در انتظار بررسی' },
    { value: '1', label: 'تایید شده' },
    { value: '2', label: 'رد شده' }
];

// ============================================================
// گزینه‌های وضعیت
// ============================================================
export const vazeeatOptions = [
    { value: '', label: 'همه' },
    { value: 'مشغول به کار', label: 'مشغول به کار' },
    { value: 'فرصت مطالعاتی', label: 'فرصت مطالعاتی' },
    { value: 'مامور به تحصیل', label: 'مامور به تحصیل' },
    { value: 'مرخصی بدون حقوق', label: 'مرخصی بدون حقوق' },
    { value: 'ماموریت', label: 'ماموریت' },
    { value: 'سایر', label: 'سایر' },
    //{ value: 'غیبت', label: 'غیبت' },
    //{ value: 'ترک کار', label: 'ترک کار' },
    //{ value: 'فسخ قرارداد', label: 'فسخ قرارداد' },
    //{ value: 'اخراج', label: 'اخراج' },
    //{ value: 'استعفا', label: 'استعفا' },
    //{ value: 'بازنشسته', label: 'بازنشسته' },
    //{ value: 'پایان کار', label: 'پایان کار' },
    //{ value: 'فوت شده', label: 'فوت شده' },
    //{ value: 'منتقل شده', label: 'منتقل شده' },   
];

// ============================================================
// دریافت وضعیت نمایشی
// ============================================================
export const getStatusBadge = (status) => {
    switch (status) {
        case 0:
            return <span className="badge bg-warning text-dark">در انتظار بررسی</span>;
        case 1:
            return <span className="badge bg-success">تایید شده ✅</span>;
        case 2:
            return <span className="badge bg-danger">رد شده ❌</span>;
        default:
            return <span className="badge bg-secondary">نامشخص</span>;
    }
};

// ============================================================
// فرمت تاریخ فارسی
// ============================================================
export const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fa-IR');
};