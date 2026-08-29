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

export default function BarnamehHaftegiCreate() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { markazList, loading: markazLoading } = useMarkaz();
    const { termList, currentTermCode } = useTerm();
    const { days, hours, faaliats, getDayTitle, getFaaliatName, getFaaliatColor } = useLookup();
    const { confirm, ConfirmModal } = useConfirm();

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

    //دریافت اطلاعات استاد با UserId
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
        let daysWithActivity = new Set();

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

        return { totalSessions, totalDays, requiredSessions, isComplete };
    }, [schedule, requiredSessions]);

    // ============================================================
    // دریافت لیست مراکز قابل انتخاب (بر اساس قوانین)
    // ============================================================
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
            allowedFaaliats: []
        });

        updateAllowedFaaliats(dayMarkazId, false);
        setShowActivityModal(true);
    };

    const handleActivityModalSave = () => {
        const { dayCode, hourCode } = activityModalData;
        const { mode, markazId, faaliatId } = activityForm;

        if (!faaliatId) {
            toast.warning('لطفاً یک فعالیت انتخاب کنید');
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

    const handleActivityModeChange = (mode) => {
        const dayMarkazId = schedule[activityModalData.dayCode]?.markazId;

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
            updateAllowedFaaliats(dayMarkazId, false);
        } else {
            // حالت مجازی
            if (virtualOstans.length === 0) {
                setActivityForm(prev => ({ ...prev, ostanId: '', markazId: '', allowedFaaliats: [] }));
                return;
            }

            // 🔥 دریافت استان کاربر از markazId
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
                updateAllowedFaaliats(defaultMarkazId, true);
            }
        }
    };

    const handleActivityMarkazChange = (markazId) => {
        // تبدیل به عدد
        const numericMarkazId = markazId ? parseInt(markazId) : null;

        setActivityForm(prev => ({ ...prev, markazId: numericMarkazId, faaliatId: '' }));

        if (numericMarkazId) {
            const markaz = markazList?.find(m => m.id === numericMarkazId);
            if (markaz) {
                const allowed = faaliats.filter(f =>
                    f.vazeeat === true &&
                    (f.noeAnjam === 2 || f.noeAnjam === 3)
                );
                setActivityForm(prev => ({ ...prev, allowedFaaliats: allowed }));
            } else {
                setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
            }
        } else {
            setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
        }
    };

    const updateAllowedFaaliats = (markazId, isVirtual) => {

        const numericMarkazId = markazId ? parseInt(markazId) : null;
        if (!faaliats || faaliats.length === 0) {
            setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
            return;
        }
        const markaz = markazList?.find(m => m.id === numericMarkazId);
        if (!markaz) {
            setActivityForm(prev => ({ ...prev, allowedFaaliats: [] }));
            return;
        }

        let allowed = [];

        if (isVirtual) {
            allowed = faaliats.filter(f =>
                f.vazeeat === true &&
                (f.noeAnjam === 2 || f.noeAnjam === 3)
            );

        } else {
            let baseFaaliats = faaliats.filter(f =>
                f.vazeeat === true &&
                (f.noeAnjam === 1 || f.noeAnjam === 3)
            );
            const isMainMarkaz = ostadInfo?.markazId === markazId;
            if (!isMainMarkaz && isElmiOstad) {
                baseFaaliats = baseFaaliats.filter(f => allowedMarkazIds.includes(f.id));
            }

            if (isMadove) {
                baseFaaliats = baseFaaliats.filter(f => f.isMadove === true);
            }

            allowed = baseFaaliats;
        }
        setActivityForm(prev => ({ ...prev, allowedFaaliats: allowed }));
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

            const endpoint = isConfirm ? '/BarnamehHaftegi/confirm' : '/BarnamehHaftegi/create';
            const response = await api.post(endpoint, payload);

            if (response.data?.success) {
                toast.success(isConfirm ? 'برنامه با موفقیت ثبت و تأیید شد' : 'پیش‌نویس با موفقیت ذخیره شد');
                navigate('/dashboard/barnameh-haftegi-list');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ذخیره برنامه');
        } finally {
            setSubmitting(false);
        }
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
                                                    {markazList?.find(m => m.id === dayData.markazId)?.naamMarkaz || ' '}
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
                                        return (
                                            <td
                                                key={hour.codeSaat}
                                                //className={hasActivity ? 'bg-light' : ''}
                                                style={{
                                                    cursor: 'pointer',
                                                    minWidth: '100px',
                                                    height: '60px',
                                                    backgroundColor: hasActivity ? (color || '#e8f5e9') : '', verticalAlign: 'middle'

                                                }}
                                                onClick={() => openActivityModal(day.code, hour.codeSaat, activityId, cell.markazId)}
                                            >
                                                {hasActivity ? (
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>
                                                            {faaliatName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#000000' }}>
                                                            {markazName || '-'}
                                                        </div>
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
                                                    </div>
                                                ) : (
                                                    <span>&nbsp;</span>
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
                <div>
                    <button
                        className="btn btn-outline-secondary me-3"
                        onClick={() => navigate('/dashboard/barnameh-haftegi-list')}
                    >
                        <i className="bi bi-arrow-right me-1"></i>
                        بازگشت
                    </button>
                    <h4 className="d-inline-block mb-0 mx-2">ایجاد برنامه هفتگی</h4>
                </div>
            </div>

            <div className="card mb-2">
                <div className="card-body">
                    <div className="row align-items-end">
                        <div className="col-md-3">
                            <div className="form-control-plaintext fw-bold pt-2">
                                <PersianNumber>
                                    {termList.find(t => t.codeTerm === selectedTerm)?.onvanTerm || selectedTerm}
                                </PersianNumber>
                            </div>

                        </div>
                        <div className="col-md-4">
                            <div className="d-flex align-items-center h-100 pt-2">
                                <label className="form-label">وضعیت برنامه</label>

                                <span className={`badge ${stats.isComplete ? 'bg-success' : 'bg-warning text-dark'}`}>
                                    {stats.isComplete ? '✅ کامل' : '⚠️ ناقص'}
                                </span>
                                <span className="ms-3 text-muted small">
                                    {stats.totalSessions} از {stats.requiredSessions} جلسه پر شده
                                </span>
                                <span className="ms-3 text-muted small">
                                    {stats.totalDays} روز از ۵ روز حداقل
                                </span>
                            </div>
                        </div>
                        <div className="col-md-4 text-end">
                            <small className="text-muted d-block">
                                {isElmiOstad && !stats.isComplete && (
                                    <span className="text-warning">
                                        <i className="bi bi-info-circle me-1"></i>
                                        برای استفاده از مراکز دیگر، باید ۵ روز و {stats.requiredSessions} جلسه را پر کنید
                                    </span>
                                )}
                                {(isMadove || isHeyatElmiGheyrePayamNoor) && (
                                    <span className="text-info">
                                        <i className="bi bi-info-circle me-1"></i>
                                        شما محدودیت مرکز و روز ندارید
                                    </span>
                                )}
                            </small>
                        </div>
                    </div>
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

            <div className="d-flex gap-2 mt-4">
                <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit(false)}
                    disabled={submitting || !selectedTerm || stats.totalSessions === 0}
                >
                    {submitting ? 'در حال ذخیره...' : 'ذخیره پیش‌نویس'}
                </button>
                <button
                    className="btn btn-success"
                    onClick={() => handleSubmit(true)}
                    disabled={submitting || !selectedTerm || !stats.isComplete}
                >
                    {submitting ? 'در حال ذخیره...' : 'ثبت و تأیید'}
                </button>
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