// src/pages/Schedule/Hamjavar/HamjavarCreate.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTerm } from '../../../context/TermContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import OstadSelector from '../../../components/common/OstadSelector';
import FaaliatMultiSelector from '../../../components/common/FaaliatMultiSelector';
import MarkazSelector from '../../../components/common/MarkazSelector';

export default function HamjavarCreate() {
    const navigate = useNavigate();
    const { user, hasPermission } = useAuth();
    const { currentTerm, currentTermCode, termList } = useTerm();
    const { markazList } = useMarkaz();

    // ============================================================
    // تشخیص نقش معاون
    // ============================================================
    const isMoaven = useMemo(() => {
        return user?.permissions?.includes('Hamjavar.CreateMoaven') || false;
    }, [user]);

    // ============================================================
    // اطلاعات استاد (برای نمایش)
    // ============================================================
    const [ostadInfo, setOstadInfo] = useState(null);

    // ============================================================
    // State اصلی فرم
    // ============================================================
    const [formData, setFormData] = useState({
        ostadId: isMoaven ? '' : user?.id || '',
        termCode: currentTermCode || '',
        akharinVazeeat: 'مشغول به کار',
        isEjeari: false,
        onvanEjraei: '',
        fullTime: true,
        vahedMovazaf: 0,
        tedadVahedMahalKhedmat: '',
        tedadVahedHamjavar: '',
        tedadVahedMajazi: '',
        dalil: '',
        shahrZendegi: '',
        uploadElmi: null,
        isAgree: false,
        hasKesri: true,
        items: []
    });

    // ============================================================
    // State برای آیتم جدید (قبل از افزودن به لیست)
    // ============================================================
    const [newItem, setNewItem] = useState({
        inOstan: true,
        markazId: '',
        noeAnjam: '',
        faaliatIds: [],
        tedadRoozElmi: ''
    });

    // ============================================================
    // گزینه‌های داخل/خارج استان
    // ============================================================
    const inOstanOptions = [
        { value: true, label: 'داخل استان' },
        { value: false, label: 'خارج استان' }
    ];

    // ============================================================
    // دریافت اطلاعات استاد (برای نمایش)
    // ============================================================
    useEffect(() => {
        const fetchOstadInfo = async () => {
            const targetId = isMoaven ? formData.ostadId : user?.id;
            if (!targetId) return;

            try {
                const response = await api.get(`/User/by-type`, {
                    params: { type: 'ostad', id: targetId }
                });
                if (response.data?.success) {
                    const data = response.data.data;
                    setOstadInfo({
                        naam: data.firstName || '',
                        naamKhanevadegi: data.lastName || '',
                        codeOstadi: data.userName || '',
                        markazName: data.markazName || ''
                    });
                }
            } catch (error) {
                console.error('خطا در دریافت اطلاعات استاد:', error);
            }
        };
        fetchOstadInfo();
    }, [isMoaven, formData.ostadId, user?.id]);

    // ============================================================
    // دریافت اطلاعات علمی ترم (ElmiTerm)
    // ============================================================
    useEffect(() => {
        const fetchElmiTerm = async () => {
            const targetUserId = isMoaven ? formData.ostadId : user?.id;
            if (!targetUserId || !currentTermCode) return;

            try {
                const response = await api.get('/ElmiTerm/by-user-term', {
                    params: { userId: targetUserId, termCode: currentTermCode }
                });

                if (response.data?.success) {
                    const data = response.data.data;
                    setFormData(prev => ({
                        ...prev,
                        akharinVazeeat: data.akharinVazeeat || 'مشغول به کار',
                        isEjeari: data.isEjeari ?? false,
                        onvanEjraei: data.onvanEjraei || '',
                        fullTime: data.fullTime ?? true,
                        vahedMovazaf: data.tedadSaatMovazafi || 0
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        akharinVazeeat: 'مشغول به کار',
                        isEjeari: false,
                        onvanEjraei: '',
                        fullTime: true,
                        vahedMovazaf: 0
                    }));
                }
            } catch (error) {
                setFormData(prev => ({
                    ...prev,
                    akharinVazeeat: 'مشغول به کار',
                    isEjeari: false,
                    onvanEjraei: '',
                    fullTime: true,
                    vahedMovazaf: 0
                }));
            }
        };

        fetchElmiTerm();
    }, [isMoaven, formData.ostadId, user?.id, currentTermCode]);

    // ============================================================
    // محاسبه خودکار کسری واحد
    // ============================================================
    const kesriValue = useMemo(() => {
        const movazaf = formData.vahedMovazaf || 0;
        const mahalKhedmat = parseFloat(formData.tedadVahedMahalKhedmat) || 0;
        return Math.max(0, movazaf - mahalKhedmat);
    }, [formData.vahedMovazaf, formData.tedadVahedMahalKhedmat]);

    // ============================================================
    // اعتبارسنجی آیتم جدید
    // ============================================================
    const validateNewItem = () => {
        if (!newItem.markazId) {
            toast.warning('انتخاب مرکز الزامی است');
            return false;
        }
        const tedad = parseInt(newItem.tedadRoozElmi);
        if (!newItem.tedadRoozElmi || tedad < 1 || tedad > 6) {
            toast.warning('تعداد روز در هفته باید بین ۱ تا ۶ باشد');
            return false;
        }
        if (!newItem.noeAnjam) {
            toast.warning('انتخاب نوع فعالیت الزامی است');
            return false;
        }
        if (!newItem.faaliatIds || newItem.faaliatIds.length === 0) {
            toast.warning('انتخاب حداقل یک فعالیت الزامی است');
            return false;
        }
        return true;
    };

    // ============================================================
    // افزودن آیتم به لیست موارد تقاضا
    // ============================================================
    const handleAddItem = () => {
        if (!validateNewItem()) return;

        setFormData(prev => ({
            ...prev,
            items: [
                ...prev.items,
                {
                    id: Date.now(),
                    inOstan: newItem.inOstan,
                    markazId: parseInt(newItem.markazId),
                    noeAnjam: parseInt(newItem.noeAnjam),
                    faaliatIds: newItem.faaliatIds,
                    tedadRoozElmi: parseInt(newItem.tedadRoozElmi)
                }
            ]
        }));

        setNewItem({
            inOstan: true,
            markazId: '',
            noeAnjam: '',
            faaliatIds: [],
            tedadRoozElmi: ''
        });
    };

    // ============================================================
    // حذف آیتم از لیست
    // ============================================================
    const handleRemoveItem = (id) => {
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
    };

    // ============================================================
    // ثبت درخواست
    // ============================================================
    const handleSubmit = async () => {
        try {
            // اعتبارسنجی
            if (isMoaven && !formData.ostadId) {
                toast.warning('انتخاب استاد الزامی است');
                return;
            }

            if (!isMoaven && !formData.isAgree) {
                toast.warning('لطفاً ابتدا دستورالعمل را مطالعه و تایید کنید');
                return;
            }

            if (formData.items.length === 0) {
                toast.warning('حداقل یک مورد تقاضا باید ثبت شود');
                return;
            }

            // ساخت payload
            const payload = {
                ostadId: isMoaven ? parseInt(formData.ostadId) : user?.id,
                termCode: formData.termCode,
                vahedMovazaf: formData.vahedMovazaf,
                tedadVahedMahalKhedmat: parseFloat(formData.tedadVahedMahalKhedmat) || 0,
                tedadVahedHamjavar: parseFloat(formData.tedadVahedHamjavar) || 0,
                tedadVahedMajazi: parseFloat(formData.tedadVahedMajazi) || 0,
                dalil: formData.dalil || '',
                shahrZendegi: formData.shahrZendegi || '',
                uploadElmi: formData.uploadElmi || '',
                hamjavar1s: formData.items.map(item => ({
                    markazId: item.markazId,
                    inOstan: item.inOstan,
                    faaliatIds: item.faaliatIds,
                    tedadRoozElmi: item.tedadRoozElmi,
                    tedadRoozRaeis: null,
                    tedadRoozKhadamat: null,
                    tedadRoozMoaven: null
                }))
            };

            const response = await api.post('/Hamjavar/create', payload);

            if (response.data?.success) {
                toast.success('درخواست با موفقیت ثبت شد');
                navigate('/dashboard/hamjavar');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ثبت درخواست');
        }
    };

    // ============================================================
    // دریافت نام مرکز
    // ============================================================
    const getMarkazName = (id) => {
        const markaz = markazList?.find(m => m.id === id);
        return markaz?.naamMarkaz || '-';
    };

    // ============================================================
    // دریافت نام فعالیت
    // ============================================================
    const getFaaliatName = (id) => {
        // از لیست فعالیت‌های موجود استفاده می‌شود
        return `فعالیت ${id}`; // موقت
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
                        onClick={() => navigate('/dashboard/hamjavar')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">
                        {isMoaven ? 'ایجاد درخواست هم‌جاوری (معاون)' : 'تقاضای تدریس/فعالیت در خارج از مرکز فعلی'}
                    </h4>
                </div>
                <span className="badge bg-info">
                    {isMoaven ? 'نقش: معاون آموزشی استان' : 'نقش: استاد'}
                </span>
            </div>

            {/* ============================================================
                فرم اصلی
                ============================================================ */}
            <div className="card">
                <div className="card-body">
                    {/* ============================================================
                        انتخاب استاد - فقط برای معاون
                        ============================================================ */}
                    {isMoaven && (
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <OstadSelector
                                    label="انتخاب استاد *"
                                    value={formData.ostadId}
                                    onChange={(id) => setFormData(prev => ({ ...prev, ostadId: id }))}
                                    required={true}
                                    onlyElmi={true}
                                    placeholder="جستجوی استاد..."
                                />
                                <small className="text-muted">
                                    <i className="bi bi-info-circle me-1"></i>
                                    فقط اساتید استان شما قابل انتخاب هستند
                                </small>
                            </div>
                            <div className="col-md-6">
                                <label className="form-label">کد ترم</label>
                                <input
                                    type="text"
                                    className="form-control bg-light"
                                    value={currentTermCode || ''}
                                    disabled
                                    readOnly
                                />
                                <small className="text-muted">ترم جاری به‌صورت خودکار انتخاب شده است</small>
                            </div>
                        </div>
                    )}

                    {/* ============================================================
                        اطلاعات استاد (نمایشی)
                        ============================================================ */}
                    <h6 className="text-primary">اطلاعات استاد</h6>
                    <hr />
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <label className="form-label text-muted">نام</label>
                            <p className="fw-bold">{ostadInfo?.naam || '-'}</p>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-muted">نام خانوادگی</label>
                            <p className="fw-bold">{ostadInfo?.naamKhanevadegi || '-'}</p>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-muted">کد استادی</label>
                            <p className="fw-bold"><PersianNumber>{ostadInfo?.codeOstadi || '-'}</PersianNumber></p>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-muted">مرکز فعلی</label>
                            <p className="fw-bold">{ostadInfo?.markazName || '-'}</p>
                        </div>
                    </div>

                    {/* ============================================================
                        اطلاعات علمی ترم (نمایشی)
                        ============================================================ */}
                    <h6 className="text-primary mt-3">اطلاعات وضعیت ترمی</h6>
                    <hr />
                    <div className="row mb-3">
                        <div className="col-md-3">
                            <label className="form-label text-muted">آخرین وضعیت</label>
                            <p className="fw-bold">{formData.akharinVazeeat || '-'}</p>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-muted">سمت اجرایی</label>
                            <p className="fw-bold">
                                {formData.isEjeari ? (
                                    <>
                                        <span className="badge bg-success">می‌باشم</span>
                                        <span className="ms-2">{formData.onvanEjraei || ''}</span>
                                    </>
                                ) : (
                                    <span className="badge bg-secondary">نمی‌باشم</span>
                                )}
                            </p>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-muted">نوع</label>
                            <p className="fw-bold">
                                <span className={`badge ${formData.fullTime ? 'bg-success' : 'bg-warning'}`}>
                                    {formData.fullTime ? 'تمام وقت' : 'پاره وقت'}
                                </span>
                            </p>
                        </div>
                        <div className="col-md-3">
                            <label className="form-label text-muted">تعداد واحد موظف</label>
                            <p className="fw-bold">
                                <PersianNumber>{formData.vahedMovazaf || 0}</PersianNumber>
                            </p>
                        </div>
                    </div>

                    {/* ============================================================
                        بخش‌های فقط برای استاد
                        ============================================================ */}
                    {!isMoaven && (
                        <>
                            {/* تایید دستورالعمل */}
                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="agree"
                                        checked={formData.isAgree}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isAgree: e.target.checked }))}
                                        required
                                    />
                                    <label className="form-check-label" htmlFor="agree">
                                        <strong>اینجانب با مطالعه کامل دستورالعمل فوق، تقاضای فعالیت در خارج از مرکز فعلی را دارم.</strong>
                                    </label>
                                </div>
                            </div>

                            {/* انتخاب ترم */}
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <label className="form-label">تقاضا برای ترم <span className="text-danger">*</span></label>
                                    <select
                                        className="form-select"
                                        value={formData.termCode}
                                        onChange={(e) => setFormData(prev => ({ ...prev, termCode: e.target.value }))}
                                        required
                                    >
                                        <option value="">انتخاب ترم...</option>
                                        {termList.map(term => (
                                            <option key={term.codeTerm} value={term.codeTerm}>
                                                {term.onvanTerm} ({term.codeTerm})
                                                {term.vazeeyat && ' ✅'}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* کسری واحد موظف */}
                            <h6 className="text-primary mt-3">پیش‌بینی کسری واحد موظف</h6>
                            <hr />
                            <div className="row mb-3">
                                <div className="col-md-3">
                                    <label className="form-label">کسری واحد موظف</label>
                                    <div className="d-flex gap-3">
                                        <div className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                id="hasKesri"
                                                checked={formData.hasKesri === true}
                                                onChange={() => setFormData(prev => ({ ...prev, hasKesri: true }))}
                                            />
                                            <label className="form-check-label" htmlFor="hasKesri">دارم</label>
                                        </div>
                                        <div className="form-check">
                                            <input
                                                type="radio"
                                                className="form-check-input"
                                                id="noKesri"
                                                checked={formData.hasKesri === false}
                                                onChange={() => setFormData(prev => ({ ...prev, hasKesri: false }))}
                                            />
                                            <label className="form-check-label" htmlFor="noKesri">ندارم</label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {formData.hasKesri && (
                                <div className="row mb-3">
                                    <div className="col-md-4">
                                        <label className="form-label">
                                            پیش‌بینی تکمیل در مرکز محل خدمت <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.tedadVahedMahalKhedmat}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tedadVahedMahalKhedmat: e.target.value }))}
                                            required
                                            min="0"
                                            step="0.5"
                                            placeholder="مثال: 8"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">پیش‌بینی واحد کسری</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light"
                                            value={kesriValue}
                                            disabled
                                            readOnly
                                        />
                                        <small className="text-muted">به‌صورت خودکار محاسبه می‌شود</small>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label">
                                            پیش‌بینی فعالیت حضوری در مراکز دیگر <span className="text-danger">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.tedadVahedHamjavar}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tedadVahedHamjavar: e.target.value }))}
                                            required
                                            min="0"
                                            step="0.5"
                                            placeholder="مثال: 4"
                                        />
                                    </div>
                                    <div className="col-md-4 mt-3">
                                        <label className="form-label">
                                            پیش‌بینی فعالیت مجازی در مراکز دیگر
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.tedadVahedMajazi}
                                            onChange={(e) => setFormData(prev => ({ ...prev, tedadVahedMajazi: e.target.value }))}
                                            min="0"
                                            step="0.5"
                                            placeholder="مثال: 2"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* دلایل تقاضا و شهر سکونت */}
                            <h6 className="text-primary mt-3">دلایل تقاضا</h6>
                            <hr />
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">دلایل تقاضا <span className="text-danger">*</span></label>
                                    <textarea
                                        className="form-control"
                                        rows="2"
                                        value={formData.dalil}
                                        onChange={(e) => setFormData(prev => ({ ...prev, dalil: e.target.value }))}
                                        required
                                        placeholder="دلایل تقاضا را وارد کنید..."
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label">شهر محل سکونت <span className="text-danger">*</span></label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.shahrZendegi}
                                        onChange={(e) => setFormData(prev => ({ ...prev, shahrZendegi: e.target.value }))}
                                        required
                                        placeholder="مثال: شیراز"
                                    />
                                </div>
                            </div>

                            {/* بارگذاری مستندات */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <label className="form-label">بارگذاری مستندات</label>
                                    <input
                                        type="file"
                                        className="form-control"
                                        accept=".jpg,.jpeg,.png,.pdf"
                                        onChange={(e) => setFormData(prev => ({ ...prev, uploadElmi: e.target.files[0] }))}
                                    />
                                    <small className="text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۲ مگابایت
                                    </small>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ============================================================
                        موارد تقاضا (Hamjavar1) - برای همه
                        ============================================================ */}
                    <h6 className={`text-primary ${!isMoaven ? 'mt-3' : ''}`}>
                        موارد تقاضا {!isMoaven && <span className="text-danger">*</span>}
                    </h6>
                    <hr />

                    {/* فرم افزودن آیتم جدید */}
                    <div className="row g-3 mb-3 p-3 border rounded bg-light">
                        <div className="col-md-2">
                            <label className="form-label">داخل/خارج استان <span className="text-danger">*</span></label>
                            <select
                                className="form-select"
                                value={newItem.inOstan}
                                onChange={(e) => setNewItem(prev => ({ ...prev, inOstan: e.target.value === 'true' }))}
                            >
                                {inOstanOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-3">
                            <MarkazSelector
                                label="مرکز پیشنهادی *"
                                value={newItem.markazId}
                                onChange={(value) => setNewItem(prev => ({ ...prev, markazId: value }))}
                                required={true}
                                placeholder="انتخاب مرکز..."
                            />
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">تعداد روز در هفته <span className="text-danger">*</span></label>
                            <input
                                type="number"
                                className="form-control"
                                value={newItem.tedadRoozElmi}
                                onChange={(e) => setNewItem(prev => ({ ...prev, tedadRoozElmi: e.target.value }))}
                                min="1"
                                max="6"
                                required
                                placeholder="۱ تا ۶"
                            />
                            <small className="text-muted">حداقل ۱ و حداکثر ۶</small>
                        </div>

                        <div className="col-md-2">
                            <label className="form-label">نوع فعالیت <span className="text-danger">*</span></label>
                            <select
                                className="form-select"
                                value={newItem.noeAnjam}
                                onChange={(e) => setNewItem(prev => ({ ...prev, noeAnjam: e.target.value, faaliatIds: [] }))}
                                required
                            >
                                <option value="">انتخاب...</option>
                                <option value="1">حضوری</option>
                                <option value="2">مجازی</option>
                                <option value="3">ترکیبی</option>
                            </select>
                        </div>

                        <div className="col-md-3">
                            <FaaliatMultiSelector
                                label="فعالیت‌ها *"
                                value={newItem.faaliatIds}
                                onChange={(ids) => setNewItem(prev => ({ ...prev, faaliatIds: ids }))}
                                noeAnjam={newItem.noeAnjam}
                                required={true}
                                disabled={!newItem.noeAnjam}
                            />
                        </div>

                        <div className="col-md-12 text-end">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAddItem}
                            >
                                <i className="bi bi-plus-circle me-1"></i>
                                افزودن
                            </button>
                        </div>
                    </div>

                    {/* جدول موارد تقاضا */}
                    {formData.items.length > 0 && (
                        <div className="table-responsive">
                            <table className="table table-hover table-striped">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>داخل/خارج استان</th>
                                        <th>مرکز</th>
                                        <th>نوع فعالیت</th>
                                        <th>فعالیت‌ها</th>
                                        <th>تعداد روز</th>
                                        <th>عملیات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, index) => {
                                        const markaz = markazList?.find(m => m.id === item.markazId);
                                        const noeAnjamText = item.noeAnjam === 1 ? 'حضوری' : item.noeAnjam === 2 ? 'مجازی' : 'ترکیبی';
                                        return (
                                            <tr key={item.id}>
                                                <td><PersianNumber>{index + 1}</PersianNumber></td>
                                                <td>
                                                    <span className={`badge ${item.inOstan ? 'bg-success' : 'bg-warning'}`}>
                                                        {item.inOstan ? 'داخل استان' : 'خارج استان'}
                                                    </span>
                                                </td>
                                                <td>{markaz?.naamMarkaz || '-'}</td>
                                                <td>
                                                    <span className="badge bg-info">{noeAnjamText}</span>
                                                </td>
                                                <td>
                                                    <div className="d-flex flex-wrap gap-1">
                                                        {(item.faaliatIds || []).map(id => (
                                                            <span key={id} className="badge bg-secondary">
                                                                {id} {/* در نسخه نهایی نام فعالیت نمایش داده می‌شود */}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td><PersianNumber>{item.tedadRoozElmi}</PersianNumber></td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ============================================================
                        دکمه‌های پایین
                        ============================================================ */}
                    <div className="d-flex gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={
                                isMoaven ? formData.items.length === 0 :
                                    !formData.isAgree || formData.items.length === 0
                            }
                        >
                            <i className="bi bi-save me-1"></i>
                            ثبت موقت
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/dashboard/hamjavar')}
                        >
                            <i className="bi bi-x-lg me-1"></i>
                            خروج
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}