// src/components/common/DownloadButton.jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';

/**
 * کامپوننت دکمه دانلود فایل (استاندارد و قابل استفاده در کل پروژه)
 * @param {string} filePath - مسیر فایل در سرور (ذخیره شده در دیتابیس)
 * @param {string} fileName - نام فایل برای ذخیره‌سازی (اختیاری)
 * @param {string} buttonText - متن دکمه (پیش‌فرض: "دانلود مستندات")
 */
const DownloadButton = ({
    filePath,
    fileName,
    buttonText = 'دانلود',
    className = '',
    children,
    ...props
}) => {
    const [loading, setLoading] = useState(false);

    if (!filePath) return null;

    const handleDownload = async () => {
        setLoading(true);
        try {
            // استفاده از api که توکن را به‌طور خودکار ارسال می‌کند
            const response = await api.get('/File/download', {
                params: {
                    path: filePath,
                    fileName: fileName || undefined
                },
                responseType: 'blob'
            });

            // بررسی اینکه پاسخ JSON خطا نباشد
            const contentType = response.headers['content-type'] || '';
            if (contentType.includes('application/json')) {
                const text = await response.data.text();
                const errorData = JSON.parse(text);
                throw new Error(errorData.message || 'خطا در دانلود فایل');
            }

            // دانلود فایل
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || filePath.split('/').pop() || 'فایل';
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('فایل با موفقیت دانلود شد');
        } catch (error) {
            console.error('❌ خطا در دانلود فایل:', error);
            toast.error(error.message || 'خطا در دانلود فایل');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className={`btn btn-sm btn-outline-primary d-print-none ${className}`}
            onClick={handleDownload}
            disabled={loading}
            {...props}
        >
            {loading ? (
                <>
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                    در حال دانلود...
                </>
            ) : (
                children || (
                    <>
                        <i className="bi bi-download me-1"></i>
                        {buttonText}
                    </>
                )
            )}
        </button>
    );
};

export default DownloadButton;