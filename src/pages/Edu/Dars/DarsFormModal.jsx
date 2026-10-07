// src/pages/Edu/Dars/DarsFormModal.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import Select from 'react-select';
import api from '../../../api/axiosConfig';
import { useGrooheAmoozeshi } from '../../../context/GrooheAmoozeshiContext';
import { useReshteh } from '../../../context/ReshtehContext';
import PersianNumber from '../../../components/common/PersianNumber';

// ============================================================
// 🔥 گزینه‌های ثابت
// ============================================================
const vahedOptions = [
    { value: 'teori', label: 'صرفاً تئوری' },
    { value: 'amali', label: 'صرفاً عملی' },
    { value: 'teori_amali', label: 'تئوری عملی' }
];

const termAkhzOptions = [
    { value: '', label: 'فاقد ترم اخذ' },
    ...Array.from({ length: 10 }, (_, i) => ({
        value: String(i),
        label: `ترم ${i}`
    }))
];

// ============================================================
// 🔥 منبع اولیه خالی
// ============================================================
const createEmptyManba = () => ({
    id: 0,
    _tempKey: `temp_${Date.now()}_${Math.random()}`,
    shomareManba: '',
    noeManba: '',
    onvan: '',
    nevisandeh: '',
    motarjem: '',
    salEnteshar: '',
    salEntesharMiladi: '',
    shabak: '',
    nasher: '',
    nobateChap: '',
    vazeeyat: '',
    codePeyvast: '',
    sharhPeyvast: '',
    _expanded: true
});

// ============================================================
// 🔥 کامپوننت اصلی
// ============================================================
export default function DarsFormModal({ show, onClose, onSuccess, item }) {
    const isEditMode = !!item;

    const { grooheList } = useGrooheAmoozeshi();
    const { reshtehList } = useReshteh();

    // ============================================================
    // 🔥 State فرم اصلی
    // ============================================================
    const [formData, setFormData] = useState({
        codeDars: '',
        naamDars: '',
        vahedTeori: '',
        vahedAmali: '',
        saatTeoriOrginal: '',
        saatAmaliOrginal: '',
        saatTeori: '',
        saatAmali: '',
        termAkhz: '',
        noeDars: '',
        noeAzmoon: '',
        reshtehId: '',
        zarfiat: '',
        // فیلترهای آبشاری (فقط برای UI)
        maghta: '',
        daneshkade: '',
        groohe: ''
    });

    const [manbaList, setManbaList] = useState([createEmptyManba()]);

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ============================================================
    // 🔥 لیست مقطع‌ها
    // ============================================================
    const maghtaOptions = [
        { value: '5', label: 'کارشناسی' },
        { value: '10', label: 'کارشناسی ارشد' },
        { value: '15', label: 'دکتری تخصصی' }
    ];

    // ============================================================
    // 🔥 لیست دانشکده‌های یکتا
    // ============================================================
    const uniqueDaneshkades = useMemo(() => {
        if (!grooheList) return [];
        const map = new Map();
        grooheList.forEach(g => {
            if (g.codeDaneshkade && g.naamDaneshkadeh && !map.has(g.codeDaneshkade)) {
                map.set(g.codeDaneshkade, g.naamDaneshkadeh);
            }
        });
        return Array.from(map, ([code, name]) => ({ code, name }))
            .sort((a, b) => parseInt(a.code) - parseInt(b.code));
    }, [grooheList]);

    // ============================================================
    // 🔥 لیست گروه‌های دانشکده انتخاب‌شده
    // ============================================================
    const filteredGroohes = useMemo(() => {
        if (!formData.daneshkade || !grooheList) return [];
        return grooheList.filter(g => g.codeDaneshkade === formData.daneshkade);
    }, [grooheList, formData.daneshkade]);

    // ============================================================
    // 🔥 لیست رشته‌های گروه انتخاب‌شده
    // ============================================================
    const filteredReshtehs = useMemo(() => {
        if (!formData.groohe || !reshtehList) return [];
        return reshtehList.filter(r => r.grooheAmoozeshiId === parseInt(formData.groohe));
    }, [reshtehList, formData.groohe]);

    // ============================================================
    // 🔥 لیست نوع درس‌های یکتا (از API)
    // ============================================================
    const [noeDarsList, setNoeDarsList] = useState([]);
    useEffect(() => {
        const fetchNoeDars = async () => {
            try {
                const response = await api.get('/Dars/noedars-list');
                if (response.data?.success) {
                    setNoeDarsList(response.data.data || []);
                }
            } catch (error) {
                console.error('خطا در دریافت نوع درس‌ها:', error);
            }
        };
        if (show) fetchNoeDars();
    }, [show]);

    // ============================================================
    // 🔥 مقداردهی اولیه
    // ============================================================
    useEffect(() => {
        if (!show) return;

        if (item) {
            // 🔥 حالت ویرایش
            setFormData({
                codeDars: item.codeDars || '',
                naamDars: item.naamDars || '',
                vahedTeori: item.vahedTeori ?? '',
                vahedAmali: item.vahedAmali ?? '',
                saatTeoriOrginal: item.saatTeoriOrginal ?? '',
                saatAmaliOrginal: item.saatAmaliOrginal ?? '',
                saatTeori: item.saatTeori ?? '',
                saatAmali: item.saatAmali ?? '',
                termAkhz: item.termAkhz ?? '',
                noeDars: item.noeDars || '',
                noeAzmoon: item.noeAzmoon || '',
                reshtehId: item.reshtehId || '',
                zarfiat: item.zarfiat ?? '',
                // مقادیر آبشاری رو از رشته استخراج کن
                maghta: '',
                daneshkade: '',
                groohe: ''
            });

            // 🔥 منابع رو کپی کن با حفظ Id
            if (item.manbaList && item.manbaList.length > 0) {
                setManbaList(item.manbaList.map(m => ({
                    id: m.id || 0,
                    _tempKey: `existing_${m.id}`,
                    shomareManba: m.shomareManba || '',
                    noeManba: m.noeManba || '',
                    onvan: m.onvan || '',
                    nevisandeh: m.nevisandeh || '',
                    motarjem: m.motarjem || '',
                    salEnteshar: m.salEnteshar || '',
                    salEntesharMiladi: m.salEntesharMiladi || '',
                    shabak: m.shabak || '',
                    nasher: m.nasher || '',
                    nobateChap: m.nobateChap || '',
                    vazeeyat: m.vazeeyat || '',
                    codePeyvast: m.codePeyvast || '',
                    sharhPeyvast: m.sharhPeyvast || '',
                    _expanded: false
                })));
            } else {
                setManbaList([createEmptyManba()]);
            }

            // 🔥 استخراج مقطع/دانشکده/گروه از رشته فعلی
            if (item.reshtehId && reshtehList && grooheList) {
                const reshteh = reshtehList.find(r => r.id === item.reshtehId);
                if (reshteh) {
                    const groohe = grooheList.find(g => g.id === reshteh.grooheAmoozeshiId);
                    if (groohe) {
                        setFormData(prev => ({
                            ...prev,
                            maghta: reshteh.codeMaghta ? String(reshteh.codeMaghta) : '',
                            daneshkade: groohe.codeDaneshkade || '',
                            groohe: String(groohe.id)
                        }));
                    }
                }
            }
        } else {
            // 🔥 حالت ایجاد
            setFormData({
                codeDars: '',
                naamDars: '',
                vahedTeori: '',
                vahedAmali: '',
                saatTeoriOrginal: '',
                saatAmaliOrginal: '',
                saatTeori: '',
                saatAmali: '',
                termAkhz: '',
                noeDars: '',
                noeAzmoon: '',
                reshtehId: '',
                zarfiat: '',
                maghta: '',
                daneshkade: '',
                groohe: ''
            });
            setManbaList([createEmptyManba()]);
        }
        setErrors({});
        setSubmitting(false);
    }, [show, item?.id, reshtehList, grooheList]);

    // ============================================================
    // 🔥 بستن با Escape
    // ============================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show && !submitting) onClose();
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, submitting, onClose]);

    // ============================================================
    // 🔥 تغییر فیلد اصلی
    // ============================================================
    const handleChange = (field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    // ============================================================
    // 🔥 تغییر فیلتر آبشاری مقطع
    // ============================================================
    const handleMaghtaChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            maghta: value,
            daneshkade: '',
            groohe: '',
            reshtehId: ''
        }));
    };

    // ============================================================
    // 🔥 تغییر فیلتر آبشاری دانشکده
    // ============================================================
    const handleDaneshkadeChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            daneshkade: value,
            groohe: '',
            reshtehId: ''
        }));
    };

    // ============================================================
    // 🔥 تغییر فیلتر آبشاری گروه
    // ============================================================
    const handleGrooheChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            groohe: value,
            reshtehId: ''
        }));
    };

    // ============================================================
    // 🔥 تغییر فیلتر آبشاری رشته (فیلد اصلی)
    // ============================================================
    const handleReshtehChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, reshtehId: value }));
        if (errors.reshtehId) setErrors(prev => ({ ...prev, reshtehId: null }));
    };

    // ============================================================
    // 🔥 تغییر فیلد منبع
    // ============================================================
    const handleManbaChange = (index, field, value) => {
        setManbaList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
        // پاک کردن خطای onvan
        if (field === 'onvan' && errors[`manba_${index}_onvan`]) {
            setErrors(prev => ({ ...prev, [`manba_${index}_onvan`]: null }));
        }
    };

    // ============================================================
    // 🔥 افزودن منبع جدید
    // ============================================================
    const handleAddManba = () => {
        setManbaList(prev => [...prev, createEmptyManba()]);
    };

    // ============================================================
    // 🔥 حذف منبع
    // ============================================================
    const handleRemoveManba = (index) => {
        if (manbaList.length === 1) {
            toast.warning('حداقل یک منبع باید وجود داشته باشد');
            return;
        }
        setManbaList(prev => prev.filter((_, i) => i !== index));
    };

    // ============================================================
    // 🔥 Toggle باز/بسته منبع
    // ============================================================
    const handleToggleManba = (index) => {
        setManbaList(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], _expanded: !updated[index]._expanded };
            return updated;
        });
    };

    // ============================================================
    // 🔥 اعتبارسنجی
    // ============================================================
    const validate = () => {
        const newErrors = {};

        if (!formData.codeDars?.trim()) newErrors.codeDars = 'کد درس الزامی است';
        if (!formData.naamDars?.trim()) newErrors.naamDars = 'نام درس الزامی است';
        if (!formData.reshtehId) newErrors.reshtehId = 'انتخاب رشته الزامی است';

        // بررسی منابع: حداقل یکی باید عنوان داشته باشه
        const hasValidManba = manbaList.some(m => m.onvan?.trim());
        if (!hasValidManba) {
            newErrors.manba = 'حداقل یک منبع باید عنوان داشته باشد';
        }

        // بررسی onvan هر منبعی که پر شده
        manbaList.forEach((m, i) => {
            // اگه هیچ فیلدی از این منبع پر نشده، نادیده بگیر
            const hasAnyData = m.shomareManba || m.noeManba || m.onvan ||
                m.nevisandeh || m.motarjem || m.nasher;
            if (hasAnyData && !m.onvan?.trim()) {
                newErrors[`manba_${i}_onvan`] = 'عنوان منبع الزامی است';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ============================================================
    // 🔥 ذخیره
    // ============================================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) {
            toast.error('لطفاً خطاهای فرم را برطرف کنید');
            return;
        }

        setSubmitting(true);
        try {
            // 🔥 ساخت payload
            const manbaListPayload = manbaList
                .filter(m => m.onvan?.trim())  // فقط منابعی که عنوان دارن
                .map(m => ({
                    id: m.id || 0,  // 🔥 Id رو حفظ کن
                    shomareManba: m.shomareManba || null,
                    noeManba: m.noeManba || null,
                    onvan: m.onvan.trim(),
                    nevisandeh: m.nevisandeh || null,
                    motarjem: m.motarjem || null,
                    salEnteshar: m.salEnteshar || null,
                    salEntesharMiladi: m.salEntesharMiladi || null,
                    shabak: m.shabak || null,
                    nasher: m.nasher || null,
                    nobateChap: m.nobateChap || null,
                    vazeeyat: m.vazeeyat || null,
                    codePeyvast: m.codePeyvast || null,
                    sharhPeyvast: m.sharhPeyvast || null
                }));

            const payload = {
                codeDars: formData.codeDars.trim(),
                naamDars: formData.naamDars.trim(),
                vahedTeori: formData.vahedTeori !== '' ? parseFloat(formData.vahedTeori) : null,
                vahedAmali: formData.vahedAmali !== '' ? parseFloat(formData.vahedAmali) : null,
                saatTeoriOrginal: formData.saatTeoriOrginal !== '' ? parseInt(formData.saatTeoriOrginal) : null,
                saatAmaliOrginal: formData.saatAmaliOrginal !== '' ? parseInt(formData.saatAmaliOrginal) : null,
                saatTeori: formData.saatTeori !== '' ? parseInt(formData.saatTeori) : null,
                saatAmali: formData.saatAmali !== '' ? parseInt(formData.saatAmali) : null,
                termAkhz: formData.termAkhz !== '' ? parseInt(formData.termAkhz) : null,
                noeDars: formData.noeDars || null,
                noeAzmoon: formData.noeAzmoon || null,
                reshtehId: formData.reshtehId ? parseInt(formData.reshtehId) : null,
                zarfiat: formData.zarfiat !== '' ? parseInt(formData.zarfiat) : null,
                manbaList: manbaListPayload
            };

            let response;
            if (isEditMode) {
                response = await api.put(`/Dars/update/${item.id}`, payload);
            } else {
                response = await api.post('/Dars/create', payload);
            }

            if (response.data?.success) {
                toast.success(isEditMode ? 'درس با موفقیت ویرایش شد' : 'درس با موفقیت ایجاد شد');
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

    // ============================================================
    // 🔥 اگه show نباشه، رندر نکن
    // ============================================================
    if (!show) return null;

    // ============================================================
    // 🔥 استایل‌های مشترک
    // ============================================================
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
    // 🔥 رندر
    // ============================================================
    const modalContent = (
        <>
            <div
                className="modal-backdrop fade show"
                style={{ zIndex: 1050 }}
                onClick={submitting ? undefined : onClose}
            ></div>

            <div
                className="modal fade show d-block"
                style={{ zIndex: 1055 }}
                tabIndex="-1"
            >
                <div className="modal-dialog modal-xl modal-dialog-centered">
                    <div className="modal-content" style={{ maxHeight: '95vh' }}>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxHeight: '95vh' }}>

                            {/* ============================================================ */}
                            {/* هدر */}
                            {/* ============================================================ */}
                            <div className={`modal-header ${isEditMode ? 'bg-warning' : 'bg-primary'} text-white`}>
                                <h5 className="modal-title">
                                    <i className={`bi ${isEditMode ? 'bi-pencil-square' : 'bi-plus-circle'} me-2`}></i>
                                    {isEditMode ? `ویرایش درس: ${item?.naamDars}` : 'ایجاد درس جدید'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={onClose}
                                    disabled={submitting}
                                ></button>
                            </div>

                            {/* ============================================================ */}
                            {/* بدنه */}
                            {/* ============================================================ */}
                            <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>

                                {/* ============================================================ */}
                                {/* بخش ۱: اطلاعات اصلی */}
                                {/* ============================================================ */}
                                <div style={sectionStyle}>
                                    <div style={sectionTitleStyle}>
                                        <i className="bi bi-info-circle me-2"></i>
                                        اطلاعات اصلی
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-4">
                                            <label className="form-label">
                                                کد درس <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.codeDars ? 'is-invalid' : ''}`}
                                                value={formData.codeDars}
                                                onChange={handleChange('codeDars')}
                                                disabled={submitting}
                                                placeholder="مثلاً: 1111111"
                                            />
                                            {errors.codeDars && (
                                                <div className="invalid-feedback">{errors.codeDars}</div>
                                            )}
                                        </div>

                                        <div className="col-md-8">
                                            <label className="form-label">
                                                نام درس <span className="text-danger">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`form-control ${errors.naamDars ? 'is-invalid' : ''}`}
                                                value={formData.naamDars}
                                                onChange={handleChange('naamDars')}
                                                disabled={submitting}
                                                placeholder="مثلاً: ریاضی عمومی ۱"
                                            />
                                            {errors.naamDars && (
                                                <div className="invalid-feedback">{errors.naamDars}</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* فیلترهای آبشاری */}
                                    <div className="row g-3 mt-1">
                                        <div className="col-md-3">
                                            <label className="form-label">مقطع</label>
                                            <select
                                                className="form-select"
                                                value={formData.maghta}
                                                onChange={handleMaghtaChange}
                                                disabled={submitting}
                                            >
                                                <option value="">همه مقاطع</option>
                                                {maghtaOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">دانشکده</label>
                                            <select
                                                className="form-select"
                                                value={formData.daneshkade}
                                                onChange={handleDaneshkadeChange}
                                                disabled={submitting}
                                            >
                                                <option value="">همه دانشکده‌ها</option>
                                                {uniqueDaneshkades.map(d => (
                                                    <option key={d.code} value={d.code}>
                                                        {d.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">گروه آموزشی</label>
                                            <select
                                                className="form-select"
                                                value={formData.groohe}
                                                onChange={handleGrooheChange}
                                                disabled={submitting || !formData.daneshkade}
                                            >
                                                <option value="">همه گروه‌ها</option>
                                                {filteredGroohes.map(g => (
                                                    <option key={g.id} value={g.id}>
                                                        {g.onvanGrooheAmoozeshi}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">
                                                رشته <span className="text-danger">*</span>
                                            </label>
                                            <select
                                                className={`form-select ${errors.reshtehId ? 'is-invalid' : ''}`}
                                                value={formData.reshtehId}
                                                onChange={handleReshtehChange}
                                                disabled={submitting || !formData.groohe}
                                            >
                                                <option value="">انتخاب رشته...</option>
                                                {filteredReshtehs.map(r => (
                                                    <option key={r.id} value={r.id}>
                                                        {r.codeReshte} - {r.onvanReshte}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.reshtehId && (
                                                <div className="invalid-feedback">{errors.reshtehId}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ============================================================ */}
                                {/* بخش ۲: اطلاعات واحد و ساعت */}
                                {/* ============================================================ */}
                                <div style={sectionStyle}>
                                    <div style={sectionTitleStyle}>
                                        <i className="bi bi-clock-history me-2"></i>
                                        اطلاعات واحد و ساعت
                                    </div>

                                    <div className="row g-3">
                                        <div className="col-md-2">
                                            <label className="form-label">واحد تئوری</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                className="form-control"
                                                value={formData.vahedTeori}
                                                onChange={handleChange('vahedTeori')}
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label">واحد عملی</label>
                                            <input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                className="form-control"
                                                value={formData.vahedAmali}
                                                onChange={handleChange('vahedAmali')}
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label">ساعت تئوری</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={formData.saatTeori}
                                                onChange={handleChange('saatTeori')}
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label">ساعت عملی</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={formData.saatAmali}
                                                onChange={handleChange('saatAmali')}
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label">ساعت تئوری اورجینال</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={formData.saatTeoriOrginal}
                                                onChange={handleChange('saatTeoriOrginal')}
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="col-md-2">
                                            <label className="form-label">ساعت عملی اورجینال</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={formData.saatAmaliOrginal}
                                                onChange={handleChange('saatAmaliOrginal')}
                                                disabled={submitting}
                                            />
                                        </div>
                                    </div>

                                    <div className="row g-3 mt-1">
                                        <div className="col-md-3">
                                            <label className="form-label">ترم اخذ</label>
                                            <select
                                                className="form-select"
                                                value={formData.termAkhz}
                                                onChange={handleChange('termAkhz')}
                                                disabled={submitting}
                                            >
                                                {termAkhzOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">ظرفیت</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control"
                                                value={formData.zarfiat}
                                                onChange={handleChange('zarfiat')}
                                                disabled={submitting}
                                            />
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">نوع درس</label>
                                            <select
                                                className="form-select"
                                                value={formData.noeDars}
                                                onChange={handleChange('noeDars')}
                                                disabled={submitting}
                                            >
                                                <option value="">انتخاب...</option>
                                                {noeDarsList.map((n, i) => (
                                                    <option key={i} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-md-3">
                                            <label className="form-label">نوع آزمون</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.noeAzmoon}
                                                onChange={handleChange('noeAzmoon')}
                                                disabled={submitting}
                                                placeholder="مثلاً: تستی"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* ============================================================ */}
                                {/* بخش ۳: منابع درسی */}
                                {/* ============================================================ */}
                                <div style={sectionStyle}>
                                    <div
                                        className="d-flex justify-content-between align-items-center"
                                        style={sectionTitleStyle}
                                    >
                                        <span>
                                            <i className="bi bi-book me-2"></i>
                                            منابع درسی
                                            <span className="badge bg-primary ms-2">
                                                {manbaList.length} منبع
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-primary"
                                            onClick={handleAddManba}
                                            disabled={submitting}
                                        >
                                            <i className="bi bi-plus-circle me-1"></i>
                                            افزودن منبع
                                        </button>
                                    </div>

                                    {errors.manba && (
                                        <div className="alert alert-danger py-2 mb-2">
                                            <i className="bi bi-exclamation-circle me-1"></i>
                                            {errors.manba}
                                        </div>
                                    )}

                                    {manbaList.map((manba, index) => (
                                        <div
                                            key={manba._tempKey}
                                            className="card mb-2"
                                            style={{
                                                border: '1px solid #dee2e6',
                                                borderRadius: '6px'
                                            }}
                                        >
                                            {/* هدر کارت منبع */}
                                            <div
                                                className="card-header d-flex justify-content-between align-items-center py-2"
                                                style={{
                                                    background: '#f8f9fa',
                                                    cursor: 'pointer',
                                                    borderRadius: '6px 6px 0 0'
                                                }}
                                                onClick={() => handleToggleManba(index)}
                                            >
                                                <div className="d-flex align-items-center gap-2">
                                                    <i className={`bi ${manba._expanded ? 'bi-chevron-down' : 'bi-chevron-left'}`}></i>
                                                    <strong className="small">
                                                        منبع {index + 1}
                                                        {manba.id > 0 && (
                                                            <span className="badge bg-secondary ms-2" style={{ fontSize: '9px' }}>
                                                                ID: {manba.id}
                                                            </span>
                                                        )}
                                                    </strong>
                                                    {!manba._expanded && manba.onvan && (
                                                        <span className="text-muted small">
                                                            — {manba.onvan}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveManba(index);
                                                    }}
                                                    disabled={submitting || manbaList.length === 1}
                                                    title="حذف منبع"
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            </div>

                                            {/* بدنه کارت منبع */}
                                            {manba._expanded && (
                                                <div className="card-body py-2">
                                                    <div className="row g-2">
                                                        <div className="col-md-6">
                                                            <label className="form-label small mb-1">
                                                                عنوان منبع <span className="text-danger">*</span>
                                                            </label>
                                                            <input
                                                                type="text"
                                                                className={`form-control form-control-sm ${errors[`manba_${index}_onvan`] ? 'is-invalid' : ''}`}
                                                                value={manba.onvan}
                                                                onChange={(e) => handleManbaChange(index, 'onvan', e.target.value)}
                                                                disabled={submitting}
                                                                placeholder="عنوان کتاب یا مقاله"
                                                            />
                                                            {errors[`manba_${index}_onvan`] && (
                                                                <div className="invalid-feedback">
                                                                    {errors[`manba_${index}_onvan`]}
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">شماره منبع</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.shomareManba}
                                                                onChange={(e) => handleManbaChange(index, 'shomareManba', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">کد پیوست</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.codePeyvast}
                                                                onChange={(e) => handleManbaChange(index, 'codePeyvast', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">نوع منبع</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.noeManba}
                                                                onChange={(e) => handleManbaChange(index, 'noeManba', e.target.value)}
                                                                disabled={submitting}
                                                                placeholder="کتاب/مقاله/..."
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">نویسنده</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.nevisandeh}
                                                                onChange={(e) => handleManbaChange(index, 'nevisandeh', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">مترجم</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.motarjem}
                                                                onChange={(e) => handleManbaChange(index, 'motarjem', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">ناشر</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.nasher}
                                                                onChange={(e) => handleManbaChange(index, 'nasher', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-2">
                                                            <label className="form-label small mb-1">سال انتشار</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.salEnteshar}
                                                                onChange={(e) => handleManbaChange(index, 'salEnteshar', e.target.value)}
                                                                disabled={submitting}
                                                                placeholder="1400"
                                                            />
                                                        </div>

                                                        <div className="col-md-2">
                                                            <label className="form-label small mb-1">سال میلادی</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.salEntesharMiladi}
                                                                onChange={(e) => handleManbaChange(index, 'salEntesharMiladi', e.target.value)}
                                                                disabled={submitting}
                                                                placeholder="2021"
                                                            />
                                                        </div>

                                                        <div className="col-md-2">
                                                            <label className="form-label small mb-1">نوبت چاپ</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.nobateChap}
                                                                onChange={(e) => handleManbaChange(index, 'nobateChap', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">شابک</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.shabak}
                                                                onChange={(e) => handleManbaChange(index, 'shabak', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>

                                                        <div className="col-md-3">
                                                            <label className="form-label small mb-1">وضعیت</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.vazeeyat}
                                                                onChange={(e) => handleManbaChange(index, 'vazeeyat', e.target.value)}
                                                                disabled={submitting}
                                                                placeholder="منتشر شده/..."
                                                            />
                                                        </div>

                                                        <div className="col-md-6">
                                                            <label className="form-label small mb-1">شرح پیوست</label>
                                                            <input
                                                                type="text"
                                                                className="form-control form-control-sm"
                                                                value={manba.sharhPeyvast}
                                                                onChange={(e) => handleManbaChange(index, 'sharhPeyvast', e.target.value)}
                                                                disabled={submitting}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ============================================================ */}
                            {/* فوتر */}
                            {/* ============================================================ */}
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
                                    type="submit"
                                    className={`btn ${isEditMode ? 'btn-warning' : 'btn-primary'}`}
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-check-lg me-1"></i>
                                            {isEditMode ? 'ذخیره تغییرات' : 'ایجاد درس'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(modalContent, document.body);
}