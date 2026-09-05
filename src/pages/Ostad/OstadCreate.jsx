import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMarkaz } from '../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../api/axiosConfig';
import MarkazSelector from '../../components/common/MarkazSelector';
import { PermissionWrapper } from '../../components/PermissionWrapper';
import * as XLSX from 'xlsx';

export default function OstadCreate() {
    const navigate = useNavigate();
    const { hasPermission } = useAuth();
    const { markazList } = useMarkaz();

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    // ============================================================
    // State فرم
    // ============================================================
    const [formData, setFormData] = useState({
        codeOstadi: '',
        naam: '',
        naamKhanevadegi: '',
        markazId: '',
        markazAsliId: '',
        jens: '',
        naamPedar: '',
        tarikhTavalod: '',
        shomareShenasname: '',
        shomareMelli: '',
        email: '',
        mobile: '',
        mobile2: '',
        martabeElmi: '',
        noeHamkari: '',
        noeBimeh: '',
        shomarehBimeh: '',
        roleName: ''
    });

    // ============================================================
    // بررسی مجوز
    // ============================================================
    if (!hasPermission('Ostad.Create')) {
        return (
            <div className="alert alert-warning text-center mt-5">
                شما مجوز ایجاد استاد را ندارید
            </div>
        );
    }

    // ============================================================
    // تغییر فیلدها
    // ============================================================
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleMarkazChange = (fieldName) => (value) => {
        setFormData({ ...formData, [fieldName]: value });
    };

    // ============================================================
    // دانلود فایل اکسل خام
    // ============================================================
    const handleDownloadExcel = () => {
        const headers = [
            'کد مرکز محل خدمت',
            'کد مرکز اصلی',
            'کد استادی',
            'نام خانوادگی',
            'نام',
            'جنسیت',
            'نام پدر',
            'تاریخ تولد',
            'شماره شناسنامه',
            'شماره ملی',
            'ایمیل',
            'موبایل 1',
            'موبایل 2',
            'مرتبه علمی',
            'نوع همکاری(علمی=1ومدعو=3)',
            'نوع بیمه',
            'شماره بیمه',
            'کد دو رقمی دانشکده',
            'کد دو رقمی گروه آموزشی',
            'رشته تحصیلی',
            'گرایش',
            'مقطع',
            'محل اخذ'
        ];

        const sampleRow = [
            '6293',
            '',
            '123456',
            'علوی',
            'احمد',
            'مرد',
            'علی',
            '1365/01/01',
            '1234567890',
            '1234567890',
            'a.alaavi@example.com',
            '09121234567',
            '',
            'استادیار',
            '3',
            'تامین اجتماعی',
            '123456',
            '13',
            '22',
            'مهندسی کامپیوتر',
            'نرم‌افزار',
            'دکتری',
            'دانشگاه تهران'
        ];

        const data = [
            headers,
            sampleRow,
            ...Array(5).fill(headers.map(() => ''))
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = headers.map(() => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(wb, ws, 'اساتید');
        XLSX.writeFile(wb, 'الگوی_بارگذاری_اساتید.xlsx');
    };

    // ============================================================
    // انتخاب فایل
    // ============================================================
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx')) {
                toast.error('فرمت فایل باید xlsx باشد');
                setSelectedFile(null);
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
            toast.success(`فایل "${file.name}" انتخاب شد`);
        }
    };

    // ============================================================
    // آپلود فایل اکسل
    // ============================================================
    const handleUploadExcel = async () => {
        if (!selectedFile) {
            toast.warning('لطفاً ابتدا فایل را انتخاب کنید');
            return;
        }

        setUploading(true);
        const formDataFile = new FormData();
        formDataFile.append('file', selectedFile);

        try {
            const response = await api.post('/Ostad/bulk-upload', formDataFile, {
                headers: { 'Content-Type': 'multipart/form-data' },
                responseType: 'blob'  // ← مهم: برای دریافت فایل
            });

            // ============================================================
            // 🔥 بررسی نوع پاسخ (فایل یا JSON)
            // ============================================================
            const contentType = response.headers['content-type'];

            if (contentType && contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
                // ============================================================
                // 🔥 اگر پاسخ یک فایل اکسل است (فایل خطاها)
                // ============================================================
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'خطاهای_بارگذاری_اساتید.xlsx');
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);

                toast.warning('برخی رکوردها با خطا مواجه شدند. فایل خطاها دانلود شد.');
                setSelectedFile(null);
                document.getElementById('fileInput').value = '';
                navigate('/dashboard/ostad');
            } else {
                // ============================================================
                // 🔥 اگر پاسخ JSON است (همه رکوردها موفق)
                // ============================================================
                // تبدیل blob به متن برای خواندن JSON
                const text = await response.data.text();
                const data = JSON.parse(text);

                if (data.success) {
                    toast.success(data.message);
                    setSelectedFile(null);
                    document.getElementById('fileInput').value = '';
                    navigate('/dashboard/ostad');
                } else {
                    toast.error(data.message || 'خطا در بارگذاری فایل');
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در بارگذاری فایل');
            console.log(error.response?.data)
        } finally {
            setUploading(false);
        }
    };

    // ============================================================
    // ثبت استاد (تکی)
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // اعتبارسنجی کد ملی
            if (!/^[0-9]{10}$/.test(formData.shomareMelli)) {
                toast.error('کد ملی باید دقیقاً ۱۰ رقم باشد');
                setLoading(false);
                return;
            }

            const payload = {
                codeOstadi: formData.codeOstadi,
                naam: formData.naam,
                naamKhanevadegi: formData.naamKhanevadegi,
                markazId: parseInt(formData.markazId),
                markazAsliId: formData.markazAsliId ? parseInt(formData.markazAsliId) : null,
                jens: formData.jens || null,
                naamPedar: formData.naamPedar || null,
                tarikhTavalod: formData.tarikhTavalod || null,
                shomareShenasname: formData.shomareShenasname || null,
                shomareMelli: formData.shomareMelli,
                email: formData.email || null,
                mobile: formData.mobile || null,
                mobile2: formData.mobile2 || null,
                martabeElmi: formData.martabeElmi || null,
                noeHamkari: formData.noeHamkari ? parseInt(formData.noeHamkari) : null,
                noeBimeh: formData.noeBimeh || null,
                shomarehBimeh: formData.shomarehBimeh || null,
                roleName: formData.roleName || null
            };

            const response = await api.post('/Ostad/create', payload);

            if (response.data?.success) {
                toast.success('استاد با موفقیت ایجاد شد');
                navigate('/dashboard/ostad');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ایجاد استاد');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            {/* ============================================================
                هدر
                ============================================================ */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate('/dashboard/ostad')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">ایجاد استاد جدید</h4>
                </div>
            </div>

            {/* ============================================================
                بخش آپلود اکسل
                ============================================================ */}
            <PermissionWrapper permission="Ostad.BulkUpload">
                <div className="card mb-4">
                    <div className="card-header bg-success text-white">
                        <h5 className="mb-0">
                            <i className="bi bi-file-earmark-excel me-2"></i>
                            بارگذاری گروهی با اکسل
                        </h5>
                    </div>
                    <div className="card-body">
                        <div className="row align-items-center">
                            <div className="col-md-4">
                                <button
                                    className="btn btn-outline-success w-100"
                                    onClick={handleDownloadExcel}
                                >
                                    <i className="bi bi-download me-2"></i>
                                    دانلود الگوی اکسل
                                </button>
                                <small className="text-muted d-block mt-1">
                                    ابتدا الگو را دانلود و تکمیل کنید
                                </small>
                            </div>
                            <div className="col-md-5">
                                <input
                                    id="fileInput"
                                    type="file"
                                    className="form-control"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    disabled={uploading}
                                />
                                {selectedFile && (
                                    <small className="text-success d-block mt-1">
                                        <i className="bi bi-check-circle me-1"></i>
                                        {selectedFile.name}
                                    </small>
                                )}
                            </div>
                            <div className="col-md-3">
                                <button
                                    className="btn btn-success w-100"
                                    onClick={handleUploadExcel}
                                    disabled={!selectedFile || uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            در حال بارگذاری...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-upload me-2"></i>
                                            بارگذاری
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </PermissionWrapper>

            {/* ============================================================
                فرم ایجاد استاد (تکی)
                ============================================================ */}
            <div className="card">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                        <i className="bi bi-person-plus me-2"></i>
                        ثبت استاد به صورت تکی
                    </h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        {/* ============================================================
                            اطلاعات شناسایی
                            ============================================================ */}
                        <h6 className="text-primary">اطلاعات شناسایی</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">کد استادی *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="codeOstadi"
                                    value={formData.codeOstadi}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">نام *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="naam"
                                    value={formData.naam}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">نام خانوادگی *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="naamKhanevadegi"
                                    value={formData.naamKhanevadegi}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">شماره ملی *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="shomareMelli"
                                    value={formData.shomareMelli}
                                    onChange={handleChange}
                                    required
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    placeholder="۱۰ رقم"
                                />
                                <small className="text-muted">کد ملی باید دقیقاً ۱۰ رقم باشد</small>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">شماره شناسنامه</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="shomareShenasname"
                                    value={formData.shomareShenasname}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">جنسیت</label>
                                <select
                                    className="form-select"
                                    name="jens"
                                    value={formData.jens}
                                    onChange={handleChange}
                                >
                                    <option value="">انتخاب...</option>
                                    <option value="مرد">مرد</option>
                                    <option value="زن">زن</option>
                                </select>
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">نام پدر</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="naamPedar"
                                    value={formData.naamPedar}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">تاریخ تولد</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="tarikhTavalod"
                                    value={formData.tarikhTavalod}
                                    onChange={handleChange}
                                    placeholder="مثال: 1365/01/01"
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">مرتبه علمی</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="martabeElmi"
                                    value={formData.martabeElmi}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* ============================================================
                            اطلاعات شغلی
                            ============================================================ */}
                        <h6 className="text-primary mt-4">اطلاعات شغلی</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-6">
                                <MarkazSelector
                                    label="مرکز خدمتی *"
                                    value={formData.markazId}
                                    onChange={handleMarkazChange('markazId')}
                                    required={true}
                                    placeholder="انتخاب مرکز خدمتی..."
                                />
                            </div>
                            <div className="col-md-6">
                                <MarkazSelector
                                    label="مرکز اصلی"
                                    value={formData.markazAsliId}
                                    onChange={handleMarkazChange('markazAsliId')}
                                    required={false}
                                    placeholder="انتخاب مرکز اصلی..."
                                />
                            </div>
                        </div>

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">نوع همکاری</label>
                                <select
                                    className="form-select"
                                    name="noeHamkari"
                                    value={formData.noeHamkari}
                                    onChange={handleChange}
                                >
                                    <option value="">انتخاب...</option>
                                    <option value="1">هیات علمی پیام نور</option>
                                    <option value="2">هیات علمی غیر پیام نور</option>
                                    <option value="3">مدرس مدعو</option>
                                    <option value="4">هیات علمی پیام نور (سایر استان‌ها)</option>
                                </select>
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">نوع بیمه</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="noeBimeh"
                                    value={formData.noeBimeh}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">شماره بیمه</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="shomarehBimeh"
                                    value={formData.shomarehBimeh}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* ============================================================
                            اطلاعات تماس
                            ============================================================ */}
                        <h6 className="text-primary mt-4">اطلاعات تماس</h6>
                        <hr />

                        <div className="row mb-3">
                            <div className="col-md-4">
                                <label className="form-label">ایمیل</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">موبایل ۱</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="col-md-4">
                                <label className="form-label">موبایل ۲</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="mobile2"
                                    value={formData.mobile2}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* نقش (اختیاری) */}
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <label className="form-label">نقش (اختیاری)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="roleName"
                                    value={formData.roleName}
                                    onChange={handleChange}
                                    placeholder="مثلاً: استاد"
                                />
                            </div>
                        </div>

                        {/* دکمه‌ها */}
                        <div className="d-flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? 'در حال ثبت...' : 'ثبت استاد'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate('/dashboard/ostad')}
                            >
                                انصراف
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}