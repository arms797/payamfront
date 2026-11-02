import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import * as XLSX from 'xlsx';

export default function MarkazReshtehBulkUploadModal({ show, onClose, onSuccess }) {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    // ============================================================
    // انتخاب فایل
    // ============================================================
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) validateAndSet(file);
    };

    const validateAndSet = (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls') {
            toast.error('فقط فایل‌های Excel (.xlsx یا .xls) مجاز هستند');
            return;
        }
        if (file.size > 50 * 1024 * 1024) {
            toast.error('حجم فایل نباید بیشتر از ۵۰ مگابایت باشد');
            return;
        }
        setSelectedFile(file);
        setResult(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) validateAndSet(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    // ============================================================
    // ریست
    // ============================================================
    const handleReset = () => {
        setSelectedFile(null);
        setResult(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ============================================================
    // آپلود
    // ============================================================
    const handleUpload = async () => {
        if (!selectedFile) {
            toast.warning('ابتدا فایل را انتخاب کنید');
            return;
        }

        setUploading(true);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await api.post('/MarkazReshteh/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                console.log('🔍 Full response:', response.data);
                console.log('🔍 deactivatedRows:', response.data.deactivatedRows);
                console.log('🔍 data.deactivated:', response.data.data?.deactivated);
                setResult(response.data);
                toast.success(response.data.message || 'پردازش انجام شد');

                // بعد از ۲ ثانیه → onSuccess (رفرش لیست + بستن)
                setTimeout(() => {
                    onSuccess?.();
                }, 1500);
            } else {
                toast.error(response.data?.message || 'خطا در پردازش فایل');
            }
        } catch (error) {
            const errMsg = error.response?.data?.error || error.response?.data?.message || 'خطا در آپلود فایل';
            toast.error(errMsg);
        } finally {
            setUploading(false);
        }
    };

    // ============================================================
    // دانلود فایل خطا
    // ============================================================
    const handleDownloadResultFile = () => {
        const rejectedRows = result?.rejectedRows || [];
        const deactivatedRows = result?.deactivatedRows || [];

        if (rejectedRows.length === 0 && deactivatedRows.length === 0) {
            toast.info('هیچ خطا یا غیرفعال‌شده‌ای وجود ندارد');
            return;
        }

        // ============================================================
        // ساخت ردیف‌های یکپارچه
        // ============================================================
        const dataRows = [];

        // ۱. خطاها
        rejectedRows.forEach((r) => {
            dataRows.push([
                'خطا',
                r.rowNumber || '',
                r.codeMarkaz || '',
                '',
                r.codeReshte || '',
                '',
                r.codeMaghta || '',
                r.termVorood || '',
                r.termEamal || '',
                '',
                r.reason || ''
            ]);
        });

        // ۲. غیرفعال‌شده‌ها
        deactivatedRows.forEach((r) => {
            dataRows.push([
                'غیرفعال‌شده',
                '',
                r.codeMarkaz || '',
                r.naamMarkaz || '',
                r.codeReshte || '',
                r.onvanReshte || '',
                r.codeMaghta || '',
                r.termVorood || '',
                r.termEamal || '',
                r.tedadDaneshjoo || 0,
                'در فایل اکسل نبود'
            ]);
        });

        // ============================================================
        // هدر + داده
        // ============================================================
        const header = [
            'نوع',
            'ردیف اکسل',
            'کد مرکز',
            'نام مرکز',
            'کد رشته',
            'عنوان رشته',
            'کد مقطع',
            'ترم ورود',
            'ترم اعمال',
            'تعداد دانشجو',
            'دلیل / توضیح'
        ];

        const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows]);

        // عرض ستون‌ها
        ws['!cols'] = [
            { wch: 14 },  // نوع
            { wch: 10 },  // ردیف
            { wch: 10 },  // کد مرکز
            { wch: 25 },  // نام مرکز
            { wch: 15 },  // کد رشته
            { wch: 30 },  // عنوان رشته
            { wch: 10 },  // کد مقطع
            { wch: 12 },  // ترم ورود
            { wch: 12 },  // ترم اعمال
            { wch: 12 },  // تعداد دانشجو
            { wch: 50 }   // دلیل
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'نتیجه پردازش');

        XLSX.writeFile(wb, `bulk-upload-result-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };
    // ============================================================
    // بستن
    // ============================================================
    const handleClose = () => {
        if (uploading) return;   // در حال آپلود، نبند
        handleReset();
        onClose();
    };

    if (!show) return null;

    // ============================================================
    // رندر
    // ============================================================
    return (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={uploading ? undefined : handleClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content">
                        {/* هدر */}
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                آپلود گروهی رشته‌های مراکز
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={handleClose}
                                disabled={uploading}
                            ></button>
                        </div>

                        {/* بدنه */}
                        <div className="modal-body">
                            {/* راهنما */}
                            <div className="alert alert-info py-2 small mb-3">
                                <i className="bi bi-info-circle me-1"></i>
                                <strong>فرمت فایل:</strong> ستون‌ها به ترتیب: کد استان | کد مرکز | کد مقطع | کد رشته | ترم ورود | ترم اعمال | تعداد دانشجو
                            </div>

                            {/* حالت ۱: هنوز فایلی انتخاب نشده و نتیجه‌ای نیست */}
                            {!selectedFile && !result && (
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        border: '2px dashed #86b7fe',
                                        borderRadius: '8px',
                                        padding: '40px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        backgroundColor: '#f8f9fa',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <i className="bi bi-cloud-arrow-up" style={{ fontSize: '48px', color: '#0d6efd' }}></i>
                                    <p className="mb-1 mt-3">
                                        <strong>فایل اکسل را اینجا رها کنید</strong>
                                    </p>
                                    <p className="text-muted small mb-0">یا کلیک کنید برای انتخاب فایل</p>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                    />
                                </div>
                            )}

                            {/* حالت ۲: فایل انتخاب شده، هنوز آپلود نشده */}
                            {selectedFile && !result && (
                                <div className="alert alert-secondary d-flex justify-content-between align-items-center">
                                    <div>
                                        <i className="bi bi-file-earmark-excel text-success me-2" style={{ fontSize: '20px' }}></i>
                                        <strong>{selectedFile.name}</strong>
                                        <small className="text-muted ms-2">
                                            ({PersianNumber}{(selectedFile.size / 1024).toFixed(1)} KB)
                                        </small>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={handleReset}
                                        disabled={uploading}
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            )}

                            {/* حالت ۳: نتیجه بعد از آپلود */}
                            {result && (
                                <div>
                                    {/* آمار */}
                                    <div className="row g-2 mb-3">
                                        <div className="col-md-3">
                                            <div className="card border-success">
                                                <div className="card-body py-2 text-center">
                                                    <div className="text-success small">جدید</div>
                                                    <strong style={{ fontSize: '22px' }}>
                                                        <PersianNumber>{result.data?.inserted || 0}</PersianNumber>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card border-info">
                                                <div className="card-body py-2 text-center">
                                                    <div className="text-info small">آپدیت</div>
                                                    <strong style={{ fontSize: '22px' }}>
                                                        <PersianNumber>{result.data?.updated || 0}</PersianNumber>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card border-warning">
                                                <div className="card-body py-2 text-center">
                                                    <div className="text-warning small">غیرفعال</div>
                                                    <strong style={{ fontSize: '22px' }}>
                                                        <PersianNumber>{result.data?.deactivated || 0}</PersianNumber>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="card border-danger">
                                                <div className="card-body py-2 text-center">
                                                    <div className="text-danger small">رد شده</div>
                                                    <strong style={{ fontSize: '22px' }}>
                                                        <PersianNumber>{result.data?.rejected || 0}</PersianNumber>
                                                    </strong>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* فایل خطا */}
                                    {((result.rejectedRows?.length || 0) > 0 || (result.deactivatedRows?.length || 0) > 0) && (
                                        <div className="alert alert-warning py-2">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    {(result.rejectedRows?.length || 0) > 0 && (
                                                        <div className="small mb-1">
                                                            <i className="bi bi-exclamation-triangle text-danger me-1"></i>
                                                            <strong>خطاها:</strong> <PersianNumber>{result.rejectedRows.length}</PersianNumber> ردیف
                                                        </div>
                                                    )}
                                                    {(result.deactivatedRows?.length || 0) > 0 && (
                                                        <div className="small">
                                                            <i className="bi bi-pause-circle text-warning me-1"></i>
                                                            <strong>غیرفعال‌شده‌ها:</strong> <PersianNumber>{result.deactivatedRows.length}</PersianNumber> رکورد
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-success"
                                                    onClick={handleDownloadResultFile}
                                                >
                                                    <i className="bi bi-file-earmark-excel me-1"></i>
                                                    دانلود فایل اکسل نتیجه
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* دکمه آپلود مجدد */}
                                    <div className="text-center mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={handleReset}
                                        >
                                            <i className="bi bi-arrow-counterclockwise me-1"></i>
                                            آپلود فایل جدید
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* فوتر */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={uploading}
                            >
                                <i className="bi bi-x-lg me-1"></i>
                                {result ? 'بستن' : 'انصراف'}
                            </button>

                            {!result && (
                                <button
                                    type="button"
                                    className="btn btn-success"
                                    onClick={handleUpload}
                                    disabled={!selectedFile || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            <span>در حال پردازش...</span>
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-cloud-upload me-1"></i>
                                            <span>آپلود و پردازش</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}