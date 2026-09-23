// src/pages/Schedule/BarnamehHaftegi/BarnamehHaftegiDetail.jsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
//import { useReactToPrint } from 'react-to-print';
import { useAuth } from '../../../context/AuthContext';
import { useMarkaz } from '../../../context/MarkazContext';
import { useTerm } from '../../../context/TermContext';
import { useLookup } from '../../../context/LookupContext';
import { toast } from 'react-toastify';
import api from '../../../api/axiosConfig';
import PersianNumber from '../../../components/common/PersianNumber';
import { useConfirm } from '../../../hooks/useConfirm';
import SignatureDisplay from '../../../components/common/SignatureDisplay';
import PrintButton from '../../../components/common/PrintButton';
import PrintContent from './PrintContent';

export default function BarnamehHaftegiDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const { user, hasPermission } = useAuth();
    const { markazList } = useMarkaz();
    const { termList, getTermTitle } = useTerm();
    const { faaliats, getFaaliatName, getDayTitle, getFaaliatColor, hoursList } = useLookup();
    const { confirm, ConfirmModal } = useConfirm();
    //const printRef = useRef(null);

    const [program, setProgram] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [signatures, setSignatures] = useState({});

    // تشخیص نقش
    const isOstad = useMemo(() => user?.currentRoleName === 'استاد', [user]);
    const isModirGrooh = useMemo(() => hasPermission('BarnamehHaftegi.ConfirmByModirGrooh'), [hasPermission]);
    const isMoaven = useMemo(() => hasPermission('BarnamehHaftegi.ConfirmByMoaven'), [hasPermission]);
    const isRaeisMarkaz = useMemo(() => {
        return hasPermission('BarnamehHaftegi.ConfirmByRaeisMarkaz');
    }, [hasPermission]);
    const isAdmin = useMemo(() => user?.codeRole === 1, [user]);
    const [errorModal, setErrorModal] = useState({
        show: false,
        title: 'خطاها',
        errors: []
    });
    // دریافت برنامه
    const fetchProgram = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/BarnamehHaftegi/${id}`);
            if (response.data?.success) {
                setProgram(response.data.data);
            } else {
                setError('برنامه یافت نشد');
            }
        } catch (error) {
            console.error('خطا در دریافت برنامه:', error);
            toast.error('خطا در دریافت اطلاعات برنامه');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchProgram();
    }, [id, fetchProgram]);

    // پرینت

    // برگشت به لیست
    const handleBackToList = () => {
        navigate('/dashboard/barnameh-haftegi-list', {
            state: {
                fromDetail: true,
                page: location.state?.page || 1,
                pageSize: location.state?.pageSize || 20,
                filters: location.state?.filters || {},
                termCode: location.state?.termCode || ''
            }
        });
    };

    const showErrorModal = (errors) => {
        setErrorModal({
            show: true,
            title: 'خطاهای برنامه',
            errors: Array.isArray(errors) ? errors : [errors]
        });
    };
    const closeErrorModal = () => {
        setErrorModal({
            show: false,
            title: 'خطاها',
            errors: []
        });
    };

    // ============================================================
    // 🔥 حذف برنامه هفتگی
    // ============================================================
    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'حذف برنامه',
            message: 'آیا از حذف این برنامه هفتگی مطمئن هستید؟ این عملیات قابل بازگشت نیست.',
            confirmText: 'بله، حذف شود',
            confirmVariant: 'danger'
        });
        if (!confirmed) return;

        setDeleting(true);
        try {
            const response = await api.delete(`/BarnamehHaftegi/delete/${id}`);
            if (response.data?.success) {
                toast.success('برنامه هفتگی با موفقیت حذف شد');
                navigate('/dashboard/barnameh-haftegi-list');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'خطا در حذف برنامه';
            toast.error(message);
        } finally {
            setDeleting(false);
        }
    };

    // عملیات‌های تأیید
    const handleConfirmByOstad = async () => {
        const confirmed = await confirm({
            title: 'تأیید برنامه',
            message: 'آیا از تأیید نهایی این برنامه مطمئن هستید؟',
            confirmText: 'بله، تأیید می‌شود',
            confirmVariant: 'success'
        });
        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/ostad/${id}`);
            if (response.data?.success) {
                toast.success('برنامه با موفقیت تأیید شد');
                fetchProgram();
            }
        } catch (error) {
            const errors = error.response?.data?.errors;
            const message = error.response?.data?.message || 'خطا در تأیید برنامه';

            // اگر خطاها به صورت آرایه هستند
            if (Array.isArray(errors) && errors.length > 0) {
                showErrorModal(errors);
            }
            // اگر خطاها به صورت رشته هستند
            else if (typeof errors === 'string') {
                showErrorModal([errors]);
            }
            // اگر پیام خطا وجود دارد
            else if (message) {
                showErrorModal([message]);
            }
            // در غیر این صورت خطای عمومی
            else {
                toast.error('خطا در تأیید برنامه');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByModir = async (approveStatus) => {
        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';
        const confirmed = await confirm({
            title: `${actionText} برنامه`,
            message: `آیا از ${actionText} این برنامه مطمئن هستید؟`,
            confirmText: `بله، ${actionText} می‌شود`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/modir/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت ${actionText} شد`);
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `خطا در ${actionText} برنامه`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByMoaven = async (approveStatus) => {
        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';
        if (program?.nazarModirGrooh === 0) {
            const confirmed = await confirm({
                title: 'هشدار',
                message: 'مدیر گروه هنوز نظری ثبت نکرده است. ادامه می‌دهید؟',
                confirmText: 'بله، ادامه',
                confirmVariant: 'warning'
            });
            if (!confirmed) return;
        }
        if (program?.nazarModirGrooh === 2) {
            const confirmed = await confirm({
                title: 'هشدار',
                message: 'مدیر گروه این برنامه را رد کرده است. نادیده می‌گیرید؟',
                confirmText: 'بله، نادیده می‌گیرم',
                confirmVariant: 'warning'
            });
            if (!confirmed) return;
        }
        const confirmed = await confirm({
            title: `${actionText} نهایی برنامه`,
            message: `آیا از ${actionText} نهایی این برنامه مطمئن هستید؟`,
            confirmText: `بله، ${actionText} نهایی`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/moaven/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت ${actionText} نهایی شد`);
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || `خطا در ${actionText} نهایی برنامه`);
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmByRaeisMarkaz = async (approveStatus) => {
        const actionText = approveStatus === 1 ? 'تأیید' : 'رد';

        const confirmed = await confirm({
            title: `${actionText} توسط رئیس مرکز`,
            message: `آیا از ${actionText} این برنامه توسط رئیس مرکز مطمئن هستید؟`,
            confirmText: `بله، ${actionText} می‌شود`,
            confirmVariant: approveStatus === 1 ? 'success' : 'danger'
        });

        if (!confirmed) return;

        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/confirm/raeis/${id}`, { approveStatus });
            if (response.data?.success) {
                toast.success(`برنامه با موفقیت توسط رئیس مرکز ${actionText} شد`);
                fetchProgram();
            }
        } catch (error) {
            const errors = error.response?.data?.errors;
            const message = error.response?.data?.message || `خطا در ${actionText} برنامه`;

            if (errors && Array.isArray(errors) && errors.length > 0) {
                showErrorModal(errors);
            } else {
                toast.error(message);
            }
        } finally {
            setSubmitting(false);
        }
    };
    const handleReset = async () => {
        const confirmed = await confirm({
            title: 'ریست برنامه',
            message: 'آیا از بازگشت این برنامه به حالت پیش‌نویس مطمئن هستید؟',
            confirmText: 'بله، ریست می‌شود',
            confirmVariant: 'warning'
        });
        if (!confirmed) return;
        setSubmitting(true);
        try {
            const response = await api.patch(`/BarnamehHaftegi/reset/${id}`);
            if (response.data?.success) {
                toast.success('برنامه با موفقیت به حالت پیش‌نویس بازگشت');
                fetchProgram();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'خطا در ریست برنامه');
        } finally {
            setSubmitting(false);
        }
    };

    // تابع دریافت امضاها
    const fetchSignatures = useCallback(async () => {
        if (!program) return;

        // جمع‌آوری UserIdهای مربوط به هر نقش
        const userIds = [];

        // استاد (UserId از برنامه)
        if (program.ostadUserId) {
            userIds.push(program.ostadUserId);
        }

        // مدیر گروه
        if (program.userIdModirGrooh) {
            userIds.push(program.userIdModirGrooh);
        }

        // رئیس مرکز
        if (program.userIdRaeisMarkaz) {
            userIds.push(program.userIdRaeisMarkaz);
        }

        // معاون
        if (program.userIdMoaven) {
            userIds.push(program.userIdMoaven);
        }

        // اگر هیچ UserId وجود نداشت، برگرد
        if (userIds.length === 0) return;

        try {
            const response = await api.post('/Signature/get-multiple', { userIds });
            if (response.data?.success) {
                setSignatures(response.data.data || {});
            }
        } catch (error) {
            console.error('خطا در دریافت امضاها:', error);
        }
    }, [program]);

    // بعد از دریافت برنامه، امضاها را بگیر
    useEffect(() => {
        if (program) {
            fetchSignatures();
        }
    }, [program, fetchSignatures]);


    // نمایش دکمه‌های عملیاتی
    const renderActionButtons = () => {
        if (!program) return null;

        // نظرات هر نقش (عدد: 0=بدون نظر, 1=تایید, 2=رد)
        const nazarOstad = program.nazarElmi;        // نظر استاد
        const nazarModir = program.nazarModirGrooh;   // نظر مدیر گروه
        const nazarRaeis = program.nazarRaeisMarkaz;  // نظر رئیس مرکز
        const nazarMoaven = program.nazarMoaven;      // نظر معاون

        const isLocked = program.isLocked;

        // تشخیص اینکه برنامه در چه مرحله‌ای است
        const isOstadApproved = nazarOstad === 1;
        const isModirApproved = nazarModir === 1;
        const isRaeisApproved = nazarRaeis === 1;
        const isMoavenApproved = nazarMoaven === 1;

        // اگر معاون تایید کرده، برنامه نهایی شده است
        const isFinalApproved = isMoavenApproved;

        return (
            <div className="d-flex gap-2 flex-wrap no-print">

                {/* ============================================================
                ۱️⃣ استاد - فقط اگر هنوز تایید نکرده و قفل نیست
                ============================================================ */}
                {isOstad && !isOstadApproved && !isLocked && (
                    <>
                        <button className="btn btn-warning btn-sm" onClick={() => navigate(`/dashboard/barnameh-haftegi-edit/${id}`)}>
                            <i className="bi bi-pencil me-1"></i> ویرایش
                        </button>

                        <button className="btn btn-success btn-sm" onClick={handleConfirmByOstad} disabled={submitting || !program.isComplete}>
                            {submitting ? 'در حال...' : 'تأیید'}
                        </button>
                        {/* 🔥 دکمه حذف */}
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={handleDelete}
                            disabled={deleting || submitting}
                            title="حذف برنامه"
                        >
                            {deleting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                    در حال حذف...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-trash me-1"></i> حذف
                                </>
                            )}
                        </button>
                    </>
                )}

                {/* ============================================================
                ۲️⃣ مدیر گروه - فقط اگر استاد تایید کرده و خودش هنوز نظر نداده
                ============================================================ */}
                {isModirGrooh && isOstadApproved && !isFinalApproved && (
                    <>
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmByModir(1)} disabled={submitting}>
                            <i className="bi bi-check-lg me-1"></i> تأیید
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleConfirmByModir(2)} disabled={submitting}>
                            <i className="bi bi-x-lg me-1"></i> رد
                        </button>
                    </>
                )}

                {/* ============================================================
                ۳️⃣ رئیس مرکز - فقط اگر استاد تایید کرده و خودش هنوز نظر نداده
                ============================================================ */}
                {isRaeisMarkaz && isOstadApproved && !isFinalApproved && (
                    <>
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmByRaeisMarkaz(1)} disabled={submitting}>
                            <i className="bi bi-check-lg me-1"></i> تأیید
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleConfirmByRaeisMarkaz(2)} disabled={submitting}>
                            <i className="bi bi-x-lg me-1"></i> رد
                        </button>
                    </>
                )}

                {/* ============================================================
                ۴️⃣ معاون - فقط اگر استاد تایید کرده و خودش هنوز نظر نداده
                ============================================================ */}
                {isMoaven && isOstadApproved && !isMoavenApproved && (
                    <>
                        <button className="btn btn-success btn-sm" onClick={() => handleConfirmByMoaven(1)} disabled={submitting}>
                            <i className="bi bi-check-lg me-1"></i> تأیید نهایی
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleConfirmByMoaven(2)} disabled={submitting}>
                            <i className="bi bi-x-lg me-1"></i> رد نهایی
                        </button>
                    </>
                )}

                {/* ============================================================
                ۵️⃣ ریست - فقط معاون یا ادمین (وقتی برنامه قفل است)
                ============================================================ */}
                {(isMoaven || isAdmin) && isLocked && (
                    <button className="btn btn-warning btn-sm" onClick={handleReset} disabled={submitting}>
                        <i className="bi bi-arrow-counterclockwise me-1"></i> ریست
                    </button>
                )}

                {/* ============================================================
                ۶️⃣ پرینت - برای همه
                ============================================================ */}
                {
                    <PrintButton
                        Component={PrintContent}
                        data={{
                            program,
                            days: hoursList, // یا days اگر در LookupContext دارید
                            hours: hoursList,
                            getDayTitle,
                            getFaaliatName,
                            getMarkazDisplayName,
                            markazList,
                            getTermTitle,
                            signatures
                        }}
                        title={`برنامه هفتگی - ${program?.ostadName || ''}`}
                        orientation="landscape"
                        paperSize="A4"
                        className="btn btn-outline-primary btn-sm"
                    >
                        🖨️ پرینت
                    </PrintButton>
                }
            </div>
        );
    };

    // وضعیت برنامه (Badge)
    const getStatusBadge = (status) => {
        const map = {
            'pishnevis': { label: 'پیش‌نویس', className: 'bg-secondary' },
            'tayeed_ostad': { label: 'تایید استاد', className: 'bg-info' },
            'tayeed_raeis': { label: 'تایید رییس مرکز', className: 'bg-primary' },
            'tayeed_modir': { label: 'تایید مدیر گروه', className: 'bg-primary' },
            'tayeed_moaven': { label: 'تایید معاون', className: 'bg-success' },
        };
        const info = map[status] || map['pishnevis'];
        return <span className={`badge ${info.className}`}>{info.label}</span>;
    };

    const getMarkazName = (markazId) => {
        if (!markazId) return ' ';
        const markaz = markazList?.find(m => m.id === markazId);
        return markaz?.naamMarkaz || `مرکز ${markazId}`;
    };

    const getNoeHamkariText = (noe) => {
        const map = { 1: 'هیات علمی پیام نور', 2: 'هیات علمی غیر پیام نور', 3: 'مدرس مدعو', 4: 'هیات علمی پیام نور (سایر استان‌ها)' };
        return map[noe] || '-';
    };

    const getMaghtaText = (maghta) => {
        const map = { 5: 'کارشناسی', 10: 'کارشناسی ارشد', 15: 'دکتری' };
        return map[maghta] || maghta || '-';
    };
    // ============================================================
    // 🔥 تابع نمایش نام مرکز بر اساس Level
    // ============================================================
    const getMarkazDisplayName = (markazId) => {
        if (!markazId) return '-';
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
    // جدول جدید: مینیمال و شفاف
    // ============================================================
    const renderWeekTable = () => {
        if (!program?.details) return null;

        const activeHours = hoursList.filter(h => h.hozoori || h.majazi);
        const grouped = {};
        program.details.forEach(item => {
            const day = item.roozeHafteh;
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(item);
        });
        const sortedDays = Object.keys(grouped).sort((a, b) => parseInt(a) - parseInt(b));

        return (
            <div className="card-body p-0">
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table
                        className="table table-bordered table-sm text-center"
                        style={{
                            borderCollapse: 'collapse',
                            minWidth: '700px',
                            marginBottom: 0
                        }}
                    >
                        <thead className="table-light">
                            <tr>
                                <th style={{ position: 'sticky', left: 0, backgroundColor: '#f8f9fa', zIndex: 10, minWidth: '80px', boxShadow: 'inset -2px 0 0 #dee2e6' }}>روز</th>
                                <th style={{ minWidth: '80px', maxWidth: '100px' }}>مرکز اصلی روز</th>
                                {activeHours.map(hour => (
                                    <th key={hour.codeSaat} style={{ minWidth: '100px', padding: '4px 2px' }}>
                                        <div>{hour.codeSaat}</div>
                                        <div style={{ fontSize: '10px', fontWeight: 'normal', color: '#666' }}>
                                            <PersianNumber>{hour.saatShoroo}</PersianNumber>-
                                            <PersianNumber>{hour.saatPayan}</PersianNumber>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedDays.map(dayCode => {
                                const items = grouped[dayCode];
                                const firstItem = items[0];
                                const dayMarkazName = getMarkazName(firstItem?.markazId); // ✅ حرف کوچک

                                const hourMap = {};
                                items.forEach(item => {
                                    activeHours.forEach(hour => {
                                        const h = hour.codeSaat;
                                        const activityId = item[h.toLowerCase()];
                                        const markazId = item[`markazId${h}`]; // ✅ حرف کوچک
                                        if (activityId) {
                                            hourMap[h] = {
                                                activityId: parseInt(activityId, 10),
                                                markazId: markazId ? parseInt(markazId, 10) : null
                                            };
                                        }
                                    });
                                });

                                return (
                                    <tr key={dayCode} style={{ height: '70px' }}>
                                        <td style={{ position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 5, fontWeight: 'bold', verticalAlign: 'middle', height: '60px', boxShadow: 'inset -2px 0 0 #dee2e6' }}>
                                            {getDayTitle(dayCode)}
                                        </td>
                                        <td className="align-middle" style={{ height: '60px' }}>
                                            {getMarkazDisplayName(firstItem?.markazId) || '-'}                                        </td>
                                        {activeHours.map(hour => {
                                            const cell = hourMap[hour.codeSaat];
                                            const activityId = cell?.activityId || null;
                                            const hasActivity = !!activityId;
                                            const markazName = getMarkazDisplayName(cell?.markazId); // ✅ حرف کوچک
                                            const color = getFaaliatColor(activityId);

                                            return (
                                                <td key={hour.codeSaat} style={{ minWidth: '100px', height: '60px', backgroundColor: hasActivity ? (color || '#e8f5e9') : '', verticalAlign: 'middle', position: 'relative' }}>
                                                    {hasActivity ? (
                                                        <div>
                                                            <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{getFaaliatName(activityId)}</div>
                                                            <div style={{ fontSize: '11px', color: '#000000' }}>{markazName || '-'}</div>
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
            </div>
        );
    };
    // ============================================================
    // خلاصه وضعیت (فقط صفحه، نه پرینت)
    // ============================================================
    const renderApprovalSummary = () => {
        if (!program) return null;
        return (
            <div className="card mt-3 no-print">
                <div className="card-body d-flex flex-wrap gap-3 align-items-center" style={{ padding: '8px 16px' }}>
                    <span className="fw-bold">وضعیت:</span>
                    {getStatusBadge(program.approveStatus)}
                    <span className="text-muted">{program.totalSessions || 0} جلسه از {program.requiredSessions || 0}</span>
                    {program.isComplete ? <span className="badge bg-success">✅ کامل</span> : <span className="badge bg-warning text-dark">⚠️ ناقص</span>}
                    {program.isLocked && <span className="badge bg-danger">🔒 قفل</span>}
                    <span className="text-muted small">استاد: {program.nazarElmi === 1 ? '✅' : program.nazarElmi === 2 ? '❌' : '⏳'}</span>
                    <span className="text-muted small">رییس مرکز: {(program.nazarRaeisMarkaz === 1 &&
                        program.nazarModirGrooh === 0) ? '✅' : program.nazarRaeisMarkaz === 2 ? '❌' : '⏳'}</span>
                    <span className="text-muted small">مدیرگروه: {program.nazarModirGrooh === 1 ? '✅' : program.nazarModirGrooh === 2 ? '❌' : '⏳'}</span>
                    <span className="text-muted small">معاون: {program.nazarMoaven === 1 ? '✅' : program.nazarMoaven === 2 ? '❌' : '⏳'}</span>
                </div>
            </div>
        );
    };


    // ============================================================
    // 2️⃣ کارت‌های امضا
    // ============================================================
    const renderSignatures = () => {
        if (!program) return null;

        const hasOstad = program.nazarElmi === 1;
        const hasModir = program.nazarModirGrooh === 1;
        const hasRaeis = program.nazarRaeisMarkaz === 1;
        const hasMoaven = program.nazarMoaven === 1;

        // دریافت امضای هر کاربر
        const ostadSignature = signatures[program.ostadUserId]?.signature || null;
        const modirSignature = signatures[program.userIdModirGrooh]?.signature || null;
        const raeisSignature = signatures[program.userIdRaeisMarkaz]?.signature || null;
        const moavenSignature = signatures[program.userIdMoaven]?.signature || null;

        // موقعیت امضاها
        const ostadPosition = signatures[program.ostadUserId]?.position || 'BC';
        const modirPosition = signatures[program.userIdModirGrooh]?.position || 'BC';
        const raeisPosition = signatures[program.userIdRaeisMarkaz]?.position || 'BC';
        const moavenPosition = signatures[program.userIdMoaven]?.position || 'BC';

        const sigStyle = {
            minHeight: '70px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        };

        return (
            <div className="row mt-3">
                {/* 1️⃣ امضا استاد */}
                <div className="col-3">
                    <div className="card h-100 border-0">
                        <div className="card-header py-1 bg-light text-center">
                            <small className="fw-bold">امضا استاد</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasOstad && ostadSignature ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={ostadSignature}
                                        textTop={program.ostadName}
                                        textBottom={`کد: ${program.ostadCode || ''}`}
                                        position={ostadPosition}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {program.tarikhElmi ? new Date(program.tarikhElmi).toLocaleDateString('fa-IR') : ''}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>
                                    {hasOstad ? 'امضا موجود نیست' : 'ثبت نشده'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2️⃣ امضا مدیر گروه */}
                <div className="col-3">
                    <div className="card h-100 border-0">
                        <div className="card-header py-1 bg-light text-center">
                            <small className="fw-bold">امضا مدیر گروه</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasModir && modirSignature ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={modirSignature}
                                        textTop="مدیر گروه"
                                        textBottom={program.roleMarkazModirGrooh || ''}
                                        position={modirPosition}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {program.tarikhModirGrooh ? new Date(program.tarikhModirGrooh).toLocaleDateString('fa-IR') : ''}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>
                                    {hasModir ? 'امضا موجود نیست' : 'ثبت نشده'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3️⃣ امضا رئیس مرکز */}
                <div className="col-3">
                    <div className="card h-100 border-0">
                        <div className="card-header py-1 bg-light text-center">
                            <small className="fw-bold">امضا رئیس مرکز</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasRaeis && raeisSignature ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={raeisSignature}
                                        textTop="رئیس مرکز"
                                        textBottom={program.roleMarkazRaeisMarkaz || ''}
                                        position={raeisPosition}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {program.tarikhRaeisMarkaz ? new Date(program.tarikhRaeisMarkaz).toLocaleDateString('fa-IR') : ''}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>
                                    {hasRaeis ? 'امضا موجود نیست' : 'ثبت نشده'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4️⃣ امضا معاون آموزشی */}
                <div className="col-3">
                    <div className="card h-100 border-0">
                        <div className="card-header py-1 bg-light text-center">
                            <small className="fw-bold">امضا معاون آموزشی</small>
                        </div>
                        <div className="card-body" style={sigStyle}>
                            {hasMoaven && moavenSignature ? (
                                <>
                                    <SignatureDisplay
                                        signatureData={moavenSignature}
                                        textTop="معاون آموزشی"
                                        textBottom={program.roleMarkazMoaven || ''}
                                        position={moavenPosition}
                                        width={180}
                                        height={60}
                                        textFontSize={10}
                                    />
                                    <small className="text-muted" style={{ fontSize: '8px' }}>
                                        {program.tarikhMoaven ? new Date(program.tarikhMoaven).toLocaleDateString('fa-IR') : ''}
                                    </small>
                                </>
                            ) : (
                                <span className="text-muted" style={{ fontSize: '10px' }}>
                                    {hasMoaven ? 'امضا موجود نیست' : 'ثبت نشده'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    // ============================================================
    // رندر اصلی
    // ============================================================
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">در حال بارگذاری...</span>
                </div>
            </div>
        );
    }

    if (error || !program) {
        return (
            <div className="container-fluid">
                <div className="alert alert-danger text-center mt-5">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {error || 'برنامه یافت نشد'}
                </div>
                <button className="btn btn-secondary" onClick={handleBackToList}>
                    <i className="bi bi-arrow-right me-1"></i> بازگشت به لیست
                </button>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* هدر + دکمه‌ها */}
            <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                <div>
                    <button className="btn btn-outline-secondary btn-sm me-2" onClick={handleBackToList}>
                        <i className="bi bi-arrow-right me-1"></i> بازگشت
                    </button>
                    <h5 className="d-inline-block mb-0 mx-4">برنامه حضور هفتگی استاد  {program.ostadName} {program.ostadLastName}</h5>
                </div>
                {renderActionButtons()}
            </div>

            {/* محتوای قابل چاپ */}
            <div className="print-area">


                {/* ============================================================
                    کارت اطلاعات استاد - سه ردیف، سه ستون
                    ============================================================ */}
                <div className="card mb-3">
                    <div className="card-body" style={{ padding: '12px 20px' }}>
                        {/* ردیف اول: نام، نام خانوادگی، کد استادی */}
                        <div className="row g-2">
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>نام:</small>
                                <span style={{ fontSize: '15px' }}>{program.ostadName || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>نام خانوادگی:</small>
                                <span style={{ fontSize: '15px' }}>{program.ostadLastName || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>کد استادی:</small>
                                <span style={{ fontSize: '15px' }}><PersianNumber>{program.ostadCode}</PersianNumber></span>
                            </div>
                        </div>

                        {/* ردیف دوم: رشته، مرتبه علمی/مقطع، نوع همکاری */}
                        <div className="row g-2 mt-2">
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>رشته تحصیلی:</small>
                                <span style={{ fontSize: '15px' }}>{program.reshteh || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                    {program.noeHamkari === 1 || program.noeHamkari === 2 || program.noeHamkari === 4
                                        ? 'مرتبه علمی:' : 'مقطع تحصیلی:'}
                                </small>
                                <span style={{ fontSize: '15px' }}>
                                    {program.noeHamkari === 1 || program.noeHamkari === 2 || program.noeHamkari === 4
                                        ? (program.martabehElmi || '-')
                                        : (program.maghta ? getMaghtaText(program.maghta) : '-')}
                                </span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>نوع همکاری:</small>
                                <span style={{ fontSize: '15px' }}>{getNoeHamkariText(program.noeHamkari)}</span>
                            </div>
                        </div>

                        {/* ردیف سوم: مرکز، سمت اجرایی، شماره تماس */}
                        <div className="row g-2 mt-2">
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>مرکز:</small>
                                <span style={{ fontSize: '15px' }}>{program.ostadMarkaz.markazNaam || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>سمت اجرایی:</small>
                                <span style={{ fontSize: '15px' }}>{program.postEjraei || '-'}</span>
                            </div>
                            <div className="col-md-4 d-flex align-items-baseline gap-2">
                                <small className="text-muted" style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>شماره تماس:</small>
                                <span style={{ fontSize: '15px' }}>
                                    {user ? <PersianNumber>{program.mobile || '-'}</PersianNumber> : '-'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* جدول برنامه - مینیمال */}
                {/* 
                    <div className="card mb-2">
                        <div className="card-body p-0">
                            {renderWeekTable()}
                        </div>
                    </div>
                */}
                {renderWeekTable()}

                {/* خلاصه وضعیت (فقط صفحه) */}
                {renderApprovalSummary()}

                {/* کارت‌های امضا */}
                {renderSignatures()}


            </div>

            <ConfirmModal />

            {errorModal.show && (
                <div
                    className="modal show d-block"
                    style={{
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1060,
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={closeErrorModal}
                >
                    <div
                        className="modal-dialog modal-dialog-centered"
                        style={{ maxWidth: '500px', width: '95%' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-content">
                            <div className="modal-header bg-danger text-white">
                                <h5 className="modal-title">
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    {errorModal.title || 'خطاها'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={closeErrorModal}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="text-muted mb-2">لطفاً خطاهای زیر را برطرف کنید:</p>
                                <ul className="list-group">
                                    {errorModal.errors.map((err, index) => (
                                        <li key={index} className="list-group-item list-group-item-danger">
                                            <i className="bi bi-x-circle-fill me-2 text-danger"></i>
                                            {err}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeErrorModal}
                                >
                                    بستن
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}