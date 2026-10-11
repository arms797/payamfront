// src/pages/Edu/SakhtemanKelass/SakhtemanKelassBulkUploadModal.jsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import * as XLSX from 'xlsx';

// ============================================================
// ستون‌های فایل نمونه اکسل
// ============================================================
const EXCEL_COLUMNS = [
    'کد مرکز',
    'کد ساختمان',
    'نام ساختمان',
    'کد کلاس',
    'نام کلاس',
    'نوع کلاس',
    'وضعیت (0=غیرفعال، 1=فعال)',
    'ظرفیت',
    'طبقه',
    'ظرفیت امتحانی',
    'تعداد وایت‌برد',
    'ویدئو پروژکتور (0=ندارد، 1=دارد)',
    'امکانات',
    'توضیحات',
    'تلفن مسئول',
    'آموزشی (0=اداری، 1=آموزشی)'
];

const SAMPLE_ROW = [
    '6293',
    '1',
    'ساختمان مرکزی',
    '101',
    'کلاس 101',
    'درس',
    '1',
    '30',
    '1',
    '35',
    '2',
    '1',
    'ویدئو کنفرانس، برد هوشمند',
    'کلاس اصلی ساختمان',
    '07123456789',
    '1'
];

export default function SakhtemanKelassBulkUploadModal({ show, onClose, onSuccess }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !uploading) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, uploading, onClose]);

    useEffect(() => {
        if (show) {
            setFile(null);
            setResult(null);
            setUploading(false);
        }
    }, [show]);

    // ============================================================
    // دانلود فایل نمونه اکسل
    // ============================================================
    const handleDownloadSample = () => {
        const data = [
            EXCEL_COLUMNS,
            SAMPLE_ROW,
            ...Array(5).fill(EXCEL_COLUMNS.map(() => ''))
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = EXCEL_COLUMNS.map(() => ({ wch: 22 }));
        XLSX.utils.book_append_sheet(wb, ws, 'Sakhteman-Kelass');
        XLSX.writeFile(wb, 'نمونه_آپلود_ساختمان_کلاس.xlsx');
    };

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

            const response = await api.post('/SakhtemanKelass/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                setResult(response.data);
                toast.success(response.data.message);

                if (response.data.errorFile) {
                    downloadErrorFile(
                        response.data.errorFile,
                        response.data.errorFileName || 'sakhteman-kelass-errors.xlsx'
                    );
                }

                if (response.data.data?.inserted > 0) {
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
    // دانلود فایل خطاها
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

    const handleDownloadErrors = () => {
        if (!result?.errorFile) return;
        downloadErrorFile(
            result.errorFile,
            result.errorFileName || 'sakhteman-kelass-errors.xlsx'
        );
    };

    const handleReset = () => {
        setFile(null);
        setResult(null);
    };

    if (!show) return null;

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

                        <div className="modal-header bg-success text-white">
                            <h5 className="modal-title">
                                <i className="bi bi-file-earmark-excel me-2"></i>
                                آپلود گروهی ساختمان/کلاس از اکسل
                            </h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                onClick={onClose}
                                disabled={uploading}
                            ></button>
                        </div>

                        <div className="modal-body">

                            {result ? (
                                <div>
                                    <div className="alert alert-success mb-3">
                                        <h6 className="mb-3">
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            نتیجه آپلود
                                        </h6>
                                        <div className="row text-center g-2">
                                            <div className="col-4">
                                                <div className="border rounded p-2 bg-white">
                                                    <h4 className="text-success mb-1">
                                                        {result.data?.inserted || 0}
                                                    </h4>
                                                    <small className="text-muted">
                                                        ثبت‌شده
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="col-4">
                                                <div className="border rounded p-2 bg-white">
                                                    <h4 className="text-warning mb-1">
                                                        {result.data?.skipped || 0}
                                                    </h4>
                                                    <small className="text-muted">
                                                        Skip‌شده (تکراری)
                                                    </small>
                                                </div>
                                            </div>

                                            <div className="col-4">
                                                <div className="border rounded p-2 bg-white">
                                                    <h4 className="text-danger mb-1">
                                                        {result.data?.rejected || 0}
                                                    </h4>
                                                    <small className="text-muted">
                                                        رد‌شده (خطا)
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {result.data?.rejected > 0 && (
                                        <div className="alert alert-warning mb-3">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                                    <strong>
                                                        {result.data.rejected} رکورد رد شد
                                                    </strong>
                                                    <br />
                                                    <small className="text-muted">
                                                        فایل خطاها به صورت خودکار دانلود شد.
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

                                    {result.data?.inserted > 0 &&
                                        result.data?.rejected === 0 && (
                                            <div className="alert alert-info small mb-0">
                                                <i className="bi bi-info-circle me-1"></i>
                                                همه رکوردها با موفقیت ثبت شدند. در حال رفرش لیست...
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-info w-100"
                                            onClick={handleDownloadSample}
                                        >
                                            <i className="bi bi-download me-2"></i>
                                            دانلود فایل نمونه اکسل
                                        </button>
                                        <small className="text-muted d-block mt-1 text-center">
                                            برای اطمینان از فرمت صحیح، فایل نمونه را دانلود کنید
                                        </small>
                                    </div>

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

                                    <div className="alert alert-light border small mb-0">
                                        <h6 className="mb-2">
                                            <i className="bi bi-info-circle me-1"></i>
                                            راهنما
                                        </h6>
                                        <ul className="mb-0 ps-3">
                                            <li>فایل باید با فرمت <strong>.xlsx</strong> یا <strong>.xls</strong> باشه</li>
                                            <li>کاربرگ اول فایل خونده میشه</li>
                                            <li>ردیف اول هدر هست و نادیده گرفته میشه</li>
                                            <li>
                                                <strong>ستون‌ها به ترتیب:</strong>
                                                <ol className="mb-0 mt-1">
                                                    <li>کد مرکز (اجباری)</li>
                                                    <li>کد ساختمان (اجباری - عدد)</li>
                                                    <li>نام ساختمان (اجباری)</li>
                                                    <li>کد کلاس (اجباری - عدد)</li>
                                                    <li>نام کلاس (اجباری)</li>
                                                    <li>نوع کلاس</li>
                                                    <li>وضعیت (0 یا 1)</li>
                                                    <li>ظرفیت (عدد)</li>
                                                    <li>طبقه (عدد)</li>
                                                    <li>ظرفیت امتحانی (عدد)</li>
                                                    <li>تعداد وایت‌برد (عدد)</li>
                                                    <li>ویدئو پروژکتور (0 یا 1)</li>
                                                    <li>امکانات (متن)</li>
                                                    <li>توضیحات (متن)</li>
                                                    <li>تلفن مسئول (متن)</li>
                                                    <li>آموزشی (0=اداری، 1=آموزشی)</li>
                                                </ol>
                                            </li>
                                            <li>رکوردهای تکراری (بر اساس مرکز + کد ساختمان + کد کلاس) <strong>Skip</strong> میشن</li>
                                            <li>رکوردهای خطادار توی فایل خطا ذخیره میشن</li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

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