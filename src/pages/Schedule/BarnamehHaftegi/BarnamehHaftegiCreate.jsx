// src/pages/Schedule/BarnamehHaftegi/BarnamehHaftegiCreate.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { useLookup } from '../../../context/LookupContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import CenterModal from './modals/CenterModal';
import ActivityModal from './modals/ActivityModal';
import { useAlert } from '../../../hooks/useAlert';

export default function BarnamehHaftegiCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { markazList, loading: markazLoading } = useMarkaz();
    const { termList, currentTermCode } = useTerm();
    const { days, hours, faaliats, getDayTitle, getFaaliatName,
        getFaaliatColor, haftegiExceptionsList, faaliatGroupList } = useLookup();
    const { confirm, ConfirmModal } = useConfirm();
    const { alert, alertModal } = useAlert();

    // ============================================================
    // Stateهای اصلی
    // ============================================================
    //const [selectedTerm, setSelectedTerm] = useState(currentTermCode || '');
    const [schedule, setSchedule] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [ostadId, setOstadId] = useState(user?.ostadId || null);
    const [ostadInfo, setOstadInfo] = useState(null);
    const [ostadMarkazId, setOstadMarkazId] = useState(null);
    const [ostadOstanCode, setOstadOstanCode] = useState(null);
    const [allowedMarkazIds, setAllowedMarkazIds] = useState([]);
    const [permittedMarkazs, setPermittedMarkazs] = useState([]); // لیست کامل مراکز مجاز با جزئیات
    const [requiredSessions, setRequiredSessions] = useState(20);
    const [isElmiOstad, setIsElmiOstad] = useState(false);
    const [isMadove, setIsMadove] = useState(false);
    const [isHeyatElmiGheyrePayamNoor, setIsHeyatElmiGheyrePayamNoor] = useState(false);


    const location = useLocation();
    // مقدار اولیه ترم: از state اگر وجود داشت، وگرنه ترم جاری
    const initialTermCode = location.state?.termCode || currentTermCode || '';
    const [selectedTerm, setSelectedTerm] = useState(initialTermCode);

    // ============================================================
    // Stateهای مودال مرکز
    // ============================================================
    const [showCenterModal, setShowCenterModal] = useState(false);
    const [centerModalData, setCenterModalData] = useState({
        dayCode: null,
        selectedMarkazId: null
    });

    // ============================================================
    // Stateهای مودال فعالیت
    // ============================================================
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [activityModalData, setActivityModalData] = useState({
        dayCode: null,
        hourCode: null,
        currentFaaliatId: null,
        currentMarkazId: null
    });
    const [activityForm, setActivityForm] = useState({
        mode: 'hozoory',
        markazId: '',
        ostanId: '',
        faaliatId: '',
        allowedFaaliats: []
    });

    // ============================================================
    // بررسی مجوز (فقط استاد)
    // ============================================================
    if (user?.currentRoleName !== 'استاد') {
        return (
            <div className="alert alert-warning text-center mt-5">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                فقط اساتید می‌توانند برنامه هفتگی ایجاد کنند
            </div>
        );
    }

    useEffect(() => {
        if (!selectedTerm) {
            toast.warning('لطفاً ابتدا یک ترم را در صفحه لیست انتخاب کنید');
            navigate('/dashboard/barnameh-haftegi-list');
        }
    }, [selectedTerm, navigate]);

    // ============================================================
    // دریافت مرکز و استان استاد
    // ============================================================
    useEffect(() => {
        if (user?.markazId) {
            setOstadMarkazId(user.markazId);
            const markaz = markazList?.find(m => m.id === user.markazId);
            if (markaz) {
                setOstadOstanCode(markaz.codeOstan);
            }
        }
    }, [user, markazList]);

    // دریافت آیدی استاد از جدول کاربران برای استفاده از جدول استاد
    useEffect(() => {
        if (!user?.id) return;

        const fetchOstadId = async () => {
            try {
                const response = await api.get(`/User/${user.id}`);
                if (response.data?.success) {
                    const data = response.data.data;
                    if (data?.ostadId) {
                        setOstadId(data.ostadId);
                    }
                }
            } catch (error) {
                console.error('خطا در دریافت ostadId:', error);
            }
        };

        fetchOstadId();
    }, [user?.id]);

    // ============================================================
    // دریافت اطلاعات استاد
    // ============================================================
    useEffect(() => {
        const fetchOstadInfo = async () => {
            if (!ostadId) return;
            try {
                const response = await api.get(`/Ostad/${ostadId}`);
                if (response.data?.success) {
                    const data = response.data.data;
                    setOstadInfo(data);
                    setIsElmiOstad(data.noeHamkari === 1);
                    setIsMadove(data.noeHamkari === 3);
                    setIsHeyatElmiGheyrePayamNoor(data.noeHamkari === 2 || data.noeHamkari === 4);
                }
            } catch (error) {
                console.error('خطا در دریافت اطلاعات استاد:', error);
                toast.error('خطا در دریافت اطلاعات استاد');
            }
        };
        fetchOstadInfo();
    }, [ostadId]);

    // ============================================================
    // دریافت مراکز مجاز از همجوار1
    // ============================================================
    useEffect(() => {
        if (!ostadId || !selectedTerm) {
            return;
        }

        const fetchPermittedMarkazs = async () => {
            try {
                const response = await api.get(`/BarnamehHaftegi/permitted-markazs`, {
                    params: { ostadId, termCode: selectedTerm }
                });
                if (response.data?.success) {
                    //console.log('📊 داده‌های مراکز مجاز از بک‌اند:', response.data.data);
                    setPermittedMarkazs(response.data.data);
                    //console.log('permitted :',response.data.data)
                    const ids = response.data.data.map(item => item.markazId);
                    setAllowedMarkazIds(ids);
                } else {
                    console.warn('⚠️ Response not successful:', response.data);
                }
            } catch (error) {
                console.error('❌ خطا در دریافت مراکز مجاز:', error);
            }
        };

        fetchPermittedMarkazs();
    }, [ostadId, selectedTerm]);

    // ============================================================
    // دریافت ساعت موظفی
    // ============================================================
    useEffect(() => {
        if (!ostadId || !selectedTerm) return;

        const fetchRequiredHours = async () => {
            try {
                const response = await api.get(`/BarnamehHaftegi/required-hours`, {
                    params: { ostadId, termCode: selectedTerm }
                });
                if (response.data?.success) {
                    const hours = response.data.data || 40;
                    setRequiredSessions(Math.ceil(hours / 2));
                }
            } catch (error) {
                console.error('خطا در دریافت ساعت موظفی:', error);
            }
        };

        fetchRequiredHours();
    }, [ostadId, selectedTerm]);

    // ============================================================
    // محاسبه آمار
    // ============================================================
    const stats = useMemo(() => {
        let totalSessions = 0;
        const daysWithActivity = new Set();

        Object.keys(schedule).forEach(dayCode => {
            const day = schedule[dayCode];
            if (!day) return;

            let daySessions = 0;
            Object.values(day.hours || {}).forEach(cell => {
                if (cell?.faaliatId) {
                    totalSessions++;
                    daySessions++;
                }
            });

            if (daySessions > 0) {
                daysWithActivity.add(dayCode);
            }
        });

        const totalDays = daysWithActivity.size;
        const isComplete = totalSessions >= requiredSessions && totalDays >= 5;

        /*console.log('📊 آمار:', {
            totalSessions,
            totalDays,
            requiredSessions,
            isComplete,
            daysWithActivity: Array.from(daysWithActivity)
        });*/

        return { totalSessions, totalDays, requiredSessions, isComplete };
    }, [schedule, requiredSessions]);
    // ============================================================
    // دریافت لیست مراکز قابل انتخاب (بر اساس قوانین)
    // ============================================================
    const getAvailableMarkazs = useCallback(() => {
        if (!markazList || !ostadOstanCode) return [];

        // ============================================================
        // اگر استاد هیات علمی پیام نور نیست (noeHamkari !== 1)
        // تمام مراکز Level 4 استان خودش را ببیند
        // ============================================================
        const isNotElmiOstad = ostadInfo?.noeHamkari !== 1;

        if (isNotElmiOstad) {
            // همه مراکز Level 4 در استان استاد
            return markazList.filter(m =>
                m.vazeeyat === true &&
                m.codeOstan === ostadOstanCode &&
                m.level === 4
            );
        }

        // ============================================================
        // قوانین برای هیات علمی پیام نور (noeHamkari === 1)
        // ============================================================
        let available = markazList.filter(m =>
            m.vazeeyat === true &&
            m.codeOstan === ostadOstanCode &&
            (m.level === 4 || m.level === 3) // مراکز و ستاد استان
        );

        // مراکز مجاز از Hamjavar1 (می‌توانند خارج از استان باشند)
        if (allowedMarkazIds && allowedMarkazIds.length > 0) {
            const permittedFromHamjavar = markazList.filter(m =>
                m.vazeeyat === true &&
                allowedMarkazIds.includes(m.id)
            );
            permittedFromHamjavar.forEach(m => {
                if (!available.some(a => a.id === m.id)) {
                    available.push(m);
                }
            });
        }

        // مرکز اصلی استاد
        const mainMarkaz = markazList.find(m => m.id === ostadMarkazId);
        if (mainMarkaz && mainMarkaz.vazeeyat === true) {
            if (!available.some(a => a.id === mainMarkaz.id)) {
                available.push(mainMarkaz);
            }
        }

        // فیلتر نهایی برای هیات علمی
        if (isElmiOstad && !stats.isComplete) {
            return available.filter(m =>
                m.id === ostadMarkazId ||
                allowedMarkazIds.includes(m.id)
            );
        }

        return available;
    }, [markazList, ostadOstanCode, ostadMarkazId, allowedMarkazIds, isElmiOstad, stats.isComplete, ostadInfo?.noeHamkari]);

    /*
    const getAvailableMarkazs = useCallback(() => {
        if (!markazList || !ostadOstanCode) return [];

        let available = markazList.filter(m =>
            m.vazeeyat === true && m.codeOstan === ostadOstanCode
        );

        if (isElmiOstad) {
            const mainMarkazId = ostadMarkazId;
            if (stats.isComplete) {
                return available;
            }
            return available.filter(m =>
                m.id === mainMarkazId || allowedMarkazIds.includes(m.id)
            );
        }

        return available;
    }, [markazList, ostadOstanCode, ostadMarkazId, allowedMarkazIds, isElmiOstad, stats.isComplete]);
*/
    // ============================================================
    // مقداردهی اولیه جدول
    // ============================================================
    useEffect(() => {
        if (!days.length || !hours.length || !ostadMarkazId) return;

        const activeDays = days.filter(d => d.isActive);
        const activeHours = hours.filter(h => h.hozoori || h.majazi);

        const initialSchedule = {};
        activeDays.forEach(day => {
            initialSchedule[day.code] = {
                markazId: ostadMarkazId,
                hours: {}
            };
            activeHours.forEach(hour => {
                initialSchedule[day.code].hours[hour.codeSaat] = {
                    faaliatId: null,
                    markazId: null
                };
            });
        });
        setSchedule(initialSchedule);
    }, [days, hours, ostadMarkazId]);

    // ============================================================
    // لیست استان‌های دارای مرکز مجازی
    // ============================================================
    const virtualOstans = useMemo(() => {
        if (!markazList) return [];
        const ostanMap = new Map();
        markazList.forEach(m => {
            if (m.vazeeyat && (m.noeMarkaz === 2 || m.noeMarkaz === 3) && m.codeOstan && m.naamOstan) {
                if (!ostanMap.has(m.codeOstan)) {
                    ostanMap.set(m.codeOstan, m.naamOstan);
                }
            }
        });
        // مرتب‌سازی بر اساس نام استان
        return Array.from(ostanMap, ([code, name]) => ({ code, name }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [markazList]);

    // ============================================================
    // توابع مودال مرکز
    // ============================================================
    const openCenterModal = (dayCode, currentMarkazId) => {
        // 🔥 بررسی اینکه آیا این روز فعالیت دارد
        const day = schedule[dayCode];
        if (!day) return;

        const hasActivity = Object.values(day.hours || {}).some(cell => cell?.faaliatId);

        if (hasActivity) {
            toast.warning(
                'برای تغییر مرکز لطفاً ابتدا فعالیت‌های این روز را حذف کنید و سپس مرکز را تغییر دهید.'
            );
            return; // ← مودال باز نمی‌شود
        }

        // اگر فعالیتی نبود، مودال را باز کن
        setCenterModalData({
            dayCode,
            selectedMarkazId: currentMarkazId || null
        });
        setShowCenterModal(true);
    };

    const handleCenterModalSave = () => {
        const { dayCode, selectedMarkazId } = centerModalData;
        if (!selectedMarkazId) return;

        setSchedule(prev => ({
            ...prev,
            [dayCode]: {
                ...prev[dayCode],
                markazId: selectedMarkazId
            }
        }));

        setShowCenterModal(false);
    };
    // ============================================================
    // توابع مودال فعالیت
    // ============================================================
    const openActivityModal = (dayCode, hourCode, currentFaaliatId, currentMarkazId) => {
        const dayMarkazId = schedule[dayCode]?.markazId;
        const numericMarkazId = dayMarkazId ? parseInt(dayMarkazId) : null;

        let baseFaaliats = [];

        if (faaliats && faaliats.length > 0 && numericMarkazId) {
            const markaz = markazList?.find(m => m.id === numericMarkazId);
            if (markaz) {
                baseFaaliats = faaliats.filter(f =>
                    f.vazeeat === true &&
                    (f.noeAnjam === 1 || f.noeAnjam === 3)
                );

                // ============================================================
                // اگر استاد هیات علمی پیام نور نیست (noeHamkari !== 1)
                // فقط فعالیت‌های isMadove === true
                // ============================================================
                const isNotElmiOstad = ostadInfo?.noeHamkari !== 1;

                if (isNotElmiOstad) {
                    baseFaaliats = baseFaaliats.filter(f => f.isMadove === true);
                } else {
                    // قوانین هیات علمی پیام نور
                    const isMainMarkaz = ostadInfo?.markazId === numericMarkazId;
                    const isOutsideOstan = markaz.codeOstan !== ostadOstanCode;

                    if (isMainMarkaz) {
                        // هیچ فیلتر اضافی
                    } else if (isOutsideOstan) {
                        // هیچ فیلتر اضافی
                    } else {
                        const permittedMarkaz = permittedMarkazs.find(p => p.markazId === numericMarkazId);
                        if (permittedMarkaz?.allowedFaaliatIds && permittedMarkaz.allowedFaaliatIds.length > 0) {
                            baseFaaliats = baseFaaliats.filter(f =>
                                permittedMarkaz.allowedFaaliatIds.includes(f.id)
                            );
                        } else {
                            baseFaaliats = [];
                        }
                    }
                }
            }
        }
        //console.log('baseFaaliats:', baseFaaliats)
        const allowedFaaliats = getAllowedFaaliats(dayCode, hourCode, baseFaaliats);

        setActivityModalData({
            dayCode,
            hourCode,
            currentFaaliatId: currentFaaliatId || null,
            currentMarkazId: currentMarkazId || null
        });

        setActivityForm({
            mode: 'hozoory',
            markazId: currentMarkazId || dayMarkazId || '',
            ostanId: user?.markazOstan || '',
            faaliatId: currentFaaliatId || '',
            allowedFaaliats: allowedFaaliats
        });

        setShowActivityModal(true);
    };

    const handleActivityModalSave = () => {
        const { dayCode, hourCode } = activityModalData;
        const { mode, markazId, faaliatId, allowedFaaliats } = activityForm;

        if (!faaliatId) {
            toast.warning('لطفاً یک فعالیت انتخاب کنید');
            return;
        }

        // 🔥 بررسی اینکه آیا فعالیت انتخاب‌شده در لیست مجاز است
        const isAllowed = allowedFaaliats.some(f => f.id === parseInt(faaliatId));
        if (!isAllowed) {
            toast.warning('این فعالیت به دلیل قوانین استثنا در این ساعت ممنوع است');
            return;
        }

        if (mode === 'hozoory' && !markazId) {
            toast.warning('لطفاً مرکز را انتخاب کنید');
            return;
        }

        if (mode === 'majazi' && !markazId) {
            toast.warning('لطفاً مرکز را انتخاب کنید');
            return;
        }

        setSchedule(prev => ({
            ...prev,
            [dayCode]: {
                ...prev[dayCode],
                hours: {
                    ...prev[dayCode]?.hours,
                    [hourCode]: {
                        faaliatId: parseInt(faaliatId),
                        markazId: markazId ? parseInt(markazId) : null
                    }
                }
            }
        }));

        setShowActivityModal(false);
        toast.success('فعالیت با موفقیت انتخاب شد');
    };

    // فعالیت های مجاز
    const updateAllowedFaaliats = (markazId, isVirtual) => {
        const numericMarkazId = markazId ? parseInt(markazId) : null;
        const { dayCode, hourCode } = activityModalData;

        if (!faaliats || faaliats.length === 0 || !dayCode || !hourCode) {
            setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
            return;
        }

        const markaz = markazList?.find(m => m.id === numericMarkazId);
        if (!markaz) {
            setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
            return;
        }

        // پیدا کردن اطلاعات مرکز مجاز از لیست permittedMarkazs
        const permittedMarkaz = permittedMarkazs.find(p => p.markazId === numericMarkazId);

        // تشخیص نوع مرکز
        const isMainMarkaz = ostadInfo?.markazId === numericMarkazId;
        const isOutsideOstan = markaz.codeOstan !== ostadOstanCode;

        // ============================================================
        // فیلتر اولیه بر اساس نوع انجام (حضوری/مجازی)
        // ============================================================
        let baseFaaliats = faaliats.filter(f => f.vazeeat === true);

        if (isVirtual) {
            baseFaaliats = baseFaaliats.filter(f => f.noeAnjam === 2 || f.noeAnjam === 3);
        } else {
            baseFaaliats = baseFaaliats.filter(f => f.noeAnjam === 1 || f.noeAnjam === 3);
        }

        // ============================================================
        // اگر استاد هیات علمی پیام نور نیست (noeHamkari !== 1)
        // فقط فعالیت‌های isMadove === true
        // ============================================================
        const isNotElmiOstad = ostadInfo?.noeHamkari !== 1;

        if (isNotElmiOstad) {
            baseFaaliats = baseFaaliats.filter(f => f.isMadove === true);
            const allowed = getAllowedFaaliats(dayCode, hourCode, baseFaaliats);
            setActivityForm(prev => ({ ...prev, allowedFaaliats: allowed }));
            return;
        }

        // ============================================================
        // قوانین هیات علمی پیام نور (noeHamkari === 1)
        // ============================================================
        if (isVirtual) {
            // هیچ فیلتر اضافی
        } else if (isMainMarkaz) {
            // هیچ فیلتر اضافی
        } else if (isOutsideOstan) {
            // هیچ فیلتر اضافی
        } else if (permittedMarkaz) {
            if (permittedMarkaz.allowedFaaliatIds && permittedMarkaz.allowedFaaliatIds.length > 0) {
                baseFaaliats = baseFaaliats.filter(f =>
                    permittedMarkaz.allowedFaaliatIds.includes(f.id)
                );
            } else {
                baseFaaliats = [];
            }
        } else {
            baseFaaliats = [];
        }

        // قانون IsMadove برای هیات علمی (اگر مدعو باشد)
        if (isMadove) {
            baseFaaliats = baseFaaliats.filter(f => f.isMadove === true);
        }

        const allowed = getAllowedFaaliats(dayCode, hourCode, baseFaaliats);
        setActivityForm(prev => ({ ...prev, allowedFaaliats: allowed }));
    };
    /*
        const updateAllowedFaaliats = (markazId, isVirtual) => {
            const numericMarkazId = markazId ? parseInt(markazId) : null;
            const { dayCode, hourCode } = activityModalData;
    
            console.log('🔍 updateAllowedFaaliats called with:', {
                numericMarkazId,
                isVirtual,
                dayCode,
                hourCode,
                permittedMarkazsLength: permittedMarkazs?.length,
                faaliatsLength: faaliats?.length
            });
    
            if (!faaliats || faaliats.length === 0 || !dayCode || !hourCode) {
                setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
                return;
            }
    
            const markaz = markazList?.find(m => m.id === numericMarkazId);
            if (!markaz) {
                console.log('❌ مرکز پیدا نشد:', numericMarkazId);
                setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
                return;
            }
    
            // پیدا کردن اطلاعات مرکز مجاز از لیست permittedMarkazs
            const permittedMarkaz = permittedMarkazs.find(p => p.markazId === numericMarkazId);
            console.log('📊 permittedMarkaz پیدا شد:', permittedMarkaz);
    
            // تشخیص نوع مرکز
            const isMainMarkaz = ostadInfo?.markazId === numericMarkazId;
            const isOutsideOstan = markaz.codeOstan !== ostadOstanCode;
    
            console.log('🏷️ نوع مرکز:', {
                isMainMarkaz,
                isOutsideOstan,
                markazLevel: markaz.level,
                markazCodeOstan: markaz.codeOstan,
                ostadOstanCode
            });
    
            // ============================================================
            // فیلتر اولیه بر اساس نوع انجام (حضوری/مجازی)
            // ============================================================
            let baseFaaliats = faaliats.filter(f => f.vazeeat === true);
    
            if (isVirtual) {
                baseFaaliats = baseFaaliats.filter(f => f.noeAnjam === 2 || f.noeAnjam === 3);
            } else {
                baseFaaliats = baseFaaliats.filter(f => f.noeAnjam === 1 || f.noeAnjam === 3);
            }
    
            console.log('📋 baseFaaliats بعد از فیلتر noeAnjam:', baseFaaliats.map(f => ({ id: f.id, name: f.name })));
    
            // ============================================================
            // قوانین اصلی
            // ============================================================
    
            // حالت ۱: مرکز اصلی استاد → فقط بر اساس نوع مرکز
            if (isMainMarkaz) {
                console.log('✅ مرکز اصلی استاد - بدون فیلتر اضافی');
            }
            // حالت ۲: مرکز خارج از استان → فقط بر اساس نوع مرکز
            else if (isOutsideOstan) {
                console.log('✅ مرکز خارج از استان - بدون فیلتر اضافی');
            }
            // حالت ۳: ستاد استان و مراکز همجوار داخل استان → بر اساس allowedFaaliatIds
            else if (permittedMarkaz) {
                console.log('✅ مرکز همجوار/ستاد استان - اعمال allowedFaaliatIds');
                console.log('📋 allowedFaaliatIds:', permittedMarkaz.allowedFaaliatIds);
    
                if (permittedMarkaz.allowedFaaliatIds && permittedMarkaz.allowedFaaliatIds.length > 0) {
                    const beforeFilter = baseFaaliats.length;
                    baseFaaliats = baseFaaliats.filter(f =>
                        permittedMarkaz.allowedFaaliatIds.includes(f.id)
                    );
                    console.log(`📊 از ${beforeFilter} فعالیت به ${baseFaaliats.length} فعالیت رسیدیم`);
                    console.log('📋 فعالیت‌های نهایی:', baseFaaliats.map(f => ({ id: f.id, name: f.name })));
                } else {
                    console.log('⚠️ allowedFaaliatIds خالی است');
                    baseFaaliats = [];
                }
            } else {
                console.log('⚠️ مرکز در permittedMarkazs پیدا نشد!');
                baseFaaliats = [];
            }
    
            // ============================================================
            // قانون IsMadove برای مدرس مدعو
            // ============================================================
            if (isMadove) {
                const beforeFilter = baseFaaliats.length;
                baseFaaliats = baseFaaliats.filter(f => f.isMadove === true);
                console.log(`📊 بعد از فیلتر IsMadove: از ${beforeFilter} به ${baseFaaliats.length}`);
            }
    
            // ============================================================
            // اعمال استثناها
            // ============================================================
            const allowed = getAllowedFaaliats(dayCode, hourCode, baseFaaliats);
            console.log('✅ فعالیت‌های نهایی مجاز:', allowed.map(f => ({ id: f.id, name: f.name })));
    
            setActivityForm(prev => ({ ...prev, allowedFaaliats: allowed }));
        };
        */
    const handleActivityModeChange = (mode) => {
        const dayCode = activityModalData.dayCode;
        const hourCode = activityModalData.hourCode;
        const dayMarkazId = schedule[dayCode]?.markazId;

        setActivityForm(prev => ({
            ...prev,
            mode,
            markazId: '',
            faaliatId: ''
        }));

        if (mode === 'hozoory') {
            setActivityForm(prev => ({
                ...prev,
                markazId: dayMarkazId || '',
                ostanId: user?.markazOstan || ''
            }));
            updateAllowedFaaliats(dayMarkazId, false, dayCode, hourCode);
        } else {
            // حالت مجازی
            if (virtualOstans.length === 0) {
                setActivityForm(prev => ({ ...prev, ostanId: '', markazId: '', allowedFaaliats: [] }));
                return;
            }

            const userMarkaz = markazList?.find(m => m.id === user?.markazId);
            const userOstan = userMarkaz?.codeOstan || '';
            const hasVirtualInUserOstan = virtualOstans.some(o => o.code === userOstan);
            const defaultOstan = hasVirtualInUserOstan ? userOstan : virtualOstans[0].code;

            let defaultMarkazId = '';
            const firstVirtual = markazList?.find(m =>
                m.codeOstan === defaultOstan &&
                m.vazeeyat &&
                (m.noeMarkaz === 2 || m.noeMarkaz === 3)
            );
            if (firstVirtual) defaultMarkazId = firstVirtual.id;

            setActivityForm(prev => ({
                ...prev,
                ostanId: defaultOstan,
                markazId: defaultMarkazId,
                allowedFaaliats: []
            }));

            if (defaultMarkazId) {
                updateAllowedFaaliats(defaultMarkazId, true, dayCode, hourCode);
            }
        }
    };

    const handleActivityMarkazChange = (markazId) => {
        const numericMarkazId = markazId ? parseInt(markazId) : null;

        setActivityForm(prev => ({ ...prev, markazId: numericMarkazId, faaliatId: '' }));

        if (numericMarkazId) {
            // 🔥 dayCode و hourCode از activityModalData گرفته می‌شوند
            updateAllowedFaaliats(numericMarkazId, true);
        } else {
            setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
        }
    };

    // ============================================================
    // 🔥 تابع نمایش نام مرکز بر اساس Level (برای جدول)
    // ============================================================
    const getMarkazDisplayName = (markazId) => {
        if (!markazId) return 'انتخاب مرکز';
        const markaz = markazList?.find(m => m.id === markazId);
        if (!markaz) return 'مرکز نامشخص';

        if (markaz.level === 2) {
            return 'سازمان مرکزی';
        }
        if (markaz.level === 3) {
            return `ستاد استان ${markaz.naamOstan || ''}`.trim() || 'ستاد استان';
        }
        return markaz.naamMarkaz || `مرکز ${markaz.id}`;
    };

    // ============================================================
    // حذف فعالیت از سلول
    // ============================================================
    const clearCell = async (dayCode, hourCode) => {
        const confirmed = await confirm({
            title: 'حذف فعالیت',
            message: 'آیا از حذف این فعالیت مطمئن هستید؟',
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        setSchedule(prev => ({
            ...prev,
            [dayCode]: {
                ...prev[dayCode],
                hours: {
                    ...prev[dayCode]?.hours,
                    [hourCode]: {
                        faaliatId: null,
                        markazId: null
                    }
                }
            }
        }));
    };

    // ============================================================
    // ذخیره برنامه
    // ============================================================
    const handleSubmit = async (isConfirm = false) => {
        if (!selectedTerm) {
            toast.warning('لطفاً ترم را انتخاب کنید');
            return;
        }

        const hasAnyActivity = Object.values(schedule).some(day =>
            Object.values(day.hours || {}).some(cell => cell?.faaliatId)
        );
        if (!hasAnyActivity) {
            toast.warning('حداقل یک فعالیت باید انتخاب شود');
            return;
        }

        setSubmitting(true);
        try {
            const details = [];
            Object.keys(schedule).forEach(dayCode => {
                const day = schedule[dayCode];
                if (!day) return;

                const hourData = {};
                Object.keys(day.hours || {}).forEach(hourCode => {
                    const cell = day.hours[hourCode];
                    hourData[hourCode] = cell?.faaliatId || null;
                    hourData[`markazId${hourCode}`] = cell?.markazId || null;
                });

                details.push({
                    roozeHafteh: dayCode,
                    markazId: day.markazId || null,
                    ...hourData
                });
            });

            const payload = {
                ostadId: ostadId,
                codeTerm: selectedTerm,
                details: details
            };
            const endpoint = isConfirm ? `/BarnamehHaftegi/confirm/ostad/${ostadId}` : '/BarnamehHaftegi/create';
            const response = await api.post(endpoint, payload);

            if (response.data?.success) {
                toast.success(isConfirm ? 'برنامه با موفقیت ثبت و تأیید شد' : 'پیش‌نویس با موفقیت ذخیره شد');
               /* await alert({
                    title: 'توجه',
                    message: `برنامه بصورت پیش نویس ذخیره گردید.
                            جهت تایید نهایی برنامه می‌بایست در صفحه بعد گزینه تایید برنامه را کلیک نموده
                            و در صفحه باز شده دکمه تایید را بزنید.
                            در غیر اینصورت برنامه در حالت پیشنویس باقی میماند.
                            `,
                    buttonText: 'باشه',
                    variant: 'success'
                });*/
                navigate('/dashboard/barnameh-haftegi-list');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره برنامه');
        } finally {
            setSubmitting(false);
        }
    };

    const isCellBlocked = (dayCode, hourCode) => {
        const termCode = selectedTerm;
        const ostanCode = ostadOstanCode;
        const noeHamkari = ostadInfo?.noeHamkari || 0;

        const matchedExceptions = haftegiExceptionsList.filter(e =>
            e.termCode === termCode &&
            (e.ostanCode === null || e.ostanCode === ostanCode) &&
            (e.dayCode === null || e.dayCode === dayCode) &&
            (e.hourCode === null || e.hourCode === hourCode)
        );

        if (matchedExceptions.length === 0) return false;

        // بررسی نوع همکاری (ماسک بیتی)
        const isNoeHamkariMatched = matchedExceptions.some(e =>
            (e.noeHamkariMask === null || e.noeHamkariMask === 0) ||
            (e.noeHamkariMask & (1 << (noeHamkari - 1))) !== 0
        );

        if (!isNoeHamkariMatched) return false;

        // اگر faaliatIds === null باشد، یعنی همه فعالیت‌ها ممنوع هستند → سلول کاملاً مسدود است
        const isAllBlocked = matchedExceptions.some(e => e.faaliatIds === null);
        return isAllBlocked;
    };

    // ============================================================
    // 🔥 تابع دریافت فعالیت‌های مجاز برای یک سلول خاص
    // ============================================================
    const getAllowedFaaliats = (dayCode, hourCode, baseFaaliats) => {
        const termCode = selectedTerm;
        const ostanCode = ostadOstanCode;
        const noeHamkari = ostadInfo?.noeHamkari || 0;

        // اگر dayCode یا hourCode وجود نداشته باشد، استثناها را اعمال نکن
        if (!dayCode || !hourCode) return baseFaaliats;

        const matchedExceptions = haftegiExceptionsList.filter(e =>
            e.termCode === termCode &&
            (e.ostanCode === null || e.ostanCode === ostanCode) &&
            (e.dayCode === null || e.dayCode === dayCode) &&
            (e.hourCode === null || e.hourCode === hourCode) &&
            (e.noeHamkariMask === null || e.noeHamkariMask === 0 || (e.noeHamkariMask & (1 << (noeHamkari - 1))) !== 0)
        );

        const blockedFaaliatIds = new Set();
        matchedExceptions.forEach(e => {
            if (e.faaliatIds !== null) {
                e.faaliatIds.forEach(id => blockedFaaliatIds.add(id));
            }
        });

        if (blockedFaaliatIds.size === 0) return baseFaaliats;
        return baseFaaliats.filter(f => !blockedFaaliatIds.has(f.id));
    };

    // ============================================================
    // رندر جدول
    // ============================================================
    const renderTable = () => {
        const activeDays = days.filter(d => d.isActive);
        const activeHours = hours.filter(h => h.hozoori || h.majazi);
        const availableMarkazs = getAvailableMarkazs();

        if (activeDays.length === 0 || activeHours.length === 0) {
            return (
                <div className="text-center text-muted py-5">
                    <i className="bi bi-info-circle fs-2 d-block mb-2"></i>
                    <p>هیچ روز یا ساعت فعالی برای برنامه‌ریزی وجود ندارد</p>
                </div>
            );
        }

        return (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table
                    className="table table-bordered table-sm text-center"
                    style={{
                        borderCollapse: 'collapse',  // ← برگشت به حالت پیش‌فرض
                        minWidth: '700px'
                    }}
                >
                    <thead className="table-light">
                        <tr>
                            <th
                                style={{
                                    position: 'sticky',
                                    left: 0,
                                    backgroundColor: '#f8f9fa',
                                    zIndex: 10,
                                    minWidth: '80px',
                                    boxShadow: 'inset -2px 0 0 #dee2e6'  // ← جایگزین border-right
                                }}
                            >
                                روز
                            </th>
                            <th style={{ minWidth: '80px', maxWidth: '100px' }}>مرکز فعالیت روز جاری</th>
                            {activeHours.map(hour => (
                                <th key={hour.codeSaat} style={{ minWidth: '100px' }}>
                                    {hour.codeSaat}
                                    <br />
                                    <PersianNumber>{hour.saatShoroo}</PersianNumber>-<PersianNumber>{hour.saatPayan}</PersianNumber>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activeDays.map(day => {
                            const dayData = schedule[day.code] || { markazId: null, hours: {} };

                            return (
                                <tr key={day.code} style={{ height: '70px' }}>
                                    <td
                                        style={{
                                            position: 'sticky',
                                            left: 0,
                                            backgroundColor: '#ffffff',
                                            zIndex: 5,
                                            fontWeight: 'bold',
                                            verticalAlign: 'middle',
                                            height: '60px',
                                            boxShadow: 'inset -2px 0 0 #dee2e6'  // ← جایگزین border-right
                                        }}
                                    >
                                        {getDayTitle(day.code)}
                                    </td>
                                    <td className="align-middle" style={{ height: '60px' }}>
                                        <div
                                            className="border rounded p-1 text-center"
                                            style={{ cursor: 'pointer', minHeight: '40px' }}
                                            onClick={() => openCenterModal(day.code, dayData.markazId)}
                                        >
                                            {dayData.markazId ? (
                                                <span>
                                                    {getMarkazDisplayName(dayData.markazId)}
                                                    {/*markazList?.find(m => m.id === dayData.markazId)?.naamMarkaz || ' '*/}
                                                </span>
                                            ) : (
                                                <span className="text-muted">انتخاب مرکز</span>
                                            )}
                                        </div>
                                    </td>
                                    {activeHours.map(hour => {
                                        const cell = dayData.hours?.[hour.codeSaat] || {};
                                        const activityId = cell.faaliatId ? parseInt(cell.faaliatId, 10) : null;
                                        const hasActivity = !!activityId;
                                        const faaliatName = getFaaliatName(activityId);
                                        const markazName = markazList?.find(m => m.id === cell.markazId)?.naamMarkaz || '';
                                        const color = getFaaliatColor(activityId);
                                        const isBlocked = isCellBlocked(day.code, hour.codeSaat, activityId);

                                        return (
                                            <td
                                                key={hour.codeSaat}
                                                //className={hasActivity ? 'bg-light' : ''}
                                                style={{
                                                    cursor: 'pointer',
                                                    minWidth: '100px',
                                                    height: '60px',
                                                    backgroundColor: isBlocked ? '#f8f9fa' : (hasActivity ? getFaaliatColor(activityId) : ''),
                                                    opacity: isBlocked ? 0.6 : 1,
                                                    verticalAlign: 'middle',
                                                    position: 'relative'
                                                }}
                                                onClick={() => {
                                                    if (isBlocked) {
                                                        toast.warning('امکان انتخاب فعالیت در این ساعت وجود ندارد');
                                                        return;
                                                    }
                                                    openActivityModal(day.code, hour.codeSaat, activityId, cell.markazId);
                                                }}                                            >
                                                {hasActivity ? (
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                                            {faaliatName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#000000' }}>
                                                            {markazName || '-'}
                                                        </div>
                                                        {!isBlocked && (
                                                            <button
                                                                className="btn btn-sm btn-outline-danger mt-1"
                                                                style={{ fontSize: '8px', padding: '1px 4px' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    clearCell(day.code, hour.codeSaat);
                                                                }}
                                                                title="حذف"
                                                            >
                                                                <i className="bi bi-x"></i>
                                                            </button>
                                                        )}

                                                    </div>
                                                ) : (
                                                    <>
                                                        {isBlocked ? (
                                                            <div className="text-muted">
                                                                <i className="bi bi-slash-circle" style={{ fontSize: '20px' }}></i>
                                                                <br />
                                                                <span style={{ fontSize: '10px' }}>ممنوع</span>
                                                            </div>
                                                        ) : (
                                                            <span>&nbsp;</span>
                                                        )}
                                                    </>
                                                )}
                                                {/* نشانگر ممنوعیت (آیکون قفل) */}
                                                {isBlocked && (
                                                    <div
                                                        style={{
                                                            position: 'absolute',
                                                            top: '2px',
                                                            right: '4px',
                                                            fontSize: '12px',
                                                            color: '#dc3545'
                                                        }}
                                                    >
                                                        <i className="bi bi-lock-fill"></i>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    // ============================================================
    // رندر اصلی
    // ============================================================
    if (markazLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div >
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate('/dashboard/barnameh-haftegi-list')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0 mx-2">ایجاد برنامه هفتگی</h4>
                    {selectedTerm && (
                        <small className="text-muted fs-6 me-2">
                            <PersianNumber>
                                {termList.find(t => t.codeTerm === selectedTerm)?.onvanTerm || selectedTerm}
                            </PersianNumber>
                        </small>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h6 className="mb-0">برنامه هفتگی</h6>
                    <small className="text-muted">
                        برای انتخاب فعالیت روی هر سلول کلیک کنید
                    </small>
                </div>
                <div className="card-body p-0">
                    {renderTable()}
                </div>
            </div>

            {/* ============================================================
                کارت نمایش وضعیت گروه‌های فعالیت
                ============================================================ */}
            {isElmiOstad && (
                <div className="card mt-4">
                    <div className="card-header bg-light">
                        <h6 className="mb-0">
                            <i className="bi bi-table me-2"></i>
                            وضعیت گروه‌های فعالیت
                            <span className="badge bg-secondary ms-2">
                                هیات علمی پیام نور
                            </span>
                        </h6>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-hover table-striped mb-0">
                                <thead>
                                    <tr>
                                        <th>گروه فعالیت</th>
                                        <th className="text-center">حداقل ساعت در هفته</th>
                                        <th className="text-center">حداکثر ساعت در هفته</th>
                                        <th className="text-center">حداقل روز در هفته</th>
                                        <th className="text-center">حداکثر روز در هفته</th>
                                        <th className="text-center">تعدادجلسات ثبت‌شده</th>
                                        <th className="text-center">تعدادساعت ثبت‌شده</th>
                                        <th className="text-center">وضعیت</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    // ============================================================
                                    // محاسبه تعداد روزهای منحصربه‌فرد برای هر گروه
                                    // ============================================================
                                    {faaliatGroupList.map(group => {
                                        let totalSessions = 0;
                                        const daysWithActivity = new Set(); // ← اضافه شد

                                        Object.values(schedule).forEach(day => {
                                            let dayHasActivity = false;
                                            Object.values(day.hours || {}).forEach(cell => {
                                                if (cell?.faaliatId) {
                                                    const faaliat = faaliats.find(f => f.id === cell.faaliatId);
                                                    if (faaliat?.faaliatGroupId === group.id) {
                                                        totalSessions++;
                                                        dayHasActivity = true;
                                                    }
                                                }
                                            });
                                            if (dayHasActivity) {
                                                daysWithActivity.add(day); // یا dayCode
                                            }
                                        });

                                        const totalHours = totalSessions * 2;
                                        const totalDays = daysWithActivity.size; // ← تعداد روزهای منحصربه‌فرد

                                        // تعیین وضعیت
                                        let statusColor = 'success';
                                        let statusText = '✅ مطابقت دارد';

                                        if (group.minSaatDarHafteh && totalHours < group.minSaatDarHafteh) {
                                            statusColor = 'warning';
                                            statusText = `⚠️ کمتر از ${group.minSaatDarHafteh} ساعت`;
                                        } else if (group.maxSaatDarHafteh && totalHours > group.maxSaatDarHafteh) {
                                            statusColor = 'danger';
                                            statusText = `❌ بیشتر از ${group.maxSaatDarHafteh} ساعت`;
                                        } else if (group.minDayDarHafteh && totalDays < group.minDayDarHafteh) {
                                            statusColor = 'warning';
                                            statusText = `⚠️ کمتر از ${group.minDayDarHafteh} روز`;
                                        } else if (group.maxDayDarHafteh && totalDays > group.maxDayDarHafteh) {
                                            statusColor = 'danger';
                                            statusText = `❌ بیشتر از ${group.maxDayDarHafteh} روز`;
                                        }

                                        return (
                                            <tr key={group.id}>
                                                <td className="fw-bold">{group.title}</td>
                                                <td className="text-center">
                                                    <PersianNumber>{group.minSaatDarHafteh ?? '-'}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{group.maxSaatDarHafteh ?? '-'}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{group.minDayDarHafteh ?? '-'}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <PersianNumber>{group.maxDayDarHafteh ?? '-'}</PersianNumber>
                                                </td>
                                                <td className="text-center fw-bold">
                                                    <PersianNumber>{totalSessions}</PersianNumber>
                                                </td>
                                                <td className="text-center fw-bold">
                                                    <PersianNumber>{totalHours}</PersianNumber>
                                                </td>
                                                <td className="text-center">
                                                    <span className={`badge bg-${statusColor}`}>
                                                        {statusText}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="d-flex gap-2 mt-4">
                <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting || !selectedTerm || stats.totalSessions === 0}
                >
                    {submitting ? 'در حال ذخیره...' : 'ذخیره پیش‌نویس'}
                </button>
                {
                    /*
                <button
                    className="btn btn-success"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting || !selectedTerm || !stats.isComplete}
                >
                    {submitting ? 'در حال ذخیره...' : 'ثبت و تأیید'}
                </button>
                    */
                }

                <button
                    className="btn btn-secondary"
                    onClick={() => navigate('/dashboard/barnameh-haftegi-list')}
                >
                    انصراف
                </button>
            </div>

            <CenterModal
                show={showCenterModal}
                onClose={() => setShowCenterModal(false)}
                onConfirm={handleCenterModalSave}
                dayCode={centerModalData.dayCode}
                dayTitle={getDayTitle(centerModalData.dayCode)}
                availableCenters={getAvailableMarkazs()}
                selectedMarkazId={centerModalData.selectedMarkazId}
                setSelectedMarkazId={(id) => setCenterModalData(prev => ({ ...prev, selectedMarkazId: id }))}
                ostadMarkazId={ostadMarkazId}
                allowedMarkazIds={allowedMarkazIds}
            />

            <ActivityModal
                show={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                onConfirm={handleActivityModalSave}
                dayCode={activityModalData.dayCode}
                hourCode={activityModalData.hourCode}
                dayTitle={getDayTitle(activityModalData.dayCode)}
                mode={activityForm.mode}
                onModeChange={handleActivityModeChange}
                markazId={activityForm.markazId}
                markazName={markazList?.find(m => m.id === parseInt(activityForm.markazId))?.naamMarkaz}
                ostanId={activityForm.ostanId}
                onOstanChange={(ostanId) => {
                    setActivityForm(prev => ({ ...prev, ostanId, markazId: '' }));
                    if (ostanId) {
                        const firstVirtual = markazList?.find(m =>
                            m.codeOstan === ostanId &&
                            m.vazeeyat &&
                            (m.noeMarkaz === 2 || m.noeMarkaz === 3)
                        );
                        if (firstVirtual) {
                            setActivityForm(prev => ({ ...prev, markazId: firstVirtual.id }));
                            updateAllowedFaaliats(firstVirtual.id, true);
                        } else {
                            setActivityForm(prev => ({ ...prev, markazId: '', allowedFaaliats: [] }));
                        }
                    } else {
                        setActivityForm(prev => ({ ...prev, markazId: '', allowedFaaliats: [] }));
                    }
                }}
                virtualOstans={virtualOstans}  // ← اضافه شد
                virtualMarkazs={markazList?.filter(m =>
                    m.codeOstan === activityForm.ostanId &&
                    m.vazeeyat &&
                    (m.noeMarkaz === 2 || m.noeMarkaz === 3)
                ) || []}
                onVirtualMarkazChange={(markazId) => {
                    setActivityForm(prev => ({ ...prev, markazId, faaliatId: '' }));
                    if (markazId) {
                        updateAllowedFaaliats(markazId, true);
                    } else {
                        setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
                    }
                }}
                faaliatId={activityForm.faaliatId}
                onFaaliatChange={(faaliatId) => setActivityForm(prev => ({ ...prev, faaliatId }))}
                allowedFaaliats={activityForm.allowedFaaliats}
            />

            <ConfirmModal />
        </div>
    );
}