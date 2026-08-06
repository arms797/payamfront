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
    { value: 'فرصت مطالعاتی', label: 'فرصت مطالعاتی' },
    { value: 'فرصت آموزشی', label: 'فرصت آموزشی' },
    { value: 'مرخصی بدون حقوق', label: 'مرخصی بدون حقوق' },
    { value: 'مرخصی زایمان', label: 'مرخصی زایمان' },
    { value: 'سایر', label: 'سایر' }
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
// دانلود فایل
// ============================================================
export const downloadFile = async (id, fileName, api) => {
    if (!id) return;

    try {
        const response = await api.get(`/ElmiTerm/download/${id}`, {
            responseType: 'blob'
        });

        const contentType = response.headers['content-type'];
        if (contentType && contentType.includes('application/json')) {
            const text = await response.data.text();
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || 'خطا در دانلود فایل');
        }

        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'فایل';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('❌ خطا در دانلود فایل:', error);
    }
};

// ============================================================
// فرمت تاریخ فارسی
// ============================================================
export const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fa-IR');
};

// ============================================================
// دریافت عنوان ترم
// ============================================================
export const getTermTitle = (codeTerm, termList) => {
    const term = termList?.find(t => t.codeTerm === codeTerm);
    return term?.onvanTerm || codeTerm || '-';
};