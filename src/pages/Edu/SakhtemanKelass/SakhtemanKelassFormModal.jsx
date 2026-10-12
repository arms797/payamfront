// src/pages/Edu/SakhtemanKelass/SakhtemanKelassFormModal.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';

// ============================================================
// تابع کمکی نمایش نام مرکز
// ============================================================
const getMarkazDisplayName = (markaz) => {
    if (!markaz) return '';
    if (markaz.level === 2) return 'سازمان مرکزی';
    if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`.trim();
    return markaz.naamMarkaz || '';
};

// ============================================================
// کامپوننت لیبل با آیکون قفل
// ============================================================
const LockedLabel = ({ children, required = false }) => (
    <label className="form-label d-flex align-items-center gap-1">
        <span>
            {children} {required && <span className="text-danger">*</span>}
        </span>
        <i
            className="bi bi-lock-fill text-warning"
            style={{ fontSize: '12px' }}
            title="این فیلد در حالت ویرایش قابل تغییر نیست"
        ></i>
    </label>
);

const lockedFieldStyle = {
    backgroundColor: '#e9ecef',
    cursor: 'not-allowed'
};

export default function SakhtemanKelassFormModal({ show, onClose, onSuccess, item }) {
    const isEditMode = !!item;
    const { roles, currentRoleId, user } = useAuth();
    const { markazList } = useMarkaz();

    // ============================================================
    // 🔥 Ref برای جلوگیری از اجرای چندباره مقداردهی اولیه
    // ============================================================
    const initializedRef = useRef(false);

    // ============================================================
    // 1️⃣ Stateهای اصلی
    // ============================================================
    const [formData, setFormData] = useState({
        markazId: '',
        codeSakhteman: '',
        naamSakhteman: '',
        codeClass: '',
        naamClass: '',
        noeClass: '',
        vazeeyat: true,
        zarfiat: '',
        tabagheh: '',
        zarfiatEmtahani: '',
        tedadWhiteboard: '',
        projector: false,
        emkanat: '',
        tozihat: '',
        //telephon: '',
        amoozeshi: true
    });

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ============================================================
    // 2️⃣ Stateهای فیلتر استان/مرکز
    // ============================================================
    const [selectedOstan, setSelectedOstan] = useState('');
    const [selectedMarkaz, setSelectedMarkaz] = useState('');

    // ============================================================
    // 3️⃣ محاسبه codeRole
    // ============================================================
    const codeRole = useMemo(() => {
        if (!roles || !currentRoleId) return 4;
        const activeRole = roles.find(r => r.id === currentRoleId);
        return activeRole?.codeRole || 4;
    }, [roles, currentRoleId]);

    const userMarkazId = useMemo(() => user?.markazId || null, [user]);
    const userMarkazOstanCode = useMemo(() => user?.markazOstan || null, [user]);

    // ============================================================
    // 4️⃣ منطق دسترسی بر اساس سطح مرکز
    // ============================================================
    const canEditMarkaz = useCallback((markaz) => {
        if (!markaz) return false;

        // ادمین سامانه → همه مراکز
        if (codeRole === 1) return true;

        // CodeRole 2 → فقط Level == 2 (سازمان مرکزی)
        if (codeRole === 2) {
            return markaz.level === 2;
        }

        // CodeRole 3 → فقط Level == 3 + استان خودش
        if (codeRole === 3) {
            if (!userMarkazOstanCode) return false;
            return markaz.level === 3 && markaz.codeOstan === userMarkazOstanCode;
        }

        // CodeRole 4 → فقط مرکز خودش
        if (codeRole === 4) {
            if (!userMarkazId) return false;
            return markaz.id === userMarkazId;
        }

        return false;
    }, [codeRole, userMarkazId, userMarkazOstanCode]);

    // ============================================================
    // 5️⃣ لیست مراکز مجاز
    // ============================================================
    const accessibleMarkazs = useMemo(() => {
        if (!markazList) return [];
        return markazList
            .filter(m => m.vazeeyat !== false)
            .filter(canEditMarkaz);
    }, [markazList, canEditMarkaz]);

    const hasAnyAccessibleMarkaz = accessibleMarkazs.length > 0;

    // ============================================================
    // 6️⃣ استان‌های یکتا از مراکز مجاز
    // ============================================================
    const uniqueOstans = useMemo(() => {
        const map = new Map();
        accessibleMarkazs.forEach(m => {
            if (m.codeOstan && m.naamOstan && !map.has(m.codeOstan)) {
                map.set(m.codeOstan, m.naamOstan);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }))
            .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fa'));
    }, [accessibleMarkazs]);

    // ============================================================
    // 7️⃣ مراکز مجاز بر اساس استان انتخاب‌شده
    // ============================================================
    const filteredMarkazes = useMemo(() => {
        if (!selectedOstan) return [];
        return accessibleMarkazs
            .filter(m => m.codeOstan === selectedOstan)
            .sort((a, b) =>
                getMarkazDisplayName(a).localeCompare(getMarkazDisplayName(b), 'fa')
            );
    }, [accessibleMarkazs, selectedOstan]);

    // ============================================================
    // 8️⃣ 🔥 مقداردهی اولیه (فقط یک بار برای هر بار باز شدن مودال)
    // ============================================================
    useEffect(() => {
        // وقتی مودال بسته شد، flag رو ریست کن
        if (!show) {
            initializedRef.current = false;
            return;
        }

        // اگه قبلاً برای این modal مقداردهی شده، دیگه اجرا نکن
        if (initializedRef.current) return;

        // اگه هنوز markazList لود نشده، صبر کن
        if (!markazList || markazList.length === 0) return;

        initializedRef.current = true;

        if (item) {
            // ============================================================
            // حالت ویرایش
            // ============================================================
            setFormData({
                markazId: item.markazId || '',
                codeSakhteman: item.codeSakhteman || '',
                naamSakhteman: item.naamSakhteman || '',
                codeClass: item.codeClass || '',
                naamClass: item.naamClass || '',
                noeClass: item.noeClass || '',
                vazeeyat: item.vazeeyat ?? true,
                zarfiat: item.zarfiat ?? '',
                tabagheh: item.tabagheh ?? '',
                zarfiatEmtahani: item.zarfiatEmtahani ?? '',
                tedadWhiteboard: item.tedadWhiteboard ?? '',
                projector: item.projector ?? false,
                emkanat: item.emkanat || '',
                tozihat: item.tozihat || '',
                //telephon: item.telephon || '',
                amoozeshi: item.amoozeshi ?? true
            });

            const markaz = markazList?.find(m => m.id === item.markazId);
            if (markaz?.codeOstan) {
                setSelectedOstan(markaz.codeOstan);
                setSelectedMarkaz(item.markazId.toString());
            } else {
                setSelectedOstan('');
                setSelectedMarkaz('');
            }
        } else {
            // ============================================================
            // حالت ایجاد
            // ============================================================
            let initialOstan = '';
            let initialMarkaz = '';

            // CodeRole 3 → استان پیش‌فرض = استان کاربر
            if (codeRole === 3 && userMarkazOstanCode) {
                initialOstan = userMarkazOstanCode;
            }

            // CodeRole 4 → مرکز پیش‌فرض = مرکز خودش
            if (codeRole === 4 && userMarkazId) {
                initialMarkaz = userMarkazId.toString();
                const userMarkaz = accessibleMarkazs.find(m => m.id === userMarkazId);
                if (userMarkaz?.codeOstan) {
                    initialOstan = userMarkaz.codeOstan;
                }
            }
            // CodeRole 2 → اگر فقط یک مرکز Level 2 داره، خودکار انتخاب کن
            else if (codeRole === 2) {
                const level2Markazs = accessibleMarkazs.filter(m => m.level === 2);
                if (level2Markazs.length === 1) {
                    initialMarkaz = level2Markazs[0].id.toString();
                    initialOstan = level2Markazs[0].codeOstan || '';
                }
            }
            // CodeRole 3 → اگر فقط یک مرکز Level 3 داره، خودکار انتخاب کن
            else if (codeRole === 3) {
                const level3Markazs = accessibleMarkazs.filter(m => m.level === 3);
                if (level3Markazs.length === 1) {
                    initialMarkaz = level3Markazs[0].id.toString();
                    initialOstan = level3Markazs[0].codeOstan || '';
                }
            }

            setFormData({
                markazId: initialMarkaz,
                codeSakhteman: '',
                naamSakhteman: '',
                codeClass: '',
                naamClass: '',
                noeClass: '',
                vazeeyat: true,
                zarfiat: '',
                tabagheh: '',
                zarfiatEmtahani: '',
                tedadWhiteboard: '',
                projector: false,
                emkanat: '',
                tozihat: '',
                //telephon: '',
                amoozeshi: true
            });
            setSelectedOstan(initialOstan);
            setSelectedMarkaz(initialMarkaz);
        }
        setErrors({});
        setSubmitting(false);
    }, [show, item?.id, markazList, codeRole, userMarkazOstanCode, userMarkazId, accessibleMarkazs]);

    // ============================================================
    // 9️⃣ Escape
    // ============================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !submitting) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, submitting, onClose]);

    // ============================================================
    // 🔟 تغییر فیلدها
    // ============================================================
    const handleChange = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleOstanChange = (e) => {
        setSelectedOstan(e.target.value);
        setSelectedMarkaz('');
        setFormData(prev => ({ ...prev, markazId: '' }));
    };

    const handleMarkazChange = (e) => {
        const value = e.target.value;
        setSelectedMarkaz(value);
        setFormData(prev => ({ ...prev, markazId: value }));
        if (errors.markazId) setErrors(prev => ({ ...prev, markazId: null }));
    };

    // ============================================================
    // 1️⃣1️⃣ اعتبارسنجی
    // ============================================================
    const validate = () => {
        const newErrors = {};
        if (!formData.markazId) newErrors.markazId = 'انتخاب مرکز الزامی است';
        if (!formData.codeSakhteman) newErrors.codeSakhteman = 'کد ساختمان الزامی است';
        if (!formData.naamSakhteman?.trim()) newErrors.naamSakhteman = 'نام ساختمان الزامی است';
        if (!formData.codeClass) newErrors.codeClass = 'کد کلاس الزامی است';
        if (!formData.naamClass?.trim()) newErrors.naamClass = 'نام کلاس الزامی است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================
    // 1️⃣2️⃣ ذخیره
    // ============================================================
    const handleSubmit = async (e) => {
        //e.preventDefault();
        if (!validate()) {
            toast.error('لطفاً خطاهای فرم را برطرف کنید');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                markazId: parseInt(formData.markazId),
                codeSakhteman: parseInt(formData.codeSakhteman),
                naamSakhteman: formData.naamSakhteman.trim(),
                codeClass: parseInt(formData.codeClass),
                naamClass: formData.naamClass.trim(),
                noeClass: formData.noeClass || null,
                vazeeyat: formData.vazeeyat,
                zarfiat: formData.zarfiat !== '' ? parseInt(formData.zarfiat) : null,
                tabagheh: formData.tabagheh !== '' ? parseInt(formData.tabagheh) : null,
                zarfiatEmtahani: formData.zarfiatEmtahani !== '' ? parseInt(formData.zarfiatEmtahani) : null,
                tedadWhiteboard: formData.tedadWhiteboard !== '' ? parseInt(formData.tedadWhiteboard) : null,
                projector: formData.projector,
                emkanat: formData.emkanat || null,
                tozihat: formData.tozihat || null,
                //telephon: formData.telephon || null,
                amoozeshi: formData.amoozeshi
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/SakhtemanKelass/update/${item.id}`, payload);
            } else {
                response = await api.post('/SakhtemanKelass/create', payload);
            }

            if (response.data?.success) {
                toast.success(
                    response.data.message ||
                    (isEditMode ? 'ساختمان/کلاس با موفقیت ویرایش شد' : 'ساختمان/کلاس با موفقیت ایجاد شد')
                );
                setSubmitting(false);
                onSuccess();
            } else {
                toast.error(response.data?.message || 'خطا در ذخیره تغییرات');
                setSubmitting(false);
            }
        } catch (error) {
            console.error('خطا در ذخیره:', error);
            toast.error(error.response?.data?.message || 'خطا در ذخیره تغییرات');
            setSubmitting(false);
        }
    };


    if (!show) return null;

    // ============================================================
    // بررسی عدم دسترسی
    // ============================================================
    const noAccessibleMarkaz = !hasAnyAccessibleMarkaz;

    const sectionStyle = {
        background: '#f8f9fa',
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
    };

    const sectionTitleStyle = {
        fontSize: '14px',
        fontWeight: '600',
        color: '#0d6efd',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: '1px solid #dee2e6'
    };

    // ============================================================
    // هشدار ویرایش
    // ============================================================
    const renderEditWarning = () => {
        if (!isEditMode) return null;
        return (
            <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '12px' }}>
                <i className="bi bi-lock-fill me-2"></i>
                <strong>فیلدهای قفل‌شده:</strong> در حالت ویرایش، فیلدهای هویتی (مرکز، کد و نام ساختمان، کد و نام کلاس، نوع کلاس و طبقه) قابل تغییر نیستند.
                برای تغییر این موارد، لازم است رکورد جدیدی ایجاد کنید.
            </div>
        );
    };

    // ============================================================
    // راهنمای دسترسی
    // ============================================================
    const renderAccessHint = () => {
        if (isEditMode) return null;

        let text = '';
        if (codeRole === 1) {
            text = 'شما به عنوان ادمین سامانه می‌توانید برای همه مراکز (هر سطح) ساختمان/کلاس تعریف کنید';
        } else if (codeRole === 2) {
            text = 'شما فقط می‌توانید برای سازمان مرکزی (Level 2) ساختمان/کلاس تعریف کنید';
        } else if (codeRole === 3) {
            text = 'شما فقط می‌توانید برای ستاد استان خود (Level 3) ساختمان/کلاس تعریف کنید';
        } else if (codeRole === 4) {
            text = 'شما فقط می‌توانید برای مرکز خودتان ساختمان/کلاس تعریف کنید';
        }

        if (!text) return null;

        return (
            <small className="text-muted d-block mt-2">
                <i className="bi bi-info-circle me-1"></i>
                {text}
            </small>
        );
    };

    // ============================================================
    // هشدار عدم دسترسی
    // ============================================================
    const renderNoAccessWarning = () => (
        <div className="alert alert-danger py-3 mb-0">
            <i className="bi bi-shield-x me-2"></i>
            <strong>عدم دسترسی:</strong> شما مجوز ایجاد ساختمان/کلاس برای هیچ مرکزی را ندارید.
            لطفاً با ادمین سامانه تماس بگیرید.
        </div>
    );

    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={submitting ? undefined : onClose}
            ></div>

            <div className="modal fade show d-block" style={{ zIndex: 1055 }} tabIndex="-1">
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ maxHeight: '95vh' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>

                            <div className={`modal-header ${isEditMode ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <h5 className="modal-title">
                                    <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                    {isEditMode
                                        ? `ویرایش: ${item?.naamSakhteman} - ${item?.naamClass}`
                                        : 'ایجاد ساختمان/کلاس جدید'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={onClose}
                                    disabled={submitting}
                                ></button>
                            </div>

                            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>

                                {noAccessibleMarkaz ? (
                                    renderNoAccessWarning()
                                ) : (
                                    <>
                                        {renderEditWarning()}

                                        {/* بخش ۱: مرکز */}
                                        <div style={sectionStyle}>
                                            <div style={sectionTitleStyle}>
                                                <i className="bi bi-geo-alt me-2"></i>
                                                مرکز
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    {isEditMode ? (
                                                        <LockedLabel required>استان</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">
                                                            استان <span className="text-danger">*</span>
                                                        </label>
                                                    )}
                                                    <select
                                                        className="form-select"
                                                        value={selectedOstan}
                                                        onChange={handleOstanChange}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                    >
                                                        <option value="">انتخاب استان...</option>
                                                        {uniqueOstans.map(o => (
                                                            <option key={o.code} value={o.code}>{o.name}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    {isEditMode ? (
                                                        <LockedLabel required>مرکز</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">
                                                            مرکز <span className="text-danger">*</span>
                                                        </label>
                                                    )}
                                                    <select
                                                        className={`form-select ${errors.markazId ? 'is-invalid' : ''}`}
                                                        value={selectedMarkaz}
                                                        onChange={handleMarkazChange}
                                                        disabled={submitting || !selectedOstan || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        title={!selectedOstan && !isEditMode ? 'ابتدا یک استان انتخاب کنید' : ''}
                                                    >
                                                        <option value="">انتخاب مرکز...</option>
                                                        {filteredMarkazes.map(m => (
                                                            <option key={m.id} value={m.id}>{getMarkazDisplayName(m)}</option>
                                                        ))}
                                                    </select>
                                                    {errors.markazId && (
                                                        <div className="invalid-feedback">{errors.markazId}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {renderAccessHint()}
                                        </div>

                                        {/* بخش ۲: ساختمان */}
                                        <div style={sectionStyle}>
                                            <div style={sectionTitleStyle}>
                                                <i className="bi bi-building me-2"></i>
                                                اطلاعات ساختمان
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    {isEditMode ? (
                                                        <LockedLabel required>کد ساختمان</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">
                                                            کد ساختمان <span className="text-danger">*</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        type="number"
                                                        className={`form-control ${errors.codeSakhteman ? 'is-invalid' : ''}`}
                                                        value={formData.codeSakhteman}
                                                        onChange={handleChange('codeSakhteman')}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        placeholder="مثلاً: 1"
                                                    />
                                                    {errors.codeSakhteman && (
                                                        <div className="invalid-feedback">{errors.codeSakhteman}</div>
                                                    )}
                                                    {!isEditMode && (
                                                        <small className="text-muted">
                                                            <i className="bi bi-info-circle me-1"></i>
                                                            اگر این کد قبلاً ثبت شده باشد، نام ساختمان به صورت خودکار از رکورد موجود اعمال می‌شود
                                                        </small>
                                                    )}
                                                </div>

                                                <div className="col-md-8">
                                                    {isEditMode ? (
                                                        <LockedLabel required>نام ساختمان</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">
                                                            نام ساختمان <span className="text-danger">*</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.naamSakhteman ? 'is-invalid' : ''}`}
                                                        value={formData.naamSakhteman}
                                                        onChange={handleChange('naamSakhteman')}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        placeholder="مثلاً: ساختمان مرکزی"
                                                    />
                                                    {errors.naamSakhteman && (
                                                        <div className="invalid-feedback">{errors.naamSakhteman}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* بخش ۳: کلاس */}
                                        <div style={sectionStyle}>
                                            <div style={sectionTitleStyle}>
                                                <i className="bi bi-door-open me-2"></i>
                                                اطلاعات کلاس
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-3">
                                                    {isEditMode ? (
                                                        <LockedLabel required>کد کلاس</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">
                                                            کد کلاس <span className="text-danger">*</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        type="number"
                                                        className={`form-control ${errors.codeClass ? 'is-invalid' : ''}`}
                                                        value={formData.codeClass}
                                                        onChange={handleChange('codeClass')}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        placeholder="مثلاً: 101"
                                                    />
                                                    {errors.codeClass && (
                                                        <div className="invalid-feedback">{errors.codeClass}</div>
                                                    )}
                                                </div>

                                                <div className="col-md-5">
                                                    {isEditMode ? (
                                                        <LockedLabel required>نام کلاس</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">
                                                            نام کلاس <span className="text-danger">*</span>
                                                        </label>
                                                    )}
                                                    <input
                                                        type="text"
                                                        className={`form-control ${errors.naamClass ? 'is-invalid' : ''}`}
                                                        value={formData.naamClass}
                                                        onChange={handleChange('naamClass')}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        placeholder="مثلاً: کلاس 101"
                                                    />
                                                    {errors.naamClass && (
                                                        <div className="invalid-feedback">{errors.naamClass}</div>
                                                    )}
                                                </div>

                                                <div className="col-md-4">
                                                    {isEditMode ? (
                                                        <LockedLabel>نوع کلاس</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">نوع کلاس</label>
                                                    )}
                                                    <input
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.noeClass}
                                                        onChange={handleChange('noeClass')}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        placeholder="مثلاً: درس، آزمایشگاه، کنفرانس..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="row g-3 mt-1">
                                                <div className="col-md-3">
                                                    <label className="form-label">ظرفیت</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.zarfiat}
                                                        onChange={handleChange('zarfiat')}
                                                        disabled={submitting}
                                                        placeholder="تعداد دانشجو"
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    {isEditMode ? (
                                                        <LockedLabel>طبقه</LockedLabel>
                                                    ) : (
                                                        <label className="form-label">طبقه</label>
                                                    )}
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.tabagheh}
                                                        onChange={handleChange('tabagheh')}
                                                        disabled={submitting || isEditMode}
                                                        style={isEditMode ? lockedFieldStyle : undefined}
                                                        placeholder="مثلاً: 1"
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label">ظرفیت امتحانی</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.zarfiatEmtahani}
                                                        onChange={handleChange('zarfiatEmtahani')}
                                                        disabled={submitting}
                                                        placeholder="تعداد صندلی"
                                                    />
                                                </div>

                                                <div className="col-md-3">
                                                    <label className="form-label">تعداد وایت‌برد</label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={formData.tedadWhiteboard}
                                                        onChange={handleChange('tedadWhiteboard')}
                                                        disabled={submitting}
                                                    />
                                                </div>
                                            </div>

                                            <div className="row g-3 mt-1">
                                                <div className="col-md-6">
                                                    <label className="form-label">امکانات</label>
                                                    <textarea
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.emkanat}
                                                        onChange={handleChange('emkanat')}
                                                        disabled={submitting}
                                                        placeholder="مثلاً: نرم افزارهای نصب شده، تجهیزات سخت افزاری و..."
                                                    />
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">توضیحات</label>
                                                    <textarea
                                                        type="text"
                                                        className="form-control"
                                                        value={formData.tozihat}
                                                        onChange={handleChange('tozihat')}
                                                        disabled={submitting}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* بخش ۴: تنظیمات */}
                                        <div style={sectionStyle}>
                                            <div style={sectionTitleStyle}>
                                                <i className="bi bi-sliders me-2"></i>
                                                تنظیمات
                                            </div>

                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label">نوع کلاس</label>
                                                    <select
                                                        className="form-select"
                                                        value={formData.amoozeshi === true ? 'true' : 'false'}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            amoozeshi: e.target.value === 'true'
                                                        }))}
                                                        disabled={submitting}
                                                    >
                                                        <option value="true">آموزشی</option>
                                                        <option value="false">اداری</option>
                                                    </select>
                                                </div>

                                                <div className="col-md-4">
                                                    <div className="form-check form-switch mt-4">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="vazeeyat"
                                                            checked={formData.vazeeyat}
                                                            onChange={handleChange('vazeeyat')}
                                                            disabled={submitting}
                                                        />
                                                        <label className="form-check-label" htmlFor="vazeeyat">
                                                            {formData.vazeeyat ? 'فعال' : 'غیرفعال'}
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="col-md-4">
                                                    <div className="form-check form-switch mt-4">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            id="projector"
                                                            checked={formData.projector}
                                                            onChange={handleChange('projector')}
                                                            disabled={submitting}
                                                        />
                                                        <label className="form-check-label" htmlFor="projector">
                                                            {formData.projector ? 'دارای ویدئو پروژکتور' : 'بدون ویدئو پروژکتور'}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={onClose}
                                    disabled={submitting}
                                >
                                    <i className="bi bi-x-lg me-1"></i>
                                    انصراف
                                </button>
                                <button
                                    type="button"
                                    className={`btn ${isEditMode ? 'btn-warning' : 'btn-primary'}`}
                                    onClick={handleSubmit}
                                    disabled={submitting || noAccessibleMarkaz}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-1"></i>
                                            {isEditMode ? 'ذخیره تغییرات' : 'ایجاد'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
}
