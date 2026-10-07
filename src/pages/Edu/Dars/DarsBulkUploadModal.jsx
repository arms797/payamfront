// src/pages/Edu/Dars/DarsBulkUploadModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';

export default function DarsBulkUploadModal({ show, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    // ============================================================
    // 🔥 بستن با Escape
    // ============================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !uploading) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, uploading, onClose]);

    // ============================================================
    // 🔥 ریست state هنگام باز شدن مودال
    // ============================================================
    useEffect(() => {
        if (show) {
            setFile(null);
            setResult(null);
            setUploading(false);
        }
    }, [show]);

    // ============================================================
    // 🔥 انتخاب فایل
    // ============================================================
    const handleFileChange = (e) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const ext = selectedFile.name.split('.').pop().toLowerCase();
        if (ext !== 'xlsx' && ext !== 'xls') {
            toast.error('فقط فایل‌های Excel (.xlsx, .xls) مجاز هستند');
            return;
        }

        setFile(selectedFile);
        setResult(null);
    };

    // ============================================================
    // 🔥 آپلود
    // ============================================================
    const handleUpload = async () => {
        if (!file) {
            toast.warning('لطفاً یک فایل انتخاب کنید');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/Dars/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                setResult(response.data);
                toast.success(response.data.message);

                // 🔥 دانلود خودکار فایل خطاها (اگه وجود داره)
                if (response.data.errorFile) {
                    downloadErrorFile(
                        response.data.errorFile,
                        response.data.errorFileName || 'rejected-dars.xlsx'
                    );
                }

                // 🔥 بعد از ۲ ثانیه، لیست رو رفرش کن
                if (response.data.data?.darsCreated > 0) {
                    setTimeout(() => {
                        onSuccess();
                    }, 2000);
                }
            } else {
                toast.error(response.data?.message || 'خطا در آپلود فایل');
            }
        } catch (error) {
            console.error('خطا در آپلود:', error);
            toast.error(error.response?.data?.message || 'خطا در آپلود فایل');
        } finally {
            setUploading(false);
        }
    };

    // ============================================================
    // 🔥 دانلود فایل خطاها
    // ============================================================
    const downloadErrorFile = (base64Data, fileName) => {
        try {
            const link = document.createElement('a');
            link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Data}`;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('خطا در دانلود فایل خطاها:', error);
            toast.error('خطا در دانلود فایل خطاها');
        }
    };

    // ============================================================
    // 🔥 دانلود دستی فایل خطاها
    // ============================================================
    const handleDownloadErrors = () => {
        if (!result?.errorFile) return;
        downloadErrorFile(
            result.errorFile,
            result.errorFileName || 'rejected-dars.xlsx'
        );
    };

    // ============================================================
    // 🔥 ریست فرم (آپلود فایل دیگر)
    // ============================================================
    const handleReset = () => {
        setFile(null);
        setResult(null);
    };

    // ============================================================
    // 🔥 اگه show نباشه، رندر نکن
    // ============================================================
    if (!show) return null;

    // ============================================================
    // 🔥 رندر
    // ============================================================
    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={uploading ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">

                        {/* ============================================================ */}
                        {/* هدر */}
                        {/* ============================================================ */}
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                آپلود گروهی دروس از اکسل
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={uploading}
                            ></button>
                        </div>

                        {/* ============================================================ */}
                        {/* بدنه */}
                        {/* ============================================================ */}
                        <div className="modal-body">

                            {/* ============================================================ */}
                            {/* حالت ۱: نمایش نتیجه */}
                            {/* ============================================================ */}
                            {result ? (
                                <div>
                                    {/* کارت‌های آمار */}
                                    <div className="alert alert-success mb-3">
                                        <h6 className="mb-3">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            نتیجه آپلود
                                        </h6>
                                        <div className="row text-center g-2">
                                            {/* دروس ثبت‌شده */}
                                            <div className="col-4">
                                                <div className="border rounded p-2 bg-white">
                                                    <h4 className="text-success mb-1">
                                                        {result.data?.darsCreated || 0}
                                                    </h4>
                                                    <small className="text-muted">
                                                        درس ثبت‌شده
                                                    </small>
                                                </div>
                                            </div>

                                            {/* منابع ثبت‌شده */}
                                            <div className="col-4">
                                                <div className="border rounded p-2 bg-white">
                                                    <h4 className="text-info mb-1">
                                                        {result.data?.manbaCreated || 0}
                                                    </h4>
                                                    <small className="text-muted">
                                                        منبع ثبت‌شده
                                                    </small>
                                                </div>
                                            </div>

                                            {/* رشته‌های رد‌شده */}
                                            <div className="col-4">
                                                <div className="border rounded p-2 bg-white">
                                                    <h4 className="text-danger mb-1">
                                                        {result.data?.rejectedReshtehCount || 0}
                                                    </h4>
                                                    <small className="text-muted">
                                                        رشته رد‌شده
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* فایل خطاها */}
                                    {result.data?.rejectedReshtehCount > 0 && (
                                        <div className="alert alert-warning mb-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                    <strong>
                                                        {result.data.rejectedReshtehCount} رشته رد شد
                                                    </strong>
                                                    <br />
                                                    <small className="text-muted">
                                                        فایل خطاها به صورت خودکار دانلود شد.
                                                        اگر دوباره نیاز داری، دکمه زیر رو بزن.
                                                    </small>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-warning"
                                                    onClick={handleDownloadErrors}
                                                >
                                                    <i className="bi bi-download me-1"></i>
                                                    دانلود مجدد
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* جدول رشته‌های رد‌شده */}
                                    {result.data?.rejectedReshtehs?.length > 0 && (
                                        <div className="border rounded bg-light p-2" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                                            <small className="text-muted d-block mb-2">
                                                <i className="bi bi-list-ul me-1"></i>
                                                جزئیات رشته‌های رد‌شده:
                                            </small>
                                            <table className="table table-sm table-bordered mb-0 bg-white" style={{ fontSize: '12px' }}>
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>#</th>
                                                        <th>رشته</th>
                                                        <th>کد رشته</th>
                                                        <th>کد مقطع</th>
                                                        <th>ترم ورود</th>
                                                        <th>ترم اعمال</th>
                                                        <th>دلیل</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {result.data.rejectedReshtehs.map((r, i) => (
                                                        <tr key={i}>
                                                            <td>{i + 1}</td>
                                                            <td>{r.reshtehName || '-'}</td>
                                                            <td>{r.codeReshte || '-'}</td>
                                                            <td>{r.codeMaghta || '-'}</td>
                                                            <td>{r.termVorood || '-'}</td>
                                                            <td>{r.termEamal || '-'}</td>
                                                            <td className="text-danger">
                                                                <small>{r.reason || '-'}</small>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {/* اگه همه موفق بودن */}
                                    {result.data?.darsCreated > 0 &&
                                        result.data?.rejectedReshtehCount === 0 && (
                                            <div className="alert alert-info small mb-0">
                                                <i className="bi bi-info-circle me-1"></i>
                                                همه رکوردها با موفقیت ثبت شدند. در حال رفرش لیست...
                                            </div>
                                        )}
                                </div>
                            ) : (
                                /* ============================================================ */
                                /* حالت ۲: فرم آپلود */
                                /* ============================================================ */
                                <div>
                                    {/* انتخاب فایل */}
                                    <div className="mb-3">
                                        <label className="form-label">
                                            فایل اکسل <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileChange}
                                            disabled={uploading}
                                        />
                                        {file && (
                                            <small className="text-muted d-block mt-1">
                                                <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </small>
                                        )}
                                    </div>

                                    {/* راهنما */}
                                    <div className="alert alert-light border small mb-0">
                                        <h6 className="mb-2">
                                            <i className="bi bi-info-circle me-1"></i>
                                            راهنما (ساختار گزارش ۱۰۰۹)
                                        </h6>
                                        <ul className="mb-0 ps-3">
                                            <li>فایل باید با فرمت <strong>.xlsx</strong> یا <strong>.xls</strong> باشه</li>
                                            <li>کاربرگ اول فایل خونده میشه</li>
                                            <li>ردیف اول هدر هست و نادیده گرفته میشه</li>
                                            <li>
                                                <strong>ستون‌های مهم:</strong>
                                                <ul className="mb-0">
                                                    <li>ستون ۴: کد درس (اگه خالی باشه، یعنی منبع اضافی برای درس قبلیه)</li>
                                                    <li>ستون ۵: نام درس</li>
                                                    <li>ستون ۱۳ تا ۲۴: اطلاعات منبع</li>
                                                    <li>ستون ۲۶: کد رشته</li>
                                                    <li>ستون ۲۷: کد مقطع</li>
                                                    <li>ستون ۳۷: ترم ورود</li>
                                                    <li>ستون ۳۸: ترم اعمال</li>
                                                </ul>
                                            </li>
                                            <li>رشته‌های تکراری <strong>رد</strong> میشن و توی فایل خطا میان</li>
                                            <li>دروس تکراری در یک رشته، کل رشته رو رد میکنن</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ============================================================ */}
                        {/* فوتر */}
                        {/* ============================================================ */}
                        <div className="modal-footer">
                            {result ? (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleReset}
                                    >
                                        <i className="bi bi-arrow-counterclockwise me-1"></i>
                                        آپلود فایل دیگر
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={onClose}
                                    >
                                        <i className="bi bi-x-lg me-1"></i>
                                        بستن
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={onClose}
                                        disabled={uploading}
                                    >
                                        <i className="bi bi-x-lg me-1"></i>
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-success"
                                        onClick={handleUpload}
                                        disabled={uploading || !file}
                                    >
                                        {uploading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                در حال آپلود...
                                            </>
                                        ) : (
                                            <>
                                                <i className="bi bi-upload me-1"></i>
                                                آپلود و پردازش
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
}