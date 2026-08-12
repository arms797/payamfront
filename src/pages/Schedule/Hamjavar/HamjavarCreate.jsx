// src/pages/Schedule/Hamjavar/HamjavarCreate.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTerm } from '../../../context/TermContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import OstadSelector from '../../../components/common/OstadSelector';
import MarkazSelector from '../../../components/common/MarkazSelector';
import { useConfirm } from '../../../hooks/useConfirm';

export default function HamjavarCreate() {
    const navigate = useNavigate();
    const { id } = useParams();  // ← گرفتن id از مسیر (برای ویرایش)
    const { user, hasPermission } = useAuth();
    const { currentTermCode, termList } = useTerm();
    const { markazList } = useMarkaz();
    const { confirm, ConfirmModal } = useConfirm();

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
        vahedMovazaf: '',
        tedadSaatMovazafi: 40,
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
    // State اطلاعات علمی ترم (فقط برای نمایش)
    // ============================================================
    const [elmiTermData, setElmiTermData] = useState(null);

    // ============================================================
    // 🔥 State مودال افزودن آیتم
    // ============================================================
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // ============================================================
    // 🔥 State فرم آیتم جدید (داخل مودال)
    // ============================================================
    const [itemForm, setItemForm] = useState({
        inOstan: true,
        markazId: '',
        ostanId: '',
        noeAnjam: '',
        faaliatIds: [],
        tedadRoozElmi: ''
    });

    // ============================================================
    // 🔥 لیست فعالیت‌ها (از API)
    // ============================================================
    const [faaliatList, setFaaliatList] = useState([]);
    const [loadingFaaliat, setLoadingFaaliat] = useState(false);

    // ============================================================
    // دریافت لیست فعالیت‌ها
    // ============================================================
    useEffect(() => {
        const fetchFaaliat = async () => {
            setLoadingFaaliat(true);
            try {
                const response = await api.get('/Faaliat/list');
                if (response.data?.success) {
                    setFaaliatList(response.data.data || []);
                }
            } catch (error) {
                console.error('خطا در دریافت فعالیت‌ها:', error);
            } finally {
                setLoadingFaaliat(false);
            }
        };
        fetchFaaliat();
    }, []);

    // ============================================================
    // 🔥 تعیین استان‌های قابل دسترس
    // ============================================================
    const accessibleOstans = useMemo(() => {
        if (!markazList || markazList.length === 0) return [];

        let filteredMarkaz = markazList.filter(m => m.vazeeyat !== false);
        const userOstanCode = user?.markazOstan;
        if (userOstanCode) {
            filteredMarkaz = filteredMarkaz.filter(m => m.codeOstan === userOstanCode);
        }

        const uniqueOstans = filteredMarkaz
            .filter(m => m.codeOstan)
            .reduce((acc, curr) => {
                if (!acc.find(item => item.codeOstan === curr.codeOstan)) {
                    acc.push({ codeOstan: curr.codeOstan, naamOstan: curr.naamOstan });
                }
                return acc;
            }, []);

        return uniqueOstans;
    }, [markazList, user]);

    // ============================================================
    // 🔥 لیست مراکز بر اساس استان انتخاب‌شده (برای خارج استان)
    // ============================================================
    const markazsByOstan = useMemo(() => {
        if (!markazList || !itemForm.ostanId) return [];
        return markazList.filter(m =>
            m.codeOstan === itemForm.ostanId &&
            m.vazeeyat !== false
        );
    }, [markazList, itemForm.ostanId]);

    // ============================================================
    // 🔥 لیست فعالیت‌های فیلتر شده بر اساس نوع انجام
    // ============================================================
    const filteredFaaliat = useMemo(() => {
        if (!itemForm.noeAnjam) return [];
        const noe = parseInt(itemForm.noeAnjam);
        return faaliatList.filter(f =>
            f.vazeeat === true &&
            (f.noeAnjam === noe || f.noeAnjam === 3)
        );
    }, [faaliatList, itemForm.noeAnjam]);

    // ============================================================
    // 🔥 تابع کمکی برای نمایش نام مرکز
    // ============================================================
    const getDisplayName = useCallback((markaz) => {
        if (!markaz) return '';
        if (markaz.level === 2) return 'سازمان مرکزی';
        if (markaz.level === 3) return `ستاد استان ${markaz.naamOstan || ''}`;
        return markaz.naamMarkaz || '';
    }, []);

    // ============================================================
    // دریافت اطلاعات کامل استاد
    // ============================================================
    useEffect(() => {
        const fetchOstadInfo = async () => {
            const appUserId = isMoaven ? formData.ostadId : user?.id;
            if (!appUserId) return;

            try {
                const userResponse = await api.get(`/User/${appUserId}`);
                if (userResponse.data?.success) {
                    const userData = userResponse.data.data;
                    const ostadId = userData.ostadId;

                    if (!ostadId) {
                        console.log('⚠️ این کاربر استاد نیست');
                        return;
                    }

                    const ostadResponse = await api.get(`/Ostad/${ostadId}`);
                    if (ostadResponse.data?.success) {
                        const ostadData = ostadResponse.data.data;
                        setOstadInfo({
                            naam: ostadData.naam || '',
                            naamKhanevadegi: ostadData.naamKhanevadegi || '',
                            codeOstadi: ostadData.codeOstadi || '',
                            markazName: ostadData.markazName || '',
                            martabeElmi: ostadData.martabeElmi || '',
                            noeHamkari: ostadData.noeHamkari || 0,
                            mobile: ostadData.mobile || '',
                            email: ostadData.email || '',
                            markazId: ostadData.markazId || null,
                            markazAsliId: ostadData.markazAsliId || null
                        });
                    }

                    const madrakResponse = await api.get(`/OstadMadrak/by-ostad/${ostadId}`);
                    if (madrakResponse.data?.success) {
                        const madraks = madrakResponse.data.data || [];
                        const pishFarz = madraks.find(m => m.pishFarz === true);
                        if (pishFarz) {
                            setOstadInfo(prev => ({
                                ...prev,
                                reshteh: pishFarz.reshteh || ''
                            }));
                        } else if (madraks.length > 0) {
                            setOstadInfo(prev => ({
                                ...prev,
                                reshteh: madraks[0].reshteh || ''
                            }));
                        }
                    }
                }
            } catch (error) {
                console.error('خطا در دریافت اطلاعات استاد:', error);
            }
        };
        fetchOstadInfo();
    }, [isMoaven, formData.ostadId, user?.id]);

    // ============================================================
    // 🔥 تشخیص حالت ویرایش
    // ============================================================
    const isEditMode = useMemo(() => !!id, [id]);

    // ============================================================
    // دریافت اطلاعات علمی ترم
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
                    setElmiTermData({
                        akharinVazeeat: data.akharinVazeeat || 'مشغول به کار',
                        isEjeari: data.isEjeari ?? false,
                        onvanEjraei: data.onvanEjraei || '',
                        fullTime: data.fullTime ?? true,
                        tedadSaatMovazafi: data.tedadSaatMovazafi || 40
                    });
                    // 🔥 فقط در حالت ایجاد (غیر ویرایش) فرم را پر کن
                    if (!isEditMode) {
                        setFormData(prev => ({
                            ...prev,
                            akharinVazeeat: data.akharinVazeeat || 'مشغول به کار',
                            isEjeari: data.isEjeari ?? false,
                            onvanEjraei: data.onvanEjraei || '',
                            fullTime: data.fullTime ?? true,
                            vahedMovazaf: '',
                            tedadSaatMovazafi: data.tedadSaatMovazafi || 40
                        }));
                    }
                }
            } catch (error) {
                // اگر خطا بود، مقدار پیش‌فرض را نگه دار
            }
        };

        fetchElmiTerm();
    }, [isMoaven, formData.ostadId, user?.id, currentTermCode, isEditMode]);

    // ============================================================
    // 🔥 لیست مراکز داخل استان خود (برای داخل استان)
    // ============================================================
    const insideOstanMarkazs = useMemo(() => {
        if (!markazList || markazList.length === 0) return [];

        const markazId = ostadInfo?.markazId;
        if (!markazId) return [];

        const ostadMarkaz = markazList.find(m => m.id === markazId);
        if (!ostadMarkaz) return [];

        const userOstanCode = ostadMarkaz.codeOstan;
        return markazList.filter(m =>
            m.codeOstan === userOstanCode &&
            m.vazeeyat !== false
        );
    }, [markazList, ostadInfo]);

    // ============================================================
    // محاسبه خودکار کسری واحد
    // ============================================================
    const kesriValue = useMemo(() => {
        const movazaf = parseFloat(formData.vahedMovazaf) || 0;
        const mahalKhedmat = parseFloat(formData.tedadVahedMahalKhedmat) || 0;
        return Math.max(0, movazaf - mahalKhedmat);
    }, [formData.vahedMovazaf, formData.tedadVahedMahalKhedmat]);

    // ============================================================
    // 🔥 باز کردن مودال افزودن آیتم جدید
    // ============================================================
    const openAddModal = () => {
        setEditingItem(null);
        setItemForm({
            inOstan: true,
            markazId: '',
            ostanId: '',
            noeAnjam: '',
            faaliatIds: [],
            tedadRoozElmi: ''
        });
        setShowModal(true);
    };

    // ============================================================
    // 🔥 باز کردن مودال برای ویرایش آیتم
    // ============================================================
    const openEditModal = (item) => {
        setEditingItem(item);
        setItemForm({
            inOstan: item.inOstan,
            markazId: item.markazId,
            ostanId: item.ostanId || '',
            noeAnjam: item.noeAnjam,
            faaliatIds: item.faaliatIds,
            tedadRoozElmi: item.tedadRoozElmi
        });
        setShowModal(true);
    };

    // ============================================================
    // 🔥 بستن مودال
    // ============================================================
    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setItemForm({
            inOstan: true,
            markazId: '',
            ostanId: '',
            noeAnjam: '',
            faaliatIds: [],
            tedadRoozElmi: ''
        });
    };

    // ============================================================
    // 🔥 تغییر رادیو داخل/خارج استان
    // ============================================================
    const handleInOstanChange = (value) => {
        setItemForm(prev => ({
            ...prev,
            inOstan: value,
            markazId: '',
            ostanId: '',
            noeAnjam: '',
            faaliatIds: []
        }));
    };

    // ============================================================
    // 🔥 ذخیره آیتم
    // ============================================================
    const saveItem = () => {
        if (!itemForm.markazId) {
            toast.warning('انتخاب مرکز الزامی است');
            return;
        }

        const tedad = parseInt(itemForm.tedadRoozElmi);
        if (!itemForm.tedadRoozElmi || tedad < 1 || tedad > 6) {
            toast.warning('تعداد روز در هفته باید بین ۱ تا ۶ باشد');
            return;
        }

        if (itemForm.inOstan === true) {
            if (!itemForm.noeAnjam) {
                toast.warning('انتخاب نوع فعالیت الزامی است');
                return;
            }
            if (!itemForm.faaliatIds || itemForm.faaliatIds.length === 0) {
                toast.warning('انتخاب حداقل یک فعالیت الزامی است');
                return;
            }
        }

        if (itemForm.inOstan === false) {
            if (!itemForm.ostanId) {
                toast.warning('انتخاب استان الزامی است');
                return;
            }
        }

        const newItem = {
            id: editingItem?.id || Date.now(),
            inOstan: itemForm.inOstan,
            markazId: parseInt(itemForm.markazId),
            ostanId: itemForm.ostanId || null,
            noeAnjam: itemForm.inOstan === true ? parseInt(itemForm.noeAnjam) : null,
            faaliatIds: itemForm.inOstan === true ? itemForm.faaliatIds : [],
            tedadRoozElmi: parseInt(itemForm.tedadRoozElmi)
        };

        if (editingItem) {
            setFormData(prev => ({
                ...prev,
                items: prev.items.map(item =>
                    item.id === editingItem.id ? newItem : item
                )
            }));
            toast.success('آیتم با موفقیت ویرایش شد');
        } else {
            setFormData(prev => ({
                ...prev,
                items: [...prev.items, newItem]
            }));
            toast.success('آیتم با موفقیت اضافه شد');
        }

        closeModal();
    };

    // ============================================================
    // 🔥 حذف آیتم از لیست
    // ============================================================
    const handleRemoveItem = async (id) => {
        const confirmed = await confirm({
            title: 'هشدار',
            message: 'آیا از حذف این آیتم مطمئن هستید؟'
        });
        if (!confirmed) return;
        setFormData(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
        toast.success('آیتم با موفقیت حذف شد');
    };


    // ============================================================
    // 🔥 دریافت اطلاعات درخواست برای ویرایش
    // ============================================================
    useEffect(() => {
        if (isEditMode && id) {
            const fetchHamjavar = async () => {
                try {
                    const response = await api.get(`/Hamjavar/${id}`);
                    if (response.data?.success) {
                        const data = response.data.data;

                        // 🔥 استفاده از ?? به جای || برای جلوگیری از مشکل 0
                        setFormData({
                            ostadId: data.ostadId ?? '',
                            termCode: data.termCode ?? currentTermCode ?? '',
                            akharinVazeeat: data.akharinVazeeat ?? 'مشغول به کار',
                            isEjeari: data.isEjeari ?? false,
                            onvanEjraei: data.onvanEjraei ?? '',
                            fullTime: data.fullTime ?? true,
                            vahedMovazaf: data.vahedMovazaf ?? '',
                            tedadSaatMovazafi: data.tedadSaatMovazafi ?? 40,
                            tedadVahedMahalKhedmat: data.tedadVahedMahalKhedmat ?? '',
                            tedadVahedHamjavar: data.tedadVahedHamjavar ?? '',
                            tedadVahedMajazi: data.tedadVahedMajazi ?? '',
                            dalil: data.dalil ?? '',
                            shahrZendegi: data.shahrZendegi ?? '',
                            uploadElmi: null,
                            isAgree: true,
                            hasKesri: true,
                            items: data.hamjavar1s?.map(item => ({
                                id: item.id,
                                inOstan: item.inOstan ?? true,
                                markazId: item.markazId ?? '',
                                noeAnjam: item.noeAnjam ?? '',
                                faaliatIds: item.faaliatIds ?? [],
                                tedadRoozElmi: item.tedadRoozElmi ?? ''
                            })) ?? []
                        });

                        console.log('✅ formData تنظیم شد:', formData);

                        // تنظیم اطلاعات استاد
                        if (data.ostadId) {
                            const ostadResponse = await api.get(`/Ostad/${data.ostadId}`);
                            if (ostadResponse.data?.success) {
                                const ostadData = ostadResponse.data.data;
                                setOstadInfo({
                                    naam: ostadData.naam ?? '',
                                    naamKhanevadegi: ostadData.naamKhanevadegi ?? '',
                                    codeOstadi: ostadData.codeOstadi ?? '',
                                    markazName: ostadData.markazName ?? '',
                                    martabeElmi: ostadData.martabeElmi ?? '',
                                    noeHamkari: ostadData.noeHamkari ?? 0,
                                    mobile: ostadData.mobile ?? '',
                                    email: ostadData.email ?? '',
                                    markazId: ostadData.markazId ?? null,
                                    markazAsliId: ostadData.markazAsliId ?? null
                                });
                            }
                        }
                        // 🔥 دریافت اطلاعات علمی ترم برای نمایش
                        const targetUserId = data.userId || data.ostadId;
                        if (targetUserId && data.termCode) {
                            try {
                                const elmiResponse = await api.get('/ElmiTerm/by-user-term', {
                                    params: { userId: targetUserId, termCode: data.termCode }
                                });
                                if (elmiResponse.data?.success) {
                                    setElmiTermData(elmiResponse.data.data);
                                }
                            } catch (e) {
                                console.log('اطلاعات علمی ترم یافت نشد');
                            }
                        }
                    }
                } catch (error) {
                    console.error('خطا در دریافت اطلاعات درخواست:', error);
                    toast.error('خطا در دریافت اطلاعات درخواست');
                }
            };
            fetchHamjavar();
        }
    }, [isEditMode, id, currentTermCode]);

    // ============================================================
    // 🔥 عنوان صفحه
    // ============================================================
    const pageTitle = isEditMode
        ? 'ویرایش درخواست تدریس در سایر مراکز'
        : (isMoaven ? 'ایجاد درخواست تدریس در سایر مراکز (معاون)' : 'تقاضای تدریس/فعالیت در خارج از مرکز فعلی');

    // ============================================================
    // ثبت درخواست
    // ============================================================
    const handleSubmit = async () => {
        try {
            // ============================================================
            // 1️⃣ اعتبارسنجی‌ها
            // ============================================================
            const ostadId = isMoaven ? parseInt(formData.ostadId) : user?.id;
            if (!ostadId || isNaN(ostadId)) {
                toast.warning('شناسه استاد معتبر نیست');
                return;
            }

            if (!formData.termCode) {
                toast.warning('انتخاب ترم الزامی است');
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

            for (const item of formData.items) {
                if (!item.markazId || isNaN(item.markazId)) {
                    toast.warning('مرکز یکی از موارد تقاضا معتبر نیست');
                    return;
                }
                if (!item.tedadRoozElmi || isNaN(item.tedadRoozElmi) || item.tedadRoozElmi < 1 || item.tedadRoozElmi > 6) {
                    toast.warning('تعداد روز یکی از موارد تقاضا باید بین ۱ تا ۶ باشد');
                    return;
                }
            }

            // ============================================================
            // 2️⃣ ایجاد FormData
            // ============================================================
            const formDataToSend = new FormData();

            formDataToSend.append('ostadId', ostadId);
            formDataToSend.append('termCode', formData.termCode);
            formDataToSend.append('vahedMovazaf', parseFloat(formData.vahedMovazaf) || 0);
            formDataToSend.append('tedadVahedMahalKhedmat', parseFloat(formData.tedadVahedMahalKhedmat) || 0);
            formDataToSend.append('tedadVahedHamjavar', parseFloat(formData.tedadVahedHamjavar) || 0);
            formDataToSend.append('tedadVahedMajazi', parseFloat(formData.tedadVahedMajazi) || 0);
            formDataToSend.append('dalil', formData.dalil || '');
            formDataToSend.append('shahrZendegi', formData.shahrZendegi || '');

            if (formData.uploadElmi && formData.uploadElmi instanceof File) {
                formDataToSend.append('uploadElmi', formData.uploadElmi);
            }

            const hamjavar1sData = formData.items.map(item => ({
                markazId: item.markazId,
                inOstan: item.inOstan,
                faaliatIds: item.faaliatIds,
                tedadRoozElmi: item.tedadRoozElmi,
                tedadRoozRaeis: null,
                tedadRoozKhadamat: null,
                tedadRoozMoaven: null
            }));

            formDataToSend.append('hamjavar1sJson', JSON.stringify(hamjavar1sData));

            // ============================================================
            // 3️⃣ ارسال درخواست
            // ============================================================
            const endpoint = isEditMode ? `/Hamjavar/update/${id}` : '/Hamjavar/create';

            const response = await api.put(endpoint, formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data?.success) {
                toast.success(isEditMode ? 'درخواست با موفقیت ویرایش شد' : 'درخواست با موفقیت ثبت شد');
                navigate('/dashboard/tadris-hamjavar-list');
            } else {
                toast.error(response.data?.message || 'خطا در ثبت درخواست');
            }
        } catch (error) {
            console.error('❌ خطای ثبت:', error);

            if (error.response) {
                console.log('📄 داده‌های خطا:', error.response.data);
                console.log('📄 وضعیت خطا:', error.response.status);

                const errorMessage = error.response.data?.message ||
                    error.response.data?.title ||
                    'خطا در ثبت درخواست';
                toast.error(errorMessage);

                if (error.response.data?.errors) {
                    console.log('📄 خطاهای اعتبارسنجی:', error.response.data.errors);
                    const errors = error.response.data.errors;
                    for (const [key, messages] of Object.entries(errors)) {
                        toast.error(`${key}: ${messages.join(', ')}`);
                    }
                }
            } else if (error.request) {
                console.log('📄 درخواست انجام شد ولی پاسخی دریافت نشد');
                toast.error('خطا در ارتباط با سرور');
            } else {
                console.log('📄 خطای ناشناخته:', error.message);
                toast.error(error.message || 'خطا در ثبت درخواست');
            }
        }
    };



    // ============================================================
    // دریافت نام فعالیت
    // ============================================================
    const getFaaliatName = (id) => {
        const faaliat = faaliatList?.find(f => f.id === id);
        return faaliat?.onvan || `فعالیت ${id}`;
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
                        onClick={() => navigate('/dashboard/tadris-hamjavar-list')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0">{pageTitle}</h4>
                </div>
                <span className="badge bg-info">
                    {isEditMode ? 'حالت ویرایش' : (isMoaven ? 'نقش: معاون آموزشی استان' : 'نقش: استاد')}
                </span>
            </div>

            {/* ============================================================    
                فرم اصلی
                ============================================================ */}
            <div className="card">
                <div className="card-body">
                    {/* انتخاب استاد - فقط برای معاون */}
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

                    {/* اطلاعات استاد و وضعیت ترمی */}
                    <div className="card mb-4">
                        <div className="card-header bg-primary text-white">
                            <h6 className="mb-0">
                                <i className="bi bi-person-badge me-2"></i>
                                اطلاعات استاد و وضعیت ترمی
                            </h6>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-6">
                                    <h6 className="text-primary border-bottom pb-2 mb-3">
                                        <i className="bi bi-person me-2"></i>
                                        اطلاعات استاد
                                    </h6>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold text-muted">نام:</div>
                                        <div className="col-8">{ostadInfo?.naam || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold text-muted">نام خانوادگی:</div>
                                        <div className="col-8">{ostadInfo?.naamKhanevadegi || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold text-muted">کد استادی:</div>
                                        <div className="col-8"><PersianNumber>{ostadInfo?.codeOstadi || '-'}</PersianNumber></div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold text-muted">مرکز فعلی:</div>
                                        <div className="col-8">{ostadInfo?.markazName || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold text-muted">مرتبه علمی:</div>
                                        <div className="col-8">{ostadInfo?.martabeElmi || '-'}</div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col-4 fw-bold text-muted">رشته تحصیلی:</div>
                                        <div className="col-8">{ostadInfo?.reshteh || '-'}</div>
                                    </div>
                                </div>

                                {/* ============================================================
    اطلاعات وضعیت ترمی (نمایشی)
    ============================================================ */}
                                <div className="col-md-6">
                                    <h6 className="text-primary border-bottom pb-2 mb-3">
                                        <i className="bi bi-calendar-check me-2"></i>
                                        اطلاعات وضعیت ترمی
                                    </h6>

                                    <div className="row mb-2">
                                        <div className="col-5 fw-bold text-muted">آخرین وضعیت:</div>
                                        <div className="col-7">
                                            {isEditMode ? (elmiTermData?.akharinVazeeat || '-') : (formData.akharinVazeeat || '-')}
                                        </div>
                                    </div>

                                    <div className="row mb-2">
                                        <div className="col-5 fw-bold text-muted">سمت اجرایی:</div>
                                        <div className="col-7">
                                            {isEditMode ? (
                                                elmiTermData?.isEjeari ? (
                                                    <>
                                                        <span className="badge bg-success me-1">دارد</span>
                                                        <span>{elmiTermData?.onvanEjraei || ''}</span>
                                                    </>
                                                ) : (
                                                    <span className="badge bg-secondary">ندارد</span>
                                                )
                                            ) : (
                                                formData.isEjeari ? (
                                                    <>
                                                        <span className="badge bg-success me-1">دارد</span>
                                                        <span>{formData.onvanEjraei || ''}</span>
                                                    </>
                                                ) : (
                                                    <span className="badge bg-secondary">ندارد</span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="row mb-2">
                                        <div className="col-5 fw-bold text-muted">نوع همکاری:</div>
                                        <div className="col-7">
                                            {isEditMode ? (
                                                <span className={`badge ${elmiTermData?.fullTime ? 'bg-success' : 'bg-warning'}`}>
                                                    {elmiTermData?.fullTime ? 'تمام وقت' : 'پاره وقت'}
                                                </span>
                                            ) : (
                                                <span className={`badge ${formData.fullTime ? 'bg-success' : 'bg-warning'}`}>
                                                    {formData.fullTime ? 'تمام وقت' : 'پاره وقت'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="row mb-2">
                                        <div className="col-5 fw-bold text-muted">ساعت موظف هفتگی:</div>
                                        <div className="col-7">
                                            {isEditMode ? (
                                                elmiTermData?.fullTime ? (
                                                    <span className="badge bg-primary">
                                                        <PersianNumber>۴۰</PersianNumber> ساعت
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-info">
                                                        <PersianNumber>{elmiTermData?.tedadSaatMovazafi || '۰'}</PersianNumber> ساعت
                                                    </span>
                                                )
                                            ) : (
                                                formData.fullTime ? (
                                                    <span className="badge bg-primary">
                                                        <PersianNumber>۴۰</PersianNumber> ساعت
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-info">
                                                        <PersianNumber>{formData.tedadSaatMovazafi || '۰'}</PersianNumber> ساعت
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* 🔥 واحد موظف - همیشه از formData (قابل ویرایش) */}
                                    <div className="row mb-2">
                                        <div className="col-5 fw-bold text-muted">واحد موظف:<span className="text-danger">*</span></div>
                                        <div className="col-7">
                                            <input
                                                type="number"
                                                className="form-control form-control-sm"
                                                value={formData.vahedMovazaf}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    vahedMovazaf: e.target.value
                                                }))}
                                                min="0"
                                                step="0.5"
                                                placeholder="واحد موظف"
                                                style={{ maxWidth: '120px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* بخش‌های فقط برای استاد */}
                    {!isMoaven && (
                        <>
                            {/* کارت دستورالعمل */}
                            <div className="card mb-4 border-warning">
                                <div className="card-header bg-warning text-dark">
                                    <h6 className="mb-0">
                                        <i className="bi bi-info-circle me-2"></i>
                                        دستورالعمل تقاضای تدریس/فعالیت در خارج از مرکز فعلی
                                    </h6>
                                </div>
                                <div className="card-body" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <div className="small">
                                        <ol className="mb-0" style={{ paddingRight: '1.5rem', listStyleType: 'persian' }}>
                                            <li className="mb-2">
                                                عضو هیات علمی بایستی موظفی خود را در مرکز محل خود تکمیل نماید.
                                            </li>
                                            <li className="mb-2">
                                                مرکز محل خدمت عضو، مجاز به استفاده از مدرس مدعو در دروس مورد تقاضای
                                                عضو هیات علمی دارای کسری نمی باشد.
                                            </li>
                                            <li className="mb-2">
                                                ملاک ثبت این درخواست، فعالیت حداقل <PersianNumber>6</PersianNumber> ساعت در روز
                                                (یک روز کامل) در مرکز انتخابی، به عنوان موظفی آن روز می باشد.
                                            </li>
                                            <li className="mb-2">
                                                در صورتی که تقاضای حداقل یک روز کامل به عنوان موظفی، خارج از مرکز فعلی خود،
                                                برای فعالیت های مجازی دارید، گزینه فعالیت مجازی داخل یا خارج استان را تکمیل نمایید.
                                            </li>
                                            <li className="mb-0">
                                                در صورتی که تقاضای حداقل یک روز کامل، خارج از مرکز فعلی خود، برای تدریس حضوری
                                                در خارج از استان دارید، بایستی ابتدا درخواست خود را در سامانه گلستان ثبت و پس از
                                                تایید نهایی توسط سازمان، اطلاعات را در قسمت خارج استان - فعالیت حضوری تکمیل نمایید.
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </div>

                            {/* تایید دستورالعمل */}
                            <div className="mb-4">
                                <div className="form-check p-3 bg-light rounded border d-flex align-items-center flex-row-reverse justify-content-end gap-2">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        id="agree"
                                        checked={formData.isAgree}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isAgree: e.target.checked }))}
                                        required
                                        style={{ width: '20px', height: '20px', cursor: 'pointer', flexShrink: 0 }}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="agree" style={{ cursor: 'pointer' }}>
                                        <i className="bi bi-check-circle me-2 text-primary"></i>
                                        اینجانب با مطالعه کامل دستورالعمل فوق، تقاضای فعالیت در خارج از مرکز فعلی را دارم.
                                    </label>
                                </div>
                            </div>

                            {/* انتخاب ترم */}
                            <div className="row mb-3">
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center gap-3">
                                        <label className="form-label mb-0 fw-bold" style={{ whiteSpace: 'nowrap' }}>
                                            تقاضا برای ترم <span className="text-danger">*</span>
                                        </label>
                                        <select
                                            className="form-select"
                                            value={formData.termCode}
                                            onChange={(e) => setFormData(prev => ({ ...prev, termCode: e.target.value }))}
                                            required
                                            style={{ maxWidth: '300px' }}
                                        >
                                            {termList.map(term => (
                                                <option key={term.codeTerm} value={term.codeTerm}>
                                                    <PersianNumber>{term.onvanTerm}</PersianNumber>
                                                    {term.vazeeyat && ' ✅'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* کسری واحد موظف */}
                            <h6 className="text-primary mt-3">پیش‌بینی کسری واحد موظف</h6>
                            <hr />

                            <div className="row mb-3">
                                <div className="col-md-8">
                                    <div className="d-flex align-items-center gap-3">
                                        <label className="form-label mb-0 fw-bold" style={{ whiteSpace: 'nowrap' }}>
                                            پیش‌بینی کسری واحد موظف در مرکز فعلی
                                        </label>
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
                            </div>

                            {formData.hasKesri && (
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <label className="form-label">
                                            پیش‌بینی تکمیل واحد در مرکز استاد <span className="text-danger">*</span>
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
                                    <div className="col-md-3">
                                        <label className="form-label">پیش‌بینی واحد کسری</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light"
                                            value={kesriValue}
                                            disabled
                                            readOnly
                                        />
                                    </div>
                                    <div className="col-md-3">
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
                                    <div className="col-md-3">
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
                                <div className="col-md-12">
                                    <div className="d-flex align-items-center gap-3 flex-wrap">
                                        <label className="form-label mb-0 fw-bold" style={{ whiteSpace: 'nowrap' }}>
                                            بارگذاری مستندات
                                        </label>
                                        <input
                                            type="file"
                                            className="form-control"
                                            accept=".jpg,.jpeg,.png,.pdf"
                                            onChange={(e) => setFormData(prev => ({ ...prev, uploadElmi: e.target.files[0] }))}
                                            style={{ maxWidth: '350px', flexShrink: 0 }}
                                        />
                                        <small className="text-muted">
                                            <i className="bi bi-info-circle me-1"></i>
                                            فرمت‌های مجاز: JPG, PNG, PDF | حداکثر ۲ مگابایت
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* موارد تقاضا (Hamjavar1) */}
                    <div className="mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="text-primary mb-0">
                                <i className="bi bi-list-check me-2"></i>
                                موارد تقاضا
                                {!isMoaven && <span className="text-danger ms-1">*</span>}
                                <span className="badge bg-secondary ms-2">
                                    {formData.items.length} مورد
                                </span>
                            </h6>
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={openAddModal}
                            >
                                <i className="bi bi-plus-circle me-1"></i>
                                افزودن مورد جدید
                            </button>
                        </div>

                        {formData.items.length === 0 ? (
                            <div className="text-center text-muted py-4 border rounded bg-light">
                                <i className="bi bi-inbox fs-2 d-block mb-2"></i>
                                <p>هیچ موردی ثبت نشده است. برای افزودن، دکمه "افزودن مورد جدید" را کلیک کنید.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover table-striped">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>داخل/خارج استان</th>
                                            <th>مرکز</th>
                                            <th>شیوه انجام</th>
                                            <th>فعالیت‌ها</th>
                                            <th>تعداد روز</th>
                                            <th>عملیات</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, index) => {
                                            const markaz = markazList?.find(m => m.id === item.markazId);
                                            const noeAnjamText = item.noeAnjam === 1 ? 'حضوری' : item.noeAnjam === 2 ? 'مجازی' : 'ترکیبی';
                                            const faaliatNames = item.faaliatIds?.map(id => getFaaliatName(id)) || [];

                                            return (
                                                <tr key={item.id}>
                                                    <td><PersianNumber>{index + 1}</PersianNumber></td>
                                                    <td>
                                                        <span className={`badge ${item.inOstan ? 'bg-success' : 'bg-warning'}`}>
                                                            {item.inOstan ? 'داخل استان' : 'خارج استان'}
                                                        </span>
                                                    </td>
                                                    <td>{markaz?.naamMarkaz || '-'}</td>
                                                    <td>{noeAnjamText}</td>
                                                    <td>
                                                        <div className="d-flex flex-wrap gap-1">
                                                            {faaliatNames.map((name, i) => (
                                                                <span key={i} className="badge bg-secondary">{name}</span>
                                                            ))}
                                                            {faaliatNames.length === 0 && <span className="text-muted">-</span>}
                                                        </div>
                                                    </td>
                                                    <td><PersianNumber>{item.tedadRoozElmi}</PersianNumber></td>
                                                    <td>
                                                        <div className="d-flex gap-1">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-warning"
                                                                onClick={() => openEditModal(item)}
                                                                title="ویرایش"
                                                            >
                                                                <i className="bi bi-pencil"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleRemoveItem(item.id)}
                                                                title="حذف"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* ============================================================
                        دکمه ثبت/ویرایش
                        ============================================================ */}
                    <div className="d-flex gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={isMoaven ? formData.items.length === 0 : !formData.isAgree || formData.items.length === 0}
                        >
                            <i className="bi bi-save me-1"></i>
                            {isEditMode ? 'ذخیره تغییرات' : 'ثبت درخواست'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/dashboard/tadris-hamjavar-list')}
                        >
                            <i className="bi bi-x-lg me-1"></i>
                            خروج
                        </button>
                    </div>
                </div>
            </div>

            {/* ============================================================
                مودال افزودن/ویرایش آیتم
                ============================================================ */}
            {
                showModal && (
                    <div
                        className="modal show d-block"
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            zIndex: 1050,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                        onClick={closeModal}
                    >
                        <div
                            className="modal-dialog modal-lg"
                            style={{
                                margin: 0,
                                width: '100%',
                                maxWidth: '800px',
                                maxHeight: '90vh',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="modal-content" style={{ maxHeight: '90vh', overflow: 'auto' }}>
                                <div className="modal-header">
                                    <h5 className="modal-title">
                                        {editingItem ? 'ویرایش مورد تقاضا' : 'افزودن مورد تقاضای جدید'}
                                    </h5>
                                    <button type="button" className="btn-close" onClick={closeModal}></button>
                                </div>
                                <div className="modal-body">
                                    {/* رادیوهای داخل/خارج استان */}
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">داخل/خارج استان <span className="text-danger">*</span></label>
                                        <div className="d-flex gap-4">
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="inOstanTrue"
                                                    checked={itemForm.inOstan === true}
                                                    onChange={() => {
                                                        setItemForm({
                                                            inOstan: true,
                                                            markazId: '',
                                                            ostanId: '',
                                                            noeAnjam: '',
                                                            faaliatIds: [],
                                                            tedadRoozElmi: ''
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor="inOstanTrue">داخل استان</label>
                                            </div>
                                            <div className="form-check">
                                                <input
                                                    type="radio"
                                                    className="form-check-input"
                                                    id="inOstanFalse"
                                                    checked={itemForm.inOstan === false}
                                                    onChange={() => {
                                                        setItemForm({
                                                            inOstan: false,
                                                            markazId: '',
                                                            ostanId: '',
                                                            noeAnjam: '',
                                                            faaliatIds: [],
                                                            tedadRoozElmi: ''
                                                        });
                                                    }}
                                                />
                                                <label className="form-check-label" htmlFor="inOstanFalse">خارج از استان</label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* بخش داخل استان */}
                                    {itemForm.inOstan === true && (
                                        <div className="border p-3 rounded bg-light">
                                            <div className="row g-3">
                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        انتخاب مرکز <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={itemForm.markazId}
                                                        onChange={(e) => setItemForm(prev => ({ ...prev, markazId: e.target.value }))}
                                                        required
                                                    >
                                                        <option value="">انتخاب مرکز...</option>
                                                        {insideOstanMarkazs.length === 0 ? (
                                                            <option value="" disabled>هیچ مرکزی یافت نشد</option>
                                                        ) : (
                                                            insideOstanMarkazs.map(markaz => {
                                                                let displayName = '';
                                                                if (markaz.level === 3) {
                                                                    displayName = `ستاد استان ${markaz.naamOstan || ''}`;
                                                                } else if (markaz.level === 2) {
                                                                    displayName = 'سازمان مرکزی';
                                                                } else {
                                                                    displayName = markaz.naamMarkaz || `مرکز ${markaz.id}`;
                                                                }
                                                                return (
                                                                    <option key={markaz.id} value={markaz.id}>
                                                                        {displayName}
                                                                    </option>
                                                                );
                                                            })
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        تعداد روز در هفته <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={itemForm.tedadRoozElmi}
                                                        onChange={(e) => setItemForm(prev => ({ ...prev, tedadRoozElmi: e.target.value }))}
                                                        min="1"
                                                        max="6"
                                                        required
                                                        placeholder="۱ تا ۶"
                                                    />
                                                    <small className="text-muted">حداقل ۱ و حداکثر ۶</small>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        نوع فعالیت <span className="text-danger">*</span>
                                                    </label>
                                                    <div className="d-flex gap-3">
                                                        <div className="form-check">
                                                            <input
                                                                type="radio"
                                                                className="form-check-input"
                                                                id="noeAnjamHozori"
                                                                checked={itemForm.noeAnjam === '1'}
                                                                onChange={() => setItemForm(prev => ({ ...prev, noeAnjam: '1', faaliatIds: [] }))}
                                                            />
                                                            <label className="form-check-label" htmlFor="noeAnjamHozori">حضوری</label>
                                                        </div>
                                                        <div className="form-check">
                                                            <input
                                                                type="radio"
                                                                className="form-check-input"
                                                                id="noeAnjamMajazi"
                                                                checked={itemForm.noeAnjam === '2'}
                                                                onChange={() => setItemForm(prev => ({ ...prev, noeAnjam: '2', faaliatIds: [] }))}
                                                            />
                                                            <label className="form-check-label" htmlFor="noeAnjamMajazi">مجازی</label>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="col-md-6">
                                                    <label className="form-label">
                                                        فعالیت‌ها <span className="text-danger">*</span>
                                                    </label>
                                                    <div
                                                        className="border rounded p-2 bg-white"
                                                        style={{ maxHeight: '150px', overflowY: 'auto' }}
                                                    >
                                                        {!itemForm.noeAnjam ? (
                                                            <div className="text-muted text-center py-2">
                                                                <i className="bi bi-info-circle me-1"></i>
                                                                ابتدا نوع فعالیت را انتخاب کنید
                                                            </div>
                                                        ) : filteredFaaliat.length === 0 ? (
                                                            <div className="text-muted text-center py-2">
                                                                <i className="bi bi-exclamation-circle me-1"></i>
                                                                هیچ فعالیتی با این نوع انجام یافت نشد
                                                            </div>
                                                        ) : (
                                                            filteredFaaliat.map(f => {
                                                                const isChecked = itemForm.faaliatIds.includes(f.id);
                                                                return (
                                                                    <div key={f.id} className="form-check form-check-inline">
                                                                        <input
                                                                            type="checkbox"
                                                                            className="form-check-input"
                                                                            id={`faaliat_${f.id}`}
                                                                            checked={isChecked}
                                                                            onChange={() => {
                                                                                if (isChecked) {
                                                                                    setItemForm(prev => ({
                                                                                        ...prev,
                                                                                        faaliatIds: prev.faaliatIds.filter(id => id !== f.id)
                                                                                    }));
                                                                                } else {
                                                                                    setItemForm(prev => ({
                                                                                        ...prev,
                                                                                        faaliatIds: [...prev.faaliatIds, f.id]
                                                                                    }));
                                                                                }
                                                                            }}
                                                                        />
                                                                        <label
                                                                            className="form-check-label"
                                                                            htmlFor={`faaliat_${f.id}`}
                                                                            style={{
                                                                                cursor: 'pointer',
                                                                                backgroundColor: isChecked ? '#e3f0ff' : 'transparent',
                                                                                padding: '2px 8px',
                                                                                borderRadius: '4px'
                                                                            }}
                                                                        >
                                                                            {f.onvan}
                                                                        </label>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                    {itemForm.faaliatIds.length > 0 && (
                                                        <small className="text-muted d-block mt-1">
                                                            <i className="bi bi-check-circle me-1 text-success"></i>
                                                            {itemForm.faaliatIds.length} فعالیت انتخاب شده است
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* بخش خارج از استان */}
                                    {itemForm.inOstan === false && (
                                        <div className="border p-3 rounded bg-light">
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <label className="form-label">
                                                        انتخاب استان <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={itemForm.ostanId}
                                                        onChange={(e) => setItemForm(prev => ({
                                                            ...prev,
                                                            ostanId: e.target.value,
                                                            markazId: ''
                                                        }))}
                                                        required
                                                    >
                                                        <option value="">انتخاب استان...</option>
                                                        {accessibleOstans.map(ostan => (
                                                            <option key={ostan.codeOstan} value={ostan.codeOstan}>
                                                                {ostan.naamOstan}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label">
                                                        انتخاب مرکز <span className="text-danger">*</span>
                                                    </label>
                                                    <select
                                                        className="form-select"
                                                        value={itemForm.markazId}
                                                        onChange={(e) => setItemForm(prev => ({ ...prev, markazId: e.target.value }))}
                                                        disabled={!itemForm.ostanId || markazsByOstan.length === 0}
                                                        required
                                                    >
                                                        <option value="">انتخاب مرکز...</option>
                                                        {markazsByOstan.map(markaz => {
                                                            const displayName = getDisplayName(markaz);
                                                            const finalName = displayName || markaz.naamMarkaz || `مرکز ${markaz.id}`;
                                                            return (
                                                                <option key={markaz.id} value={markaz.id}>
                                                                    {finalName}
                                                                </option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>

                                                <div className="col-md-4">
                                                    <label className="form-label">
                                                        تعداد روز در هفته <span className="text-danger">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        className="form-control"
                                                        value={itemForm.tedadRoozElmi}
                                                        onChange={(e) => setItemForm(prev => ({ ...prev, tedadRoozElmi: e.target.value }))}
                                                        min="1"
                                                        max="6"
                                                        required
                                                        placeholder="۱ تا ۶"
                                                    />
                                                    <small className="text-muted">حداقل ۱ و حداکثر ۶</small>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={closeModal}
                                    >
                                        انصراف
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={saveItem}
                                    >
                                        {editingItem ? 'ویرایش' : 'افزودن'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            <ConfirmModal />
        </div >
    );
}