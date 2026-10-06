import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';

export default function ReshtehBulkUploadModal({ show, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    // ============================================================
    // Escape
    // ============================================================
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !uploading) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, uploading, onClose]);

    // ============================================================
    // انتخاب فایل
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
    // آپلود
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

            const response = await api.post('/Reshteh/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                setResult(response.data);
                toast.success(response.data.message);

                // 🔥 دانلود فایل خطا (اگه وجود داره)
                if (response.data.errorFile) {
                    const link = document.createElement('a');
                    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${response.data.errorFile}`;
                    link.download = response.data.errorFileName || 'errors.xlsx';
                    link.click();
                }

                // 🔥 بعد از ۲ ثانیه، لیست رو رفرش کن
                if (response.data.data?.inserted > 0) {
                    setTimeout(() => {
                        onSuccess();
                    }, 2000);
                }
            } else {
                toast.error(response.data?.message || 'خطا در آپلود فایل');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در آپلود فایل');
        } finally {
            setUploading(false);
        }
    };

    // ============================================================
    // ریست
    // ============================================================
    const handleReset = () => {
        setFile(null);
        setResult(null);
    };

    if (!show) return null;

    // ============================================================
    // رندر
    // ============================================================
    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={uploading ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        {/* هدر */}
                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                آپلود فایل اکسل رشته‌ها
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={uploading}
                            ></button>
                        </div>

                        {/* بدنه */}
                        <div className="modal-body">
                            {/* اگه نتیجه داریم */}
                            {result ? (
                                <div>
                                    <div className="alert alert-info">
                                        <h6 className="mb-3">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            نتیجه آپلود
                                        </h6>
                                        <div className="row text-center">
                                            <div className="col-4">
                                                <div className="border rounded p-2">
                                                    <h4 className="text-success mb-1">
                                                        {result.data?.inserted || 0}
                                                    </h4>
                                                    <small>ثبت‌شده</small>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="border rounded p-2">
                                                    <h4 className="text-warning mb-1">
                                                        {result.data?.skipped || 0}
                                                    </h4>
                                                    <small>Skip‌شده (تکراری)</small>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="border rounded p-2">
                                                    <h4 className="text-danger mb-1">
                                                        {result.data?.rejected || 0}
                                                    </h4>
                                                    <small>ردشده (خطا)</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {result.data?.rejected > 0 && (
                                        <div className="alert alert-warning small mb-0">
                                            <i className="bi bi-info-circle me-1"></i>
                                            فایل خطاها به صورت خودکار دانلود شد. لطفاً آن را بررسی کنید.
                                        </div>
                                    )}
                                </div>
                            ) : (
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
                                                📁 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                                            </small>
                                        )}
                                    </div>

                                    {/* راهنما */}
                                    <div className="alert alert-light border small mb-0">
                                        <h6 className="mb-2">
                                            <i className="bi bi-info-circle me-1"></i>
                                            راهنما
                                        </h6>
                                        <ul className="mb-0 ps-3">
                                            <li>فایل باید با فرمت <strong>.xlsx</strong> یا <strong>.xls</strong> باشه</li>
                                            <li>کاربرگ اول فایل خونده میشه</li>
                                            <li>ستون‌های موردنیاز:
                                                <ul>
                                                    <li>ستون 2: کد مقطع</li>
                                                    <li>ستون 3: مقطع تحصیلی</li>
                                                    <li>ستون 6: کد رشته</li>
                                                    <li>ستون 7: عنوان رشته</li>
                                                    <li>ستون 8: ترم ورود</li>
                                                    <li>ستون 9: ترم اعمال</li>
                                                </ul>
                                            </li>
                                            <li>رشته‌های تکراری <strong>Skip</strong> میشن</li>
                                            <li>رشته‌های خطادار توی فایل خطا ذخیره میشن</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* فوتر */}
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
                                                آپلود
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